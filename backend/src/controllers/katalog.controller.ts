import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Constants } from '../../types/database';
import { userOf } from '../middleware/auth';
import { KatalogModel } from '../models/katalog.model';
import { KatalogService } from '../services/KatalogService';

const halaman = {
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
};
const teksCari = z.string().trim().max(100).optional();
const idParam = z.object({ id: z.uuid() });

export const daftarBidangStudi: RequestHandler = async (_req, res) => {
  res.json({ data: await KatalogModel.listBidangStudi() });
};

export const daftarProdi: RequestHandler = async (req, res) => {
  const q = z
    .object({
      q: teksCari,
      bidang_studi: z.string().trim().max(20).optional(),
      jenis: z.enum(Constants.public.Enums.jenis_pendidikan).optional(),
      ...halaman,
    })
    .parse(req.query);
  const hasil = await KatalogModel.listProdi(
    { q: q.q || undefined, bidangStudi: q.bidang_studi?.toUpperCase(), jenis: q.jenis },
    { limit: q.limit, offset: q.offset },
  );
  res.json({ data: { ...hasil, limit: q.limit, offset: q.offset } });
};

export const detailProdi: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await KatalogService.detailProdi(userOf(req), id) });
};

export const daftarKarir: RequestHandler = async (req, res) => {
  const q = z
    .object({
      q: teksCari,
      bidang_karir: z.string().trim().max(20).optional(),
      trending: z.enum(['true', 'false']).optional(),
      ...halaman,
    })
    .parse(req.query);
  const hasil = await KatalogModel.listKarir(
    {
      q: q.q || undefined,
      bidangKarir: q.bidang_karir?.toUpperCase(),
      trending: q.trending === undefined ? undefined : q.trending === 'true',
    },
    { limit: q.limit, offset: q.offset },
  );
  res.json({ data: { ...hasil, limit: q.limit, offset: q.offset } });
};

export const detailKarir: RequestHandler = async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await KatalogService.detailKarir(userOf(req), id) });
};
