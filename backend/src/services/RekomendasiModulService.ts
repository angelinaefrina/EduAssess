/**
 * Rekomendasi modul (UC16 / F18) per klaster atau per siswa dalam satu run.
 * Skor = kesenjangan nilai mapel modul terhadap rata-rata cakupan run
 *      + kecocokan tipe RIASEC modul dengan RIASEC dominan sasaran
 *      + kesesuaian tingkat modul. Bobot & ambang di config/klaster.ts.
 * Profil dihitung dari salinan fitur anggota run (bukan data terkini), dan memakai
 * keanggotaan klaster SAAT INI (termasuk pemindahan manual).
 */
import type { Json } from '../../types/database';
import * as K from '../config/klaster';
import { AppError } from '../middleware/errorHandler';
import { KlasterModel } from '../models/klaster.model';
import { ModulModel, type RekomendasiModulInsert } from '../models/modul.model';
import type { AuthUser } from '../types/express';
import { fiturDariJson, KlasterService, profilKelompok, riasecDominan, type FiturMentah } from './KlasterService';

type Modul = Awaited<ReturnType<typeof ModulModel.listAktif>>[number];

interface Sasaran {
  klaster_id?: string;
  siswa_id?: string;
  nilai: Record<string, number>;
  riasecDominan: string[];
  tingkat: number | null;
}

export interface InputRekomendasi {
  sasaran: 'klaster' | 'siswa';
  klaster_id?: string;
  siswa_id?: string;
  jumlah?: number;
}

