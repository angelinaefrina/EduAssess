import { AppError } from '../middleware/errorHandler';
import { KatalogModel } from '../models/katalog.model';
import { SiswaModel } from '../models/siswa.model';
import { TargetKarirModel, type SumberTarget } from '../models/targetKarir.model';
import { TargetProdiModel } from '../models/targetProdi.model';

async function pastikanSiswaAda(siswaId: string) {
  if (!(await SiswaModel.findById(siswaId))) {
    throw AppError.badRequest('Lengkapi profil (onboarding) terlebih dahulu', 'SISWA_BELUM_ADA');
  }
}

/**
 * target_karir = INPUT rekomendasi; target_prodi = pilihan siswa (tidak memengaruhi
 * rekomendasi). Satu target prodi utama dipakai analisis keselarasan (UC08).
 */
export const TargetService = {
  async daftar(siswaId: string) {
    const [karir, prodi] = await Promise.all([
      TargetKarirModel.listBySiswa(siswaId),
      TargetProdiModel.listBySiswa(siswaId),
    ]);
    return { karir, prodi };
  },

  /** "Simpan sebagai Karir Impian" (UC05). Idempoten: karir yang sama tidak disimpan dua kali. */
  async simpanKarir(siswaId: string, karirId: string) {
    await pastikanSiswaAda(siswaId);
    if (!(await KatalogModel.karirAda(karirId))) throw AppError.notFound('Karir tidak ditemukan');

    const ada = await TargetKarirModel.findBySiswaKarir(siswaId, karirId);
    if (ada) return { baru: false, target: ada };
    await TargetKarirModel.insertMany([{ siswa_id: siswaId, karir_id: karirId, sumber: 'eksplorasi_karir' }]);
    return { baru: true, target: (await TargetKarirModel.findBySiswaKarir(siswaId, karirId))! };
  },

  /** "Jadikan Target" (UC04/05/09). Target prodi pertama otomatis menjadi utama. */
  async simpanProdi(siswaId: string, prodiId: string, sumber: SumberTarget) {
    await pastikanSiswaAda(siswaId);
    if (!(await KatalogModel.prodiAda(prodiId))) throw AppError.notFound('Prodi tidak ditemukan');

    const ada = await TargetProdiModel.findBySiswaProdi(siswaId, prodiId);
    if (ada) return { baru: false, target: ada };
    const isUtama = !(await TargetProdiModel.adaUtama(siswaId));
    const target = await TargetProdiModel.insert({ siswa_id: siswaId, prodi_id: prodiId, sumber, is_utama: isUtama });
    return { baru: true, target };
  },

  async jadikanUtama(siswaId: string, id: string) {
    if (!(await TargetProdiModel.findOwned(siswaId, id))) throw AppError.notFound('Target prodi tidak ditemukan');
    await TargetProdiModel.jadikanUtama(siswaId, id);
    return TargetProdiModel.listBySiswa(siswaId);
  },

  /** Bila yang dihapus adalah utama, target tertua yang tersisa naik menjadi utama. */
  async hapusProdi(siswaId: string, id: string) {
    const target = await TargetProdiModel.findOwned(siswaId, id);
    if (!target) throw AppError.notFound('Target prodi tidak ditemukan');
    await TargetProdiModel.hapus(siswaId, id);
    if (target.is_utama) {
      const pengganti = await TargetProdiModel.tertua(siswaId);
      if (pengganti) await TargetProdiModel.jadikanUtama(siswaId, pengganti.id);
    }
    return TargetProdiModel.listBySiswa(siswaId);
  },
};
