import { apiClient, makeApiClient } from "./client";
import type { Perkembangan, SiswaSaya } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

// Samakan dengan enum di supabase/migrations (peminatan_sekolah, gaya_belajar, jenjang_pendidikan).
export type Peminatan = "IPA" | "IPS" | "Bahasa" | "Merdeka" | "SMK";
export type GayaBelajar = "praktik" | "teori" | "seimbang";
export type JenjangPendidikan = "D3" | "D4" | "S1" | "kedinasan" | "langsung_kerja";

export interface ProfilInput {
  nama: string;
  tingkat: number;
  peminatan: Peminatan;
  rombel?: string | null;
  angkatan?: number | null;
}

export interface PreferensiInput {
  gaya_belajar: GayaBelajar | null;
  ingin_cepat_kerja: boolean | null;
  pertimbangan_biaya: number | null;
  jenjang_diminati: JenjangPendidikan[];
}

export type TargetKarirItem =
  | { karir_id: string }
  | { teks_bebas: string };

export interface OnboardingInput {
  profil: ProfilInput;
  preferensi?: PreferensiInput;
  mapel_ids?: number[];
  mapel_favorit_ids?: number[];
  bidang_karir_ids?: number[];
  target_karir?: TargetKarirItem[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** GET /siswa/me – profil lengkap siswa yang sedang login. */
export const getMe = () => apiClient.get<SiswaSaya>("/siswa/me");

/** POST /siswa/me/kode-bk – daftarkan siswa ke sekolah via kode dari BK. */
export const gabungSekolah = (kode: string) =>
  apiClient.post("/siswa/me/kode-bk", { kode });

/** POST /siswa/me/onboarding – isi profil awal siswa. */
export const onboarding = (data: OnboardingInput) =>
  apiClient.post("/siswa/me/onboarding", data);

/** PUT /siswa/me/profil – perbarui profil siswa. */
export const ubahProfil = (data: ProfilInput) =>
  apiClient.put("/siswa/me/profil", data);

/** PUT /siswa/me/preferensi – perbarui preferensi belajar/karir. */
export const ubahPreferensi = (data: PreferensiInput) =>
  apiClient.put("/siswa/me/preferensi", data);

/** PUT /siswa/me/mapel – set daftar mapel yang diambil siswa. */
export const ubahMapel = (mapel_ids: number[]) =>
  apiClient.put("/siswa/me/mapel", { mapel_ids });

/** PUT /siswa/me/mapel-favorit – set hingga 3 mapel favorit. */
export const ubahMapelFavorit = (mapel_ids: number[]) =>
  apiClient.put("/siswa/me/mapel-favorit", { mapel_ids });

/** PUT /siswa/me/bidang-karir – set bidang karir yang diminati. */
export const ubahBidangKarir = (bidang_karir_ids: number[]) =>
  apiClient.put("/siswa/me/bidang-karir", { bidang_karir_ids });

/** PUT /siswa/me/target-karir – ganti daftar target karir. */
export const ubahTargetKarir = (target_karir: TargetKarirItem[]) =>
  apiClient.put("/siswa/me/target-karir", { target_karir });

/** DELETE /siswa/me/target-karir/:id – hapus satu target karir. */
export const hapusTargetKarir = (id: string) =>
  apiClient.del(`/siswa/me/target-karir/${id}`);

/** GET /siswa/me/perkembangan – perubahan minat & nilai antar waktu (UC12). */
export const perkembangan = () => apiClient.get<Perkembangan>("/siswa/me/perkembangan");

// ─── Server-side variant (token eksplisit) ────────────────────────────────────

/** Versi server-side: perlu access_token dari sesi Supabase server. */
export const siswaApiServer = (token: string) => {
  const c = makeApiClient(token);
  return {
    getMe: () => c.get<SiswaSaya>("/siswa/me"),
  };
};

export const siswaApi = {
  getMe,
  gabungSekolah,
  onboarding,
  ubahProfil,
  ubahPreferensi,
  ubahMapel,
  ubahMapelFavorit,
  ubahBidangKarir,
  ubahTargetKarir,
  hapusTargetKarir,
};

