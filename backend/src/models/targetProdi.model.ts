import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { SumberTarget } from './targetKarir.model';

const KOLOM =
  'id, is_utama, sumber, created_at, prodi(id, nama, kode_riasec, jenis_pendidikan, bidang_studi(id, kode, nama))';

export const TargetProdiModel = {
  async listBySiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('target_prodi')
      .select(KOLOM)
      .eq('siswa_id', siswaId)
      .order('is_utama', { ascending: false })
      .order('created_at');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async findOwned(siswaId: string, id: string) {
    const { data, error } = await supabase
      .from('target_prodi')
      .select('id, prodi_id, is_utama')
      .eq('siswa_id', siswaId)
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async findBySiswaProdi(siswaId: string, prodiId: string) {
    const { data, error } = await supabase
      .from('target_prodi')
      .select(KOLOM)
      .eq('siswa_id', siswaId)
      .eq('prodi_id', prodiId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async adaUtama(siswaId: string) {
    const { count, error } = await supabase
      .from('target_prodi')
      .select('id', { count: 'exact', head: true })
      .eq('siswa_id', siswaId)
      .eq('is_utama', true);
    throwIfSupabaseError(error);
    return (count ?? 0) > 0;
  },

  async insert(row: { siswa_id: string; prodi_id: string; sumber: SumberTarget; is_utama: boolean }) {
    const { data, error } = await supabase.from('target_prodi').insert(row).select(KOLOM).single();
    throwIfSupabaseError(error);
    return data!;
  },

  /** Lepas utama lama dulu (unique index: satu utama per siswa), lalu set yang baru. */
  async jadikanUtama(siswaId: string, id: string) {
    const lepas = await supabase
      .from('target_prodi')
      .update({ is_utama: false })
      .eq('siswa_id', siswaId)
      .eq('is_utama', true)
      .neq('id', id);
    throwIfSupabaseError(lepas.error);
    const set = await supabase
      .from('target_prodi')
      .update({ is_utama: true })
      .eq('siswa_id', siswaId)
      .eq('id', id);
    throwIfSupabaseError(set.error);
  },

  async hapus(siswaId: string, id: string) {
    const { error } = await supabase.from('target_prodi').delete().eq('siswa_id', siswaId).eq('id', id);
    throwIfSupabaseError(error);
  },

  async tertua(siswaId: string) {
    const { data, error } = await supabase
      .from('target_prodi')
      .select('id')
      .eq('siswa_id', siswaId)
      .order('created_at')
      .limit(1)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },
};
