import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Constants } from '../../types/database';
import { userOf } from '../middleware/auth';
import { SiswaService } from '../services/SiswaService';

const Enums = Constants.public.Enums;

const daftarIdUnik = (maks?: number) => {
  const dasar = z.array(z.number().int().positive());
  return (maks ? dasar.max(maks) : dasar).refine((ids) => new Set(ids).size === ids.length, {
    message: 'ID tidak boleh duplikat',
  });
};

const profilSchema = z.object({
  nama: z.string().trim().min(1).max(100),
  tingkat: z.number().int().min(10).max(12),
  peminatan: z.enum(Enums.peminatan_sekolah),
  rombel: z.string().trim().max(30).nullable().optional(),
  angkatan: z.number().int().min(2000).max(2100).nullable().optional(), // tahun lulus SMA
});

// PUT = ganti utuh: field yang tidak dikirim menjadi null.
const preferensiSchema = z.object({
  gaya_belajar: z.enum(Enums.gaya_belajar).nullable().default(null),
  ingin_cepat_kerja: z.boolean().nullable().default(null),
  pertimbangan_biaya: z.number().int().min(1).max(5).nullable().default(null),
  jenjang_diminati: z
    .array(z.enum(Enums.jenjang_pendidikan))
    .refine((a) => new Set(a).size === a.length, { message: 'Jenjang tidak boleh duplikat' })
    .default([]),
});

const targetKarirItem = z.union([
  z.strictObject({ karir_id: z.uuid() }),
  z.strictObject({ teks_bebas: z.string().trim().min(1).max(100) }),
]);
const targetKarirList = z.array(targetKarirItem).max(10);

const onboardingSchema = z.object({
  profil: profilSchema,
  preferensi: preferensiSchema.optional(),
  mapel_ids: daftarIdUnik().optional(),
  mapel_favorit_ids: daftarIdUnik(3).optional(),
  bidang_karir_ids: daftarIdUnik(3).optional(),
  target_karir: targetKarirList.optional(),
});

export const getMe: RequestHandler = async (req, res) => {
  res.json({ data: await SiswaService.getMe(userOf(req).id) });
};

export const gabungSekolah: RequestHandler = async (req, res) => {
  const { kode } = z.object({ kode: z.string().trim().min(1).max(20) }).parse(req.body);
  res.json({ data: await SiswaService.gabungSekolah(userOf(req).id, kode) });
};

export const onboarding: RequestHandler = async (req, res) => {
  const input = onboardingSchema.parse(req.body);
  res.json({ data: await SiswaService.onboarding(userOf(req).id, input) });
};

export const ubahProfil: RequestHandler = async (req, res) => {
  const input = profilSchema.parse(req.body);
  res.json({ data: await SiswaService.ubahProfil(userOf(req).id, input) });
};

export const ubahPreferensi: RequestHandler = async (req, res) => {
  const input = preferensiSchema.parse(req.body);
  res.json({ data: await SiswaService.ubahPreferensi(userOf(req).id, input) });
};

export const ubahMapel: RequestHandler = async (req, res) => {
  const { mapel_ids } = z.object({ mapel_ids: daftarIdUnik() }).parse(req.body);
  res.json({ data: await SiswaService.ubahMapel(userOf(req).id, mapel_ids) });
};

export const ubahMapelFavorit: RequestHandler = async (req, res) => {
  const { mapel_ids } = z.object({ mapel_ids: daftarIdUnik(3) }).parse(req.body);
  res.json({ data: await SiswaService.ubahMapelFavorit(userOf(req).id, mapel_ids) });
};

export const ubahBidangKarir: RequestHandler = async (req, res) => {
  const { bidang_karir_ids } = z.object({ bidang_karir_ids: daftarIdUnik(3) }).parse(req.body);
  res.json({ data: await SiswaService.ubahBidangKarir(userOf(req).id, bidang_karir_ids) });
};

export const ubahTargetKarir: RequestHandler = async (req, res) => {
  const { target_karir } = z.object({ target_karir: targetKarirList }).parse(req.body);
  res.json({ data: await SiswaService.ubahTargetKarir(userOf(req).id, target_karir) });
};

export const hapusTargetKarir: RequestHandler = async (req, res) => {
  const { id } = z.object({ id: z.uuid() }).parse(req.params);
  await SiswaService.hapusTargetKarir(userOf(req).id, id);
  res.status(204).end();
};
