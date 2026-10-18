import type { AuthUser } from '../types/express';
import { AppError } from '../middleware/errorHandler';
import { KatalogModel } from '../models/katalog.model';
import { TargetKarirModel } from '../models/targetKarir.model';
import { TargetProdiModel } from '../models/targetProdi.model';

type MapelRef = { id: number; kode: string; nama: string };

/** Gabungkan mapel pendukung dari beberapa prodi; bobot yang dipakai adalah yang tertinggi. */
function gabungMapel(daftar: { bobot: number; mapel: MapelRef | null }[]) {
  const per = new Map<number, { mapel: MapelRef; bobot: number }>();
  for (const { bobot, mapel } of daftar) {
    if (!mapel) continue;
    const lama = per.get(mapel.id);
    if (!lama || bobot > lama.bobot) per.set(mapel.id, { mapel, bobot });
  }
  return [...per.values()].sort((a, b) => b.bobot - a.bobot || a.mapel.id - b.mapel.id);
}

/** Tempel nilai terakhir siswa (data mentah, tanpa label kurang/aman — itu urusan modul keselarasan). */
async function denganNilaiSiswa(user: AuthUser, mapel: { mapel: MapelRef; bobot: number }[]) {
  if (user.peran !== 'siswa') return mapel;
  const nilai = await KatalogModel.nilaiTerakhirSiswa(user.id);
  return mapel.map((m) => ({ ...m, nilai_terakhir_siswa: nilai[m.mapel.kode] ?? null }));
}

export const KatalogService = {
  async detailProdi(user: AuthUser, id: string) {
    const p = await KatalogModel.findProdi(id);
    if (!p) throw AppError.notFound('Prodi tidak ditemukan');

    const { prodi_mapel, karir_prodi, prodi_pt, ...info } = p;
    const hasil = {
      ...info,
      mapel_pendukung: await denganNilaiSiswa(user, gabungMapel(prodi_mapel)),
      contoh_karir: karir_prodi.map((k) => k.karir).filter((k) => k !== null),
      perguruan_tinggi: prodi_pt
        .filter((x) => x.perguruan_tinggi)
        .map((x) => ({ ...x.perguruan_tinggi!, jenjang: x.jenjang, sumber_url: x.sumber_url })),
    };
    if (user.peran !== 'siswa') return hasil;

    const target = await TargetProdiModel.findBySiswaProdi(user.id, id);
    return {
      ...hasil,
      status_target: { tersimpan: !!target, target_id: target?.id ?? null, is_utama: target?.is_utama ?? false },
    };
  },

  async detailKarir(user: AuthUser, id: string) {
    const k = await KatalogModel.findKarir(id);
    if (!k) throw AppError.notFound('Karir tidak ditemukan');

    const { karir_prodi, ...info } = k;
    const prodi = karir_prodi.map((x) => x.prodi).filter((p) => p !== null);
    const hasil = {
      ...info,
      prodi_relevan: prodi.map(({ prodi_mapel: _m, ...p }) => p),
      mapel_pendukung: await denganNilaiSiswa(user, gabungMapel(prodi.flatMap((p) => p.prodi_mapel))),
    };
    if (user.peran !== 'siswa') return hasil;

    const target = await TargetKarirModel.findBySiswaKarir(user.id, id);
    return { ...hasil, status_target: { tersimpan: !!target, target_id: target?.id ?? null } };
  },
};
