"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../../styles/rekomendasi.css";
import { UnifiedNavbar } from "../../../components/shared/UnifiedNavbar";

import {
  IconCompass,
  IconBell,
  IconUser,
  IconMessage,
  IconCheckCircle,
  IconCalendar,
  IconBookOpen,
  IconArrowRight,
} from "../../../components/siswa/Icons";
import { detailProdi } from "../../../lib/api/katalog";
import { daftarNilai } from "../../../lib/api/nilai";
import {
  getTarget,
  hapusTargetProdi,
  jadikanTargetUtama,
  penjelasan,
  rekomendasiJenjang,
  rekomendasiMapel,
  rekomendasiProdi,
  tambahTargetProdi,
} from "../../../lib/api/rekomendasi";
import { getMe } from "../../../lib/api/siswa";
import type {
  DaftarNilai,
  DaftarTarget,
  DetailProdi,
  HasilRekomendasi,
  JenisPendidikan,
  Penjelasan,
  RekomendasiJenjang,
  RekomendasiMapel,
  RekomendasiProdi,
  SiswaSaya,
} from "../../../lib/api/types";
import { infoKelas, LABEL_KURANG, labelJenis, pesanError } from "../../../lib/riasec";

// ─── Additional SVG icons specific to rekomendasi page ──────────────────────

type LocalIconProps = { size?: number; color?: string; className?: string };

