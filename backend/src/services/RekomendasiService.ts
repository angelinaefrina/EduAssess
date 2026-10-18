/**
 * Rekomendasi BERBASIS KATALOG (keputusan tim, lihat CLAUDE.md):
 * profil siswa (v_fitur_siswa) dibandingkan dengan prodi.kode_riasec + prodi_mapel,
 * ditambah target_karir. Data responden survei/sintetis TIDAK dipakai.
 * Aturan & angka ada di config/rekomendasi.ts.
 */
import { createHash } from 'node:crypto';
import type { Json } from '../../types/database';
import * as A from '../config/rekomendasi';
import { AppError } from '../middleware/errorHandler';
import { PreferensiModel } from '../models/preferensi.model';
import { RekomendasiModel, type JenisRekomendasi } from '../models/rekomendasi.model';
import { SiswaModel } from '../models/siswa.model';
import { SiswaPilihanModel } from '../models/siswaPilihan.model';

// ------------------------------------------------------------------ tipe
type ProdiKatalog = Awaited<ReturnType<typeof RekomendasiModel.katalog>>[number];
type Preferensi = NonNullable<Awaited<ReturnType<typeof PreferensiModel.findBySiswa>>>;

export interface ProfilSiswa {
  tingkat: number | null;
  /** Nilai rapor terakhir per kode mapel (tidak ditolak). */
  nilai: Record<string, number>;
  /** Skor rata-rata per tipe RIASEC (1–5), dari view asesmen. */
  riasec: Record<string, number> | null;
  bidangKarir: string[];
  targetKarirIds: string[];
}

