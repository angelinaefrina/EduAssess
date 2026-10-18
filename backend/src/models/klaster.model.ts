import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

type Tabel = Database['public']['Tables'];
export type BasisKlaster = Database['public']['Enums']['basis_klaster'];

const KOLOM_RUN =
  'id, sekolah_id, dibuat_oleh, basis, angkatan, tingkat, rombel, jumlah_klaster, algoritma, parameter, versi_algo, jumlah_dilewati, created_at, pembuat:profil!klaster_run_dibuat_oleh_fkey(nama)';
const KOLOM_KLASTER = 'id, run_id, urutan, label, centroid, karakteristik, penjelasan, model_llm';

export interface FilterCakupan {
  angkatan: number;
  tingkat?: number;
  rombel?: string;
}

export const KlasterModel = {
  /** Siswa sekolah dalam cakupan run (UC15). Rombel dicocokkan persis, tanpa beda huruf besar/kecil. */
  async siswaCakupan(sekolahId: string, f: FilterCakupan) {
    let q = supabase
      .from('v_status_siswa')
      .select('siswa_id, nama, tingkat, rombel, angkatan')
      .eq('sekolah_id', sekolahId)
      .eq('angkatan', f.angkatan);
    if (f.tingkat) q = q.eq('tingkat', f.tingkat);
    if (f.rombel) q = q.ilike('rombel', f.rombel.replace(/[\\%_]/g, (c) => `\\${c}`));
    const { data, error } = await q.order('nama');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  /** Nama & kelas SAAT INI untuk anggota run (siswa yang sudah keluar sekolah tidak muncul). */
  async statusSiswa(sekolahId: string, siswaIds: string[]) {
    if (siswaIds.length === 0) return [];
    const { data, error } = await supabase
      .from('v_status_siswa')
      .select('siswa_id, nama, tingkat, rombel, angkatan')
      .eq('sekolah_id', sekolahId)
      .in('siswa_id', siswaIds);
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async fiturSiswa(siswaIds: string[]) {
    if (siswaIds.length === 0) return [];
    const { data, error } = await supabase
      .from('v_fitur_siswa')
      .select('siswa_id, nilai, riasec, kode_holland')
      .in('siswa_id', siswaIds);
    throwIfSupabaseError(error);
    return data ?? [];
  },

  // ------------------------------------------------------------- run
  async insertRun(row: Tabel['klaster_run']['Insert']) {
    const { data, error } = await supabase.from('klaster_run').insert(row).select('id').single();
    throwIfSupabaseError(error);
    return data!.id;
  },

  async insertKlaster(rows: Tabel['klaster']['Insert'][]) {
    const { data, error } = await supabase.from('klaster').insert(rows).select('id, urutan');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async insertAnggota(rows: Tabel['klaster_anggota']['Insert'][]) {
    const { error } = await supabase.from('klaster_anggota').insert(rows);
    throwIfSupabaseError(error);
  },

  async hapusRun(id: string) {
    const { error } = await supabase.from('klaster_run').delete().eq('id', id);
    throwIfSupabaseError(error);
  },

  async listRun(sekolahId: string, f: { angkatan?: number; dibuatOleh?: string; limit: number; offset: number }) {
    let q = supabase.from('klaster_run').select(KOLOM_RUN, { count: 'exact' }).eq('sekolah_id', sekolahId);
    if (f.angkatan) q = q.eq('angkatan', f.angkatan);
    if (f.dibuatOleh) q = q.eq('dibuat_oleh', f.dibuatOleh);
    const { data, error, count } = await q
      .order('created_at', { ascending: false })
      .range(f.offset, f.offset + f.limit - 1);
    throwIfSupabaseError(error);
    return { data: data ?? [], total: count ?? 0 };
  },

  async findRunDiSekolah(id: string, sekolahId: string) {
    const { data, error } = await supabase
      .from('klaster_run')
      .select(KOLOM_RUN)
      .eq('id', id)
      .eq('sekolah_id', sekolahId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async listKlaster(runId: string) {
    const { data, error } = await supabase.from('klaster').select(KOLOM_KLASTER).eq('run_id', runId).order('urutan');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findKlaster(runId: string, klasterId: string) {
    const { data, error } = await supabase
      .from('klaster')
      .select(KOLOM_KLASTER)
      .eq('run_id', runId)
      .eq('id', klasterId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async simpanPenjelasan(klasterId: string, penjelasan: string | null, modelLlm: string | null) {
    const { error } = await supabase.from('klaster').update({ penjelasan, model_llm: modelLlm }).eq('id', klasterId);
    throwIfSupabaseError(error);
  },

  // --------------------------------------------------------- anggota
  async listAnggota(runId: string) {
    const { data, error } = await supabase
      .from('klaster_anggota')
      .select('siswa_id, klaster_id, fitur, jarak_centroid, is_manual, klaster_asal_id, dipindah_oleh, dipindah_at')
      .eq('run_id', runId);
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findAnggota(runId: string, siswaId: string) {
    const { data, error } = await supabase
      .from('klaster_anggota')
      .select('siswa_id, klaster_id, is_manual, klaster_asal_id')
      .eq('run_id', runId)
      .eq('siswa_id', siswaId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async updateAnggota(runId: string, siswaId: string, fields: Tabel['klaster_anggota']['Update']) {
    const { data, error } = await supabase
      .from('klaster_anggota')
      .update(fields)
      .eq('run_id', runId)
      .eq('siswa_id', siswaId)
      .select('siswa_id, klaster_id, jarak_centroid, is_manual, klaster_asal_id, dipindah_oleh, dipindah_at')
      .single();
    throwIfSupabaseError(error);
    return data!;
  },
};
