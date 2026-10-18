/**
 * Panel BK (modul 8): dashboard UC10/F12, detail siswa, ringkasan angkatan UC13/F15,
 * dan mengeluarkan siswa dari sekolah. Semua dibatasi ke sekolah milik BK.
 */
import type { AuthUser } from '../types/express';
import { BkModel, type FilterDashboard } from '../models/bk.model';
import { NilaiRaporModel } from '../models/nilaiRapor.model';
import { ProfilModel } from '../models/profil.model';
import { CatatanModel } from '../models/catatan.model';
import { pastikanSiswaSekolahBk, sekolahBk } from './aksesBk';
import { KeselarasanService } from './KeselarasanService';
import { RiasecService } from './RiasecService';
import { SiswaService, sinkronStatusOnboarding } from './SiswaService';
import { TargetService } from './TargetService';

/**
 * Status keselarasan untuk dashboard. Hasil tersimpan hanya berlaku bila target utama
 * siswa SAAT INI sama dengan target yang dianalisis; selain itu perlu dianalisis ulang.
 */
export type StatusDashboard =
  | 'selaras'
  | 'tidak_selaras'
  | 'berisiko'
  | 'belum_dianalisis'
  | 'perlu_dianalisis_ulang'
  | 'tanpa_target';

export const PENANDA = [
  'profil_belum_lengkap',
  'belum_asesmen',
  'belum_isi_nilai',
  'nilai_menunggu',
  'selaras',
  'tidak_selaras',
  'berisiko',
  'belum_dianalisis',
  'perlu_dianalisis_ulang',
  'tanpa_target',
] as const;
export type Penanda = (typeof PENANDA)[number];

type BarisStatus = Awaited<ReturnType<typeof BkModel.statusSiswa>>[number];

async function denganPenanda(baris: BarisStatus[]) {
  const ids = baris.map((b) => b.siswa_id).filter((id): id is string => id !== null);
  const [target, keselarasan] = await Promise.all([BkModel.targetUtama(ids), BkModel.keselarasanTerakhir(ids)]);

  return baris.map((b) => {
    const id = b.siswa_id!;
    const utama = target.get(id);
    const k = keselarasan.get(id);
    let status: StatusDashboard;
    if (!utama) status = 'tanpa_target';
    else if (!k) status = 'belum_dianalisis';
    else if (k.target_prodi_id !== utama) status = 'perlu_dianalisis_ulang';
    else status = (k.status as StatusDashboard) ?? 'belum_dianalisis';

    const penanda: Penanda[] = [];
    if (b.profil_belum_lengkap) penanda.push('profil_belum_lengkap');
    if (b.belum_asesmen) penanda.push('belum_asesmen');
    if (b.belum_isi_nilai) penanda.push('belum_isi_nilai');
    if (b.ada_nilai_menunggu) penanda.push('nilai_menunggu');
    penanda.push(status);

    return {
      siswa_id: id,
      nama: b.nama,
      tingkat: b.tingkat,
      rombel: b.rombel,
      angkatan: b.angkatan,
      kode_holland: b.kode_holland,
      keselarasan: {
        status,
        // Status yang tersimpan tetap ditampilkan agar BK tahu hasil terakhir sebelum basi.
        status_terakhir: k?.status ?? null,
        dihitung_at: k?.dihitung_at ?? null,
      },
      penanda,
    };
  });
}

