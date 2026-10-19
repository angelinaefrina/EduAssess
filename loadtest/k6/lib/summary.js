// Ringkasan akhir: summary.json mentah + report.md yang menonjolkan p95/p99
// (bukan rata-rata), siap dikutip ke laporan.

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
import { ENDPOINTS } from './flow.js';

const ms = (v) => (v === undefined || v === null || Number.isNaN(v) ? '-' : `${Math.round(v)} ms`);
const pct = (v) => (v === undefined || v === null ? '-' : `${(v * 100).toFixed(2)}%`);

function trend(data, key) {
  return data.metrics[key] ? data.metrics[key].values : undefined;
}

function kalimatTemuan(lat, errRate) {
  if (!lat) return '_Tidak ada data latensi fase load._';
  const rasio = lat['p(95)'] / Math.max(lat.avg, 1);
  let s =
    `Rata-rata latensi ${ms(lat.avg)}, tetapi p95 menunjukkan 5% request membutuhkan ` +
    `hingga ${ms(lat['p(95)'])} dan p99 (1% terlambat) mencapai ${ms(lat['p(99)'])}`;
  s += rasio >= 3 ? ` - ekor distribusi ${rasio.toFixed(1)}x lebih lambat dari rata-rata.` : '.';
  if (errRate !== undefined) s += ` Error rate ${pct(errRate)}.`;
  return s;
}

export function buildSummary(data, meta) {
  const lat = trend(data, 'http_req_duration{phase:load}');
  const wait = trend(data, 'http_req_waiting{phase:load}');
  const fail = trend(data, 'http_req_failed{phase:load}');
  const checks = trend(data, 'checks{phase:load}');
  const reqs = trend(data, 'http_reqs');
  const vusMax = trend(data, 'vus_max');
  const submitted = trend(data, 'asesmen_submitted');
  const authFail = trend(data, 'auth_failures');

  const rows = Object.values(ENDPOINTS)
    .map((name) => ({ name, v: trend(data, `http_req_duration{phase:load,name:${name}}`) }))
    .filter((r) => r.v && r.v.max > 0)
    .sort((a, b) => b.v['p(95)'] - a.v['p(95)']);

  const failedThresholds = Object.entries(data.metrics)
    .filter(([, m]) => m.thresholds && Object.values(m.thresholds).some((t) => !t.ok))
    .map(([k]) => k);

  const md = [
    `# ${meta.title}`,
    '',
    `- Test ID: \`${meta.testid}\``,
    `- Target: \`${meta.baseUrl}\``,
    `- Durasi total: ${Math.round(data.state.testRunDurationMs / 1000)} detik`,
    `- VU maksimum: ${vusMax ? vusMax.max : '-'}`,
    `- Total request (termasuk warm-up): ${reqs ? reqs.count : '-'} (${reqs ? reqs.rate.toFixed(1) : '-'} req/s)`,
    `- Asesmen terkirim: ${submitted ? submitted.count : 0}`,
    `- Kegagalan auth (401): ${authFail ? authFail.count : 0}`,
    '',
    '## Temuan utama (fase load, tanpa warm-up)',
    '',
    kalimatTemuan(lat, fail ? fail.rate : undefined),
    '',
    '| Metrik | avg | median | p90 | p95 | p99 | max |',
    '|---|---|---|---|---|---|---|',
    lat
      ? `| http_req_duration | ${ms(lat.avg)} | ${ms(lat.med)} | ${ms(lat['p(90)'])} | **${ms(lat['p(95)'])}** | **${ms(lat['p(99)'])}** | ${ms(lat.max)} |`
      : '| http_req_duration | - | - | - | - | - | - |',
    wait
      ? `| waiting (TTFB) | ${ms(wait.avg)} | ${ms(wait.med)} | ${ms(wait['p(90)'])} | ${ms(wait['p(95)'])} | ${ms(wait['p(99)'])} | ${ms(wait.max)} |`
      : '',
    '',
    `Error rate: **${fail ? pct(fail.rate) : '-'}** · Checks lulus: ${checks ? pct(checks.rate) : '-'}`,
    '',
    '## Per endpoint (urut p95 terburuk)',
    '',
    '| Endpoint | avg | p95 | p99 | max |',
    '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.name} | ${ms(r.v.avg)} | ${ms(r.v['p(95)'])} | ${ms(r.v['p(99)'])} | ${ms(r.v.max)} |`),
    '',
    '## Threshold',
    '',
    failedThresholds.length ? failedThresholds.map((t) => `- GAGAL: \`${t}\``).join('\n') : '- Semua threshold lulus.',
    '',
  ].join('\n');

  const dir = `/results/${meta.testid}`;
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [`${dir}/summary.json`]: JSON.stringify(data, null, 2),
    [`${dir}/report.md`]: md,
  };
}
