# ArahIn

**ArahIn** membantu siswa SMA menemukan arah studi lanjut — program studi, contoh karir,
mapel pilihan, dan jenjang pendidikan — berdasarkan **minat (tes RIASEC)**, **nilai rapor**,
dan **target karir** siswa. Guru BK memakai ArahIn untuk memantau dan mendampingi siswa
agar mengurangi risiko "salah jurusan".

Dibuat untuk hackathon JOINTS dengan tema Education.

---

## Fitur

### Untuk siswa
| Fitur | Keterangan |
|---|---|
| **Onboarding & profil** (UC01) | Bergabung ke sekolah dengan **kode dari guru BK**, isi kelas & peminatan, preferensi pendidikan (praktik/teori, ingin cepat kerja, biaya, jenjang), mapel yang diambil, mapel favorit, bidang & target karir. |
| **Tes minat** (UC01) | 18 butir minat RIASEC + 9 dimensi kemampuan diri (skala 1–5). Bisa diulang; menghasilkan kode Holland (mis. `IRC`). |
| **Nilai rapor** (UC02) | Input nilai per semester (dibatasi sesuai kelas). Nilai yang sudah diverifikasi BK terkunci. |
| **Katalog prodi & karir** (UC05, UC09) | Cari prodi/karir, lihat mapel pendukung, contoh karir, karir yang sedang naik daun, lalu **Jadikan Target** / **Simpan sebagai Karir Impian**. |
| **Rekomendasi prodi & rumpun** (UC04) | Peringkat prodi beserta **komponen skornya** (minat, akademik, karir) dan contoh karir. |
| **Rekomendasi mapel pilihan** (UC06) | Untuk kelas 10–11, berdasarkan target prodi utama + prodi teratas. |
| **Rekomendasi jenjang** (UC07) | Urutan S1 / D4 / D3 / kedinasan dari preferensi pendidikan di profil, lengkap dengan alasannya. |
| **Analisis keselarasan** (UC08) | Status **selaras / berisiko / tidak selaras** untuk target prodi utama + mapel pendukung yang perlu diperkuat. |
| **Penjelasan rekomendasi** (UC14) | Penjelasan bahasa alami yang **hanya bersumber dari hasil perhitungan** (template, atau Claude bila API key tersedia). |
| **Perkembangan** (UC12) | Perubahan minat antar tes dan perubahan nilai antar semester. |

### Untuk guru BK
| Fitur | Keterangan |
|---|---|
| **Kode sekolah** | Buat kode untuk dibagikan ke siswa; bisa diberi masa berlaku dan dinonaktifkan. |
| **Dashboard siswa** (UC10) | Cari per nama/kelas, filter penanda: profil belum lengkap, belum tes, belum isi nilai, nilai menunggu verifikasi, status keselarasan. |
| **Verifikasi & impor nilai** (UC02) | Verifikasi/tolak nilai siswa, atau impor nilai dari template CSV (Excel). |
| **Detail siswa** | Profil, target, hasil tes, rekomendasi, dan perkembangan siswa (read-only). |
| **Catatan konseling** (UC11) | Catatan & tindak lanjut — internal BK, hanya penulis yang dapat mengubah/menghapus. |
| **Ringkasan angkatan** (UC13) | Distribusi minat, rumpun target, bidang karir, dan mapel pilihan per angkatan. |

BK hanya dapat mengakses siswa di sekolahnya sendiri.

---

## Cara kerja rekomendasi

Rekomendasi dihitung **dari katalog prodi**, bukan dari model yang dilatih data survei:

```
skor prodi = bobot_minat × minat + bobot_akademik × akademik + bobot_karir × karir
```

- **Minat** — kecocokan skor RIASEC siswa dengan kode RIASEC prodi.
- **Akademik** — rata-rata tertimbang nilai rapor pada mapel pendukung prodi × cakupan
  (mapel pendukung yang tidak diambil dihitung 0).
- **Karir** — prodi terhubung dengan target karir siswa (1) atau bidang karir yang diminati (0,5).
- **Bobot per kelas**: kelas 10 = 0,60/0,30/0,10 · kelas 11 = 0,50/0,40/0,10 · kelas 12 = 0,45/0,45/0,10.

