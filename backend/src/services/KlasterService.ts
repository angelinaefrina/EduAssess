/**
 * Pengelompokan siswa (UC15 / F17) oleh guru pengajar. Fitur diambil dari
 * v_fitur_siswa (RIASEC 1–5 dan/atau nilai rapor terakhir per mapel),
 * dinormalisasi min–max ke 0–1, lalu dikelompokkan dengan k-means.
 * Salinan fitur mentah disimpan per anggota agar karakteristik & penjelasan
 * (F11) tetap bisa ditelusuri walau data siswa berubah. Aturan di config/klaster.ts.
 */
import { randomInt } from 'node:crypto';
import type { Json } from '../../types/database';
import * as K from '../config/klaster';
import { AppError } from '../middleware/errorHandler';
import { KlasterModel, type BasisKlaster } from '../models/klaster.model';
import { MasterModel } from '../models/master.model';
import type { AuthUser } from '../types/express';
import { sekolahBk } from './aksesBk';
import { kmeans } from './kmeans';
import { PenjelasanGagal, PenjelasanLLMService } from './PenjelasanLLMService';
import type { KarakteristikPenjelasan } from './penjelasanTemplate';

export const TIPE_RIASEC = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
const NAMA_RIASEC: Record<string, string> = {
  R: 'Realistis', I: 'Investigatif', A: 'Artistik', S: 'Sosial', E: 'Enterprising', C: 'Konvensional',
};

/** Salinan fitur mentah per anggota (klaster_anggota.fitur). */
export interface FiturMentah {
  riasec: Record<string, number> | null;
  nilai: Record<string, number>;
}

export interface Karakteristik extends KarakteristikPenjelasan {
  rata_riasec: Record<string, number> | null;
  rata_nilai: Record<string, number>;
}

const bulat = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

function keAngka(obj: unknown): Record<string, number> {
  if (!obj || typeof obj !== 'object') return {};
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => [k, Number(v)] as const)
      .filter(([, v]) => Number.isFinite(v)),
  );
}

export function fiturDariJson(j: Json | null): FiturMentah {
  const o = (j ?? {}) as { riasec?: unknown; nilai?: unknown };
  const riasec = keAngka(o.riasec);
  return { riasec: Object.keys(riasec).length ? riasec : null, nilai: keAngka(o.nilai) };
}

/** Dua tipe RIASEC dengan skor rata-rata tertinggi (urutan TIPE_RIASEC bila seri). */
export function riasecDominan(riasec: Record<string, number> | null): string[] {
  if (!riasec) return [];
  return TIPE_RIASEC.filter((t) => riasec[t] !== undefined)
    .sort((a, b) => riasec[b] - riasec[a])
    .slice(0, 2);
}

/**
 * Profil gabungan sekelompok siswa: rata-rata RIASEC (anggota yang sudah tes)
 * dan rata-rata nilai per mapel. `porsiMin` = porsi minimal anggota yang punya
 * nilai mapel tsb agar rata-ratanya dihitung.
 */
export function profilKelompok(fitur: FiturMentah[], porsiMin = 0) {
  const sudahTes = fitur.filter((f) => f.riasec);
  const rata_riasec = sudahTes.length
    ? Object.fromEntries(
        TIPE_RIASEC.map((t) => [t, bulat(sudahTes.reduce((s, f) => s + (f.riasec![t] ?? 0), 0) / sudahTes.length)]),
      )
    : null;

  const jumlah = new Map<string, { total: number; n: number }>();
  for (const f of fitur) {
    for (const [kode, v] of Object.entries(f.nilai)) {
      const j = jumlah.get(kode) ?? { total: 0, n: 0 };
      j.total += v;
      j.n++;
      jumlah.set(kode, j);
    }
  }
  const rata_nilai: Record<string, number> = {};
  for (const [kode, j] of jumlah) {
    if (fitur.length && j.n / fitur.length >= porsiMin) rata_nilai[kode] = bulat(j.total / j.n);
  }
  return { rata_riasec, rata_nilai };
}

