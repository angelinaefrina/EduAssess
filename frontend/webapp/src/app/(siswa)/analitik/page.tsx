"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../../styles/analitik.css";
import { UnifiedNavbar } from "../../../components/shared/UnifiedNavbar";

import {
  IconCompass,
  IconBookOpen,
  IconCheckCircle,
  IconTrendUp,
  IconTrendDown,
  IconChevronRight,
  IconBuilding,
  IconSchool,
  IconBell,
  IconUser,
  IconDownload,
  IconBarChart,
  IconLayers,
  IconMessage,
  IconStar,
  IconCalendar,
} from "../../../components/siswa/Icons";
import { detailKarir, detailProdi } from "../../../lib/api/katalog";
import { daftarNilai } from "../../../lib/api/nilai";
import { getTarget, terakhirAsesmen } from "../../../lib/api/rekomendasi";
import { getMe } from "../../../lib/api/siswa";
import type {
  DaftarNilai,
  DaftarTarget,
  DetailKarir,
  DetailProdi,
  HasilAsesmen,
  SiswaSaya,
} from "../../../lib/api/types";
import {
  infoKelas,
  labelJenis,
  pesanError,
  skorKecocokan,
  skorMapelPendukung,
} from "../../../lib/riasec";

// ─── Additional SVG icons specific to analitik page ─────────────────────────

