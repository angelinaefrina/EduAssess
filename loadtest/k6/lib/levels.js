// Definisi level beban. Setiap run = warm-up (opsional) + satu level.
//
//   warmup : 5–10 VU selama 2 menit agar koneksi DB, cache katalog (60 dtk di
//            RekomendasiService), dan JIT Node "memanas". Metriknya diberi tag
//            phase=warmup sehingga tidak mencemari angka level utama.
//   normal : 50 VU selama 5 menit   (aktivitas harian belajar-mengajar)
//   peak   : 500 VU selama 5 menit  (minggu UAS)
//   stress : naik bertahap sampai 1000 VU untuk mencari bottleneck

import { ENDPOINTS } from './flow.js';

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

const WARMUP_VUS = num(__ENV.WARMUP_VUS, 10);
const WARMUP_DURATION = __ENV.WARMUP_DURATION || '2m';
const WARMUP_ENABLED = __ENV.WARMUP !== '0' && WARMUP_VUS > 0;

// Override cepat untuk uji coba: HOLD=30s memperpendek fase tahan.
const hold = (d) => __ENV.HOLD || d;

export const LEVELS = {
  normal: {
    title: 'Level 1 - Beban Normal (50 VU, 5 menit)',
    stages: [
      { duration: '30s', target: num(__ENV.LOAD_VUS, 50) },
      { duration: hold('5m'), target: num(__ENV.LOAD_VUS, 50) },
      { duration: '30s', target: 0 },
    ],
    slo: { p95: 1000, p99: 2000, errorRate: 0.01 },
  },
  peak: {
    title: 'Level 2 - Beban Puncak / UAS (500 VU, 5 menit)',
    stages: [
      { duration: '1m', target: num(__ENV.LOAD_VUS, 500) },
      { duration: hold('5m'), target: num(__ENV.LOAD_VUS, 500) },
      { duration: '30s', target: 0 },
    ],
    slo: { p95: 1500, p99: 3000, errorRate: 0.02 },
  },
  stress: {
    title: 'Level 3 - Stress Test (naik bertahap hingga 1000 VU)',
    stages: [
      { duration: '2m', target: 250 },
      { duration: '2m', target: 500 },
      { duration: '2m', target: 750 },
      { duration: '2m', target: num(__ENV.LOAD_VUS, 1000) },
      { duration: hold('5m'), target: num(__ENV.LOAD_VUS, 1000) },
      { duration: '1m', target: 0 },
    ],
    // Stress test memang diharapkan melanggar SLO; yang dicari adalah titik patahnya.
    slo: null,
  },
};

export function buildOptions(levelName) {
  const level = LEVELS[levelName];
  if (!level) {
    throw new Error(`LEVEL tidak dikenal: "${levelName}". Pilih: ${Object.keys(LEVELS).join(', ')}`);
  }

  const scenarios = {
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: level.stages,
      gracefulRampDown: '30s',
      gracefulStop: '30s',
      startTime: WARMUP_ENABLED ? WARMUP_DURATION : '0s',
      tags: { phase: 'load' },
    },
  };
  if (WARMUP_ENABLED) {
    scenarios.warmup = {
      executor: 'constant-vus',
      vus: WARMUP_VUS,
      duration: WARMUP_DURATION,
      gracefulStop: '5s',
      tags: { phase: 'warmup' },
    };
  }

  const thresholds = {
    // Submetrik ini juga membuat summary punya angka khusus fase load.
    'http_req_duration{phase:load}': level.slo
      ? [`p(95)<${level.slo.p95}`, `p(99)<${level.slo.p99}`]
      : ['p(95)>=0'],
    'http_req_failed{phase:load}': level.slo
      ? [`rate<${level.slo.errorRate}`]
      : [
          // Hentikan stress test kalau sistem sudah benar-benar ambruk (>50% gagal selama 1 menit).
          {
            threshold: `rate<${num(__ENV.STRESS_ABORT_ERROR_RATE, 0.5)}`,
            abortOnFail: __ENV.STRESS_ABORT !== '0',
            delayAbortEval: '1m',
          },
        ],
    'http_req_waiting{phase:load}': ['p(95)>=0'],
    'checks{phase:load}': ['rate>=0'],
  };
  // Threshold "dummy" per endpoint supaya p95/p99 tiap endpoint muncul di summary.json.
  for (const name of Object.values(ENDPOINTS)) {
    thresholds[`http_req_duration{phase:load,name:${name}}`] = ['p(95)>=0'];
  }

  return {
    scenarios,
    thresholds,
    summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
    // Tanpa tag `url` agar kardinalitas label Prometheus tetap kecil (name sudah cukup).
    systemTags: ['status', 'method', 'name', 'group', 'check', 'error', 'error_code', 'scenario', 'expected_response'],
    discardResponseBodies: false,
    noConnectionReuse: false,
    userAgent: 'arahin-k6-loadtest/1.0',
  };
}
