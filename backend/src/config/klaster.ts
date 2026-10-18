/**
 * Aturan pengelompokan siswa (F17/UC15) dan rekomendasi modul (F18/UC16).
 * TITIK AWAL, belum disepakati tim — ubah angka di sini, bukan di service.
 * Mengubah aturan fitur/algoritma wajib menaikkan VERSI_ALGO_KLASTER
 * (tersimpan di klaster_run.versi_algo agar run lama tetap bisa ditelusuri).
 */
export const VERSI_ALGO_KLASTER = 'kmeans-v1';

/** Jumlah inisialisasi k-means++ (dipilih yang inersianya terkecil). */
export const N_INIT = 10;
export const MAKS_ITERASI = 100;

/** Skala mentah fitur, untuk normalisasi min–max tetap (bukan per cakupan). */
export const SKALA_RIASEC = { min: 1, maks: 5 };
export const SKALA_NILAI = { min: 0, maks: 100 };

/**
 * Basis akademik: kolom fitur = mapel yang nilainya dimiliki minimal
 * PORSI_MAPEL_CAKUPAN siswa dalam cakupan. Siswa ikut bila punya nilai untuk
 * minimal PORSI_NILAI_SISWA kolom tsb; sisanya diisi rata-rata cakupan.
 */
export const PORSI_MAPEL_CAKUPAN = 0.5;
export const PORSI_NILAI_SISWA = 0.5;

/** Basis gabungan: bobot blok minat vs akademik (tiap blok dinormalisasi per jumlah dimensi). */
export const BOBOT_GABUNGAN = { minat: 0.5, akademik: 0.5 };

/** Karakteristik klaster: selisih rata-rata mapel klaster vs cakupan (poin rapor). */
export const AMBANG_MAPEL_MENONJOL = 3;
export const MAKS_MAPEL_KARAKTERISTIK = 3;

// --------------------------------------------------------- rekomendasi modul
export const BOBOT_MODUL = { kesenjangan: 0.6, riasec: 0.25, tingkat: 0.15 };
/** Selisih nilai di bawah rata-rata cakupan yang dianggap kesenjangan penuh (skor 1). */
export const SELISIH_KESENJANGAN_PENUH = 15;
/** Modul dengan tingkat di bawah tingkat sasaran (pengulangan) mendapat skor tingkat ini. */
export const SKOR_TINGKAT_DI_BAWAH = 0.5;
/** Mapel modul dianggap relevan untuk klaster bila minimal porsi anggota ini punya nilainya. */
export const PORSI_ANGGOTA_PUNYA_NILAI = 0.5;
export const JUMLAH_REKOMENDASI_DEFAULT = 5;
export const SKOR_MODUL_MINIMUM = 0.2;
