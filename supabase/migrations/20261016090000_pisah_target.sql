-- =====================================================================
-- Memisah target_siswa menjadi target_karir dan target_prodi.
--
-- Alasan: kedua target punya PERAN berbeda.
--   * target_karir  = INPUT rekomendasi (opsional). Sama dengan
--                     "karir impian" di UC05 (SRS: "target karir / karir impian").
--   * target_prodi  = PILIHAN siswa (dari rekomendasi UC04, eksplorasi UC05,
--                     katalog UC09). TIDAK memengaruhi rekomendasi; dipakai
--                     analisis keselarasan (UC08) dan dashboard BK.
-- Siswa boleh punya nol, satu, atau banyak dari masing-masing.
-- =====================================================================

create type sumber_target as enum ('onboarding', 'eksplorasi_karir', 'rekomendasi', 'katalog');

create table target_karir (
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references siswa(id) on delete cascade,
  karir_id    uuid references karir(id) on delete cascade,
  teks_bebas  text,                 -- hanya jika karir belum ada di katalog (onboarding)
  sumber      sumber_target not null,
  created_at  timestamptz not null default now(),
  check (num_nonnulls(karir_id, nullif(btrim(teks_bebas), '')) = 1)
);
create unique index on target_karir (siswa_id, karir_id) where karir_id is not null;
create index on target_karir (siswa_id);

create table target_prodi (
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references siswa(id) on delete cascade,
  prodi_id    uuid not null references prodi(id) on delete cascade,
  is_utama    boolean not null default false,   -- yang dianalisis di UC08
  sumber      sumber_target not null,
  created_at  timestamptz not null default now(),
  unique (siswa_id, prodi_id)
);
create unique index uq_target_prodi_utama on target_prodi (siswa_id) where is_utama;

-- Pindahkan data lama (jika ada), lalu hapus tabel lama.
insert into target_karir (siswa_id, karir_id, teks_bebas, sumber, created_at)
select siswa_id, karir_id, teks_bebas, 'onboarding', created_at
from target_siswa where prodi_id is null;

insert into target_prodi (siswa_id, prodi_id, is_utama, sumber, created_at)
select siswa_id, prodi_id, is_utama, 'katalog', created_at
from target_siswa where prodi_id is not null;

drop view v_ringkasan_bidang_angkatan;
drop table target_siswa;

-- UC13: distribusi bidang studi dari target prodi utama
create view v_ringkasan_bidang_angkatan as
select p.sekolah_id, s.angkatan, bs.nama as bidang_studi, count(*) as jumlah
from target_prodi t
join prodi pr        on pr.id = t.prodi_id
join bidang_studi bs on bs.id = pr.bidang_studi_id
join siswa s         on s.id = t.siswa_id
join profil p        on p.id = s.id
where t.is_utama
group by 1, 2, 3;

-- UC13: distribusi bidang karir dari target karir (SRS: "target jurusan / target karir")
create view v_ringkasan_karir_angkatan as
select p.sekolah_id, s.angkatan, bk.nama as bidang_karir, count(distinct t.siswa_id) as jumlah
from target_karir t
join karir k         on k.id = t.karir_id
join bidang_karir bk on bk.id = k.bidang_karir_id
join siswa s         on s.id = t.siswa_id
join profil p        on p.id = s.id
group by 1, 2, 3;

alter view v_ringkasan_bidang_angkatan set (security_invoker = on);
alter view v_ringkasan_karir_angkatan  set (security_invoker = on);

alter table target_karir enable row level security;
alter table target_prodi enable row level security;
