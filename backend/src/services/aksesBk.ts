import type { AuthUser } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import { SiswaModel } from '../models/siswa.model';

/** sekolah_id milik BK/guru; akun tanpa sekolah tidak boleh mengakses data siswa mana pun. */
export function sekolahBk(user: AuthUser): string {
  if (!user.sekolah_id) {
    throw AppError.forbidden('Akun BK/guru belum terhubung ke sekolah', 'BK_TANPA_SEKOLAH');
  }
  return user.sekolah_id;
}

/**
 * Pastikan siswa berada di sekolah yang sama dengan BK/guru.
 * Siswa sekolah lain diperlakukan sama dengan tidak ada (404), agar keberadaannya tidak bocor.
 */
export async function pastikanSiswaSekolahBk(user: AuthUser, siswaId: string) {
  const siswa = await SiswaModel.findStatusDiSekolah(siswaId, sekolahBk(user));
  if (!siswa) throw AppError.notFound('Siswa tidak ditemukan');
  return siswa;
}
