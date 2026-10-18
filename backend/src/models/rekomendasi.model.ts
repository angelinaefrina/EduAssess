import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import type { Database, Json } from '../../types/database';

export type JenisRekomendasi = Database['public']['Enums']['jenis_rekomendasi'];

export const RekomendasiModel = {
  /** Profil fitur siswa: nilai terakhir per mapel (tidak ditolak), RIASEC, kemampuan, dll. */
  async fiturSiswa(siswaId: string) {
    const { data, error } = await supabase
      .from('v_fitur_siswa')
      .select('peminatan, nilai, riasec, kode_holland, kemampuan, mapel_favorit, bidang_karir')
      .eq('siswa_id', siswaId)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  /** Seluruh katalog yang dipakai perhitungan, dalam satu query. */
  async katalog() {
    const { data, error } = await supabase
      .from('prodi')
      .select(
        `id, nama, kode_riasec, jenis_pendidikan, catatan_sumber,
         bidang_studi(id, kode, nama),
         prodi_mapel(bobot, mapel(id, kode, nama, is_pilihan)),
         karir_prodi(karir(id, nama, bidang_karir(kode)))`,
      )
      .order('nama');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async mapelPilihan() {
    const { data, error } = await supabase
      .from('mapel')
      .select('id, kode, nama')
      .eq('is_pilihan', true)
      .order('id');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async targetKarirIds(siswaId: string) {
    const { data, error } = await supabase
      .from('target_karir')
      .select('karir_id')
      .eq('siswa_id', siswaId)
      .not('karir_id', 'is', null);
    throwIfSupabaseError(error);
    return (data ?? []).map((r) => r.karir_id!).sort();
  },

  async targetProdiUtama(siswaId: string) {
    const { data, error } = await supabase
      .from('target_prodi')
      .select('prodi_id')
      .eq('siswa_id', siswaId)
      .eq('is_utama', true)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data?.prodi_id ?? null;
  },

  // ------------------------------------------------------------- cache
  async cariCache(siswaId: string, jenis: JenisRekomendasi, inputHash: string) {
    const { data, error } = await supabase
      .from('hasil_rekomendasi')
      .select('id, hasil, penjelasan, model_llm, versi_algo, created_at')
      .eq('siswa_id', siswaId)
      .eq('jenis', jenis)
      .eq('input_hash', inputHash)
      .maybeSingle();
    throwIfSupabaseError(error);
    return data;
  },

  /** Mengembalikan `{ data, error }` mentah: pemanggil menangani bentrok unik (23505). */
  async simpanCache(row: {
    siswa_id: string;
    jenis: JenisRekomendasi;
    input_hash: string;
    hasil: Json;
    versi_algo: string;
  }) {
    return supabase
      .from('hasil_rekomendasi')
      .insert(row)
      .select('id, hasil, penjelasan, model_llm, versi_algo, created_at')
      .single();
  },

  /** penjelasan null = gagal dibuat; dicoba lagi pada permintaan berikutnya. */
  async simpanPenjelasan(id: string, penjelasan: string | null, modelLlm: string | null) {
    const { error } = await supabase
      .from('hasil_rekomendasi')
      .update({ penjelasan, model_llm: modelLlm })
      .eq('id', id);
    throwIfSupabaseError(error);
  },
};
