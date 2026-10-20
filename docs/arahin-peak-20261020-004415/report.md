# Level 2 - Beban Puncak / UAS (500 VU, 5 menit)

- Test ID: `arahin-peak-20261020-004415`
- Target: `https://copy-of-arahin-staging.up.railway.app/api/v1`
- Durasi total: 555 detik
- VU maksimum: 500
- Total request (termasuk warm-up): 47230 (85.1 req/s)
- Asesmen terkirim: 1582
- Kegagalan auth (401): 0

## Temuan utama (fase load, tanpa warm-up)

Rata-rata latensi 2552 ms, tetapi p95 menunjukkan 5% request membutuhkan hingga 7432 ms dan p99 (1% terlambat) mencapai 15472 ms. Error rate 9.69%.

| Metrik | avg | median | p90 | p95 | p99 | max |
|---|---|---|---|---|---|---|
| http_req_duration | 2552 ms | 2151 ms | 5947 ms | **7432 ms** | **15472 ms** | 24493 ms |
| waiting (TTFB) | 2548 ms | 2149 ms | 5945 ms | 7428 ms | 15472 ms | 24493 ms |

Error rate: **9.69%** · Checks lulus: 90.31%

## Per endpoint (urut p95 terburuk)

| Endpoint | avg | p95 | p99 | max |
|---|---|---|---|---|
| POST /siswa/me/asesmen | 11701 ms | 19499 ms | 21205 ms | 24493 ms |
| GET /siswa/me/asesmen/terakhir | 4208 ms | 8419 ms | 10644 ms | 15530 ms |
| GET /siswa/me/rekomendasi/prodi | 2905 ms | 6817 ms | 8009 ms | 10313 ms |
| GET /me | 2894 ms | 6351 ms | 7722 ms | 10464 ms |
| GET /siswa/me/rekomendasi/jenjang | 2824 ms | 6245 ms | 7483 ms | 8870 ms |
| GET /siswa/me | 2223 ms | 5480 ms | 7216 ms | 10894 ms |
| GET /katalog/prodi | 1039 ms | 3632 ms | 4909 ms | 8850 ms |
| GET /asesmen/instrumen | 843 ms | 3499 ms | 5223 ms | 8053 ms |
| GET /master/mapel | 627 ms | 3190 ms | 4465 ms | 7208 ms |

## Threshold

- GAGAL: `http_req_duration{phase:load}`
- GAGAL: `http_req_failed{phase:load}`
