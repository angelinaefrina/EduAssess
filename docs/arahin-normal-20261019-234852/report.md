# Level 1 - Beban Normal (50 VU, 5 menit)

- Test ID: `arahin-normal-20261019-234852`
- Target: `https://copy-of-arahin-staging.up.railway.app/api/v1`
- Durasi total: 514 detik
- VU maksimum: 50
- Total request (termasuk warm-up): 9572 (18.6 req/s)
- Asesmen terkirim: 346
- Kegagalan auth (401): 0

## Temuan utama (fase load, tanpa warm-up)

Rata-rata latensi 498 ms, tetapi p95 menunjukkan 5% request membutuhkan hingga 1103 ms dan p99 (1% terlambat) mencapai 6365 ms. Error rate 0.01%.

| Metrik | avg | median | p90 | p95 | p99 | max |
|---|---|---|---|---|---|---|
| http_req_duration | 498 ms | 242 ms | 684 ms | **1103 ms** | **6365 ms** | 19410 ms |
| waiting (TTFB) | 495 ms | 240 ms | 678 ms | 1103 ms | 6364 ms | 19410 ms |

Error rate: **0.01%** · Checks lulus: 99.99%

## Per endpoint (urut p95 terburuk)

| Endpoint | avg | p95 | p99 | max |
|---|---|---|---|---|
| POST /siswa/me/asesmen | 1852 ms | 3314 ms | 16100 ms | 19410 ms |
| GET /me | 708 ms | 1719 ms | 15269 ms | 16699 ms |
| GET /katalog/prodi | 570 ms | 1308 ms | 10243 ms | 17019 ms |
| GET /siswa/me | 414 ms | 890 ms | 3804 ms | 17269 ms |
| GET /asesmen/instrumen | 467 ms | 872 ms | 7220 ms | 16789 ms |
| GET /siswa/me/rekomendasi/prodi | 425 ms | 832 ms | 5260 ms | 16549 ms |
| GET /siswa/me/asesmen/terakhir | 392 ms | 816 ms | 1663 ms | 5507 ms |
| GET /master/mapel | 309 ms | 669 ms | 2793 ms | 7756 ms |
| GET /siswa/me/rekomendasi/jenjang | 290 ms | 596 ms | 1729 ms | 7666 ms |

## Threshold

- GAGAL: `http_req_duration{phase:load}`
