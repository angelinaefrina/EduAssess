import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Rincian opsional untuk klien, mis. daftar error per baris impor. */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Permintaan tidak valid', code = 'BAD_REQUEST') {
    return new AppError(400, code, message);
  }
  static unauthorized(message = 'Token tidak ada atau tidak valid', code = 'UNAUTHORIZED') {
    return new AppError(401, code, message);
  }
  static forbidden(message = 'Akses ditolak', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }
  static notFound(message = 'Data tidak ditemukan', code = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }
  static conflict(message = 'Konflik dengan data yang ada', code = 'CONFLICT') {
    return new AppError(409, code, message);
  }
}

/** Ubah `error` dari supabase-js menjadi exception agar ditangani errorHandler. */
export function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (error) {
    throw new AppError(500, 'DB_ERROR', error.message);
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Endpoint ${req.method} ${req.path} tidak ditemukan`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`).join('; '),
      },
    });
    return;
  }

  // Body JSON rusak dari express.json()
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Body JSON tidak valid' } });
    return;
  }

  if (err instanceof AppError && err.status < 500) {
    const details = err.details === undefined ? {} : { details: err.details };
    res.status(err.status).json({ error: { code: err.code, message: err.message, ...details } });
    return;
  }

  // 5xx: detail hanya ke log server, klien menerima pesan generik.
  console.error(err);
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  res.status(500).json({ error: { code, message: 'Terjadi kesalahan pada server' } });
};
