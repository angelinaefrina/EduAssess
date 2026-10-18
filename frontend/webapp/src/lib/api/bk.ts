import { apiClient } from "./client";
import type {
  CatatanKonseling,
  DashboardBk,
  DetailSiswaBk,
  HasilImporNilai,
  HasilRekomendasi,
  Keselarasan,
  KodeBk,
  NilaiSiswaBk,
  Penanda,
  Penjelasan,
  Perkembangan,
  RekomendasiJenjang,
  RekomendasiMapel,
  RekomendasiProdi,
  RingkasanBk,
  SiswaRingkas,
} from "./types";

const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

/** Filter angkatan: angka tahun, "kosong" (belum diisi), atau undefined (semua). */
export type FilterAngkatan = number | "kosong" | undefined;

// ─── Kode BK ─────────────────────────────────────────────────────────────────

/** POST /bk/kode – buat kode baru untuk siswa bergabung ke sekolah. */
export const buatKode = (data?: { berlaku_sampai?: string | null }) =>
  apiClient.post<KodeBk>("/bk/kode", data ?? {});

/** GET /bk/kode – daftar kode sekolah milik BK yang login. */
export const daftarKode = () => apiClient.get<KodeBk[]>("/bk/kode");

/** PATCH /bk/kode/:id – aktifkan/nonaktifkan atau ubah masa berlaku kode. */
export const ubahKode = (id: string, fields: { aktif?: boolean; berlaku_sampai?: string | null }) =>
  apiClient.patch<KodeBk>(`/bk/kode/${id}`, fields);

// ─── Dashboard & detail siswa (UC10) ─────────────────────────────────────────

export interface FilterDashboard {
  q?: string;
  tingkat?: number;
  rombel?: string;
  angkatan?: FilterAngkatan;
  penanda?: Penanda;
  limit?: number;
  offset?: number;
}

/** GET /bk/siswa – daftar siswa sekolah + penanda & status keselarasan. */
export const dashboardSiswa = (f: FilterDashboard = {}) =>
  apiClient.get<DashboardBk>(`/bk/siswa${qs({ ...f })}`);

/** GET /bk/siswa/:id – detail siswa (read-only) + catatan terbaru. */
export const detailSiswa = (siswaId: string) => apiClient.get<DetailSiswaBk>(`/bk/siswa/${siswaId}`);

/** DELETE /bk/siswa/:id/sekolah – keluarkan siswa dari sekolah (data siswa tetap). */
export const keluarkanSiswa = (siswaId: string) => apiClient.del<void>(`/bk/siswa/${siswaId}/sekolah`);

/** POST /bk/keselarasan/segarkan – hitung ulang keselarasan semua siswa bertarget. */
export const segarkanKeselarasan = () =>
  apiClient.post<{ diperiksa: number; dihitung_baru: number; dari_cache: number; data_belum_lengkap: number }>(
    "/bk/keselarasan/segarkan"
  );

// ─── Ringkasan angkatan (UC13) ───────────────────────────────────────────────

/** GET /bk/ringkasan?angkatan= */
export const ringkasan = (angkatan?: FilterAngkatan) =>
  apiClient.get<RingkasanBk>(`/bk/ringkasan${qs({ angkatan })}`);

// ─── Catatan konseling (UC11) ────────────────────────────────────────────────

export const daftarCatatan = (siswaId: string) =>
  apiClient.get<CatatanKonseling[]>(`/bk/siswa/${siswaId}/catatan`);

export const tambahCatatan = (siswaId: string, body: { isi: string; tindak_lanjut?: string | null }) =>
  apiClient.post<CatatanKonseling>(`/bk/siswa/${siswaId}/catatan`, body);

export const ubahCatatan = (id: string, body: { isi?: string; tindak_lanjut?: string | null }) =>
  apiClient.patch<CatatanKonseling>(`/bk/catatan/${id}`, body);

export const hapusCatatan = (id: string) => apiClient.del<void>(`/bk/catatan/${id}`);

// ─── Rekomendasi, keselarasan & perkembangan siswa ───────────────────────────

export const rekomendasiProdiSiswa = (siswaId: string) =>
  apiClient.get<HasilRekomendasi<RekomendasiProdi>>(`/bk/siswa/${siswaId}/rekomendasi/prodi`);

export const rekomendasiMapelSiswa = (siswaId: string) =>
  apiClient.get<HasilRekomendasi<RekomendasiMapel>>(`/bk/siswa/${siswaId}/rekomendasi/mapel`);

export const rekomendasiJenjangSiswa = (siswaId: string) =>
  apiClient.get<HasilRekomendasi<RekomendasiJenjang>>(`/bk/siswa/${siswaId}/rekomendasi/jenjang`);

export const keselarasanSiswa = (siswaId: string) =>
  apiClient.get<HasilRekomendasi<Keselarasan>>(`/bk/siswa/${siswaId}/keselarasan`);

export const penjelasanSiswa = (siswaId: string, jenis: "prodi" | "mapel" | "jenjang" | "keselarasan") =>
  apiClient.post<Penjelasan>(`/bk/siswa/${siswaId}/rekomendasi/${jenis}/penjelasan`);

export const perkembanganSiswa = (siswaId: string) =>
  apiClient.get<Perkembangan>(`/bk/siswa/${siswaId}/perkembangan`);

// ─── Nilai rapor (verifikasi & impor) ────────────────────────────────────────

/** GET /bk/nilai/menunggu – siswa yang punya nilai menunggu verifikasi. */
export const nilaiMenunggu = () =>
  apiClient.get<(SiswaRingkas & { jumlah_menunggu: number })[]>("/bk/nilai/menunggu");

/** GET /bk/siswa/:id/nilai – semua nilai rapor satu siswa. */
export const nilaiSiswa = (siswaId: string) => apiClient.get<NilaiSiswaBk>(`/bk/siswa/${siswaId}/nilai`);

/** POST /bk/siswa/:id/nilai/verifikasi – setujui/tolak (semua yang menunggu bila ids kosong). */
export const putuskanNilai = (
  siswaId: string,
  body: { status: "terverifikasi" | "ditolak"; ids?: string[] }
) =>
  apiClient.post<{ status: string; jumlah: number; ids: string[] }>(
    `/bk/siswa/${siswaId}/nilai/verifikasi`,
    body
  );

/** GET /bk/nilai/template – unduh template CSV (butuh header Authorization, jadi lewat fetch). */
export const unduhTemplate = async (params: { semester: number; tingkat?: number }) => {
  const blob = await apiClient.getBlob(`/bk/nilai/template${qs(params)}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template-nilai-semester-${params.semester}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** POST /bk/nilai/impor – impor nilai satu semester dari isi CSV. */
export const imporNilai = (semester: number, csv: string) =>
  apiClient.post<HasilImporNilai>("/bk/nilai/impor", { semester, csv });