function karakteristik(
  anggota: FiturMentah[],
  rataCakupan: Record<string, number>,
  namaMapel: Map<string, string>,
): Karakteristik {
  const { rata_riasec, rata_nilai } = profilKelompok(anggota, K.PORSI_ANGGOTA_PUNYA_NILAI);
  const selisih = Object.entries(rata_nilai)
    .filter(([kode]) => rataCakupan[kode] !== undefined)
    .map(([kode, v]) => ({ kode, nama: namaMapel.get(kode) ?? kode, selisih: bulat(v - rataCakupan[kode], 1) }));
  return {
    jumlah_anggota: anggota.length,
    riasec_dominan: riasecDominan(rata_riasec),
    rata_riasec,
    rata_nilai,
    mapel_menonjol: selisih
      .filter((m) => m.selisih >= K.AMBANG_MAPEL_MENONJOL)
      .sort((a, b) => b.selisih - a.selisih)
      .slice(0, K.MAKS_MAPEL_KARAKTERISTIK),
    mapel_lemah: selisih
      .filter((m) => m.selisih <= -K.AMBANG_MAPEL_MENONJOL)
      .sort((a, b) => a.selisih - b.selisih)
      .slice(0, K.MAKS_MAPEL_KARAKTERISTIK),
  };
}

function labelKlaster(k: Karakteristik, basis: BasisKlaster, urutan: number): string {
  const minat = k.riasec_dominan.map((t) => NAMA_RIASEC[t]).join('–');
  const kuat = k.mapel_menonjol.map((m) => m.kode).slice(0, 2).join(', ');
  const lemah = k.mapel_lemah.map((m) => m.kode).slice(0, 2).join(', ');
  const akademik = kuat ? `kuat ${kuat}` : lemah ? `perlu penguatan ${lemah}` : '';
  const bagian = basis === 'akademik' ? [akademik] : basis === 'minat' ? [minat] : [minat, akademik];
  return bagian.filter(Boolean).join(' · ') || `Klaster ${urutan}`;
}

const skala = (v: number, s: { min: number; maks: number }) => (v - s.min) / (s.maks - s.min);

export interface InputRun {
  basis: BasisKlaster;
  angkatan: number;
  tingkat?: number;
  rombel?: string;
  jumlah_klaster: number;
  seed?: number;
}

async function runDiSekolah(user: AuthUser, runId: string) {
  const run = await KlasterModel.findRunDiSekolah(runId, sekolahBk(user));
  // Run sekolah lain diperlakukan sama dengan tidak ada.
  if (!run) throw AppError.notFound('Hasil pengelompokan tidak ditemukan');
  return run;
}

