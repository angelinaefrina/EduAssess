// Jalankan satu level (warm-up + beban), simpan hasil, lalu hapus data asesmen.
//   node scripts/run-level.mjs <normal|peak|stress> [--keep-data]
//
// Hasil di results/<testid>/:
//   k6-report.html   laporan HTML interaktif dari k6 web dashboard
//   report.md        ringkasan p95/p99 per endpoint (siap dikutip)
//   summary.json     data mentah handleSummary
//   grafana-*.png    render dashboard Grafana (pengganti screenshot)
//   meta.json        waktu mulai/selesai, exit code, link Grafana
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleanupData } from './cleanup-data.mjs';
import {
  cfg,
  die,
  log,
  prometheusReady,
  readJson,
  renderGrafana,
  RESULTS_DIR,
  run,
  RUNS_FILE,
  sleep,
  timestamp,
  writeJson,
} from './lib.mjs';
import { ensureTokens } from './tokens.mjs';

// Perkiraan durasi (menit) termasuk warm-up 2 menit, untuk cek masa berlaku token.
const DURASI_MENIT = { normal: 9, peak: 10, stress: 17 };

// Env yang diteruskan apa adanya ke k6 bila di-set.
const PASSTHROUGH = [
  'WARMUP',
  'WARMUP_VUS',
  'WARMUP_DURATION',
  'SUBMIT_RATIO',
  'THINK_SCALE',
  'HOLD',
  'LOAD_VUS',
  'STRESS_ABORT',
  'STRESS_ABORT_ERROR_RATE',
];

const PANELS = [
  { file: 'grafana-latency-p95-p99.png', panelId: 7, width: 1800, height: 700 },
  { file: 'grafana-throughput.png', panelId: 8 },
  { file: 'grafana-error-rate.png', panelId: 9 },
  { file: 'grafana-status-codes.png', panelId: 10 },
  { file: 'grafana-p95-per-endpoint.png', panelId: 11, width: 1800 },
  { file: 'grafana-p99-per-endpoint.png', panelId: 12, width: 1800 },
  { file: 'grafana-ttfb.png', panelId: 14 },
  { file: 'grafana-endpoint-table.png', panelId: 13, width: 1800, height: 600 },
];

function exitInfo(code) {
  if (code === 0) return 'selesai, semua threshold lulus';
  // abortOnFail di stress test juga keluar dengan kode 99.
  if (code === 99) return 'selesai/dihentikan, ada threshold yang dilanggar (lihat report.md)';
  if (code === 105) return 'dihentikan manual (Ctrl+C)';
  if (code === 107 || code === 108) return `script k6 error (kode ${code})`;
  return `k6 keluar dengan kode ${code}`;
}

async function renderAll(dir, testid, from, to) {
  if (process.env.LT_SKIP_RENDER === '1') return;
  const range = { testid, from: from - 30_000, to: to + 30_000 };
  const jobs = [
    { file: 'grafana-dashboard.png', width: 1800, height: 3200 },
    { file: 'grafana-dashboard-with-warmup.png', width: 1800, height: 3200, phase: '.+' },
    ...PANELS,
  ];
  for (const j of jobs) {
    try {
      await renderGrafana(path.join(dir, j.file), { ...range, ...j });
      log(`  ${j.file}`);
    } catch (err) {
      log(`  [!] ${err.message} (cek container renderer; screenshot manual dari Grafana tetap bisa)`);
    }
  }
}

export async function runLevel(level, { keepData = false } = {}) {
  if (!DURASI_MENIT[level]) die(`Level tidak dikenal: ${level}. Pilih normal | peak | stress`);
  if (!(await prometheusReady())) die(`Prometheus belum jalan di ${cfg.prometheusUrl}. Jalankan \`npm run stack:up\`.`);

  await ensureTokens(DURASI_MENIT[level] + 5);

  const testid = `arahin-${level}-${timestamp()}`;
  const dir = path.join(RESULTS_DIR, testid);
  mkdirSync(dir, { recursive: true });

  const envArgs = [
    ['LEVEL', level],
    ['TESTID', testid],
    ['BASE_URL', cfg.k6BaseUrl],
    ['K6_WEB_DASHBOARD_EXPORT', `/results/${testid}/k6-report.html`],
    ...PASSTHROUGH.filter((k) => process.env[k] !== undefined).map((k) => [k, process.env[k]]),
  ].flatMap(([k, v]) => ['-e', `${k}=${v}`]);

  const grafanaLink = (from, to) =>
    `${cfg.grafanaUrl}/d/arahin-k6/arahin-k6-load-test?var-testid=${testid}&var-phase=load&from=${from}&to=${to ?? 'now'}`;

  const from = Date.now();
  log(`=== ${level.toUpperCase()} (${testid}) ===`);
  log(`Pantau live: ${grafanaLink(from)}&refresh=5s`);
  log('k6 web dashboard: http://localhost:5665');

  const code = await run('docker', [
    'compose',
    'run',
    '--rm',
    '--service-ports',
    ...envArgs,
    'k6',
    'run',
    '--tag',
    `testid=${testid}`,
    '-o',
    'experimental-prometheus-rw',
    '/scripts/main.js',
  ]);
  const to = Date.now();
  log(`k6 ${exitInfo(code)}`);

  // Beri waktu push remote-write terakhir masuk ke Prometheus sebelum render.
  await sleep(10_000);
  log('Render grafik Grafana...');
  await renderAll(dir, testid, from, to);

  const meta = {
    testid,
    level,
    started_at: new Date(from).toISOString(),
    finished_at: new Date(to).toISOString(),
    k6_exit_code: code,
    status: exitInfo(code),
    grafana: grafanaLink(from - 30_000, to + 30_000),
  };
  writeJson(path.join(dir, 'meta.json'), meta);
  writeJson(RUNS_FILE, [...readJson(RUNS_FILE, []), meta]);

  if (keepData) {
    log('--keep-data: data asesmen hasil tes TIDAK dihapus');
  } else {
    await cleanupData();
  }

  log(`Hasil: ${dir}`);
  return meta;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [level, ...rest] = process.argv.slice(2);
  if (!level) die('Pemakaian: node scripts/run-level.mjs <normal|peak|stress> [--keep-data]');
  const meta = await runLevel(level, { keepData: rest.includes('--keep-data') });
  // Exit code k6 diteruskan (0 / 99 / ...) agar bisa dipakai di CI.
  process.exit(meta.k6_exit_code);
}
