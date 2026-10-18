-- =====================================================================
-- Sistem Rekomendasi Prodi & Karir SMA — skema awal (v2)
-- Target: Supabase (PostgreSQL 15+). Jalankan via `supabase db push`
-- atau tempel ke SQL Editor di dashboard Supabase.
--
-- v2: disesuaikan dengan instrumen "Survei Pengalaman Pemilihan dan
-- Kecocokan Jurusan Kuliah". Prinsip utama:
--   * Siswa (pengguna app) dan responden survei (mahasiswa) diukur
--     dengan INSTRUMEN YANG SAMA: 12 mapel, 18 butir RIASEC,
--     9 dimensi kemampuan diri, mapel favorit, bidang karir diminati.
--   * Keduanya punya view fitur berbentuk identik (v_fitur_siswa /
--     v_fitur_responden) sehingga model/algoritma rekomendasi bisa
--     membandingkan siswa dengan responden secara langsung.
--   * Data survei asli dan sintetis dipisah per batch_impor.
--
-- Konvensi:
--   * snake_case Bahasa Indonesia (selaras SRS).
--   * Semua tabel RLS ON tanpa policy -> hanya service_role (backend
--     Node.js) yang bisa akses. Otorisasi dilakukan di controller.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 0. TIPE DASAR
-- ---------------------------------------------------------------------
create domain likert5 as smallint check (value between 1 and 5);

create type peran_pengguna     as enum ('siswa', 'bk');
create type tipe_riasec        as enum ('R', 'I', 'A', 'S', 'E', 'C');
create type jenis_pendidikan   as enum ('akademik', 'vokasi', 'kedinasan', 'kerja');
create type jenjang_pendidikan as enum ('D3', 'D4', 'S1', 'kedinasan', 'langsung_kerja');
create type gaya_belajar       as enum ('praktik', 'teori', 'seimbang');
create type status_verifikasi  as enum ('menunggu', 'terverifikasi', 'ditolak');
create type sumber_nilai       as enum ('input_siswa', 'impor_bk');
create type jenis_rekomendasi  as enum ('prodi', 'mapel', 'jenis_pendidikan', 'keselarasan');

-- dipakai bersama siswa & responden (survei Q7, Q8)
create type jenis_sekolah_asal as enum ('SMA', 'MA', 'SMK', 'kesetaraan');
create type peminatan_sekolah  as enum ('IPA', 'IPS', 'Bahasa', 'Merdeka', 'SMK');

-- khusus dataset survei
create type sumber_data        as enum ('survei', 'sintetis');
create type status_pilihan_prodi as enum (            -- Q10
  'pilihan_pertama', 'bukan_pertama_diinginkan', 'ingin_jurusan_lain', 'belum_punya_pilihan');
create type riwayat_pindah     as enum (              -- Q11
  'belum', 'pernah_tidak_cocok', 'pernah_alasan_lain');
create type keandalan_nilai    as enum (              -- Q24
  'rapor', 'catatan', 'ingatan', 'tidak_mengisi');

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 1. MASTER / INSTRUMEN (dipakai app DAN dataset survei)
--    kolom nomor_survei = nomor pertanyaan di Google Form, untuk
--    memetakan kolom CSV saat impor.
-- ---------------------------------------------------------------------

-- Label utama yang diprediksi: bidang program studi (survei Q4).
-- Menggantikan "rumpun ilmu" agar label app = label dataset.
create table bidang_studi (
  id         smallint generated always as identity primary key,
  kode       text not null unique,
  nama       text not null unique,
  deskripsi  text
);

-- Bidang pekerjaan (survei Q53)
create table bidang_karir (
  id    smallint generated always as identity primary key,
  kode  text not null unique,
  nama  text not null unique
);

create table mapel (
  id            smallint generated always as identity primary key,
  kode          text not null unique,
  nama          text not null,
  is_pilihan    boolean not null default false,
  kelompok      text,
  nomor_survei  smallint unique                 -- Q12–Q23
);

create table riasec_butir (
  id            smallint generated always as identity primary key,
  tipe          tipe_riasec not null,
  pernyataan    text not null,
  urutan        smallint not null unique,
  nomor_survei  smallint unique,                -- Q26–Q43
  aktif         boolean not null default true
);

-- Persepsi kemampuan diri (survei Q44–Q52)
create table dimensi_kemampuan (
  id            smallint generated always as identity primary key,
  kode          text not null unique,
  pernyataan    text not null,
  urutan        smallint not null unique,
  nomor_survei  smallint unique
);