export const KlasterService = {
  runDiSekolah,

  async jalankan(user: AuthUser, input: InputRun) {
    const sekolahId = sekolahBk(user);
    const [siswa, mapel] = await Promise.all([
      KlasterModel.siswaCakupan(sekolahId, input),
      MasterModel.listMapel(),
    ]);
    const namaMapel = new Map(mapel.map((m) => [m.kode, m.nama]));
    const ids = siswa.map((s) => s.siswa_id).filter((id): id is string => id !== null);
    const fiturById = new Map(
      (await KlasterModel.fiturSiswa(ids)).map((f) => [f.siswa_id!, fiturDariJson({ riasec: f.riasec, nilai: f.nilai })]),
    );
    const semua = ids.map((id) => ({ id, f: fiturById.get(id) ?? { riasec: null, nilai: {} } }));

    const pakaiMinat = input.basis !== 'akademik';
    const pakaiAkademik = input.basis !== 'minat';

    // Kolom akademik: mapel yang nilainya dimiliki cukup banyak siswa dalam cakupan.
    const hitungMapel = new Map<string, number>();
    for (const { f } of semua) for (const kode of Object.keys(f.nilai)) hitungMapel.set(kode, (hitungMapel.get(kode) ?? 0) + 1);
    const kolomAkademik = pakaiAkademik
      ? mapel.map((m) => m.kode).filter((k) => semua.length > 0 && (hitungMapel.get(k) ?? 0) / semua.length >= K.PORSI_MAPEL_CAKUPAN)
      : [];
    if (pakaiAkademik && semua.length > 0 && kolomAkademik.length === 0) {
      throw AppError.badRequest('Belum ada mapel yang nilainya dimiliki cukup banyak siswa dalam cakupan', 'DATA_KURANG');
    }

    const minNilai = Math.ceil(kolomAkademik.length * K.PORSI_NILAI_SISWA);
    const lengkap = (f: FiturMentah) =>
      (!pakaiMinat || (f.riasec !== null && TIPE_RIASEC.every((t) => f.riasec![t] !== undefined))) &&
      (!pakaiAkademik || kolomAkademik.filter((k) => f.nilai[k] !== undefined).length >= minNilai);
    const peserta = semua.filter(({ f }) => lengkap(f));
    const dilewati = semua.length - peserta.length;

    if (peserta.length < input.jumlah_klaster) {
      throw new AppError(400, 'DATA_KURANG', 'Siswa dengan data lengkap lebih sedikit dari jumlah klaster', {
        jumlah_siswa: semua.length,
        jumlah_lengkap: peserta.length,
        jumlah_dilewati: dilewati,
      });
    }

    // Rata-rata cakupan (peserta) per mapel: imputasi nilai kosong & pembanding karakteristik.
    const rataCakupan = profilKelompok(peserta.map((p) => p.f)).rata_nilai;

    // Gabungan: tiap blok dibobot per jumlah dimensinya agar kontribusi jaraknya sebanding BOBOT_GABUNGAN.
    const wMinat = input.basis === 'gabungan' ? Math.sqrt(K.BOBOT_GABUNGAN.minat / TIPE_RIASEC.length) : 1;
    const wAkademik = input.basis === 'gabungan' ? Math.sqrt(K.BOBOT_GABUNGAN.akademik / kolomAkademik.length) : 1;
    const titik = peserta.map(({ f }) => [
      ...(pakaiMinat ? TIPE_RIASEC.map((t) => skala(f.riasec![t], K.SKALA_RIASEC) * wMinat) : []),
      ...kolomAkademik.map((k) => skala(f.nilai[k] ?? rataCakupan[k], K.SKALA_NILAI) * wAkademik),
    ]);

    const seed = input.seed ?? randomInt(2 ** 31);
    const hasil = kmeans(titik, input.jumlah_klaster, seed);

    // Urutan klaster: anggota terbanyak lebih dulu.
    const ukuran = new Array<number>(input.jumlah_klaster).fill(0);
    hasil.label.forEach((l) => ukuran[l]++);
    const urutanKe = new Map(
      ukuran
        .map((n, idx) => ({ n, idx }))
        .sort((a, b) => b.n - a.n || a.idx - b.idx)
        .map((x, i) => [x.idx, i + 1]),
    );
    const dimensi = [...(pakaiMinat ? TIPE_RIASEC.map((t) => `riasec_${t}`) : []), ...kolomAkademik.map((k) => `nilai_${k}`)];

    const runId = await KlasterModel.insertRun({
      sekolah_id: sekolahId,
      dibuat_oleh: user.id,
      basis: input.basis,
      angkatan: input.angkatan,
      tingkat: input.tingkat ?? null,
      rombel: input.rombel ?? null,
      jumlah_klaster: input.jumlah_klaster,
      algoritma: 'kmeans',
      versi_algo: K.VERSI_ALGO_KLASTER,
      jumlah_dilewati: dilewati,
      parameter: {
        seed,
        n_init: K.N_INIT,
        normalisasi: 'minmax',
        skala: { riasec: K.SKALA_RIASEC, nilai: K.SKALA_NILAI },
        bobot: input.basis === 'gabungan' ? K.BOBOT_GABUNGAN : null,
        dimensi,
        imputasi: 'rata_cakupan',
        rata_nilai_cakupan: rataCakupan,
        inersia: bulat(hasil.inersia, 4),
      },
    });

    try {
      const barisKlaster = hasil.centroid.map((c, idx) => {
        const urutan = urutanKe.get(idx)!;
        const ciri = karakteristik(
          peserta.filter((_, i) => hasil.label[i] === idx).map((p) => p.f),
          rataCakupan,
          namaMapel,
        );
        return {
          run_id: runId,
          urutan,
          label: labelKlaster(ciri, input.basis, urutan),
          centroid: { dimensi, nilai: c.map((v) => bulat(v, 4)) },
          karakteristik: ciri as unknown as Json,
        };
      });
      const klasterId = new Map((await KlasterModel.insertKlaster(barisKlaster)).map((k) => [k.urutan, k.id]));

      await KlasterModel.insertAnggota(
        peserta.map((p, i) => ({
          run_id: runId,
          siswa_id: p.id,
          klaster_id: klasterId.get(urutanKe.get(hasil.label[i])!)!,
          fitur: p.f as unknown as Json,
          jarak_centroid: bulat(hasil.jarak[i], 4),
        })),
      );
    } catch (err) {
      // Tanpa transaksi: bersihkan run setengah jadi (klaster & anggota ikut terhapus via cascade).
      await KlasterModel.hapusRun(runId).catch(() => undefined);
      throw err;
    }

    return KlasterService.detail(user, runId);
  },

  async daftar(user: AuthUser, f: { angkatan?: number; saya?: boolean; limit: number; offset: number }) {
    return KlasterModel.listRun(sekolahBk(user), {
      angkatan: f.angkatan,
      dibuatOleh: f.saya ? user.id : undefined,
      limit: f.limit,
      offset: f.offset,
    });
  },

  /** Run beserta klaster dan anggotanya (nama & kelas saat ini). */
  async detail(user: AuthUser, runId: string) {
    const run = await runDiSekolah(user, runId);
    const [klaster, anggota] = await Promise.all([KlasterModel.listKlaster(runId), KlasterModel.listAnggota(runId)]);
    const status = new Map(
      (await KlasterModel.statusSiswa(run.sekolah_id, anggota.map((a) => a.siswa_id))).map((s) => [s.siswa_id, s]),
    );
    return {
      ...run,
      klaster: klaster.map((k) => ({
        ...k,
        anggota: anggota
          .filter((a) => a.klaster_id === k.id)
          .map((a) => {
            const s = status.get(a.siswa_id);
            return {
              ...a,
              nama: s?.nama ?? null,
              tingkat: s?.tingkat ?? null,
              rombel: s?.rombel ?? null,
              // false = siswa sudah tidak terdaftar di sekolah ini.
              masih_di_sekolah: s !== undefined,
            };
          })
          .sort((a, b) => (a.nama ?? '').localeCompare(b.nama ?? '')),
      })),
    };
  },

  async hapus(user: AuthUser, runId: string) {
    const run = await runDiSekolah(user, runId);
    if (run.dibuat_oleh !== user.id) {
      throw AppError.forbidden('Hanya pembuat yang dapat menghapus hasil pengelompokan ini', 'BUKAN_PEMBUAT');
    }
    await KlasterModel.hapusRun(runId);
  },

  /**
   * UC15 alt. 3: pindahkan siswa ke klaster lain dalam run yang sama. Klaster asal hasil
   * algoritma dicatat; memindahkan kembali ke klaster asal menghapus tanda manual.
   * Karakteristik klaster TIDAK dihitung ulang (tetap mencerminkan hasil algoritma).
   */
  async pindahkan(user: AuthUser, runId: string, siswaId: string, klasterId: string) {
    await runDiSekolah(user, runId);
    const [anggota, tujuan] = await Promise.all([
      KlasterModel.findAnggota(runId, siswaId),
      KlasterModel.findKlaster(runId, klasterId),
    ]);
    if (!anggota) throw AppError.notFound('Siswa tidak termasuk dalam hasil pengelompokan ini');
    if (!tujuan) throw AppError.notFound('Klaster tujuan tidak ditemukan di hasil pengelompokan ini');
    if (anggota.klaster_id === klasterId) return KlasterModel.updateAnggota(runId, siswaId, {});

    const asal = anggota.is_manual ? anggota.klaster_asal_id : anggota.klaster_id;
    const kembali = asal === klasterId;
    return KlasterModel.updateAnggota(runId, siswaId, {
      klaster_id: klasterId,
      is_manual: !kembali,
      klaster_asal_id: kembali ? null : asal,
      dipindah_oleh: kembali ? null : user.id,
      dipindah_at: kembali ? null : new Date().toISOString(),
      // Jarak ke centroid klaster baru tidak dihitung; hanya bermakna untuk hasil algoritma.
      jarak_centroid: null,
    });
  },

  /** F11: buat (sekali) atau ambil penjelasan karakteristik klaster. */
  async penjelasan(user: AuthUser, runId: string, klasterId: string) {
    await runDiSekolah(user, runId);
    const k = await KlasterModel.findKlaster(runId, klasterId);
    if (!k) throw AppError.notFound('Klaster tidak ditemukan');

    const model = PenjelasanLLMService.model();
    if (k.penjelasan && k.model_llm === model) return { penjelasan: k.penjelasan, model, dari_cache: true };

    try {
      const teks = await PenjelasanLLMService.jelaskanKlaster(k.karakteristik as unknown as Karakteristik);
      await KlasterModel.simpanPenjelasan(klasterId, teks, model);
      return { penjelasan: teks, model, dari_cache: false };
    } catch (err) {
      if (!(err instanceof PenjelasanGagal)) throw err;
      console.error('Penjelasan klaster gagal:', err.message);
      await KlasterModel.simpanPenjelasan(klasterId, null, null);
      return { penjelasan: null, model, alasan: err.alasan };
    }
  },
};
