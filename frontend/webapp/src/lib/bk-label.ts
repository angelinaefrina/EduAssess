import type { Penanda, StatusDashboard, StatusVerifikasi } from "./api/types";

type Nada = "ok" | "warn" | "bad" | "info" | "";

export const LABEL_PENANDA: Record<Penanda, { label: string; nada: Nada }> = {
  profil_belum_lengkap: { label: "Profil belum lengkap", nada: "warn" },
  belum_asesmen: { label: "Belum tes minat", nada: "warn" },
  belum_isi_nilai: { label: "Belum isi nilai", nada: "warn" },
  nilai_menunggu: { label: "Nilai menunggu verifikasi", nada: "info" },
  selaras: { label: "Selaras", nada: "ok" },
  berisiko: { label: "Berisiko", nada: "warn" },
  tidak_selaras: { label: "Tidak selaras", nada: "bad" },
  belum_dianalisis: { label: "Belum dianalisis", nada: "" },
  perlu_dianalisis_ulang: { label: "Perlu dianalisis ulang", nada: "" },
  tanpa_target: { label: "Tanpa target prodi", nada: "" },
};

export const URUTAN_PENANDA: Penanda[] = [
  "tidak_selaras",
  "berisiko",
  "selaras",
  "nilai_menunggu",
  "belum_asesmen",
  "belum_isi_nilai",
  "profil_belum_lengkap",
  "tanpa_target",
  "belum_dianalisis",
  "perlu_dianalisis_ulang",
];

export const LABEL_STATUS_NILAI: Record<StatusVerifikasi, { label: string; nada: Nada }> = {
  menunggu: { label: "Menunggu", nada: "info" },
  terverifikasi: { label: "Terverifikasi", nada: "ok" },
  ditolak: { label: "Ditolak", nada: "bad" },
};

export const badge = (nada: Nada) => `app-badge${nada ? ` app-badge--${nada}` : ""}`;

export const labelStatus = (s: StatusDashboard | string | null | undefined) =>
  s ? LABEL_PENANDA[s as Penanda] ?? { label: s, nada: "" as Nada } : { label: "–", nada: "" as Nada };

export const kelasSiswa = (s: { tingkat: number | null; rombel: string | null }) =>
  s.tingkat ? `Kelas ${s.tingkat}${s.rombel ? ` ${s.rombel}` : ""}` : "–";
