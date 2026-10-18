import { apiClient } from "./client";
import type {
  BidangStudi,
  DetailKarir,
  DetailProdi,
  Halaman,
  JenisPendidikan,
  KarirRingkas,
  ProdiRingkas,
} from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { JenisPendidikan };

export interface ProdiFilter {
  q?: string;
  bidang_studi?: string;
  jenis?: JenisPendidikan;
  limit?: number;
  offset?: number;
}

export interface KarirFilter {
  q?: string;
  bidang_karir?: string;
  trending?: boolean;
  limit?: number;
  offset?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** GET /katalog/bidang-studi – daftar semua bidang studi. */
export const daftarBidangStudi = () =>
  apiClient.get<BidangStudi[]>("/katalog/bidang-studi");

/** GET /katalog/prodi – daftar program studi dengan filter & paginasi. */
export const daftarProdi = (filter: ProdiFilter = {}) => {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.bidang_studi) params.set("bidang_studi", filter.bidang_studi);
  if (filter.jenis) params.set("jenis", filter.jenis);
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  const qs = params.toString();
  return apiClient.get<Halaman<ProdiRingkas>>(`/katalog/prodi${qs ? `?${qs}` : ""}`);
};

/** GET /katalog/prodi/:id – detail satu program studi. */
export const detailProdi = (id: string) =>
  apiClient.get<DetailProdi>(`/katalog/prodi/${id}`);

/** GET /katalog/karir – daftar karir dengan filter & paginasi. */
export const daftarKarir = (filter: KarirFilter = {}) => {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.bidang_karir) params.set("bidang_karir", filter.bidang_karir);
  if (filter.trending !== undefined)
    params.set("trending", filter.trending ? "true" : "false");
  if (filter.limit !== undefined) params.set("limit", String(filter.limit));
  if (filter.offset !== undefined) params.set("offset", String(filter.offset));
  const qs = params.toString();
  return apiClient.get<Halaman<KarirRingkas>>(`/katalog/karir${qs ? `?${qs}` : ""}`);
};

/** GET /katalog/karir/:id – detail satu karir. */
export const detailKarir = (id: string) =>
  apiClient.get<DetailKarir>(`/katalog/karir/${id}`);

/** Seluruh prodi (backend membatasi 100 per halaman, jadi diambil bertahap). */
export async function semuaProdi(filter: Omit<ProdiFilter, "limit" | "offset"> = {}) {
  const hasil: ProdiRingkas[] = [];
  for (let offset = 0; ; offset += 100) {
    const hal = await daftarProdi({ ...filter, limit: 100, offset });
    hasil.push(...hal.items);
    if (hal.items.length === 0 || hasil.length >= hal.total) return hasil;
  }
}

export const katalogApi = {
  daftarBidangStudi,
  daftarProdi,
  detailProdi,
  daftarKarir,
  detailKarir,
  semuaProdi,
};

