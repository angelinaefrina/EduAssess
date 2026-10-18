import { randomUUID } from 'node:crypto';
import type { Json } from '../../types/database';
import { SurveiModel, type RespondenInsert, type SumberData } from '../models/survei.model';
import { parseCsv } from './csv';
import * as F from './surveiForm';

type Master = Awaited<ReturnType<typeof SurveiModel.master>>;

export interface ResponTerurai {
  baris: number;
  responden: Omit<RespondenInsert, 'batch_id'> & { id: string };
  nilai: { mapel_id: number; nilai: number }[];
  mapelFavorit: number[];
  bidangKarir: number[];
  riasec: { butir_id: number; skor: number }[];
  kemampuan: { dimensi_id: number; skor: number }[];
}

export interface HasilParse {
  respon: ResponTerurai[];
  dilewati: { baris: number; alasan: string }[];
  errors: string[];
}

/** Error per sel dikumpulkan (bukan dilempar) agar satu laporan memuat semua masalah. */
class Pembaca {
  errors: string[] = [];
  constructor(
    private sel: (judul: string) => string,
    private baris: number,
  ) {}

  private salah(judul: string, pesan: string) {
    this.errors.push(`Baris ${this.baris}, "${judul.slice(0, 60)}": ${pesan}`);
  }
  teks(judul: string, wajib = true): string {
    const v = this.sel(judul).trim();
    if (wajib && v === '') this.salah(judul, 'wajib diisi');
    return v;
  }
  opsi<V>(judul: string, peta: Record<string, V>): V | null {
    const v = this.teks(judul);
    if (v === '') return null;
    if (!(v in peta)) {
      this.salah(judul, `opsi "${v}" tidak dikenal`);
      return null;
    }
    return peta[v];
  }
  opsiTeks(judul: string, daftar: readonly string[]): string | null {
    const v = this.teks(judul);
    if (v !== '' && !daftar.includes(v)) this.salah(judul, `opsi "${v}" tidak dikenal`);
    return v || null;
  }
  likert(judul: string): number {
    const v = this.teks(judul);
    const n = Number(v);
    if (v !== '' && !(Number.isInteger(n) && n >= 1 && n <= 5)) this.salah(judul, `"${v}" bukan skala 1–5`);
    return n;
  }
  checkbox(judul: string): string[] {
    return this.teks(judul)
      .split(F.PEMISAH_CHECKBOX)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  /** null = tidak diambil / tidak ingat (<= BATAS_NILAI_TIDAK_DIAMBIL) -> tidak di-insert. */
  nilai(judul: string): number | null {
    const v = this.teks(judul).replace(',', '.');
    const n = Number(v);
    if (v === '' || !Number.isFinite(n) || n < 0 || n > 100) {
      if (v !== '') this.salah(judul, `nilai "${v}" harus 0–100`);
      return null;
    }
    return n <= F.BATAS_NILAI_TIDAK_DIAMBIL ? null : n;
  }
}

function petaNama<T extends { nama: string }>(daftar: T[]) {
  return new Map(daftar.map((x) => [F.normal(x.nama).toLowerCase(), x]));
}

/** Urai CSV ekspor Google Form menjadi baris siap-insert. Tidak menulis ke DB. */
export function uraiCsvSurvei(teksCsv: string, master: Master): HasilParse {
  const { baris: semua, nomorAwal } = parseCsv(teksCsv);
  const header = (semua[0] ?? []).map(F.normal);
  const indeks = new Map(header.map((h, i) => [h, i]));

  // Semua kolom yang diharapkan harus ada, dicocokkan berdasarkan teks pertanyaan.
  const judulWajib = [
    ...Object.values(F.KOLOM),
    ...master.mapel.map((m) => F.judulNilai(m.nama)),
    ...master.butir.map((b) => b.pernyataan),
    ...master.dimensi.map((d) => d.pernyataan),
    ...Object.values(F.GRID_Q64).map(F.judulGrid),
  ].map(F.normal);
  const hilang = judulWajib.filter((j) => !indeks.has(j));
  if (hilang.length) {
    return { respon: [], dilewati: [], errors: hilang.map((j) => `Kolom tidak ditemukan: "${j}"`) };
  }

  const mapelByNama = petaNama(master.mapel);
  const bidangStudiByNama = petaNama(master.bidangStudi);
  const bidangKarirByNama = petaNama(master.bidangKarir);
  const prodiByNama = petaNama(master.prodi);

  const hasil: HasilParse = { respon: [], dilewati: [], errors: [] };

  semua.slice(1).forEach((sel, i) => {
    const no = nomorAwal + i + 1;
    if (sel.every((s) => s.trim() === '')) return;
    const r = new Pembaca((j) => sel[indeks.get(F.normal(j))!] ?? '', no);

    // Q1–Q2: hanya yang setuju & >=18 th yang boleh masuk (bukan error).
    if (r.teks(F.KOLOM.q1) !== F.SETUJU_Q1) return void hasil.dilewati.push({ baris: no, alasan: 'tidak setuju (Q1)' });
    if (r.teks(F.KOLOM.q2) !== F.YA_Q2) return void hasil.dilewati.push({ baris: no, alasan: 'bukan mahasiswa aktif >=18 th (Q2)' });

    const dicatat = F.parseTimestampForm(r.teks(F.KOLOM.timestamp));
    if (!dicatat) r.errors.push(`Baris ${no}: Timestamp tidak dikenali`);

    const namaBidang = r.teks(F.KOLOM.q4);
    const bidangStudi = bidangStudiByNama.get(namaBidang.toLowerCase());
    if (namaBidang && !bidangStudi) r.errors.push(`Baris ${no}: bidang studi "${namaBidang}" tidak dikenal`);

    const prodiTeks = F.normal(r.teks(F.KOLOM.q5));
    const ipkMentah = r.teks(F.KOLOM.q68).replace(',', '.');
    const ipk = Number(ipkMentah);
    if (ipkMentah !== '' && !(Number.isFinite(ipk) && ipk >= 0 && ipk <= 4)) {
      r.errors.push(`Baris ${no}: IPK "${ipkMentah}" harus 0–4`);
    }

    // Q25: label mapel; isian "Other" yang sama dengan nama mapel dihitung sebagai mapel itu.
    const mapelFavorit = new Set<number>();
    const favoritLain: string[] = [];
    for (const label of r.checkbox(F.KOLOM.q25)) {
      const m = mapelByNama.get(F.normal(label).toLowerCase());
      if (m) mapelFavorit.add(m.id);
      else favoritLain.push(label);
    }

    // Q53: label bidang karir; opsi "belum memiliki gambaran" disimpan sebagai flag.
    const bidangKarir = new Set<number>();
    let belumAdaGambaran = false;
    for (const label of r.checkbox(F.KOLOM.q53)) {
      if (label === F.BELUM_ADA_GAMBARAN_Q53) belumAdaGambaran = true;
      else {
        const b = bidangKarirByNama.get(label.toLowerCase());
        if (b) bidangKarir.add(b.id);
        else r.errors.push(`Baris ${no}: bidang pekerjaan "${label}" tidak dikenal (Q53)`);
      }
    }

    const id = randomUUID();
    const responden = {
      id,
      dicatat_at: dicatat,
      persetujuan: true,
      usia_min_18: true,
      jenjang: r.opsi(F.KOLOM.q3, F.OPSI_Q3)!,
      bidang_studi_id: bidangStudi?.id ?? 0,
      prodi_teks: prodiTeks,
      prodi_id: prodiByNama.get(prodiTeks.toLowerCase())?.id ?? null,
      semester: r.opsi(F.KOLOM.q6, F.OPSI_Q6),
      jenis_sekolah: r.opsi(F.KOLOM.q7, F.OPSI_Q7)!,
      peminatan: r.opsi(F.KOLOM.q8, F.OPSI_Q8)!,
      tahun_lulus: r.opsi(F.KOLOM.q9, F.OPSI_Q9),
      status_pilihan: r.opsi(F.KOLOM.q10, F.OPSI_Q10)!,
      riwayat_pindah: r.opsi(F.KOLOM.q11, F.OPSI_Q11)!,
      keandalan_nilai: r.opsi(F.KOLOM.q24, F.OPSI_Q24)!,
      mapel_favorit_lain: favoritLain.length ? favoritLain.join('; ') : null,
      belum_ada_gambaran_karir: belumAdaGambaran,
      tes_minat: r.opsiTeks(F.KOLOM.q60, F.OPSI_Q60),
      bimbingan_bk: r.opsiTeks(F.KOLOM.q61, F.OPSI_Q61),
      membandingkan_jurusan: r.opsiTeks(F.KOLOM.q62, F.OPSI_Q62),
      kesesuaian_ekspektasi: r.opsi(F.KOLOM.q65, F.OPSI_Q65),
      frekuensi_ingin_pindah: r.opsi(F.KOLOM.q66, F.OPSI_Q66),
      ipk: ipkMentah === '' ? null : ipk,
      hal_penting_diketahui: r.teks(F.KOLOM.q74, false) || null,
      saran: r.teks(F.KOLOM.q75, false) || null,
      ...(Object.fromEntries(
        Object.entries(F.LIKERT_RESPONDEN).map(([kolom, q]) => [kolom, r.likert(F.KOLOM[q])]),
      ) as Record<keyof typeof F.LIKERT_RESPONDEN, number>),
      ...(Object.fromEntries(
        Object.entries(F.CHECKBOX_TEKS).map(([kolom, q]) => [kolom, r.checkbox(F.KOLOM[q])]),
      ) as Record<keyof typeof F.CHECKBOX_TEKS, string[]>),
      ...(Object.fromEntries(
        Object.entries(F.GRID_Q64).map(([kolom, baris]) => [kolom, r.likert(F.judulGrid(baris))]),
      ) as Record<F.KolomFit, number>),
    } satisfies ResponTerurai['responden'];

    const nilai = master.mapel.flatMap((m) => {
      const n = r.nilai(F.judulNilai(m.nama));
      return n === null ? [] : [{ mapel_id: m.id, nilai: n }];
    });

    // Dibaca SEBELUM cek error agar skor di luar 1–5 ikut dilaporkan.
    const riasec = master.butir.map((b) => ({ butir_id: b.id, skor: r.likert(b.pernyataan) }));
    const kemampuan = master.dimensi.map((d) => ({ dimensi_id: d.id, skor: r.likert(d.pernyataan) }));

    if (r.errors.length) return void hasil.errors.push(...r.errors);
    hasil.respon.push({
      baris: no,
      responden,
      nilai,
      mapelFavorit: [...mapelFavorit],
      bidangKarir: [...bidangKarir],
      riasec,
      kemampuan,
    });
  });

  return hasil;
}

export interface OpsiImpor {
  sumber: SumberData;
  namaFile: string;
  keterangan?: string | null;
  parameter?: Json;
  dibuatDari?: string | null;
  /** Hapus batch lama dengan sumber & nama_file yang sama SETELAH impor baru berhasil. */
  ganti?: boolean;
}

export const ImporSurveiService = {
  uraiCsvSurvei,

  /**
   * Simpan hasil urai ke DB sebagai satu batch. Semua-atau-tidak-sama-sekali:
   * bila insert gagal di tengah, batch dihapus (cascade ke seluruh turunannya).
   */
  async simpan(respon: ResponTerurai[], opsi: OpsiImpor) {
    const lama = opsi.ganti ? await SurveiModel.batchSama(opsi.sumber, opsi.namaFile) : [];
    const batchId = await SurveiModel.buatBatch({
      sumber: opsi.sumber,
      nama_file: opsi.namaFile,
      keterangan: opsi.keterangan ?? null,
      parameter: opsi.parameter ?? null,
      dibuat_dari: opsi.dibuatDari ?? null,
    });

    try {
      await SurveiModel.insertResponden(respon.map((x) => ({ ...x.responden, batch_id: batchId })));
      await SurveiModel.insertNilai(respon.flatMap((x) => x.nilai.map((n) => ({ responden_id: x.responden.id, ...n }))));
      await SurveiModel.insertMapelFavorit(
        respon.flatMap((x) => x.mapelFavorit.map((mapel_id) => ({ responden_id: x.responden.id, mapel_id }))),
      );
      await SurveiModel.insertBidangKarir(
        respon.flatMap((x) => x.bidangKarir.map((bidang_karir_id) => ({ responden_id: x.responden.id, bidang_karir_id }))),
      );

      // Asesmen responden memakai tabel & view yang sama dengan siswa (skor RIASEC dihitung di view).
      const asesmenId = new Map(respon.map((x) => [x.responden.id, randomUUID()]));
      await SurveiModel.insertAsesmen(
        respon.map((x) => ({
          id: asesmenId.get(x.responden.id)!,
          responden_id: x.responden.id,
          mulai_at: x.responden.dicatat_at ?? undefined,
          selesai_at: x.responden.dicatat_at ?? new Date().toISOString(),
        })),
      );
      await SurveiModel.insertAsesmenRiasec(
        respon.flatMap((x) => x.riasec.map((j) => ({ asesmen_id: asesmenId.get(x.responden.id)!, ...j }))),
      );
      await SurveiModel.insertAsesmenKemampuan(
        respon.flatMap((x) => x.kemampuan.map((j) => ({ asesmen_id: asesmenId.get(x.responden.id)!, ...j }))),
      );
    } catch (err) {
      await SurveiModel.hapusBatch([batchId]).catch(() => undefined);
      throw err;
    }

    await SurveiModel.hapusBatch(lama);
    return { batchId, batchLamaDihapus: lama.length };
  },
};
