import { AppError } from '../middleware/errorHandler';
import { AsesmenModel } from '../models/asesmen.model';
import { SiswaModel } from '../models/siswa.model';

export interface JawabanAsesmen {
  riasec: { butir_id: number; skor: number }[];
  kemampuan: { dimensi_id: number; skor: number }[];
}

/**
 * Semester (1–6) dari tingkat kelas dan bulan saat ini di WIB.
 * Juli–Desember = semester ganjil, Januari–Juni = semester genap.
 */
export function hitungSemester(tingkat: number | null, sekarang = new Date()): number | null {
  if (!tingkat) return null;
  const bulan = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', month: 'numeric' }).format(sekarang),
  );
  return (tingkat - 10) * 2 + (bulan >= 7 ? 1 : 2);
}

/** Jawaban harus mencakup setiap ID yang diharapkan tepat satu kali. */
function cekLengkap(nama: string, idDiharapkan: number[], idDijawab: number[]) {
  const harap = new Set(idDiharapkan);
  const dobel = idDijawab.filter((id, i) => idDijawab.indexOf(id) !== i);
  const asing = idDijawab.filter((id) => !harap.has(id));
  const dijawab = new Set(idDijawab);
  const kurang = idDiharapkan.filter((id) => !dijawab.has(id));

  const masalah = [
    dobel.length && `duplikat: ${[...new Set(dobel)].join(', ')}`,
    asing.length && `tidak dikenal: ${asing.join(', ')}`,
    kurang.length && `belum dijawab: ${kurang.join(', ')}`,
  ].filter(Boolean);
  if (masalah.length) {
    throw AppError.badRequest(`Jawaban ${nama} tidak lengkap (${masalah.join('; ')})`, 'JAWABAN_TIDAK_LENGKAP');
  }
}

export const RiasecService = {
  /** Instrumen untuk frontend. Tipe RIASEC sengaja tidak dikirim agar tidak memengaruhi jawaban. */
  async instrumen() {
    const [butir, dimensi] = await Promise.all([
      AsesmenModel.listButirAktif(),
      AsesmenModel.listDimensi(),
    ]);
    return {
      riasec: butir.map(({ id, pernyataan, urutan }) => ({ id, pernyataan, urutan })),
      kemampuan: dimensi.map(({ id, pernyataan, urutan }) => ({ id, pernyataan, urutan })),
      skala: { min: 1, maks: 5 },
    };
  },

  async kirim(siswaId: string, jawaban: JawabanAsesmen) {
    const siswa = await SiswaModel.findById(siswaId);
    if (!siswa) {
      throw AppError.badRequest('Lengkapi profil (onboarding) terlebih dahulu', 'SISWA_BELUM_ADA');
    }

    const [butir, dimensi] = await Promise.all([
      AsesmenModel.listButirAktif(),
      AsesmenModel.listDimensi(),
    ]);
    cekLengkap('minat (RIASEC)', butir.map((b) => b.id), jawaban.riasec.map((j) => j.butir_id));
    cekLengkap('kemampuan diri', dimensi.map((d) => d.id), jawaban.kemampuan.map((j) => j.dimensi_id));

    // selesai_at diisi PALING AKHIR: view hanya membaca asesmen yang selesai,
    // jadi kegagalan di tengah tidak pernah menghasilkan skor setengah jadi.
    const asesmenId = await AsesmenModel.insertSiswa(siswaId, hitungSemester(siswa.tingkat));
    try {
      await AsesmenModel.insertJawaban(asesmenId, jawaban.riasec, jawaban.kemampuan);
      await AsesmenModel.tandaiSelesai(asesmenId);
    } catch (err) {
      await AsesmenModel.hapus(asesmenId).catch(() => undefined);
      throw err;
    }

    return RiasecService.terakhir(siswaId);
  },

  /** null = belum pernah menyelesaikan tes ("Belum ada data" di Beranda). */
  async terakhir(siswaId: string) {
    const hasil = await AsesmenModel.terakhirSiswa(siswaId);
    if (!hasil?.asesmen_id) return null;
    const semester = await AsesmenModel.semesterByIds([hasil.asesmen_id]);
    return { ...hasil, semester: semester.get(hasil.asesmen_id) ?? null };
  },

  async riwayat(siswaId: string) {
    const daftar = await AsesmenModel.riwayatSiswa(siswaId);
    const semester = await AsesmenModel.semesterByIds(
      daftar.map((a) => a.asesmen_id).filter((id): id is string => id !== null),
    );
    return daftar.map((a) => ({ ...a, semester: (a.asesmen_id && semester.get(a.asesmen_id)) ?? null }));
  },
};
