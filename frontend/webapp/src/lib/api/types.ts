/**
 * Shape response backend (isi `data` setelah dibuka oleh client.ts).
 * Selaraskan dengan select() di backend/src/models bila kolomnya berubah.
 */

export type Peran = "siswa" | "bk";
export type TipeRiasec = "R" | "I" | "A" | "S" | "E" | "C";
export type StatusVerifikasi = "menunggu" | "terverifikasi" | "ditolak";
export type SumberTarget = "rekomendasi" | "katalog" | "eksplorasi_karir";

export interface Sekolah {
  id: string;
  nama: string;
  npsn: string | null;
  kota: string | null;
}

/** GET /me */
export interface ProfilSaya {
  id: string;
  peran: Peran;
  nama: string | null;
  sekolah_id: string | null;
  sekolah: Sekolah | null;
}

export interface Mapel {
  id: number;
  kode: string;
  nama: string;
}

export interface BidangKarir {
  id: number;
  kode: string;
  nama: string;
}

export interface TargetKarir {
  id: string;
  teks_bebas: string | null;
  sumber: SumberTarget;
  created_at: string;
  karir: { id: string; nama: string; bidang_karir_id: number | null } | null;
}

export interface TargetProdi {
  id: string;
  is_utama: boolean;
  sumber: SumberTarget;
  created_at: string;
  prodi: {
    id: string;
    nama: string;
    kode_riasec: string | null;
    jenis_pendidikan: "akademik" | "vokasi";
    bidang_studi: { id: number; kode: string; nama: string } | null;
  } | null;
}

/** GET /siswa/me */
export interface SiswaSaya {
  profil: { id: string; nama: string | null; sekolah: Sekolah | null };
  /** null = belum pernah onboarding */
  siswa: {
    id: string;
    tingkat: number | null;
    rombel: string | null;
    peminatan: string | null;
    angkatan: number | null;
    onboarding_selesai: boolean;
  } | null;
  preferensi: Record<string, unknown> | null;
  mapel: { mapel: Mapel }[];
  mapel_favorit: { mapel: Mapel }[];
  bidang_karir: { bidang_karir: BidangKarir }[];
  target_karir: TargetKarir[];
  kelengkapan: {
    lengkap: boolean;
    kurang: ("nama" | "tingkat" | "peminatan" | "sekolah")[];
  };
}

/** GET /asesmen/instrumen */
export interface Instrumen {
  riasec: { id: number; pernyataan: string; urutan: number }[];
  kemampuan: { id: number; pernyataan: string; urutan: number }[];
  skala: { min: number; maks: number };
}

/** GET /siswa/me/asesmen/terakhir (null bila belum pernah tes) */
export interface HasilAsesmen {
  asesmen_id: string;
  selesai_at: string;
  /** Rata-rata skor 1–5 per tipe */
  riasec: Partial<Record<TipeRiasec, number>> | null;
  kode_holland: string | null;
  kemampuan: Record<string, number> | null;
  semester: number | null;
}

export interface NilaiRapor {
  id: string;
  semester: number;
  nilai: number;
  sumber: string;
  status: StatusVerifikasi;
  diverifikasi_at: string | null;
  created_at: string;
  updated_at: string;
  mapel: Mapel | null;
}

/** GET /siswa/me/nilai */
export interface DaftarNilai {
  semester_maks: number | null;
  nilai: NilaiRapor[];
}

/** GET /siswa/me/target */
export interface DaftarTarget {
  karir: TargetKarir[];
  prodi: TargetProdi[];
}

/** Response list katalog berpaginasi */
export interface Halaman<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Katalog (GET /katalog/...) ──────────────────────────────────────────────

export type JenisPendidikan = "akademik" | "vokasi";

export interface BidangStudi {
  id: number;
  kode: string;
  nama: string;
  deskripsi?: string | null;
}

/** Item GET /katalog/prodi */
export interface ProdiRingkas {
  id: string;
  nama: string;
  kode_riasec: string | null;
  jenis_pendidikan: JenisPendidikan[];
  sumber_url: string | null;
  catatan_sumber: string | null;
  bidang_studi: { id: number; kode: string; nama: string } | null;
}

/** Item GET /katalog/karir */
export interface KarirRingkas {
  id: string;
  nama: string;
  kode_riasec: string | null;
  is_trending: boolean;
  catatan_sumber: string | null;
  bidang_karir: BidangKarir | null;
}

