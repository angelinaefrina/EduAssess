/**
 * Perkembangan siswa (modul 9, UC12 / F14): perubahan minat antar asesmen ulang dan
 * perubahan nilai antar semester. Hanya penyajian data; skor RIASEC tetap dari view.
 * Nilai berstatus 'ditolak' tidak dihitung (sama seperti v_fitur_siswa).
 */
import { NilaiRaporModel } from '../models/nilaiRapor.model';
import { RiasecService } from './RiasecService';

const r2 = (x: number) => Math.round(x * 100) / 100;
const TIPE = ['R', 'I', 'A', 'S', 'E', 'C'] as const;

export const PerkembanganService = {
  async ambil(siswaId: string) {
    const [riwayatTerbaru, semuaNilai] = await Promise.all([
      RiasecService.riwayat(siswaId),
      NilaiRaporModel.listBySiswa(siswaId),
    ]);

    // ------------------------------------------------------------ minat
    const riwayat = [...riwayatTerbaru].reverse(); // terlama -> terbaru
    let perubahanMinat = null;
    if (riwayat.length >= 2) {
      const [lama, baru] = riwayat.slice(-2);
      const skorLama = (lama.riasec ?? {}) as Record<string, number>;
      const skorBaru = (baru.riasec ?? {}) as Record<string, number>;
      const selisih = Object.fromEntries(TIPE.map((t) => [t, r2(Number(skorBaru[t] ?? 0) - Number(skorLama[t] ?? 0))]));
      perubahanMinat = {
        dari: { semester: lama.semester, selesai_at: lama.selesai_at, kode_holland: lama.kode_holland },
        ke: { semester: baru.semester, selesai_at: baru.selesai_at, kode_holland: baru.kode_holland },
        kode_holland_berubah: lama.kode_holland !== baru.kode_holland,
        selisih_per_tipe: selisih,
      };
    }

    // ------------------------------------------------------------ nilai
    const nilai = semuaNilai.filter((n) => n.status !== 'ditolak' && n.mapel);
    const semester = [...new Set(nilai.map((n) => n.semester))].sort((a, b) => a - b);
    const perMapel = new Map<string, { mapel: { id: number; kode: string; nama: string }; nilai: Record<number, { nilai: number; status: string }> }>();
    for (const n of nilai) {
      const e = perMapel.get(n.mapel!.kode) ?? { mapel: n.mapel!, nilai: {} };
      e.nilai[n.semester] = { nilai: Number(n.nilai), status: n.status };
      perMapel.set(n.mapel!.kode, e);
    }
    const rataRata = semester.map((s) => {
      const xs = nilai.filter((n) => n.semester === s).map((n) => Number(n.nilai));
      return { semester: s, rata_rata: r2(xs.reduce((a, b) => a + b, 0) / xs.length), jumlah_mapel: xs.length };
    });

    let perubahanNilai = null;
    if (semester.length >= 2) {
      const [sLama, sBaru] = semester.slice(-2);
      // Hanya mapel yang ada nilainya di kedua semester agar perbandingannya setara.
      const mapel = [...perMapel.values()]
        .filter((m) => m.nilai[sLama] && m.nilai[sBaru])
        .map((m) => ({
          mapel: m.mapel,
          dari: m.nilai[sLama].nilai,
          ke: m.nilai[sBaru].nilai,
          selisih: r2(m.nilai[sBaru].nilai - m.nilai[sLama].nilai),
        }))
        .sort((a, b) => b.selisih - a.selisih);
      const rataSama = (s: number) =>
        mapel.length ? r2(mapel.reduce((a, m) => a + (s === sBaru ? m.ke : m.dari), 0) / mapel.length) : null;
      perubahanNilai = {
        dari_semester: sLama,
        ke_semester: sBaru,
        rata_rata_mapel_sama: { dari: rataSama(sLama), ke: rataSama(sBaru) },
        mapel,
      };
    }

    return {
      minat: { riwayat, perubahan: perubahanMinat },
      nilai: {
        semester,
        per_mapel: [...perMapel.values()].sort((a, b) => a.mapel.id - b.mapel.id),
        rata_rata_per_semester: rataRata,
        perubahan: perubahanNilai,
      },
    };
  },
};
