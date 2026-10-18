/**
 * Impor katalog prodi & karir dari template Excel (data/katalog.xlsx).
 *
 *   Cek saja (tidak menyentuh database):
 *     npm run impor-katalog -- ../data/katalog.xlsx
 *   Tulis ke database (satu transaksi, semua atau tidak sama sekali):
 *     npm run impor-katalog -- ../data/katalog.xlsx --tulis
 *
 * Tanpa dependency tambahan: xlsx dibaca oleh src/services/xlsx.ts (zip + XML),
 * penulisan lewat fungsi Postgres impor_katalog(jsonb) yang dipanggil via
 * supabase.rpc. Satu panggilan RPC = satu transaksi (migration 20261016120000).
 */
import { readFileSync } from 'node:fs';
import { supabase } from '../src/config/supabase';
import { bacaXlsx, type SheetXlsx } from '../src/services/xlsx';

type Workbook = Map<string, SheetXlsx>;

// ------------------------------------------------------------------ types
type Row = Record<string, string>;
interface Sheet { name: string; rows: { excelRow: number; data: Row }[] }

interface Prodi {
  nama: string; bidang: string; jenis: string[]; riasec: string | null;
  deskripsi: string | null; sumber_url: string | null; catatan_sumber: string | null;
}
interface Karir {
  nama: string; bidang: string | null; riasec: string | null; trending: boolean;
  deskripsi: string | null; sumber_url: string | null; catatan_sumber: string | null;
}
interface PT { nama: string; jenis: string; kota: string | null; situs_url: string | null }
interface Katalog {
  prodi: Prodi[];
  prodiMapel: { prodi: string; mapel: string; bobot: number }[];
  karir: Karir[];
  karirProdi: { karir: string; prodi: string }[];
  pt: PT[];
  prodiPt: { prodi: string; pt: string; jenjang: string; sumber_url: string | null }[];
}

// ------------------------------------------------------------------ baca Excel
const DATA_START = 3; // baris 1 = header, baris 2 = penjelasan, baris 3 = contoh/data

function readSheet(wb: Workbook, name: string, errors: string[]): Sheet {
  const ws = wb.get(name);
  if (!ws) { errors.push(`Sheet "${name}" tidak ditemukan. Jangan mengganti nama sheet.`); return { name, rows: [] }; }
  const headers = (ws.get(1) ?? []).map((h) => h.trim().replace(/\*$/, ''));
  const rowCount = Math.max(0, ...ws.keys());
  const rows: Sheet['rows'] = [];
  for (let r = DATA_START; r <= rowCount; r++) {
    const cells = ws.get(r) ?? [];
    const data: Row = {};
    let empty = true;
    headers.forEach((h, col) => {
      if (!h) return;
      const t = (cells[col] ?? '').trim();
      data[h] = t;
      if (t) empty = false;
    });
    if (empty) continue;
    const firstKey = headers.find(Boolean)!;
    if (data[firstKey]?.startsWith('[CONTOH]')) continue; // baris contoh dilewati
    rows.push({ excelRow: r, data });
  }
  return { name, rows };
}

/** col: nomor kolom Excel 1-based (1 = kolom A). */
function readCodes(wb: Workbook, col: number): Set<string> {
  const ws = wb.get('REFERENSI');
  const out = new Set<string>();
  if (!ws) return out;
  for (const [r, cells] of ws) {
    if (r < 2) continue;
    const c = parseCode(cells[col - 1] ?? '');
    if (c) out.add(c);
  }
  return out;
}

// ------------------------------------------------------------------ validasi
// "KOMP — Komputer dan Informatika" -> "KOMP"; "komp" -> "KOMP"
const parseCode = (s: string) => (s.match(/^\s*([A-Za-z]+)/)?.[1] ?? '').toUpperCase();
const RIASEC_RE = /^[RIASEC]{1,3}$/;
const URL_RE = /^https?:\/\/\S+$/i;
const orNull = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

