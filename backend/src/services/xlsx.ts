/**
 * Pembaca .xlsx minimal tanpa dependency: file xlsx = arsip ZIP berisi XML.
 * ZIP dibuka dengan zlib bawaan Node; XML dibaca dengan regex (cukup untuk
 * struktur SpreadsheetML yang teratur). Hanya MEMBACA nilai sel sebagai teks.
 */
import { inflateRawSync } from 'node:zlib';

/** Sheet: nomor baris Excel (1-based) -> sel per indeks kolom (0-based). */
export type SheetXlsx = Map<number, string[]>;

function bukaZip(buf: Buffer): Map<string, Buffer> {
  // End of Central Directory ada di ~22..65557 byte terakhir.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Bukan file xlsx/zip yang valid');

  const jumlah = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const isi = new Map<string, Buffer>();
  for (let n = 0; n < jumlah; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Central directory ZIP rusak');
    const metode = buf.readUInt16LE(p + 10);
    const ukuran = buf.readUInt32LE(p + 20);
    const panjangNama = buf.readUInt16LE(p + 28);
    const panjangExtra = buf.readUInt16LE(p + 30);
    const panjangKomentar = buf.readUInt16LE(p + 32);
    const offsetLokal = buf.readUInt32LE(p + 42);
    const nama = buf.toString('utf8', p + 46, p + 46 + panjangNama);

    const awalData =
      offsetLokal + 30 + buf.readUInt16LE(offsetLokal + 26) + buf.readUInt16LE(offsetLokal + 28);
    const data = buf.subarray(awalData, awalData + ukuran);
    if (metode === 0) isi.set(nama, data);
    else if (metode === 8) isi.set(nama, inflateRawSync(data));
    else throw new Error(`Metode kompresi ZIP ${metode} tidak didukung (${nama})`);

    p += 46 + panjangNama + panjangExtra + panjangKomentar;
  }
  return isi;
}

function dekodeEntitas(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    const k = e.toLowerCase();
    if (k === 'amp') return '&';
    if (k === 'lt') return '<';
    if (k === 'gt') return '>';
    if (k === 'quot') return '"';
    if (k === 'apos') return "'";
    return String.fromCodePoint(k.startsWith('#x') ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10));
  });
}

function atribut(tag: string): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const m of tag.matchAll(/([\w:]+)="([^"]*)"/g)) hasil[m[1]] = dekodeEntitas(m[2]);
  return hasil;
}

/** Gabungan semua <t> dalam satu elemen (rich text), tanpa teks fonetik <rPh>. */
function teksT(xml: string): string {
  const tanpaFonetik = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  return [...tanpaFonetik.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((m) => dekodeEntitas(m[1])).join('');
}

function indeksKolom(ref: string): number {
  const huruf = ref.match(/^[A-Z]+/)?.[0] ?? 'A';
  let n = 0;
  for (const h of huruf) n = n * 26 + (h.charCodeAt(0) - 64);
  return n - 1;
}

export function bacaXlsx(buf: Buffer): Map<string, SheetXlsx> {
  const zip = bukaZip(buf);
  const teks = (nama: string) => {
    const b = zip.get(nama);
    if (!b) throw new Error(`Bagian xlsx tidak ditemukan: ${nama}`);
    return b.toString('utf8');
  };

  const shared = zip.has('xl/sharedStrings.xml')
    ? [...teks('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => teksT(m[1]))
    : [];

  const target = new Map<string, string>();
  for (const m of teks('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)) {
    const a = atribut(m[0]);
    target.set(a.Id, a.Target);
  }

  const hasil = new Map<string, SheetXlsx>();
  for (const m of teks('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const a = atribut(m[0]);
    const t = target.get(a['r:id']);
    if (!t) continue;
    const path = t.startsWith('/') ? t.slice(1) : `xl/${t}`;
    const sheet: SheetXlsx = new Map();

    for (const r of teks(path).matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const nomor = Number(atribut(r[1]).r);
      const sel: string[] = [];
      for (const c of (r[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ac = atribut(c[1]);
        const dalam = c[2] ?? '';
        const v = dalam.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        let nilai = '';
        if (ac.t === 's' && v !== undefined) nilai = shared[Number(v)] ?? '';
        else if (ac.t === 'inlineStr') nilai = teksT(dalam);
        else if (ac.t === 'b') nilai = v === '1' ? 'TRUE' : 'FALSE';
        else if (v !== undefined) nilai = dekodeEntitas(v);
        sel[indeksKolom(ac.r ?? '')] = nilai;
      }
      sheet.set(nomor, Array.from(sel, (x) => x ?? ''));
    }
    hasil.set(a.name, sheet);
  }
  return hasil;
}
