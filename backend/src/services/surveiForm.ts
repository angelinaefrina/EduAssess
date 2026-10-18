/**
 * Definisi Google Form "Survei Pengalaman Pemilihan dan Kecocokan Jurusan Kuliah"
 * (docs/survei.pdf). Judul kolom & label opsi disalin PERSIS dari ekspor CSV.
 * Dipakai bersama oleh importer (CSV -> DB) dan generator data sintetis.
 *
 * Kolom nilai (Q12–Q23), butir RIASEC (Q26–Q43), dan kemampuan (Q44–Q52) tidak
 * didaftar di sini: judulnya diturunkan dari tabel mapel / riasec_butir /
 * dimensi_kemampuan agar satu sumber kebenaran dengan aplikasi.
 */
import type { Database } from '../../types/database';

type Enums = Database['public']['Enums'];

/** Samakan spasi (ekspor Google Form kadang memuat spasi ganda). */
export const normal = (s: string) => s.replace(/\s+/g, ' ').trim();

export const KOLOM = {
  timestamp: 'Timestamp',
  q1: 'Apakah Anda bersedia berpartisipasi secara sukarela dan mengizinkan jawaban Anda digunakan untuk keperluan penelitian serta pengembangan sistem rekomendasi jurusan berbasis AI?',
  q2: 'Apakah Anda merupakan mahasiswa aktif berusia minimal 18 tahun?',
  q3: 'Jenjang pendidikan yang sedang Anda tempuh',
  q4: 'Program studi Anda termasuk bidang apa?',
  q5: 'Jurusan / Program Studi',
  q6: 'Saat ini Anda berada pada semester berapa?',
  q7: 'Apa jenis pendidikan yang Anda tempuh sebelum memasuki perguruan tinggi?',
  q8: 'Apa peminatan atau bidang keahlian Anda ketika sekolah?',
  q9: 'Tahun berapa Anda lulus dari SMA/SMK/MA atau sederajat?',
  q10: 'Apakah program studi yang sedang Anda tempuh merupakan pilihan utama saat mendaftar kuliah?',
  q11: 'Apakah Anda pernah berpindah program studi selama kuliah?',
  q24: 'Dari mana Anda memperoleh nilai akademik yang dicantumkan?',
  q25: 'Mata pelajaran apa yang paling Anda sukai ketika sekolah?',
  q53: 'Bidang pekerjaan apa yang paling menarik bagi Anda ketika akan memilih jurusan kuliah?',
  q54: 'Seberapa yakin Anda terhadap pilihan jurusan ketika pertama kali mendaftar kuliah?',
  q55: 'Sebelum mendaftar kuliah, seberapa baik Anda memahami mata kuliah yang akan dipelajari pada jurusan pilihan Anda?',
  q56: 'Sebelum memilih jurusan, seberapa baik Anda mengetahui kemampuan yang dibutuhkan untuk menjalani perkuliahan di jurusan tersebut?',
  q57: 'Apa saja sumber informasi yang Anda gunakan ketika menentukan jurusan kuliah?',
  q58: 'Apa faktor yang paling memengaruhi keputusan Anda dalam memilih jurusan kuliah?',
  q59: 'Apa kesulitan terbesar yang Anda alami ketika menentukan jurusan kuliah?',
  q60: 'Apakah Anda pernah mengikuti tes minat dan bakat sebelum memilih jurusan kuliah?',
  q61: 'Apakah Anda pernah mendapatkan bimbingan pemilihan jurusan dari guru BK atau konselor?',
  q62: 'Apakah Anda mempertimbangkan beberapa pilihan jurusan sebelum mendaftar kuliah?',
  q63: 'Menurut Anda, apakah informasi yang tersedia saat itu sudah cukup untuk membantu Anda menentukan pilihan jurusan kuliah?',
  q65: 'Setelah mulai berkuliah, bagaimana kesesuaian materi perkuliahan dengan ekspektasi Anda sebelum masuk?',
  q66: 'Seberapa sering Anda mempertimbangkan untuk berpindah jurusan karena merasa tidak cocok?',
  q67: 'Apa tantangan terbesar yang Anda hadapi selama menjalani jurusan saat ini?',
  q68: 'Berapa IPK terakhir Anda?',
  q69: 'Ketika memilih jurusan kuliah, seberapa besar kebutuhan Anda terhadap bantuan tambahan di luar informasi yang saat itu sudah tersedia?',
  q70: 'Seandainya saat itu tersedia website yang dapat memberikan rekomendasi jurusan berdasarkan nilai akademik, minat, dan kemampuan, seberapa besar kemungkinan Anda menggunakannya sebagai bahan pertimbangan?',
  q71: 'Informasi atau fitur apa yang menurut Anda paling berguna dalam sebuah website rekomendasi jurusan?',
  q72: 'Seberapa besar tingkat kepercayaan Anda terhadap rekomendasi jurusan yang dihasilkan oleh AI apabila alasan rekomendasinya dijelaskan secara transparan?',
  q73: 'Apa kekhawatiran utama Anda terhadap penggunaan AI untuk memberikan rekomendasi jurusan?',
  q74: 'Berdasarkan pengalaman Anda, apa hal yang paling penting untuk diketahui siswa SMA sebelum memilih jurusan kuliah?',
  q75: 'Apakah ada saran, masukan, atau pengalaman lain mengenai pemilihan jurusan kuliah maupun pengembangan website rekomendasi jurusan berbasis AI yang ingin Anda bagikan?',
} as const;
export type KunciKolom = keyof typeof KOLOM;

