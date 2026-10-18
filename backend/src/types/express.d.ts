import type { Database } from '../../types/database';

export type PeranPengguna = Database['public']['Enums']['peran_pengguna'];

export interface AuthUser {
  id: string;
  peran: PeranPengguna;
  sekolah_id: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
