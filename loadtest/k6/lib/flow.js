// Alur satu sesi siswa: buka beranda -> tes minat (kadang submit) -> lihat
// rekomendasi -> jelajah katalog. Jeda acak meniru waktu baca pengguna sungguhan.

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://host.docker.internal:4000/api/v1').replace(/\/+$/, '');
// Porsi iterasi yang mengirim jawaban asesmen (operasi tulis terberat).
const SUBMIT_RATIO = __ENV.SUBMIT_RATIO === undefined ? 0.3 : Number(__ENV.SUBMIT_RATIO);
// 0 = tanpa jeda (beban maksimum per VU), 1 = jeda realistis.
const THINK_SCALE = __ENV.THINK_SCALE === undefined ? 1 : Number(__ENV.THINK_SCALE);

export const ENDPOINTS = {
  me: 'GET /me',
  siswaMe: 'GET /siswa/me',
  asesmenTerakhir: 'GET /siswa/me/asesmen/terakhir',
  instrumen: 'GET /asesmen/instrumen',
  kirimAsesmen: 'POST /siswa/me/asesmen',
  rekomendasiProdi: 'GET /siswa/me/rekomendasi/prodi',
  rekomendasiJenjang: 'GET /siswa/me/rekomendasi/jenjang',
  katalogProdi: 'GET /katalog/prodi',
  mapel: 'GET /master/mapel',
};

const authFailures = new Counter('auth_failures');
const asesmenTerkirim = new Counter('asesmen_submitted');

// Cache per VU (setiap VU punya runtime JS sendiri).
let instrumen = null;

function think(min, max) {
  if (THINK_SCALE > 0) sleep((min + Math.random() * (max - min)) * THINK_SCALE);
}

function params(token, name) {
  return {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    tags: { name },
    timeout: '30s',
  };
}

function verify(res, name, okStatus = 200) {
  if (res.status === 401) authFailures.add(1);
  check(res, { [`${name} -> ${okStatus}`]: (r) => r.status === okStatus });
  return res;
}

function get(token, path, name) {
  return verify(http.get(`${BASE_URL}${path}`, params(token, name)), name);
}

const skorAcak = () => 1 + Math.floor(Math.random() * 5);

function ambilInstrumen(token) {
  const res = get(token, '/asesmen/instrumen', ENDPOINTS.instrumen);
  if (!instrumen && res.status === 200) {
    try {
      const data = res.json('data');
      instrumen = {
        riasec: data.riasec.map((b) => b.id),
        kemampuan: data.kemampuan.map((d) => d.id),
      };
    } catch (_e) {
      instrumen = null;
    }
  }
}

function kirimAsesmen(token) {
  if (!instrumen) return;
  const body = JSON.stringify({
    riasec: instrumen.riasec.map((butir_id) => ({ butir_id, skor: skorAcak() })),
    kemampuan: instrumen.kemampuan.map((dimensi_id) => ({ dimensi_id, skor: skorAcak() })),
  });
  const res = http.post(`${BASE_URL}/siswa/me/asesmen`, body, params(token, ENDPOINTS.kirimAsesmen));
  verify(res, ENDPOINTS.kirimAsesmen, 201);
  if (res.status === 201) asesmenTerkirim.add(1);
}

export function sesiSiswa(token) {
  group('beranda', () => {
    get(token, '/me', ENDPOINTS.me);
    get(token, '/siswa/me', ENDPOINTS.siswaMe);
    get(token, '/siswa/me/asesmen/terakhir', ENDPOINTS.asesmenTerakhir);
  });
  think(1, 3);

  group('tes-minat', () => {
    ambilInstrumen(token);
    if (Math.random() < SUBMIT_RATIO) {
      think(3, 6); // waktu mengisi kuesioner (dipendekkan)
      kirimAsesmen(token);
    }
  });
  think(1, 3);

  group('rekomendasi', () => {
    get(token, '/siswa/me/rekomendasi/prodi', ENDPOINTS.rekomendasiProdi);
    get(token, '/siswa/me/rekomendasi/jenjang', ENDPOINTS.rekomendasiJenjang);
  });
  think(2, 4);

  group('katalog', () => {
    get(token, '/katalog/prodi', ENDPOINTS.katalogProdi);
    get(token, '/master/mapel', ENDPOINTS.mapel);
  });
  think(2, 5);
}

export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`, { tags: { name: 'GET /health' } });
  if (res.status !== 200) {
    throw new Error(`Backend tidak sehat di ${BASE_URL}/health (status ${res.status}). Tes dibatalkan.`);
  }
  return BASE_URL;
}
