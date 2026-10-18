import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { KodeBkService } from '../services/KodeBkService';

const waktu = z.iso.datetime({ offset: true });

export const buatKode: RequestHandler = async (req, res) => {
  const input = z.object({ berlaku_sampai: waktu.nullable().optional() }).parse(req.body ?? {});
  res.status(201).json({ data: await KodeBkService.buat(userOf(req), input) });
};

export const daftarKode: RequestHandler = async (req, res) => {
  res.json({ data: await KodeBkService.daftar(userOf(req)) });
};

export const ubahKode: RequestHandler = async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params);
  const fields = z
    .object({ aktif: z.boolean().optional(), berlaku_sampai: waktu.nullable().optional() })
    .refine((f) => f.aktif !== undefined || f.berlaku_sampai !== undefined, {
      message: 'Isi minimal salah satu: aktif, berlaku_sampai',
    })
    .parse(req.body);
  res.json({ data: await KodeBkService.ubah(userOf(req), id, fields) });
};
