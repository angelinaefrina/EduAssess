import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

export type PreferensiInsert = Database['public']['Tables']['preferensi_pendidikan']['Insert'];

export const PreferensiModel = {
  async findBySiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('preferensi_pendidikan')
      .select('gaya_belajar, ingin_cepat_kerja, pertimbangan_biaya, jenjang_diminati, updated_at')
      .eq('siswa_id', siswaId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async upsert(row: PreferensiInsert) {
    const { error } = await supabase
      .from('preferensi_pendidikan')
      .upsert(row, { onConflict: 'siswa_id' });
    throwIfSupabaseError(error);
  },
};
