# Dokumentasi Arsitektur Cloud Service & High Availability (ArahIn)

Dokumen ini disusun untuk memenuhi spesifikasi **Tugas Cloud Service**:
- **Mini Milestone 1:** Setup Infrastruktur (2-Node High Availability & Load Balancer)
- **Mini Milestone 2:** Panduan Eksperimen Load Testing (untuk rekan tim)
- **Mini Milestone 3:** Kerangka Analisis Biaya (TCO) & Unit Economics
- **Deliverables Tambahan:** Dokumen SLA (WSLA) & Kebijakan Keamanan (Security Policy)

---

## 1. Arsitektur Teknis (Full-Stack 2-Node High Availability)

### Diagram Topologi

```
                          [ Pengguna / Browser / Load Tester ]
                                           │
                                           ▼
                       ┌───────────────────────────────────────┐
                       │      Nginx Reverse Proxy & LB         │
                       │   - Port 80: HTTP Gateway             │
                       │     • /     -> Frontend App           │
                       │     • /api/ -> Backend Cluster        │
                       │   - Port 4000: Direct Backend API     │
                       │   - Algoritma: least_conn             │
                       └───────────────┬───────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      Traffic Web (Port 3000)                       Traffic API (Port 4000)
                ▼                                             ▼
  ┌───────────────────────────┐             ┌───────────────────────────────────┐
  │   Frontend (Next.js 16)   │             │      Backend Cluster (2 Nodes)    │
  │   - Container:            │             │                                   │
  │     arahin-frontend       │             │  ┌───────────────┐ ┌───────────────┐
  │   - Port: 3000 (Internal) │             │  │ Backend Node 1│ │ Backend Node 2│
  │   - Mode: Standalone      │             │  │ Express API   │ │ Express API   │
  │   - Direct Port: 3000     │             │  │ Node: node-1  │ │ Node: node-2  │
  └─────────────┬─────────────┘             │  │ Port: 4000    │ │ Port: 4000    │
                │                           │  └───────┬───────┘ └───────┬───────┘
                │ SSR API Calls (Internal)  └──────────┼─────────────────┼──────┘
                └──────────────────────────────────────┴────────┬────────┘
                                                                │
                                                                │ HTTPS / TLS (Port 5432 / 443)
                                                                ▼
                                            ┌─────────────────────────────────────┐
                                            │       Supabase Managed Cloud        │
                                            │  - PostgreSQL Database (Auth & RLS) │
                                            │  - Storage (Katalog & Data)         │
                                            └─────────────────────────────────────┘
```

### Mengapa Desain Ini Memenuhi Syarat High Availability (HA)?
1. **Stateless Backend:** Server backend tidak menyimpan state sesi di memori lokal. Setiap *request* memvalidasi token JWT Supabase. Sehingga request apapun bisa diarahkan ke Node 1 maupun Node 2 secara bergantian tanpa *session disruption*.
2. **Reverse Proxy Load Balancing:** Nginx bertindak sebagai gerbang tunggal dengan algoritma `least_conn` (mengarahkan beban ke node dengan koneksi aktif paling sedikit).
3. **Passive Health Check & Automatic Failover:**
   - Parameter Nginx: `max_fails=3 fail_timeout=10s;`
   - Kebijakan failover: `proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;`
   - Jika Node 1 mati atau mengalami lonjakan kegagalan, Nginx dalam hitungan milidetik mengalihkan request ke Node 2 tanpa kegagalan yang tampak di sisi pengguna (0% error rate).
4. **Header Transparansi Monitoring:**
   - `X-Node-Id`: Mengidentifikasi node pemroses (`node-1` atau `node-2`).
   - `X-Served-By`: IP & Port internal upstream container.
   - `X-Upstream-Response-Time`: Latensi respon upstream node dalam detik.

---

## 2. Cara Menjalankan & Memverifikasi Full Stack (Docker Compose)

### Menjalankan Seluruh Sistem (Frontend + 2-Node Backend + Nginx)
Cukup jalankan satu perintah dari root direktori proyek:
```bash
# Build dan jalankan seluruh container di background
docker compose up -d

# Periksa status seluruh container (pastikan semua berstatus healthy)
docker compose ps
```

