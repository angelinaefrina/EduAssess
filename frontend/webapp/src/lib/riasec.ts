import type { JenisPendidikan, MapelPendukung, SiswaSaya, TipeRiasec } from "./api/types";

export const NAMA_RIASEC: Record<TipeRiasec, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

/**
 * Skor kecocokan sederhana kode RIASEC prodi/karir vs kode Holland siswa:
 * huruf yang sama mendapat bobot sesuai urutannya (60–98).
 * SEMENTARA: dipakai sampai backend punya modul rekomendasi sendiri.
 */
export function skorKecocokan(kodeTarget: string | null, kodeSiswa: string | null): number | null {
  if (!kodeTarget || !kodeSiswa) return null;
  let skor = 0;
  [...kodeTarget].forEach((huruf, i) => {
    const j = kodeSiswa.indexOf(huruf);
    if (j === -1) return;
    skor += (3 - i) * (j === i ? 1 : 0.7);
  });
  return Math.round(60 + (skor / 6) * 38);
}

/** Rata-rata nilai terakhir siswa pada mapel pendukung, dibobot; null bila belum ada nilai. */
export function skorMapelPendukung(mapel: MapelPendukung[]): number | null {
  let total = 0;
  let bobot = 0;
  for (const m of mapel) {
    if (m.nilai_terakhir_siswa == null) continue;
    total += Number(m.nilai_terakhir_siswa) * Number(m.bobot);
    bobot += Number(m.bobot);
  }
  return bobot > 0 ? Math.round((total / bobot) * 10) / 10 : null;
}

export function labelJenis(jenis: JenisPendidikan[] | null | undefined) {
  if (!jenis?.length) return "-";
  return jenis.map((j) => (j === "vokasi" ? "Vokasi" : "Akademik")).join(" / ");
}

export function infoKelas(me: SiswaSaya | null) {
  const s = me?.siswa;
  if (!s?.tingkat) return "Profil belum lengkap";
  return [`Kelas ${s.tingkat}${s.rombel ? ` ${s.rombel}` : ""}`, s.peminatan]
    .filter(Boolean)
    .join(" ");
}

/** Label ramah untuk prasyarat rekomendasi yang belum dipenuhi (field `kurang`). */
export const LABEL_KURANG: Record<string, { label: string; href: string }> = {
  profil: { label: "Lengkapi profil (onboarding)", href: "/onboarding" },
  tes_minat: { label: "Kerjakan tes minat RIASEC", href: "/tes-minat" },
  nilai_rapor: { label: "Isi nilai rapor", href: "/nilai-rapor" },
  preferensi_pendidikan: { label: "Isi preferensi pendidikan", href: "/onboarding" },
  target_prodi_utama: { label: "Pilih target prodi utama", href: "/katalog-prodi" },
  katalog: { label: "Katalog prodi belum tersedia", href: "/katalog-prodi" },
};

export const persen = (x: number | null | undefined) => (x == null ? "–" : `${Math.round(x * 100)}%`);

export const tanggal = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "–";

export function pesanError(err: unknown) {
  return err instanceof Error && err.name === "ApiError" ? err.message : "Gagal memuat data. Coba lagi.";
}