function validate(wb: Workbook): { katalog: Katalog; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const S = (n: string) => readSheet(wb, n, errors);
  const sh = {
    prodi: S('prodi'), prodiMapel: S('prodi_mapel'), karir: S('karir'),
    karirProdi: S('karir_prodi'), pt: S('perguruan_tinggi'), prodiPt: S('prodi_pt'),
  };
  const codes = { bidangStudi: readCodes(wb, 1), bidangKarir: readCodes(wb, 2), mapel: readCodes(wb, 3) };

  const at = (s: Sheet, r: number) => `[${s.name} baris ${r}]`;
  const need = (s: Sheet, r: number, d: Row, k: string) => {
    if (!d[k]) { errors.push(`${at(s, r)} kolom "${k}" wajib diisi.`); return false; }
    return true;
  };
  const needAll = (s: Sheet, r: number, d: Row, ks: string[]) =>
    ks.map((k) => need(s, r, d, k)).every(Boolean);
  const yesNo = (s: Sheet, r: number, d: Row, k: string): boolean => {
    const v = (d[k] ?? '').toUpperCase();
    if (v === '' || v === 'TIDAK') return false;
    if (v === 'YA') return true;
    errors.push(`${at(s, r)} kolom "${k}" harus YA atau TIDAK, tertulis "${d[k]}".`);
    return false;
  };
  const riasec = (s: Sheet, r: number, d: Row): string | null => {
    const v = (d.kode_riasec ?? '').toUpperCase().replace(/\s/g, '');
    if (!v) return null;
    if (!RIASEC_RE.test(v) || new Set(v).size !== v.length) {
      errors.push(`${at(s, r)} kode_riasec "${d.kode_riasec}" tidak valid: 1–3 huruf dari R,I,A,S,E,C tanpa pengulangan.`);
      return null;
    }
    return v;
  };
  const url = (s: Sheet, r: number, d: Row, k: string): string | null => {
    const v = orNull(d[k]);
    if (v && !URL_RE.test(v)) errors.push(`${at(s, r)} ${k} "${v}" harus diawali http:// atau https://.`);
    return v;
  };
  const unique = (s: Sheet, key: string) => {
    const seen = new Map<string, number>();
    for (const { excelRow, data } of s.rows) {
      const k = data[key]?.toLowerCase();
      if (!k) continue;
      if (seen.has(k)) errors.push(`${at(s, excelRow)} "${data[key]}" duplikat dengan baris ${seen.get(k)}.`);
      else seen.set(k, excelRow);
    }
  };

  // --- prodi
  unique(sh.prodi, 'nama_prodi');
  const prodi: Prodi[] = [];
  for (const { excelRow: r, data: d } of sh.prodi.rows) {
    if (!needAll(sh.prodi, r, d, ['nama_prodi', 'bidang_studi'])) continue;
    const bidang = parseCode(d.bidang_studi);
    if (!codes.bidangStudi.has(bidang)) errors.push(`${at(sh.prodi, r)} bidang_studi "${d.bidang_studi}" tidak dikenal. Pakai dropdown.`);
    const jenis = (['akademik', 'vokasi', 'kedinasan'] as const).filter((k) => yesNo(sh.prodi, r, d, k));
    if (jenis.length === 0) errors.push(`${at(sh.prodi, r)} minimal satu dari akademik/vokasi/kedinasan harus YA.`);
    const rc = riasec(sh.prodi, r, d);
    if (!d.kode_riasec) warnings.push(`${at(sh.prodi, r)} "${d.nama_prodi}" belum punya kode_riasec — skor minat untuk prodi ini tidak bisa dihitung.`);
    if (!orNull(d.catatan_sumber)) warnings.push(`${at(sh.prodi, r)} "${d.nama_prodi}" belum punya catatan_sumber.`);
    prodi.push({ nama: d.nama_prodi, bidang, jenis, riasec: rc, deskripsi: orNull(d.deskripsi),
      sumber_url: url(sh.prodi, r, d, 'sumber_url'), catatan_sumber: orNull(d.catatan_sumber) });
  }
  const prodiNames = new Map(prodi.map((p) => [p.nama.toLowerCase(), p.nama]));
  const refProdi = (s: Sheet, r: number, v: string) => {
    const hit = prodiNames.get(v.toLowerCase());
    if (!hit) errors.push(`${at(s, r)} prodi "${v}" tidak ada di sheet prodi (nama harus sama persis).`);
    return hit ?? v;
  };

  // --- prodi_mapel
  const prodiMapel: Katalog['prodiMapel'] = [];
  const pmSeen = new Set<string>();
  for (const { excelRow: r, data: d } of sh.prodiMapel.rows) {
    if (!needAll(sh.prodiMapel, r, d, ['nama_prodi', 'mapel', 'bobot'])) continue;
    const p = refProdi(sh.prodiMapel, r, d.nama_prodi);
    const m = parseCode(d.mapel);
    if (!codes.mapel.has(m)) errors.push(`${at(sh.prodiMapel, r)} mapel "${d.mapel}" tidak dikenal. Pakai dropdown.`);
    const b = Number(d.bobot.replace(',', '.'));
    if (!Number.isFinite(b) || b < 0.1 || b > 1) errors.push(`${at(sh.prodiMapel, r)} bobot "${d.bobot}" harus angka 0.1–1.0.`);
    const key = `${p.toLowerCase()}|${m}`;
    if (pmSeen.has(key)) errors.push(`${at(sh.prodiMapel, r)} pasangan prodi–mapel ini sudah ada di baris lain.`);
    pmSeen.add(key);
    prodiMapel.push({ prodi: p, mapel: m, bobot: Math.round(b * 100) / 100 });
  }
  for (const p of prodi)
    if (!prodiMapel.some((x) => x.prodi === p.nama))
      warnings.push(`[prodi] "${p.nama}" belum punya mapel pendukung — skor akademik untuk prodi ini tidak bisa dihitung.`);

  // --- karir
  unique(sh.karir, 'nama_karir');
  const karir: Karir[] = [];
  for (const { excelRow: r, data: d } of sh.karir.rows) {
    if (!need(sh.karir, r, d, 'nama_karir')) continue;
    let bidang: string | null = null;
    if (d.bidang_karir) {
      bidang = parseCode(d.bidang_karir);
      if (!codes.bidangKarir.has(bidang)) errors.push(`${at(sh.karir, r)} bidang_karir "${d.bidang_karir}" tidak dikenal. Pakai dropdown.`);
    }
    karir.push({ nama: d.nama_karir, bidang, riasec: riasec(sh.karir, r, d), trending: yesNo(sh.karir, r, d, 'is_trending'),
      deskripsi: orNull(d.deskripsi), sumber_url: url(sh.karir, r, d, 'sumber_url'), catatan_sumber: orNull(d.catatan_sumber) });
  }
  const karirNames = new Map(karir.map((k) => [k.nama.toLowerCase(), k.nama]));

  // --- karir_prodi
  const karirProdi: Katalog['karirProdi'] = [];
  const kpSeen = new Set<string>();
  for (const { excelRow: r, data: d } of sh.karirProdi.rows) {
    if (!needAll(sh.karirProdi, r, d, ['nama_karir', 'nama_prodi'])) continue;
    const k = karirNames.get(d.nama_karir.toLowerCase());
    if (!k) errors.push(`${at(sh.karirProdi, r)} karir "${d.nama_karir}" tidak ada di sheet karir.`);
    const p = refProdi(sh.karirProdi, r, d.nama_prodi);
    const key = `${(k ?? d.nama_karir).toLowerCase()}|${p.toLowerCase()}`;
    if (kpSeen.has(key)) errors.push(`${at(sh.karirProdi, r)} pasangan karir–prodi ini sudah ada di baris lain.`);
    kpSeen.add(key);
    karirProdi.push({ karir: k ?? d.nama_karir, prodi: p });
  }

  // --- perguruan_tinggi
  unique(sh.pt, 'nama_pt');
  const pt: PT[] = [];
  for (const { excelRow: r, data: d } of sh.pt.rows) {
    if (!needAll(sh.pt, r, d, ['nama_pt', 'jenis'])) continue;
    const j = d.jenis.toLowerCase();
    if (!['akademik', 'vokasi', 'kedinasan'].includes(j)) errors.push(`${at(sh.pt, r)} jenis "${d.jenis}" harus akademik/vokasi/kedinasan.`);
    pt.push({ nama: d.nama_pt, jenis: j, kota: orNull(d.kota), situs_url: url(sh.pt, r, d, 'situs_url') });
  }
  const ptNames = new Map(pt.map((x) => [x.nama.toLowerCase(), x.nama]));

  // --- prodi_pt
  const prodiPt: Katalog['prodiPt'] = [];
  const ppSeen = new Set<string>();
  for (const { excelRow: r, data: d } of sh.prodiPt.rows) {
    if (!needAll(sh.prodiPt, r, d, ['nama_prodi', 'nama_pt', 'jenjang'])) continue;
    const p = refProdi(sh.prodiPt, r, d.nama_prodi);
    const t = ptNames.get(d.nama_pt.toLowerCase());
    if (!t) errors.push(`${at(sh.prodiPt, r)} perguruan tinggi "${d.nama_pt}" tidak ada di sheet perguruan_tinggi.`);
    const jj = d.jenjang.toUpperCase() === 'KEDINASAN' ? 'kedinasan' : d.jenjang.toUpperCase();
    if (!['D3', 'D4', 'S1', 'kedinasan'].includes(jj)) errors.push(`${at(sh.prodiPt, r)} jenjang "${d.jenjang}" harus D3/D4/S1/kedinasan.`);
    const key = `${p.toLowerCase()}|${(t ?? d.nama_pt).toLowerCase()}|${jj}`;
    if (ppSeen.has(key)) errors.push(`${at(sh.prodiPt, r)} kombinasi prodi–PT–jenjang ini sudah ada di baris lain.`);
    ppSeen.add(key);
    prodiPt.push({ prodi: p, pt: t ?? d.nama_pt, jenjang: jj, sumber_url: url(sh.prodiPt, r, d, 'sumber_url') });
  }

  return { katalog: { prodi, prodiMapel, karir, karirProdi, pt, prodiPt }, errors, warnings };
}

