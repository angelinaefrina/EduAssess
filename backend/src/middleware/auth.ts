import type { Request, RequestHandler } from 'express';
import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { AuthUser } from '../types/express';
import { AppError, throwIfSupabaseError } from './errorHandler';

/** Ambil req.user di handler yang dipasang setelah `auth`. */
export function userOf(req: Request): AuthUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

// Cache profil per user id. Peran & sekolah jarang berubah, sedangkan setiap
// request terautentikasi butuh keduanya. Perubahan lewat ProfilModel.update
// langsung menghapus entri (lupakanProfil); instance backend lain di belakang
// load balancer baru melihatnya setelah TTL habis.
const PROFIL_TTL_MS = 30_000;
const PROFIL_CACHE_MAKS = 10_000;
const profilCache = new Map<string, { kedaluwarsa: number; profil: Promise<AuthUser | null> }>();

export function lupakanProfil(id: string): void {
  profilCache.delete(id);
}

async function queryProfil(id: string): Promise<AuthUser | null> {
  const { data, error } = await supabase.from('profil').select('id, peran, sekolah_id').eq('id', id).maybeSingle();
  throwIfSupabaseError(error);
  return data && { id: data.id, peran: data.peran, sekolah_id: data.sekolah_id };
}

function ambilProfil(id: string): Promise<AuthUser | null> {
  const now = Date.now();
  const entri = profilCache.get(id);
  if (entri && entri.kedaluwarsa > now) return entri.profil;

  if (profilCache.size >= PROFIL_CACHE_MAKS) {
    for (const [key, e] of profilCache) if (e.kedaluwarsa <= now) profilCache.delete(key);
    if (profilCache.size >= PROFIL_CACHE_MAKS) profilCache.clear();
  }

  // Promise ikut disimpan agar request serentak untuk user yang sama cukup satu query.
  const profil = queryProfil(id);
  profilCache.set(id, { kedaluwarsa: now + PROFIL_TTL_MS, profil });
  // Hasil gagal / profil belum ada tidak di-cache.
  profil.then(
    (p) => p || lupakanProfil(id),
    () => lupakanProfil(id),
  );
  return profil;
}

/** 401 hanya bila token memang tidak sah; Supabase Auth yang down/lambat -> 503. */
function errorVerifikasi(error: AuthError): AppError {
  const status = error.status ?? 0;
  const authBermasalah =
    isAuthRetryableFetchError(error) || status === 429 || status >= 500 || error.name === 'AuthUnknownError';
  return authBermasalah
    ? AppError.serviceUnavailable('Layanan autentikasi sedang tidak tersedia, coba lagi', 'AUTH_UNAVAILABLE')
    : AppError.unauthorized('Token tidak valid atau kedaluwarsa');
}

/**
 * Verifikasi `Authorization: Bearer <access_token>` Supabase, lalu ambil peran
 * dari tabel `profil` (BUKAN dari metadata JWT, yang bisa dipalsukan klien).
 *
 * Token diverifikasi lokal dengan getClaims(): tanda tangan asimetris (ES256/RS256)
 * dicek terhadap JWKS yang di-cache supabase-js, jadi tidak ada round-trip ke
 * Supabase Auth per request. Konsekuensinya, token dari sesi yang sudah logout
 * tetap diterima sampai `exp`. Untuk token HS256 supabase-js otomatis kembali ke getUser().
 */
export const auth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw AppError.unauthorized('Header Authorization Bearer tidak ada');
  }

  const { data, error } = await supabase.auth.getClaims(match[1]);
  if (error) throw errorVerifikasi(error);
  const userId = data?.claims.sub;
  if (!userId) {
    throw AppError.unauthorized('Token tidak valid atau kedaluwarsa');
  }

  const profil = await ambilProfil(userId);
  if (!profil) {
    throw AppError.forbidden('Profil pengguna tidak ditemukan', 'PROFIL_NOT_FOUND');
  }

  req.user = profil;
  next();
};