export const judulNilai = (namaMapel: string) => `Berapa nilai ${namaMapel} Anda?`;

/** Q64 (grid): "Isi pernyataan berikut. [<baris>]" -> kolom fit_* di tabel responden. */
const PREFIX_GRID = 'Isi pernyataan berikut.';
export const GRID_Q64 = {
  fit_minat: 'Jurusan yang saya jalani sesuai dengan minat pribadi saya.',
  fit_kemampuan: 'Kemampuan akademik saya sesuai dengan tuntutan pembelajaran di jurusan ini.',
  fit_menikmati_materi: 'Saya menikmati mempelajari sebagian besar materi perkuliahan di jurusan ini.',
  fit_puas: 'Saya merasa puas dengan jurusan yang sedang saya tempuh.',
  fit_tujuan_karier: 'Jurusan ini sesuai dengan tujuan karier yang ingin saya capai.',
  fit_termotivasi: 'Saya merasa termotivasi untuk mendalami bidang ilmu jurusan ini.',
  fit_yakin_lulus: 'Saya yakin ingin menyelesaikan pendidikan pada jurusan ini.',
  fit_pilih_ulang_sama: 'Jika dapat mengulang proses pemilihan jurusan, saya akan memilih jurusan yang sama.',
} as const;
export type KolomFit = keyof typeof GRID_Q64;
export const judulGrid = (baris: string) => `${PREFIX_GRID} [${baris}]`;

/** Kolom Likert 1–5 di tabel responden (selain grid Q64). */
export const LIKERT_RESPONDEN = {
  yakin_pilihan: 'q54',
  paham_matkul: 'q55',
  paham_kemampuan_prodi: 'q56',
  info_cukup: 'q63',
  butuh_bantuan: 'q69',
  kemungkinan_pakai: 'q70',
  kepercayaan_ai: 'q72',
} as const satisfies Record<string, KunciKolom>;

/** Checkbox yang disimpan apa adanya sebagai text[] (termasuk isian "Other"). */
export const CHECKBOX_TEKS = {
  sumber_informasi: 'q57',
  faktor_keputusan: 'q58',
  kesulitan: 'q59',
  tantangan: 'q67',
  fitur_berguna: 'q71',
  kekhawatiran_ai: 'q73',
} as const satisfies Record<string, KunciKolom>;

export const PEMISAH_CHECKBOX = ';';

export const SETUJU_Q1 = 'Ya, saya bersedia.';
export const YA_Q2 = 'Ya';
export const BELUM_ADA_GAMBARAN_Q53 = 'Belum memiliki gambaran bidang pekerjaan';

