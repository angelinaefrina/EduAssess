"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../../styles/katalog-prodi.css";
import { UnifiedNavbar } from "../../../components/shared/UnifiedNavbar";

import {
  IconCompass,
  IconSearch,
  IconBell,
  IconUser,
  IconShieldSync,
  IconBuilding,
  IconBook,
  IconGraduationCap,
  IconTarget,
  IconSliders,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconCheck,
  IconLocationPin,
  IconSparkles,
  IconLock,
  IconScale,
  IconExternalLink,
  IconCounselor,
  IconCompare,
  IconArrowRight,
  IconMenu,
  CampusBannerUI,
  CampusBannerITB,
  CampusBannerPENS,
  CampusBannerUGM,
  CampusBannerSSN,
  CampusBannerUNAIR,
} from "../../../components/siswa/KatalogIcons";
import { daftarBidangStudi, daftarProdi } from "../../../lib/api/katalog";
import { getTarget, hapusTargetProdi, tambahTargetProdi, terakhirAsesmen } from "../../../lib/api/rekomendasi";
import { getMe } from "../../../lib/api/siswa";
import type {
  BidangStudi,
  DaftarTarget,
  HasilAsesmen,
  JenisPendidikan,
  ProdiRingkas,
  SiswaSaya,
  TipeRiasec,
} from "../../../lib/api/types";
import { infoKelas, labelJenis, NAMA_RIASEC, pesanError, skorKecocokan } from "../../../lib/riasec";

// Banner kampus hanya dekoratif (katalog berbasis prodi, bukan per kampus).
const BANNERS = [
  CampusBannerUI,
  CampusBannerITB,
  CampusBannerPENS,
  CampusBannerUGM,
  CampusBannerSSN,
  CampusBannerUNAIR,
];

const PAGE_SIZE = 12;

const JENIS_OPSI: { id: "" | JenisPendidikan; label: string }[] = [
  { id: "", label: "Semua" },
  { id: "akademik", label: "Akademik" },
  { id: "vokasi", label: "Vokasi" },
];

type Tema = "blue" | "slate" | "amber";

const isDraf = (p: ProdiRingkas) => /belum/i.test(p.catatan_sumber ?? "");