export interface SkorProdi {
  peringkat: number;
  prodi: {
    id: string;
    nama: string;
    kode_riasec: string | null;
    jenis_pendidikan: string[];
    bidang_studi: { id: number; kode: string; nama: string } | null;
    catatan_sumber: string | null;
  };
  skor: { total: number; minat: number; akademik: number; karir: number };
  akademik: {
    cakupan: number;
    /** Rata-rata tertimbang HANYA pada mapel yang diambil (sebelum dikali cakupan). */
    rata_rata_mapel_diambil: number;
    data_kurang: boolean;
    mapel: { kode: string; nama: string; bobot: number; nilai: number | null }[];
  };
  karir: { alasan: 'target_karir' | 'bidang_karir' | null; cocok: string[] };
  contoh_karir: { id: string; nama: string }[];
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;

// ------------------------------------------------------------- perhitungan murni
export function bobotUntuk(tingkat: number | null) {
  return A.BOBOT_PER_TINGKAT[tingkat ?? 12] ?? A.BOBOT_PER_TINGKAT[12];
}

/** Kecocokan minat: rata-rata tertimbang skor siswa (dinormalisasi 0–1) pada huruf kode prodi. */
export function skorMinat(riasec: Record<string, number> | null, kode: string | null): number {
  if (!riasec || !kode) return 0;
  let atas = 0;
  let bawah = 0;
  [...kode].forEach((huruf, i) => {
    const w = A.BOBOT_POSISI_RIASEC[i] ?? 0;
    const s = Number(riasec[huruf]);
    if (Number.isFinite(s)) atas += w * ((s - 1) / 4);
    bawah += w;
  });
  return bawah ? atas / bawah : 0;
}

export function hitungProdi(profil: ProfilSiswa, katalog: ProdiKatalog[]): SkorProdi[] {
  const bobot = bobotUntuk(profil.tingkat);
  const targetKarir = new Set(profil.targetKarirIds);
  const bidangKarirSiswa = new Set(profil.bidangKarir);

  const hasil = katalog.map((p) => {
    // Akademik: rata-rata tertimbang nilai siswa pada mapel pendukung, dikali cakupan
    // (mapel pendukung yang tidak diambil dihitung 0).
    const mapel = p.prodi_mapel
      .filter((pm) => pm.mapel)
      .map((pm) => ({
        kode: pm.mapel!.kode,
        nama: pm.mapel!.nama,
        bobot: Number(pm.bobot),
        nilai: profil.nilai[pm.mapel!.kode] ?? null,
      }))
      .sort((a, b) => b.bobot - a.bobot);
    const totalBobot = mapel.reduce((s, m) => s + m.bobot, 0);
    const terisi = mapel.filter((m) => m.nilai !== null);
    const bobotTerisi = terisi.reduce((s, m) => s + m.bobot, 0);
    const rataRataDiambil = bobotTerisi ? terisi.reduce((s, m) => s + m.bobot * (m.nilai! / 100), 0) / bobotTerisi : 0;
    const cakupan = totalBobot ? bobotTerisi / totalBobot : 0;
    const akademik = rataRataDiambil * cakupan;

    // Karir: target karir terhubung langsung > bidang karir sama.
    const karirTerkait = p.karir_prodi.map((kp) => kp.karir).filter((k) => k !== null);
    const cocokTarget = karirTerkait.filter((k) => targetKarir.has(k.id));
    const cocokBidang = karirTerkait.filter((k) => k.bidang_karir && bidangKarirSiswa.has(k.bidang_karir.kode));
    let karir = 0;
    let alasan: SkorProdi['karir']['alasan'] = null;
    let cocok: string[] = [];
    if (cocokTarget.length) {
      karir = A.SKOR_KARIR.targetLangsung;
      alasan = 'target_karir';
      cocok = cocokTarget.map((k) => k.nama);
    } else if (cocokBidang.length) {
      karir = A.SKOR_KARIR.bidangSama;
      alasan = 'bidang_karir';
      cocok = cocokBidang.map((k) => k.nama);
    }

    const minat = skorMinat(profil.riasec, p.kode_riasec);
    const total = bobot.minat * minat + bobot.akademik * akademik + bobot.karir * karir;

    return {
      peringkat: 0,
      prodi: {
        id: p.id,
        nama: p.nama,
        kode_riasec: p.kode_riasec,
        jenis_pendidikan: p.jenis_pendidikan,
        bidang_studi: p.bidang_studi,
        catatan_sumber: p.catatan_sumber,
      },
      skor: { total: r3(total), minat: r3(minat), akademik: r3(akademik), karir },
      akademik: {
        cakupan: r3(cakupan),
        rata_rata_mapel_diambil: r3(rataRataDiambil),
        data_kurang: cakupan < A.CAKUPAN_AKADEMIK_MIN,
        mapel,
      },
      karir: { alasan, cocok },
      contoh_karir: karirTerkait.map((k) => ({ id: k.id, nama: k.nama })),
    } satisfies SkorProdi;
  });

  hasil.sort((a, b) => b.skor.total - a.skor.total || a.prodi.nama.localeCompare(b.prodi.nama));
  hasil.forEach((h, i) => (h.peringkat = i + 1));
  return hasil;
}

/** jenjang_diminati -> jenis jalur di katalog (D3/D4 = vokasi). */
const JENJANG_KE_JENIS: Record<string, string> = { S1: 'akademik', D3: 'vokasi', D4: 'vokasi', kedinasan: 'kedinasan' };

export function hitungJenjang(pref: Preferensi | null) {
  const poin = new Map(A.JENJANG_DIREKOMENDASIKAN.map((j) => [j, { poin: 0, alasan: [] as string[] }]));
  const tambah = (tabel: Partial<Record<string, number>>, alasan: string) => {
    for (const [j, n] of Object.entries(tabel)) {
      const e = poin.get(j as (typeof A.JENJANG_DIREKOMENDASIKAN)[number]);
      if (e && n) {
        e.poin += n;
        e.alasan.push(`${alasan} (+${n})`);
      }
    }
  };
  for (const j of pref?.jenjang_diminati ?? []) tambah({ [j]: A.POIN_JENJANG.dipilihSiswa }, 'dipilih sendiri di profil');
  if (pref?.ingin_cepat_kerja) tambah(A.POIN_JENJANG.ingin_cepat_kerja, 'ingin cepat bekerja');
  if (pref?.gaya_belajar) tambah(A.POIN_JENJANG.gaya_belajar[pref.gaya_belajar] ?? {}, `gaya belajar ${pref.gaya_belajar}`);
  if ((pref?.pertimbangan_biaya ?? 0) >= A.POIN_JENJANG.biaya.ambang) {
    tambah(A.POIN_JENJANG.biaya.poin, `pertimbangan biaya tinggi (${pref!.pertimbangan_biaya}/5)`);
  }
  const urut = [...poin]
    .map(([jenjang, v]) => ({ jenjang, jalur: JENJANG_KE_JENIS[jenjang], ...v }))
    .sort((a, b) => b.poin - a.poin || A.JENJANG_DIREKOMENDASIKAN.indexOf(a.jenjang) - A.JENJANG_DIREKOMENDASIKAN.indexOf(b.jenjang));
  return {
    jenjang: urut,
    catatan: pref?.jenjang_diminati?.includes('langsung_kerja')
      ? 'Siswa juga memilih "langsung bekerja"; pilihan ini bukan jenjang pendidikan sehingga tidak diperingkat.'
      : null,
  };
}

// ------------------------------------------------------------------ cache
function stabil(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stabil);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, stabil((v as Record<string, unknown>)[k])]));
  }
  return v;
}
const sha256 = (v: unknown) => createHash('sha256').update(JSON.stringify(stabil(v))).digest('hex');

