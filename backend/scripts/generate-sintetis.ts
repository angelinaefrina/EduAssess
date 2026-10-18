/**
 * Generator data sintetis berformat CSV ekspor Google Form (header identik).
 * Hasilnya WAJIB masuk lewat scripts/impor-survei.ts (--sumber sintetis).
 *
 *   npm run generate-sintetis -- <csv-survei-asli> [--per-bidang 55] [--seed 42]
 *       [--profil scripts/config/profil_asumsi.json] [--out ../data/sintetis_seed42.csv]
 *
 * Metode per bidang studi (Q4):
 *   - punya respons asli  -> RESAMPLING: salin satu responden asli (bergiliran),
 *     Likert digeser ±1 dgn peluang 30%, nilai rapor ±3, IPK ±0,1.
 *   - tidak punya respons -> ASUMSI: diacak di sekitar profil di file config.
 *     Kolom non-fitur (pengalaman memilih, kebutuhan sistem, dst.) diambil dari
 *     sebaran jawaban asli gabungan.
 * Jawaban bebas Q74–Q75 diisi "-" agar tulisan responden asli tidak terduplikasi.
 * File <out>.param.json mencatat seed, parameter, dan asal setiap baris
 * (dipakai sebagai batch_impor.parameter saat impor).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import { SurveiModel } from '../src/models/survei.model';
import { parseCsv, toCsv } from '../src/services/csv';
import * as F from '../src/services/surveiForm';

interface ProfilBidang {
  prodi: string[];
  peminatan: Record<string, number>;
  riasec: Record<string, number>;
  kemampuan: Record<string, number>;
  nilai: Record<string, number>;
  mapel_favorit: string[];
  bidang_karir: string[];
  fit: number;
}
interface FileProfil {
  sd_likert: number;
  sd_nilai: number;
  nilai_lain: number;
  tidak_diambil_per_peminatan: Record<string, string[]>;
  bidang: Record<string, ProfilBidang>;
}

const NOISE = { likert_peluang_geser: 0.3, likert_geser: 1, nilai_rentang: 3, ipk_rentang: 0.1 };

// --------------------------------------------------------------- acak (seeded)
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'per-bidang': { type: 'string', default: '55' },
      seed: { type: 'string', default: '42' },
      profil: { type: 'string', default: 'scripts/config/profil_asumsi.json' },
      out: { type: 'string' },
    },
  });
  const fileAsli = positionals[0];
  if (!fileAsli) {
    console.error('Pakai: npm run generate-sintetis -- <csv-survei-asli> [--per-bidang 55] [--seed 42] [--out file.csv]');
    process.exit(2);
  }
  const seed = Number(values.seed);
  const perBidang = Number(values['per-bidang']);
  const out = values.out ?? `../data/sintetis_seed${seed}.csv`;
  const teksProfil = readFileSync(values.profil!, 'utf8');
  const profil = JSON.parse(teksProfil) as FileProfil;

  const acak = mulberry32(seed);
  const pilih = <T>(xs: readonly T[]) => xs[Math.floor(acak() * xs.length)];
  const normalAcak = (rata: number, sd: number) =>
    rata + sd * Math.sqrt(-2 * Math.log(1 - acak())) * Math.cos(2 * Math.PI * acak());
  const jepit = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
  const likertAcak = (rata: number) => String(jepit(Math.round(normalAcak(rata, profil.sd_likert)), 1, 5));
  const pilihBerbobot = (bobot: Record<string, number>) => {
    const total = Object.values(bobot).reduce((a, b) => a + b, 0);
    let x = acak() * total;
    for (const [k, w] of Object.entries(bobot)) if ((x -= w) <= 0) return k;
    return Object.keys(bobot).at(-1)!;
  };
  const sampelTanpaUlang = <T>(xs: readonly T[], n: number) => {
    const sisa = [...xs];
    const hasil: T[] = [];
    while (hasil.length < n && sisa.length) hasil.push(sisa.splice(Math.floor(acak() * sisa.length), 1)[0]);
    return hasil;
  };

  // ------------------------------------------------------------ baca data asli
  const master = await SurveiModel.master();
  const { baris } = parseCsv(readFileSync(fileAsli, 'utf8'));
  const header = baris[0];
  const idx = new Map(header.map((h, i) => [F.normal(h), i]));
  const col = (judul: string) => {
    const i = idx.get(F.normal(judul));
    if (i === undefined) throw new Error(`Kolom tidak ditemukan di CSV asli: "${judul}"`);
    return i;
  };
  const asli = baris
    .slice(1)
    .filter((r) => r[col(F.KOLOM.q1)] === F.SETUJU_Q1 && r[col(F.KOLOM.q2)] === F.YA_Q2);

  const kolomLikert = [
    ...master.butir.map((b) => col(b.pernyataan)),
    ...master.dimensi.map((d) => col(d.pernyataan)),
    ...Object.values(F.GRID_Q64).map((b) => col(F.judulGrid(b))),
    ...Object.values(F.LIKERT_RESPONDEN).map((q) => col(F.KOLOM[q])),
  ];
  const kolomNilai = new Map(master.mapel.map((m) => [m.kode, col(F.judulNilai(m.nama))]));
  const iIpk = col(F.KOLOM.q68);

  const perBidangAsli = new Map<string, string[][]>();
  for (const r of asli) {
    const b = r[col(F.KOLOM.q4)];
    perBidangAsli.set(b, [...(perBidangAsli.get(b) ?? []), r]);
  }
  for (const b of perBidangAsli.keys()) {
    if (!(F.OPSI_Q4 as readonly string[]).includes(b)) throw new Error(`Bidang studi tidak dikenal di CSV asli: "${b}"`);
  }
  const bidangAsumsi = F.OPSI_Q4.filter((b) => !perBidangAsli.has(b));
  for (const b of bidangAsumsi) {
    if (!profil.bidang[b]) throw new Error(`Bidang "${b}" tidak punya respons asli dan tidak ada di file profil`);
  }

  // ---------------------------------------------------------- pembuat baris
  function resampling(sumber: string[]): string[] {
    const r = [...sumber];
    for (const i of kolomLikert) {
      if (acak() < NOISE.likert_peluang_geser) {
        r[i] = String(jepit(Number(r[i]) + (acak() < 0.5 ? -1 : 1) * NOISE.likert_geser, 1, 5));
      }
    }
    for (const i of kolomNilai.values()) {
      const v = Number(r[i].replace(',', '.'));
      r[i] = v <= F.BATAS_NILAI_TIDAK_DIAMBIL
        ? '0'
        : String(jepit(Math.round(v + (acak() * 2 - 1) * NOISE.nilai_rentang), 2, 100));
    }
    const ipk = Number(r[iIpk].replace(',', '.'));
    if (ipk > 0) r[iIpk] = jepit(ipk + (acak() * 2 - 1) * NOISE.ipk_rentang, 0, 4).toFixed(2);
    return r;
  }

  // Kolom non-fitur untuk baris asumsi diambil dari sebaran jawaban asli gabungan.
  const dariAsli = (i: number) => pilih(asli)[i];
  function asumsi(bidang: string): string[] {
    const p = profil.bidang[bidang];
    const r = header.map((_, i) => dariAsli(i));
    const peminatan = pilihBerbobot(p.peminatan);
    r[col(F.KOLOM.q4)] = bidang;
    r[col(F.KOLOM.q5)] = pilih(p.prodi);
    r[col(F.KOLOM.q8)] = peminatan;
    r[col(F.KOLOM.q7)] = peminatan === 'Kejuruan/SMK' ? 'SMK' : acak() < 0.85 ? 'SMA' : 'MA';
    r[col(F.KOLOM.q24)] = pilih(['Melihat langsung dari rapor.', 'Berdasarkan catatan nilai yang masih dimiliki.', 'Mengingat atau memperkirakan nilai.']);
    for (const b of master.butir) r[col(b.pernyataan)] = likertAcak(p.riasec[b.tipe]);
    for (const d of master.dimensi) r[col(d.pernyataan)] = likertAcak(p.kemampuan[d.kode]);
    for (const baris of Object.values(F.GRID_Q64)) r[col(F.judulGrid(baris))] = likertAcak(p.fit);
    const tidakDiambil = new Set(profil.tidak_diambil_per_peminatan[peminatan] ?? []);
    for (const [kode, i] of kolomNilai) {
      r[i] = tidakDiambil.has(kode)
        ? '0'
        : String(jepit(Math.round(normalAcak(p.nilai[kode] ?? profil.nilai_lain, profil.sd_nilai)), 60, 100));
    }
    r[col(F.KOLOM.q25)] = sampelTanpaUlang(p.mapel_favorit, 1 + Math.floor(acak() * 3)).join(F.PEMISAH_CHECKBOX);
    r[col(F.KOLOM.q53)] = sampelTanpaUlang(p.bidang_karir, 1 + Math.floor(acak() * 3)).join(F.PEMISAH_CHECKBOX);
    r[iIpk] = jepit(normalAcak(3.45, 0.25), 2, 4).toFixed(2);
    return r;
  }

  // ------------------------------------------------------------------ susun
  const rows: { isi: string[]; asal: Record<string, string> }[] = [];
  for (const bidang of F.OPSI_Q4) {
    const sumber = perBidangAsli.get(bidang);
    for (let i = 0; i < perBidang; i++) {
      if (sumber) {
        const s = sumber[i % sumber.length];
        rows.push({ isi: resampling(s), asal: { metode: 'resampling', timestamp_asli: s[col(F.KOLOM.timestamp)] } });
      } else {
        rows.push({ isi: asumsi(bidang), asal: { metode: 'asumsi', bidang } });
      }
    }
  }
  // Acak urutan, beri Timestamp baru, isi kolom identitas & teks bebas.
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  const mulai = Date.parse('2026-10-15T03:00:00Z');
  rows.forEach((row, i) => {
    row.isi[col(F.KOLOM.timestamp)] = F.formatTimestampForm(new Date(mulai + i * 97_000));
    row.isi[col(F.KOLOM.q1)] = F.SETUJU_Q1;
    row.isi[col(F.KOLOM.q2)] = F.YA_Q2;
    row.isi[col(F.KOLOM.q74)] = '-';
    row.isi[col(F.KOLOM.q75)] = '-';
  });

  writeFileSync(out, toCsv([header, ...rows.map((r) => r.isi)], ','), 'utf8');

  const parameter = {
    metode: 'resampling_noise+profil_asumsi',
    seed,
    per_bidang: perBidang,
    noise: NOISE,
    sumber_file: basename(fileAsli),
    sumber_jumlah_responden: asli.length,
    bidang_resampling: Object.fromEntries([...perBidangAsli].map(([b, rs]) => [b, rs.length])),
    bidang_asumsi: bidangAsumsi,
    profil_file: values.profil,
    profil_sha256: createHash('sha256').update(teksProfil).digest('hex'),
    catatan:
      'Data sintetis untuk demo. Baris "asumsi" berasal dari profil tulisan tim, bukan data. ' +
      'Jangan dipakai untuk evaluasi/klaim akurasi; baris "resampling" adalah kembaran responden asli (risiko kebocoran).',
    asal: rows.map((r, i) => ({ baris: i + 2, ...r.asal })),
  };
  writeFileSync(out.replace(/\.csv$/i, '') + '.param.json', JSON.stringify(parameter, null, 2), 'utf8');

  console.log(`Responden asli dipakai : ${asli.length}`);
  console.log(`Baris sintetis         : ${rows.length} (${perBidang} per bidang)`);
  console.log('Resampling             :', parameter.bidang_resampling);
  console.log('Asumsi                 :', bidangAsumsi.join(', ') || '-');
  console.log(`Ditulis                : ${out} (+ .param.json)`);
}

main().catch((err) => {
  console.error('GAGAL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
