// Login semua akun dummy SEKALI dan simpan access token untuk k6.
// Token Supabase lokal berlaku 1 jam (jwt_expiry di supabase/config.toml).
//   node scripts/tokens.mjs
import { pathToFileURL } from 'node:url';
import {
  cfg,
  die,
  log,
  pool,
  readJson,
  requireLocalSupabase,
  sb,
  sleep,
  TOKENS_FILE,
  TOKENS_META_FILE,
  USERS_FILE,
  writeJson,
} from './lib.mjs';

async function signIn(email) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await sb('POST', '/auth/v1/token?grant_type=password', { email, password: cfg.password });
    if (r.ok) return r.json;
    if (r.status === 429) {
      if (attempt === 3) {
        die(
          'Kena rate limit login Supabase (429).\n' +
            'Untuk Supabase lokal, naikkan batas di supabase/config.toml:\n' +
            '  [auth.rate_limit]\n  sign_in_sign_ups = 5000\n' +
            'lalu `supabase stop && supabase start`, dan jalankan ulang `npm run tokens`.',
        );
      }
      await sleep(2000 * attempt);
      continue;
    }
    die(`Login ${email} gagal (${r.status}): ${JSON.stringify(r.json)}`);
  }
}

export async function fetchTokens() {
  requireLocalSupabase();
  const users = readJson(USERS_FILE, null);
  if (!users?.length) die('Belum ada akun dummy. Jalankan `npm run seed` dulu.');

  log(`Login ${users.length} akun dummy (konkurensi ${cfg.concurrency})`);
  let selesai = 0;
  let minExpiresAt = Infinity;
  const tokens = await pool(users, cfg.concurrency, async (u) => {
    const s = await signIn(u.email);
    minExpiresAt = Math.min(minExpiresAt, s.expires_at ?? Math.floor(Date.now() / 1000) + s.expires_in);
    if (++selesai % 100 === 0) log(`  ${selesai}/${users.length} token`);
    return { user_id: u.id, access_token: s.access_token };
  });

  writeJson(TOKENS_FILE, tokens);
  const meta = { created_at: new Date().toISOString(), expires_at: new Date(minExpiresAt * 1000).toISOString(), count: tokens.length };
  writeJson(TOKENS_META_FILE, meta);
  log(`Token tersimpan (${tokens.length}), kedaluwarsa paling cepat ${meta.expires_at}`);
  return meta;
}

/** Ambil token baru bila yang lama tidak cukup untuk `neededMinutes` ke depan. */
export async function ensureTokens(neededMinutes) {
  const meta = readJson(TOKENS_META_FILE, null);
  const sisaMenit = meta ? (new Date(meta.expires_at).getTime() - Date.now()) / 60000 : -1;
  if (sisaMenit > neededMinutes) {
    log(`Token masih berlaku ${Math.floor(sisaMenit)} menit lagi, dipakai ulang`);
    return meta;
  }
  return fetchTokens();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await fetchTokens();
}
