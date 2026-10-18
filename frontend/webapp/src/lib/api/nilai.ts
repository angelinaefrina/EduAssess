import { apiClient } from "./client";
import type { DaftarNilai } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NilaiItem {
  mapel_id: number;
  nilai: number;
}

// ─── Siswa ────────────────────────────────────────────────────────────────────

/** GET /siswa/me/nilai – semua nilai rapor siswa yang sedang login. */
export const daftarNilai = () => apiClient.get<DaftarNilai>("/siswa/me/nilai");

/** PUT /siswa/me/nilai/semester/:semester – simpan/timpa nilai satu semester. */
export const simpanSemester = (semester: number, nilai: NilaiItem[]) =>
  apiClient.put<DaftarNilai>(`/siswa/me/nilai/semester/${semester}`, { nilai });

/** DELETE /siswa/me/nilai/:id – hapus satu entri nilai. */
export const hapusNilai = (id: string) =>
  apiClient.del<void>(`/siswa/me/nilai/${id}`);

export const nilaiApi = {
  daftarNilai,
  simpanSemester,
  hapusNilai,
};

