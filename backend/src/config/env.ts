import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const kosongJadiUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    DATASET_SUMBER: z.enum(['sintetis', 'survei', 'semua']).default('sintetis'),
    // Penjelasan rekomendasi (UC14).
    //   mock      : penjelasan dari template komponen skor, tanpa API (default bila key kosong)
    //   anthropic : Claude API dengan LLM_MODEL (default bila key terisi)
    LLM_PROVIDER: z.preprocess(kosongJadiUndefined, z.enum(['mock', 'anthropic']).optional()),
    ANTHROPIC_API_KEY: z.preprocess(kosongJadiUndefined, z.string().trim().optional()),
    LLM_MODEL: z.preprocess(kosongJadiUndefined, z.string().min(1).default('claude-haiku-5-5')),
  })
  .refine((e) => e.LLM_PROVIDER !== 'anthropic' || !!e.ANTHROPIC_API_KEY, {
    path: ['ANTHROPIC_API_KEY'],
    message: 'wajib diisi bila LLM_PROVIDER=anthropic',
  })
  .transform((e) => ({ ...e, LLM_PROVIDER: e.LLM_PROVIDER ?? (e.ANTHROPIC_API_KEY ? 'anthropic' : 'mock') }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Hanya nama variabel yang dicetak, bukan nilainya (hindari bocornya secret).
  const fields = parsed.error.issues
    .map((i) => (i.code === 'custom' ? `${i.path.join('.')} (${i.message})` : i.path.join('.')))
    .join(', ');
  console.error(`Konfigurasi .env tidak valid / kurang: ${fields}`);
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