// ------------------------------------------------------------------ tulis ke DB
interface HasilImpor {
  stat: { prodiBaru: number; prodiUbah: number; karirBaru: number; karirUbah: number; ptBaru: number; ptUbah: number };
  sisaProdi: string[];
  sisaKarir: string[];
}

/** Seluruh penulisan terjadi di fungsi Postgres impor_katalog: satu transaksi. */
async function write(k: Katalog): Promise<HasilImpor> {
  const { data, error } = await supabase.rpc('impor_katalog', { p: JSON.parse(JSON.stringify(k)) });
  if (error) throw new Error(error.message);
  return data as unknown as HasilImpor;
}

// ------------------------------------------------------------------ main
async function main() {
  const [file, ...flags] = process.argv.slice(2);
  if (!file) { console.error('Pakai: npm run impor-katalog -- <file.xlsx> [--tulis]'); process.exit(2); }
  const tulis = flags.includes('--tulis');

  const wb = bacaXlsx(readFileSync(file));
  const { katalog: k, errors, warnings } = validate(wb);

  console.log(`\nDibaca: ${k.prodi.length} prodi, ${k.prodiMapel.length} prodi_mapel, ${k.karir.length} karir, ` +
    `${k.karirProdi.length} karir_prodi, ${k.pt.length} perguruan_tinggi, ${k.prodiPt.length} prodi_pt`);
  if (warnings.length) { console.log(`\n⚠  ${warnings.length} peringatan (boleh lanjut):`); warnings.forEach((w) => console.log('   ' + w)); }
  if (errors.length) {
    console.log(`\n✖  ${errors.length} kesalahan — perbaiki dulu, tidak ada yang ditulis:`);
    errors.forEach((e) => console.log('   ' + e));
    process.exit(1);
  }
  console.log('\n✔  Tidak ada kesalahan.');
  if (!tulis) { console.log('   Mode cek saja. Tambahkan --tulis untuk menyimpan ke database.\n'); return; }

  try {
    const { stat, sisaProdi, sisaKarir } = await write(k);
    console.log(`\n✔  Tersimpan. Prodi: ${stat.prodiBaru} baru, ${stat.prodiUbah} diperbarui. ` +
      `Karir: ${stat.karirBaru} baru, ${stat.karirUbah} diperbarui. PT: ${stat.ptBaru} baru, ${stat.ptUbah} diperbarui.`);
    if (sisaProdi.length || sisaKarir.length) {
      console.log('\n⚠  Ada di database tetapi tidak ada di file (tidak dihapus):');
      if (sisaProdi.length) console.log('   prodi: ' + sisaProdi.join(', '));
      if (sisaKarir.length) console.log('   karir: ' + sisaKarir.join(', '));
    }
    console.log();
  } catch (e) {
    console.error('\n✖  Gagal, semua perubahan dibatalkan:', (e as Error).message);
    process.exitCode = 1;
  }
}

main();
