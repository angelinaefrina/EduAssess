/**
 * Impor CSV ekspor Google Form (survei asli MAUPUN sintetis) ke DB.
 *
 *   npm run impor-survei -- <file.csv> --sumber survei|sintetis
 *       [--keterangan "..."] [--parameter <file.json>] [--dibuat-dari <batch_id>]
 *       [--ganti] [--cek]
 *
 *   --cek    hanya validasi & laporan, tidak menulis ke DB
 *   --ganti  setelah impor berhasil, hapus batch lama dengan sumber & nama file sama
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import type { Json } from '../types/database';
import { SurveiModel } from '../src/models/survei.model';
import { ImporSurveiService } from '../src/services/ImporSurveiService';

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      sumber: { type: 'string' },
      keterangan: { type: 'string' },
      parameter: { type: 'string' },
      'dibuat-dari': { type: 'string' },
      ganti: { type: 'boolean', default: false },
      cek: { type: 'boolean', default: false },
    },
  });
  const file = positionals[0];
  const sumber = values.sumber;
  if (!file || (sumber !== 'survei' && sumber !== 'sintetis')) {
    console.error('Pakai: npm run impor-survei -- <file.csv> --sumber survei|sintetis [--cek] [--ganti]');
    process.exit(2);
  }

  const master = await SurveiModel.master();
  const hasil = ImporSurveiService.uraiCsvSurvei(readFileSync(file, 'utf8'), master);

  console.log(`File        : ${file}`);
  console.log(`Siap impor  : ${hasil.respon.length} responden`);
  console.log(`Dilewati    : ${hasil.dilewati.length}`);
  for (const d of hasil.dilewati) console.log(`  - baris ${d.baris}: ${d.alasan}`);
  const perBidang = new Map<number, number>();
  for (const x of hasil.respon) perBidang.set(x.responden.bidang_studi_id, (perBidang.get(x.responden.bidang_studi_id) ?? 0) + 1);
  console.log('Per bidang  :');
  for (const b of master.bidangStudi) console.log(`  ${String(perBidang.get(b.id) ?? 0).padStart(4)}  ${b.nama}`);
  const sel = hasil.respon.length * master.mapel.length;
  const terisi = hasil.respon.reduce((a, x) => a + x.nilai.length, 0);
  console.log(`Nilai rapor : ${terisi}/${sel} sel terisi (sisanya 0/1 = tidak diambil, tidak di-insert)`);

  if (hasil.errors.length) {
    console.error(`\n${hasil.errors.length} KESALAHAN — tidak ada yang disimpan:`);
    for (const e of hasil.errors.slice(0, 50)) console.error(`  ${e}`);
    process.exit(1);
  }
  if (values.cek) {
    console.log('\n--cek: validasi lolos, tidak menulis ke DB.');
    return;
  }
  if (hasil.respon.length === 0) {
    console.error('Tidak ada responden untuk diimpor.');
    process.exit(1);
  }

  const parameter = values.parameter ? (JSON.parse(readFileSync(values.parameter, 'utf8')) as Json) : undefined;
  const { batchId, batchLamaDihapus } = await ImporSurveiService.simpan(hasil.respon, {
    sumber,
    namaFile: basename(file),
    keterangan: values.keterangan ?? null,
    parameter,
    dibuatDari: values['dibuat-dari'] ?? null,
    ganti: values.ganti,
  });
  console.log(`\nBerhasil. batch_impor.id = ${batchId} (sumber=${sumber})`);
  if (batchLamaDihapus) console.log(`Batch lama dengan nama file sama dihapus: ${batchLamaDihapus}`);
}

main().catch((err) => {
  console.error('GAGAL:', err instanceof Error ? err.message : err);
  process.exit(1);
});
