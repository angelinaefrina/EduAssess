import { Router } from 'express';
import * as c from '../controllers/katalog.controller';
import { auth } from '../middleware/auth';

export const katalogRouter = Router();

katalogRouter.use(auth);

katalogRouter.get('/bidang-studi', c.daftarBidangStudi);
katalogRouter.get('/prodi', c.daftarProdi);
katalogRouter.get('/prodi/:id', c.detailProdi);
katalogRouter.get('/karir', c.daftarKarir);
katalogRouter.get('/karir/:id', c.detailKarir);
