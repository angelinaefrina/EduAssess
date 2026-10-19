// Utilitas bersama untuk skrip orkestrasi load test (Node 20+, tanpa dependency).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = path.join(ROOT, '.data');
export const RESULTS_DIR = path.join(ROOT, 'results');
export const USERS_FILE = path.join(DATA_DIR, 'users.json');
export const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');
export const TOKENS_META_FILE = path.join(DATA_DIR, 'tokens.meta.json');
export const RUNS_FILE = path.join(DATA_DIR, 'runs.json');

// Semua akun dummy memakai domain ini; teardown HANYA menghapus akun dengan domain ini.
export const EMAIL_DOMAIN = 'loadtest.arahin.local';

// ------------------------------------------------------------------ env
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const val = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadDotEnv(path.join(ROOT, '.env'));

const e = process.env;
export const cfg = {
  supabaseUrl: (e.SUPABASE_URL || 'http://127.0.0.1:54321').replace(/\/+$/, ''),
  serviceKey: e.SUPABASE_SERVICE_ROLE_KEY || '',
  allowRemote: e.LT_ALLOW_REMOTE === '1',
  users: Number(e.LT_USERS || 1000),
  password: e.LT_PASSWORD || 'LoadTest#2026!',
  concurrency: Number(e.LT_CONCURRENCY || 10),
  hostApiUrl: (e.LT_HOST_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, ''),
  k6BaseUrl: (e.LT_K6_BASE_URL || 'http://host.docker.internal:4000/api/v1').replace(/\/+$/, ''),
  prometheusUrl: (e.PROMETHEUS_URL || 'http://localhost:9090').replace(/\/+$/, ''),
  grafanaUrl: (e.GRAFANA_URL || 'http://localhost:3001').replace(/\/+$/, ''),
  grafanaUser: e.GRAFANA_ADMIN_USER || 'admin',
  grafanaPassword: e.GRAFANA_ADMIN_PASSWORD || 'admin',
  cooldownSec: Number(e.LT_COOLDOWN_SEC || 60),
};

export function requireLocalSupabase() {
  if (!cfg.serviceKey) die('SUPABASE_SERVICE_ROLE_KEY belum diisi di loadtest/.env (lihat `supabase status`).');
  const host = new URL(cfg.supabaseUrl).hostname;
  const lokal = ['127.0.0.1', 'localhost', 'host.docker.internal', '::1'].includes(host);
  if (!lokal && !cfg.allowRemote) {
    die(
      `SUPABASE_URL (${cfg.supabaseUrl}) bukan Supabase lokal. Skrip ini membuat & MENGHAPUS data.\n` +
        'Set LT_ALLOW_REMOTE=1 bila memang sengaja menargetkan project remote.',
    );
  }
}

// ------------------------------------------------------------------ util
export function die(msg) {
  console.error(`\n[x] ${msg}`);
  process.exit(1);
}

