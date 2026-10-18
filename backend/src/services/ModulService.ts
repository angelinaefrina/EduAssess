/**
 * Katalog modul pembelajaran (UC17 / F19), dibagi bersama oleh guru di satu sekolah.
 * Berkas modul disimpan di bucket privat 'modul-pembelajaran' di bawah prefiks
 * `<sekolah_id>/`: klien meminta signed upload URL, mengunggah langsung ke Storage,
 * lalu menyimpan `berkas_path` yang dikembalikan saat membuat/mengubah modul.
 */
import { randomUUID } from 'node:crypto';
import { AppError } from '../middleware/errorHandler';
import { MasterModel } from '../models/master.model';
import { ModulModel, type FilterModul, type ModulInsert, type ModulUpdate } from '../models/modul.model';
import type { AuthUser } from '../types/express';
import { sekolahBk } from './aksesBk';

const MASA_URL_UNDUH_DETIK = 60 * 60;

export type InputModul = Omit<ModulInsert, 'id' | 'sekolah_id' | 'dibuat_oleh' | 'created_at' | 'updated_at'>;

const terisi = (s: string | null | undefined) => !!s && s.trim() !== '';

async function pastikanMapel(mapelId: number | undefined) {
  if (mapelId === undefined) return;
  const mapel = await MasterModel.listMapel();
  if (!mapel.some((m) => m.id === mapelId)) throw AppError.badRequest('mapel_id tidak dikenal', 'MAPEL_TIDAK_DIKENAL');
}

/** Cegah modul merujuk berkas milik sekolah lain. */
function pastikanPathSekolah(path: string | null | undefined, sekolahId: string) {
  if (terisi(path) && !path!.startsWith(`${sekolahId}/`)) {
    throw AppError.badRequest('berkas_path tidak valid; gunakan path dari endpoint unggah', 'BERKAS_TIDAK_VALID');
  }
}

async function modulDiSekolah(user: AuthUser, id: string) {
  const modul = await ModulModel.findDiSekolah(id, sekolahBk(user));
  if (!modul) throw AppError.notFound('Modul tidak ditemukan');
  return modul;
}

export const ModulService = {
  async daftar(user: AuthUser, f: FilterModul) {
    return ModulModel.list(sekolahBk(user), f);
  },

  async detail(user: AuthUser, id: string) {
    const modul = await modulDiSekolah(user, id);
    const url_berkas = modul.berkas_path ? await ModulModel.urlUnduh(modul.berkas_path, MASA_URL_UNDUH_DETIK) : null;
    return { ...modul, url_berkas };
  },

  async buat(user: AuthUser, input: InputModul) {
    const sekolahId = sekolahBk(user);
    await pastikanMapel(input.mapel_id);
    pastikanPathSekolah(input.berkas_path, sekolahId);
    return ModulModel.insert({ ...input, sekolah_id: sekolahId, dibuat_oleh: user.id });
  },

  async ubah(user: AuthUser, id: string, fields: ModulUpdate) {
    const sekolahId = sekolahBk(user);
    const lama = await modulDiSekolah(user, id);
    await pastikanMapel(fields.mapel_id);
    pastikanPathSekolah(fields.berkas_path, sekolahId);
    const tautan = fields.tautan_url !== undefined ? fields.tautan_url : lama.tautan_url;
    const berkas = fields.berkas_path !== undefined ? fields.berkas_path : lama.berkas_path;
    if (!terisi(tautan) && !terisi(berkas)) {
      throw AppError.badRequest('Modul wajib punya tautan_url atau berkas_path', 'MODUL_TANPA_ISI');
    }

    const modul = await ModulModel.updateDiSekolah(id, sekolahId, fields);
    if (!modul) throw AppError.notFound('Modul tidak ditemukan');
    // Berkas lama yang diganti/dilepas dihapus dari storage (gagal hapus tidak menggagalkan request).
    if (lama.berkas_path && lama.berkas_path !== modul.berkas_path) {
      await ModulModel.hapusBerkas([lama.berkas_path]).catch((e) => console.error('Hapus berkas modul gagal:', e));
    }
    return modul;
  },

  /** Hapus permanen; rekomendasi yang memakai modul ini ikut terhapus. Untuk menyembunyikan saja, set aktif=false. */
  async hapus(user: AuthUser, id: string) {
    const modul = await modulDiSekolah(user, id);
    await ModulModel.hapus(id);
    if (modul.berkas_path) {
      await ModulModel.hapusBerkas([modul.berkas_path]).catch((e) => console.error('Hapus berkas modul gagal:', e));
    }
  },

  /** Signed upload URL (berlaku 2 jam, aturan Supabase Storage) untuk satu berkas baru. */
  async urlUnggah(user: AuthUser, namaFile: string) {
    const aman = namaFile.normalize('NFKD').replace(/[^\w.-]+/g, '_').replace(/^\.+/, '').slice(-100) || 'berkas';
    const path = `${sekolahBk(user)}/${randomUUID()}/${aman}`;
    const { signedUrl, token } = await ModulModel.urlUnggah(path);
    return { berkas_path: path, signed_url: signedUrl, token };
  },
};
