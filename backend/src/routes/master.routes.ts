import { Router } from 'express';
import * as c from '../controllers/master.controller';
import { auth } from '../middleware/auth';

export const masterRouter = Router();

masterRouter.use(auth);

masterRouter.get('/mapel', c.daftarMapel);
masterRouter.get('/bidang-karir', c.daftarBidangKarir);
masterRouter.get('/karir', c.cariKarir);
