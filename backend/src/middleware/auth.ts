import type { Request, RequestHandler } from 'express';
import { supabase } from '../config/supabase';
import type { AuthUser } from '../types/express';
import { AppError, throwIfSupabaseError } from './errorHandler';

/** Ambil req.user di handler yang dipasang setelah `auth`. */
export function userOf(req: Request): AuthUser {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

/**
 * Verifikasi `Authorization: Bearer <access_token>` Supabase, lalu ambil peran
 * dari tabel `profil` (BUKAN dari metadata JWT, yang bisa dipalsukan klien).
 */
export const auth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw AppError.unauthorized('Header Authorization Bearer tidak ada');
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(match[1]);
  if (userError || !userData.user) {
    throw AppError.unauthorized('Token tidak valid atau kedaluwarsa');
  }

  const { data: profil, error } = await supabase
    .from('profil')
    .select('id, peran, sekolah_id')
    .eq('id', userData.user.id)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (!profil) {
    throw AppError.forbidden('Profil pengguna tidak ditemukan', 'PROFIL_NOT_FOUND');
  }

  req.user = { id: profil.id, peran: profil.peran, sekolah_id: profil.sekolah_id };
  next();
};
