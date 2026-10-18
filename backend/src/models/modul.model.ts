import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';
import { polaMengandung } from './like';

type Tabel = Database['public']['Tables'];
export type ModulInsert = Tabel['modul_pembelajaran']['Insert'];
export type ModulUpdate = Tabel['modul_pembelajaran']['Update'];
export type RekomendasiModulInsert = Tabel['rekomendasi_modul']['Insert'];

export const BUCKET_MODUL = 'modul-pembelajaran';

const KOLOM_MODUL =
  'id, sekolah_id, dibuat_oleh, judul, mapel_id, tingkat, topik, deskripsi, tipe_riasec, tautan_url, berkas_path, aktif, created_at, updated_at, mapel(id, kode, nama)';
const KOLOM_REKOMENDASI = `id, run_id, klaster_id, siswa_id, modul_id, peringkat, skor, alasan, created_at, modul:modul_pembelajaran(${KOLOM_MODUL})`;

export interface FilterModul {
  q?: string;
  mapel_id?: number;
  tingkat?: number;
  aktif?: boolean;
  limit: number;
  offset: number;
}

export const ModulModel = {
  async list(sekolahId: string, f: FilterModul) {
    let q = supabase.from('modul_pembelajaran').select(KOLOM_MODUL, { count: 'exact' }).eq('sekolah_id', sekolahId);
    if (f.q) q = q.ilike('judul', polaMengandung(f.q));
    if (f.mapel_id) q = q.eq('mapel_id', f.mapel_id);
    if (f.tingkat) q = q.eq('tingkat', f.tingkat);
    if (f.aktif !== undefined) q = q.eq('aktif', f.aktif);
    const { data, error, count } = await q
      .order('mapel_id')
      .order('tingkat')
      .order('judul')
      .range(f.offset, f.offset + f.limit - 1);
    throwIfSupabaseError(error);
    return { data: data ?? [], total: count ?? 0 };
  },

  /** Semua modul aktif sekolah, bahan rekomendasi (UC16). */
  async listAktif(sekolahId: string) {
    const { data, error } = await supabase
      .from('modul_pembelajaran')
      .select('id, judul, mapel_id, tingkat, tipe_riasec, mapel(kode)')
      .eq('sekolah_id', sekolahId)
      .eq('aktif', true);
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findDiSekolah(id: string, sekolahId: string) {
    const { data, error } = await supabase
      .from('modul_pembelajaran')
      .select(KOLOM_MODUL)
      .eq('id', id)
      .eq('sekolah_id', sekolahId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async insert(row: ModulInsert) {
    const { data, error } = await supabase.from('modul_pembelajaran').insert(row).select(KOLOM_MODUL).single();
    throwIfSupabaseError(error);
    return data!;
  },

  async updateDiSekolah(id: string, sekolahId: string, fields: ModulUpdate) {
    const { data, error } = await supabase
      .from('modul_pembelajaran')
      .update(fields)
      .eq('id', id)
      .eq('sekolah_id', sekolahId)
      .select(KOLOM_MODUL)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async hapus(id: string) {
    const { error } = await supabase.from('modul_pembelajaran').delete().eq('id', id);
    throwIfSupabaseError(error);
  },

  // ---------------------------------------------------------- storage
  async urlUnggah(path: string) {
    const { data, error } = await supabase.storage.from(BUCKET_MODUL).createSignedUploadUrl(path);
    throwIfSupabaseError(error);
    return data!;
  },

  async urlUnduh(path: string, detik: number) {
    const { data, error } = await supabase.storage.from(BUCKET_MODUL).createSignedUrl(path, detik);
    throwIfSupabaseError(error);
    return data!.signedUrl;
  },

  async hapusBerkas(paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await supabase.storage.from(BUCKET_MODUL).remove(paths);
    throwIfSupabaseError(error);
  },

  // ------------------------------------------------------ rekomendasi
  async listRekomendasi(runId: string, f: { klasterId?: string; siswaId?: string }) {
    let q = supabase.from('rekomendasi_modul').select(KOLOM_REKOMENDASI).eq('run_id', runId);
    if (f.klasterId) q = q.eq('klaster_id', f.klasterId);
    if (f.siswaId) q = q.eq('siswa_id', f.siswaId);
    const { data, error } = await q.order('klaster_id', { nullsFirst: false }).order('siswa_id').order('peringkat');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  /** Hapus rekomendasi lama untuk sasaran yang dihitung ulang. */
  async hapusRekomendasi(runId: string, sasaran: { klasterIds?: string[]; siswaIds?: string[] }) {
    if (sasaran.klasterIds?.length) {
      const { error } = await supabase.from('rekomendasi_modul').delete().eq('run_id', runId).in('klaster_id', sasaran.klasterIds);
      throwIfSupabaseError(error);
    }
    if (sasaran.siswaIds?.length) {
      const { error } = await supabase.from('rekomendasi_modul').delete().eq('run_id', runId).in('siswa_id', sasaran.siswaIds);
      throwIfSupabaseError(error);
    }
  },

  async insertRekomendasi(rows: RekomendasiModulInsert[]) {
    if (rows.length === 0) return;
    const { error } = await supabase.from('rekomendasi_modul').insert(rows);
    throwIfSupabaseError(error);
  },
};
