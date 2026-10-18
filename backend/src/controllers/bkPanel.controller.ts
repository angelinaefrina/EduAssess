import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { BkPanelService, PENANDA } from '../services/BkPanelService';
import { CatatanService } from '../services/CatatanService';

const siswaParam = z.object({ siswaId: z.uuid() });
const idParam = z.object({ id: z.uuid() });
/** ?angkatan=2027, atau ?angkatan=kosong untuk siswa yang belum mengisi angkatan. */
const angkatanQuery = z
  .union([z.literal('kosong'), z.coerce.number().int().min(2000).max(2100)])
  .optional()
  .transform((v) => (v === 'kosong' ? null : v));

// ----------------------------------------------------------- dashboard UC10
export const dashboard: RequestHandler = async (req, res) => {
  const q = z
    .object({
      q: z.string().trim().max(100).optional(),
      tingkat: z.coerce.number().int().min(10).max(12).optional(),
      rombel: z.string().trim().max(30).optional(),
      angkatan: angkatanQuery,
      penanda: z.enum(PENANDA).optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).default(0),
    })
    .parse(req.query);
  res.json({ data: await BkPanelService.dashboard(userOf(req), { ...q, q: q.q || undefined }) });
};

export const detail: RequestHandler = async (req, res) => {
  const { siswaId } = siswaParam.parse(req.params);
  res.json({ data: await BkPanelService.detail(userOf(req), siswaId) });
};

export const segarkanKeselarasan: RequestHandler = async (req, res) => {
  res.json({ data: await BkPanelService.segarkanKeselarasan(userOf(req)) });
};

export const keluarkan: RequestHandler = async (req, res) => {
  const { siswaId } = siswaParam.parse(req.params);
  await BkPanelService.keluarkan(userOf(req), siswaId);
  res.status(204).end();
};

// ----------------------------------------------------------- ringkasan UC13
export const ringkasan: RequestHandler = async (req, res) => {
  const { angkatan } = z.object({ angkatan: angkatanQuery }).parse(req.query);
  res.json({ data: await BkPanelService.ringkasan(userOf(req), angkatan) });
};

// ---------------------------------------------------- catatan konseling UC11
const isi = z.string().trim().min(1).max(5000);
const tindakLanjut = z.string().trim().max(2000).nullable();

export const daftarCatatan: RequestHandler = async (req, res) => {
  const { siswaId } = siswaParam.parse(req.params);
  res.json({ data: await CatatanService.daftar(userOf(req), siswaId) });
};

export const tambahCatatan: RequestHandler = async (req, res) => {
  const { siswaId } = siswaParam.parse(req.params);
  const body = z.object({ isi, tindak_lanjut: tindakLanjut.optional() }).parse(req.body);
  res.status(201).json({ data: await CatatanService.tambah(userOf(req), siswaId, body) });
};

export const ubahCatatan: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = z
    .object({ isi: isi.optional(), tindak_lanjut: tindakLanjut.optional() })
    .refine((b) => b.isi !== undefined || b.tindak_lanjut !== undefined, {
      message: 'Isi minimal salah satu: isi, tindak_lanjut',
    })
    .parse(req.body);
  res.json({ data: await CatatanService.ubah(userOf(req), id, body) });
};

export const hapusCatatan: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  await CatatanService.hapus(userOf(req), id);
  res.status(204).end();
};
