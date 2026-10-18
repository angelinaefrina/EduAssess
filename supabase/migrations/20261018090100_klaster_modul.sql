-- =====================================================================
-- Fitur Guru Pengajar: klaster siswa (F17, UC15), katalog modul
-- pembelajaran (F19, UC17), dan rekomendasi modul (F18, UC16).
--
-- Alur:
--   1. Guru menjalankan pengelompokan (basis + cakupan + jumlah klaster)
--      -> satu baris klaster_run. Fitur tiap siswa diambil dari
--      v_fitur_siswa dan disalin ke klaster_anggota.fitur agar hasil dan
--      penjelasannya (F11/XAI) tetap bisa ditelusuri walau data berubah.
--   2. Tiap run menghasilkan N baris klaster beserta karakteristiknya
--      (RIASEC dominan, mapel menonjol/lemah) dan penjelasan LLM.
--   3. Rekomendasi modul dibuat per klaster atau per siswa dalam satu run,
--      bersumber dari modul_pembelajaran.
--
-- Pemindahan manual siswa antar klaster (UC15 alt. 3) tercatat di
-- klaster_anggota (is_manual, klaster_asal_id, dipindah_oleh).
-- =====================================================================

create type basis_klaster as enum ('minat', 'akademik', 'gabungan');

-- Catatan konseling (F13) kini juga ditulis guru; nama kolom bk_id
-- dipertahankan agar backend tidak rusak, isinya = profil penulis.
comment on column catatan_konseling.bk_id is 'Penulis catatan: profil BK atau guru pengajar.';

-- ---------------------------------------------------------------------
-- 1. KLASTER SISWA  — UC15, F17
-- ---------------------------------------------------------------------
create table klaster_run (
  id              uuid primary key default gen_random_uuid(),
  sekolah_id      uuid not null references sekolah(id) on delete cascade,
  dibuat_oleh     uuid references profil(id) on delete set null,
  basis           basis_klaster not null,
  -- Cakupan: satu angkatan (wajib) dan opsional satu kelas (tingkat+rombel).
  angkatan        smallint not null,
  tingkat         smallint check (tingkat between 10 and 12),
  rombel          text,
  jumlah_klaster  smallint not null check (jumlah_klaster between 2 and 10),
  algoritma       text not null default 'kmeans',
  parameter       jsonb,          -- seed acak, normalisasi, bobot fitur, dsb.
  versi_algo      text not null default 'v1',
  -- Siswa dalam cakupan yang tidak ikut karena data belum lengkap (UC15 alt. 1).
  jumlah_dilewati integer not null default 0,
  created_at      timestamptz not null default now(),
  check (rombel is null or tingkat is not null)
);
-- "Hasil pengelompokan terakhir" (UC16) per guru / per sekolah
create index on klaster_run (dibuat_oleh, created_at desc);
create index on klaster_run (sekolah_id, angkatan, created_at desc);

create table klaster (
  id             uuid primary key default gen_random_uuid(),
  run_id         uuid not null references klaster_run(id) on delete cascade,
  urutan         smallint not null,
  label          text not null,          -- mis. "Investigatif–kuat MIPA"
  centroid       jsonb,
  -- { riasec_dominan: ["I","R"], rata_riasec: {...}, rata_nilai: {...},
  --   mapel_menonjol: [...], mapel_lemah: [...] }
  karakteristik  jsonb not null default '{}',
  penjelasan     text,                    -- LLM, hanya dari karakteristik (F11)
  model_llm      text,
  unique (run_id, urutan),
  unique (run_id, id)                     -- target FK komposit di bawah
);

