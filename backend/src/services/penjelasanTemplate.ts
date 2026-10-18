/**
 * Penjelasan mode "mock" (LLM_PROVIDER=mock): disusun dari template berdasarkan
 * komponen skor di hasil perhitungan, tanpa memanggil API. Seperti mode LLM, isinya
 * HANYA berasal dari data hasil (tanpa fakta tambahan).
 */
import type { JenisRekomendasi } from '../models/rekomendasi.model';

// Bentuk hasil yang dibaca template (subset dari keluaran RekomendasiService/KeselarasanService).
interface MapelPendukung { kode: string; nama: string; bobot: number; nilai: number | null }
interface ProdiSkor {
  peringkat: number;
  prodi: { nama: string; kode_riasec: string | null };
  skor: { total: number; minat: number; akademik: number; karir: number };
  akademik: { cakupan: number; data_kurang: boolean; mapel: MapelPendukung[] };
  karir: { alasan: 'target_karir' | 'bidang_karir' | null; cocok: string[] };
}
interface HasilProdi {
  bobot: { minat: number; akademik: number; karir: number };
  tingkat: number | null;
  kode_holland: string | null;
  katalog_draf: boolean;
  prodi: ProdiSkor[];
  rumpun: { bidang_studi: { nama: string } | null; prodi_terbaik: string }[];
}
interface HasilMapel {
  relevan: boolean;
  katalog_draf: boolean;
  prodi_kandidat: { nama: string; sebagai: 'target_utama' | 'rekomendasi' }[];
  mapel: {
    mapel: { nama: string };
    skor: number;
    sudah_diambil: boolean;
    dukungan: { prodi: string; bobot: number }[];
  }[];
}
interface HasilJenjang {
  jenjang: { jenjang: string; poin: number; alasan: string[] }[];
  catatan: string | null;
}
interface HasilKeselarasan {
  status: 'selaras' | 'tidak_selaras' | 'berisiko';
  alasan_status: string[];
  katalog_draf: boolean;
  target: ProdiSkor;
  jumlah_prodi_dinilai: number;
  kesenjangan: {
    rata_rata_siswa: number | null;
    mapel: (MapelPendukung & { selisih: number | null; status: 'tidak_diambil' | 'di_bawah_rata_rata' | 'aman' })[];
  };
  alternatif: { peringkat: number; prodi: { nama: string } }[];
}

