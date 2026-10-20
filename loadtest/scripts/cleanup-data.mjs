// Hapus data asesmen (dan cache rekomendasi) hasil load test. Akun dummy tetap ada.
//   node scripts/cleanup-data.mjs
import { pathToFileURL } from 'node:url';
import { deleteLoadtestData, listLoadtestUsers, log, requireLocalSupabase } from './lib.mjs';

export async function cleanupData() {
  requireLocalSupabase();
  // Ambil dari Auth (bukan users.json) agar tetap bersih walau file lokal hilang.
  const ids = (await listLoadtestUsers()).map((u) => u.id);
  if (ids.length === 0) {
    log('Tidak ada akun dummy, tidak ada data yang perlu dihapus');
    return { asesmen: 0, rekomendasi: 0 };
  }
  const hasil = await deleteLoadtestData(ids);
  log(`Data load test dihapus: ${hasil.asesmen} asesmen, ${hasil.rekomendasi} cache rekomendasi`);
  return hasil;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await cleanupData();
}