Setelah berjalan:
- **Aplikasi Web (Frontend):** Akses [http://localhost](http://localhost) (Port 80) atau [http://localhost:3000](http://localhost:3000)
- **API Backend (Load Balanced):** [http://localhost/api/v1/health](http://localhost/api/v1/health) atau [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
- **Monitoring Nginx:** [http://localhost/stub_status](http://localhost/stub_status)

### Menguji Distribusi Beban (Round-Robin / Least-Conn)
Jalankan skrip pengujian bawaan:
```bash
./scripts/test-cluster.sh http://localhost/api/v1/health 10
```
*Output yang diharapkan:* Request bergantian dilayani secara seimbang oleh `node-1` dan `node-2`.

### Menguji Failover (Simulasi Server Down)
1. Matikan Node 1 secara paksa:
   ```bash
   docker stop arahin-backend-node-1
   ```
2. Jalankan kembali tes:
   ```bash
   ./scripts/test-cluster.sh http://localhost/api/v1/health 5
   ```
3. *Hasil:* Seluruh request tetap berhasil (HTTP 200) dan dilayani 100% oleh `node-2`.
4. Nyalakan kembali Node 1:
   ```bash
   docker start arahin-backend-node-1
   ```
   Traffic otomatis kembali terbagi dua.

---

## 3. Panduan untuk Rekan Tim (Mini Milestone 2: Load Testing)

Berikan informasi berikut ke rekan tim yang bertugas melakukan pengujian beban:

### A. Endpoint Target Pengujian
1. **Baseline / Healthcheck (Lightweight):**
   - Method: `GET`
   - URL: `http://<HOST>/api/v1/health`
   - Karakteristik: Menguji throughput murni Nginx + Express + DB ping.
2. **Katalog Prodi & Master Data (Database Read-Heavy):**
   - Method: `GET`
   - URL: `http://<HOST>/api/v1/katalog/prodi`
   - Karakteristik: Query PostgreSQL via Supabase, serialisasi JSON.
3. **Kalkulasi Rekomendasi (CPU-Heavy):**
   - Endpoint asesmen dan kalkulasi skor RIASEC.

### B. Spesifikasi 3 Level Beban (Load Levels)
Sesuai arahan tugas, lakukan pengujian pada minimal 3 level beban berbeda:
- **Level 1 (Low / Normal Load):** 10 - 20 Virtual Users (VU), ramp-up 30 detik.
- **Level 2 (Medium / Peak Hour):** 50 - 100 VU, konstan 2 menit.
- **Level 3 (Stress / Saturation Load):** 200 - 300+ VU, untuk menemukan *bottleneck* sistem.

### C. Prosedur Wajib Pengujian (Menghindari Kesalahan Umum)
- **Warm-up:** Jalankan tes ringan 30 detik terlebih dahulu agar cache dan koneksi database tidak dalam kondisi dingin (*cold start*).
- **Metrik Kunci:** Rekan tim wajib mencatat **Latency p95 & p99** (bukan hanya rata-rata / *mean*), throughput (Requests per Second / RPS), dan Error Rate (%).
- **Monitoring:** Pantau metrik real-time Nginx via endpoint:
  ```bash
  curl http://<HOST>/stub_status
  ```
  Serta pantau utilisasi CPU & Memory container via:
  ```bash
  docker stats
  ```

---

## 4. Kerangka Analisis Biaya (TCO) & Unit Economics (Mini Milestone 3)

### Komponen Total Cost of Ownership (TCO) 1 Bulan
Untuk dokumen *Cost Efficiency Report* dan *Pitch Deck*:

| Komponen | Spesifikasi / Provider | Estimasi Biaya (USD) | Estimasi Biaya (IDR) |
|---|---|---|---|
| **App Server Node 1** | AWS EC2 `t4g.small` (2 vCPU, 2GB) / DO Droplet | $12.00 / bln | Rp 195.000 |
| **App Server Node 2** | AWS EC2 `t4g.small` (2 vCPU, 2GB) / DO Droplet | $12.00 / bln | Rp 195.000 |
| **Load Balancer** | Nginx Reverse Proxy VM / AWS ALB | $15.00 / bln | Rp 245.000 |
| **Database & Auth** | Supabase Pro Tier (Managed DB + Auth + Backup) | $25.00 / bln | Rp 405.000 |
| **Outbound Bandwidth** | Estimasi 200 GB transfer data / bulan | $18.00 / bln | Rp 290.000 |
| **Domain & SSL** | Cloudflare / Namecheap SSL & DNS | $1.25 / bln | Rp 20.000 |
| **SDM & Pemeliharaan** | DevOps Part-time (10 jam/bln @ Rp 100rb) | - | Rp 1.000.000 |
| **TOTAL TCO BULANAN** | | | **± Rp 2.350.000 / bln** |

*Catatan untuk Laporan:* Jangan berasumsi okupansi 100%. Rata-rata beban harian sistem sekolah berada pada 20-40% di luar jam kerja, dan melonjak hingga 80-90% pada periode asesmen bakat/minat (semester ganjil).

---

## 5. Dokumen Pelengkap: Service Level Agreement (SLA) & Kebijakan Keamanan

### A. Web Service Level Agreement (WSLA)
- **Komitmen Ketersediaan (Availability):** **99.9%** per bulan (maksimal *unplanned downtime* 43.8 menit / bulan).
- **Target Response Time (p95):** < 300 ms untuk endpoint katalog & profil; < 800 ms untuk kalkulasi rekomendasi prodi.
- **Jendela Pemeliharaan (Maintenance Window):** Setiap hari Minggu pukul 01:00 – 03:00 WIB dengan pemberitahuan H-2.
- **RTO & RPO:**
  - *Recovery Time Objective (RTO):* < 15 menit (otomatis failover node).
  - *Recovery Point Objective (RPO):* < 1 jam (point-in-time recovery database).

### B. Kebijakan Keamanan Minimal (Security Policy)
1. **Autentikasi & Autorisasi:** Seluruh endpoint terproteksi wajib menyertakan token Supabase Bearer JWT. Hak akses dibatasi berdasarkan peran pengguna (`siswa` vs `bk`).
2. **Kerahasiaan Kredensial:** Kunci `SUPABASE_SERVICE_ROLE_KEY` disimpan secara terisolasi di sisi backend container (tidak pernah diekspos ke klien/frontend).
3. **Isolasi Jaringan:** Backend node hanya menerima traffic melalui Load Balancer Nginx (port internal 4000 tidak dibuka langsung ke publik).
4. **Proteksi Header & Data:**
   - Penonaktifan header `X-Powered-By`.
   - Pembatasan ukuran request body maksimal 10MB untuk mencegah serangan DoS *large payload*.
