// Buat akun siswa dummy (auth + profil via trigger + baris siswa + mapel).
// Idempoten: akun yang sudah ada dipakai ulang.
//   node scripts/seed.mjs [jumlah]
import { pathToFileURL } from 'node:url';
import {
  cfg,
  chunk,
  die,
  emailFor,
  listLoadtestUsers,
  log,
  pool,
  requireLocalSupabase,
  sb,
  USERS_FILE,
  writeJson,
} from './lib.mjs';

export async function seed(total = cfg.users) {
  requireLocalSupabase();
  log(`Seed ${total} akun dummy di ${cfg.supabaseUrl}`);

  const existing = new Map((await listLoadtestUsers()).map((u) => [u.email, u.id]));
  const targets = Array.from({ length: total }, (_, i) => emailFor(i));
  const missing = targets.filter((email) => !existing.has(email));
  log(`${existing.size} akun sudah ada, ${missing.length} akan dibuat`);

  let dibuat = 0;
  await pool(missing, cfg.concurrency, async (email) => {
    const r = await sb('POST', '/auth/v1/admin/users', {
      email,
      password: cfg.password,
      email_confirm: true,
      user_metadata: { nama: `Siswa LoadTest ${email.slice(3, 7)}`, loadtest: true },
    });
    if (!r.ok) die(`Gagal membuat ${email} (${r.status}): ${JSON.stringify(r.json)}`);
    existing.set(email, r.json.id);
    if (++dibuat % 100 === 0) log(`  ${dibuat}/${missing.length} akun dibuat`);
  });

  const users = targets.map((email) => ({ id: existing.get(email), email }));
  const ids = users.map((u) => u.id);

  // Baris `siswa` wajib ada agar POST /siswa/me/asesmen tidak ditolak (SISWA_BELUM_ADA).
  for (const part of chunk(ids, 500)) {
    const r = await sb(
      'POST',
      '/rest/v1/siswa?on_conflict=id',
      part.map((id) => ({ id, tingkat: 12, peminatan: 'IPA', rombel: 'LT', angkatan: 2027 })),
      { Prefer: 'resolution=merge-duplicates,return=minimal' },
    );
    if (!r.ok) die(`Gagal upsert siswa (${r.status}): ${JSON.stringify(r.json)}`);
  }

  // Mapel yang diambil, supaya rekomendasi punya data akademik untuk dihitung.
  const mapel = await sb('GET', '/rest/v1/mapel?select=id');
  if (!mapel.ok) die(`Gagal membaca mapel (${mapel.status})`);
  const mapelIds = mapel.json.map((m) => m.id);
  const rows = ids.flatMap((siswa_id) => mapelIds.map((mapel_id) => ({ siswa_id, mapel_id })));
  for (const part of chunk(rows, 2000)) {
    const r = await sb('POST', '/rest/v1/siswa_mapel?on_conflict=siswa_id,mapel_id', part, {
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    });
    if (!r.ok) die(`Gagal insert siswa_mapel (${r.status}): ${JSON.stringify(r.json)}`);
  }

  writeJson(USERS_FILE, users);
  log(`Selesai: ${users.length} akun siswa dummy -> ${USERS_FILE}`);
  return users;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await seed(process.argv[2] ? Number(process.argv[2]) : cfg.users);
}