export const OPSI_Q3: Record<string, Enums['jenjang_pendidikan']> = {
  'Diploma 3 (D3)': 'D3',
  'Diploma 4 (D4)/Sarjana Terapan': 'D4',
  'Sarjana (S1)': 'S1',
  Kedinasan: 'kedinasan',
};
/** Q4: urutan & label persis survei; nama sama dengan tabel bidang_studi. */
export const OPSI_Q4 = [
  'Teknik dan Teknologi',
  'Komputer dan Informatika',
  'Kesehatan dan Kedokteran',
  'Ekonomi, Bisnis, dan Manajemen',
  'Sosial, Politik, dan Hukum',
  'Pendidikan',
  'Sains dan Matematika',
  'Pertanian, Pangan, dan Lingkungan',
  'Seni, Desain, dan Humaniora',
] as const;
export const OPSI_Q6: Record<string, number> = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [String(n), n])),
  '> 8': 9,
};
export const OPSI_Q7: Record<string, Enums['jenis_sekolah_asal']> = {
  SMA: 'SMA',
  MA: 'MA',
  SMK: 'SMK',
  'Pendidikan kesetaraan': 'kesetaraan',
};
export const OPSI_Q8: Record<string, Enums['peminatan_sekolah']> = {
  IPA: 'IPA',
  IPS: 'IPS',
  Bahasa: 'Bahasa',
  'Kurikulum Merdeka (tanpa peminatan IPA/IPS/Bahasa)': 'Merdeka',
  'Kejuruan/SMK': 'SMK',
};
export const OPSI_Q9: Record<string, number> = {
  '< 2020': 2019,
  ...Object.fromEntries([2020, 2021, 2022, 2023, 2024, 2025, 2026].map((n) => [String(n), n])),
  '> 2026': 2027,
};
export const OPSI_Q10: Record<string, Enums['status_pilihan_prodi']> = {
  'Ya, merupakan pilihan pertama.': 'pilihan_pertama',
  'Bukan pilihan pertama, tetapi masih termasuk jurusan yang saya inginkan.': 'bukan_pertama_diinginkan',
  'Bukan, saya awalnya menginginkan jurusan lain.': 'ingin_jurusan_lain',
  'Saat itu saya belum memiliki pilihan utama.': 'belum_punya_pilihan',
};
export const OPSI_Q11: Record<string, Enums['riwayat_pindah']> = {
  'Belum pernah.': 'belum',
  'Pernah karena merasa tidak cocok.': 'pernah_tidak_cocok',
  'Pernah karena alasan lain.': 'pernah_alasan_lain',
};
export const OPSI_Q24: Record<string, Enums['keandalan_nilai']> = {
  'Melihat langsung dari rapor.': 'rapor',
  'Berdasarkan catatan nilai yang masih dimiliki.': 'catatan',
  'Mengingat atau memperkirakan nilai.': 'ingatan',
  'Tidak mengisi bagian nilai akademik.': 'tidak_mengisi',
};
/** Q60–Q62 disimpan sebagai label apa adanya; daftar ini hanya untuk validasi. */
export const OPSI_Q60 = [
  'Ya, dan hasilnya membantu.',
  'Ya, tetapi hasilnya kurang membantu.',
  'Ya, tetapi saya tidak menggunakan hasilnya.',
  'Tidak pernah.',
];
export const OPSI_Q61 = [
  'Ya, dan merasa terbantu.',
  'Ya, tetapi kurang membantu.',
  'Ya, tetapi tidak merasa terbantu.',
  'Tidak pernah.',
];
export const OPSI_Q62 = [
  'Ya, membandingkan beberapa jurusan secara mendalam.',
  'Ya, tetapi hanya membandingkan secara singkat.',
  'Tidak, sejak awal sudah yakin dengan satu jurusan.',
  'Tidak, karena pilihan terutama ditentukan oleh pihak lain.',
];
/** Q65: 5 = jauh lebih sesuai .. 1 = sangat berbeda (sesuai komentar skema). */
export const OPSI_Q65: Record<string, number> = {
  'Jauh lebih sesuai daripada yang saya bayangkan.': 5,
  'Lebih sesuai daripada yang saya bayangkan.': 4,
  'Kurang lebih sesuai dengan ekspektasi.': 3,
  'Kurang sesuai dengan ekspektasi.': 2,
  'Sangat berbeda dari ekspektasi.': 1,
};
/** Q66: 1 = tidak pernah .. 5 = sangat sering. */
export const OPSI_Q66: Record<string, number> = {
  'Tidak pernah': 1,
  Jarang: 2,
  'Kadang-kadang': 3,
  Sering: 4,
  'Sangat sering': 5,
};

/**
 * Nilai rapor "tidak diambil / tidak ingat". Form meminta "0", tetapi responden
 * menulis "1"/"01"; keputusan tim: nilai <= 1 dianggap tidak diambil (tidak di-insert).
 */
export const BATAS_NILAI_TIDAK_DIAMBIL = 1;

/** "2026/10/15 11:05:25 AM GMT+7" -> ISO 8601. */
export function parseTimestampForm(s: string): string | null {
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2}):(\d{2}) (AM|PM) GMT([+-]\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, se, ampm, tzH, tzM] = m;
  let jam = Number(h) % 12;
  if (ampm === 'PM') jam += 12;
  const tz = `${tzH.startsWith('-') ? '-' : '+'}${String(Math.abs(Number(tzH))).padStart(2, '0')}:${tzM ?? '00'}`;
  const iso = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${String(jam).padStart(2, '0')}:${mi}:${se}${tz}`;
  return Number.isNaN(Date.parse(iso)) ? null : new Date(iso).toISOString();
}

/** Kebalikan parseTimestampForm, untuk generator (zona GMT+7). */
export function formatTimestampForm(d: Date): string {
  const wib = new Date(d.getTime() + 7 * 3600_000);
  const j = wib.getUTCHours();
  const jam12 = j % 12 === 0 ? 12 : j % 12;
  const dua = (n: number) => String(n).padStart(2, '0');
  return `${wib.getUTCFullYear()}/${dua(wib.getUTCMonth() + 1)}/${dua(wib.getUTCDate())} ${jam12}:${dua(
    wib.getUTCMinutes(),
  )}:${dua(wib.getUTCSeconds())} ${j < 12 ? 'AM' : 'PM'} GMT+7`;
}