export const BkPanelService = {
  /** UC10: daftar siswa + penanda, dengan pencarian nama/kelas dan filter penanda. */
  async dashboard(
    user: AuthUser,
    f: FilterDashboard & { penanda?: Penanda; limit: number; offset: number },
  ) {
    const semua = await denganPenanda(await BkModel.statusSiswa(sekolahBk(user), f));
    const jumlah = Object.fromEntries(PENANDA.map((p) => [p, 0])) as Record<Penanda, number>;
    for (const s of semua) for (const p of s.penanda) jumlah[p]++;
    const tersaring = f.penanda ? semua.filter((s) => s.penanda.includes(f.penanda!)) : semua;
    return {
      items: tersaring.slice(f.offset, f.offset + f.limit),
      total: tersaring.length,
      limit: f.limit,
      offset: f.offset,
      // Dihitung dari hasil pencarian (sebelum filter penanda), untuk chip filter di UI.
      jumlah_per_penanda: jumlah,
    };
  },

  /** UC10 langkah 6: detail siswa (read-only) + catatan konseling terbaru. */
  async detail(user: AuthUser, siswaId: string) {
    await pastikanSiswaSekolahBk(user, siswaId);
    const [profil, target, asesmen, nilai, catatan, [status]] = await Promise.all([
      SiswaService.getMe(siswaId),
      TargetService.daftar(siswaId),
      RiasecService.terakhir(siswaId),
      NilaiRaporModel.listBySiswa(siswaId),
      CatatanModel.listBySiswa(siswaId, 5),
      BkModel.statusSiswa(sekolahBk(user), { siswaId }).then(denganPenanda),
    ]);
    const perStatus = { menunggu: 0, terverifikasi: 0, ditolak: 0 };
    for (const n of nilai) perStatus[n.status]++;
    return {
      ...profil,
      target_prodi: target.prodi,
      asesmen_terakhir: asesmen,
      nilai: { jumlah: nilai.length, per_status: perStatus },
      keselarasan: status?.keselarasan ?? null,
      penanda: status?.penanda ?? [],
      catatan_terbaru: catatan,
    };
  },

  /**
   * Hitung ulang keselarasan semua siswa sekolah yang punya target utama.
   * Siswa yang inputnya tidak berubah langsung memakai cache.
   */
  async segarkanKeselarasan(user: AuthUser) {
    const baris = await BkModel.statusSiswa(sekolahBk(user));
    const ids = baris.map((b) => b.siswa_id).filter((id): id is string => id !== null);
    const target = await BkModel.targetUtama(ids);
    const antrian = ids.filter((id) => target.has(id));
    const ringkas = { diperiksa: antrian.length, dihitung_baru: 0, dari_cache: 0, data_belum_lengkap: 0 };

    const PARALEL = 4;
    for (let i = 0; i < antrian.length; i += PARALEL) {
      const hasil = await Promise.all(antrian.slice(i, i + PARALEL).map((id) => KeselarasanService.analisis(id)));
      for (const h of hasil) {
        if (!h.tersedia) ringkas.data_belum_lengkap++;
        else if (h.dari_cache) ringkas.dari_cache++;
        else ringkas.dihitung_baru++;
      }
    }
    return ringkas;
  },

  /** Mengeluarkan siswa dari sekolah: data siswa tetap; bisa bergabung lagi lewat kode BK. */
  async keluarkan(user: AuthUser, siswaId: string) {
    await pastikanSiswaSekolahBk(user, siswaId);
    await ProfilModel.update(siswaId, { sekolah_id: null });
    await sinkronStatusOnboarding(siswaId); // sekolah adalah syarat onboarding_selesai
  },

  /** UC13 / F15: distribusi minat, rumpun target, bidang karir, dan mapel pilihan. */
  async ringkasan(user: AuthUser, angkatan?: number | null) {
    const sekolahId = sekolahBk(user);
    const [r, siswa] = await Promise.all([BkModel.ringkasan(sekolahId, angkatan), BkModel.statusSiswa(sekolahId)]);

    // Tanpa filter angkatan, jumlah dari semua angkatan digabung per kategori.
    const gabung = <T extends { jumlah: number | null }>(rows: T[], kunci: keyof T) => {
      const m = new Map<string, number>();
      for (const x of rows) {
        const k = String(x[kunci] ?? '-');
        m.set(k, (m.get(k) ?? 0) + (x.jumlah ?? 0));
      }
      return [...m].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
    };

    const perAngkatan = new Map<number | null, number>();
    for (const s of siswa) perAngkatan.set(s.angkatan, (perAngkatan.get(s.angkatan) ?? 0) + 1);
    const terpilih = siswa.filter((s) => angkatan === undefined || s.angkatan === angkatan);

    return {
      filter_angkatan: angkatan === undefined ? 'semua' : angkatan,
      angkatan_tersedia: [...perAngkatan]
        .map(([a, jumlah]) => ({ angkatan: a, jumlah_siswa: jumlah }))
        .sort((x, y) => (x.angkatan ?? 9999) - (y.angkatan ?? 9999)),
      jumlah_siswa: terpilih.length,
      jumlah_sudah_asesmen: terpilih.filter((s) => !s.belum_asesmen).length,
      minat_dominan: gabung(r.minat, 'tipe_dominan'),
      rumpun_target: gabung(r.bidang, 'bidang_studi'),
      bidang_karir_target: gabung(r.karir, 'bidang_karir'),
      mapel_pilihan: gabung(r.mapel, 'mapel'),
    };
  },
};
