import type { RequestHandler } from 'express';
import { ProfilModel } from '../models/profil.model';

export const getHealth: RequestHandler = async (_req, res) => {
  const dbOk = await ProfilModel.ping().catch(() => false);
  res.json({
    data: {
      status: 'ok',
      db: dbOk ? 'ok' : 'error',
      waktu: new Date().toISOString(),
    },
  });
};