const IconSparkle = ({ size = 15, color = "#006190", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M6.5 2L7.7 5.8L11.5 7L7.7 8.2L6.5 12L5.3 8.2L1.5 7L5.3 5.8L6.5 2Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M12.5 9.5L13.1 11.4L15 12L13.1 12.6L12.5 14.5L11.9 12.6L10 12L11.9 11.4L12.5 9.5Z" fill={color} />
  </svg>
);

const IconFilter = ({ size = 12, color = "#3F4850", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1 3H11M3 6H9M5 9H7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const IconEye = ({ size = 16, color = "#0B1C30", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M1.5 8C1.5 8 4 3.5 8 3.5C12 3.5 14.5 8 14.5 8C14.5 8 12 12.5 8 12.5C4 12.5 1.5 8 1.5 8Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.4" />
  </svg>
);

const IconBookmark = ({ size = 14, color = "#FFFFFF", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M3 1.5H11V12.5L7 9.8L3 12.5V1.5Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

const IconInfo = ({ size = 13, color = "#7C5400", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.3" />
    <path d="M7 6.5V10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="7" cy="4.3" r="0.8" fill={color} />
  </svg>
);

const IconBulb = ({ size = 13, color = "#0B1C30", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M7 1.5C4.8 1.5 3 3.2 3 5.4C3 6.8 3.7 7.9 4.8 8.6V10H9.2V8.6C10.3 7.9 11 6.8 11 5.4C11 3.2 9.2 1.5 7 1.5Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M5.2 12.3H8.8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconScale = ({ size = 18, color = "#0B1C30", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M9 2V16M5 16H13M3 5H15" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <path d="M3 5L1 10C1 11.1 1.9 12 3 12C4.1 12 5 11.1 5 10L3 5ZM15 5L13 10C13 11.1 13.9 12 15 12C16.1 12 17 11.1 17 10L15 5Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

const IconBranch = ({ size = 15, color = "#3F4850", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <circle cx="3" cy="2.5" r="1.5" stroke={color} strokeWidth="1.3" />
    <circle cx="11" cy="2.5" r="1.5" stroke={color} strokeWidth="1.3" />
    <path d="M3 4V5.5C3 7 4.5 8 7 8.5C9.5 8 11 7 11 5.5V4M7 8.5V13.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const IconBriefcase = ({ size = 13, color = "#006190", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1" y="4" width="12" height="8.5" rx="1.2" stroke={color} strokeWidth="1.3" />
    <path d="M5 4V2.8C5 2.4 5.4 2 5.8 2H8.2C8.6 2 9 2.4 9 2.8V4" stroke={color} strokeWidth="1.3" />
  </svg>
);

const IconVerified = ({ size = 16, color = "#006190", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M8 1L9.8 2.4L12 2.2L12.6 4.4L14.5 5.6L13.7 7.7L14.5 9.8L12.6 11L12 13.2L9.8 13L8 14.5L6.2 13L4 13.2L3.4 11L1.5 9.8L2.3 7.7L1.5 5.6L3.4 4.4L4 2.2L6.2 2.4L8 1Z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
    <path d="M5.5 7.8L7.2 9.4L10.5 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChevronDown = ({ size = 10, color = "#3F4850", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M2 3.5L5 6.5L8 3.5" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSend = ({ size = 14, color = "#006190", className }: LocalIconProps) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1" y="2.5" width="12" height="9" rx="1.2" stroke={color} strokeWidth="1.3" />
    <path d="M1.5 3.5L7 7.5L12.5 3.5" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Tone = "brand" | "muted" | "amber";
type TabId = "prodi" | "mapel" | "jalur";
type FilterJenis = "all" | JenisPendidikan;
type Item = RekomendasiProdi["prodi"][number];

const JUMLAH_UTAMA = 3;

/** Item rekomendasi dari backend + detail katalog (deskripsi & kampus) bila sudah dimuat. */
type Kandidat = { s: Item; detail?: DetailProdi };

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Beranda", href: "/beranda" },
  { label: "Rekomendasi", href: "/rekomendasi", active: true },
  { label: "Eksplorasi Karir", href: "/eksplorasi-karir" },
  { label: "Analisis Keselarasan", href: "/analitik" },
  { label: "Katalog Kampus", href: "/katalog-prodi" },
];

const JENIS_FILTERS: { id: FilterJenis; label: string }[] = [
  { id: "all", label: "Semua Jenis" },
  { id: "akademik", label: "Akademik" },
  { id: "vokasi", label: "Vokasi" },
];

const JALUR_INFO = [
  { id: "SNBP", title: "SNBP — Seleksi Nilai Rapor", desc: "Berbasis rapor semester 1–5 & prestasi." },
  { id: "SNBT", title: "SNBT — Tes Berbasis Komputer", desc: "Berbasis UTBK (TPS, Literasi, Penalaran Matematika). Tidak bergantung rapor." },
  { id: "Mandiri", title: "Mandiri & Kedinasan", desc: "Seleksi mandiri kampus atau tes kedinasan (SKD, kesehatan, kesamaptaan)." },
];

const LABEL_JENJANG: Record<string, string> = {
  S1: "S1 Akademik",
  D4: "D4 Sarjana Terapan",
  D3: "D3 Vokasi",
  kedinasan: "Sekolah Kedinasan",
};

const pct = (x: number) => Math.round(x * 100);

const labelCocok = (skor: number) =>
  skor >= 75 ? "Sangat Cocok" : skor >= 55 ? "Cocok" : "Cukup Cocok";

const singkatan = (nama: string) =>
  nama
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 4) || nama.slice(0, 3).toUpperCase();

function rataRapor(nilai: DaftarNilai | null) {
  const valid = (nilai?.nilai ?? []).filter((n) => n.status !== "ditolak");
  if (!valid.length) return null;
  return valid.reduce((t, n) => t + Number(n.nilai), 0) / valid.length;
}

// ── Top badge row ─────────────────────────────────────────────────────────────

function TopInfoRow({ me, nilai }: { me: SiswaSaya | null; nilai: DaftarNilai | null }) {
  return (
    <div className="rk-topinfo">
      <span className="rk-topinfo__badge">
        <IconSparkle size={15} color="#006190" />
        Rekomendasi Berbasis Katalog &bull; Minat + Akademik + Karir
      </span>
      <div className="rk-topinfo__student">
        <span>
          Siswa: <strong>{me?.profil.nama ?? "-"}</strong>
          {me?.profil.sekolah ? ` (${me.profil.sekolah.nama})` : ""}
        </span>
        <span aria-hidden="true">&bull;</span>
        <span className="rk-topinfo__locked">
          <span className="rk-topinfo__locked-dot" aria-hidden="true" />
          {nilai?.semester_maks ? `Rapor s.d. Semester ${nilai.semester_maks}` : "Belum ada nilai rapor"}
        </span>
      </div>
    </div>
  );
}

// ── Hero: title, quick stats, tabs ───────────────────────────────────────────

function HeroCard({
  tab,
  onTabChange,
  kodeSiswa,
  rapor,
  skorTeratas,
  jumlahProdi,
}: {
  tab: TabId;
  onTabChange: (t: TabId) => void;
  kodeSiswa: string | null;
  rapor: number | null;
  skorTeratas: number | null;
  jumlahProdi: number;
}) {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; extra?: React.ReactNode }[] = [
    {
      id: "prodi",
      label: "Rekomendasi Prodi & Karir",
      icon: <IconVerified size={16} color={tab === "prodi" ? "#FFFFFF" : "#3F4850"} />,
      extra: <span className="rk-tab__count">{jumlahProdi} Prodi</span>,
    },
    {
      id: "mapel",
      label: "Paket Mapel Pilihan (Kurikulum Merdeka)",
      icon: <IconBookOpen size={16} color={tab === "mapel" ? "#FFFFFF" : "#3F4850"} />,
    },
    {
      id: "jalur",
      label: "Jenis Jalur Pendidikan",
      icon: <IconBranch size={15} color={tab === "jalur" ? "#FFFFFF" : "#3F4850"} />,
    },
  ];

  return (
    <section className="rk-hero" aria-labelledby="rk-hero-title">
      <div className="rk-hero__blob" aria-hidden="true" />

      <div className="rk-hero__inner">
        <div className="rk-hero__text">
          <h1 className="rk-hero__title" id="rk-hero-title">
            Rekomendasi Program Studi
          </h1>
          <p className="rk-hero__desc">
            Penyelarasan multi-kriteria berbasis hasil asesmen minat RIASEC Holland, rata-rata nilai rapor pada mapel pendukung, dan karir impianmu.
          </p>
        </div>

        <dl className="rk-stats">
          <div className="rk-stat">
            <dt className="rk-stat__label">Tipe RIASEC</dt>
            <dd className="rk-stat__value rk-stat__value--brand">
              {kodeSiswa ? [...kodeSiswa].join(" - ") : "–"}
            </dd>
          </div>
          <div className="rk-stat">
            <dt className="rk-stat__label">Rata Rapor</dt>
            <dd className="rk-stat__value">{rapor !== null ? rapor.toFixed(2) : "–"}</dd>
          </div>
          <div className="rk-stat rk-stat--highlight">
            <dt className="rk-stat__label rk-stat__label--muted">Skor Keselarasan</dt>
            <dd className="rk-stat__value rk-stat__value--strong">
              {skorTeratas !== null ? `${skorTeratas}% ${labelCocok(skorTeratas)}` : "–"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rk-tabs" role="tablist" aria-label="Kategori rekomendasi">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`rk-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`rk-panel-${t.id}`}
            className={`rk-tab${tab === t.id ? " rk-tab--active" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.extra}
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Filter toolbar ───────────────────────────────────────────────────────────

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rk-segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          className={`rk-segmented__btn${value === o.id ? " rk-segmented__btn--active" : ""}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterToolbar({
  jenis,
  onChange,
  bobot,
}: {
  jenis: FilterJenis;
  onChange: (j: FilterJenis) => void;
  bobot: RekomendasiProdi["bobot"] | null;
}) {
  return (
    <div className="rk-toolbar" role="toolbar" aria-label="Filter rekomendasi">
      <div className="rk-toolbar__left">
        <span className="rk-toolbar__label">
          <IconFilter size={12} color="#3F4850" />
          Filter:
        </span>
        <Segmented
          label="Filter jenis pendidikan"
          options={JENIS_FILTERS}
          value={jenis}
          onChange={onChange}
        />
      </div>

      <div className="rk-toolbar__right">
        <span className="rk-toolbar__toggle-label">
          {bobot
            ? `Bobot: Minat ${pct(bobot.minat)}% • Akademik ${pct(bobot.akademik)}% • Karir ${pct(bobot.karir)}%`
            : ""}
        </span>
      </div>
    </div>
  );
}

// ── Recommendation card ──────────────────────────────────────────────────────

function ScoreBar({ value, tone }: { value: number; tone: "brand" | "blue" | "amber" | "muted" }) {
  return (
    <div className="rk-bar" role="presentation">
      <div className={`rk-bar__fill rk-bar__fill--${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function RecommendationCard({
  k,
  rank,
  active,
  busy,
  onPrimary,
}: {
  k: Kandidat;
  rank: number;
  active: boolean;
  busy: boolean;
  onPrimary: () => void;
}) {
  const { s, detail } = k;
  const featured = rank === 0;
  const isVokasi = s.prodi.jenis_pendidikan.includes("vokasi");
  const tone: Tone = isVokasi ? "amber" : featured ? "brand" : "muted";
  const metricTones: ("brand" | "blue" | "amber" | "muted")[] =
    tone === "amber" ? ["amber", "amber", "amber"] : featured ? ["brand", "blue", "muted"] : ["muted", "muted", "muted"];
  const total = pct(s.skor.total);

  const metrics = [
    { label: "Kesesuaian Minat RIASEC", value: pct(s.skor.minat), note: `Kode prodi ${s.prodi.kode_riasec ?? "-"}` },
    {
      label: "Kesiapan Akademik",
      value: pct(s.skor.akademik),
      note:
        s.akademik.mapel
          .filter((m) => m.nilai !== null)
          .map((m) => `${m.nama} (${m.nilai})`)
          .join(", ") || "Belum ada nilai pada mapel pendukung",
    },
    {
      label: "Keterkaitan Karir",
      value: pct(s.skor.karir),
      note:
        s.karir.alasan === "target_karir"
          ? `Terhubung ke karir impianmu: ${s.karir.cocok.join(", ")}`
          : s.karir.alasan === "bidang_karir"
            ? `Sejalan dengan rumpun karir pilihanmu: ${s.karir.cocok.slice(0, 3).join(", ")}`
            : "Belum terhubung ke karir impian/rumpun pilihanmu",
    },
  ];

  const careers = s.contoh_karir.slice(0, 3);
  const campuses = detail?.perguruan_tinggi.slice(0, 4) ?? [];
  const primaryLabel = featured
    ? active
      ? "Target Utama Tersimpan"
      : "Jadikan Target Utama"
    : active
      ? "Tersimpan"
      : "Simpan Pilihan";

  return (
    <article
      className={`rk-card rk-card--${tone}${featured ? " rk-card--featured" : ""}`}
      aria-labelledby={`rk-card-${s.prodi.id}`}
    >
      <div className="rk-card__banner">
        <div className="rk-card__badges">
          <span className={`rk-rank rk-rank--${tone}`}>
            #{s.peringkat} {featured ? "Rekomendasi Terkuat" : "Rekomendasi Alternatif"}
          </span>
          <span className="rk-card__tag">{s.prodi.bidang_studi?.nama ?? "-"}</span>
          {s.sesuai_preferensi_jenjang === false && <span className="rk-card__tag">Di luar jenjang pilihanmu</span>}
        </div>
        <span className={`rk-match rk-match--${tone === "amber" ? "amber" : "brand"}`}>
          <IconVerified size={16} color={tone === "amber" ? "#7C5400" : "#006190"} />
          {total}% {labelCocok(total)}
        </span>
      </div>

      <div className="rk-card__body">
        <div className="rk-card__info">
          <div className="rk-card__meta">
            <IconBookOpen size={14} color={tone === "amber" ? "#7C5400" : "#006190"} />
            <span>{s.prodi.bidang_studi?.nama ?? "-"}</span>
            <span aria-hidden="true">&bull;</span>
            <span>Pendidikan {labelJenis(s.prodi.jenis_pendidikan as JenisPendidikan[])}</span>
          </div>
          <h2 className="rk-card__title" id={`rk-card-${s.prodi.id}`}>{s.prodi.nama}</h2>
          {detail?.deskripsi && <p className="rk-card__desc">{detail.deskripsi}</p>}

          {careers.length > 0 && (
            <div className="rk-careers">
              {featured && <span className="rk-careers__heading">Contoh Karir dari Prodi Ini:</span>}
              <ul className="rk-careers__list" role="list">
                {careers.map((c) => (
                  <li key={c.id} className="rk-career">
                    <IconBriefcase size={13} color="#006190" />
                    {c.nama}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rk-score">
          <div className="rk-score__metrics">
            {metrics.map((m, idx) => (
              <div key={m.label} className="rk-metric">
                <div className="rk-metric__head">
                  <span className="rk-metric__label">{m.label}</span>
                  <span className={`rk-metric__value${featured && idx === 1 ? " rk-metric__value--blue" : ""}`}>
                    {m.value}/100
                  </span>
                </div>
                <ScoreBar value={m.value} tone={metricTones[idx] ?? "muted"} />
                {m.note && <span className="rk-metric__note">{m.note}</span>}
              </div>
            ))}
          </div>

          <dl className="rk-facts">
            <div className="rk-fact">
              <dt>Kode RIASEC Prodi:</dt>
              <dd>{s.prodi.kode_riasec ?? "-"}</dd>
            </div>
            {detail && (
              <div className="rk-fact">
                <dt>Kampus Terdata:</dt>
                <dd>{detail.perguruan_tinggi.length} kampus</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {campuses.length > 0 && (
        <div className="rk-campuses">
          <span className="rk-campuses__heading">Perguruan Tinggi yang Membuka Prodi Ini:</span>
          <ul className="rk-campuses__list" role="list">
            {campuses.map((c) => (
              <li key={`${c.id}-${c.jenjang}`} className="rk-campus">
                <span className="rk-campus__abbr" aria-hidden="true">{singkatan(c.nama)}</span>
                <span className="rk-campus__text">
                  <span className="rk-campus__name">{c.nama}</span>
                  <span className="rk-campus__cap">
                    {c.jenjang}
                    {c.kota ? ` • ${c.kota}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`rk-card__footer${featured ? " rk-card__footer--featured" : ""}`}>
        {featured && (
          <span className="rk-card__note">
            <IconInfo size={13} color="#7C5400" />
            {s.akademik.data_kurang
              ? "Nilaimu baru menutup sebagian kecil mapel pendukung prodi ini"
              : `${pct(s.akademik.cakupan)}% bobot mapel pendukung prodi ini sudah ada nilainya`}
          </span>
        )}
        <div className="rk-card__actions">
          <Link
            href={`/katalog-prodi/${s.prodi.id}`}
            className={featured ? "rk-btn rk-btn--outline" : "rk-btn rk-btn--light"}
          >
            {featured && <IconEye size={16} color="#0B1C30" />}
            Detail Prodi
          </Link>
          <button
            type="button"
            className={`rk-btn ${featured ? "rk-btn--primary" : "rk-btn--soft"}${active ? " rk-btn--active" : ""}`}
            aria-pressed={active}
            disabled={busy}
            onClick={onPrimary}
          >
            {featured && <IconBookmark size={14} color="#FFFFFF" />}
            {busy ? "Menyimpan..." : primaryLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function CadanganList({ items }: { items: Kandidat[] }) {
  return (
    <ul className="rk-cadangan" role="list" aria-label="Pilihan rekomendasi cadangan">
      {items.map(({ s }) => (
        <li key={s.prodi.id} className="rk-cadangan__item">
          <span className="rk-cadangan__rank">#{s.peringkat}</span>
          <span className="rk-cadangan__text">
            <Link href={`/katalog-prodi/${s.prodi.id}`} className="rk-cadangan__title">
              {s.prodi.nama}
            </Link>
            <span className="rk-cadangan__meta">
              {s.prodi.bidang_studi?.nama ?? "-"} &bull; {labelJenis(s.prodi.jenis_pendidikan as JenisPendidikan[])}{" "}
              &bull; RIASEC {s.prodi.kode_riasec ?? "-"}
            </span>
          </span>
          <span className="rk-cadangan__match">{pct(s.skor.total)}%</span>
        </li>
      ))}
    </ul>
  );
}

// ── Sidebar cards ────────────────────────────────────────────────────────────

function XaiCard({ k, bobot }: { k: Kandidat | undefined; bobot: RekomendasiProdi["bobot"] }) {
  const [teks, setTeks] = useState<Penjelasan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!k) return null;
  const { s } = k;
  const komponen = [
    { label: `Kecocokan Minat (${pct(bobot.minat)}%)`, skor: s.skor.minat * bobot.minat, dotClass: "rk-dot--blue" },
    { label: `Kesiapan Akademik (${pct(bobot.akademik)}%)`, skor: s.skor.akademik * bobot.akademik, dotClass: "rk-dot--brand" },
    { label: `Keterkaitan Karir (${pct(bobot.karir)}%)`, skor: s.skor.karir * bobot.karir, dotClass: "rk-dot--muted" },
  ];

  const jelaskan = async () => {
    setBusy(true);
    setError(null);
    try {
      setTeks(await penjelasan("prodi"));
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rk-side-card" aria-labelledby="rk-xai-title">
      <div className="rk-side-card__head">
        <span className="rk-side-card__icon" aria-hidden="true">
          <IconSparkle size={16} color="#FFFFFF" />
        </span>
        <div>
          <h2 className="rk-side-card__title" id="rk-xai-title">Kenapa Prodi Ini?</h2>
          <p className="rk-side-card__sub">Transparansi perhitungan skor</p>
        </div>
      </div>
      <p className="rk-side-card__desc">
        Mengapa {s.prodi.nama} berada di posisi teratas rekomendasi kamu? Berikut pembobotannya:
      </p>

      <table className="rk-xai-table">
        <thead>
          <tr>
            <th scope="col">Komponen Penentu</th>
            <th scope="col">Kontribusi Skor</th>
          </tr>
        </thead>
        <tbody>
          {komponen.map((c) => (
            <tr key={c.label}>
              <td>
                <span className={`rk-dot ${c.dotClass}`} aria-hidden="true" />
                {c.label}
              </td>
              <td>{(c.skor * 100).toFixed(1)} pt</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Total Skor Keselarasan</td>
            <td>
              {pct(s.skor.total)}% ({labelCocok(pct(s.skor.total))})
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="rk-argument">
        <span className="rk-argument__title">
          <IconBulb size={13} color="#0B1C30" />
          Penjelasan:
        </span>
        {teks ? (
          <p className="rk-argument__text" style={{ whiteSpace: "pre-wrap" }}>
            {teks.penjelasan ?? `Penjelasan belum tersedia (${teks.alasan ?? "coba lagi nanti"}).`}
          </p>
        ) : (
          <button type="button" className="rk-side-btn" disabled={busy} onClick={jelaskan}>
            {busy ? "Menyusun penjelasan..." : "Jelaskan rekomendasi ini"}
            <IconArrowRight size={9} color="#006190" />
          </button>
        )}
        {error && <p className="rk-argument__text">{error}</p>}
      </div>
    </section>
  );
}

function PaketMapelCard({ me, rekomendasi }: { me: SiswaSaya | null; rekomendasi: Kandidat[] }) {
  const mapel = me?.mapel.map((m) => m.mapel) ?? [];
  return (
    <section className="rk-side-card" aria-labelledby="rk-mapel-title">
      <div className="rk-side-card__row">
        <h2 className="rk-side-card__title rk-side-card__title--icon" id="rk-mapel-title">
          <IconBookOpen size={17} color="#006190" />
          Paket Mapel Terpilih
        </h2>
        <span className="rk-pill">{mapel.length} Mapel</span>
      </div>
      <p className="rk-side-card__desc">Mata pelajaran yang sedang kamu tempuh:</p>
      {mapel.length === 0 ? (
        <p className="rk-side-card__desc">Belum ada mapel yang dipilih.</p>
      ) : (
        <ul className="rk-mapel" role="list">
          {mapel.map((m) => {
            const dipakai = rekomendasi.filter(({ s }) => s.akademik.mapel.some((x) => x.kode === m.kode)).length;
            return (
              <li key={m.id} className="rk-mapel__item">
                <span className="rk-mapel__code" aria-hidden="true">{m.kode}</span>
                <span className="rk-mapel__text">
                  <span className="rk-mapel__name">{m.nama}</span>
                  <span className="rk-mapel__meta">
                    {dipakai > 0
                      ? `Pendukung ${dipakai} dari ${rekomendasi.length} prodi teratas`
                      : "Bukan pendukung prodi teratas"}
                  </span>
                </span>
                {dipakai > 0 && <IconCheckCircle size={16} color="#006190" />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function JenjangCard({ data }: { data: HasilRekomendasi<RekomendasiJenjang> | null }) {
  const maks = data?.tersedia ? Math.max(1, ...data.hasil.jenjang.map((j) => j.poin)) : 1;
  return (
    <section className="rk-side-card" aria-labelledby="rk-tipe-title">
      <h2 className="rk-side-card__title rk-side-card__title--icon" id="rk-tipe-title">
        <IconScale size={17} color="#0B1C30" />
        Rekomendasi Jenjang Pendidikan
      </h2>
      {!data ? (
        <p className="rk-side-card__desc">Memuat...</p>
      ) : !data.tersedia ? (
        <p className="rk-side-card__desc">
          Isi preferensi pendidikan di <Link href="/onboarding">profil</Link> untuk melihat rekomendasi jenjang.
        </p>
      ) : (
        <ul className="rk-tipe" role="list">
          {data.hasil.jenjang.map((j, i) => (
            <li key={j.jenjang} className="rk-tipe__item">
              <div className="rk-tipe__head">
                <span className="rk-tipe__label">{LABEL_JENJANG[j.jenjang] ?? j.jenjang}</span>
                <span className={`rk-tipe__pct rk-tipe__pct--${i === 0 ? "brand" : "blue"}`}>{j.poin} poin</span>
              </div>
              <ScoreBar value={(j.poin / maks) * 100} tone={i === 0 ? "brand" : "blue"} />
              <span className="rk-tipe__desc">{j.alasan.join(", ") || "Belum ada faktor pendukung"}</span>
            </li>
          ))}
        </ul>
      )}
      {data?.tersedia && data.hasil.catatan && <p className="rk-side-card__desc">{data.hasil.catatan}</p>}
    </section>
  );
}

function BkCtaCard({ sekolah }: { sekolah: string | null }) {
  return (
    <section className="rk-bk" aria-labelledby="rk-bk-title">
      <h2 className="rk-bk__title" id="rk-bk-title">
        <span className="rk-bk__icon" aria-hidden="true">
          <IconMessage size={15} color="#FFFFFF" />
        </span>
        Diskusikan dengan Guru BK
      </h2>
      <p className="rk-bk__desc">
        Guru BK {sekolah ?? "sekolahmu"} dapat meninjau rekomendasi dan target prodimu melalui dashboard BK.
      </p>
      <button type="button" className="rk-bk__btn rk-bk__btn--primary">
        <IconSend size={14} color="#006190" />
        Kirim Rekap ke Guru BK
      </button>
      <button type="button" className="rk-bk__btn rk-bk__btn--ghost">
        <IconCalendar size={12} color="#FFFFFF" />
        Jadwalkan Sesi Konseling
      </button>
    </section>
  );
}

// ── Tab 2 & 3 panels ─────────────────────────────────────────────────────────

function MapelRekomendasiCard({ data }: { data: HasilRekomendasi<RekomendasiMapel> | null }) {
  return (
    <section className="rk-side-card" aria-labelledby="rk-align-title">
      <h2 className="rk-side-card__title rk-side-card__title--icon" id="rk-align-title">
        <IconBookOpen size={17} color="#006190" />
        Rekomendasi Mapel Pilihan
      </h2>
      {!data ? (
        <p className="rk-side-card__desc">Memuat...</p>
      ) : !data.tersedia ? (
        <p className="rk-side-card__desc">Lengkapi data terlebih dahulu (lihat tab Rekomendasi Prodi).</p>
      ) : (
        <>
          <p className="rk-side-card__desc">
            Mapel pilihan yang paling mendukung prodi kandidatmu (
            {data.hasil.prodi_kandidat.map((p) => p.nama).join(", ")}).
            {!data.hasil.relevan && " Kamu di kelas 12, jadi ini hanya sebagai referensi."}
          </p>
          <ul className="rk-tipe" role="list">
            {data.hasil.mapel.map((m) => (
              <li key={m.mapel.id} className="rk-tipe__item">
                <div className="rk-tipe__head">
                  <span className="rk-tipe__label">
                    {m.mapel.nama}
                    {m.sudah_diambil ? " ✓" : ""}
                  </span>
                  <span className="rk-tipe__pct rk-tipe__pct--brand">{pct(m.skor)}%</span>
                </div>
                <ScoreBar value={pct(m.skor)} tone="brand" />
                <span className="rk-tipe__desc">
                  {m.sudah_diambil ? "Sudah kamu ambil" : "Belum diambil"} • mendukung{" "}
                  {m.dukungan.map((d) => d.prodi).join(", ")}
                  {m.nilai_siswa != null ? ` • nilaimu ${m.nilai_siswa}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function JalurSeleksiCard() {
  return (
    <section className="rk-side-card" aria-labelledby="rk-jalur-title">
      <h2 className="rk-side-card__title rk-side-card__title--icon" id="rk-jalur-title">
        <IconBranch size={15} color="#006190" />
        Jalur Seleksi yang Tersedia
      </h2>
      <ul className="rk-jalur" role="list">
        {JALUR_INFO.map((j) => (
          <li key={j.id} className="rk-jalur__item">
            <div className="rk-tipe__head">
              <span className="rk-tipe__label">{j.title}</span>
            </div>
            <span className="rk-tipe__desc">{j.desc}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RekomendasiPage() {
  const [tab, setTab] = useState<TabId>("prodi");
  const [jenis, setJenis] = useState<FilterJenis>("all");
  const [showCadangan, setShowCadangan] = useState(false);

  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [nilai, setNilai] = useState<DaftarNilai | null>(null);
  const [target, setTarget] = useState<DaftarTarget>({ karir: [], prodi: [] });
  const [rek, setRek] = useState<HasilRekomendasi<RekomendasiProdi> | null>(null);
  const [mapel, setMapel] = useState<HasilRekomendasi<RekomendasiMapel> | null>(null);
  const [jenjang, setJenjang] = useState<HasilRekomendasi<RekomendasiJenjang> | null>(null);
  const [details, setDetails] = useState<Record<string, DetailProdi>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    Promise.all([getMe(), daftarNilai(), getTarget(), rekomendasiProdi()])
      .then(([m, n, t, r]) => {
        if (batal) return;
        setMe(m);
        setNilai(n);
        setTarget(t);
        setRek(r);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    rekomendasiJenjang().then((j) => !batal && setJenjang(j)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    if (tab === "mapel" && !mapel) rekomendasiMapel().then(setMapel).catch((err) => setError(pesanError(err)));
  }, [tab, mapel]);

  const hasil = rek?.tersedia ? rek.hasil : null;
  const tersaring = useMemo(
    () =>
      (hasil?.prodi ?? [])
        .filter((s) => jenis === "all" || s.prodi.jenis_pendidikan.includes(jenis))
        .map((s): Kandidat => ({ s, detail: details[s.prodi.id] })),
    [hasil, jenis, details]
  );
  const utama = tersaring.slice(0, JUMLAH_UTAMA);
  const cadangan = tersaring.slice(JUMLAH_UTAMA);

  // Deskripsi & daftar kampus diambil dari katalog untuk kartu utama saja.
  const idPerluDetail = utama
    .map((k) => k.s.prodi.id)
    .filter((id) => !details[id])
    .join(",");
  useEffect(() => {
    if (!idPerluDetail) return;
    let batal = false;
    Promise.all(idPerluDetail.split(",").map((id) => detailProdi(id)))
      .then((list) => !batal && setDetails((d) => ({ ...d, ...Object.fromEntries(list.map((x) => [x.id, x])) })))
      .catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [idPerluDetail]);

  const targetPerProdi = useMemo(
    () => new Map(target.prodi.filter((t) => t.prodi).map((t) => [t.prodi!.id, t])),
    [target]
  );

  const handlePrimary = async (k: Kandidat, featured: boolean) => {
    if (busyId) return;
    const id = k.s.prodi.id;
    setBusyId(id);
    try {
      const ada = targetPerProdi.get(id);
      if (featured) {
        if (ada?.is_utama) {
          setTarget({ ...target, prodi: await hapusTargetProdi(ada.id) });
        } else {
          const baru = ada ?? (await tambahTargetProdi({ prodi_id: id, sumber: "rekomendasi" }));
          setTarget({ ...target, prodi: await jadikanTargetUtama(baru.id) });
        }
      } else if (ada) {
        setTarget({ ...target, prodi: await hapusTargetProdi(ada.id) });
      } else {
        const baru = await tambahTargetProdi({ prodi_id: id, sumber: "rekomendasi" });
        setTarget({ ...target, prodi: [...target.prodi, baru] });
      }
    } catch (err) {
      alert(pesanError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-rekomendasi">
      <UnifiedNavbar peran="siswa" customUser={{ nama: me?.profil.nama, kelas: infoKelas(me) }} />

      <main className="rk-main" id="main-content">
        <div className="rk-container">
          <HeroCard
            tab={tab}
            onTabChange={setTab}
            kodeSiswa={hasil?.kode_holland ?? null}
            rapor={rataRapor(nilai)}
            skorTeratas={hasil?.prodi[0] ? pct(hasil.prodi[0].skor.total) : null}
            jumlahProdi={hasil?.jumlah_prodi_dinilai ?? 0}
          />

          {error && (
            <div className="rk-empty" role="alert">
              {error}
            </div>
          )}
          {!rek && !error && (
            <div className="rk-empty" role="status">
              Memuat rekomendasi...
            </div>
          )}

          {rek && !rek.tersedia && (
            <div className="rk-empty">
              Rekomendasi belum bisa disusun. Lengkapi dulu:
              <span style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                {rek.kurang.map((k) => (
                  <Link key={k} href={LABEL_KURANG[k]?.href ?? "/beranda"} className="rk-empty__reset">
                    {LABEL_KURANG[k]?.label ?? k}
                  </Link>
                ))}
              </span>
            </div>
          )}

          {hasil && tab === "prodi" && (
            <>
              <FilterToolbar jenis={jenis} onChange={setJenis} bobot={hasil.bobot} />
              {hasil.katalog_draf && (
                <div className="rk-empty">Sebagian data katalog masih draf dan belum diverifikasi.</div>
              )}

              <div className="rk-grid" role="tabpanel" id="rk-panel-prodi" aria-labelledby="rk-tab-prodi">
                <div className="rk-col-left">
                  {utama.length === 0 && <div className="rk-empty">Tidak ada prodi untuk filter ini.</div>}
                  {utama.map((k, i) => {
                    const t = targetPerProdi.get(k.s.prodi.id);
                    return (
                      <RecommendationCard
                        key={k.s.prodi.id}
                        k={k}
                        rank={i}
                        active={i === 0 ? !!t?.is_utama : !!t}
                        busy={busyId === k.s.prodi.id}
                        onPrimary={() => handlePrimary(k, i === 0)}
                      />
                    );
                  })}

                  {showCadangan && cadangan.length > 0 && <CadanganList items={cadangan} />}

                  {cadangan.length > 0 && (
                    <button
                      type="button"
                      className="rk-more"
                      aria-expanded={showCadangan}
                      onClick={() => setShowCadangan((v) => !v)}
                    >
                      {showCadangan
                        ? "Sembunyikan Pilihan Rekomendasi Cadangan"
                        : `Tampilkan ${cadangan.length} Pilihan Rekomendasi Cadangan Lainnya`}
                      <IconChevronDown
                        size={10}
                        color="#3F4850"
                        className={showCadangan ? "rk-more__chevron--up" : undefined}
                      />
                    </button>
                  )}
                </div>

                <aside className="rk-col-right" aria-label="Penjelasan dan aksi pendukung">
                  <XaiCard k={utama[0]} bobot={hasil.bobot} />
                  <PaketMapelCard me={me} rekomendasi={utama} />
                  <JenjangCard data={jenjang} />
                  <BkCtaCard sekolah={me?.profil.sekolah?.nama ?? null} />
                </aside>
              </div>
            </>
          )}

          {hasil && tab === "mapel" && (
            <div className="rk-panel-grid" role="tabpanel" id="rk-panel-mapel" aria-labelledby="rk-tab-mapel">
              <PaketMapelCard me={me} rekomendasi={utama} />
              <MapelRekomendasiCard data={mapel} />
            </div>
          )}

          {tab === "jalur" && (
            <div className="rk-panel-grid" role="tabpanel" id="rk-panel-jalur" aria-labelledby="rk-tab-jalur">
              <JenjangCard data={jenjang} />
              <JalurSeleksiCard />
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
