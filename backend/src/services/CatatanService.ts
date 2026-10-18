/**
 * Catatan konseling (UC11 / F13). Keputusan tim: catatan INTERNAL BK (siswa tidak bisa
 * membaca); semua BK di sekolah yang sama bisa membaca, hanya penulis yang bisa
 * mengubah/menghapus.
 */
import type { AuthUser } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import { CatatanModel } from '../models/catatan.model';
import { pastikanSiswaSekolahBk } from './aksesBk';

async function catatanMilikPenulis(user: AuthUser, id: string) {
  const c = await CatatanModel.findById(id);
  if (!c) throw AppError.notFound('Catatan tidak ditemukan');
  await pastikanSiswaSekolahBk(user, c.siswa_id); // catatan siswa sekolah lain -> 404
  if (c.bk_id !== user.id) {
    throw AppError.forbidden('Hanya penulis yang dapat mengubah atau menghapus catatan ini', 'BUKAN_PENULIS');
  }
  return c;
}

export const CatatanService = {
  async daftar(user: AuthUser, siswaId: string) {
    await pastikanSiswaSekolahBk(user, siswaId);
    return CatatanModel.listBySiswa(siswaId);
  },

  async tambah(user: AuthUser, siswaId: string, input: { isi: string; tindak_lanjut?: string | null }) {
    await pastikanSiswaSekolahBk(user, siswaId);
    return CatatanModel.insert({ siswa_id: siswaId, bk_id: user.id, isi: input.isi, tindak_lanjut: input.tindak_lanjut ?? null });
  },

  async ubah(user: AuthUser, id: string, fields: { isi?: string; tindak_lanjut?: string | null }) {
    await catatanMilikPenulis(user, id);
    return CatatanModel.update(id, fields);
  },

  async hapus(user: AuthUser, id: string) {
    await catatanMilikPenulis(user, id);
    await CatatanModel.hapus(id);
  },
};
