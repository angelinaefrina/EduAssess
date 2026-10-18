-- =====================================================================
-- Kode BK: cara siswa terdaftar ke sekolah.
--
-- BK membuat kode lalu membagikannya ke siswa. Siswa memasukkan kode
-- saat onboarding; backend mengisi profil.sekolah_id dari kode (BUKAN
-- dari pilihan siswa), sehingga siswa muncul di dashboard BK sekolah itu.
-- Kode bisa diberi masa berlaku dan dinonaktifkan bila bocor.
-- =====================================================================

create table kode_bk (
  id              uuid primary key default gen_random_uuid(),
  kode            text not null unique check (kode = upper(kode)),  -- mis. 7KQP4M
  sekolah_id      uuid not null references sekolah(id) on delete cascade,
  dibuat_oleh     uuid references profil(id) on delete set null,
  aktif           boolean not null default true,
  berlaku_sampai  timestamptz,                                      -- null = tanpa batas
  created_at      timestamptz not null default now()
);
create index on kode_bk (sekolah_id);

alter table kode_bk enable row level security;