export const log = (msg) => console.log(`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function readJson(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;
}

export function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

export function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Jalankan fn untuk tiap item dengan batas konkurensi. */
export async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function emailFor(i) {
  return `lt-${String(i + 1).padStart(4, '0')}@${EMAIL_DOMAIN}`;
}

// ------------------------------------------------------------------ Supabase (service role)
function sbHeaders(extra = {}) {
  return {
    apikey: cfg.serviceKey,
    Authorization: `Bearer ${cfg.serviceKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function sb(method, pathAndQuery, body, extraHeaders) {
  const res = await fetch(`${cfg.supabaseUrl}${pathAndQuery}`, {
    method,
    headers: sbHeaders(extraHeaders),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, json };
}

/** Semua akun auth dengan domain load test (dipaginasi). */
export async function listLoadtestUsers() {
  const found = [];
  for (let page = 1; ; page++) {
    const r = await sb('GET', `/auth/v1/admin/users?page=${page}&per_page=1000`);
    if (!r.ok) die(`Gagal list user auth (${r.status}): ${JSON.stringify(r.json)}`);
    const users = r.json.users ?? [];
    for (const u of users) {
      if (u.email?.endsWith(`@${EMAIL_DOMAIN}`)) found.push({ id: u.id, email: u.email });
    }
    if (users.length < 1000) break;
  }
  return found;
}

/**
 * Hapus data hasil load test milik akun dummy (asesmen + cache rekomendasi).
 * asesmen_riasec / asesmen_kemampuan ikut terhapus lewat ON DELETE CASCADE.
 */
export async function deleteLoadtestData(siswaIds) {
  let asesmen = 0;
  let rekomendasi = 0;
  for (const ids of chunk(siswaIds, 100)) {
    const filter = `siswa_id=in.(${ids.join(',')})`;
    const prefer = { Prefer: 'return=representation,count=exact' };
    const a = await sb('DELETE', `/rest/v1/asesmen?${filter}&select=id`, undefined, prefer);
    if (!a.ok) die(`Gagal hapus asesmen (${a.status}): ${JSON.stringify(a.json)}`);
    asesmen += a.json?.length ?? 0;
    const h = await sb('DELETE', `/rest/v1/hasil_rekomendasi?${filter}&select=id`, undefined, prefer);
    if (!h.ok) die(`Gagal hapus hasil_rekomendasi (${h.status}): ${JSON.stringify(h.json)}`);
    rekomendasi += h.json?.length ?? 0;
  }
  return { asesmen, rekomendasi };
}

// ------------------------------------------------------------------ Prometheus & Grafana
export async function prometheusReady() {
  try {
    return (await fetch(`${cfg.prometheusUrl}/-/ready`)).ok;
  } catch {
    return false;
  }
}

export async function grafanaReady() {
  try {
    return (await fetch(`${cfg.grafanaUrl}/api/health`)).ok;
  } catch {
    return false;
  }
}

export async function backendReady() {
  try {
    const r = await fetch(`${cfg.hostApiUrl}/health`);
    if (!r.ok) return false;
    const body = await r.json();
    return body?.data?.db === 'ok';
  } catch {
    return false;
  }
}

/** Hapus seri metrik k6 di Prometheus lalu bersihkan tombstone (butuh --web.enable-admin-api). */
export async function deletePrometheusSeries(match = '{__name__=~"k6_.+"}') {
  const del = await fetch(
    `${cfg.prometheusUrl}/api/v1/admin/tsdb/delete_series?match[]=${encodeURIComponent(match)}`,
    { method: 'POST' },
  );
  if (!del.ok) throw new Error(`delete_series gagal (${del.status}): ${await del.text()}`);
  const clean = await fetch(`${cfg.prometheusUrl}/api/v1/admin/tsdb/clean_tombstones`, { method: 'POST' });
  if (!clean.ok) throw new Error(`clean_tombstones gagal (${clean.status}): ${await clean.text()}`);
}

/** Render PNG dashboard/panel lewat grafana-image-renderer. */
export async function renderGrafana(file, { testid, from, to, panelId, width = 1600, height = 900, phase = 'load' }) {
  const q = new URLSearchParams({
    orgId: '1',
    from: String(from),
    to: String(to),
    'var-testid': testid,
    'var-phase': phase,
    width: String(width),
    height: String(height),
    tz: 'Asia/Jakarta',
    timeout: '120',
  });
  let url;
  if (panelId) {
    q.set('panelId', String(panelId));
    url = `${cfg.grafanaUrl}/render/d-solo/arahin-k6/arahin-k6-load-test?${q}`;
  } else {
    q.set('kiosk', '1');
    url = `${cfg.grafanaUrl}/render/d/arahin-k6/arahin-k6-load-test?${q}`;
  }
  const auth = Buffer.from(`${cfg.grafanaUser}:${cfg.grafanaPassword}`).toString('base64');
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok || !res.headers.get('content-type')?.includes('image/png')) {
    throw new Error(`render gagal (${res.status}) untuk ${path.basename(file)}`);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// ------------------------------------------------------------------ proses
export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', ...opts });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}

export function timestamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