const bulat = (x: number, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

/** Nilai yang paling sering muncul (tingkat kelas anggota klaster). */
function modus(xs: (number | null)[]): number | null {
  const n = new Map<number, number>();
  for (const x of xs) if (x !== null) n.set(x, (n.get(x) ?? 0) + 1);
  let terbaik: number | null = null;
  for (const [x, c] of n) if (terbaik === null || c > n.get(terbaik)! || (c === n.get(terbaik)! && x < terbaik)) terbaik = x;
  return terbaik;
}

function skorModul(m: Modul, s: Sasaran, rataCakupan: Record<string, number>) {
  const kode = m.mapel?.kode;
  if (!kode || s.nilai[kode] === undefined || rataCakupan[kode] === undefined) return null;
  if (s.tingkat !== null && m.tingkat > s.tingkat) return null;

  const selisih = s.nilai[kode] - rataCakupan[kode];
  const kesenjangan = Math.min(1, Math.max(0, -selisih / K.SELISIH_KESENJANGAN_PENUH));
  const cocok = m.tipe_riasec.filter((t) => s.riasecDominan.includes(t));
  const riasec = cocok.length ? cocok.length / Math.min(m.tipe_riasec.length, s.riasecDominan.length) : 0;
  const tingkatSesuai = s.tingkat === null ? null : m.tingkat === s.tingkat;
  const tingkat = tingkatSesuai ? 1 : K.SKOR_TINGKAT_DI_BAWAH;

  const skor = K.BOBOT_MODUL.kesenjangan * kesenjangan + K.BOBOT_MODUL.riasec * riasec + K.BOBOT_MODUL.tingkat * tingkat;
  return {
    skor: bulat(skor),
    alasan: {
      mapel: kode,
      nilai_sasaran: bulat(s.nilai[kode], 2),
      rata_cakupan: rataCakupan[kode],
      selisih: bulat(selisih, 2),
      cocok_riasec: cocok,
      tingkat_sasaran: s.tingkat,
      tingkat_sesuai: tingkatSesuai,
      komponen: { kesenjangan: bulat(kesenjangan), riasec: bulat(riasec), tingkat: bulat(tingkat) },
    },
  };
}

export const RekomendasiModulService = {
  async hitung(user: AuthUser, runId: string, input: InputRekomendasi) {
    const run = await KlasterService.runDiSekolah(user, runId);
    const [klaster, anggota, modul] = await Promise.all([
      KlasterModel.listKlaster(runId),
      KlasterModel.listAnggota(runId),
      ModulModel.listAktif(run.sekolah_id),
    ]);
    if (input.klaster_id && !klaster.some((k) => k.id === input.klaster_id)) {
      throw AppError.notFound('Klaster tidak ditemukan di hasil pengelompokan ini');
    }
    if (input.siswa_id && !anggota.some((a) => a.siswa_id === input.siswa_id)) {
      throw AppError.notFound('Siswa tidak termasuk dalam hasil pengelompokan ini');
    }

    const fitur = new Map<string, FiturMentah>(anggota.map((a) => [a.siswa_id, fiturDariJson(a.fitur)]));
    const rataCakupan = profilKelompok([...fitur.values()]).rata_nilai;
    const tingkatSiswa = new Map(
      (await KlasterModel.statusSiswa(run.sekolah_id, anggota.map((a) => a.siswa_id))).map((s) => [s.siswa_id!, s.tingkat]),
    );
    const tingkatDari = (ids: string[]) => run.tingkat ?? modus(ids.map((id) => tingkatSiswa.get(id) ?? null));

    let sasaran: Sasaran[];
    if (input.sasaran === 'klaster') {
      sasaran = klaster
        .filter((k) => !input.klaster_id || k.id === input.klaster_id)
        .map((k) => {
          const ids = anggota.filter((a) => a.klaster_id === k.id).map((a) => a.siswa_id);
          const p = profilKelompok(ids.map((id) => fitur.get(id)!), K.PORSI_ANGGOTA_PUNYA_NILAI);
          return { klaster_id: k.id, nilai: p.rata_nilai, riasecDominan: riasecDominan(p.rata_riasec), tingkat: tingkatDari(ids) };
        });
    } else {
      sasaran = anggota
        .filter((a) => (!input.siswa_id || a.siswa_id === input.siswa_id) && (!input.klaster_id || a.klaster_id === input.klaster_id))
        .map((a) => {
          const f = fitur.get(a.siswa_id)!;
          return { siswa_id: a.siswa_id, nilai: f.nilai, riasecDominan: riasecDominan(f.riasec), tingkat: tingkatDari([a.siswa_id]) };
        });
    }

    const jumlah = input.jumlah ?? K.JUMLAH_REKOMENDASI_DEFAULT;
    const rows: RekomendasiModulInsert[] = sasaran.flatMap((s) =>
      modul
        .map((m) => ({ m, h: skorModul(m, s, rataCakupan) }))
        .filter((x): x is { m: Modul; h: NonNullable<ReturnType<typeof skorModul>> } => x.h !== null && x.h.skor >= K.SKOR_MODUL_MINIMUM)
        .sort((a, b) => b.h.skor - a.h.skor || a.m.judul.localeCompare(b.m.judul))
        .slice(0, jumlah)
        .map((x, i) => ({
          run_id: runId,
          klaster_id: s.klaster_id ?? null,
          siswa_id: s.siswa_id ?? null,
          modul_id: x.m.id,
          peringkat: i + 1,
          skor: x.h.skor,
          alasan: x.h.alasan as unknown as Json,
        })),
    );

    // Ganti rekomendasi lama untuk sasaran yang dihitung ulang.
    const klasterIds = sasaran.flatMap((s) => (s.klaster_id ? [s.klaster_id] : []));
    const siswaIds = sasaran.flatMap((s) => (s.siswa_id ? [s.siswa_id] : []));
    await ModulModel.hapusRekomendasi(runId, { klasterIds, siswaIds });
    await ModulModel.insertRekomendasi(rows);

    const dihitung = new Set([...klasterIds, ...siswaIds]);
    const semua = await ModulModel.listRekomendasi(runId, {});
    return {
      jumlah_sasaran: sasaran.length,
      jumlah_modul_aktif: modul.length,
      rekomendasi: semua.filter((r) => dihitung.has((input.sasaran === 'klaster' ? r.klaster_id : r.siswa_id) ?? '')),
    };
  },

  async daftar(user: AuthUser, runId: string, f: { klasterId?: string; siswaId?: string }) {
    await KlasterService.runDiSekolah(user, runId);
    return ModulModel.listRekomendasi(runId, f);
  },
};
