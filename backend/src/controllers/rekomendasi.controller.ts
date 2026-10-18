import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import { userOf } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import type { JenisRekomendasi } from '../models/rekomendasi.model';
import { pastikanSiswaSekolahBk } from '../services/aksesBk';
import { KeselarasanService } from '../services/KeselarasanService';
import { PenjelasanGagal, PenjelasanLLMService } from '../services/PenjelasanLLMService';
import { RekomendasiModel } from '../models/rekomendasi.model';
import { RekomendasiService, type HasilRekomendasi } from '../services/RekomendasiService';

/** Segmen URL -> enum jenis_rekomendasi. */
const JENIS = {
  prodi: { enum: 'prodi', hitung: RekomendasiService.prodi },
  mapel: { enum: 'mapel', hitung: RekomendasiService.mapel },
  jenjang: { enum: 'jenis_pendidikan', hitung: RekomendasiService.jenjang },
  keselarasan: { enum: 'keselarasan', hitung: KeselarasanService.analisis },
} satisfies Record<string, { enum: JenisRekomendasi; hitung: (siswaId: string) => Promise<HasilRekomendasi> }>;
type SegmenJenis = keyof typeof JENIS;

/** Siswa: dirinya sendiri. BK/guru: siswa :siswaId di sekolah yang sama (selain itu 404). */
async function siswaTujuan(req: Request): Promise<string> {
  const user = userOf(req);
  if (user.peran === 'siswa') return user.id;
  const { siswaId } = z.object({ siswaId: z.uuid() }).parse(req.params);
  await pastikanSiswaSekolahBk(user, siswaId);
  return siswaId;
}

function tampilkan(h: HasilRekomendasi) {
  if (!h.tersedia) return h;
  const { cacheId: _id, ...publik } = h;
  return publik;
}

export const rekomendasi =
  (segmen: SegmenJenis): RequestHandler =>
  async (req, res) => {
    res.json({ data: tampilkan(await JENIS[segmen].hitung(await siswaTujuan(req))) });
  };

/** UC14: buat (sekali) atau ambil penjelasan LLM untuk hasil rekomendasi terkini. */
export const penjelasan: RequestHandler = async (req, res) => {
  const { jenis } = z.object({ jenis: z.enum(['prodi', 'mapel', 'jenjang', 'keselarasan']) }).parse(req.params);
  const siswaId = await siswaTujuan(req);
  const h = await JENIS[jenis].hitung(siswaId);
  if (!h.tersedia) {
    throw new AppError(400, 'REKOMENDASI_BELUM_TERSEDIA', 'Rekomendasi belum tersedia; lengkapi data terlebih dahulu', {
      kurang: h.kurang,
    });
  }
  // Penjelasan tersimpan dipakai ulang hanya bila dibuat oleh mode/model yang sedang aktif,
  // agar penjelasan "mock" tidak terus dipakai setelah beralih ke Claude (dan sebaliknya).
  const model = PenjelasanLLMService.model();
  if (h.penjelasan && h.model_llm === model) {
    res.json({ data: { penjelasan: h.penjelasan, model, dari_cache: true } });
    return;
  }
  try {
    const teks = await PenjelasanLLMService.jelaskan(JENIS[jenis].enum, h.hasil);
    await RekomendasiModel.simpanPenjelasan(h.cacheId, teks, model);
    res.json({ data: { penjelasan: teks, model, dari_cache: false } });
  } catch (err) {
    if (!(err instanceof PenjelasanGagal)) throw err;
    console.error('Penjelasan LLM gagal:', err.message);
    // Jangan gagalkan request: simpan penjelasan = null (dicoba lagi nanti) + kembalikan alasannya.
    await RekomendasiModel.simpanPenjelasan(h.cacheId, null, null);
    res.json({ data: { penjelasan: null, model, alasan: err.alasan } });
  }
};
