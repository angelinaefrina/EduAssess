import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

export type SumberTarget = Database['public']['Enums']['sumber_target'];
export type TargetKarirInsert = Database['public']['Tables']['target_karir']['Insert'];

export const TargetKarirModel = {
  async listBySiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('target_karir')
      .select('id, teks_bebas, sumber, created_at, karir(id, nama, bidang_karir_id)')
      .eq('siswa_id', siswaId)
      .order('created_at');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findBySiswaKarir(siswaId: string, karirId: string) {
    const { data, error } = await supabase
      .from('target_karir')
      .select('id, teks_bebas, sumber, created_at, karir(id, nama, bidang_karir_id)')
      .eq('siswa_id', siswaId)
      .eq('karir_id', karirId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async insertMany(rows: TargetKarirInsert[]) {
    if (rows.length === 0) return;
    const { error } = await supabase.from('target_karir').insert(rows);
    throwIfSupabaseError(error);
  },

  async deleteBySumber(siswaId: string, sumber: SumberTarget) {
    const { error } = await supabase
      .from('target_karir')
      .delete()
      .eq('siswa_id', siswaId)
      .eq('sumber', sumber);
    throwIfSupabaseError(error);
  },

  /** Hapus satu target milik siswa; mengembalikan true bila ada baris yang terhapus. */
  async deleteOwned(siswaId: string, id: string) {
    const { data, error } = await supabase
      .from('target_karir')
      .delete()
      .eq('siswa_id', siswaId)
      .eq('id', id)
      .select('id');
    throwIfSupabaseError(error);
    return (data ?? []).length > 0;
  },
};
