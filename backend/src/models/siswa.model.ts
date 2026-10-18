import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

type SiswaInsert = Database['public']['Tables']['siswa']['Insert'];
type SiswaUpdate = Database['public']['Tables']['siswa']['Update'];

export const SiswaModel = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('siswa')
      .select('id, tingkat, rombel, peminatan, angkatan, onboarding_selesai, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async upsert(row: SiswaInsert) {
    const { error } = await supabase.from('siswa').upsert(row, { onConflict: 'id' });
    throwIfSupabaseError(error);
  },

  async update(id: string, fields: SiswaUpdate) {
    const { error } = await supabase.from('siswa').update(fields).eq('id', id);
    throwIfSupabaseError(error);
  },

  /** Ringkasan siswa dari v_status_siswa, hanya bila berada di sekolah tsb. */
  async findStatusDiSekolah(id: string, sekolahId: string) {
    const { data, error } = await supabase
      .from('v_status_siswa')
      .select('siswa_id, nama, tingkat, rombel, angkatan')
      .eq('siswa_id', id)
      .eq('sekolah_id', sekolahId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async listStatusBySekolah(
    sekolahId: string,
    filter: { tingkat?: number; adaNilaiMenunggu?: boolean } = {},
  ) {
    let q = supabase
      .from('v_status_siswa')
      .select('siswa_id, nama, tingkat, rombel, angkatan')
      .eq('sekolah_id', sekolahId);
    if (filter.tingkat) q = q.eq('tingkat', filter.tingkat);
    if (filter.adaNilaiMenunggu) q = q.eq('ada_nilai_menunggu', true);
    const { data, error } = await q
      .order('tingkat')
      .order('rombel', { nullsFirst: false })
      .order('nama');
    throwIfSupabaseError(error);
    return data ?? [];
  },
};
