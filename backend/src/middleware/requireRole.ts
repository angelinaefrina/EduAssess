import type { RequestHandler } from 'express';
import type { PeranPengguna } from '../types/express';
import { AppError } from './errorHandler';

/** Pasang SETELAH `auth`. Contoh: router.get('/x', auth, requireRole('bk'), handler) */
export const requireRole =
  (...peran: PeranPengguna[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!peran.includes(req.user.peran)) {
      throw AppError.forbidden(`Hanya untuk peran: ${peran.join(', ')}`);
    }
    next();
  };
