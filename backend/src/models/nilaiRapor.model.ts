import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

export type NilaiRaporInsert = Database['public']['Tables']['nilai_rapor']['Insert'];
export type StatusVerifikasi = Database['public']['Enums']['status_verifikasi'];

const KOLOM =
  'id, semester, nilai, sumber, status, diverifikasi_at, created_at, updated_at, mapel(id, kode, nama)';

export const NilaiRaporModel = {
  async listBySiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('nilai_rapor')
      .select(KOLOM)
      .eq('siswa_id', siswaId)
      .order('semester')
      .order('mapel_id');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async listSemester(siswaId: string, semester: number) {
    const { data, error } = await supabase
      .from('nilai_rapor')
      .select('id, mapel_id, status')
      .eq('siswa_id', siswaId)
      .eq('semester', semester);
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findOwned(siswaId: string, id: string) {
    const { data, error } = await supabase
      .from('nilai_rapor')
      .select('id, status')
      .eq('siswa_id', siswaId)
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  /** Satu statement upsert (atomik) berdasarkan unique (siswa_id, mapel_id, semester). */
  async upsertMany(rows: NilaiRaporInsert[]) {
    if (rows.length === 0) return;
    const { error } = await supabase
      .from('nilai_rapor')
      .upsert(rows, { onConflict: 'siswa_id,mapel_id,semester' });
    throwIfSupabaseError(error);
  },

  async deleteByIds(siswaId: string, ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('nilai_rapor')
      .delete()
      .eq('siswa_id', siswaId)
      .in('id', ids);
    throwIfSupabaseError(error);
  },

  /** Ubah status nilai yang masih 'menunggu'; mengembalikan id yang benar-benar berubah. */
  async putuskanMenunggu(
    siswaId: string,
    status: Exclude<StatusVerifikasi, 'menunggu'>,
    bkId: string,
    ids?: string[],
  ) {
    let q = supabase
      .from('nilai_rapor')
      .update({ status, diverifikasi_oleh: bkId, diverifikasi_at: new Date().toISOString() })
      .eq('siswa_id', siswaId)
      .eq('status', 'menunggu');
    if (ids) q = q.in('id', ids);
    const { data, error } = await q.select('id');
    throwIfSupabaseError(error);
    return (data ?? []).map((r) => r.id);
  },

  async hitungMenungguPerSiswa(siswaIds: string[]) {
    const jumlah = new Map<string, number>();
    if (siswaIds.length === 0) return jumlah;
    const { data, error } = await supabase
      .from('nilai_rapor')
      .select('siswa_id')
      .eq('status', 'menunggu')
      .in('siswa_id', siswaIds);
    throwIfSupabaseError(error);
    for (const r of data ?? []) jumlah.set(r.siswa_id, (jumlah.get(r.siswa_id) ?? 0) + 1);
    return jumlah;
  },
};
