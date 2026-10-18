import { Router } from 'express';
import * as klaster from '../controllers/klaster.controller';
import * as modul from '../controllers/modul.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

// Fitur Guru Pengajar (A04): klaster siswa (UC15), rekomendasi modul (UC16),
// katalog modul (UC17). Semua dibatasi ke sekolah_id milik guru (lihat aksesBk).
// Pemantauan siswa, nilai, dan catatan memakai panel /bk yang juga terbuka untuk guru.
export const guruRouter = Router();

guruRouter.use(auth, requireRole('guru'));

guruRouter.post('/klaster', klaster.jalankan);
guruRouter.get('/klaster', klaster.daftar);
guruRouter.get('/klaster/:runId', klaster.detail);
guruRouter.delete('/klaster/:runId', klaster.hapus);
guruRouter.patch('/klaster/:runId/anggota/:siswaId', klaster.pindahkan);
guruRouter.post('/klaster/:runId/klaster/:klasterId/penjelasan', klaster.penjelasan);

guruRouter.post('/klaster/:runId/rekomendasi', klaster.hitungRekomendasi);
guruRouter.get('/klaster/:runId/rekomendasi', klaster.daftarRekomendasi);

// '/modul/unggah' didaftarkan sebelum '/modul/:id'.
guruRouter.post('/modul/unggah', modul.urlUnggah);
guruRouter.get('/modul', modul.daftar);
guruRouter.post('/modul', modul.buat);
guruRouter.get('/modul/:id', modul.detail);
guruRouter.patch('/modul/:id', modul.ubah);
guruRouter.delete('/modul/:id', modul.hapus);
