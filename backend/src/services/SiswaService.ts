import { AppError } from '../middleware/errorHandler';
import { KodeBkModel } from '../models/kodeBk.model';
import { MasterModel } from '../models/master.model';
import { PreferensiModel, type PreferensiInsert } from '../models/preferensi.model';
import { ProfilModel } from '../models/profil.model';
import { SiswaModel } from '../models/siswa.model';
import { SiswaPilihanModel } from '../models/siswaPilihan.model';
import { TargetKarirModel, type TargetKarirInsert } from '../models/targetKarir.model';
import { normalisasiKode } from './KodeBkService';
import type { Database } from '../../types/database';

type Peminatan = Database['public']['Enums']['peminatan_sekolah'];

export interface ProfilInput {
  nama: string;
  tingkat: number;
  peminatan: Peminatan;
  rombel?: string | null;
  angkatan?: number | null;
}

export type PreferensiInput = Omit<PreferensiInsert, 'siswa_id' | 'updated_at'>;

export type TargetKarirInput = { karir_id: string } | { teks_bebas: string };

export interface OnboardingInput {
  profil: ProfilInput;
  preferensi?: PreferensiInput;
  mapel_ids?: number[];
  mapel_favorit_ids?: number[];
  bidang_karir_ids?: number[];
  target_karir?: TargetKarirInput[];
}

type FieldWajib = 'nama' | 'tingkat' | 'peminatan' | 'sekolah';

/** Syarat onboarding_selesai: nama, tingkat, peminatan, dan sudah terdaftar ke sekolah via kode BK. */
function fieldKurang(
  profil: { nama: string | null; sekolah_id: string | null },
  siswa: { tingkat: number | null; peminatan: Peminatan | null } | null,
): FieldWajib[] {
  const kurang: FieldWajib[] = [];
  if (!profil.nama?.trim()) kurang.push('nama');
  if (!siswa?.tingkat) kurang.push('tingkat');
  if (!siswa?.peminatan) kurang.push('peminatan');
  if (!profil.sekolah_id) kurang.push('sekolah');
  return kurang;
}

async function ambilProfil(siswaId: string) {
  const profil = await ProfilModel.findByIdWithSekolah(siswaId);
  if (!profil) throw AppError.notFound('Profil tidak ditemukan');
  return profil;
}

/** Selaraskan siswa.onboarding_selesai dengan kelengkapan data saat ini. */
export async function sinkronStatusOnboarding(siswaId: string) {
  const [profil, siswa] = await Promise.all([ambilProfil(siswaId), SiswaModel.findById(siswaId)]);
  if (!siswa) return;
  const lengkap = fieldKurang(profil, siswa).length === 0;
  if (siswa.onboarding_selesai !== lengkap) {
    await SiswaModel.update(siswaId, { onboarding_selesai: lengkap });
  }
}

async function pastikanSiswaAda(siswaId: string) {
  if (!(await SiswaModel.findById(siswaId))) {
    throw AppError.badRequest('Lengkapi profil (onboarding) terlebih dahulu', 'SISWA_BELUM_ADA');
  }
}

async function validasiMapel(ids: number[]) {
  const tidakAda = await MasterModel.mapelTidakAda(ids);
  if (tidakAda.length) throw AppError.badRequest(`mapel_id tidak dikenal: ${tidakAda.join(', ')}`);
}

async function validasiBidangKarir(ids: number[]) {
  const tidakAda = await MasterModel.bidangKarirTidakAda(ids);
  if (tidakAda.length) {
    throw AppError.badRequest(`bidang_karir_id tidak dikenal: ${tidakAda.join(', ')}`);
  }
}

async function validasiTargetKarir(items: TargetKarirInput[]) {
  const karirIds = items.flatMap((t) => ('karir_id' in t ? [t.karir_id] : []));
  const tidakAda = await MasterModel.karirTidakAda(karirIds);
  if (tidakAda.length) throw AppError.badRequest(`karir_id tidak dikenal: ${tidakAda.join(', ')}`);
}

/**
 * Ganti target karir yang diisi siswa sendiri (sumber 'onboarding').
 * Target dari sumber lain (mis. eksplorasi karir, modul 5) tidak disentuh;
 * karir yang sudah tersimpan dari sumber lain dilewati agar tidak dobel.
 */
async function gantiTargetKarirOnboarding(siswaId: string, items: TargetKarirInput[]) {
  await TargetKarirModel.deleteBySumber(siswaId, 'onboarding');
  const tersisa = await TargetKarirModel.listBySiswa(siswaId);
  const karirSudahAda = new Set(tersisa.map((t) => t.karir?.id).filter(Boolean));
  const teksSudahAda = new Set<string>();

  const rows: TargetKarirInsert[] = [];
  for (const item of items) {
    if ('karir_id' in item) {
      if (karirSudahAda.has(item.karir_id)) continue;
      karirSudahAda.add(item.karir_id);
      rows.push({ siswa_id: siswaId, karir_id: item.karir_id, sumber: 'onboarding' });
    } else {
      const kunci = item.teks_bebas.toLowerCase();
      if (teksSudahAda.has(kunci)) continue;
      teksSudahAda.add(kunci);
      rows.push({ siswa_id: siswaId, teks_bebas: item.teks_bebas, sumber: 'onboarding' });
    }
  }
  await TargetKarirModel.insertMany(rows);
}

async function simpanProfil(siswaId: string, input: ProfilInput) {
  await ProfilModel.update(siswaId, { nama: input.nama });
  await SiswaModel.upsert({
    id: siswaId,
    tingkat: input.tingkat,
    peminatan: input.peminatan,
    rombel: input.rombel ?? null,
    angkatan: input.angkatan ?? null,
  });
}

