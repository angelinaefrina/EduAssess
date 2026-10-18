import { apiClient } from "./client";
import type { BidangKarir, Mapel, ProfilSaya } from "./types";

/** GET /me – profil + peran pengguna yang login (siswa maupun BK). */
export const getProfilSaya = () => apiClient.get<ProfilSaya>("/me");

/** GET /master/mapel – daftar mapel untuk form onboarding & nilai rapor. */
export const daftarMapel = () =>
  apiClient.get<(Mapel & { is_pilihan: boolean; kelompok: string | null })[]>(
    "/master/mapel"
  );

/** GET /master/bidang-karir */
export const daftarBidangKarir = () =>
  apiClient.get<BidangKarir[]>("/master/bidang-karir");

/** GET /master/karir?q= – picker karir ringan untuk onboarding. */
export const cariKarir = (q?: string, limit?: number) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit !== undefined) params.set("limit", String(limit));
  const qs = params.toString();
  return apiClient.get<
    { id: string; nama: string; bidang_karir_id: number | null; is_trending: boolean }[]
  >(`/master/karir${qs ? `?${qs}` : ""}`);
};

export const masterApi = {
  getProfilSaya,
  daftarMapel,
  daftarBidangKarir,
  cariKarir,
};
