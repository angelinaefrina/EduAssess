import type { AuthUser } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import { MasterModel } from '../models/master.model';
import { NilaiRaporModel, type NilaiRaporInsert } from '../models/nilaiRapor.model';
import { SiswaModel } from '../models/siswa.model';
import { pastikanSiswaSekolahBk, sekolahBk } from './aksesBk';
import { parseCsv, toCsv } from './csv';

export interface NilaiInput {
  mapel_id: number;
  nilai: number;
}

/** Semester terakhir yang boleh diisi: akhir tingkat saat ini (kelas 10 → 2, 11 → 4, 12 → 6). */
export function semesterMaks(tingkat: number | null): number | null {
  return tingkat ? (tingkat - 10) * 2 + 2 : null;
}

function cekSemester(semester: number, tingkat: number | null) {
  const maks = semesterMaks(tingkat);
  if (!maks || semester > maks) {
    throw AppError.badRequest(
      `Semester ${semester} belum bisa diisi untuk kelas ${tingkat ?? '-'} (maks semester ${maks ?? '-'})`,
      'SEMESTER_DI_LUAR_BATAS',
    );
  }
}

const KOLOM_INFO = new Set(['nama', 'rombel', 'tingkat']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAKS_ERROR_DILAPORKAN = 100;

export const NilaiRaporService = {
  // ------------------------------------------------------------------ siswa
  async daftarSiswa(siswaId: string) {
    const siswa = await SiswaModel.findById(siswaId);
    const nilai = siswa ? await NilaiRaporModel.listBySiswa(siswaId) : [];
    return { semester_maks: semesterMaks(siswa?.tingkat ?? null), nilai };
  },

  /**
   * Simpan nilai satu semester (ganti utuh). Nilai terverifikasi dikunci:
   * tidak boleh diubah dan tidak ikut terhapus. Nilai lain menjadi 'menunggu'.
   */
  async simpanSemester(siswaId: string, semester: number, items: NilaiInput[]) {
    const siswa = await SiswaModel.findById(siswaId);
    if (!siswa) {
      throw AppError.badRequest('Lengkapi profil (onboarding) terlebih dahulu', 'SISWA_BELUM_ADA');
    }
    cekSemester(semester, siswa.tingkat);

    const tidakAda = await MasterModel.mapelTidakAda(items.map((i) => i.mapel_id));
    if (tidakAda.length) throw AppError.badRequest(`mapel_id tidak dikenal: ${tidakAda.join(', ')}`);

    const ada = await NilaiRaporModel.listSemester(siswaId, semester);
    const terkunci = new Set(ada.filter((n) => n.status === 'terverifikasi').map((n) => n.mapel_id));
    const bentrok = items.filter((i) => terkunci.has(i.mapel_id)).map((i) => i.mapel_id);
    if (bentrok.length) {
      throw new AppError(
        409,
        'NILAI_TERKUNCI',
        'Nilai yang sudah terverifikasi tidak bisa diubah; hubungi guru BK',
        { mapel_id: bentrok },
      );
    }

    const dikirim = new Set(items.map((i) => i.mapel_id));
    await NilaiRaporModel.deleteByIds(
      siswaId,
      ada.filter((n) => n.status !== 'terverifikasi' && !dikirim.has(n.mapel_id)).map((n) => n.id),
    );
    await NilaiRaporModel.upsertMany(
      items.map((i) => ({
        siswa_id: siswaId,
        mapel_id: i.mapel_id,
        semester,
        nilai: i.nilai,
        sumber: 'input_siswa',
        status: 'menunggu',
        diverifikasi_oleh: null,
        diverifikasi_at: null,
      })),
    );
    return NilaiRaporService.daftarSiswa(siswaId);
  },

  async hapus(siswaId: string, id: string) {
    const nilai = await NilaiRaporModel.findOwned(siswaId, id);
    if (!nilai) throw AppError.notFound('Nilai tidak ditemukan');
    if (nilai.status === 'terverifikasi') {
      throw AppError.conflict('Nilai yang sudah terverifikasi tidak bisa dihapus', 'NILAI_TERKUNCI');
    }
    await NilaiRaporModel.deleteByIds(siswaId, [id]);
  },

  // --------------------------------------------------------------------- BK
  async daftarMenunggu(user: AuthUser) {
    const siswa = await SiswaModel.listStatusBySekolah(sekolahBk(user), { adaNilaiMenunggu: true });
    const jumlah = await NilaiRaporModel.hitungMenungguPerSiswa(
      siswa.map((s) => s.siswa_id).filter((id): id is string => id !== null),
    );
    return siswa.map((s) => ({ ...s, jumlah_menunggu: (s.siswa_id && jumlah.get(s.siswa_id)) || 0 }));
  },

  async nilaiSiswaUntukBk(user: AuthUser, siswaId: string) {
    const siswa = await pastikanSiswaSekolahBk(user, siswaId);
    const nilai = await NilaiRaporModel.listBySiswa(siswaId);
    return { siswa, semester_maks: semesterMaks(siswa.tingkat), nilai };
  },

  /** Verifikasi/tolak nilai berstatus 'menunggu' (semua, atau hanya `ids`). */
  async putuskan(
    user: AuthUser,
    siswaId: string,
    status: 'terverifikasi' | 'ditolak',
    ids?: string[],
  ) {
    await pastikanSiswaSekolahBk(user, siswaId);
    const diubah = await NilaiRaporModel.putuskanMenunggu(siswaId, status, user.id, ids);
    return { status, jumlah: diubah.length, ids: diubah };
  },

  /** Template CSV impor: satu baris per siswa sekolah BK, satu kolom per mapel (dikosongkan). */
  async templateImpor(user: AuthUser, semester: number, tingkat?: number) {
    const [siswa, mapel] = await Promise.all([
      SiswaModel.listStatusBySekolah(sekolahBk(user), { tingkat }),
      MasterModel.listMapel(),
    ]);
    const layak = siswa.filter((s) => (semesterMaks(s.tingkat) ?? 0) >= semester);
    const header = ['siswa_id', 'nama', 'rombel', 'tingkat', ...mapel.map((m) => m.kode)];
    const isi = layak.map((s) => [
      s.siswa_id,
      s.nama,
      s.rombel,
      s.tingkat,
      ...mapel.map(() => null),
    ]);
    return { namaFile: `template-nilai-semester-${semester}.csv`, csv: toCsv([header, ...isi]) };
  },

  /**
   * Impor nilai dari template CSV. Semua-atau-tidak-sama-sekali: bila ada satu
   * baris salah, tidak ada yang disimpan. Hasil impor langsung 'terverifikasi'.
   * Sel kosong atau "0" dilewati (tidak diambil), sama seperti aturan data survei.
   */
  async impor(user: AuthUser, semester: number, teksCsv: string) {
    const sekolahId = sekolahBk(user);
    const { baris, nomorAwal, pemisah } = parseCsv(teksCsv);
    if (baris.length < 2) throw AppError.badRequest('File kosong atau hanya berisi header', 'IMPOR_KOSONG');

    const [mapel, siswa] = await Promise.all([
      MasterModel.listMapel(),
      SiswaModel.listStatusBySekolah(sekolahId),
    ]);
    const mapelByKode = new Map(mapel.map((m) => [m.kode.toUpperCase(), m.id]));
    const tingkatSiswa = new Map(siswa.map((s) => [s.siswa_id, s.tingkat]));

    const header = baris[0].map((h) => h.trim());
    const idxSiswa = header.findIndex((h) => h.toLowerCase() === 'siswa_id');
    if (idxSiswa < 0) throw AppError.badRequest('Kolom siswa_id tidak ditemukan; gunakan template', 'FORMAT_SALAH');

    const kolomMapel: { idx: number; mapelId: number; kode: string }[] = [];
    const kolomDiabaikan: string[] = [];
    header.forEach((h, idx) => {
      if (idx === idxSiswa || h === '') return;
      const mapelId = mapelByKode.get(h.toUpperCase());
      if (mapelId) kolomMapel.push({ idx, mapelId, kode: h.toUpperCase() });
      else if (!KOLOM_INFO.has(h.toLowerCase())) kolomDiabaikan.push(h);
    });
    if (kolomMapel.length === 0) throw AppError.badRequest('Tidak ada kolom mapel yang dikenali', 'FORMAT_SALAH');

    const errors: string[] = [];
    const rows: NilaiRaporInsert[] = [];
    const siswaTerisi = new Set<string>();
    const siswaDilihat = new Set<string>();
    let selKosong = 0;
    const sekarang = new Date().toISOString();

    baris.slice(1).forEach((sel, i) => {
      const no = nomorAwal + i + 1;
      if (sel.every((s) => s.trim() === '')) return;
      const siswaId = (sel[idxSiswa] ?? '').trim();

      if (!UUID.test(siswaId) || !tingkatSiswa.has(siswaId)) {
        errors.push(`Baris ${no}: siswa_id "${siswaId}" tidak ditemukan di sekolah ini`);
        return;
      }
      if (siswaDilihat.has(siswaId)) {
        errors.push(`Baris ${no}: siswa_id muncul lebih dari sekali`);
        return;
      }
      siswaDilihat.add(siswaId);

      const maks = semesterMaks(tingkatSiswa.get(siswaId) ?? null);
      for (const k of kolomMapel) {
        const mentah = (sel[k.idx] ?? '').trim();
        if (mentah === '' || mentah === '0') {
          selKosong++;
          continue;
        }
        if (!maks || semester > maks) {
          errors.push(`Baris ${no}: semester ${semester} di luar batas kelas siswa (maks ${maks ?? '-'})`);
          return;
        }
        // Dengan pemisah ';' (Excel Indonesia) desimal ditulis dengan koma.
        const angka = Number(pemisah === ';' ? mentah.replace(',', '.') : mentah);
        if (!Number.isFinite(angka) || angka <= 0 || angka > 100) {
          errors.push(`Baris ${no}, kolom ${k.kode}: nilai "${mentah}" harus angka >0 sampai 100`);
          continue;
        }
        siswaTerisi.add(siswaId);
        rows.push({
          siswa_id: siswaId,
          mapel_id: k.mapelId,
          semester,
          nilai: angka,
          sumber: 'impor_bk',
          status: 'terverifikasi',
          diverifikasi_oleh: user.id,
          diverifikasi_at: sekarang,
        });
      }
    });

    if (errors.length) {
      throw new AppError(400, 'IMPOR_GAGAL', `${errors.length} kesalahan; tidak ada nilai yang disimpan`, {
        errors: errors.slice(0, MAKS_ERROR_DILAPORKAN),
        total_error: errors.length,
      });
    }
    if (rows.length === 0) throw AppError.badRequest('Tidak ada nilai yang diisi di file', 'IMPOR_KOSONG');

    await NilaiRaporModel.upsertMany(rows);
    return {
      semester,
      jumlah_siswa: siswaTerisi.size,
      jumlah_nilai: rows.length,
      sel_kosong_dilewati: selKosong,
      kolom_diabaikan: kolomDiabaikan,
    };
  },
};
