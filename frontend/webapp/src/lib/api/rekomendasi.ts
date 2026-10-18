import { apiClient } from "./client";
import type {
  DaftarTarget,
  HasilAsesmen,
  HasilRekomendasi,
  Keselarasan,
  Penjelasan,
  RekomendasiJenjang,
  RekomendasiMapel,
  RekomendasiProdi,
  Instrumen,
  SumberTarget,
  TargetKarir,
  TargetProdi,
} from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JawabanRiasec {
  butir_id: number;
  skor: number; // 1–5
}

export interface JawabanKemampuan {
  dimensi_id: number;
  skor: number; // 1–5
}

export interface JawabanAsesmen {
  riasec: JawabanRiasec[];
  kemampuan: JawabanKemampuan[];
}

// ─── Instrumen ────────────────────────────────────────────────────────────────

/**
 * GET /asesmen/instrumen
 * Daftar butir RIASEC + dimensi kemampuan untuk ditampilkan di halaman tes minat.
 */
export const getInstrumen = () => apiClient.get<Instrumen>("/asesmen/instrumen");

// ─── Siswa: kirim & riwayat ───────────────────────────────────────────────────

/**
 * POST /siswa/me/asesmen
 * Kirim jawaban tes minat dan dapatkan skor RIASEC hasil komputasi.
 */
export const kirimAsesmen = (jawaban: JawabanAsesmen) =>
  apiClient.post<HasilAsesmen>("/siswa/me/asesmen", jawaban);

/** GET /siswa/me/asesmen – riwayat semua asesmen yang pernah dikerjakan. */
export const riwayatAsesmen = () =>
  apiClient.get<HasilAsesmen[]>("/siswa/me/asesmen");

/** GET /siswa/me/asesmen/terakhir – hasil asesmen paling terakhir. */
export const terakhirAsesmen = () =>
  apiClient.get<HasilAsesmen | null>("/siswa/me/asesmen/terakhir");

// ─── Target prodi/karir ───────────────────────────────────────────────────────

/** GET /siswa/me/target – daftar target prodi & karir siswa. */
export const getTarget = () => apiClient.get<DaftarTarget>("/siswa/me/target");

/** POST /siswa/me/target-karir – "Simpan sebagai Karir Impian" (idempoten). */
export const simpanTargetKarir = (karir_id: string) =>
  apiClient.post<TargetKarir>("/siswa/me/target-karir", { karir_id });

/**
 * POST /siswa/me/target-prodi – "Jadikan Target" (idempoten).
 * Target prodi pertama otomatis menjadi utama.
 */
export const tambahTargetProdi = (data: {
  prodi_id: string;
  sumber?: SumberTarget;
}) => apiClient.post<TargetProdi>("/siswa/me/target-prodi", data);

/** PATCH /siswa/me/target-prodi/:id – jadikan target prodi utama. */
export const jadikanTargetUtama = (id: string) =>
  apiClient.patch<TargetProdi[]>(`/siswa/me/target-prodi/${id}`, {
    is_utama: true,
  });

/** DELETE /siswa/me/target-prodi/:id – hapus target prodi; kembalikan daftar terbaru. */
export const hapusTargetProdi = (id: string) =>
  apiClient.del<TargetProdi[]>(`/siswa/me/target-prodi/${id}`);

// ─── Hasil rekomendasi backend (UC04/06/07/08) ───────────────────────────────

export const rekomendasiProdi = () =>
  apiClient.get<HasilRekomendasi<RekomendasiProdi>>("/siswa/me/rekomendasi/prodi");

export const rekomendasiMapel = () =>
  apiClient.get<HasilRekomendasi<RekomendasiMapel>>("/siswa/me/rekomendasi/mapel");

export const rekomendasiJenjang = () =>
  apiClient.get<HasilRekomendasi<RekomendasiJenjang>>("/siswa/me/rekomendasi/jenjang");

export const keselarasan = () => apiClient.get<HasilRekomendasi<Keselarasan>>("/siswa/me/keselarasan");

/** POST /siswa/me/rekomendasi/:jenis/penjelasan – penjelasan naratif (LLM / template). */
export const penjelasan = (jenis: "prodi" | "mapel" | "jenjang" | "keselarasan") =>
  apiClient.post<Penjelasan>(`/siswa/me/rekomendasi/${jenis}/penjelasan`);

export const rekomendasiApi = {
  getInstrumen,
  kirimAsesmen,
  riwayatAsesmen,
  terakhirAsesmen,
  getTarget,
  simpanTargetKarir,
  tambahTargetProdi,
  jadikanTargetUtama,
  hapusTargetProdi,
};

