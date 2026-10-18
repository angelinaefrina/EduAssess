-- =====================================================================
-- Seed v2
--  Bagian A: master/instrumen, diambil dari Google Form tim (akurat
--            selama form tidak diubah).
--  Katalog prodi/karir TIDAK di-seed (data dummy dihapus); isi dari
--  sumber resmi.
-- =====================================================================

-- ===================== A. MASTER DARI SURVEI =========================

-- Q4: bidang program studi (label)
insert into bidang_studi (kode, nama) values
  ('TEK',   'Teknik dan Teknologi'),
  ('KOMP',  'Komputer dan Informatika'),
  ('KES',   'Kesehatan dan Kedokteran'),
  ('EBM',   'Ekonomi, Bisnis, dan Manajemen'),
  ('SOSPOLHUK', 'Sosial, Politik, dan Hukum'),
  ('PEND',  'Pendidikan'),
  ('SAINS', 'Sains dan Matematika'),
  ('PERT',  'Pertanian, Pangan, dan Lingkungan'),
  ('SENI',  'Seni, Desain, dan Humaniora');

-- Q53: bidang pekerjaan ("Belum memiliki gambaran" disimpan sebagai
-- flag responden.belum_ada_gambaran_karir, bukan baris di sini)
insert into bidang_karir (kode, nama) values
  ('TI',        'Teknologi Informasi dan Komputer'),
  ('REKAYASA',  'Teknik dan Rekayasa'),
  ('KESEHATAN', 'Kesehatan dan Kedokteran'),
  ('PENDIDIKAN','Pendidikan dan Pengajaran'),
  ('BISNIS',    'Bisnis dan Kewirausahaan'),
  ('KEUANGAN',  'Keuangan, Akuntansi, dan Perbankan'),
  ('HUKUM',     'Hukum dan Pemerintahan'),
  ('SOSIAL',    'Sosial dan Pelayanan Masyarakat'),
  ('MEDIA',     'Komunikasi, Media, dan Jurnalistik'),
  ('KREATIF',   'Seni, Desain, dan Industri Kreatif'),
  ('RISET',     'Sains dan Penelitian'),
  ('AGRI',      'Pertanian, Peternakan, dan Perikanan'),
  ('LINGKUNGAN','Lingkungan dan Konservasi'),
  ('PARIWISATA','Pariwisata, Perhotelan, dan Kuliner'),
  ('MANAJEMEN', 'Manajemen dan Administrasi');

-- Q12–Q23: mapel. is_pilihan/kelompok adalah perkiraan; sesuaikan
-- dengan struktur kurikulum sekolah mitra.
insert into mapel (kode, nama, is_pilihan, kelompok, nomor_survei) values
  ('MAT',  'Matematika',       false, 'Umum',      12),
  ('BIND', 'Bahasa Indonesia', false, 'Umum',      13),
  ('BING', 'Bahasa Inggris',   false, 'Umum',      14),
  ('FIS',  'Fisika',           true,  'MIPA',      15),
  ('KIM',  'Kimia',            true,  'MIPA',      16),
  ('BIO',  'Biologi',          true,  'MIPA',      17),
  ('EKO',  'Ekonomi',          true,  'IPS',       18),
  ('GEO',  'Geografi',         true,  'IPS',       19),
  ('SOS',  'Sosiologi',        true,  'IPS',       20),
  ('SEJ',  'Sejarah',          false, 'Umum',      21),
  ('SBD',  'Seni Budaya',      false, 'Umum',      22),
  ('INF',  'Informatika',      true,  'Teknologi', 23);

-- Q26–Q43: 18 butir minat, 3 per tipe RIASEC.
-- Pemetaan tipe adalah inferensi dari isi butir; konfirmasi dengan tim.
insert into riasec_butir (tipe, pernyataan, urutan, nomor_survei) values
  ('R', 'Merakit, memperbaiki, atau mencoba cara kerja suatu alat.',                         1, 26),
  ('R', 'Melakukan kegiatan praktik yang menghasilkan sesuatu secara langsung.',             2, 27),
  ('R', 'Memahami cara kerja mesin atau perangkat teknis.',                                  3, 28),
  ('I', 'Menganalisis masalah yang membutuhkan penalaran mendalam.',                         4, 29),
  ('I', 'Mencari penjelasan ilmiah mengenai suatu fenomena.',                                5, 30),
  ('I', 'Melakukan eksperimen atau penelitian untuk menemukan jawaban.',                     6, 31),
  ('A', 'Membuat karya visual, ilustrasi, atau desain.',                                     7, 32),
  ('A', 'Menulis cerita, membuat konten, atau mengekspresikan gagasan secara kreatif.',      8, 33),
  ('A', 'Mengembangkan ide baru dengan kebebasan berekspresi.',                              9, 34),
  ('S', 'Membantu orang lain memahami pelajaran atau suatu masalah.',                       10, 35),
  ('S', 'Mendengarkan dan memahami permasalahan orang lain.',                               11, 36),
  ('S', 'Melakukan kegiatan yang melibatkan interaksi dan pelayanan kepada masyarakat.',    12, 37),
  ('E', 'Mengelola bisnis atau merencanakan kegiatan usaha.',                               13, 38),
  ('E', 'Memimpin kelompok untuk mencapai suatu tujuan.',                                   14, 39),
  ('E', 'Meyakinkan atau mempresentasikan ide kepada orang lain.',                          15, 40),
  ('C', 'Mengolah angka, dokumen, atau informasi secara terstruktur.',                      16, 41),
  ('C', 'Mengatur jadwal, administrasi, atau pencatatan secara sistematis.',                17, 42),
  ('C', 'Mengerjakan tugas yang membutuhkan ketelitian dan keteraturan.',                   18, 43);

-- Q44–Q52: persepsi kemampuan diri
insert into dimensi_kemampuan (kode, pernyataan, urutan, nomor_survei) values
  ('NUMERIK',    'Kemampuan melakukan perhitungan matematika.',                          1, 44),
  ('LOGIKA',     'Kemampuan berpikir logis dan menganalisis masalah.',                   2, 45),
  ('LITERASI',   'Kemampuan memahami teks dan menyampaikan gagasan melalui tulisan.',    3, 46),
  ('KOMUNIKASI', 'Kemampuan berbicara dan berkomunikasi dengan orang lain.',             4, 47),
  ('KREATIF',    'Kemampuan menghasilkan ide kreatif.',                                  5, 48),
  ('DIGITAL',    'Kemampuan menggunakan komputer dan teknologi digital.',                6, 49),
  ('SAINS',      'Kemampuan memahami konsep sains atau melakukan eksperimen.',           7, 50),
  ('KEPEMIMPINAN','Kemampuan memimpin, bekerja sama, atau mengorganisasi kegiatan.',     8, 51),
  ('KETELITIAN', 'Kemampuan mengerjakan tugas secara teliti dan terstruktur.',           9, 52);