/** Mapel pendukung prodi/karir; nilai_terakhir_siswa hanya ada untuk peran siswa. */
export interface MapelPendukung {
  mapel: Mapel;
  bobot: number;
  nilai_terakhir_siswa?: number | null;
}

/** GET /katalog/prodi/:id */
export interface DetailProdi extends ProdiRingkas {
  deskripsi: string | null;
  mapel_pendukung: MapelPendukung[];
  contoh_karir: { id: string; nama: string; kode_riasec: string | null; is_trending: boolean }[];
  perguruan_tinggi: {
    id: string;
    nama: string;
    jenis: JenisPendidikan;
    kota: string | null;
    situs_url: string | null;
    jenjang: string;
    sumber_url: string | null;
  }[];
  status_target?: { tersimpan: boolean; target_id: string | null; is_utama: boolean };
}

/** GET /katalog/karir/:id */
export interface DetailKarir extends KarirRingkas {
  deskripsi: string | null;
  sumber_url: string | null;
  prodi_relevan: Omit<ProdiRingkas, "sumber_url" | "catatan_sumber">[];
  mapel_pendukung: MapelPendukung[];
  status_target?: { tersimpan: boolean; target_id: string | null };
}

// ─── Rekomendasi & keselarasan (GET /siswa/me/rekomendasi/..., /bk/siswa/:id/...) ─

export type Kekurangan =
  | "profil"
  | "tes_minat"
  | "nilai_rapor"
  | "preferensi_pendidikan"
  | "target_prodi_utama"
  | "katalog";

/** Bungkus semua hasil rekomendasi: tersedia=false berarti data siswa belum lengkap. */
export type HasilRekomendasi<T> =
  | { tersedia: false; kurang: Kekurangan[] }
  | {
      tersedia: true;
      hasil: T;
      penjelasan: string | null;
      model_llm: string | null;
      dari_cache: boolean;
      dibuat_at: string;
    };

export interface SkorProdi {
  peringkat: number;
  prodi: {
    id: string;
    nama: string;
    kode_riasec: string | null;
    jenis_pendidikan: JenisPendidikan[];
    bidang_studi: { id: number; kode: string; nama: string } | null;
    catatan_sumber: string | null;
  };
  /** Semua skor 0–1. */
  skor: { total: number; minat: number; akademik: number; karir: number };
  akademik: {
    cakupan: number;
    rata_rata_mapel_diambil: number;
    data_kurang: boolean;
    mapel: { kode: string; nama: string; bobot: number; nilai: number | null }[];
  };
  karir: { alasan: "target_karir" | "bidang_karir" | null; cocok: string[] };
  contoh_karir: { id: string; nama: string }[];
}

export interface RekomendasiProdi {
  bobot: { minat: number; akademik: number; karir: number };
  tingkat: number | null;
  kode_holland: string | null;
  katalog_draf: boolean;
  jumlah_prodi_dinilai: number;
  prodi: (SkorProdi & { sesuai_preferensi_jenjang: boolean | null })[];
  rumpun: { bidang_studi: SkorProdi["prodi"]["bidang_studi"]; skor: number; prodi_terbaik: string }[];
}

export interface RekomendasiMapel {
  relevan: boolean;
  katalog_draf: boolean;
  prodi_kandidat: { id: string; nama: string; sebagai: "target_utama" | "rekomendasi"; skor_total: number }[];
  mapel: {
    mapel: { id: number; kode: string; nama: string };
    skor: number;
    nilai_siswa: number | null;
    sudah_diambil: boolean;
    dukungan: { prodi: string; sebagai: string; bobot: number }[];
  }[];
}

export interface RekomendasiJenjang {
  preferensi: Record<string, unknown>;
  jenjang: { jenjang: string; jalur: string | undefined; poin: number; alasan: string[] }[];
  catatan: string | null;
}

export type StatusKeselarasan = "selaras" | "tidak_selaras" | "berisiko";

