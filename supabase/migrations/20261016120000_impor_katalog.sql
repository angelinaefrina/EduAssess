-- =====================================================================
-- Impor katalog prodi & karir (scripts/impor-katalog.ts).
--
-- 1. catatan_sumber: asal kode_riasec, bobot mapel, & status trending.
--    Baris yang belum diverifikasi ditandai di sini (mis. "DRAF ... BELUM
--    diverifikasi") agar tidak tampil seolah data resmi.
-- 2. impor_katalog(p): satu panggilan RPC = satu transaksi. Bila ada satu
--    kesalahan, seluruh perubahan dibatalkan. Prodi/karir/PT dicocokkan
--    berdasarkan NAMA; relasi milik prodi/karir di payload diganti total;
--    data di DB yang tidak ada di payload tidak dihapus.
--    Bentuk p: { prodi:[{nama,bidang,jenis[],riasec,deskripsi,sumber_url,catatan_sumber}],
--                prodiMapel:[{prodi,mapel,bobot}], karir:[{nama,bidang,riasec,trending,
--                deskripsi,sumber_url,catatan_sumber}], karirProdi:[{karir,prodi}],
--                pt:[{nama,jenis,kota,situs_url}], prodiPt:[{prodi,pt,jenjang,sumber_url}] }
--    (bidang/mapel berupa KODE, mis. "KOMP", "MAT").
-- =====================================================================

alter table prodi add column catatan_sumber text;
alter table karir add column catatan_sumber text;

create or replace function impor_katalog(p jsonb) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  x          jsonb;
  v_id       uuid;
  v_ids      uuid[];
  v_baru     boolean;
  hilang     text[];
  prodi_ids  uuid[] := '{}';
  karir_ids  uuid[] := '{}';
  pt_ids     uuid[] := '{}';
  n_prodi_baru int := 0; n_prodi_ubah int := 0;
  n_karir_baru int := 0; n_karir_ubah int := 0;
  n_pt_baru    int := 0; n_pt_ubah    int := 0;
  n_relasi     int;
begin
  -- Kode master harus sudah ada (seed.sql).
  select array_agg(distinct k order by k) into hilang from (
    select 'bidang_studi ' || (e->>'bidang') as k
      from jsonb_array_elements(coalesce(p->'prodi', '[]')) e
     where not exists (select 1 from bidang_studi b where b.kode = e->>'bidang')
    union all
    select 'bidang_karir ' || (e->>'bidang')
      from jsonb_array_elements(coalesce(p->'karir', '[]')) e
     where e->>'bidang' is not null
       and not exists (select 1 from bidang_karir b where b.kode = e->>'bidang')
    union all
    select 'mapel ' || (e->>'mapel')
      from jsonb_array_elements(coalesce(p->'prodiMapel', '[]')) e
     where not exists (select 1 from mapel m where m.kode = e->>'mapel')
  ) s;
  if hilang is not null then
    raise exception 'Kode berikut belum ada di database (jalankan seed.sql?): %', array_to_string(hilang, ', ');
  end if;

  -- prodi: cocokkan nama tanpa memedulikan huruf besar/kecil
  for x in select * from jsonb_array_elements(coalesce(p->'prodi', '[]')) loop
    select array_agg(id) into v_ids from prodi where lower(nama) = lower(x->>'nama');
    if coalesce(array_length(v_ids, 1), 0) > 1 then
      raise exception 'Ada % prodi bernama "%" di database; rapikan manual dulu.', array_length(v_ids, 1), x->>'nama';
    end if;
    if v_ids is not null then
      v_id := v_ids[1];
      update prodi set
        nama = x->>'nama',
        bidang_studi_id = (select id from bidang_studi where kode = x->>'bidang'),
        jenis_pendidikan = array(select jsonb_array_elements_text(x->'jenis'))::jenis_pendidikan[],
        kode_riasec = x->>'riasec',
        deskripsi = x->>'deskripsi',
        sumber_url = x->>'sumber_url',
        catatan_sumber = x->>'catatan_sumber'
      where id = v_id;
      n_prodi_ubah := n_prodi_ubah + 1;
    else
      insert into prodi (nama, bidang_studi_id, jenis_pendidikan, kode_riasec, deskripsi, sumber_url, catatan_sumber)
      values (x->>'nama', (select id from bidang_studi where kode = x->>'bidang'),
              array(select jsonb_array_elements_text(x->'jenis'))::jenis_pendidikan[],
              x->>'riasec', x->>'deskripsi', x->>'sumber_url', x->>'catatan_sumber')
      returning id into v_id;
      n_prodi_baru := n_prodi_baru + 1;
    end if;
    prodi_ids := prodi_ids || v_id;
  end loop;

  for x in select * from jsonb_array_elements(coalesce(p->'karir', '[]')) loop
    insert into karir (nama, bidang_karir_id, kode_riasec, is_trending, deskripsi, sumber_url, catatan_sumber)
    values (x->>'nama', (select id from bidang_karir where kode = x->>'bidang'), x->>'riasec',
            coalesce((x->>'trending')::boolean, false), x->>'deskripsi', x->>'sumber_url', x->>'catatan_sumber')
    on conflict (nama) do update set
      bidang_karir_id = excluded.bidang_karir_id, kode_riasec = excluded.kode_riasec,
      is_trending = excluded.is_trending, deskripsi = excluded.deskripsi,
      sumber_url = excluded.sumber_url, catatan_sumber = excluded.catatan_sumber
    returning id, (xmax = 0) into v_id, v_baru;
    if v_baru then n_karir_baru := n_karir_baru + 1; else n_karir_ubah := n_karir_ubah + 1; end if;
    karir_ids := karir_ids || v_id;
  end loop;

  for x in select * from jsonb_array_elements(coalesce(p->'pt', '[]')) loop
    insert into perguruan_tinggi (nama, jenis, kota, situs_url)
    values (x->>'nama', (x->>'jenis')::jenis_pendidikan, x->>'kota', x->>'situs_url')
    on conflict (nama) do update set jenis = excluded.jenis, kota = excluded.kota, situs_url = excluded.situs_url
    returning id, (xmax = 0) into v_id, v_baru;
    if v_baru then n_pt_baru := n_pt_baru + 1; else n_pt_ubah := n_pt_ubah + 1; end if;
    pt_ids := pt_ids || v_id;
  end loop;

  -- Relasi: ganti total untuk prodi/karir yang ada di payload.
  delete from prodi_mapel where prodi_id = any(prodi_ids);
  delete from prodi_pt    where prodi_id = any(prodi_ids);
  delete from karir_prodi where karir_id = any(karir_ids);

  insert into prodi_mapel (prodi_id, mapel_id, bobot)
  select pr.id, m.id, (e->>'bobot')::numeric
    from jsonb_array_elements(coalesce(p->'prodiMapel', '[]')) e
    join prodi pr on lower(pr.nama) = lower(e->>'prodi') and pr.id = any(prodi_ids)
    join mapel m  on m.kode = e->>'mapel';
  get diagnostics n_relasi = row_count;
  if n_relasi <> jsonb_array_length(coalesce(p->'prodiMapel', '[]')) then
    raise exception 'prodi_mapel: % dari % baris tidak cocok dengan prodi di payload',
      jsonb_array_length(coalesce(p->'prodiMapel', '[]')) - n_relasi, jsonb_array_length(coalesce(p->'prodiMapel', '[]'));
  end if;

  insert into karir_prodi (karir_id, prodi_id)
  select k.id, pr.id
    from jsonb_array_elements(coalesce(p->'karirProdi', '[]')) e
    join karir k  on lower(k.nama)  = lower(e->>'karir') and k.id  = any(karir_ids)
    join prodi pr on lower(pr.nama) = lower(e->>'prodi') and pr.id = any(prodi_ids)
  on conflict do nothing;
  get diagnostics n_relasi = row_count;
  if n_relasi <> jsonb_array_length(coalesce(p->'karirProdi', '[]')) then
    raise exception 'karir_prodi: % dari % baris tidak cocok dengan karir/prodi di payload',
      jsonb_array_length(coalesce(p->'karirProdi', '[]')) - n_relasi, jsonb_array_length(coalesce(p->'karirProdi', '[]'));
  end if;

  insert into prodi_pt (prodi_id, pt_id, jenjang, sumber_url)
  select pr.id, t.id, (e->>'jenjang')::jenjang_pendidikan, e->>'sumber_url'
    from jsonb_array_elements(coalesce(p->'prodiPt', '[]')) e
    join prodi pr           on lower(pr.nama) = lower(e->>'prodi') and pr.id = any(prodi_ids)
    join perguruan_tinggi t on lower(t.nama)  = lower(e->>'pt')    and t.id  = any(pt_ids);
  get diagnostics n_relasi = row_count;
  if n_relasi <> jsonb_array_length(coalesce(p->'prodiPt', '[]')) then
    raise exception 'prodi_pt: % dari % baris tidak cocok dengan prodi/PT di payload',
      jsonb_array_length(coalesce(p->'prodiPt', '[]')) - n_relasi, jsonb_array_length(coalesce(p->'prodiPt', '[]'));
  end if;

  return jsonb_build_object(
    'stat', jsonb_build_object(
      'prodiBaru', n_prodi_baru, 'prodiUbah', n_prodi_ubah,
      'karirBaru', n_karir_baru, 'karirUbah', n_karir_ubah,
      'ptBaru', n_pt_baru, 'ptUbah', n_pt_ubah),
    'sisaProdi', (select coalesce(jsonb_agg(nama order by nama), '[]') from prodi where not (id = any(prodi_ids))),
    'sisaKarir', (select coalesce(jsonb_agg(nama order by nama), '[]') from karir where not (id = any(karir_ids))));
end $$;

-- Hanya backend (service_role) yang boleh memanggil; fungsi di schema public
-- secara default bisa dieksekusi anon/authenticated lewat PostgREST.
revoke all on function impor_katalog(jsonb) from public, anon, authenticated;
grant execute on function impor_katalog(jsonb) to service_role;