Semua angka aturan ada di `backend/src/config/rekomendasi.ts`. Hasil di-cache per input
(termasuk versi katalog), sehingga perhitungan & penjelasan hanya dibuat ulang bila data berubah.

> **Catatan kejujuran data.** Isi katalog saat ini masih **draf** (kode RIASEC & bobot mapel
> belum diverifikasi dari sumber resmi) dan ditandai di aplikasi. Data survei mahasiswa
> (13 responden asli + data sintetis) dipakai untuk analisis kebutuhan, **bukan** untuk
> menghitung rekomendasi, dan tidak dipakai untuk klaim akurasi.

---

## Teknologi

- **Backend**: Node.js ≥ 22, Express 5, TypeScript, zod — pola routes → controllers → services → models
- **Database & Auth**: Supabase (PostgreSQL + Supabase Auth), akses lewat `@supabase/supabase-js`
- **Frontend**: Next.js (`frontend/webapp`)
- **LLM (opsional)**: Claude API (`claude-haiku-5-5`) untuk penjelasan; tanpa API key memakai template

## Struktur repo

```
backend/            API Express (lihat backend/openapi.yaml)
  src/              config, middleware, models, services, controllers, routes
  scripts/          impor survei CSV, generator data sintetis, impor katalog xlsx
frontend/webapp/    aplikasi Next.js
supabase/           migration & seed database
data/               hasil survei, data sintetis, katalog.xlsx
docs/               dokumen use case, kebutuhan fungsional, instrumen survei
```

---

## Menjalankan secara lokal

### 1. Database (Supabase)
```bash
npx supabase link --project-ref <project-ref>
npx supabase db push                 # menerapkan supabase/migrations/
# jalankan supabase/seed.sql di SQL Editor (master mapel, RIASEC, bidang studi/karir)
```

### 2. Backend
```bash
cd backend
cp .env.example .env                 # isi SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY
npm install
npm run impor-katalog -- ../data/katalog.xlsx --tulis   # isi katalog prodi & karir
npm run dev                          # http://localhost:4000/api/v1/health
```

Variabel penting di `.env`:

| Variabel | Keterangan |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Wajib. Service role key **hanya** untuk backend. |
| `CORS_ORIGIN` | Origin frontend, dipisah koma. |
| `LLM_PROVIDER` | `mock` (default bila tanpa key) atau `anthropic`. |
| `ANTHROPIC_API_KEY`, `LLM_MODEL` | Opsional, untuk penjelasan via Claude. |

### 3. Frontend
```bash
cd frontend/webapp
npm install
npm run dev                          # http://localhost:3000
```

### Akun
Pendaftaran & login lewat Supabase Auth; setiap akun baru berperan **siswa**. Untuk akun BK:
```sql
update profil set peran = 'bk', sekolah_id = '<id sekolah>' where id = '<id user>';
```

---

## Dokumentasi & pengujian API

- Spesifikasi OpenAPI: [`backend/openapi.yaml`](backend/openapi.yaml), juga tersedia di
  `GET /api/v1/openapi.yaml` — impor ke Postman/Insomnia (pilih *Folder organization: Tags*).
- Semua endpoint memakai header `Authorization: Bearer <access_token Supabase>`.
- Respons sukses `{ "data": ... }`, gagal `{ "error": { "code", "message" } }`.

## Skrip data

| Perintah (di `backend/`) | Fungsi |
|---|---|
| `npm run impor-katalog -- ../data/katalog.xlsx [--tulis]` | Validasi / impor katalog prodi & karir dari Excel |
| `npm run impor-survei -- <file.csv> --sumber survei\|sintetis [--cek]` | Impor CSV ekspor Google Form |
| `npm run generate-sintetis -- ../data/hasilsurvei_1.csv --seed 42` | Buat data sintetis berformat Google Form |

## Deploy (Railway)

Root Directory `backend` · Build `npm run build` · Start `npm start` (`node dist/server.js`) ·
Healthcheck `/api/v1/health` · isi variabel `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`.
