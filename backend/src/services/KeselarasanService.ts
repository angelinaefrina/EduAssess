/**
 * UC08 / F10: keselarasan minat–kemampuan–target untuk target prodi UTAMA.
 * hasil.status ('selaras' | 'tidak_selaras' | 'berisiko') dibaca view v_status_siswa
 * (dashboard BK). Aturan status ada di config/rekomendasi.ts.
 */
import * as A from '../config/rekomendasi';
import { RekomendasiService, type HasilRekomendasi, type SkorProdi } from './RekomendasiService';

export type StatusKeselarasan = 'selaras' | 'tidak_selaras' | 'berisiko';

export function tentukanStatus(target: SkorProdi, jumlahProdi: number): { status: StatusKeselarasan; alasan: string[] } {
  const { minat, akademik } = target.skor;
  const S = A.KESELARASAN;
  const separuhBawah = target.peringkat > Math.ceil(jumlahProdi / 2);

  if (target.peringkat <= S.selaras.peringkatMaks && minat >= S.selaras.minatMin && akademik >= S.selaras.akademikMin) {
    return {
      status: 'selaras',
      alasan: [
        `peringkat ${target.peringkat} dari ${jumlahProdi} (<= ${S.selaras.peringkatMaks})`,
        `minat ${minat} >= ${S.selaras.minatMin}`,
        `akademik ${akademik} >= ${S.selaras.akademikMin}`,
      ],
    };
  }
  const alasanTidak = [
    ...(minat < S.tidakSelaras.minatDiBawah ? [`minat ${minat} < ${S.tidakSelaras.minatDiBawah}`] : []),
    ...(separuhBawah ? [`peringkat ${target.peringkat} dari ${jumlahProdi} (separuh bawah)`] : []),
  ];
  if (alasanTidak.length) return { status: 'tidak_selaras', alasan: alasanTidak };

  const alasan: string[] = [];
  if (target.peringkat > S.selaras.peringkatMaks) alasan.push(`peringkat ${target.peringkat} dari ${jumlahProdi} (di luar ${S.selaras.peringkatMaks} besar)`);
  if (minat < S.selaras.minatMin) alasan.push(`minat ${minat} < ${S.selaras.minatMin}`);
  if (akademik < S.selaras.akademikMin) alasan.push(`akademik ${akademik} < ${S.selaras.akademikMin}`);
  return { status: 'berisiko', alasan };
}

/** Kesenjangan mapel pendukung terhadap rata-rata nilai siswa itu sendiri (F04). */
export function kesenjanganMapel(target: SkorProdi, nilai: Record<string, number>) {
  const daftar = Object.values(nilai);
  const rataRata = daftar.length ? daftar.reduce((a, b) => a + b, 0) / daftar.length : null;
  return {
    rata_rata_siswa: rataRata === null ? null : Math.round(rataRata * 100) / 100,
    mapel: target.akademik.mapel.map((m) => {
      if (m.nilai === null) return { ...m, selisih: null, status: 'tidak_diambil' as const };
      const selisih = rataRata === null ? 0 : Math.round((m.nilai - rataRata) * 100) / 100;
      return { ...m, selisih, status: selisih <= A.KESELARASAN.selisihMapelLemah ? ('di_bawah_rata_rata' as const) : ('aman' as const) };
    }),
  };
}

export const KeselarasanService = {
  async analisis(siswaId: string): Promise<HasilRekomendasi> {
    const k = await RekomendasiService.muatKonteks(siswaId);
    const kurang = [...k.kurang, ...(k.targetUtama ? [] : (['target_prodi_utama'] as const))];
    if (kurang.length) return { tersedia: false, kurang };

    return RekomendasiService.dariCacheAtauHitung(
      siswaId,
      'keselarasan',
      { ...RekomendasiService.inputDasar(k), target_utama: k.targetUtama },
      () => {
        const semua = RekomendasiService.hitungProdi(k.profil, k.katalog.data);
        const target = semua.find((s) => s.prodi.id === k.targetUtama);
        if (!target) throw new Error('Target prodi utama tidak ada di katalog');
        const { status, alasan } = tentukanStatus(target, semua.length);
        return {
          status,
          alasan_status: alasan,
          katalog_draf: RekomendasiService.katalogDraf(k),
          target,
          jumlah_prodi_dinilai: semua.length,
          kesenjangan: kesenjanganMapel(target, k.profil.nilai),
          alternatif: semua
            .filter((s) => s.prodi.id !== k.targetUtama)
            .slice(0, 3)
            .map((s) => ({ peringkat: s.peringkat, prodi: s.prodi, skor: s.skor })),
        };
      },
    );
  },
};
