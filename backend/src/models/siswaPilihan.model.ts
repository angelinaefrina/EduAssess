import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';

/**
 * Relasi many-to-many siswa: mapel diambil, mapel favorit, bidang karir.
 * `replace` = hapus semua lalu insert ulang (tidak atomik; idempoten bila diulang).
 */
export const SiswaPilihanModel = {
  async listMapel(siswaId: string) {
    const { data, error } = await supabase
      .from('siswa_mapel')
      .select('mapel(id, kode, nama)')
      .eq('siswa_id', siswaId);
    throwIfSupabaseError(error);
    return (data ?? []).map((r) => r.mapel).filter((m) => m !== null);
  },

  async listMapelFavorit(siswaId: string) {
    const { data, error } = await supabase
      .from('siswa_mapel_favorit')
      .select('mapel(id, kode, nama)')
      .eq('siswa_id', siswaId);
    throwIfSupabaseError(error);
    return (data ?? []).map((r) => r.mapel).filter((m) => m !== null);
  },

  async listBidangKarir(siswaId: string) {
    const { data, error } = await supabase
      .from('siswa_bidang_karir')
      .select('bidang_karir(id, kode, nama)')
      .eq('siswa_id', siswaId);
    throwIfSupabaseError(error);
    return (data ?? []).map((r) => r.bidang_karir).filter((b) => b !== null);
  },

  async replaceMapel(siswaId: string, mapelIds: number[]) {
    const del = await supabase.from('siswa_mapel').delete().eq('siswa_id', siswaId);
    throwIfSupabaseError(del.error);
    if (mapelIds.length === 0) return;
    const ins = await supabase
      .from('siswa_mapel')
      .insert(mapelIds.map((mapel_id) => ({ siswa_id: siswaId, mapel_id })));
    throwIfSupabaseError(ins.error);
  },

  async replaceMapelFavorit(siswaId: string, mapelIds: number[]) {
    const del = await supabase.from('siswa_mapel_favorit').delete().eq('siswa_id', siswaId);
    throwIfSupabaseError(del.error);
    if (mapelIds.length === 0) return;
    const ins = await supabase
      .from('siswa_mapel_favorit')
      .insert(mapelIds.map((mapel_id) => ({ siswa_id: siswaId, mapel_id })));
    throwIfSupabaseError(ins.error);
  },

  async replaceBidangKarir(siswaId: string, bidangKarirIds: number[]) {
    const del = await supabase.from('siswa_bidang_karir').delete().eq('siswa_id', siswaId);
    throwIfSupabaseError(del.error);
    if (bidangKarirIds.length === 0) return;
    const ins = await supabase
      .from('siswa_bidang_karir')
      .insert(bidangKarirIds.map((bidang_karir_id) => ({ siswa_id: siswaId, bidang_karir_id })));
    throwIfSupabaseError(ins.error);
  },
};