export const SiswaService = {
  async getMe(siswaId: string) {
    const [profil, siswa, preferensi, mapel, mapelFavorit, bidangKarir, targetKarir] =
      await Promise.all([
        ambilProfil(siswaId),
        SiswaModel.findById(siswaId),
        PreferensiModel.findBySiswa(siswaId),
        SiswaPilihanModel.listMapel(siswaId),
        SiswaPilihanModel.listMapelFavorit(siswaId),
        SiswaPilihanModel.listBidangKarir(siswaId),
        TargetKarirModel.listBySiswa(siswaId),
      ]);
    const kurang = fieldKurang(profil, siswa);

    return {
      profil: { id: profil.id, nama: profil.nama, sekolah: profil.sekolah },
      // null = siswa belum pernah menyimpan profil (login pertama -> tampilkan onboarding)
      siswa,
      preferensi,
      // dibungkus { mapel } / { bidang_karir } sesuai kontrak FE (SiswaSaya)
      mapel: mapel.map((m) => ({ mapel: m })),
      mapel_favorit: mapelFavorit.map((m) => ({ mapel: m })),
      bidang_karir: bidangKarir.map((b) => ({ bidang_karir: b })),
      target_karir: targetKarir,
      kelengkapan: { lengkap: kurang.length === 0, kurang },
    };
  },

  /** Daftarkan siswa ke sekolah berdasarkan kode dari BK. */
  async gabungSekolah(siswaId: string, kodeInput: string) {
    const kode = await KodeBkModel.findByKode(normalisasiKode(kodeInput));
    const kedaluwarsa = kode?.berlaku_sampai && new Date(kode.berlaku_sampai) <= new Date();
    if (!kode || !kode.aktif || kedaluwarsa) {
      throw AppError.badRequest(
        'Kode tidak ditemukan, tidak aktif, atau sudah kedaluwarsa',
        'KODE_TIDAK_VALID',
      );
    }

    await ProfilModel.update(siswaId, { sekolah_id: kode.sekolah_id });
    await sinkronStatusOnboarding(siswaId);
    return { sekolah: kode.sekolah };
  },

  async onboarding(siswaId: string, input: OnboardingInput) {
    // Validasi semua dulu sebelum menulis apa pun.
    const profil = await ambilProfil(siswaId);
    if (!profil.sekolah_id) {
      throw AppError.badRequest(
        'Masukkan kode dari guru BK terlebih dahulu',
        'BELUM_TERDAFTAR_SEKOLAH',
      );
    }
    await Promise.all([
      validasiMapel([...(input.mapel_ids ?? []), ...(input.mapel_favorit_ids ?? [])]),
      validasiBidangKarir(input.bidang_karir_ids ?? []),
      validasiTargetKarir(input.target_karir ?? []),
    ]);

    await simpanProfil(siswaId, input.profil);
    if (input.preferensi) await PreferensiModel.upsert({ siswa_id: siswaId, ...input.preferensi });
    if (input.mapel_ids) await SiswaPilihanModel.replaceMapel(siswaId, input.mapel_ids);
    if (input.mapel_favorit_ids) {
      await SiswaPilihanModel.replaceMapelFavorit(siswaId, input.mapel_favorit_ids);
    }
    if (input.bidang_karir_ids) {
      await SiswaPilihanModel.replaceBidangKarir(siswaId, input.bidang_karir_ids);
    }
    if (input.target_karir) await gantiTargetKarirOnboarding(siswaId, input.target_karir);

    await sinkronStatusOnboarding(siswaId);
    return SiswaService.getMe(siswaId);
  },

  async ubahProfil(siswaId: string, input: ProfilInput) {
    await simpanProfil(siswaId, input);
    await sinkronStatusOnboarding(siswaId);
    return SiswaService.getMe(siswaId);
  },

  async ubahPreferensi(siswaId: string, input: PreferensiInput) {
    await pastikanSiswaAda(siswaId);
    await PreferensiModel.upsert({ siswa_id: siswaId, ...input });
    return PreferensiModel.findBySiswa(siswaId);
  },

  async ubahMapel(siswaId: string, ids: number[]) {
    await pastikanSiswaAda(siswaId);
    await validasiMapel(ids);
    await SiswaPilihanModel.replaceMapel(siswaId, ids);
    return SiswaPilihanModel.listMapel(siswaId);
  },

  async ubahMapelFavorit(siswaId: string, ids: number[]) {
    await pastikanSiswaAda(siswaId);
    await validasiMapel(ids);
    await SiswaPilihanModel.replaceMapelFavorit(siswaId, ids);
    return SiswaPilihanModel.listMapelFavorit(siswaId);
  },

  async ubahBidangKarir(siswaId: string, ids: number[]) {
    await pastikanSiswaAda(siswaId);
    await validasiBidangKarir(ids);
    await SiswaPilihanModel.replaceBidangKarir(siswaId, ids);
    return SiswaPilihanModel.listBidangKarir(siswaId);
  },

  async ubahTargetKarir(siswaId: string, items: TargetKarirInput[]) {
    await pastikanSiswaAda(siswaId);
    await validasiTargetKarir(items);
    await gantiTargetKarirOnboarding(siswaId, items);
    return TargetKarirModel.listBySiswa(siswaId);
  },

  async hapusTargetKarir(siswaId: string, id: string) {
    if (!(await TargetKarirModel.deleteOwned(siswaId, id))) {
      throw AppError.notFound('Target karir tidak ditemukan');
    }
  },
};
