# Load Test ArahIn (k6 + Prometheus + Grafana)

```
k6 (docker) ──remote write──▶ Prometheus ──▶ Grafana ──▶ grafana-image-renderer (PNG)
    │
    └── HTTP ──▶ nginx :4000 ──▶ backend-node-1/2 ──▶ Supabase lokal :54321 (GoTrue + Postgres)
```

| Level | Skenario | VU | Durasi |
|---|---|---|---|
| Warm-up | setiap run, tag `phase=warmup` | 10 | 2 menit |
| 1. Normal | aktivitas harian belajar-mengajar | 50 | 5 menit tahan |
| 2. Peak | minggu UAS | 500 | 5 menit tahan |
| 3. Stress | 250 → 500 → 750 → 1000, lalu tahan | 1000 | ±14 menit, berhenti otomatis jika error > 50% |

Satu iterasi VU meniru satu sesi siswa: beranda (`/me`, `/siswa/me`, asesmen terakhir) → tes minat
(instrumen, 30% iterasi mengirim jawaban) → rekomendasi prodi & jenjang → katalog. Setiap VU login
sebagai akun siswa dummy sendiri (`lt-0001@loadtest.arahin.local`, dst.).

Metrik fase warm-up diberi tag terpisah, jadi angka level utama (`phase=load`) tidak tercemar
oleh periode "dingin".

## Struktur

```
loadtest/
├─ docker-compose.yml          Prometheus, Grafana, renderer, k6 (profile)
├─ compose.backend-local.yml   override: backend Docker -> Supabase lokal
├─ prometheus/prometheus.yml
├─ grafana/                    datasource + dashboard "ArahIn k6 Load Test" (auto-provisioned)
├─ k6/main.js                  entry point; lib/levels.js, lib/flow.js, lib/summary.js
└─ scripts/                    orkestrasi Node (tanpa dependency)
   ├─ seed.mjs                 buat akun dummy + baris siswa + mapel
   ├─ tokens.mjs               login sekali, simpan token ke .data/tokens.json
   ├─ run-level.mjs            jalankan 1 level, render PNG, hapus data asesmen
   ├─ cleanup-data.mjs         hapus asesmen & cache rekomendasi akun dummy
   ├─ teardown.mjs             hapus data + akun dummy + metrik Prometheus
   └─ run-all.mjs              alur lengkap Normal -> Peak -> Stress
```

## Prasyarat

- Docker Desktop, Supabase CLI, Node 20+.
- **Naikkan rate limit login Supabase lokal.** Default-nya 30 login per 5 menit, sedangkan
  pengambilan token untuk 1000 akun butuh jauh lebih banyak. Di `supabase/config.toml`
  (hanya berlaku lokal):

  ```toml
  [auth.rate_limit]
  sign_in_sign_ups = 5000
  token_refresh = 5000
  ```

  Pilihan lain: kecilkan `LT_USERS` (akun dipakai bergiliran oleh beberapa VU).

## Langkah

Semua perintah `npm run ...` dijalankan dari folder `loadtest/`.

**1. Supabase lokal**

```bash
supabase start          # dari root repo
supabase status         # salin service_role / secret key
```

Salin `loadtest/.env.example` ke `loadtest/.env`, lalu isi `SUPABASE_SERVICE_ROLE_KEY`.

**2. Backend (2 node + nginx) diarahkan ke Supabase lokal**

```bash
# dari root repo
docker compose -f docker-compose.yml -f loadtest/compose.backend-local.yml \
  --env-file loadtest/.env up -d --build backend-node-1 backend-node-2 load-balancer
```

Alternatif tanpa Docker: isi `backend/.env` dengan `SUPABASE_URL=http://127.0.0.1:54321` lalu
`npm run build && npm start` di `backend/` (port 4000). Load test sebaiknya memakai build
produksi, bukan `npm run dev`.

**3. Stack Grafana**

```bash
npm run stack:up
```

Grafana: http://localhost:3001 (admin/admin), dashboard **Load Test → ArahIn k6 Load Test**.

**4a. Sekali jalan (direkomendasikan)**

```bash
npm run all
# opsi: -- --levels=normal,peak  --keep-metrics  --keep-users  --no-teardown
```

