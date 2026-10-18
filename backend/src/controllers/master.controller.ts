import type { RequestHandler } from 'express';
import { z } from 'zod';
import { MasterModel } from '../models/master.model';

export const daftarMapel: RequestHandler = async (_req, res) => {
  res.json({ data: await MasterModel.listMapel() });
};

export const daftarBidangKarir: RequestHandler = async (_req, res) => {
  res.json({ data: await MasterModel.listBidangKarir() });
};

/** Picker ringan untuk target karir saat onboarding; detail katalog ada di modul 5. */
export const cariKarir: RequestHandler = async (req, res) => {
  const { q, limit } = z
    .object({
      q: z.string().trim().max(50).optional(),
      limit: z.coerce.number().int().min(1).max(50).default(20),
    })
    .parse(req.query);
  res.json({ data: await MasterModel.cariKarir(q || undefined, limit) });
};
