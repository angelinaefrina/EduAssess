import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { ModulService } from '../services/ModulService';

const idParam = z.object({ id: z.uuid() });
const teksOpsional = (maks: number) => z.string().trim().max(maks).nullable().optional();

const fieldModul = {
  judul: z.string().trim().min(1).max(200),
  mapel_id: z.number().int().positive(),
  tingkat: z.number().int().min(10).max(12),
  topik: z.array(z.string().trim().min(1).max(100)).max(20),
  deskripsi: teksOpsional(5000),
  tipe_riasec: z.array(z.enum(['R', 'I', 'A', 'S', 'E', 'C'])).max(6).transform((t) => [...new Set(t)]),
  tautan_url: z.url({ protocol: /^https?$/ }).max(2000).nullable().optional(),
  berkas_path: teksOpsional(500),
  aktif: z.boolean(),
};

// ------------------------------------------------------- katalog modul UC17
export const daftar: RequestHandler = async (req, res) => {
  const q = z
    .object({
      q: z.string().trim().max(100).optional(),
      mapel_id: z.coerce.number().int().positive().optional(),
      tingkat: z.coerce.number().int().min(10).max(12).optional(),
      aktif: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    })
    .parse(req.query);
  const { data, total } = await ModulService.daftar(userOf(req), { ...q, q: q.q || undefined });
  res.json({ data, total });
};

export const detail: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await ModulService.detail(userOf(req), id) });
};

export const buat: RequestHandler = async (req, res) => {
  const input = z
    .object({
      ...fieldModul,
      topik: fieldModul.topik.default([]),
      tipe_riasec: fieldModul.tipe_riasec.default([]),
      aktif: fieldModul.aktif.default(true),
    })
    .refine((b) => !!b.tautan_url?.trim() || !!b.berkas_path?.trim(), {
      message: 'Isi minimal salah satu: tautan_url, berkas_path',
    })
    .parse(req.body);
  res.status(201).json({ data: await ModulService.buat(userOf(req), input) });
};

export const ubah: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  const fields = z
    .object(fieldModul)
    .partial()
    .refine((b) => Object.keys(b).length > 0, { message: 'Tidak ada field yang diubah' })
    .parse(req.body);
  res.json({ data: await ModulService.ubah(userOf(req), id, fields) });
};

export const hapus: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  await ModulService.hapus(userOf(req), id);
  res.status(204).end();
};

/** Langkah 1 unggah berkas: dapatkan signed URL, unggah langsung ke Storage, lalu simpan berkas_path. */
export const urlUnggah: RequestHandler = async (req, res) => {
  const { nama_file } = z.object({ nama_file: z.string().trim().min(1).max(200) }).parse(req.body);
  res.status(201).json({ data: await ModulService.urlUnggah(userOf(req), nama_file) });
};
