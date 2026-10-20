// Alur lengkap:
//   cek stack -> seed akun -> ambil token sekali ->
//   [normal -> peak -> stress]: k6 (tag testid) -> render Grafana -> hapus data asesmen
//   -> hapus akun dummy & metrik Prometheus.
//
//   node scripts/run-all.mjs [--levels=normal,peak] [--keep-metrics] [--keep-users] [--no-teardown]
import { cfg, backendReady, die, grafanaReady, log, prometheusReady, sleep } from './lib.mjs';
import { runLevel } from './run-level.mjs';
import { seed } from './seed.mjs';
import { teardown } from './teardown.mjs';
import { fetchTokens } from './tokens.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const levelsArg = args.find((a) => a.startsWith('--levels='));
const levels = levelsArg ? levelsArg.split('=')[1].split(',').map((s) => s.trim()) : ['normal', 'peak', 'stress'];

async function preflight() {
  const cek = [
    ['Backend', cfg.hostApiUrl + '/health', await backendReady(), 'jalankan backend (lihat README langkah 2)'],
    ['Prometheus', cfg.prometheusUrl, await prometheusReady(), 'npm run stack:up'],
    ['Grafana', cfg.grafanaUrl, await grafanaReady(), 'npm run stack:up'],
  ];
  for (const [nama, url, ok, saran] of cek) log(`${ok ? 'OK ' : 'XX '} ${nama} (${url})${ok ? '' : ` -> ${saran}`}`);
  if (cek.some(([, , ok]) => !ok)) die('Preflight gagal.');
}

await preflight();
await seed();
await fetchTokens();

const hasil = [];
try {
  for (const [i, level] of levels.entries()) {
    hasil.push(await runLevel(level));
    if (i < levels.length - 1 && cfg.cooldownSec > 0) {
      log(`Cooldown ${cfg.cooldownSec} detik agar sistem pulih sebelum level berikutnya`);
      await sleep(cfg.cooldownSec * 1000);
    }
  }
} finally {
  if (flag('--no-teardown')) {
    log('--no-teardown: akun dummy & metrik dibiarkan. Bersihkan nanti dengan `npm run teardown`.');
  } else {
    await teardown({ keepMetrics: flag('--keep-metrics'), keepUsers: flag('--keep-users') });
  }
}

console.log('\nRingkasan run:');
for (const m of hasil) console.log(`  ${m.level.padEnd(7)} ${m.testid}  ${m.status}`);
console.log('\nLaporan per level: loadtest/results/<testid>/report.md, k6-report.html, grafana-*.png');