-- ---------------------------------------------------------------------
-- 2. AUTENTIKASI & PERAN
-- ---------------------------------------------------------------------
create table sekolah (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  npsn        text unique,
  kota        text,
  created_at  timestamptz not null default now()
);

create table profil (
  id          uuid primary key references auth.users(id) on delete cascade,
  peran       peran_pengguna not null default 'siswa',
  nama        text,
  sekolah_id  uuid references sekolah(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index on profil (sekolah_id, peran);
create trigger trg_profil_updated before update on profil
  for each row execute function set_updated_at();

-- Peran SELALU 'siswa' saat daftar; raw_user_meta_data bisa dipalsukan
-- klien. Akun BK di-set lewat seed / endpoint admin.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profil (id, nama)
  values (new.id, new.raw_user_meta_data ->> 'nama');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- 3. SISWA (pengguna app)  — UC01, F01, F02, F09
-- ---------------------------------------------------------------------
create table siswa (
  id                 uuid primary key references profil(id) on delete cascade,
  tingkat            smallint check (tingkat between 10 and 12),
  rombel             text,
  peminatan          peminatan_sekolah,         -- sama dgn survei Q8
  angkatan           smallint,
  onboarding_selesai boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on siswa (angkatan);
create index on siswa (tingkat, rombel);
create trigger trg_siswa_updated before update on siswa
  for each row execute function set_updated_at();

create table preferensi_pendidikan (
  siswa_id            uuid primary key references siswa(id) on delete cascade,
  gaya_belajar        gaya_belajar,
  ingin_cepat_kerja   boolean,
  pertimbangan_biaya  likert5,
  jenjang_diminati    jenjang_pendidikan[] not null default '{}',
  updated_at          timestamptz not null default now()
);
create trigger trg_pref_updated before update on preferensi_pendidikan
  for each row execute function set_updated_at();

create table siswa_mapel (                      -- mapel yang diambil (F01)
  siswa_id  uuid references siswa(id) on delete cascade,
  mapel_id  smallint references mapel(id) on delete restrict,
  primary key (siswa_id, mapel_id)
);

create table siswa_mapel_favorit (              -- setara survei Q25 (maks 3, divalidasi di app)
  siswa_id  uuid references siswa(id) on delete cascade,
  mapel_id  smallint references mapel(id) on delete restrict,
  primary key (siswa_id, mapel_id)
);

create table siswa_bidang_karir (               -- setara survei Q53 (maks 3)
  siswa_id         uuid references siswa(id) on delete cascade,
  bidang_karir_id  smallint references bidang_karir(id) on delete restrict,
  primary key (siswa_id, bidang_karir_id)
);

-- ---------------------------------------------------------------------
-- 4. NILAI RAPOR SISWA  — UC02, F03
-- ---------------------------------------------------------------------
create table nilai_rapor (
  id                 uuid primary key default gen_random_uuid(),
  siswa_id           uuid not null references siswa(id) on delete cascade,
  mapel_id           smallint not null references mapel(id) on delete restrict,
  semester           smallint not null check (semester between 1 and 6),
  nilai              numeric(5,2) not null check (nilai between 0 and 100),
  sumber             sumber_nilai not null default 'input_siswa',
  status             status_verifikasi not null default 'menunggu',
  diverifikasi_oleh  uuid references profil(id) on delete set null,
  diverifikasi_at    timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (siswa_id, mapel_id, semester),
  check (status <> 'terverifikasi' or diverifikasi_at is not null)
);
create index on nilai_rapor (status) where status = 'menunggu';
create trigger trg_nilai_updated before update on nilai_rapor
  for each row execute function set_updated_at();

create table nilai_tes (                        -- TKA / try-out (opsional)
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references siswa(id) on delete cascade,
  jenis_tes   text not null,
  mapel_id    smallint references mapel(id),
  skor        numeric(6,2) not null,
  tanggal     date not null default current_date,
  created_at  timestamptz not null default now()
);
create index on nilai_tes (siswa_id);

-- ---------------------------------------------------------------------
-- 5. KATALOG  — UC04, UC05, UC09, F05–F08, F16
-- ---------------------------------------------------------------------
create table prodi (
  id                uuid primary key default gen_random_uuid(),
  bidang_studi_id   smallint not null references bidang_studi(id) on delete restrict,
  nama              text not null,
  deskripsi         text,
  kode_riasec       text check (kode_riasec ~ '^[RIASEC]{1,3}$'),
  jenis_pendidikan  jenis_pendidikan[] not null default '{akademik}',
  sumber_url        text,
  unique (bidang_studi_id, nama)
);
create index on prodi (bidang_studi_id);

create table prodi_mapel (                      -- mapel pendukung + bobot
  prodi_id  uuid references prodi(id) on delete cascade,
  mapel_id  smallint references mapel(id) on delete restrict,
  bobot     numeric(3,2) not null default 1.0 check (bobot > 0),
  primary key (prodi_id, mapel_id)
);

create table perguruan_tinggi (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null unique,
  jenis       jenis_pendidikan not null default 'akademik',
  kota        text,
  situs_url   text
);

create table prodi_pt (
  prodi_id    uuid references prodi(id) on delete cascade,
  pt_id       uuid references perguruan_tinggi(id) on delete cascade,
  jenjang     jenjang_pendidikan not null,
  sumber_url  text,
  primary key (prodi_id, pt_id, jenjang)
);

create table karir (
  id               uuid primary key default gen_random_uuid(),
  bidang_karir_id  smallint references bidang_karir(id) on delete set null,
  nama             text not null unique,
  deskripsi        text,
  kode_riasec      text check (kode_riasec ~ '^[RIASEC]{1,3}$'),
  is_trending      boolean not null default false,
  sumber_url       text
);
create index on karir (bidang_karir_id);

create table karir_prodi (
  karir_id  uuid references karir(id) on delete cascade,
  prodi_id  uuid references prodi(id) on delete cascade,
  primary key (karir_id, prodi_id)
);
create index on karir_prodi (prodi_id);

-- ---------------------------------------------------------------------
-- 6. DATASET SURVEI (responden mahasiswa, asli & sintetis)
-- ---------------------------------------------------------------------
create table batch_impor (
  id            uuid primary key default gen_random_uuid(),
  sumber        sumber_data not null,
  nama_file     text,
  keterangan    text,
  parameter     jsonb,          -- sintetis: metode, seed acak, batch asal, dsb.
  dibuat_dari   uuid references batch_impor(id),   -- sintetis -> batch survei asal
  created_at    timestamptz not null default now()
);

create table responden (
  id                       uuid primary key default gen_random_uuid(),
  batch_id                 uuid not null references batch_impor(id) on delete cascade,
  dicatat_at               timestamptz,                 -- kolom Timestamp Google Form

  -- Q1–Q2: hanya baris yang setuju & ≥18 th yang boleh masuk
  persetujuan              boolean not null check (persetujuan),
  usia_min_18              boolean not null check (usia_min_18),

  -- Informasi akademik (LABEL & konteks)
  jenjang                  jenjang_pendidikan not null
                             check (jenjang in ('D3','D4','S1','kedinasan')),  -- Q3
  bidang_studi_id          smallint not null references bidang_studi(id),    -- Q4 (label)
  prodi_teks               text not null,                                     -- Q5 mentah
  prodi_id                 uuid references prodi(id) on delete set null,      -- Q5 setelah dinormalisasi
  semester                 smallint check (semester between 1 and 9),         -- Q6; 9 = ">8"
  jenis_sekolah            jenis_sekolah_asal not null,                       -- Q7
  peminatan                peminatan_sekolah not null,                        -- Q8
  tahun_lulus              smallint,                    -- Q9; 2019 = "<2020", 2027 = ">2026"
  status_pilihan           status_pilihan_prodi not null,                     -- Q10
  riwayat_pindah           riwayat_pindah not null,                           -- Q11
  keandalan_nilai          keandalan_nilai not null,                          -- Q24
  mapel_favorit_lain       text,                                              -- Q25 "Other"
  belum_ada_gambaran_karir boolean not null default false,                    -- Q53 opsi terakhir

  -- Pengalaman memilih jurusan (Q54–Q63) — analisis kebutuhan
  yakin_pilihan            likert5,                     -- Q54
  paham_matkul             likert5,                     -- Q55
  paham_kemampuan_prodi    likert5,                     -- Q56
  sumber_informasi         text[] not null default '{}',-- Q57
  faktor_keputusan         text[] not null default '{}',-- Q58
  kesulitan                text[] not null default '{}',-- Q59
  tes_minat                text,                        -- Q60 (label opsi apa adanya)
  bimbingan_bk             text,                        -- Q61
  membandingkan_jurusan    text,                        -- Q62
  info_cukup               likert5,                     -- Q63

  -- Kecocokan setelah kuliah (Q64 grid, Q65–Q68) — LABEL KECOCOKAN
  fit_minat                likert5 not null,
  fit_kemampuan            likert5 not null,
  fit_menikmati_materi     likert5 not null,
  fit_puas                 likert5 not null,
  fit_tujuan_karier        likert5 not null,
  fit_termotivasi          likert5 not null,
  fit_yakin_lulus          likert5 not null,
  fit_pilih_ulang_sama     likert5 not null,
  kesesuaian_ekspektasi    likert5,                     -- Q65: 5 = jauh lebih sesuai .. 1 = sangat berbeda
  frekuensi_ingin_pindah   likert5,                     -- Q66: 1 = tidak pernah .. 5 = sangat sering
  tantangan                text[] not null default '{}',-- Q67
  ipk                      numeric(3,2) check (ipk between 0 and 4),          -- Q68

  -- Kebutuhan sistem (Q69–Q75)
  butuh_bantuan            likert5,                     -- Q69
  kemungkinan_pakai        likert5,                     -- Q70
  fitur_berguna            text[] not null default '{}',-- Q71
  kepercayaan_ai           likert5,                     -- Q72
  kekhawatiran_ai          text[] not null default '{}',-- Q73
  hal_penting_diketahui    text,                        -- Q74
  saran                    text,                        -- Q75

  created_at               timestamptz not null default now()
);
create index on responden (batch_id);
create index on responden (bidang_studi_id);

-- Q12–Q23. Nilai "0" di form = tidak diambil / tidak ingat -> JANGAN
-- disimpan (baris tidak dibuat), supaya tidak terbaca sebagai nilai 0.
create table responden_nilai (
  responden_id  uuid references responden(id) on delete cascade,
  mapel_id      smallint references mapel(id) on delete restrict,
  nilai         numeric(5,2) not null check (nilai > 0 and nilai <= 100),
  primary key (responden_id, mapel_id)
);

create table responden_mapel_favorit (          -- Q25
  responden_id  uuid references responden(id) on delete cascade,
  mapel_id      smallint references mapel(id) on delete restrict,
  primary key (responden_id, mapel_id)
);

create table responden_bidang_karir (           -- Q53
  responden_id     uuid references responden(id) on delete cascade,
  bidang_karir_id  smallint references bidang_karir(id) on delete restrict,
  primary key (responden_id, bidang_karir_id)
);

-- ---------------------------------------------------------------------
-- 7. ASESMEN MINAT & KEMAMPUAN (dipakai siswa DAN responden)
--    Satu tabel agar skor RIASEC dihitung dengan rumus yang sama.
--    Siswa bisa punya banyak asesmen (riwayat UC12); responden satu.
-- ---------------------------------------------------------------------
create table asesmen (
  id            uuid primary key default gen_random_uuid(),
  siswa_id      uuid references siswa(id) on delete cascade,
  responden_id  uuid references responden(id) on delete cascade,
  semester      smallint check (semester between 1 and 6),   -- utk siswa
  mulai_at      timestamptz not null default now(),
  selesai_at    timestamptz,
  check (num_nonnulls(siswa_id, responden_id) = 1)
);
create index on asesmen (siswa_id, selesai_at desc) where siswa_id is not null;
create unique index on asesmen (responden_id) where responden_id is not null;

create table asesmen_riasec (                   -- Q26–Q43
  asesmen_id  uuid references asesmen(id) on delete cascade,
  butir_id    smallint references riasec_butir(id) on delete restrict,
  skor        likert5 not null,
  primary key (asesmen_id, butir_id)
);

create table asesmen_kemampuan (                -- Q44–Q52
  asesmen_id  uuid references asesmen(id) on delete cascade,
  dimensi_id  smallint references dimensi_kemampuan(id) on delete restrict,
  skor        likert5 not null,
  primary key (asesmen_id, dimensi_id)
);

-- ---------------------------------------------------------------------
-- 8. TARGET SISWA, HASIL REKOMENDASI, KONSELING
-- ---------------------------------------------------------------------
create table target_siswa (
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references siswa(id) on delete cascade,
  prodi_id    uuid references prodi(id) on delete cascade,
  karir_id    uuid references karir(id) on delete cascade,
  teks_bebas  text,
  is_utama    boolean not null default false,
  created_at  timestamptz not null default now(),
  check (num_nonnulls(prodi_id, karir_id, teks_bebas) = 1)
);
create unique index on target_siswa (siswa_id, prodi_id) where prodi_id is not null;
create unique index on target_siswa (siswa_id, karir_id) where karir_id is not null;
create unique index uq_target_utama on target_siswa (siswa_id)
  where is_utama and prodi_id is not null;

-- Cache hasil + penjelasan LLM. input_hash berubah -> hitung ulang.
create table hasil_rekomendasi (
  id            uuid primary key default gen_random_uuid(),
  siswa_id      uuid not null references siswa(id) on delete cascade,
  jenis         jenis_rekomendasi not null,
  input_hash    text not null,
  hasil         jsonb not null,
  penjelasan    text,
  model_llm     text,
  versi_algo    text not null default 'v1',
  created_at    timestamptz not null default now(),
  unique (siswa_id, jenis, input_hash)
);
create index on hasil_rekomendasi (siswa_id, jenis, created_at desc);

create table catatan_konseling (
  id            uuid primary key default gen_random_uuid(),
  siswa_id      uuid not null references siswa(id) on delete cascade,
  bk_id         uuid references profil(id) on delete set null,
  isi           text not null,
  tindak_lanjut text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on catatan_konseling (siswa_id, created_at desc);
create trigger trg_catatan_updated before update on catatan_konseling
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- 9. VIEW: skor asesmen (satu rumus untuk siswa & responden)
-- ---------------------------------------------------------------------
-- Skor tiap tipe = rata-rata 3 butir (skala 1–5).
-- kode_holland = 3 tipe skor tertinggi; seri dipecah urutan R-I-A-S-E-C
-- (keputusan arbitrer, ubah bila tim punya aturan lain).
create view v_profil_asesmen as
with skor_tipe as (
  select a.asesmen_id, b.tipe, avg(a.skor)::numeric(4,2) as skor
  from asesmen_riasec a
  join riasec_butir b on b.id = a.butir_id
  group by a.asesmen_id, b.tipe
),
ranked as (
  select *, row_number() over (partition by asesmen_id order by skor desc, tipe) as rn
  from skor_tipe
),
riasec as (
  select asesmen_id,
         jsonb_object_agg(tipe, skor) as riasec,
         string_agg(tipe::text, '' order by rn) filter (where rn <= 3) as kode_holland
  from ranked group by asesmen_id
),
kemampuan as (
  select k.asesmen_id, jsonb_object_agg(d.kode, k.skor) as kemampuan
  from asesmen_kemampuan k join dimensi_kemampuan d on d.id = k.dimensi_id
  group by k.asesmen_id
)
select a.id as asesmen_id, a.siswa_id, a.responden_id, a.selesai_at,
       r.riasec, r.kode_holland, k.kemampuan
from asesmen a
left join riasec    r on r.asesmen_id = a.id
left join kemampuan k on k.asesmen_id = a.id;

-- Asesmen selesai terakhir per siswa
create view v_asesmen_terakhir_siswa as
select distinct on (siswa_id) *
from v_profil_asesmen
where siswa_id is not null and selesai_at is not null
order by siswa_id, selesai_at desc;

-- ---------------------------------------------------------------------
-- 10. VIEW: label kecocokan & vektor fitur (bentuk identik)
-- ---------------------------------------------------------------------
-- Ambang "cocok" (rata-rata >= 4 dan tidak pernah pindah karena tidak
-- cocok) adalah TITIK AWAL, bukan standar baku. Sepakati dengan tim.
create view v_label_responden as
select r.id as responden_id,
       round((r.fit_minat + r.fit_kemampuan + r.fit_menikmati_materi + r.fit_puas
            + r.fit_tujuan_karier + r.fit_termotivasi + r.fit_yakin_lulus
            + r.fit_pilih_ulang_sama) / 8.0, 2) as skor_kecocokan,
       ((r.fit_minat + r.fit_kemampuan + r.fit_menikmati_materi + r.fit_puas
       + r.fit_tujuan_karier + r.fit_termotivasi + r.fit_yakin_lulus
       + r.fit_pilih_ulang_sama) / 8.0 >= 4
        and r.riwayat_pindah <> 'pernah_tidak_cocok') as cocok
from responden r;

create view v_fitur_responden as
select r.id as responden_id,
       b.sumber as sumber_data,
       r.batch_id,
       r.peminatan,
       r.keandalan_nilai,
       (select jsonb_object_agg(m.kode, n.nilai)
          from responden_nilai n join mapel m on m.id = n.mapel_id
         where n.responden_id = r.id)                            as nilai,
       pa.riasec, pa.kode_holland, pa.kemampuan,
       array(select m.kode from responden_mapel_favorit f join mapel m on m.id = f.mapel_id
              where f.responden_id = r.id order by m.kode)       as mapel_favorit,
       array(select bk.kode from responden_bidang_karir x join bidang_karir bk on bk.id = x.bidang_karir_id
              where x.responden_id = r.id order by bk.kode)      as bidang_karir,
       -- label
       bs.kode as bidang_studi, r.jenjang, r.prodi_id,
       l.skor_kecocokan, l.cocok, r.ipk
from responden r
join batch_impor b        on b.id = r.batch_id
join bidang_studi bs      on bs.id = r.bidang_studi_id
join v_label_responden l  on l.responden_id = r.id
left join v_profil_asesmen pa on pa.responden_id = r.id;

-- Nilai siswa: semester TERAKHIR yang tersedia per mapel, selaras
-- dengan petunjuk survei ("semester terakhir yang tersedia").
create view v_fitur_siswa as
select s.id as siswa_id,
       s.peminatan,
       (select jsonb_object_agg(kode, nilai) from (
          select distinct on (n.mapel_id) m.kode, n.nilai
          from nilai_rapor n join mapel m on m.id = n.mapel_id
          where n.siswa_id = s.id and n.status <> 'ditolak'
          order by n.mapel_id, n.semester desc) x)               as nilai,
       pa.riasec, pa.kode_holland, pa.kemampuan,
       array(select m.kode from siswa_mapel_favorit f join mapel m on m.id = f.mapel_id
              where f.siswa_id = s.id order by m.kode)           as mapel_favorit,
       array(select bk.kode from siswa_bidang_karir x join bidang_karir bk on bk.id = x.bidang_karir_id
              where x.siswa_id = s.id order by bk.kode)          as bidang_karir
from siswa s
left join v_asesmen_terakhir_siswa pa on pa.siswa_id = s.id;

-- ---------------------------------------------------------------------
-- 11. VIEW: dashboard BK & ringkasan angkatan (UC10, UC13)
-- ---------------------------------------------------------------------
create view v_status_siswa as
select
  s.id as siswa_id, p.nama, p.sekolah_id,
  s.tingkat, s.rombel, s.angkatan,
  a.kode_holland,
  (a.asesmen_id is null)        as belum_asesmen,
  not exists (select 1 from nilai_rapor n where n.siswa_id = s.id) as belum_isi_nilai,
  exists (select 1 from nilai_rapor n where n.siswa_id = s.id and n.status = 'menunggu') as ada_nilai_menunggu,
  not s.onboarding_selesai      as profil_belum_lengkap,
  k.hasil ->> 'status'          as status_keselarasan   -- 'selaras' | 'tidak_selaras' | 'berisiko'
from siswa s
join profil p on p.id = s.id
left join v_asesmen_terakhir_siswa a on a.siswa_id = s.id
left join lateral (
  select hasil from hasil_rekomendasi h
  where h.siswa_id = s.id and h.jenis = 'keselarasan'
  order by h.created_at desc limit 1
) k on true;

create view v_ringkasan_minat_angkatan as
select p.sekolah_id, s.angkatan, left(a.kode_holland, 1) as tipe_dominan, count(*) as jumlah
from v_asesmen_terakhir_siswa a
join siswa s  on s.id = a.siswa_id
join profil p on p.id = s.id
group by 1, 2, 3;

create view v_ringkasan_bidang_angkatan as
select p.sekolah_id, s.angkatan, bs.nama as bidang_studi, count(*) as jumlah
from target_siswa t
join prodi pr        on pr.id = t.prodi_id
join bidang_studi bs on bs.id = pr.bidang_studi_id
join siswa s         on s.id = t.siswa_id
join profil p        on p.id = s.id
where t.is_utama
group by 1, 2, 3;

create view v_ringkasan_mapel_angkatan as
select p.sekolah_id, s.angkatan, m.nama as mapel, count(*) as jumlah
from siswa_mapel sm
join mapel m  on m.id = sm.mapel_id and m.is_pilihan
join siswa s  on s.id = sm.siswa_id
join profil p on p.id = s.id
group by 1, 2, 3;

do $$
declare v text;
begin
  for v in select viewname from pg_views where schemaname = 'public' loop
    execute format('alter view public.%I set (security_invoker = on)', v);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY: aktif tanpa policy (hanya service_role).
--     Jangan pernah kirim service role key ke frontend Next.js.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
