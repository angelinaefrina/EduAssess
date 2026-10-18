import type { RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { KlasterService } from '../services/KlasterService';
import { RekomendasiModulService } from '../services/RekomendasiModulService';

const runParam = z.object({ runId: z.uuid() });
const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

// ------------------------------------------------------------ klaster UC15
export const jalankan: RequestHandler = async (req, res) => {
  const input = z
    .object({
      basis: z.enum(['minat', 'akademik', 'gabungan']),
      angkatan: z.number().int().min(2000).max(2100),
      tingkat: z.number().int().min(10).max(12).optional(),
      rombel: z.string().trim().min(1).max(30).optional(),
      jumlah_klaster: z.number().int().min(2).max(10),
      seed: z.number().int().min(0).max(2 ** 31 - 1).optional(),
    })
    .refine((b) => !b.rombel || b.tingkat !== undefined, { message: 'rombel hanya bisa diisi bersama tingkat', path: ['rombel'] })
    .parse(req.body);
  res.status(201).json({ data: await KlasterService.jalankan(userOf(req), input) });
};

/** ?saya=true untuk hasil milik guru sendiri ("pengelompokan terakhir", UC16). */
export const daftar: RequestHandler = async (req, res) => {
  const q = z
    .object({
      angkatan: z.coerce.number().int().min(2000).max(2100).optional(),
      saya: bool.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    })
    .parse(req.query);
  const { data, total } = await KlasterService.daftar(userOf(req), q);
  res.json({ data, total });
};

export const detail: RequestHandler = async (req, res) => {
  const { runId } = runParam.parse(req.params);
  res.json({ data: await KlasterService.detail(userOf(req), runId) });
};

export const hapus: RequestHandler = async (req, res) => {
  const { runId } = runParam.parse(req.params);
  await KlasterService.hapus(userOf(req), runId);
  res.status(204).end();
};

export const pindahkan: RequestHandler = async (req, res) => {
  const { runId, siswaId } = runParam.extend({ siswaId: z.uuid() }).parse(req.params);
  const { klaster_id } = z.object({ klaster_id: z.uuid() }).parse(req.body);
  res.json({ data: await KlasterService.pindahkan(userOf(req), runId, siswaId, klaster_id) });
};

export const penjelasan: RequestHandler = async (req, res) => {
  const { runId, klasterId } = runParam.extend({ klasterId: z.uuid() }).parse(req.params);
  res.json({ data: await KlasterService.penjelasan(userOf(req), runId, klasterId) });
};

// ------------------------------------------------- rekomendasi modul UC16
export const hitungRekomendasi: RequestHandler = async (req, res) => {
  const { runId } = runParam.parse(req.params);
  const input = z
    .object({
      sasaran: z.enum(['klaster', 'siswa']),
      klaster_id: z.uuid().optional(),
      siswa_id: z.uuid().optional(),
      jumlah: z.number().int().min(1).max(20).optional(),
    })
    .refine((b) => b.sasaran === 'siswa' || !b.siswa_id, { message: 'siswa_id hanya untuk sasaran siswa', path: ['siswa_id'] })
    .parse(req.body);
  res.json({ data: await RekomendasiModulService.hitung(userOf(req), runId, input) });
};

export const daftarRekomendasi: RequestHandler = async (req, res) => {
  const { runId } = runParam.parse(req.params);
  const q = z.object({ klaster_id: z.uuid().optional(), siswa_id: z.uuid().optional() }).parse(req.query);
  res.json({ data: await RekomendasiModulService.daftar(userOf(req), runId, { klasterId: q.klaster_id, siswaId: q.siswa_id }) });
};
