// Entry point k6. Contoh (biasanya lewat scripts/run-level.mjs):
//   k6 run -e LEVEL=peak -e TESTID=arahin-peak-... --tag testid=arahin-peak-... main.js
//
// Env:
//   LEVEL          normal | peak | stress (default normal)
//   BASE_URL       URL API, default http://host.docker.internal:4000/api/v1
//   TOKENS_FILE    default /data/tokens.json (hasil `npm run tokens`)
//   TESTID         harus sama dengan --tag testid (dipakai untuk folder hasil)
//   WARMUP=0       lewati warm-up; WARMUP_VUS / WARMUP_DURATION untuk mengubahnya
//   SUBMIT_RATIO   porsi iterasi yang mengirim asesmen (default 0.3)
//   THINK_SCALE    pengali jeda antar-langkah (default 1)
//   HOLD, LOAD_VUS override durasi tahan & jumlah VU (untuk uji coba singkat)

import { SharedArray } from 'k6/data';
import exec from 'k6/execution';
import { healthCheck, sesiSiswa } from './lib/flow.js';
import { buildOptions, LEVELS } from './lib/levels.js';
import { buildSummary } from './lib/summary.js';

const LEVEL = (__ENV.LEVEL || 'normal').toLowerCase();
const TESTID = __ENV.TESTID || `arahin-${LEVEL}-adhoc`;

const tokens = new SharedArray('tokens', () => {
  const list = JSON.parse(open(__ENV.TOKENS_FILE || '/data/tokens.json'));
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('tokens.json kosong. Jalankan `npm run seed` lalu `npm run tokens` dulu.');
  }
  return list;
});

export const options = buildOptions(LEVEL);

export function setup() {
  const baseUrl = healthCheck();
  console.log(`[${TESTID}] ${LEVELS[LEVEL].title} -> ${baseUrl} dengan ${tokens.length} akun dummy`);
  return { baseUrl };
}

export default function () {
  // Satu VU = satu akun siswa (berulang bila VU > jumlah akun).
  const t = tokens[(exec.vu.idInTest - 1) % tokens.length];
  sesiSiswa(t.access_token);
}

export function handleSummary(data) {
  return buildSummary(data, {
    title: LEVELS[LEVEL].title,
    testid: TESTID,
    baseUrl: (data.setup_data && data.setup_data.baseUrl) || __ENV.BASE_URL,
  });
}
