import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { TargetService } from '../services/TargetService';

const idParam = z.object({ id: z.uuid() });

export const daftar: RequestHandler = async (req, res) => {
  res.json({ data: await TargetService.daftar(userOf(req).id) });
};

export const simpanKarir: RequestHandler = async (req, res) => {
  const { karir_id } = z.object({ karir_id: z.uuid() }).parse(req.body);
  const { baru, target } = await TargetService.simpanKarir(userOf(req).id, karir_id);
  res.status(baru ? 201 : 200).json({ data: target });
};

export const simpanProdi: RequestHandler = async (req, res) => {
  const body = z
    .object({
      prodi_id: z.uuid(),
      sumber: z.enum(['rekomendasi', 'katalog', 'eksplorasi_karir']).default('katalog'),
    })
    .parse(req.body);
  const { baru, target } = await TargetService.simpanProdi(userOf(req).id, body.prodi_id, body.sumber);
  res.status(baru ? 201 : 200).json({ data: target });
};

export const ubahProdi: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  // Hanya "jadikan utama"; utama dilepas otomatis saat prodi lain dijadikan utama.
  z.object({ is_utama: z.literal(true) }).parse(req.body);
  res.json({ data: await TargetService.jadikanUtama(userOf(req).id, id) });
};

export const hapusProdi: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await TargetService.hapusProdi(userOf(req).id, id) });
};