export default function KatalogProdiPage() {
  // ── Data dari backend ──────────────────────────────────────────────────────
  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [asesmen, setAsesmen] = useState<HasilAsesmen | null>(null);
  const [target, setTarget] = useState<DaftarTarget>({ karir: [], prodi: [] });
  const [bidangList, setBidangList] = useState<BidangStudi[]>([]);
  const [items, setItems] = useState<ProdiRingkas[]>([]);
  const [total, setTotal] = useState(0);
  const [totalSemua, setTotalSemua] = useState<number | null>(null);
  /** Kunci parameter terakhir yang selesai dimuat; beda = sedang memuat. */
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [riasecEnabled, setRiasecEnabled] = useState(true);
  const [sortBy, setSortBy] = useState<"cocok" | "nama">("cocok");
  const [activePage, setActivePage] = useState(1);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareList, setCompareList] = useState<ProdiRingkas[]>([]);
  const [jenis, setJenis] = useState<"" | JenisPendidikan>("");
  const [bidang, setBidang] = useState("");

  const kodeSiswa = asesmen?.kode_holland ?? null;

  const cari = (q: string) => {
    setQuery(q);
    setActivePage(1);
  };

  // Data awal: profil, hasil tes minat, target, bidang studi. ?q= dari halaman lain.
  useEffect(() => {
    let batal = false;
    Promise.all([getMe(), terakhirAsesmen(), getTarget(), daftarBidangStudi()])
      .then(([m, a, t, b]) => {
        if (batal) return;
        const q = new URLSearchParams(window.location.search).get("q");
        if (q) {
          setSearchTerm(q);
          cari(q);
        }
        setMe(m);
        setAsesmen(a);
        setTarget(t);
        setBidangList(b);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, []);

  // Pencarian di-debounce agar tidak memanggil API per ketikan.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm.trim() !== query) cari(searchTerm.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm, query]);

  const paramKey = JSON.stringify([query, jenis, bidang, activePage]);
  const loading = loadedKey !== paramKey;

  useEffect(() => {
    let batal = false;
    daftarProdi({
      q: query || undefined,
      jenis: jenis || undefined,
      bidang_studi: bidang || undefined,
      limit: PAGE_SIZE,
      offset: (activePage - 1) * PAGE_SIZE,
    })
      .then((hal) => {
        if (batal) return;
        setItems(hal.items);
        setTotal(hal.total);
        if (!query && !jenis && !bidang) setTotalSemua(hal.total);
        setError(null);
      })
      .catch((err) => !batal && setError(pesanError(err)))
      .finally(() => !batal && setLoadedKey(JSON.stringify([query, jenis, bidang, activePage])));
    return () => {
      batal = true;
    };
  }, [query, jenis, bidang, activePage]);

  const targetPerProdi = useMemo(
    () => new Map(target.prodi.filter((t) => t.prodi).map((t) => [t.prodi!.id, t.id])),
    [target]
  );

  const cards = useMemo(() => {
    const list = items.map((p) => ({ p, match: skorKecocokan(p.kode_riasec, kodeSiswa) }));
    if (sortBy === "nama") return list.sort((a, b) => a.p.nama.localeCompare(b.p.nama));
    if (!riasecEnabled) return list;
    return list.sort((a, b) => (b.match ?? 0) - (a.match ?? 0));
  }, [items, kodeSiswa, sortBy, riasecEnabled]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(activePage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [activePage, totalPages]);

  const toggleLockTarget = async (p: ProdiRingkas) => {
    if (busyId) return;
    setBusyId(p.id);
    try {
      const targetId = targetPerProdi.get(p.id);
      if (targetId) {
        const prodi = await hapusTargetProdi(targetId);
        setTarget((t) => ({ ...t, prodi }));
      } else {
        const baru = await tambahTargetProdi({ prodi_id: p.id, sumber: "katalog" });
        setTarget((t) => ({ ...t, prodi: [...t.prodi.filter((x) => x.id !== baru.id), baru] }));
      }
    } catch (err) {
      alert(pesanError(err));
    } finally {
      setBusyId(null);
    }
  };

  const toggleCompare = (p: ProdiRingkas) => {
    setCompareList((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 4) return [...prev.slice(1), p];
      return [...prev, p];
    });
  };

  const simpanSemuaPerbandingan = async () => {
    try {
      for (const p of compareList) {
        if (targetPerProdi.has(p.id)) continue;
        const baru = await tambahTargetProdi({ prodi_id: p.id, sumber: "katalog" });
        setTarget((t) => ({ ...t, prodi: [...t.prodi.filter((x) => x.id !== baru.id), baru] }));
      }
      setCompareModalOpen(false);
    } catch (err) {
      alert(pesanError(err));
    }
  };

  const namaBidang = bidang ? bidangList.find((b) => b.kode === bidang)?.nama ?? bidang : "Semua";
  const labelRiasec = kodeSiswa
    ? `Minat RIASEC: ${NAMA_RIASEC[kodeSiswa[0] as TipeRiasec] ?? kodeSiswa} (${kodeSiswa})`
    : "Minat RIASEC: belum tes minat";
  const namaSiswa = me?.profil.nama ?? "Siswa";

  return (
    <div className="kp-page">
      {/* ── Ambient Background Glows ── */}
      <div className="kp-ambient-glow-1" aria-hidden="true" />
      <div className="kp-ambient-glow-2" aria-hidden="true" />

      <UnifiedNavbar peran="siswa" customUser={{ nama: namaSiswa, kelas: infoKelas(me) }} />

      {/* ═════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═════════════════════════════════════════════════════════════════════ */}
      <main className="kp-main">
        {/* ── SECTION 1: HERO HEADER & STATS ROW ── */}
        <section className="kp-hero-section" aria-label="Hero Katalog Kampus">
          <div className="kp-hero-top">
            <div className="kp-hero-content">

              {/* Title & Description */}
              <h1 className="kp-hero-title">Katalog Program Studi</h1>
              <p className="kp-hero-desc">
                Telusuri program studi berdasarkan bidang studi dan jenis pendidikan,
                lihat kecocokannya dengan minat RIASEC-mu, lalu simpan prodi yang ingin
                kamu jadikan target.
              </p>
            </div>

            {/* Right Action Buttons */}
            <div className="kp-hero-actions">
              <div className="kp-sync-pill">
                <div className="kp-sync-icon-box">
                  <IconShieldSync size={20} color="#006190" />
                </div>
                <div className="kp-sync-meta">
                  <span className="kp-sync-title">Sumber Data</span>
                  <span className="kp-sync-status">Database Katalog</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Stat Cards */}
          <div className="kp-stats-row">
            {/* Card 1 */}
            <div className="kp-stat-card">
              <div className="kp-stat-info">
                <span className="kp-stat-label">PROGRAM STUDI</span>
                <div className="kp-stat-value-group">
                  <span className="kp-stat-number">
                    {totalSemua?.toLocaleString("id-ID") ?? "–"}
                  </span>
                  <span className="kp-stat-sub">Terdata</span>
                </div>
              </div>
              <div className="kp-stat-icon-wrapper blue-soft">
                <IconBuilding size={22} color="#006190" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="kp-stat-card">
              <div className="kp-stat-info">
                <span className="kp-stat-label">BIDANG STUDI</span>
                <div className="kp-stat-value-group">
                  <span className="kp-stat-number">{bidangList.length || "–"}</span>
                  <span className="kp-stat-sub">Rumpun</span>
                </div>
              </div>
              <div className="kp-stat-icon-wrapper slate-soft">
                <IconBook size={22} color="#525E7F" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="kp-stat-card">
              <div className="kp-stat-info">
                <span className="kp-stat-label">TARGET PRODI KAMU</span>
                <div className="kp-stat-value-group">
                  <span className="kp-stat-number">{target.prodi.length}</span>
                  <span className="kp-stat-sub amber">Tersimpan</span>
                </div>
              </div>
              <div className="kp-stat-icon-wrapper amber-soft">
                <IconGraduationCap size={22} color="#7C5400" />
              </div>
            </div>

            {/* Card 4 */}
            <div className="kp-stat-card">
              <div className="kp-stat-info">
                <span className="kp-stat-label">PROFIL MINAT KAMU</span>
                <div className="kp-stat-value-group">
                  <span className="kp-stat-number">{kodeSiswa ?? "–"}</span>
                  <span className="kp-stat-sub muted">
                    {kodeSiswa ? "Kode Holland" : "Belum tes minat"}
                  </span>
                </div>
              </div>
              <div className="kp-stat-icon-wrapper blue-dark">
                <IconTarget size={22} color="#FFFFFF" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: SEARCH & FILTER CONTROL STATION ── */}
        <section
          className="kp-search-station"
          aria-label="Pencarian dan Filter Prodi"
        >
          {/* Main Search Bar Row */}
          <div className="kp-search-bar-row">
            <div className="kp-search-input-box">
              <div className="kp-search-leading-icon">
                <IconSearch size={18} color="#6F7881" />
              </div>
              <input
                id="search-input"
                type="text"
                className="kp-search-input"
                placeholder="Cari nama program studi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") cari(searchTerm.trim());
                }}
              />
              <div className="kp-search-trailing">
                <span className="kp-kbd-badge">⌘K</span>
                {searchTerm && (
                  <button
                    type="button"
                    className="kp-clear-btn"
                    onClick={() => setSearchTerm("")}
                    title="Bersihkan Pencarian"
                    aria-label="Bersihkan pencarian"
                  >
                    <IconClose size={10} color="#3F4850" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="kp-btn-apply-filter"
              onClick={() => cari(searchTerm.trim())}
            >
              <IconSliders size={16} color="#FFFFFF" />
              <span>Terapkan Filter</span>
            </button>
          </div>

          {/* Filter Dropdown Pills & RIASEC Toggle */}
          <div className="kp-filters-row">
            <div className="kp-filter-pills-group">
              {/* Jenis pendidikan */}
              <button
                type="button"
                className="kp-filter-pill-btn"
                onClick={() => {
                  const idx = JENIS_OPSI.findIndex((o) => o.id === jenis);
                  setJenis(JENIS_OPSI[(idx + 1) % JENIS_OPSI.length].id);
                  setActivePage(1);
                }}
              >
                <span>Jenis:</span>
                <span className="kp-pill-val-blue">
                  {JENIS_OPSI.find((o) => o.id === jenis)?.label}
                </span>
                <IconChevronDown size={12} color="#0B1C30" />
              </button>

              {/* Bidang studi */}
              <button
                type="button"
                className={`kp-filter-pill-btn ${bidang ? "active" : ""}`}
                disabled={bidangList.length === 0}
                onClick={() => {
                  const kode = ["", ...bidangList.map((b) => b.kode)];
                  setBidang(kode[(kode.indexOf(bidang) + 1) % kode.length]);
                  setActivePage(1);
                }}
              >
                {bidang && <IconCheck size={12} color="#006190" />}
                <span>Bidang:</span>
                <span className="kp-pill-val-dark">{namaBidang}</span>
                <IconChevronDown size={12} color="#0B1C30" />
              </button>
            </div>

            {/* Personalized RIASEC Match Toggle Switch */}
            <div
              className="kp-riasec-toggle-pill"
              onClick={() => setRiasecEnabled(!riasecEnabled)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setRiasecEnabled(!riasecEnabled);
              }}
            >
              <span className="kp-riasec-dot" />
              <span className="kp-riasec-label">{labelRiasec}</span>
              <div
                className={`kp-switch-track ${riasecEnabled ? "on" : ""}`}
                aria-label="Toggle urut berdasarkan minat RIASEC"
              >
                <div className="kp-switch-thumb" />
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: FILTER CONTEXT BREADCRUMB & SORTING ── */}
        <div className="kp-context-bar">
          <div className="kp-context-text">
            <span>
              Menampilkan {cards.length} dari {total} prodi untuk kata kunci &quot;
              {query || "Semua Prodi"}&quot;
            </span>
            <span className="kp-context-sep" />
            <span className="kp-context-sub">
              {kodeSiswa
                ? `Kecocokan dihitung dari kode RIASEC tes minat terakhirmu (${kodeSiswa})`
                : "Kerjakan tes minat untuk melihat kecocokan prodi"}
            </span>
          </div>

          <div className="kp-sort-group">
            <span className="kp-sort-label">Urutkan:</span>
            <button
              type="button"
              className={`kp-sort-option ${sortBy === "cocok" ? "active" : ""}`}
              onClick={() => setSortBy("cocok")}
            >
              Kecocokan Minat Tertinggi
            </button>
            <span className="kp-sort-divider">|</span>
            <button
              type="button"
              className={`kp-sort-option ${sortBy === "nama" ? "active" : ""}`}
              onClick={() => setSortBy("nama")}
            >
              Nama (A–Z)
            </button>
          </div>
        </div>

        {/* ── SECTION 4: 3-COLUMN CARDS GRID (RESPONSIVE PC / LAPTOP / HP) ── */}
        {(error || loading || cards.length === 0) && (
          <p className="kp-context-sub" role={error ? "alert" : "status"} style={{ padding: "24px 0" }}>
            {error ?? (loading ? "Memuat katalog prodi..." : "Tidak ada prodi yang cocok dengan filter ini.")}
          </p>
        )}

        <section className="kp-cards-grid" aria-label="Daftar Program Studi">
          {!error &&
            cards.map(({ p, match }, idx) => {
              const isLocked = targetPerProdi.has(p.id);
              const isCompared = compareList.some((x) => x.id === p.id);
              const isVokasi = p.jenis_pendidikan.includes("vokasi");
              const tema: Tema = isVokasi ? "amber" : idx % 2 ? "slate" : "blue";
              const BannerComponent = BANNERS[idx % BANNERS.length];

              return (
                <article key={p.id} className="kp-card">
                  {/* Visual Banner Header */}
                  <div className="kp-card-banner">
                    <BannerComponent />
                    <div className="kp-banner-gradient" />

                    {/* Top Badges */}
                    <div className="kp-banner-top-badges">
                      <span className={`kp-glass-badge ${isDraf(p) ? "amber-text" : ""}`}>
                        {isDraf(p) ? (
                          <IconSparkles size={11} color="#7C5400" />
                        ) : (
                          <IconCheck size={11} color="#006190" />
                        )}
                        <span>{isDraf(p) ? "Data draf" : `RIASEC ${p.kode_riasec ?? "-"}`}</span>
                      </span>

                      <span className={`kp-solid-badge ${tema === "slate" ? "slate" : isVokasi ? "soft-blue" : ""}`}>
                        <IconLocationPin size={10} color="currentColor" style={{ marginRight: 4 }} />
                        <span>{p.bidang_studi?.nama ?? "-"}</span>
                      </span>
                    </div>

                    {/* Bottom Match Pill */}
                    <div className={`kp-match-pill ${tema}`}>
                      <IconSparkles
                        size={13}
                        color={tema === "amber" ? "#7C5400" : tema === "slate" ? "#525E7E" : "#006190"}
                      />
                      <span>{match !== null ? `${match}% Cocok dengan Minatmu` : "Kecocokan belum tersedia"}</span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="kp-card-body">
                    {/* Header */}
                    <div className="kp-card-head">
                      <div className="kp-card-head-info">
                        <span className="kp-card-univ">
                          {(p.bidang_studi?.nama ?? "Bidang studi -").toUpperCase()}
                        </span>
                        <h2 className="kp-card-title">
                          <Link href={`/katalog-prodi/${p.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                            {p.nama}
                          </Link>
                        </h2>
                        <p className="kp-card-dept">Pendidikan {labelJenis(p.jenis_pendidikan)}</p>
                      </div>
                      <div className={`kp-univ-avatar ${tema}`}>{p.bidang_studi?.kode ?? "?"}</div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="kp-metrics-grid">
                      <div className="kp-metric-box">
                        <span className="kp-metric-label">JENIS PENDIDIKAN</span>
                        <div className="kp-metric-val-wrap">
                          <span className="kp-metric-val">{labelJenis(p.jenis_pendidikan)}</span>
                        </div>
                      </div>

                      <div className="kp-metric-box">
                        <span className="kp-metric-label">KODE RIASEC</span>
                        <div className="kp-metric-val-wrap">
                          <span className={`kp-metric-val ${isVokasi ? "amber" : "blue"}`}>
                            {p.kode_riasec ?? "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kecocokan minat */}
                    <div className="kp-grade-section">
                      <div className="kp-grade-row">
                        <span className="kp-grade-label">Kecocokan Minat:</span>
                        <span className="kp-grade-val">
                          {match !== null ? `${match}% (profil ${kodeSiswa})` : "Belum tes minat"}
                        </span>
                      </div>

                      <div className="kp-progress-track">
                        <div
                          className={`kp-progress-fill ${tema}`}
                          style={{ width: `${match ?? 0}%` }}
                        />
                      </div>

                      {isDraf(p) && (
                        <div className="kp-mapel-tags">
                          <span className="kp-mapel-tag" title={p.catatan_sumber ?? ""}>
                            Data draf – belum diverifikasi
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Action Buttons */}
                    <div className="kp-card-actions">
                      <div className="kp-card-actions-row">
                        <button
                          type="button"
                          className={`kp-btn-target ${isLocked ? "locked" : ""}`}
                          disabled={busyId === p.id}
                          onClick={() => toggleLockTarget(p)}
                        >
                          <IconLock size={14} color="#FFFFFF" />
                          <span>
                            {busyId === p.id ? "Menyimpan..." : isLocked ? "Target Tersimpan" : "Jadikan Target"}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`kp-btn-round-action ${isCompared ? "bookmarked" : ""}`}
                          onClick={() => toggleCompare(p)}
                          title={isCompared ? "Hapus dari Perbandingan" : "Bandingkan Prodi"}
                          aria-label="Bandingkan prodi"
                        >
                          <IconScale size={16} color="currentColor" />
                        </button>
                      </div>

                      <Link href={`/katalog-prodi/${p.id}`} className="kp-card-ext-link">
                        <span>Lihat Detail Prodi</span>
                        <IconArrowRight size={12} color="currentColor" />
                      </Link>
                      {p.sumber_url && (
                        <a
                          href={p.sumber_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kp-card-ext-link"
                        >
                          <span>Lihat Sumber Data</span>
                          <IconExternalLink size={12} color="currentColor" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </section>

        {/* ── SECTION 5: PAGINATION BAR ── */}
        {total > 0 && (
          <div className="kp-pagination-bar">
            <span className="kp-pagination-info">
              Menampilkan halaman {activePage} dari {totalPages} (Total {total} Program Studi)
            </span>

            <div className="kp-pagination-controls">
              <button
                type="button"
                className="kp-page-btn"
                disabled={activePage === 1}
                onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                aria-label="Halaman Sebelumnya"
              >
                <IconChevronLeft size={14} color="#3F4850" />
              </button>

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`kp-page-btn ${activePage === page ? "active" : ""}`}
                  onClick={() => setActivePage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="kp-page-btn"
                disabled={activePage === totalPages}
                onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                aria-label="Halaman Berikutnya"
              >
                <IconChevronRight size={14} color="#0B1C30" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════════════
          STICKY / FLOATING COMPARISON DOCK (GLASSMORPHISM)
      ═════════════════════════════════════════════════════════════════════ */}
      {compareList.length > 0 && (
        <aside className="kp-floating-dock-wrap" aria-label="Bilah Perbandingan">
          <div className="kp-floating-dock">
            {/* Left Summary */}
            <div className="kp-dock-summary">
              <div className="kp-dock-icon-badge">
                <IconCompare size={16} color="#FFFFFF" />
              </div>
              <div className="kp-dock-meta">
                <span className="kp-dock-title">
                  Membandingkan {compareList.length} Prodi
                </span>
                <div className="kp-dock-chips">
                  {compareList.map((p, i) => (
                    <React.Fragment key={p.id}>
                      {i > 0 && <span>•</span>}
                      <span className="kp-dock-chip">
                        <span className={`kp-dock-dot ${["blue", "slate", "amber"][i % 3]}`} />
                        <span>{p.nama}</span>
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="kp-dock-actions">
              <button
                type="button"
                className="kp-btn-counselor"
                onClick={() => setCompareList([])}
              >
                <IconClose size={12} color="#7C5400" />
                <span>Kosongkan</span>
              </button>

              <button
                type="button"
                className="kp-btn-compare-primary"
                onClick={() => setCompareModalOpen(true)}
              >
                <span>Bandingkan Prodi</span>
                <IconArrowRight size={14} color="#FFFFFF" />
              </button>
            </div>
          </div>
        </aside>
      )}



      {/* ═════════════════════════════════════════════════════════════════════
          COMPARISON MODAL DIALOG
      ═════════════════════════════════════════════════════════════════════ */}
      <div
        className={`kp-modal-backdrop ${compareModalOpen ? "open" : ""}`}
        onClick={() => setCompareModalOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="kp-modal-card"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="kp-modal-head">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="kp-dock-icon-badge">
                <IconCompare size={16} color="#FFFFFF" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0B1C30" }}>
                  Matriks Perbandingan Prodi
                </h3>
                <span style={{ fontSize: 12, color: "#6F7881" }}>
                  Berdasarkan bidang studi, jenis pendidikan & kecocokan minat RIASEC
                </span>
              </div>
            </div>
            <button
              type="button"
              className="kp-clear-btn"
              onClick={() => setCompareModalOpen(false)}
              aria-label="Tutup Dialog"
            >
              <IconClose size={12} color="#0B1C30" />
            </button>
          </div>

          <div className="kp-modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {compareList.map((item) => {
                const match = skorKecocokan(item.kode_riasec, kodeSiswa);
                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #E5EEFF",
                      borderRadius: 16,
                      padding: 16,
                      background: "#F8F9FF",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#006190" }}>
                        {item.bidang_studi?.kode ?? "-"}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, background: "#E5EEFF", padding: "2px 8px", borderRadius: 999 }}>
                        {labelJenis(item.jenis_pendidikan)}
                      </span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0B1C30" }}>{item.nama}</h4>
                    <div style={{ fontSize: 12, color: "#3F4850" }}>
                      <div><strong>Bidang Studi:</strong> {item.bidang_studi?.nama ?? "-"}</div>
                      <div><strong>Kode RIASEC:</strong> {item.kode_riasec ?? "-"}</div>
                      <div><strong>Status Target:</strong> {targetPerProdi.has(item.id) ? "Tersimpan" : "Belum"}</div>
                      <div style={{ marginTop: 6, fontWeight: 700, color: "#006190" }}>
                        {match !== null ? `${match}% cocok dengan minatmu` : "Kecocokan belum tersedia"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="kp-btn-counselor"
                onClick={() => setCompareModalOpen(false)}
              >
                Tutup
              </button>
              <button
                type="button"
                className="kp-btn-primary"
                onClick={simpanSemuaPerbandingan}
              >
                Jadikan Semua Target
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
