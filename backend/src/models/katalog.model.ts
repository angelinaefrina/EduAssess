import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database } from '../../types/database';
import { polaMengandung } from './like';

type JenisPendidikan = Database['public']['Enums']['jenis_pendidikan'];

export interface Halaman {
  limit: number;
  offset: number;
}

export const KatalogModel = {
  async listBidangStudi() {
    const { data, error } = await supabase.from('bidang_studi').select('id, kode, nama, deskripsi').order('id');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async listProdi(filter: { q?: string; bidangStudi?: string; jenis?: JenisPendidikan }, hal: Halaman) {
    let q = supabase
      .from('prodi')
      .select('id, nama, kode_riasec, jenis_pendidikan, sumber_url, catatan_sumber, bidang_studi!inner(id, kode, nama)', {
        count: 'exact',
      });
    if (filter.q) q = q.ilike('nama', polaMengandung(filter.q));
    if (filter.bidangStudi) q = q.eq('bidang_studi.kode', filter.bidangStudi);
    if (filter.jenis) q = q.contains('jenis_pendidikan', [filter.jenis]);
    const { data, error, count } = await q.order('nama').range(hal.offset, hal.offset + hal.limit - 1);
    throwIfSupabaseError(error);
    return { items: data ?? [], total: count ?? 0 };
  },

  async findProdi(id: string) {
    const { data, error } = await supabase
      .from('prodi')
      .select(
        `id, nama, deskripsi, kode_riasec, jenis_pendidikan, sumber_url, catatan_sumber,
         bidang_studi(id, kode, nama),
         prodi_mapel(bobot, mapel(id, kode, nama)),
         karir_prodi(karir(id, nama, kode_riasec, is_trending)),
         prodi_pt(jenjang, sumber_url, perguruan_tinggi(id, nama, jenis, kota, situs_url))`,
      )
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async listKarir(filter: { q?: string; bidangKarir?: string; trending?: boolean }, hal: Halaman) {
    // karir.bidang_karir_id boleh null: inner join hanya saat memfilter bidang karir.
    const kolom = filter.bidangKarir
      ? 'id, nama, kode_riasec, is_trending, catatan_sumber, bidang_karir!inner(id, kode, nama)'
      : 'id, nama, kode_riasec, is_trending, catatan_sumber, bidang_karir(id, kode, nama)';
    let q = supabase.from('karir').select(kolom, { count: 'exact' });
    if (filter.q) q = q.ilike('nama', polaMengandung(filter.q));
    if (filter.bidangKarir) q = q.eq('bidang_karir.kode', filter.bidangKarir);
    if (filter.trending !== undefined) q = q.eq('is_trending', filter.trending);
    const { data, error, count } = await q
      .order('is_trending', { ascending: false })
      .order('nama')
      .range(hal.offset, hal.offset + hal.limit - 1);
    throwIfSupabaseError(error);
    return { items: data ?? [], total: count ?? 0 };
  },

  async findKarir(id: string) {
    const { data, error } = await supabase
      .from('karir')
      .select(
        `id, nama, deskripsi, kode_riasec, is_trending, sumber_url, catatan_sumber,
         bidang_karir(id, kode, nama),
         karir_prodi(prodi(id, nama, kode_riasec, jenis_pendidikan,
           bidang_studi(id, kode, nama),
           prodi_mapel(bobot, mapel(id, kode, nama))))`,
      )
      .eq('id', id)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  async prodiAda(id: string) {
    const { data, error } = await supabase.from('prodi').select('id').eq('id', id).maybeSingle();
    throwIfSupabaseError(error);
    return !!data;
  },

  async karirAda(id: string) {
    const { data, error } = await supabase.from('karir').select('id').eq('id', id).maybeSingle();
    throwIfSupabaseError(error);
    return !!data;
  },

  /** Nilai terakhir (semester terbaru, tidak ditolak) per kode mapel, dari v_fitur_siswa. */
  async nilaiTerakhirSiswa(siswaId: string): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('v_fitur_siswa')
      .select('nilai')
      .eq('siswa_id', siswaId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return (data?.nilai as Record<string, number> | null) ?? {};
  },
};
