import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { RiasecService } from '../services/RiasecService';

const skor = z.number().int().min(1).max(5);

const jawabanSchema = z.object({
  riasec: z.array(z.object({ butir_id: z.number().int().positive(), skor })).min(1).max(100),
  kemampuan: z.array(z.object({ dimensi_id: z.number().int().positive(), skor })).min(1).max(100),
});

export const instrumen: RequestHandler = async (_req, res) => {
  res.json({ data: await RiasecService.instrumen() });
};

export const kirim: RequestHandler = async (req, res) => {
  const jawaban = jawabanSchema.parse(req.body);
  res.status(201).json({ data: await RiasecService.kirim(userOf(req).id, jawaban) });
};

export const terakhir: RequestHandler = async (req, res) => {
  res.json({ data: await RiasecService.terakhir(userOf(req).id) });
};

export const riwayat: RequestHandler = async (req, res) => {
  res.json({ data: await RiasecService.riwayat(userOf(req).id) });
};
