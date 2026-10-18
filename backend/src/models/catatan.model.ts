import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';

const KOLOM = 'id, siswa_id, bk_id, isi, tindak_lanjut, created_at, updated_at, bk:profil!catatan_konseling_bk_id_fkey(nama)';

export const CatatanModel = {
  async listBySiswa(siswaId: string, limit?: number) {
    let q = supabase
      .from('catatan_konseling')
      .select(KOLOM)
      .eq('siswa_id', siswaId)
      .order('created_at', { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findById(id: string) {
    const { data, error } = await supabase
      .from('catatan_konseling')
      .select('id, siswa_id, bk_id')
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async insert(row: { siswa_id: string; bk_id: string; isi: string; tindak_lanjut: string | null }) {
    const { data, error } = await supabase.from('catatan_konseling').insert(row).select(KOLOM).single();
    throwIfSupabaseError(error);
    return data!;
  },

  async update(id: string, fields: { isi?: string; tindak_lanjut?: string | null }) {
    const { data, error } = await supabase
      .from('catatan_konseling')
      .update(fields)
      .eq('id', id)
      .select(KOLOM)
      .single();
    throwIfSupabaseError(error);
    return data!;
  },

  async hapus(id: string) {
    const { error } = await supabase.from('catatan_konseling').delete().eq('id', id);
    throwIfSupabaseError(error);
  },
};