const IconGraduationCap = ({ size = 18, color = "#006190", className }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M9 1L17 5.5L9 10L1 5.5L9 1Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M4.5 8V12.5C4.5 12.5 6 14.5 9 14.5C12 14.5 13.5 12.5 13.5 12.5V8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 5.5V10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconPencil = ({ size = 18, color = "#006190", className }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M13 2L16 5L6 15H3V12L13 2Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M11 4L14 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconBriefcase = ({ size = 18, color = "#006190", className }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect x="1.5" y="6" width="15" height="10" rx="1.5" stroke={color} strokeWidth="1.5" />
    <path d="M6 6V4.5C6 3.7 6.7 3 7.5 3H10.5C11.3 3 12 3.7 12 4.5V6" stroke={color} strokeWidth="1.5" />
    <path d="M1.5 11H16.5" stroke={color} strokeWidth="1.5" />
  </svg>
);

const IconQuote = ({ size = 34, color = "#D3E4FE", className }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={24} viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M0 24V15C0 11 1.3 7.7 4 5C6.7 2.3 10 0.7 14 0L15.5 3C12.5 3.7 10.2 5 8.5 7C6.8 9 6 11.3 6 14H12V24H0ZM18 24V15C18 11 19.3 7.7 22 5C24.7 2.3 28 0.7 32 0L33.5 3C30.5 3.7 28.2 5 26.5 7C24.8 9 24 11.3 24 14H30V24H18Z" fill={color} />
  </svg>
);

const IconAlertTriangle = ({ size = 14, color = "#7C5400", className }: { size?: number; color?: string; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <path d="M7 1L13 12H1L7 1Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
    <path d="M7 5.5V8" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="7" cy="10" r="0.7" fill={color} />
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

/** Selisih (poin) dari rata-rata rapor yang dianggap kekuatan / kelemahan. */
const AMBANG_SELISIH = 3;

interface AnalitikData {
  me: SiswaSaya;
  asesmen: HasilAsesmen | null;
  nilai: DaftarNilai;
  target: DaftarTarget;
  prodi: DetailProdi | null;
  karir: DetailKarir | null;
}

type StatusMapel = "kuat" | "sejajar" | "kurang" | "kosong";

interface BarisMapel {
  id: number;
  nama: string;
  bobot: number;
  nilai: number | null;
  diambil: boolean;
  status: StatusMapel;
}

function rataRapor(nilai: DaftarNilai) {
  const valid = nilai.nilai.filter((n) => n.status !== "ditolak");
  if (!valid.length) return null;
  return valid.reduce((t, n) => t + Number(n.nilai), 0) / valid.length;
}

/** Rata-rata per semester (mapel tertentu saja bila `mapelIds` diisi). */
function trenSemester(nilai: DaftarNilai, mapelIds: Set<number> | null) {
  const per = new Map<number, number[]>();
  for (const n of nilai.nilai) {
    if (n.status === "ditolak" || !n.mapel) continue;
    if (mapelIds && !mapelIds.has(n.mapel.id)) continue;
    per.set(n.semester, [...(per.get(n.semester) ?? []), Number(n.nilai)]);
  }
  return [...per.entries()]
    .sort(([a], [b]) => a - b)
    .map(([sem, list]) => ({ sem, val: list.reduce((t, x) => t + x, 0) / list.length }));
}

function barisMapel(prodi: DetailProdi | null, me: SiswaSaya, rapor: number | null): BarisMapel[] {
  const diambil = new Set(me.mapel.map((m) => m.mapel.id));
  return (prodi?.mapel_pendukung ?? []).map((m) => {
    const nilai = m.nilai_terakhir_siswa == null ? null : Number(m.nilai_terakhir_siswa);
    let status: StatusMapel = "kosong";
    if (nilai !== null && rapor !== null) {
      status =
        nilai >= rapor + AMBANG_SELISIH ? "kuat" : nilai <= rapor - AMBANG_SELISIH ? "kurang" : "sejajar";
    }
    return { id: m.mapel.id, nama: m.mapel.nama, bobot: Number(m.bobot), nilai, diambil: diambil.has(m.mapel.id), status };
  });
}



// ── Target Hero Card ──────────────────────────────────────────────────────────

function TargetHeroCard({ data }: { data: AnalitikData }) {
  const { me, prodi, karir, asesmen } = data;
  const kodeSiswa = asesmen?.kode_holland ?? null;
  const cocok = skorKecocokan(prodi?.kode_riasec ?? null, kodeSiswa);
  const karirImpian = karir?.nama ?? data.target.karir[0]?.teks_bebas ?? "Belum dipilih";

  return (
    <section className="target-hero" aria-labelledby="target-hero-title">
      {/* Decorative blobs */}
      <div className="target-hero__blob1" aria-hidden="true" />
      <div className="target-hero__blob2" aria-hidden="true" />

      {/* Breadcrumb / label row */}
      <div className="target-hero__breadcrumb">
        <span className="target-hero__badge">
          <span className="target-hero__badge-dot" aria-hidden="true" />
          Laporan Analisis Keselarasan
        </span>
        <span className="target-hero__badge2">{prodi?.bidang_studi?.nama ?? "Bidang studi -"}</span>
      </div>

      {/* Inner: left + right */}
      <div className="target-hero__inner">
        {/* Left: program info */}
        <div className="target-hero__left">
          <div className="target-hero__program-row">
            <span className="target-hero__program-label">
              TARGET PRODI UTAMA &bull; {labelJenis(prodi?.jenis_pendidikan).toUpperCase()}
            </span>
            <IconGraduationCap size={16} color="#006190" />
          </div>

          <h1 className="target-hero__title" id="target-hero-title">
            {prodi?.nama ?? "-"}
          </h1>

          <div className="target-hero__tags">
            <span className="target-hero__tag">
              <IconBuilding size={15} color="#006190" />
              Karir Impian: {karirImpian}
            </span>
            <span className="target-hero__tag" style={{ background: "#EFF4FF" }}>
              <IconSchool size={17} color="#525E7E" />
              {me.profil.nama ?? "Siswa"}
              {me.profil.sekolah ? ` • ${me.profil.sekolah.nama}` : ""}
            </span>
          </div>
        </div>

        {/* Right: student & match */}
        <aside className="target-hero__right" aria-label="Kecocokan minat">
          <div className="target-hero__avatar" aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="22" cy="18" r="10" fill="#CBE6FF" />
              <ellipse cx="22" cy="38" rx="16" ry="10" fill="#CBE6FF" />
              <circle cx="22" cy="18" r="7" fill="#006190" opacity="0.3" />
            </svg>
          </div>
          <div className="target-hero__student-info">
            <span className="target-hero__cluster-label">Kecocokan Minat</span>
            <span className="target-hero__cluster-value">{cocok !== null ? `${cocok}%` : "–"}</span>
            <span className="target-hero__cluster-sub">
              {kodeSiswa ? `Prodi ${prodi?.kode_riasec ?? "-"} vs kamu ${kodeSiswa}` : "Belum tes minat"}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ── 4 Quick Metrics ───────────────────────────────────────────────────────────

function QuickMetrics({ data, baris }: { data: AnalitikData; baris: BarisMapel[] }) {
  const rapor = rataRapor(data.nilai);
  const mapel = data.prodi ? skorMapelPendukung(data.prodi.mapel_pendukung) : null;
  const diambil = baris.filter((b) => b.diambil).length;
  const linear = baris.length ? Math.round((diambil / baris.length) * 100) : null;
  const kodeSiswa = data.asesmen?.kode_holland ?? null;
  const cocok = skorKecocokan(data.prodi?.kode_riasec ?? null, kodeSiswa);

  const metrics = [
    {
      label: "Rata-Rata Mapel Pendukung",
      iconWrapClass: "metric-card__icon-wrap--blue",
      icon: <IconBarChart size={15} color="#006190" />,
      bigValue: mapel !== null ? mapel.toFixed(1) : "–",
      bigClass: "metric-card__big--brand",
      unit: "/100",
      unitClass: "metric-card__unit",
      footerIcon: <IconBookOpen size={13} color="#006190" />,
      footerText: `${baris.length} mapel pendukung prodi`,
      footerClass: "metric-card__footer-text--brand",
    },
    {
      label: "Rata-Rata Rapor",
      iconWrapClass: "metric-card__icon-wrap--purple",
      icon: <IconLayers size={12} color="#525E7E" />,
      bigValue: rapor !== null ? rapor.toFixed(1) : "–",
      bigClass: "metric-card__big--ink",
      unit: "/100",
      unitClass: "metric-card__unit--sm",
      footerIcon: <IconCalendar size={13} color="#525E7E" />,
      footerText: data.nilai.semester_maks ? `Semester 1–${data.nilai.semester_maks}` : "Belum ada nilai",
      footerClass: "metric-card__footer-text--muted",
    },
    {
      label: "Mapel Pendukung Diambil",
      iconWrapClass: "metric-card__icon-wrap--blue",
      icon: <IconGraduationCap size={12} color="#006190" />,
      bigValue: linear !== null ? `${linear}%` : "–",
      bigClass: "metric-card__big--ink",
      unit: "Linear",
      unitClass: "metric-card__unit--sm",
      footerIcon: <IconCheckCircle size={13} color="#006190" />,
      footerText: `${diambil} dari ${baris.length} mapel sedang kamu ambil`,
      footerClass: "metric-card__footer-text--brand",
    },
    {
      label: "Kecocokan Minat RIASEC",
      iconWrapClass: "metric-card__icon-wrap--amber",
      icon: <IconStar size={15} color="#7C5400" />,
      bigValue: cocok !== null ? `${cocok}%` : "–",
      bigClass: "metric-card__big--amber",
      unit: kodeSiswa ?? "",
      unitClass: "metric-card__unit--sm",
      footerIcon: <IconAlertTriangle size={11} color="#7C5400" />,
      footerText: kodeSiswa ? `Kode prodi: ${data.prodi?.kode_riasec ?? "-"}` : "Kerjakan tes minat dulu",
      footerClass: "metric-card__footer-text--amber",
    },
  ];

  return (
    <section aria-label="Metrik Cepat Analisis">
      <div className="metrics-row">
        {metrics.map((m) => (
          <article key={m.label} className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">{m.label}</span>
              <span className={`metric-card__icon-wrap ${m.iconWrapClass}`} aria-hidden="true">
                {m.icon}
              </span>
            </div>
            <div className="metric-card__value-row">
              <span className={`metric-card__big ${m.bigClass}`}>{m.bigValue}</span>
              <span className={m.unitClass}>{m.unit}</span>
            </div>
            <div className="metric-card__footer">
              <span aria-hidden="true">{m.footerIcon}</span>
              <span className={`metric-card__footer-text ${m.footerClass}`}>{m.footerText}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Sticky Action Bar ─────────────────────────────────────────────────────────

function ActionBar({ data }: { data: AnalitikData }) {
  const { me } = data;
  return (
    <div className="action-bar-wrap" role="toolbar" aria-label="Aksi halaman">
      <div className="action-bar">
        <div className="action-bar__left">
          <span className="action-bar__icon-wrap" aria-hidden="true">
            <IconBookOpen size={12} color="#006190" />
          </span>
          <div className="action-bar__text">
            <span className="action-bar__title">Analisis Keselarasan: {data.prodi?.nama ?? "-"}</span>
            <span className="action-bar__sub">
              {[me.profil.nama, me.profil.sekolah?.nama, infoKelas(me)].filter(Boolean).join(" • ")}
            </span>
          </div>
        </div>

        <div className="action-bar__right">
          <Link className="btn-ghost-pill-sm" href="/rekomendasi">
            <IconGraduationCap size={13} color="#0B1C30" />
            Alternatif Prodi
          </Link>
          <button className="btn-ghost-pill-sm btn-ghost-pill-sm--blue" type="button">
            <IconMessage size={15} color="#006190" />
            Konsultasi BK
          </button>
          <button className="btn-primary-pill-lg" type="button" onClick={() => window.print()}>
            <IconDownload size={16} color="#FFFFFF" />
            Cetak Laporan Analisis Keselarasan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gap Analysis Section ──────────────────────────────────────────────────────

const STATUS_UI: Record<StatusMapel, { badge: string; deficit: boolean; iconBox: string }> = {
  kuat: { badge: "Kekuatan", deficit: false, iconBox: "subject-row__icon-box--brand" },
  sejajar: { badge: "Sejajar Rata-rata", deficit: false, iconBox: "subject-row__icon-box--blue" },
  kurang: { badge: "Perlu Ditingkatkan", deficit: true, iconBox: "subject-row__icon-box--amber" },
  kosong: { badge: "Belum Ada Nilai", deficit: false, iconBox: "subject-row__icon-box--muted" },
};

function GapAnalysisSection({ baris, rapor }: { baris: BarisMapel[]; rapor: number | null }) {
  return (
    <article className="section-card" aria-labelledby="gap-analysis-title">
      <div className="sc-header">
        <div className="sc-header__left">
          <div className="sc-header__title-row">
            <IconBarChart size={18} color="#006190" aria-hidden="true" />
            <h2 className="sc-header__title" id="gap-analysis-title">
              Analisis Kesenjangan Mapel Pendukung
            </h2>
          </div>
          <p className="sc-header__subtitle">
            Nilai terakhirmu pada mapel pendukung prodi target, dibandingkan dengan rata-rata
            rapormu sendiri
          </p>
        </div>
        <span className="sc-header__badge">
          Acuan: rata-rata rapor {rapor !== null ? rapor.toFixed(1) : "–"}
        </span>
      </div>

      {baris.length === 0 && (
        <p className="sc-header__subtitle">Prodi ini belum punya data mapel pendukung.</p>
      )}

      <div className="gap-rows" role="list" aria-label="Daftar analisis mata pelajaran">
        {baris.map((s) => {
          const ui = STATUS_UI[s.status];
          const selisih = s.nilai !== null && rapor !== null ? s.nilai - rapor : null;
          return (
            <div
              key={s.id}
              className={`subject-row${ui.deficit ? " subject-row--deficit" : ""}`}
              role="listitem"
              aria-label={`Mata pelajaran ${s.nama}`}
            >
              <div className="subject-row__top">
                <div className="subject-row__left">
                  <span className={`subject-row__icon-box ${ui.iconBox}`} aria-hidden="true">
                    {ui.deficit ? (
                      <IconAlertTriangle size={18} color="#FFFFFF" />
                    ) : (
                      <IconPencil size={15} color="#FFFFFF" />
                    )}
                  </span>
                  <div className="subject-row__meta">
                    <span className="subject-row__name">{s.nama}</span>
                    <span className={`subject-row__category${ui.deficit ? " subject-row__category--deficit" : ""}`}>
                      Bobot {s.bobot} &bull; {s.diambil ? "Sedang kamu ambil" : "Belum kamu ambil"}
                    </span>
                  </div>
                </div>
                <div className="subject-row__right">
                  <span className="subject-row__score">{s.nilai !== null ? s.nilai.toFixed(1) : "–"}</span>
                  <span className="subject-row__score-unit">
                    Rata: {rapor !== null ? rapor.toFixed(1) : "–"}
                  </span>
                  <span
                    className={`subject-row__badge ${ui.deficit ? "subject-row__badge--amber" : "subject-row__badge--brand"}`}
                  >
                    {ui.badge}
                  </span>
                </div>
              </div>

              <div className="subject-row__bar-wrap">
                <div className="subject-row__track" role="presentation">
                  <div
                    className={`subject-row__fill ${ui.deficit ? "subject-row__fill--amber" : "subject-row__fill--brand"}`}
                    style={{ width: `${s.nilai ?? 0}%` }}
                  />
                  {rapor !== null && (
                    <div
                      className={`subject-row__divider${ui.deficit ? " subject-row__divider--deficit" : ""}`}
                      style={{ left: `${rapor}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="subject-row__bar-labels">
                  <span className="subject-row__bar-label">
                    Nilaimu: {s.nilai !== null ? s.nilai.toFixed(1) : "belum ada"}
                  </span>
                  <span
                    className={`subject-row__bar-label ${ui.deficit ? "subject-row__bar-label--amber" : "subject-row__bar-label--brand"}`}
                  >
                    {selisih !== null
                      ? `Selisih: ${selisih >= 0 ? "+" : ""}${selisih.toFixed(1)} dari rata-rata`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

// ── Action Plan Section ───────────────────────────────────────────────────────

function ActionPlanSection({ data, baris }: { data: AnalitikData; baris: BarisMapel[] }) {
  const langkah: { title: string; desc: string; footer: string; tone: "brand" | "muted" | "amber" }[] = [];

  for (const b of [...baris].filter((x) => x.status === "kurang").sort((a, b) => (a.nilai ?? 0) - (b.nilai ?? 0))) {
    langkah.push({
      title: `Tingkatkan Nilai ${b.nama}`,
      desc: `Nilai terakhirmu ${b.nilai?.toFixed(1)} masih di bawah rata-rata rapormu, padahal mapel ini pendukung ${data.prodi?.nama}.`,
      footer: "Prioritas tinggi",
      tone: "amber",
    });
  }
  for (const b of baris.filter((x) => !x.diambil)) {
    langkah.push({
      title: `Pertimbangkan Mapel ${b.nama}`,
      desc: `${b.nama} adalah mapel pendukung prodi target tetapi belum tercatat sebagai mapel yang kamu ambil.`,
      footer: "Diskusikan dengan BK",
      tone: "muted",
    });
  }
  if (!data.asesmen) {
    langkah.push({
      title: "Kerjakan Tes Minat RIASEC",
      desc: "Hasil tes minat dibutuhkan untuk menilai kecocokan prodi target dengan profil minatmu.",
      footer: "Buka menu Tes Minat",
      tone: "brand",
    });
  }
  if (data.target.karir.length === 0) {
    langkah.push({
      title: "Simpan Karir Impian",
      desc: "Pilih karir impian di Eksplorasi Karir agar keselarasan prodi dan karir bisa dianalisis.",
      footer: "Buka Eksplorasi Karir",
      tone: "brand",
    });
  }
  if (langkah.length === 0) {
    langkah.push({
      title: "Pertahankan Konsistensi Nilai",
      desc: "Semua mapel pendukung sudah sejajar atau di atas rata-rata rapormu. Pertahankan hingga semester akhir.",
      footer: "Terus pantau",
      tone: "brand",
    });
  }

  return (
    <article className="section-card" aria-labelledby="action-plan-title">
      <div className="sc-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="sc-icon-box sc-icon-box--circle" aria-hidden="true">
            <IconCalendar size={16} color="#FFFFFF" />
          </span>
          <div>
            <h2 className="sc-header__title" id="action-plan-title">Rencana Aksi</h2>
            <p className="sc-header__subtitle">
              Disusun otomatis dari kesenjangan mapel pendukung dan kelengkapan datamu
            </p>
          </div>
        </div>
      </div>

      <div className="action-plan-grid">
        {langkah.slice(0, 3).map((plan, idx) => (
          <div key={plan.title} className="action-plan-card">
            <div className="action-plan-card__body">
              <span className={`action-plan-card__tag action-plan-card__tag--${plan.tone}`}>
                LANGKAH {idx + 1}
              </span>
              <h3 className="action-plan-card__title">{plan.title}</h3>
              <p className="action-plan-card__desc">{plan.desc}</p>
            </div>
            <div className="action-plan-card__footer">
              <span aria-hidden="true">
                {plan.tone === "amber" ? (
                  <IconAlertTriangle size={14} color="#7C5400" />
                ) : plan.tone === "muted" ? (
                  <IconChevronRight size={5} color="#525E7E" />
                ) : (
                  <IconCheckCircle size={13} color="#006190" />
                )}
              </span>
              <span className={`action-plan-card__footer-text action-plan-card__footer-text--${plan.tone}`}>
                {plan.footer}
              </span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

// ── Inline SVG Line Chart ─────────────────────────────────────────────────────

function NilaiKonsistensiChart({ data }: { data: AnalitikData }) {
  const idPendukung = new Set(data.prodi?.mapel_pendukung.map((m) => m.mapel.id) ?? []);
  let tren = trenSemester(data.nilai, idPendukung.size ? idPendukung : null);
  let lingkup = "Rata-rata nilai mapel pendukung prodi target";
  if (tren.length === 0) {
    tren = trenSemester(data.nilai, null);
    lingkup = "Rata-rata nilai semua mapel";
  }

  if (tren.length === 0) {
    return (
      <article className="section-card chart-section" aria-labelledby="chart-title">
        <div className="sc-header">
          <div className="sc-header__left">
            <h2 className="sc-header__title" id="chart-title">Tren Nilai Rapor</h2>
            <p className="sc-header__subtitle">Belum ada nilai rapor yang diinput.</p>
          </div>
        </div>
      </article>
    );
  }

  // viewBox: 0 0 428 180, area grafik x: 65..380, y: 20..140
  const vals = tren.map((t) => t.val);
  const min = Math.floor(Math.min(...vals) - 2);
  const max = Math.ceil(Math.max(...vals) + 2);
  const yOf = (v: number) => 140 - ((v - min) / (max - min || 1)) * 120;
  const pts = tren.map((t, i) => ({
    x: tren.length === 1 ? 220 : 65 + (i * 315) / (tren.length - 1),
    y: yOf(t.val),
    val: t.val.toFixed(1),
    sem: `Semester ${t.sem}`,
  }));
  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * (3 - i)) / 3);

  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${pts[pts.length - 1].x} 155 L ${pts[0].x} 155 Z`;
  const delta = vals[vals.length - 1] - vals[0];
  const naik = delta >= 0;

  return (
    <article className="section-card chart-section" aria-labelledby="chart-title">
      <div className="sc-header">
        <div className="sc-header__left">
          <h2 className="sc-header__title" id="chart-title">
            Tren Nilai Rapor (Sem {tren[0].sem} - {tren[tren.length - 1].sem})
          </h2>
          <p className="sc-header__subtitle">{lingkup}</p>
        </div>
        {tren.length > 1 && (
          <span className="chart-badge">
            {naik ? "+" : ""}
            {delta.toFixed(1)} poin
          </span>
        )}
      </div>

      <div
        className="chart-svg-wrap"
        role="img"
        aria-label={`Grafik tren nilai: ${tren.map((t) => `semester ${t.sem} ${t.val.toFixed(1)}`).join(", ")}`}
      >
        <svg viewBox="0 0 428 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1="65" y1={yOf(v)} x2="420" y2={yOf(v)} stroke="rgba(0,97,144,0.08)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="8" y={yOf(v) + 5} fontFamily="Plus Jakarta Sans" fontSize="10" fill="#3F4850">
                {v.toFixed(0)}
              </text>
            </g>
          ))}

          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#006190" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#006190" stopOpacity="0" />
            </linearGradient>
          </defs>
          {pts.length > 1 && <path d={areaD} fill="url(#areaGrad)" />}
          {pts.length > 1 && (
            <path d={lineD} stroke="#006190" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {pts.map((p, i) => (
            <g key={p.sem}>
              <text
                x={p.x}
                y="170"
                fontFamily="Plus Jakarta Sans"
                fontSize="11"
                fill="#3F4850"
                textAnchor="middle"
                fontWeight={i === pts.length - 1 ? "600" : "400"}
              >
                {p.sem}
              </text>
              {i < pts.length - 1 ? (
                <circle cx={p.x} cy={p.y} r="6" fill="#FFFFFF" stroke="#006190" strokeWidth="3" />
              ) : (
                <circle cx={p.x} cy={p.y} r="7" fill="#006190" stroke="#FFFFFF" strokeWidth="2" />
              )}
              <text
                x={p.x}
                y={p.y - 12}
                fontFamily="Plus Jakarta Sans"
                fontSize={i === pts.length - 1 ? "12" : "11"}
                fill="#006190"
                textAnchor="middle"
                fontWeight="700"
              >
                {p.val}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="chart-insight">
        <span className="chart-insight__text">
          {tren.length > 1 ? (naik ? "Tren nilai meningkat." : "Tren nilai menurun.") : "Baru ada satu semester."}
        </span>
        <span className="chart-insight__strong">
          {naik ? <IconTrendUp size={13} color="#006190" /> : <IconTrendDown size={13} color="#7C5400" />}{" "}
          Terakhir: {vals[vals.length - 1].toFixed(1)}
        </span>
      </div>
    </article>
  );
}

// ── Career Map Section ────────────────────────────────────────────────────────

function CareerMapSection({ karir, teksBebas }: { karir: DetailKarir | null; teksBebas: string | null }) {
  return (
    <article className="section-card" aria-labelledby="career-title">
      <div className="sc-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            width: 36, height: 36, background: "#E5EEFF", borderRadius: 12, flexShrink: 0
          }} aria-hidden="true">
            <IconBriefcase size={18} color="#006190" />
          </span>
          <h2 className="sc-header__title" id="career-title">Peta Karir Impian</h2>
        </div>
        {karir?.is_trending && (
          <span style={{
            padding: "2px 10px", background: "#D9E2FF", borderRadius: 9999,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.44px", color: "#0D1A37", whiteSpace: "nowrap"
          }}>
            Trending
          </span>
        )}
      </div>

      {!karir ? (
        <p className="sc-header__subtitle">
          {teksBebas ? `Karir impianmu: ${teksBebas} (belum terhubung ke katalog). ` : "Kamu belum menyimpan karir impian. "}
          <Link href="/eksplorasi-karir">Cari di Eksplorasi Karir</Link>
        </p>
      ) : (
        <>
          <div className="career-banner" aria-label={`Banner karir ${karir.nama}`}>
            <div className="career-banner__bg" aria-hidden="true" />
            <div className="career-banner__overlay" aria-hidden="true" />
            <div className="career-banner__content">
              <h3 className="career-banner__title">{karir.nama}</h3>
              <p className="career-banner__sub">{karir.bidang_karir?.nama ?? "Bidang karir -"}</p>
            </div>
          </div>

          <div className="career-metrics">
            <div className="career-metric-box">
              <div className="career-metric-box__label">Kode RIASEC</div>
              <div style={{ marginTop: 4 }}>
                <span className="career-metric-box__value">{karir.kode_riasec ?? "-"}</span>
              </div>
            </div>
            <div className="career-metric-box">
              <div className="career-metric-box__label">Prodi Relevan</div>
              <div style={{ marginTop: 4 }}>
                <span className="career-metric-box__value">{karir.prodi_relevan.length}</span>
                <span className="career-metric-box__unit"> prodi</span>
              </div>
            </div>
          </div>

          {karir.prodi_relevan.length > 0 && (
            <div>
              <p className="skill-chips-label">Prodi yang Mengarah ke Karir Ini:</p>
              <div className="skill-chips">
                {karir.prodi_relevan.map((p) => (
                  <span key={p.id} className="skill-chip">{p.nama}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}

// ── BK Teacher Validation ─────────────────────────────────────────────────────

function BKValidationSection({ sekolah }: { sekolah: string | null }) {
  return (
    <article className="section-card" aria-labelledby="bk-section-title">
      <div className="sc-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="sc-icon-box sc-icon-box--circle" aria-hidden="true">
            <IconUser size={15} color="#FFFFFF" />
          </span>
          <div>
            <h2 className="sc-header__title" id="bk-section-title">
              Catatan &amp; Validasi Guru Pembimbing BK
            </h2>
            <p className="sc-header__subtitle">{sekolah ?? "Belum terhubung ke sekolah"}</p>
          </div>
        </div>
      </div>

      <div className="bk-quote-box">
        <div className="bk-quote-box__watermark" aria-hidden="true">
          <IconQuote size={34} color="#D3E4FE" />
        </div>
        <blockquote className="bk-quote-text">
          Belum ada catatan dari Guru BK. Catatan dan validasi akan tampil di sini setelah
          Guru BK meninjau target prodimu.
        </blockquote>
      </div>
    </article>
  );
}



// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalitikPage() {
  const [data, setData] = useState<AnalitikData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    (async () => {
      const [me, asesmen, nilai, target] = await Promise.all([
        getMe(),
        terakhirAsesmen(),
        daftarNilai(),
        getTarget(),
      ]);
      const utama = target.prodi.find((t) => t.is_utama) ?? target.prodi[0];
      const karirId = target.karir.find((k) => k.karir)?.karir?.id;
      const [prodi, karir] = await Promise.all([
        utama?.prodi ? detailProdi(utama.prodi.id) : null,
        karirId ? detailKarir(karirId) : null,
      ]);
      if (!batal) setData({ me, asesmen, nilai, target, prodi, karir });
    })().catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, []);

  const rapor = data ? rataRapor(data.nilai) : null;
  const baris = useMemo(() => (data ? barisMapel(data.prodi, data.me, rapor) : []), [data, rapor]);

  return (
    <div className="page-analitik">
      <UnifiedNavbar peran="siswa" customUser={{ nama: data?.me.profil.nama, kelas: infoKelas(data?.me ?? null) }} />

      <main className="ak-main" id="main-content">
        <div className="ak-container">
          {!data && (
            <p className="sc-header__subtitle" role={error ? "alert" : "status"}>
              {error ?? "Memuat analisis keselarasan..."}
            </p>
          )}

          {data && !data.prodi && (
            <section className="section-card">
              <h1 className="sc-header__title">Belum ada target prodi</h1>
              <p className="sc-header__subtitle">
                Analisis keselarasan membandingkan nilai dan minatmu dengan target prodi utama.
                Pilih target dulu dari <Link href="/rekomendasi">Rekomendasi</Link> atau{" "}
                <Link href="/katalog-prodi">Katalog Prodi</Link>.
              </p>
            </section>
          )}

          {data?.prodi && (
            <>
              {/* 1. Target overview hero card */}
              <TargetHeroCard data={data} />

              {/* 2. 4 Quick metrics */}
              <QuickMetrics data={data} baris={baris} />

              {/* 3. Sticky Action Bar */}
              <ActionBar data={data} />

              {/* 4. Two-column main grid */}
              <div className="ak-grid">
                <div className="ak-col-left">
                  <GapAnalysisSection baris={baris} rapor={rapor} />
                  <ActionPlanSection data={data} baris={baris} />
                </div>

                <div className="ak-col-right">
                  <NilaiKonsistensiChart data={data} />
                  <CareerMapSection
                    karir={data.karir}
                    teksBebas={data.target.karir.find((k) => k.teks_bebas)?.teks_bebas ?? null}
                  />
                  <BKValidationSection sekolah={data.me.profil.sekolah?.nama ?? null} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
