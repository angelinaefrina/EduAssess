"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import "../../../styles/beranda.css";
import { ApiError } from "../../../lib/api/client";
import { daftarNilai } from "../../../lib/api/nilai";
import { getTarget, terakhirAsesmen } from "../../../lib/api/rekomendasi";
import { getMe } from "../../../lib/api/siswa";
import type {
  DaftarNilai,
  DaftarTarget,
  HasilAsesmen,
  SiswaSaya,
  TipeRiasec,
} from "../../../lib/api/types";

// SVG Icons
import {
  IconCompass,
  IconTarget,
  IconBookOpen,
  IconCheck,
  IconCheckCircle,
  IconCheckMuted,
  IconTrendUp,
  IconTrendDown,
  IconArrowRight,
  IconChevronRight,
  IconBuilding,
  IconSchool,
  IconBell,
  IconSearch,
  IconUser,
  IconStar,
  IconBarChart,
  IconLayers,
  IconGrid,
  IconClock,
  IconShield,
  IconMessage,
  IconDiploma,
} from "../../../components/siswa/Icons";


// ─── Data ────────────────────────────────────────────────────────────────────

interface BerandaData {
  me: SiswaSaya;
  asesmen: HasilAsesmen | null;
  nilai: DaftarNilai;
  target: DaftarTarget;
}

const RIASEC_META: Record<TipeRiasec, { label: string; color: string; ciri: string }> = {
  R: { label: "Realistic (R)", color: "#007BB5", ciri: "praktis dan suka bekerja dengan alat atau mesin" },
  I: { label: "Investigative (I)", color: "#006190", ciri: "analitis dan suka memecahkan masalah" },
  A: { label: "Artistic (A)", color: "#7C5400", ciri: "kreatif dan ekspresif" },
  S: { label: "Social (S)", color: "#BEC7D2", ciri: "senang membantu dan bekerja dengan orang" },
  E: { label: "Enterprising (E)", color: "#6F7881", ciri: "persuasif dan suka memimpin" },
  C: { label: "Conventional (C)", color: "#525E7E", ciri: "teliti dan terstruktur" },
};

/** Skor RIASEC = rata-rata skala 1–5 → persen. */
const skorKePersen = (skor: number) => Math.round((skor / 5) * 100);

function levelMinat(pct: number) {
  if (pct >= 80) return "Sangat Tinggi";
  if (pct >= 65) return "Tinggi";
  if (pct >= 50) return "Sedang";
  return "Cukup";
}

function hurufNilai(n: number) {
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  return "D";
}

