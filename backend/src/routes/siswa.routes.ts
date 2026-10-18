import { Router } from 'express';
import * as asesmen from '../controllers/asesmen.controller';
import * as nilai from '../controllers/nilaiRapor.controller';
import { perkembangan } from '../controllers/perkembangan.controller';
import * as rek from '../controllers/rekomendasi.controller';
import * as target from '../controllers/target.controller';
import * as c from '../controllers/siswa.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

// Semua endpoint memakai req.user.id; siswa hanya bisa mengakses datanya sendiri.
export const siswaRouter = Router();

siswaRouter.use(auth, requireRole('siswa'));

siswaRouter.get('/me', c.getMe);
siswaRouter.post('/me/kode-bk', c.gabungSekolah);
siswaRouter.post('/me/onboarding', c.onboarding);
siswaRouter.put('/me/profil', c.ubahProfil);
siswaRouter.put('/me/preferensi', c.ubahPreferensi);
siswaRouter.put('/me/mapel', c.ubahMapel);
siswaRouter.put('/me/mapel-favorit', c.ubahMapelFavorit);
siswaRouter.put('/me/bidang-karir', c.ubahBidangKarir);
siswaRouter.put('/me/target-karir', c.ubahTargetKarir);
siswaRouter.delete('/me/target-karir/:id', c.hapusTargetKarir);

siswaRouter.post('/me/asesmen', asesmen.kirim);
siswaRouter.get('/me/asesmen', asesmen.riwayat);
siswaRouter.get('/me/asesmen/terakhir', asesmen.terakhir);

siswaRouter.get('/me/nilai', nilai.daftarSiswa);
siswaRouter.put('/me/nilai/semester/:semester', nilai.simpanSemester);
siswaRouter.delete('/me/nilai/:id', nilai.hapus);

siswaRouter.get('/me/target', target.daftar);
siswaRouter.post('/me/target-karir', target.simpanKarir);
siswaRouter.post('/me/target-prodi', target.simpanProdi);
siswaRouter.patch('/me/target-prodi/:id', target.ubahProdi);
siswaRouter.delete('/me/target-prodi/:id', target.hapusProdi);

siswaRouter.get('/me/rekomendasi/prodi', rek.rekomendasi('prodi'));
siswaRouter.get('/me/rekomendasi/mapel', rek.rekomendasi('mapel'));
siswaRouter.get('/me/rekomendasi/jenjang', rek.rekomendasi('jenjang'));
siswaRouter.get('/me/keselarasan', rek.rekomendasi('keselarasan'));
siswaRouter.post('/me/rekomendasi/:jenis/penjelasan', rek.penjelasan);

siswaRouter.get('/me/perkembangan', perkembangan);
