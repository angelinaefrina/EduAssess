-- =====================================================================
-- Peran baru: Guru Pengajar (A04).
--
-- Guru, seperti BK, terikat ke satu sekolah lewat profil.sekolah_id dan
-- dapat memantau siswa (UC10–UC13), mengimpor/memverifikasi nilai (UC02),
-- serta mengelompokkan siswa & mengelola modul (UC15–UC17).
-- Akun guru di-set lewat seed / endpoint admin, sama seperti akun BK
-- (handle_new_user tetap selalu membuat peran 'siswa').
--
-- File ini sengaja HANYA menambah nilai enum: nilai enum baru tidak boleh
-- dipakai dalam transaksi yang sama dengan `alter type ... add value`.
-- =====================================================================

alter type peran_pengguna add value if not exists 'guru';

-- Nilai rapor yang diimpor guru (UC02) dibedakan dari impor BK.
alter type sumber_nilai add value if not exists 'impor_guru';
