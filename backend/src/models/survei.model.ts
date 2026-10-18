import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database, Json } from '../../types/database';

type T = Database['public']['Tables'];
export type RespondenInsert = T['responden']['Insert'];
export type SumberData = Database['public']['Enums']['sumber_data'];

const UKURAN_POTONGAN = 500;

function potong<R>(rows: R[]): R[][] {
  const hasil: R[][] = [];
  for (let i = 0; i < rows.length; i += UKURAN_POTONGAN) hasil.push(rows.slice(i, i + UKURAN_POTONGAN));
  return hasil;
}

export const SurveiModel = {
  /** Master yang dibutuhkan untuk memetakan kolom & opsi Google Form. */
  async master() {
    const [mapel, bidangStudi, bidangKarir, butir, dimensi, prodi] = await Promise.all([
      supabase.from('mapel').select('id, kode, nama'),
      supabase.from('bidang_studi').select('id, kode, nama'),
      supabase.from('bidang_karir').select('id, kode, nama'),
      supabase.from('riasec_butir').select('id, tipe, pernyataan').eq('aktif', true),
      supabase.from('dimensi_kemampuan').select('id, kode, pernyataan'),
      supabase.from('prodi').select('id, nama'),
    ]);
    for (const r of [mapel, bidangStudi, bidangKarir, butir, dimensi, prodi]) throwIfSupabaseError(r.error);
    return {
      mapel: mapel.data ?? [],
      bidangStudi: bidangStudi.data ?? [],
      bidangKarir: bidangKarir.data ?? [],
      butir: butir.data ?? [],
      dimensi: dimensi.data ?? [],
      prodi: prodi.data ?? [],
    };
  },

  async buatBatch(row: { sumber: SumberData; nama_file: string; keterangan?: string | null; parameter?: Json; dibuat_dari?: string | null }) {
    const { data, error } = await supabase.from('batch_impor').insert(row).select('id').single();
    throwIfSupabaseError(error);
    return data!.id;
  },

  /** Menghapus batch beserta seluruh responden & turunannya (cascade). */
  async hapusBatch(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await supabase.from('batch_impor').delete().in('id', ids);
    throwIfSupabaseError(error);
  },

  async batchSama(sumber: SumberData, namaFile: string) {
    const { data, error } = await supabase
      .from('batch_impor')
      .select('id')
      .eq('sumber', sumber)
      .eq('nama_file', namaFile);
    throwIfSupabaseError(error);
    return (data ?? []).map((b) => b.id);
  },

  async insertResponden(rows: RespondenInsert[]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('responden').insert(p)).error);
  },
  async insertNilai(rows: T['responden_nilai']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('responden_nilai').insert(p)).error);
  },
  async insertMapelFavorit(rows: T['responden_mapel_favorit']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('responden_mapel_favorit').insert(p)).error);
  },
  async insertBidangKarir(rows: T['responden_bidang_karir']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('responden_bidang_karir').insert(p)).error);
  },
  async insertAsesmen(rows: T['asesmen']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('asesmen').insert(p)).error);
  },
  async insertAsesmenRiasec(rows: T['asesmen_riasec']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('asesmen_riasec').insert(p)).error);
  },
  async insertAsesmenKemampuan(rows: T['asesmen_kemampuan']['Insert'][]) {
    for (const p of potong(rows)) throwIfSupabaseError((await supabase.from('asesmen_kemampuan').insert(p)).error);
  },
};