function skorRiasec(asesmen: HasilAsesmen | null) {
  return (Object.keys(RIASEC_META) as TipeRiasec[])
    .map((tipe) => {
      const pct = skorKePersen(Number(asesmen?.riasec?.[tipe] ?? 0));
      return { tipe, ...RIASEC_META[tipe], pct, level: levelMinat(pct) };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Tiga mapel dengan rata-rata tertinggi (nilai ditolak BK diabaikan). */
function mapelUnggulan(nilai: DaftarNilai) {
  const perMapel = new Map<string, { semester: number; nilai: number }[]>();
  for (const n of nilai.nilai) {
    if (n.status === "ditolak" || !n.mapel) continue;
    const list = perMapel.get(n.mapel.nama) ?? [];
    list.push({ semester: n.semester, nilai: Number(n.nilai) });
    perMapel.set(n.mapel.nama, list);
  }
  return [...perMapel.entries()]
    .map(([name, list]) => {
      list.sort((a, b) => a.semester - b.semester);
      const rata = list.reduce((t, x) => t + x.nilai, 0) / list.length;
      const selisih = list[list.length - 1].nilai - list[0].nilai;
      return {
        name,
        score: Math.round(rata),
        grade: hurufNilai(rata),
        naik: selisih >= 0,
        trend:
          list.length > 1
            ? `${selisih >= 0 ? "+" : ""}${selisih.toFixed(1)} poin sejak semester ${list[0].semester}`
            : `Semester ${list[0].semester}`,
        avg: `Rata-rata ${list.length} semester`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function checklist({ me, asesmen, nilai, target }: BerandaData) {
  return [
    { label: "Profil", done: me.kelengkapan.lengkap },
    { label: "Nilai Rapor", done: nilai.nilai.length > 0 },
    { label: "RIASEC", done: asesmen !== null },
    { label: "Target Prodi", done: target.prodi.length > 0 },
    { label: "Karir Impian", done: target.karir.length > 0 },
  ];
}

function infoKelas(me: SiswaSaya) {
  const s = me.siswa;
  if (!s?.tingkat) return "Profil belum lengkap";
  return [`Kelas ${s.tingkat}${s.rombel ? ` ${s.rombel}` : ""}`, s.peminatan]
    .filter(Boolean)
    .join(" ");
}

const namaKarir = (t: DaftarTarget["karir"][number]) => t.karir?.nama ?? t.teks_bebas ?? "-";

/** Banyak huruf kode RIASEC prodi yang juga ada di kode Holland siswa. */
function kecocokanKode(kodeSiswa: string | null, kodeProdi: string | null) {
  if (!kodeSiswa || !kodeProdi) return null;
  return [...kodeProdi].filter((h) => kodeSiswa.includes(h)).length;
}

const NAV_LINKS = [
  { label: "Beranda", href: "/beranda", active: true },
  { label: "Rekomendasi", href: "/rekomendasi" },
  { label: "Eksplorasi Karir", href: "/eksplorasi-karir", multiline: true },
  { label: "Analisis Keselarasan", href: "/analitik", multiline: true },
  { label: "Katalog Kampus", href: "/katalog-prodi", multiline: true },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SiteHeader({ nama, kelas }: { nama: string; kelas: string }) {
  return (
    <header className="site-header" role="banner">
      <nav className="nav-bar" aria-label="Navigasi utama">
        {/* Brand */}
        <a className="nav-brand" href="/beranda" aria-label="ArahMasaDepan - Beranda">
          <span className="nav-brand__icon" aria-hidden="true">
            <IconCompass size={18} color="#FFFFFF" />
          </span>
          <span className="nav-brand__text">
            <span className="nav-brand__name">ArahMasaDepan</span>
            <span className="nav-brand__badge">Siswa SMA &bull; Kurikulum Merdeka</span>
          </span>
        </a>

        {/* Nav Links */}
        <ul className="nav-links" role="list" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex" }}>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`nav-link${link.active ? " nav-link--active" : ""}`}
                aria-current={link.active ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="nav-actions">
          {/* Search */}
          <button className="nav-search" aria-label="Cari Prodi atau Karir">
            <IconSearch size={14} color="#3F4850" />
            <span className="nav-search__label">Cari Prodi / Karir</span>
            <span className="nav-search__kbd" aria-label="Pintasan keyboard Command K">
              &#8984;K
            </span>
          </button>

          {/* Notification */}
          <button className="nav-notif" aria-label="Notifikasi seleksi, ada pesan baru">
            <IconBell size={14} color="#3F4850" />
            <span className="nav-notif__dot" aria-hidden="true" />
          </button>

          {/* Divider */}
          <span className="nav-divider" aria-hidden="true" />

          {/* User */}
          <Link className="nav-user" href="/profil" aria-label={`Menu akun ${nama}`}>
            <span className="nav-user__avatar" aria-hidden="true">
              <IconUser size={12} color="#FFFFFF" />
            </span>
            <span className="nav-user__info">
              <span className="nav-user__name">{nama}</span>
              <span className="nav-user__role">{kelas}</span>
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

// ─── Section 1: Hero Header ────────────────────────────────────────────────

function HeroSection({ data }: { data: BerandaData }) {
  const { me, target } = data;
  const items = checklist(data);
  const doneCount = items.filter((c) => c.done).length;
  const progressPct = Math.round((doneCount / items.length) * 100);
  const sisa = items.length - doneCount;
  const prodiUtama = target.prodi.find((t) => t.is_utama)?.prodi;
  const karirImpian = target.karir[0];
  const sekolah = me.profil.sekolah?.nama;

  return (
    <section className="hero-card" aria-labelledby="hero-greeting">
      {/* Left: bio */}
      <div className="hero-bio">
        {/* Academic year badge */}
        <div className="hero-academic-badge">
          <span className="hero-academic-badge__dot" aria-hidden="true" />
          <span className="hero-academic-badge__text">
            {me.siswa?.angkatan ? `Angkatan ${me.siswa.angkatan}` : "Angkatan belum diisi"}
            {data.asesmen?.kode_holland ? <> &bull; Tipe {data.asesmen.kode_holland}</> : null}
          </span>
        </div>

        {/* Greeting */}
        <h1 className="hero-greeting" id="hero-greeting">
          Selamat Datang Kembali,{" "}
          <span>{me.profil.nama ?? "Siswa"}</span>
        </h1>

        {/* School info */}
        <div className="hero-school-info">
          <IconSchool size={17} color="#006190" />
          <span>
            {infoKelas(me)} &bull; {sekolah ?? "Belum terdaftar ke sekolah"}
          </span>
        </div>

        {/* Target / career tags */}
        <div className="hero-tags">
          <span className="hero-tag hero-tag--blue">
            <IconBuilding size={14} color="#006190" />
            Target Prodi: {prodiUtama?.nama ?? "Belum dipilih"}
          </span>
          <span className="hero-tag hero-tag--amber">
            <IconTarget size={14} color="#7C5400" />
            Karir Impian: {karirImpian ? namaKarir(karirImpian) : "Belum dipilih"}
          </span>
        </div>
      </div>

      {/* Right: diagnostic progress tracker */}
      <aside className="hero-progress-box" aria-label="Kesiapan Diagnostik SNBP">
        {/* Header */}
        <div className="hero-progress-header">
          <div className="hero-progress-title">
            <span className="hero-progress-label">Kesiapan Diagnostik</span>
            <span className="hero-progress-value">Data {progressPct}% Lengkap</span>
          </div>
          <span className="hero-progress-circle" aria-label={`${progressPct} persen`}>
            {progressPct}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Kelengkapan portofolio">
          <div className="progress-bar__fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Checklist pills */}
        <div className="checklist-pills" role="list" aria-label="Item kelengkapan">
          {items.map((item) => (
            <span
              key={item.label}
              className={`checklist-pill ${item.done ? "checklist-pill--done" : "checklist-pill--pending"}`}
              role="listitem"
            >
              {item.done ? (
                <IconCheckCircle size={12} color="#006190" className="checklist-pill__icon" />
              ) : (
                <IconCheckMuted size={10} color="#6F7881" className="checklist-pill__icon" />
              )}
              {item.label}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="hero-progress-footer">
          <span className="hero-progress-step-label">
            {sisa === 0 ? "Semua data sudah lengkap" : `Tinggal ${sisa} langkah lagi`}
          </span>
          <Link href={me.kelengkapan.lengkap ? "/profil" : "/onboarding"} className="link-inline">
            {me.kelengkapan.lengkap ? "Perbarui Profil" : "Lengkapi Profil"}
            <IconArrowRight size={9} color="#006190" />
          </Link>
        </div>
      </aside>
    </section>
  );
}

// ─── Column 1: Minat RIASEC ────────────────────────────────────────────────

function KolomRIASEC({ asesmen }: { asesmen: HasilAsesmen | null }) {
  if (!asesmen) {
    return (
      <article className="analytics-card" aria-labelledby="riasec-title">
        <div className="card-header">
          <div className="card-header__left">
            <span className="card-header__icon-box" aria-hidden="true">
              <IconTarget size={16} color="#006190" />
            </span>
            <div className="card-header__title-group">
              <h2 className="card-header__title" id="riasec-title">Minat RIASEC</h2>
              <span className="card-header__subtitle">Belum ada data</span>
            </div>
          </div>
        </div>
        <p className="archetype-banner__body">
          Kamu belum mengerjakan tes minat. Kerjakan dulu agar profil minatmu muncul di sini.
        </p>
        <div className="card-footer-action">
          <Link className="btn-ghost-pill" href="/tes-minat">
            Mulai Tes Minat
            <IconChevronRight size={5} color="#006190" />
          </Link>
        </div>
      </article>
    );
  }

  const skor = skorRiasec(asesmen);
  const [utama, kedua] = skor;

  return (
    <article className="analytics-card" aria-labelledby="riasec-title">
      {/* Header */}
      <div className="card-header">
        <div className="card-header__left">
          <span className="card-header__icon-box" aria-hidden="true">
            <IconTarget size={16} color="#006190" />
          </span>
          <div className="card-header__title-group">
            <h2 className="card-header__title" id="riasec-title">Minat RIASEC</h2>
            <span className="card-header__subtitle">Hasil Asesmen Holland</span>
          </div>
        </div>
        <span className="badge-pill badge-pill--blue">TIPE {asesmen.kode_holland ?? "-"}</span>
      </div>

      {/* Archetype banner */}
      <div className="archetype-banner">
        <div className="archetype-banner__label">
          <IconStar size={16} color="#006190" />
          Kode Holland {asesmen.kode_holland ?? "-"}
        </div>
        <p className="archetype-banner__body">
          Kombinasi dominan <strong>{utama.label.split(" ")[0]} ({utama.pct}%)</strong> dan{" "}
          <strong>{kedua.label.split(" ")[0]} ({kedua.pct}%)</strong> menandakan kamu{" "}
          {utama.ciri}, serta {kedua.ciri}.
        </p>
      </div>

      {/* Score bars */}
      <div className="score-bars" role="list" aria-label="Skor RIASEC">
        {skor.map((item) => {
          const isHighlighted = item.pct >= 70;
          return (
            <div key={item.label} className="score-bar-item" role="listitem">
              <div className="score-bar-item__header">
                <span
                  className="score-bar-item__label"
                  style={{ color: isHighlighted ? "#0B1C30" : "#3F4850" }}
                >
                  <span
                    className="score-bar-item__label-dot"
                    style={{ background: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
                <span
                  className="score-bar-item__value"
                  style={{ color: isHighlighted ? item.color : "#3F4850" }}
                >
                  {item.pct}% &bull; {item.level}
                </span>
              </div>
              <div className="score-bar-track">
                <div
                  className="score-bar-fill"
                  style={{ width: `${item.pct}%`, background: item.color }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="card-footer-action">
        <Link className="btn-ghost-pill" href="/tes-minat">
          Ulangi Tes Minat
          <IconChevronRight size={5} color="#006190" />
        </Link>
      </div>
    </article>
  );
}

// ─── Column 2: Kekuatan Rapor ─────────────────────────────────────────────

function KolomRapor({ nilai, sekolah }: { nilai: DaftarNilai; sekolah: string | null }) {
  const unggulan = mapelUnggulan(nilai);
  const semester = [...new Set(nilai.nilai.map((n) => n.semester))].sort((a, b) => a - b);
  const terverifikasi = nilai.nilai.filter((n) => n.status === "terverifikasi").length;
  const menunggu = nilai.nilai.filter((n) => n.status === "menunggu").length;

  return (
    <article className="analytics-card" aria-labelledby="rapor-title">
      {/* Header */}
      <div className="card-header">
        <div className="card-header__left">
          <span className="card-header__icon-box" aria-hidden="true">
            <IconBarChart size={17} color="#006190" />
          </span>
          <div className="card-header__title-group">
            <h2 className="card-header__title" id="rapor-title">Kekuatan Rapor</h2>
            <span className="card-header__subtitle">
              {semester.length
                ? `Semester ${semester[0]}-${semester[semester.length - 1]} • Mapel unggulan`
                : "Belum ada nilai"}
            </span>
          </div>
        </div>
        <span className="badge-pill badge-pill--ink">{semester.length} Semester</span>
      </div>

      {/* Subject performance cards */}
      <div className="subject-cards" role="list" aria-label="Nilai mata pelajaran unggulan">
        {unggulan.length === 0 && (
          <p className="subject-card__avg">Isi nilai rapor untuk melihat mapel unggulanmu.</p>
        )}
        {unggulan.map((subject) => (
          <div key={subject.name} className="subject-card" role="listitem">
            <div className="subject-card__left">
              <div className="subject-card__name-row">
                <span className="subject-card__name">{subject.name}</span>
                <span className="subject-card__grade-badge">{subject.grade}</span>
              </div>
              <div className="subject-card__trend">
                {subject.naik ? (
                  <IconTrendUp size={10} color="#006190" />
                ) : (
                  <IconTrendDown size={3} color="#7C5400" />
                )}
                {subject.trend}
              </div>
            </div>
            <div className="subject-card__right">
              <span className="subject-card__score">{subject.score}</span>
              <span className="subject-card__avg">{subject.avg}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Verification strip */}
      <div className="verification-strip" role="complementary" aria-label="Verifikasi nilai oleh Guru BK">
        <span className="verification-strip__avatar" aria-hidden="true">
          <IconShield size={12} color="#FFFFFF" />
        </span>
        <div className="verification-strip__info">
          <span className="verification-strip__name">
            {terverifikasi} dari {nilai.nilai.length} nilai terverifikasi
          </span>
          <span className="verification-strip__status">
            <IconCheck size={10} color="#006190" />
            {menunggu > 0
              ? `${menunggu} nilai menunggu verifikasi BK${sekolah ? ` ${sekolah}` : ""}`
              : `Verifikasi oleh Guru BK${sekolah ? ` ${sekolah}` : ""}`}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link className="btn-primary-pill" href="/nilai-rapor">
        <IconLayers size={12} color="#FFFFFF" />
        Kelola &amp; Input Nilai Semester
      </Link>
    </article>
  );
}

// ─── Column 3: Rekomendasi ────────────────────────────────────────────────

function KolomRekomendasi({
  target,
  asesmen,
}: {
  target: DaftarTarget;
  asesmen: HasilAsesmen | null;
}) {
  const [utama, ...lainnya] = target.prodi;
  const prodi = utama?.prodi;
  const cocok = kecocokanKode(asesmen?.kode_holland ?? null, prodi?.kode_riasec ?? null);

  return (
    <article className="analytics-card" aria-labelledby="rekom-title">
      {/* Header */}
      <div className="card-header">
        <div className="card-header__left">
          <span className="card-header__icon-box" aria-hidden="true">
            <IconGrid size={17} color="#006190" />
          </span>
          <div className="card-header__title-group">
            <h2 className="card-header__title" id="rekom-title">Target Prodi</h2>
            <span className="card-header__subtitle">
              {target.prodi.length ? `${target.prodi.length} prodi disimpan` : "Belum ada target"}
            </span>
          </div>
        </div>
        <span className="badge-dot" aria-label="Status aktif" />
      </div>

      {prodi ? (
        <div className="major-showcase">
          {/* Top row */}
          <div className="major-showcase__top">
            <div className="major-showcase__name-row">
              <IconDiploma size={15} color="#006190" />
              <span className="major-showcase__name">{prodi.nama}</span>
            </div>
            <span className="match-badge">Utama</span>
          </div>

          {/* Campus tags */}
          <div className="campus-tags">
            <IconBuilding size={12} color="#3F4850" />
            {prodi.bidang_studi?.nama ?? "Bidang studi -"}
            <span>&bull;</span>
            {prodi.jenis_pendidikan === "vokasi" ? "Vokasi" : "Akademik"}
          </div>

          {/* Metric blocks */}
          <div className="metric-blocks">
            <div className="metric-block">
              <span className="metric-block__label">Kode RIASEC Prodi</span>
              <div className="metric-block__value metric-block__value--positive">
                {prodi.kode_riasec ?? "-"}
              </div>
            </div>
            <div className="metric-block">
              <span className="metric-block__label">Kecocokan Minat</span>
              <div
                className={`metric-block__value ${
                  cocok !== null && cocok >= 2
                    ? "metric-block__value--positive"
                    : "metric-block__value--warning"
                }`}
              >
                {cocok === null ? "Tes minat dulu" : `${cocok}/${prodi.kode_riasec?.length ?? 3} huruf`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="major-showcase__insight">
          Kamu belum menyimpan target prodi. Pilih dari rekomendasi atau katalog prodi.
        </p>
      )}

      {/* Alternative pathway */}
      {lainnya.slice(0, 2).map((t, i) => (
        <div key={t.id} className="alt-pathway">
          <div className="alt-pathway__header">
            <span className="alt-pathway__title">
              Alternatif {i + 2}: {t.prodi?.nama ?? "-"}
            </span>
            <span className="alt-pathway__cta">{t.prodi?.kode_riasec ?? ""}</span>
          </div>
          <p className="alt-pathway__desc">{t.prodi?.bidang_studi?.nama ?? ""}</p>
        </div>
      ))}

      {/* Action stack */}
      <div className="action-stack">
        <Link className="btn-ghost-pill" href="/rekomendasi">
          <IconCompass size={14} color="#006190" />
          Lihat Rekomendasi Prodi
        </Link>
        <Link className="btn-text-link" href="/katalog-prodi">
          <IconBookOpen size={11} color="#3F4850" />
          Jelajahi Katalog Prodi
        </Link>
      </div>
    </article>
  );
}

// ─── Section 3: Banner CTA ────────────────────────────────────────────────

const LANGKAH: Record<string, { judul: string; desc: string; href: string; cta: string }> = {
  Profil: { judul: "Lengkapi Profil & Preferensi", desc: "Data kelas, peminatan, dan preferensi belajar dipakai untuk menyaring rekomendasi prodi.", href: "/onboarding", cta: "Lengkapi Profil" },
  "Nilai Rapor": { judul: "Isi Nilai Rapor", desc: "Nilai rapor per semester menentukan kesiapan akademikmu untuk tiap prodi.", href: "/nilai-rapor", cta: "Isi Nilai Rapor" },
  RIASEC: { judul: "Ikuti Tes Minat RIASEC", desc: "Kode Holland dari tes minat menjadi dasar kecocokan prodi dan karir.", href: "/tes-minat", cta: "Mulai Tes Minat" },
  "Target Prodi": { judul: "Pilih Target Prodi", desc: "Simpan prodi incaran agar keselarasannya dengan nilai dan minatmu bisa dianalisis.", href: "/katalog-prodi", cta: "Jelajahi Katalog Prodi" },
  "Karir Impian": { judul: "Tentukan Karir Impian", desc: "Karir impian membantu Guru BK memahami arah tujuanmu.", href: "/eksplorasi-karir", cta: "Eksplorasi Karir" },
};

function BannerCTA({ data }: { data: BerandaData }) {
  const daftar = checklist(data);
  const belum = daftar.filter((c) => !c.done);
  const langkah = belum.length > 0 ? LANGKAH[belum[0].label] : null;
  return (
    <section className="banner-cta" aria-labelledby="banner-title">
      <div className="banner-cta__left">
        <span className="banner-cta__countdown">
          <IconClock size={12} color="#FFFFFF" />
          {belum.length > 0
            ? `${daftar.length - belum.length} dari ${daftar.length} langkah selesai`
            : "Semua langkah selesai"}
        </span>
        <h2 className="banner-cta__title" id="banner-title">
          {langkah ? `Langkah Selanjutnya: ${langkah.judul}` : "Data kamu sudah lengkap"}
        </h2>
        <p className="banner-cta__desc">
          {langkah
            ? langkah.desc
            : "Lihat analisis keselarasan target prodimu dan diskusikan hasilnya dengan Guru BK."}
        </p>
      </div>
      <div className="banner-cta__right">
        <Link className="btn-white-pill" href={langkah?.href ?? "/analitik"}>
          <IconArrowRight size={14} color="#006190" />
          {langkah?.cta ?? "Lihat Analisis Keselarasan"}
        </Link>
        <Link className="btn-ghost-blue" href="/rekomendasi">
          Lihat Rekomendasi Prodi
        </Link>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────

function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-cols">
          {/* Brand col */}
          <div className="footer-brand">
            <div className="footer-brand__logo">
              <span className="footer-brand__icon" aria-hidden="true">
                <IconCompass size={15} color="#FFFFFF" />
              </span>
              <span className="footer-brand__name">ArahMasaDepan</span>
            </div>
            <p className="footer-brand__desc">
              Platform diagnostik minat bakat dan panduan pilihan program studi
              SNBP, SNBT, dan Jalur Mandiri berstandar Kurikulum Merdeka.
            </p>
          </div>

          {/* Fitur Unggulan */}
          <div>
            <h3 className="footer-col__heading">Fitur Unggulan</h3>
            <ul className="footer-col__list">
              {["Tes RIASEC Holland", "Matriks Keselarasan Mapel", "Simulasi Rasionalisasi SNBP"].map((item) => (
                <li key={item} className="footer-col__item">{item}</li>
              ))}
            </ul>
          </div>

          {/* Eksplorasi */}
          <div>
            <h3 className="footer-col__heading">Eksplorasi</h3>
            <ul className="footer-col__list">
              {["Peta Karir Vokasi & Akademik", "Direktori PTN & PTS", "Panduan Portofolio Seni & Olahraga"].map((item) => (
                <li key={item} className="footer-col__item">{item}</li>
              ))}
            </ul>
          </div>

          {/* Pusat Bantuan */}
          <div>
            <h3 className="footer-col__heading">Pusat Bantuan</h3>
            <p className="footer-col__help-text">
              Konsultasi BK Sekolah &amp; Layanan Panduan Siswa
            </p>
            <button className="footer-help-btn" type="button">
              <IconMessage size={13} color="#006190" />
              Bantuan Konselor BK
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <span className="footer-copyright">
            &copy; 2026 ArahMasaDepan &bull; Inisiatif Pendampingan Karir Siswa Indonesia
          </span>
          <nav className="footer-legal" aria-label="Tautan legal">
            <a href="/kebijakan-privasi" className="footer-legal__link">
              Kebijakan Privasi Data Siswa
            </a>
            <a href="/ketentuan-layanan" className="footer-legal__link">
              Ketentuan Layanan
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function BerandaSiswaPage() {
  const [data, setData] = useState<BerandaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    Promise.all([getMe(), terakhirAsesmen(), daftarNilai(), getTarget()])
      .then(([me, asesmen, nilai, target]) => {
        if (batal) return;
        // Login pertama: data siswa belum ada → arahkan ke onboarding.
        if (!me.siswa) {
          window.location.replace("/onboarding");
          return;
        }
        setData({ me, asesmen, nilai, target });
      })
      .catch((err) => {
        if (batal) return;
        setError(err instanceof ApiError ? err.message : "Gagal memuat data. Coba lagi.");
      });
    return () => {
      batal = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="page-beranda">
        <main className="beranda-main" id="main-content">
          <div className="beranda-container">
            <p role={error ? "alert" : "status"}>{error ?? "Memuat data beranda..."}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-beranda">
      {/* Ambient decorative blobs */}
      <div className="ambient-blob ambient-blob--top-right" aria-hidden="true" />
      <div className="ambient-blob ambient-blob--mid-left" aria-hidden="true" />

      {/* Header */}
      <SiteHeader nama={data.me.profil.nama ?? "Siswa"} kelas={infoKelas(data.me)} />

      {/* Main content */}
      <main className="beranda-main" id="main-content">
        <div className="beranda-container">
          {/* Section 1 — Hero */}
          <HeroSection data={data} />

          {/* Section 2 — Analytics 3-column */}
          <section aria-label="Dashboard Analitik Siswa">
            <div className="analytics-grid">
              <KolomRIASEC asesmen={data.asesmen} />
              <KolomRapor nilai={data.nilai} sekolah={data.me.profil.sekolah?.nama ?? null} />
              <KolomRekomendasi target={data.target} asesmen={data.asesmen} />
            </div>
          </section>

          {/* Section 3 — CTA Banner */}
          <BannerCTA data={data} />
        </div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
