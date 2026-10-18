import { Router } from 'express';
import * as panel from '../controllers/bkPanel.controller';
import * as kode from '../controllers/kodeBk.controller';
import * as nilai from '../controllers/nilaiRapor.controller';
import { perkembangan } from '../controllers/perkembangan.controller';
import * as rek from '../controllers/rekomendasi.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

// Semua query dibatasi ke sekolah_id milik BK/guru (lihat aksesBk).
// Guru Pengajar (A04) berbagi panel ini; kode sekolah & mengeluarkan siswa tetap khusus BK.
export const bkRouter = Router();

bkRouter.use(auth, requireRole('bk', 'guru'));

bkRouter.post('/kode', requireRole('bk'), kode.buatKode);
bkRouter.get('/kode', requireRole('bk'), kode.daftarKode);
bkRouter.patch('/kode/:id', requireRole('bk'), kode.ubahKode);

bkRouter.get('/nilai/menunggu', nilai.daftarMenunggu);
bkRouter.get('/nilai/template', nilai.template);
bkRouter.post('/nilai/impor', nilai.impor);
bkRouter.get('/siswa/:siswaId/nilai', nilai.nilaiSiswa);
bkRouter.post('/siswa/:siswaId/nilai/verifikasi', nilai.putuskan);

bkRouter.get('/siswa/:siswaId/rekomendasi/prodi', rek.rekomendasi('prodi'));
bkRouter.get('/siswa/:siswaId/rekomendasi/mapel', rek.rekomendasi('mapel'));
bkRouter.get('/siswa/:siswaId/rekomendasi/jenjang', rek.rekomendasi('jenjang'));
bkRouter.get('/siswa/:siswaId/keselarasan', rek.rekomendasi('keselarasan'));
bkRouter.post('/siswa/:siswaId/rekomendasi/:jenis/penjelasan', rek.penjelasan);

// Modul 8: dashboard (UC10), detail, catatan konseling (UC11), ringkasan (UC13)
bkRouter.get('/siswa', panel.dashboard);
bkRouter.get('/siswa/:siswaId', panel.detail);
bkRouter.delete('/siswa/:siswaId/sekolah', requireRole('bk'), panel.keluarkan);
bkRouter.post('/keselarasan/segarkan', panel.segarkanKeselarasan);
bkRouter.get('/ringkasan', panel.ringkasan);
bkRouter.get('/siswa/:siswaId/catatan', panel.daftarCatatan);
bkRouter.post('/siswa/:siswaId/catatan', panel.tambahCatatan);
bkRouter.patch('/catatan/:id', panel.ubahCatatan);
bkRouter.delete('/catatan/:id', panel.hapusCatatan);

// Modul 9: perkembangan (UC12)
bkRouter.get('/siswa/:siswaId/perkembangan', perkembangan);
