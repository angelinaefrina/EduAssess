/**
 * K-means (jarak Euclid) dengan inisialisasi k-means++ dan PRNG ber-seed,
 * sehingga hasil run dapat diulang dari klaster_run.parameter.seed.
 */
import { MAKS_ITERASI, N_INIT } from '../config/klaster';

export interface HasilKmeans {
  /** Indeks klaster per titik (0..k-1). */
  label: number[];
  centroid: number[][];
  /** Jarak tiap titik ke centroid klasternya. */
  jarak: number[];
  inersia: number;
}

/** mulberry32: PRNG 32-bit kecil yang deterministik. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jarak2(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return s;
}

/** Pilih indeks dengan peluang sebanding bobot; bila semua 0, pilih acak seragam. */
function pilihBerbobot(bobot: number[], acak: () => number): number {
  const total = bobot.reduce((s, b) => s + b, 0);
  if (total === 0) return Math.floor(acak() * bobot.length);
  let r = acak() * total;
  for (let i = 0; i < bobot.length; i++) {
    r -= bobot[i];
    if (r <= 0) return i;
  }
  return bobot.length - 1;
}

function kmeansSekali(titik: number[][], k: number, acak: () => number): HasilKmeans {
  const n = titik.length;
  // k-means++
  const centroid: number[][] = [[...titik[Math.floor(acak() * n)]]];
  const dMin = titik.map((p) => jarak2(p, centroid[0]));
  while (centroid.length < k) {
    const c = [...titik[pilihBerbobot(dMin, acak)]];
    centroid.push(c);
    titik.forEach((p, i) => (dMin[i] = Math.min(dMin[i], jarak2(p, c))));
  }

  const label = new Array<number>(n).fill(-1);
  for (let iter = 0; iter < MAKS_ITERASI; iter++) {
    let berubah = false;
    titik.forEach((p, i) => {
      let terbaik = 0;
      let dTerbaik = Infinity;
      centroid.forEach((c, j) => {
        const d = jarak2(p, c);
        if (d < dTerbaik) [terbaik, dTerbaik] = [j, d];
      });
      if (label[i] !== terbaik) [label[i], berubah] = [terbaik, true];
    });
    if (!berubah) break;

    const dim = titik[0].length;
    const jumlah = centroid.map(() => new Array<number>(dim).fill(0));
    const anggota = new Array<number>(k).fill(0);
    titik.forEach((p, i) => {
      anggota[label[i]]++;
      p.forEach((v, d) => (jumlah[label[i]][d] += v));
    });
    for (let j = 0; j < k; j++) {
      if (anggota[j] > 0) {
        centroid[j] = jumlah[j].map((v) => v / anggota[j]);
        continue;
      }
      // Klaster kosong: pindahkan centroid ke titik terjauh dari centroidnya.
      let jauh = 0;
      titik.forEach((p, i) => {
        if (jarak2(p, centroid[label[i]]) > jarak2(titik[jauh], centroid[label[jauh]])) jauh = i;
      });
      centroid[j] = [...titik[jauh]];
      label[jauh] = j;
    }
  }

  const jarak = titik.map((p, i) => Math.sqrt(jarak2(p, centroid[label[i]])));
  return { label, centroid, jarak, inersia: jarak.reduce((s, d) => s + d * d, 0) };
}

export function kmeans(titik: number[][], k: number, seed: number): HasilKmeans {
  if (k < 1 || k > titik.length) throw new RangeError('k harus di antara 1 dan jumlah titik');
  const acak = prng(seed);
  let terbaik: HasilKmeans | null = null;
  for (let i = 0; i < N_INIT; i++) {
    const h = kmeansSekali(titik, k, acak);
    if (!terbaik || h.inersia < terbaik.inersia) terbaik = h;
  }
  return terbaik!;
}
