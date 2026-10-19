import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { env } from './env';

// Batas waktu tiap panggilan ke Supabase. Tanpa ini koneksi yang macet ditunggu
// selamanya dan request baru putus oleh timeout nginx (30 dtk).
const SUPABASE_TIMEOUT_MS = 10_000;

/**
 * Dilempar bila antrean ke Supabase penuh / menunggu terlalu lama. Lewat
 * supabase-js error ini sampai sebagai error transport (tanpa `code`), yang
 * dipetakan errorHandler menjadi 503.
 */
class SupabaseSibukError extends Error {
  override name = 'SupabaseSibukError';
}

// Pembatas panggilan serentak ke Supabase per instance. Tanpa ini, saat beban
// melebihi kapasitas DB semua request diteruskan sekaligus, antrean di DB
// menumpuk, dan seluruh request ikut timeout (bahkan project Supabase bisa
// tumbang). Dengan pembatas, kelebihan beban ditolak cepat (503) dan sisanya
// tetap terlayani.
let aktif = 0;
const antrean: (() => void)[] = [];

function ambilSlot(): Promise<void> {
  if (aktif < env.SUPABASE_MAX_SERENTAK) {
    aktif++;
    return Promise.resolve();
  }
  if (antrean.length >= env.SUPABASE_MAX_ANTRE) {
    return Promise.reject(new SupabaseSibukError('Antrean ke Supabase penuh'));
  }
  return new Promise((resolve, reject) => {
    const giliran = () => {
      clearTimeout(batas);
      aktif++;
      resolve();
    };
    const batas = setTimeout(() => {
      const i = antrean.indexOf(giliran);
      if (i >= 0) antrean.splice(i, 1);
      reject(new SupabaseSibukError('Terlalu lama menunggu giliran ke Supabase'));
    }, env.SUPABASE_MAX_TUNGGU_MS);
    antrean.push(giliran);
  });
}

function lepasSlot() {
  aktif--;
  antrean.shift()?.();
}

const fetchTerbatas: typeof fetch = async (input, init) => {
  await ambilSlot();
  try {
    const timeout = AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    return await fetch(input, { ...init, signal });
  } finally {
    lepasSlot();
  }
};

// Client service_role: mem-bypass RLS. Otorisasi WAJIB dilakukan di middleware/controller.
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchTerbatas },
  // Retry bawaan postgrest-js (GET, s.d. 3x) memperparah DB yang sedang kewalahan:
  // timeout 10 dtk di atas tidak dikenali sebagai abort sehingga ikut diulang.
  // Lebih baik gagal cepat (503) dan biarkan klien yang mencoba lagi.
  db: { retry: false },
});