let katalogCache: { data: ProdiKatalog[]; versi: string; sampai: number } | null = null;
/** Katalog + versinya (hash isi). Disimpan di memori 60 detik. */
async function katalogDenganVersi() {
  if (katalogCache && katalogCache.sampai > Date.now()) return katalogCache;
  const data = await RekomendasiModel.katalog();
  katalogCache = { data, versi: sha256(data).slice(0, 16), sampai: Date.now() + 60_000 };
  return katalogCache;
}

// --------------------------------------------------------------- konteks siswa
export type Kekurangan = 'profil' | 'tes_minat' | 'nilai_rapor' | 'preferensi_pendidikan' | 'target_prodi_utama' | 'katalog';

async function muatKonteks(siswaId: string) {
  const [siswa, fitur, preferensi, targetKarirIds, targetUtama, katalog] = await Promise.all([
    SiswaModel.findById(siswaId),
    RekomendasiModel.fiturSiswa(siswaId),
    PreferensiModel.findBySiswa(siswaId),
    RekomendasiModel.targetKarirIds(siswaId),
    RekomendasiModel.targetProdiUtama(siswaId),
    katalogDenganVersi(),
  ]);
  const nilai = Object.fromEntries(
    Object.entries((fitur?.nilai as Record<string, number> | null) ?? {}).map(([k, v]) => [k, Number(v)]),
  );
  const riasec = fitur?.riasec
    ? Object.fromEntries(Object.entries(fitur.riasec as Record<string, number>).map(([k, v]) => [k, Number(v)]))
    : null;
  const profil: ProfilSiswa = {
    tingkat: siswa?.tingkat ?? null,
    nilai,
    riasec,
    bidangKarir: fitur?.bidang_karir ?? [],
    targetKarirIds,
  };
  // Prasyarat UC04/06/08 ("Pastikan sudah mengisi nilai rapor, mengerjakan tes minat, dan melengkapi profil").
  const kurang: Kekurangan[] = [];
  if (!siswa?.onboarding_selesai) kurang.push('profil');
  if (!riasec) kurang.push('tes_minat');
  if (Object.keys(nilai).length === 0) kurang.push('nilai_rapor');
  if (katalog.data.length === 0) kurang.push('katalog');
  return { siswa, profil, fitur, preferensi, targetUtama, katalog, kurang };
}
type Konteks = Awaited<ReturnType<typeof muatKonteks>>;

