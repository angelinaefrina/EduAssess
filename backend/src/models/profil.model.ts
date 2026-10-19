import { supabase } from '../config/supabase';
import { lupakanProfil } from '../middleware/auth';
import { throwIfSupabaseError } from '../middleware/errorHandler';

export const ProfilModel = {
  async findByIdWithSekolah(id: string) {
    const { data, error } = await supabase
      .from('profil')
      .select('id, peran, nama, sekolah_id, created_at, updated_at, sekolah(id, nama, npsn, kota)')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async update(id: string, fields: { nama?: string | null; sekolah_id?: string | null }) {
    const { error } = await supabase.from('profil').update(fields).eq('id', id);
    throwIfSupabaseError(error);
    // sekolah_id dipakai middleware auth; jangan biarkan cache-nya basi.
    lupakanProfil(id);
  },

  /** Query paling ringan untuk healthcheck koneksi DB. */
  async ping() {
    const { error } = await supabase
      .from('profil')
      .select('id', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(3000));
    return !error;
  },
};
