/**
 * Aturan bisnis rekomendasi (modul 7) — DISEPAKATI TIM 2026-10-16.
 * Ubah angka di sini, bukan di service. Jangan menyetel angka ini berdasarkan
 * data sintetis (lihat CLAUDE.md). Mengubah apa pun di file ini wajib menaikkan
 * VERSI_ALGO agar cache hasil_rekomendasi lama tidak dipakai lagi.
 */
import type { Database } from '../../types/database';

type Jenjang = Database['public']['Enums']['jenjang_pendidikan'];

// v2 (2026-10-16): skor akademik = rata-rata tertimbang × cakupan, yaitu mapel
// pendukung yang tidak diambil siswa dihitung 0 (sebelumnya diabaikan, sehingga prodi
// yang mapel intinya tidak diambil ikut bernilai tinggi).
export const VERSI_ALGO = 'katalog-v2';

/** Bobot skor total prodi (minat / akademik / karir) per tingkat kelas (F05). */
export const BOBOT_PER_TINGKAT: Record<number, { minat: number; akademik: number; karir: number }> = {
  10: { minat: 0.6, akademik: 0.3, karir: 0.1 },
  11: { minat: 0.5, akademik: 0.4, karir: 0.1 },
  12: { minat: 0.45, akademik: 0.45, karir: 0.1 },
};

/** Bobot posisi huruf kode RIASEC prodi (huruf ke-1, ke-2, ke-3). */
export const BOBOT_POSISI_RIASEC = [3, 2, 1];

/** Skor karir: target karir terhubung langsung ke prodi / hanya bidang karir yang sama. */
export const SKOR_KARIR = { targetLangsung: 1, bidangSama: 0.5 };

/** Prodi ditandai data akademik kurang bila nilai siswa menutup < 50% bobot mapel pendukung. */
export const CAKUPAN_AKADEMIK_MIN = 0.5;

export const JUMLAH_PRODI_DITAMPILKAN = 10;
/** UC06: prodi kandidat = target utama + N prodi teratas. */
export const JUMLAH_KANDIDAT_MAPEL = 3;

/** UC08: aturan status keselarasan target prodi utama. */
export const KESELARASAN = {
  selaras: { peringkatMaks: 5, minatMin: 0.6, akademikMin: 0.6 },
  tidakSelaras: { minatDiBawah: 0.4 /* atau peringkat di separuh bawah */ },
  /** Mapel pendukung ditandai "di bawah rata-rata diri" bila selisihnya <= -5 poin. */
  selisihMapelLemah: -5,
};

/**
 * UC07: jenjang direkomendasikan HANYA dari preferensi pendidikan di profil siswa.
 * Poin per sinyal; jenjang diurutkan dari total poin tertinggi.
 */
export const JENJANG_DIREKOMENDASIKAN: Exclude<Jenjang, 'langsung_kerja'>[] = ['S1', 'D4', 'D3', 'kedinasan'];
export const POIN_JENJANG = {
  /** Jenjang yang dipilih sendiri oleh siswa (jenjang_diminati). */
  dipilihSiswa: 3,
  ingin_cepat_kerja: { D3: 2, D4: 1 } as Partial<Record<Jenjang, number>>,
  gaya_belajar: {
    praktik: { D3: 1, D4: 1 },
    teori: { S1: 1 },
    seimbang: {},
  } as Record<string, Partial<Record<Jenjang, number>>>,
  /** pertimbangan_biaya (Likert 1–5) >= ambang: jalur yang umumnya lebih terjangkau. */
  biaya: { ambang: 4, poin: { kedinasan: 1, D3: 1 } as Partial<Record<Jenjang, number>> },
};
