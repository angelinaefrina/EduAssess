import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { pastikanSiswaSekolahBk } from '../services/aksesBk';
import { PerkembanganService } from '../services/PerkembanganService';

/** UC12: siswa melihat dirinya sendiri; BK/guru melihat siswa :siswaId di sekolah yang sama. */
export const perkembangan: RequestHandler = async (req, res) => {
  const user = userOf(req);
  let siswaId = user.id;
  if (user.peran !== 'siswa') {
    siswaId = z.object({ siswaId: z.uuid() }).parse(req.params).siswaId;
    await pastikanSiswaSekolahBk(user, siswaId);
  }
  res.json({ data: await PerkembanganService.ambil(siswaId) });
};