create table klaster_anggota (
  run_id          uuid not null references klaster_run(id) on delete cascade,
  siswa_id        uuid not null references siswa(id) on delete cascade,
  klaster_id      uuid not null,
  fitur           jsonb,                  -- salinan vektor fitur saat run
  jarak_centroid  numeric(8,4),
  is_manual       boolean not null default false,
  klaster_asal_id uuid,                   -- klaster hasil algoritma sebelum dipindah
  dipindah_oleh   uuid references profil(id) on delete set null,
  dipindah_at     timestamptz,
  primary key (run_id, siswa_id),         -- satu siswa = satu klaster per run
  foreign key (run_id, klaster_id)      references klaster (run_id, id) on delete cascade,
  foreign key (run_id, klaster_asal_id) references klaster (run_id, id) on delete set null (klaster_asal_id),
  -- klaster_asal_id sengaja tidak diwajibkan: bisa jadi null lewat FK
  -- "set null" saat klaster asal terhapus (cascade dari klaster_run).
  check (not is_manual or dipindah_at is not null)
);
create index on klaster_anggota (klaster_id);
create index on klaster_anggota (siswa_id);

-- ---------------------------------------------------------------------
-- 2. KATALOG MODUL PEMBELAJARAN  — UC17, F19
-- ---------------------------------------------------------------------
create table modul_pembelajaran (
  id           uuid primary key default gen_random_uuid(),
  sekolah_id   uuid not null references sekolah(id) on delete cascade,
  dibuat_oleh  uuid references profil(id) on delete set null,
  judul        text not null check (btrim(judul) <> ''),
  mapel_id     smallint not null references mapel(id) on delete restrict,
  tingkat      smallint not null check (tingkat between 10 and 12),
  topik        text[] not null default '{}',
  deskripsi    text,
  -- Opsional: cocok untuk gaya minat tertentu (dipakai mencocokkan
  -- dengan RIASEC dominan klaster).
  tipe_riasec  tipe_riasec[] not null default '{}',
  tautan_url   text,
  berkas_path  text,          -- path objek di bucket storage 'modul-pembelajaran'
  aktif        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (num_nonnulls(nullif(btrim(tautan_url), ''), nullif(btrim(berkas_path), '')) >= 1)
);
create index on modul_pembelajaran (sekolah_id, mapel_id, tingkat) where aktif;
create trigger trg_modul_updated before update on modul_pembelajaran
  for each row execute function set_updated_at();

-- Berkas modul: bucket privat, diakses backend (service_role) / signed URL.
insert into storage.buckets (id, name, public)
values ('modul-pembelajaran', 'modul-pembelajaran', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 3. REKOMENDASI MODUL  — UC16, F18
--    Per klaster (klaster_id) ATAU per siswa dalam klaster (siswa_id),
--    selalu terikat ke satu run agar ikut terhapus/diganti saat
--    pengelompokan diulang.
-- ---------------------------------------------------------------------
create table rekomendasi_modul (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references klaster_run(id) on delete cascade,
  klaster_id  uuid,
  siswa_id    uuid,
  modul_id    uuid not null references modul_pembelajaran(id) on delete cascade,
  peringkat   smallint not null,
  skor        numeric(5,4) not null,
  -- Komponen skor untuk penjelasan (F11), mis.
  -- { mapel_kesenjangan: "FIS", selisih: -8.5, cocok_riasec: ["I"], tingkat_sesuai: true }
  alasan      jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  check (num_nonnulls(klaster_id, siswa_id) = 1),
  foreign key (run_id, klaster_id) references klaster (run_id, id) on delete cascade,
  foreign key (run_id, siswa_id)   references klaster_anggota (run_id, siswa_id) on delete cascade
);
create unique index on rekomendasi_modul (klaster_id, modul_id) where klaster_id is not null;
create unique index on rekomendasi_modul (run_id, siswa_id, modul_id) where siswa_id is not null;
create index on rekomendasi_modul (modul_id);

-- ---------------------------------------------------------------------
-- 4. RLS: aktif tanpa policy (hanya service_role), sama seperti tabel lain.
-- ---------------------------------------------------------------------
alter table klaster_run        enable row level security;
alter table klaster            enable row level security;
alter table klaster_anggota    enable row level security;
alter table modul_pembelajaran enable row level security;
alter table rekomendasi_modul  enable row level security;
