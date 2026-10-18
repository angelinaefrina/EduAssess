/**
 * CSV minimal (RFC 4180) tanpa dependency.
 * Pemisah `;` adalah default Excel berlocale Indonesia; `,` juga diterima.
 */

export interface HasilParseCsv {
  baris: string[][];
  /** Nomor baris file untuk baris[0] (1-based), memperhitungkan baris `sep=`. */
  nomorAwal: number;
  pemisah: string;
}

function deteksiPemisah(barisPertama: string): string {
  let titikKoma = 0;
  let koma = 0;
  let dalamKutip = false;
  for (const c of barisPertama) {
    if (c === '"') dalamKutip = !dalamKutip;
    else if (!dalamKutip && c === ';') titikKoma++;
    else if (!dalamKutip && c === ',') koma++;
  }
  return titikKoma >= koma && titikKoma > 0 ? ';' : ',';
}

export function parseCsv(teks: string): HasilParseCsv {
  let isi = teks.replace(/^﻿/, '');
  let nomorAwal = 1;
  let pemisah: string;

  const sep = isi.match(/^sep=(.)\r?\n/i);
  if (sep) {
    pemisah = sep[1];
    isi = isi.slice(sep[0].length);
    nomorAwal = 2;
  } else {
    pemisah = deteksiPemisah(isi.split(/\r?\n/, 1)[0] ?? '');
  }

  const baris: string[][] = [];
  let sel = '';
  let barisIni: string[] = [];
  let dalamKutip = false;

  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (dalamKutip) {
      if (c === '"' && isi[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') {
        dalamKutip = false;
      } else {
        sel += c;
      }
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === pemisah) {
      barisIni.push(sel);
      sel = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && isi[i + 1] === '\n') i++;
      barisIni.push(sel);
      baris.push(barisIni);
      barisIni = [];
      sel = '';
    } else {
      sel += c;
    }
  }
  if (sel !== '' || barisIni.length > 0) {
    barisIni.push(sel);
    baris.push(barisIni);
  }
  return { baris, nomorAwal, pemisah };
}

export function toCsv(baris: (string | number | null)[][], pemisah = ';'): string {
  const kutip = (v: string | number | null) => {
    const s = v === null ? '' : String(v);
    return /[";\r\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return baris.map((b) => b.map(kutip).join(pemisah)).join('\r\n') + '\r\n';
}
