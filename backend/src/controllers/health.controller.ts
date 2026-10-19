import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { ProfilModel } from '../models/profil.model';

export const getHealth: RequestHandler = async (_req, res) => {
  const dbOk = await ProfilModel.ping().catch(() => false);
  res.json({
    data: {
      status: 'ok',
      node: env.NODE_ID,
      db: dbOk ? 'ok' : 'error',
      waktu: new Date().toISOString(),
    },
  });
};