export interface Keselarasan {
  status: StatusKeselarasan;
  alasan_status: string[];
  katalog_draf: boolean;
  target: SkorProdi;
  jumlah_prodi_dinilai: number;
  kesenjangan: {
    rata_rata_siswa: number | null;
    mapel: {
      kode: string;
      nama: string;
      bobot: number;
      nilai: number | null;
      selisih: number | null;
      status: "tidak_diambil" | "di_bawah_rata_rata" | "aman";
    }[];
  };
  alternatif: { peringkat: number; prodi: SkorProdi["prodi"]; skor: SkorProdi["skor"] }[];
}

export interface Penjelasan {
  penjelasan: string | null;
  model: string;
  dari_cache?: boolean;
  alasan?: string;
}

// ─── Perkembangan (GET /siswa/me/perkembangan, /bk/siswa/:id/perkembangan) ──

export interface Perkembangan {
  minat: {
    riwayat: (HasilAsesmen & { kode_holland: string | null })[];
    perubahan: {
      dari: { semester: number | null; selesai_at: string; kode_holland: string | null };
      ke: { semester: number | null; selesai_at: string; kode_holland: string | null };
      kode_holland_berubah: boolean;
      selisih_per_tipe: Record<TipeRiasec, number>;
    } | null;
  };
  nilai: {
    semester: number[];
    per_mapel: { mapel: Mapel; nilai: Record<number, { nilai: number; status: StatusVerifikasi }> }[];
    rata_rata_per_semester: { semester: number; rata_rata: number; jumlah_mapel: number }[];
    perubahan: {
      dari_semester: number;
      ke_semester: number;
      rata_rata_mapel_sama: { dari: number | null; ke: number | null };
      mapel: { mapel: Mapel; dari: number; ke: number; selisih: number }[];
    } | null;
  };
}

// ─── Panel BK ────────────────────────────────────────────────────────────────

export type StatusDashboard =
  | StatusKeselarasan
  | "belum_dianalisis"
  | "perlu_dianalisis_ulang"
  | "tanpa_target";

export type Penanda =
  | "profil_belum_lengkap"
  | "belum_asesmen"
  | "belum_isi_nilai"
  | "nilai_menunggu"
  | StatusDashboard;

export interface SiswaDashboard {
  siswa_id: string;
  nama: string | null;
  tingkat: number | null;
  rombel: string | null;
  angkatan: number | null;
  kode_holland: string | null;
  keselarasan: { status: StatusDashboard; status_terakhir: string | null; dihitung_at: string | null };
  penanda: Penanda[];
}

export interface DashboardBk extends Halaman<SiswaDashboard> {
  jumlah_per_penanda: Record<Penanda, number>;
}

export interface CatatanKonseling {
  id: string;
  siswa_id: string;
  bk_id: string | null;
  isi: string;
  tindak_lanjut: string | null;
  created_at: string;
  updated_at: string;
  bk: { nama: string | null } | null;
}

export interface DetailSiswaBk extends SiswaSaya {
  target_prodi: TargetProdi[];
  asesmen_terakhir: HasilAsesmen | null;
  nilai: { jumlah: number; per_status: Record<StatusVerifikasi, number> };
  keselarasan: SiswaDashboard["keselarasan"] | null;
  penanda: Penanda[];
  catatan_terbaru: CatatanKonseling[];
}

export interface KodeBk {
  id: string;
  kode: string;
  sekolah_id: string;
  dibuat_oleh: string | null;
  aktif: boolean;
  berlaku_sampai: string | null;
  created_at: string;
}

export interface RingkasanBk {
  filter_angkatan: number | null | "semua";
  angkatan_tersedia: { angkatan: number | null; jumlah_siswa: number }[];
  jumlah_siswa: number;
  jumlah_sudah_asesmen: number;
  minat_dominan: { nama: string; jumlah: number }[];
  rumpun_target: { nama: string; jumlah: number }[];
  bidang_karir_target: { nama: string; jumlah: number }[];
  mapel_pilihan: { nama: string; jumlah: number }[];
}

export interface SiswaRingkas {
  siswa_id: string | null;
  nama: string | null;
  tingkat: number | null;
  rombel: string | null;
  angkatan: number | null;
}

export interface NilaiSiswaBk {
  siswa: SiswaRingkas;
  semester_maks: number | null;
  nilai: NilaiRapor[];
}

export interface HasilImporNilai {
  semester: number;
  jumlah_siswa: number;
  jumlah_nilai: number;
  sel_kosong_dilewati: number;
  kolom_diabaikan: string[];
}