Isinya: preflight → seed → token → Normal → cooldown → Peak → cooldown → Stress → teardown.

**4b. Manual per langkah**

```bash
npm run seed
npm run tokens
npm run level:normal     # warm-up + level, render PNG, lalu hapus data asesmen
npm run level:peak
npm run level:stress
npm run teardown         # hapus akun dummy + metrik Prometheus
```

Untuk uji coba cepat (±3 menit): `HOLD=30s LOAD_VUS=10 WARMUP_DURATION=30s npm run level:normal`
(di PowerShell, set lewat `$env:HOLD='30s'` dulu, atau taruh di `loadtest/.env`).

## Saat tes berjalan

- Grafana live: link dicetak di terminal (sudah terfilter `testid` dan `phase=load`, refresh 5 detik).
- k6 web dashboard: http://localhost:5665
- Ambil screenshot manual tambahan bila perlu; PNG otomatis tetap dibuat setelah tes selesai.

## Hasil

`loadtest/results/<testid>/`:

| File | Isi |
|---|---|
| `report.md` | avg / p90 / **p95 / p99** total dan per endpoint, plus kalimat temuan siap kutip |
| `k6-report.html` | laporan HTML interaktif dari k6 |
| `grafana-dashboard.png` | render seluruh dashboard (fase load) |
| `grafana-dashboard-with-warmup.png` | idem, termasuk warm-up |
| `grafana-latency-p95-p99.png` dll. | render per panel |
| `summary.json`, `meta.json` | data mentah, waktu mulai/selesai, link Grafana |

Folder `results/` tidak dihapus oleh teardown dan di-ignore git.

### Membaca angka: p95/p99, bukan rata-rata

`report.md` otomatis menulis kalimat seperti:

> Rata-rata latensi 210 ms, tetapi p95 menunjukkan 5% request membutuhkan hingga 1.950 ms dan
> p99 (1% terlambat) mencapai 3.400 ms - ekor distribusi 9.3x lebih lambat dari rata-rata.

Di Grafana, panel **Latensi: rata-rata vs p95 vs p99** memperlihatkan kapan garis p95/p99
mulai menjauh dari rata-rata seiring naiknya VU. Pada stress test, titik itu adalah awal
bottleneck. Panel **TTFB vs connecting** membantu menentukan letaknya:

- **TTFB naik** artinya lambat di backend/DB. Kandidat utama: middleware `auth` memanggil
  `supabase.auth.getUser()` (GoTrue) di setiap request, ditambah satu query `profil`.
- **connecting/blocked naik** artinya antrean koneksi di nginx/OS, bukan aplikasi.
- Bandingkan juga panel p95 per endpoint (misalnya `POST /siswa/me/asesmen` yang menulis 3 tabel).

## Pembersihan data

| Kapan | Yang dihapus | Cara |
|---|---|---|
| Setelah tiap level | `asesmen` (+ `asesmen_riasec`/`asesmen_kemampuan` via cascade) dan `hasil_rekomendasi` milik akun dummy | otomatis (`--keep-data` untuk menonaktifkan) |
| Setelah semua level | akun dummy di `auth.users` → `profil` → `siswa` → `siswa_mapel` (cascade), `.data/` | `npm run teardown` (otomatis di `npm run all`) |
| Setelah semua level | seri `k6_*` di Prometheus (`delete_series` + `clean_tombstones`) | idem; `--keep-metrics` untuk mempertahankan |
| Total | volume Prometheus & Grafana | `npm run stack:purge` |

Pengaman: skrip hanya menyentuh akun berdomain `@loadtest.arahin.local` dan menolak
`SUPABASE_URL` non-lokal kecuali `LT_ALLOW_REMOTE=1`. Bila proses terhenti di tengah jalan
(Ctrl+C), jalankan `npm run teardown` secara manual.

## Catatan

- Token Supabase berlaku 1 jam. `run-level` otomatis login ulang bila sisa masa berlaku kurang
  dari durasi level + 5 menit.
- Yang diuji ikut membebani Supabase lokal di mesin yang sama. Angka absolutnya mencerminkan
  laptop penguji, bukan produksi; gunakan untuk perbandingan antar level dan mencari bottleneck.
- k6 di Docker Desktop (Windows) memakai `host.docker.internal` untuk mencapai backend di host.
