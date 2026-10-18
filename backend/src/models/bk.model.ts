import { supabase } from '../config/supabase';
import { throwIfSupabaseError } from '../middleware/errorHandler';
import { polaMengandung } from './like';

const KOLOM_STATUS =
  'siswa_id, nama, tingkat, rombel, angkatan, kode_holland, belum_asesmen, belum_isi_nilai, ada_nilai_menunggu, profil_belum_lengkap, status_keselarasan';

export interface FilterDashboard {
  q?: string;
  tingkat?: number;
  rombel?: string;
  /** null = siswa yang belum mengisi angkatan. */
  angkatan?: number | null;
  siswaId?: string;
}

export const BkModel = {
  /** Baris v_status_siswa untuk satu sekolah (dashboard UC10). */
  async statusSiswa(sekolahId: string, f: FilterDashboard = {}) {
    let q = supabase.from('v_status_siswa').select(KOLOM_STATUS).eq('sekolah_id', sekolahId);
    if (f.q) {
      // Cari berdasarkan nama ATAU kelas (rombel). Karakter pemisah filter PostgREST dibuang.
      const pola = polaMengandung(f.q.replace(/[,()"]/g, ' ').trim());
      q = q.or(`nama.ilike."${pola}",rombel.ilike."${pola}"`);
    }
    if (f.siswaId) q = q.eq('siswa_id', f.siswaId);
    if (f.tingkat) q = q.eq('tingkat', f.tingkat);
    if (f.rombel) q = q.ilike('rombel', polaMengandung(f.rombel));
    if (f.angkatan === null) q = q.is('angkatan', null);
    else if (f.angkatan !== undefined) q = q.eq('angkatan', f.angkatan);
    const { data, error } = await q
      .order('tingkat')
      .order('rombel', { nullsFirst: false })
      .order('nama');
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async targetUtama(siswaIds: string[]) {
    if (siswaIds.length === 0) return new Map<string, string>();
    const { data, error } = await supabase
      .from('target_prodi')
      .select('siswa_id, prodi_id')
      .eq('is_utama', true)
      .in('siswa_id', siswaIds);
    throwIfSupabaseError(error);
    return new Map((data ?? []).map((r) => [r.siswa_id, r.prodi_id]));
  },

  /** Analisis keselarasan TERBARU per siswa: status & prodi target yang dianalisis. */
  async keselarasanTerakhir(siswaIds: string[]) {
    const hasil = new Map<string, { status: string | null; target_prodi_id: string | null; dihitung_at: string }>();
    if (siswaIds.length === 0) return hasil;
    const { data, error } = await supabase
      .from('hasil_rekomendasi')
      .select('siswa_id, created_at, status:hasil->>status, target_prodi_id:hasil->target->prodi->>id')
      .eq('jenis', 'keselarasan')
      .in('siswa_id', siswaIds)
      .order('created_at', { ascending: false });
    throwIfSupabaseError(error);
    for (const r of data ?? []) {
      if (!hasil.has(r.siswa_id)) {
        hasil.set(r.siswa_id, {
          status: (r.status as string | null) ?? null,
          target_prodi_id: (r.target_prodi_id as string | null) ?? null,
          dihitung_at: r.created_at,
        });
      }
    }
    return hasil;
  },

  // ---------------------------------------------------------- ringkasan UC13
  async ringkasan(sekolahId: string, angkatan?: number | null) {
    const saring = <T extends { eq: (k: string, v: string) => T; is: (k: string, v: null) => T }>(q: T): T => {
      let x = q.eq('sekolah_id', sekolahId);
      if (angkatan === null) x = x.is('angkatan', null);
      else if (angkatan !== undefined) x = x.eq('angkatan', String(angkatan));
      return x;
    };
    const [minat, bidang, karir, mapel] = await Promise.all([
      saring(supabase.from('v_ringkasan_minat_angkatan').select('angkatan, tipe_dominan, jumlah')),
      saring(supabase.from('v_ringkasan_bidang_angkatan').select('angkatan, bidang_studi, jumlah')),
      saring(supabase.from('v_ringkasan_karir_angkatan').select('angkatan, bidang_karir, jumlah')),
      saring(supabase.from('v_ringkasan_mapel_angkatan').select('angkatan, mapel, jumlah')),
    ]);
    for (const r of [minat, bidang, karir, mapel]) throwIfSupabaseError(r.error);
    return { minat: minat.data ?? [], bidang: bidang.data ?? [], karir: karir.data ?? [], mapel: mapel.data ?? [] };
  },
};