/** Masukan hash bersama: semua yang memengaruhi rekomendasi prodi (TANPA target_prodi). */
function inputDasar(k: Konteks) {
  return {
    versi_katalog: k.katalog.versi,
    tingkat: k.profil.tingkat,
    nilai: k.profil.nilai,
    riasec: k.profil.riasec,
    kemampuan: k.fitur?.kemampuan ?? null,
    mapel_favorit: k.fitur?.mapel_favorit ?? [],
    bidang_karir: k.profil.bidangKarir,
    target_karir: k.profil.targetKarirIds,
  };
}

export type HasilRekomendasi =
  | { tersedia: false; kurang: Kekurangan[] }
  | {
      tersedia: true;
      hasil: Json;
      penjelasan: string | null;
      /** Pembuat penjelasan: "mock" atau nama model Claude; null bila belum ada. */
      model_llm: string | null;
      dari_cache: boolean;
      dibuat_at: string;
      cacheId: string;
    };

/** Ambil dari cache (siswa, jenis, input_hash) atau hitung lalu simpan. */
async function dariCacheAtauHitung(
  siswaId: string,
  jenis: JenisRekomendasi,
  input: unknown,
  hitung: () => unknown,
): Promise<HasilRekomendasi> {
  const inputHash = sha256({ versi_algo: A.VERSI_ALGO, jenis, input });
  const ada = await RekomendasiModel.cariCache(siswaId, jenis, inputHash);
  if (ada) {
    return {
      tersedia: true,
      hasil: ada.hasil,
      penjelasan: ada.penjelasan,
      model_llm: ada.model_llm,
      dari_cache: true,
      dibuat_at: ada.created_at,
      cacheId: ada.id,
    };
  }
  const hasil = JSON.parse(JSON.stringify(hitung())) as Json;
  const { data, error } = await RekomendasiModel.simpanCache({
    siswa_id: siswaId,
    jenis,
    input_hash: inputHash,
    hasil,
    versi_algo: A.VERSI_ALGO,
  });
  if (error?.code === '23505') return dariCacheAtauHitung(siswaId, jenis, input, hitung); // permintaan paralel
  if (error) throw new AppError(500, 'DB_ERROR', error.message);
  return {
    tersedia: true,
    hasil: data!.hasil,
    penjelasan: null,
    model_llm: null,
    dari_cache: false,
    dibuat_at: data!.created_at,
    cacheId: data!.id,
  };
}

const katalogDraf = (k: Konteks) => k.katalog.data.some((p) => p.catatan_sumber?.startsWith('DRAF'));

