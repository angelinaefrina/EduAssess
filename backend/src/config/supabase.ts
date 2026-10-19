import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { env } from './env';

// Batas waktu tiap panggilan ke Supabase. Tanpa ini koneksi yang macet ditunggu
// selamanya dan request baru putus oleh timeout nginx (30 dtk).
const SUPABASE_TIMEOUT_MS = 10_000;

const fetchDenganTimeout: typeof fetch = (input, init) => {
  const timeout = AbortSignal.timeout(SUPABASE_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

// Client service_role: mem-bypass RLS. Otorisasi WAJIB dilakukan di middleware/controller.
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: fetchDenganTimeout },
});
