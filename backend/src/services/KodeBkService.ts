import { randomInt } from 'node:crypto';
import type { AuthUser } from '../types/express';
import { AppError, throwIfSupabaseError } from '../middleware/errorHandler';
import { KodeBkModel } from '../models/kodeBk.model';
import { sekolahBk } from './aksesBk';

// Tanpa karakter yang mudah tertukar saat didikte/ditulis di papan: 0/O, 1/I/L.
const ALFABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PANJANG_KODE = 6;
const MAKS_PERCOBAAN = 5;

function acakKode(): string {
  let kode = '';
  for (let i = 0; i < PANJANG_KODE; i++) kode += ALFABET[randomInt(ALFABET.length)];
  return kode;
}

/** Samakan format input siswa dengan yang disimpan (uppercase, tanpa spasi/strip). */
export function normalisasiKode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase();
}

export const KodeBkService = {
  async buat(user: AuthUser, input: { berlaku_sampai?: string | null }) {
    const sekolahId = sekolahBk(user);
    if (input.berlaku_sampai && new Date(input.berlaku_sampai) <= new Date()) {
      throw AppError.badRequest('berlaku_sampai harus di masa depan');
    }

    for (let i = 0; i < MAKS_PERCOBAAN; i++) {
      const { data, error } = await KodeBkModel.insert({
        kode: acakKode(),
        sekolah_id: sekolahId,
        dibuat_oleh: user.id,
        berlaku_sampai: input.berlaku_sampai ?? null,
      });
      if (error?.code === '23505') continue; // kode bentrok, acak ulang
      throwIfSupabaseError(error);
      return data!;
    }
    throw new AppError(500, 'KODE_GAGAL_DIBUAT', 'Gagal membuat kode unik');
  },

  async daftar(user: AuthUser) {
    return KodeBkModel.listBySekolah(sekolahBk(user));
  },

  async ubah(user: AuthUser, id: string, fields: { aktif?: boolean; berlaku_sampai?: string | null }) {
    const kode = await KodeBkModel.updateInSekolah(id, sekolahBk(user), fields);
    // Kode sekolah lain diperlakukan sama dengan tidak ada (tidak membocorkan keberadaannya).
    if (!kode) throw AppError.notFound('Kode tidak ditemukan');
    return kode;
  },
};