// ------------------------------------------------------------------ API service
export const RekomendasiService = {
  muatKonteks,
  hitungProdi,
  dariCacheAtauHitung,
  inputDasar,
  katalogDraf,

  /** UC04 / F05 / F07: peringkat prodi + rumpun, dengan komponen skor & contoh karir. */
  async prodi(siswaId: string): Promise<HasilRekomendasi> {
    const k = await muatKonteks(siswaId);
    if (k.kurang.length) return { tersedia: false, kurang: k.kurang };
    return dariCacheAtauHitung(siswaId, 'prodi', inputDasar(k), () => {
      const semua = hitungProdi(k.profil, k.katalog.data);
      const jalurDiminati = new Set((k.preferensi?.jenjang_diminati ?? []).map((j) => JENJANG_KE_JENIS[j]).filter(Boolean));
      const rumpun = new Map<string, { bidang_studi: SkorProdi['prodi']['bidang_studi']; skor: number; prodi_terbaik: string }>();
      for (const s of semua) {
        const kode = s.prodi.bidang_studi?.kode ?? '-';
        if (!rumpun.has(kode)) rumpun.set(kode, { bidang_studi: s.prodi.bidang_studi, skor: s.skor.total, prodi_terbaik: s.prodi.nama });
      }
      return {
        bobot: bobotUntuk(k.profil.tingkat),
        tingkat: k.profil.tingkat,
        kode_holland: k.fitur?.kode_holland ?? null,
        katalog_draf: katalogDraf(k),
        jumlah_prodi_dinilai: semua.length,
        prodi: semua.slice(0, A.JUMLAH_PRODI_DITAMPILKAN).map((s) => ({
          ...s,
          sesuai_preferensi_jenjang: jalurDiminati.size ? s.prodi.jenis_pendidikan.some((j) => jalurDiminati.has(j)) : null,
        })),
        rumpun: [...rumpun.values()],
      };
    });
  },

  /** UC06 / F06: mapel pilihan berdasarkan prodi kandidat (target utama + prodi teratas). */
  async mapel(siswaId: string): Promise<HasilRekomendasi> {
    const k = await muatKonteks(siswaId);
    if (k.kurang.length) return { tersedia: false, kurang: k.kurang };
    const [mapelPilihan, diambil] = await Promise.all([RekomendasiModel.mapelPilihan(), SiswaPilihanModel.listMapel(siswaId)]);
    return dariCacheAtauHitung(
      siswaId,
      'mapel',
      { ...inputDasar(k), target_utama: k.targetUtama, mapel_diambil: diambil.map((m) => m.kode).sort() },
      () => {
        const semua = hitungProdi(k.profil, k.katalog.data);
        const utama = k.targetUtama ? semua.find((s) => s.prodi.id === k.targetUtama) : undefined;
        const kandidat = [
          ...(utama ? [{ ...utama, sebagai: 'target_utama' as const }] : []),
          ...semua
            .filter((s) => s.prodi.id !== k.targetUtama)
            .slice(0, A.JUMLAH_KANDIDAT_MAPEL)
            .map((s) => ({ ...s, sebagai: 'rekomendasi' as const })),
        ];
        const totalSkor = kandidat.reduce((a, c) => a + c.skor.total, 0) || 1;
        const sudah = new Set(diambil.map((m) => m.kode));
        const mapel = mapelPilihan
          .map((m) => {
            const dukungan = kandidat.flatMap((c) => {
              const pm = c.akademik.mapel.find((x) => x.kode === m.kode);
              return pm ? [{ prodi: c.prodi.nama, sebagai: c.sebagai, bobot: pm.bobot }] : [];
            });
            const skor = kandidat.reduce((a, c) => {
              const pm = c.akademik.mapel.find((x) => x.kode === m.kode);
              return a + (pm ? pm.bobot * c.skor.total : 0);
            }, 0);
            return { mapel: m, skor: r3(skor / totalSkor), nilai_siswa: k.profil.nilai[m.kode] ?? null, sudah_diambil: sudah.has(m.kode), dukungan };
          })
          .filter((m) => m.skor > 0)
          .sort((a, b) => b.skor - a.skor);
        return {
          relevan: (k.profil.tingkat ?? 12) <= 11, // UC06: kelas 10–11
          katalog_draf: katalogDraf(k),
          prodi_kandidat: kandidat.map((c) => ({ id: c.prodi.id, nama: c.prodi.nama, sebagai: c.sebagai, skor_total: c.skor.total })),
          mapel,
        };
      },
    );
  },

  /** UC07 / F09: jenjang (S1/D3/D4/kedinasan) HANYA dari preferensi pendidikan di profil siswa. */
  async jenjang(siswaId: string): Promise<HasilRekomendasi> {
    const pref = await PreferensiModel.findBySiswa(siswaId);
    const kosong =
      !pref ||
      (!pref.jenjang_diminati.length && !pref.gaya_belajar && pref.ingin_cepat_kerja === null && pref.pertimbangan_biaya === null);
    if (kosong) return { tersedia: false, kurang: ['preferensi_pendidikan'] };
    const input = {
      jenjang_diminati: [...pref.jenjang_diminati].sort(),
      gaya_belajar: pref.gaya_belajar,
      ingin_cepat_kerja: pref.ingin_cepat_kerja,
      pertimbangan_biaya: pref.pertimbangan_biaya,
    };
    return dariCacheAtauHitung(siswaId, 'jenis_pendidikan', input, () => ({ preferensi: input, ...hitungJenjang(pref) }));
  },
};
