import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import { memo } from './memo';

export const AsesmenModel = {
  listButirAktif: memo(async () => {
    const { data, error } = await supabase
      .from('riasec_butir')
      .select('id, tipe, pernyataan, urutan')
      .eq('aktif', true)
      .order('urutan');
    throwIfSupabaseError(error);
    return data ?? [];
  }),

  listDimensi: memo(async () => {
    const { data, error } = await supabase
      .from('dimensi_kemampuan')
      .select('id, kode, pernyataan, urutan')
      .order('urutan');
    throwIfSupabaseError(error);
    return data ?? [];
  }),

  async insertSiswa(siswaId: string, semester: number | null) {
    const { data, error } = await supabase
      .from('asesmen')
      .insert({ siswa_id: siswaId, semester })
      .select('id')
      .single();
    throwIfSupabaseError(error);
    return data!.id;
  },

  async insertJawaban(
    asesmenId: string,
    riasec: { butir_id: number; skor: number }[],
    kemampuan: { dimensi_id: number; skor: number }[],
  ) {
    // Dua tabel independen: kirim bersamaan (1 round-trip, bukan 2).
    const [r, k] = await Promise.all([
      supabase.from('asesmen_riasec').insert(riasec.map((j) => ({ asesmen_id: asesmenId, ...j }))),
      supabase.from('asesmen_kemampuan').insert(kemampuan.map((j) => ({ asesmen_id: asesmenId, ...j }))),
    ]);
    throwIfSupabaseError(r.error);
    throwIfSupabaseError(k.error);
  },

  async tandaiSelesai(asesmenId: string) {
    const { error } = await supabase
      .from('asesmen')
      .update({ selesai_at: new Date().toISOString() })
      .eq('id', asesmenId);
    throwIfSupabaseError(error);
  },

  async hapus(asesmenId: string) {
    const { error } = await supabase.from('asesmen').delete().eq('id', asesmenId);
    throwIfSupabaseError(error);
  },

  /** Skor & kode Holland dihitung oleh view v_asesmen_terakhir_siswa (bukan di JS). */
  async terakhirSiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('v_asesmen_terakhir_siswa')
      .select('asesmen_id, selesai_at, riasec, kode_holland, kemampuan')
      .eq('siswa_id', siswaId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  /** Riwayat asesmen selesai, terbaru dulu; skor dari view v_profil_asesmen. */
  async riwayatSiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('v_profil_asesmen')
      .select('asesmen_id, selesai_at, riasec, kode_holland, kemampuan')
      .eq('siswa_id', siswaId)
      .not('selesai_at', 'is', null)
      .order('selesai_at', { ascending: false });
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async semesterByIds(ids: string[]) {
    if (ids.length === 0) return new Map<string, number | null>();
    const { data, error } = await supabase.from('asesmen').select('id, semester').in('id', ids);
    throwIfSupabaseError(error);
    return new Map((data ?? []).map((r) => [r.id, r.semester]));
  },
};
