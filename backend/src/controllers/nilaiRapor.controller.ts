import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { NilaiRaporService } from '../services/NilaiRaporService';

const semester = z.coerce.number().int().min(1).max(6);
const nilaiAngka = z.number().gt(0).max(100); // 0 = tidak diambil -> jangan dikirim

// ------------------------------------------------------------------- siswa
export const daftarSiswa: RequestHandler = async (req, res) => {
  res.json({ data: await NilaiRaporService.daftarSiswa(userOf(req).id) });
};

export const simpanSemester: RequestHandler = async (req, res) => {
  const params = z.object({ semester }).parse(req.params);
  const { nilai } = z
    .object({
      nilai: z
        .array(z.object({ mapel_id: z.number().int().positive(), nilai: nilaiAngka }))
        .max(50)
        .refine((a) => new Set(a.map((n) => n.mapel_id)).size === a.length, {
          message: 'mapel_id tidak boleh duplikat',
        }),
    })
    .parse(req.body);
  res.json({ data: await NilaiRaporService.simpanSemester(userOf(req).id, params.semester, nilai) });
};

export const hapus: RequestHandler = async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params);
  await NilaiRaporService.hapus(userOf(req).id, id);
  res.status(204).end();
};

// ---------------------------------------------------------------------- BK
export const daftarMenunggu: RequestHandler = async (req, res) => {
  res.json({ data: await NilaiRaporService.daftarMenunggu(userOf(req)) });
};

export const nilaiSiswa: RequestHandler = async (req, res) => {
  const { siswaId } = z.object({ siswaId: z.uuid() }).parse(req.params);
  res.json({ data: await NilaiRaporService.nilaiSiswaUntukBk(userOf(req), siswaId) });
};

export const putuskan: RequestHandler = async (req, res) => {
  const { siswaId } = z.object({ siswaId: z.uuid() }).parse(req.params);
  const body = z
    .object({
      status: z.enum(['terverifikasi', 'ditolak']).default('terverifikasi'),
      ids: z.array(z.uuid()).min(1).max(200).optional(),
    })
    .parse(req.body ?? {});
  res.json({ data: await NilaiRaporService.putuskan(userOf(req), siswaId, body.status, body.ids) });
};

export const template: RequestHandler = async (req, res) => {
  const q = z
    .object({ semester, tingkat: z.coerce.number().int().min(10).max(12).optional() })
    .parse(req.query);
  const { namaFile, csv } = await NilaiRaporService.templateImpor(userOf(req), q.semester, q.tingkat);
  res.attachment(namaFile).type('text/csv; charset=utf-8').send('﻿' + csv);
};

export const impor: RequestHandler = async (req, res) => {
  const body = z.object({ semester, csv: z.string().min(1).max(900_000) }).parse(req.body);
  res.json({ data: await NilaiRaporService.impor(userOf(req), body.semester, body.csv) });
};