const persen = (x: number) => `${Math.round(x * 100)}%`;
const angka = (x: number) => String(x).replace('.', ',');
function daftar(xs: string[]): string {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} dan ${xs[xs.length - 1]}`;
}

const PENUTUP =
  'Ingat, ini hasil perhitungan sistem berdasarkan data yang kamu isi, bukan keputusan akhir. Diskusikan dengan guru BK sebelum menentukan pilihan.';
const CATATAN_DRAF =
  'Data katalog prodi (kode RIASEC dan bobot mapel pendukung) masih berupa draf yang belum diverifikasi, jadi baca hasil ini dengan hati-hati.';

function kalimatKarir(p: ProdiSkor): string {
  if (p.karir.alasan === 'target_karir') return `prodi ini terhubung langsung dengan target karirmu (${daftar(p.karir.cocok)})`;
  if (p.karir.alasan === 'bidang_karir') {
    return `prodi ini terkait dengan bidang karir yang kamu minati melalui karir ${daftar(p.karir.cocok)}`;
  }
  return 'prodi ini belum terkait dengan target karir atau bidang karir yang kamu simpan';
}

function kalimatAkademik(p: ProdiSkor): string {
  const diambil = p.akademik.mapel.filter((m) => m.nilai !== null).map((m) => `${m.nama} (${angka(m.nilai!)})`);
  const kosong = p.akademik.mapel.filter((m) => m.nilai === null).map((m) => m.nama);
  let s = `skor akademikmu ${persen(p.skor.akademik)}`;
  s += diambil.length ? ` dari nilai ${daftar(diambil)}` : ' karena belum ada nilai pada mapel pendukungnya';
  if (kosong.length) s += `; mapel pendukung ${daftar(kosong)} belum ada nilainya sehingga dihitung 0`;
  return s;
}

function prodi(h: HasilProdi): string {
  const top = h.prodi.slice(0, 3);
  const p1 =
    `Berdasarkan data yang kamu isi, prodi dengan skor tertinggi adalah ` +
    `${daftar(top.map((p) => `${p.prodi.nama} (${persen(p.skor.total)})`))}. ` +
    `Skor ini menggabungkan kecocokan minat dari tes minat RIASEC (bobot ${persen(h.bobot.minat)}), ` +
    `nilai rapor pada mapel pendukung prodi (bobot ${persen(h.bobot.akademik)}), dan kecocokan dengan target karir ` +
    `(bobot ${persen(h.bobot.karir)})${h.tingkat ? ` untuk siswa kelas ${h.tingkat}` : ''}.`;

  const a = top[0];
  const p2 = a
    ? `Untuk ${a.prodi.nama}, kecocokan minatmu ${persen(a.skor.minat)} ` +
      `(kode RIASEC prodi ${a.prodi.kode_riasec ?? '-'}${h.kode_holland ? `, kode minatmu ${h.kode_holland}` : ''}), ` +
      `${kalimatAkademik(a)}, dan ${kalimatKarir(a)}.`
    : '';

  const catatan: string[] = [];
  const kurang = top.filter((p) => p.akademik.data_kurang).map((p) => p.prodi.nama);
  if (kurang.length) {
    catatan.push(
      `Nilai rapormu belum mencakup sebagian besar mapel pendukung untuk ${daftar(kurang)}, sehingga skor akademiknya masih rendah.`,
    );
  }
  const rumpun = h.rumpun[0];
  if (rumpun?.bidang_studi) catatan.push(`Rumpun yang paling menonjol adalah ${rumpun.bidang_studi.nama}, terutama lewat ${rumpun.prodi_terbaik}.`);
  if (h.katalog_draf) catatan.push(CATATAN_DRAF);

  return [p1, p2, catatan.join(' '), PENUTUP].filter(Boolean).join('\n\n');
}

function mapel(h: HasilMapel): string {
  const bagian: string[] = [];
  if (!h.relevan) bagian.push('Rekomendasi mapel pilihan ini terutama ditujukan untuk siswa kelas 10–11.');
  const utama = h.prodi_kandidat.find((k) => k.sebagai === 'target_utama');
  const lain = h.prodi_kandidat.filter((k) => k.sebagai === 'rekomendasi').map((k) => k.nama);
  bagian.push(
    `Mapel pilihan ini dihitung dari prodi kandidatmu: ` +
      `${utama ? `target utamamu ${utama.nama}, ditambah ` : ''}prodi rekomendasi teratas ${daftar(lain)}.`,
  );
  const top = h.mapel.slice(0, 3);
  if (top.length) {
    bagian.push(
      top
        .map(
          (m) =>
            `${m.mapel.nama} (${persen(m.skor)}) dibutuhkan oleh ` +
            `${daftar(m.dukungan.map((d) => `${d.prodi} dengan bobot ${angka(d.bobot)}`))}` +
            `${m.sudah_diambil ? ', dan kamu sudah mengambilnya' : ''}.`,
        )
        .join(' '),
    );
  } else {
    bagian.push('Belum ada mapel pilihan yang menjadi pendukung prodi kandidatmu.');
  }
  if (h.katalog_draf) bagian.push(CATATAN_DRAF);
  bagian.push(PENUTUP);
  return bagian.join('\n\n');
}

function jenjang(h: HasilJenjang): string {
  const [pertama, ...lain] = h.jenjang;
  const bagian = [
    pertama && pertama.poin > 0
      ? `Berdasarkan preferensi pendidikan di profilmu, jenjang yang paling sesuai adalah ${pertama.jenjang} ` +
        `(${pertama.poin} poin: ${pertama.alasan.join('; ')}).`
      : 'Preferensi pendidikan di profilmu belum cukup untuk membedakan jenjang.',
    lain.length
      ? `Urutan berikutnya: ${daftar(lain.map((j) => `${j.jenjang} (${j.poin} poin${j.alasan.length ? `: ${j.alasan.join('; ')}` : ''})`))}.`
      : '',
    h.catatan ?? '',
    PENUTUP,
  ];
  return bagian.filter(Boolean).join('\n\n');
}

const LABEL_STATUS = { selaras: 'selaras', tidak_selaras: 'belum selaras', berisiko: 'berisiko' } as const;

function keselarasan(h: HasilKeselarasan): string {
  const t = h.target;
  const p1 =
    `Target prodi utamamu, ${t.prodi.nama}, berstatus ${LABEL_STATUS[h.status]} ` +
    `(peringkat ${t.peringkat} dari ${h.jumlah_prodi_dinilai} prodi yang dinilai). Alasannya: ${h.alasan_status.join('; ')}.`;
  const p2 = `Kecocokan minatmu dengan prodi ini ${persen(t.skor.minat)}, ${kalimatAkademik(t)}, dan ${kalimatKarir(t)}.`;

  const lemah = h.kesenjangan.mapel.filter((m) => m.status === 'di_bawah_rata_rata');
  const kosong = h.kesenjangan.mapel.filter((m) => m.status === 'tidak_diambil');
  const catatan: string[] = [];
  if (lemah.length && h.kesenjangan.rata_rata_siswa !== null) {
    catatan.push(
      `Dibanding rata-rata nilaimu sendiri (${angka(h.kesenjangan.rata_rata_siswa)}), mapel pendukung yang perlu diperkuat adalah ` +
        `${daftar(lemah.map((m) => `${m.nama} (${angka(m.nilai!)}, selisih ${angka(m.selisih!)})`))}.`,
    );
  }
  if (kosong.length) catatan.push(`Mapel pendukung ${daftar(kosong.map((m) => m.nama))} belum ada nilainya.`);
  if (h.alternatif.length) {
    catatan.push(`Sebagai pembanding, prodi dengan peringkat teratas lainnya: ${daftar(h.alternatif.map((a) => `${a.prodi.nama} (peringkat ${a.peringkat})`))}.`);
  }
  if (h.katalog_draf) catatan.push(CATATAN_DRAF);

  return [p1, p2, catatan.join(' '), PENUTUP].filter(Boolean).join('\n\n');
}

export function penjelasanTemplate(jenis: JenisRekomendasi, hasil: unknown): string {
  switch (jenis) {
    case 'prodi':
      return prodi(hasil as HasilProdi);
    case 'mapel':
      return mapel(hasil as HasilMapel);
    case 'jenis_pendidikan':
      return jenjang(hasil as HasilJenjang);
    case 'keselarasan':
      return keselarasan(hasil as HasilKeselarasan);
  }
}

// ------------------------------------------------------------ klaster (UC15)
const NAMA_RIASEC: Record<string, string> = {
  R: 'Realistis', I: 'Investigatif', A: 'Artistik', S: 'Sosial', E: 'Enterprising', C: 'Konvensional',
};

interface SelisihMapel { kode: string; nama: string; selisih: number }
export interface KarakteristikPenjelasan {
  jumlah_anggota: number;
  riasec_dominan: string[];
  mapel_menonjol: SelisihMapel[];
  mapel_lemah: SelisihMapel[];
}

/** Penjelasan klaster untuk guru, hanya dari karakteristik klaster. */
export function templateKlaster(k: KarakteristikPenjelasan): string {
  const tanda = (x: number) => (x > 0 ? `+${x}` : `${x}`);
  const mapelStr = (m: SelisihMapel[]) => daftar(m.map((x) => `${x.nama} (${tanda(x.selisih)} poin)`));
  const p1 = k.riasec_dominan.length
    ? `Klaster ini berisi ${k.jumlah_anggota} siswa dengan minat paling menonjol ${daftar(k.riasec_dominan.map((t) => NAMA_RIASEC[t] ?? t))}.`
    : `Klaster ini berisi ${k.jumlah_anggota} siswa; data tes minat anggotanya belum tersedia.`;
  const p2: string[] = [];
  if (k.mapel_menonjol.length) p2.push(`Dibandingkan seluruh siswa dalam cakupan, rata-rata nilainya lebih tinggi pada ${mapelStr(k.mapel_menonjol)}.`);
  if (k.mapel_lemah.length) p2.push(`Rata-rata nilainya lebih rendah pada ${mapelStr(k.mapel_lemah)}, sehingga mapel ini dapat menjadi fokus penguatan.`);
  if (!k.mapel_menonjol.length && !k.mapel_lemah.length) p2.push('Rata-rata nilai rapornya tidak berbeda mencolok dari seluruh siswa dalam cakupan.');
  p2.push('Ini hasil perhitungan sistem untuk membantu perencanaan pembelajaran, bukan label permanen bagi siswa.');
  return [p1, p2.join(' ')].join('\n\n');
}
