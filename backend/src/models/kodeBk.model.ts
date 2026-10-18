import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';

type KodeBkInsert = Database['public']['Tables']['kode_bk']['Insert'];
type KodeBkUpdate = Database['public']['Tables']['kode_bk']['Update'];

const KOLOM = 'id, kode, sekolah_id, dibuat_oleh, aktif, berlaku_sampai, created_at';

export const KodeBkModel = {
  /** Mengembalikan `{ data, error }` mentah agar service bisa mendeteksi kode bentrok (23505). */
  async insert(row: KodeBkInsert) {
    return supabase.from('kode_bk').insert(row).select(KOLOM).single();
  },

  async listBySekolah(sekolahId: string) {
    const { data, error } = await supabase
      .from('kode_bk')
      .select(KOLOM)
      .eq('sekolah_id', sekolahId)
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findByKode(kode: string) {
    const { data, error } = await supabase
      .from('kode_bk')
      .select(`${KOLOM}, sekolah(id, nama, kota)`)
      .eq('kode', kode)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  /** Update hanya bila kode milik sekolah tsb.; null bila tidak ditemukan. */
  async updateInSekolah(id: string, sekolahId: string, fields: KodeBkUpdate) {
    const { data, error } = await supabase
      .from('kode_bk')
      .update(fields)
      .eq('id', id)
      .eq('sekolah_id', sekolahId)
      .select(KOLOM)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },
};
