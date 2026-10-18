import type { RequestHandler } from 'express';
import { AppError } from '../middleware/errorHandler';
import { ProfilModel } from '../models/profil.model';

export const getMe: RequestHandler = async (req, res) => {
  if (!req.user) throw AppError.unauthorized();

  const profil = await ProfilModel.findByIdWithSekolah(req.user.id);
  if (!profil) throw AppError.notFound('Profil tidak ditemukan');

  res.json({ data: profil });
};
