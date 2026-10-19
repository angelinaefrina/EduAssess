"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../../styles/katalog-prodi.css";
import "../../../styles/eksplorasi-karir.css";
import { UnifiedNavbar } from "../../../components/shared/UnifiedNavbar";

import {
  IconCompass,
  IconSearch,
  IconBell,
  IconUser,
  IconClose,
  IconCheck,
  IconSparkles,
  IconBuilding,
  IconCounselor,
  IconArrowRight,
  IconMenu,
  IconBookmark,
  IconTrendingUp,
  IconBriefcase,
  IconFlame,
  IconBook,
  IconTarget,
} from "../../../components/siswa/KatalogIcons";
import { daftarKarir, detailKarir } from "../../../lib/api/katalog";
import { getTarget, simpanTargetKarir, terakhirAsesmen } from "../../../lib/api/rekomendasi";
import { getMe, hapusTargetKarir } from "../../../lib/api/siswa";
import type {
  DetailKarir,
  HasilAsesmen,
  KarirRingkas,
  SiswaSaya,
  TargetKarir,
  TipeRiasec,
} from "../../../lib/api/types";
import { infoKelas, labelJenis, NAMA_RIASEC, pesanError, skorKecocokan } from "../../../lib/riasec";

function namaPendek(nama: string): string {
  const kurung = nama.match(/\(([^)]+)\)/);
  if (kurung) return `${kurung[1]} Engineer`;
  return nama;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EksplorasiKarirPage() {
  // ── Data dari backend ──────────────────────────────────────────────────────
  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [asesmen, setAsesmen] = useState<HasilAsesmen | null>(null);
  const [targetKarir, setTargetKarir] = useState<TargetKarir[]>([]);
  /** Kumpulan karir untuk "karir serupa" & statistik (maks. 100 dari backend). */
  const [pool, setPool] = useState<KarirRingkas[]>([]);
  const [totalKarir, setTotalKarir] = useState<number | null>(null);
  const [trending, setTrending] = useState<KarirRingkas[]>([]);
  const [saran, setSaran] = useState<KarirRingkas[]>([]);
  const [karir, setKarir] = useState<DetailKarir | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const kodeSiswa = asesmen?.kode_holland ?? null;

  useEffect(() => {
    let batal = false;
    Promise.all([
      getMe(),
      terakhirAsesmen(),
      getTarget(),
      daftarKarir({ limit: 100 }),
      daftarKarir({ trending: true, limit: 5 }),
    ])
      .then(([m, a, t, semua, tren]) => {
        if (batal) return;
        setMe(m);
        setAsesmen(a);
        setTargetKarir(t.karir);
        setPool(semua.items);
        setTotalKarir(semua.total);
        setTrending(tren.items);

        // Karir awal: ?id= dari halaman lain → paling cocok dengan minat → trending pertama.
        const dariUrl = new URLSearchParams(window.location.search).get("id");
        const terbaik = [...semua.items].sort(
          (x, y) =>
            (skorKecocokan(y.kode_riasec, a?.kode_holland ?? null) ?? 0) -
            (skorKecocokan(x.kode_riasec, a?.kode_holland ?? null) ?? 0)
        )[0];
        setActiveId(dariUrl ?? terbaik?.id ?? tren.items[0]?.id ?? null);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let batal = false;
    detailKarir(activeId)
      .then((d) => {
        if (batal) return;
        setKarir(d);
        setQuery(d.nama);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, [activeId]);

  // Saran pencarian langsung dari backend (debounce).
  useEffect(() => {
    if (!suggestOpen) return;
    const q = query.trim();
    const t = setTimeout(() => {
      daftarKarir({ q: q || undefined, limit: 8 })
        .then((hal) => setSaran(hal.items))
        .catch(() => setSaran([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, suggestOpen]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const targetIdKarir = useMemo(
    () => new Map(targetKarir.filter((t) => t.karir).map((t) => [t.karir!.id, t.id])),
    [targetKarir]
  );

  const match = karir ? skorKecocokan(karir.kode_riasec, kodeSiswa) : null;
  const isSaved = karir ? targetIdKarir.has(karir.id) : false;

  const prodiRujukan = useMemo(
    () =>
      (karir?.prodi_relevan ?? [])
        .map((p) => ({ ...p, match: skorKecocokan(p.kode_riasec, kodeSiswa) }))
        .sort((a, b) => (b.match ?? 0) - (a.match ?? 0)),
    [karir, kodeSiswa]
  );

  const serupa = useMemo(
    () =>
      pool
        .filter((k) => k.id !== karir?.id)
        .map((k) => ({ ...k, skor: skorKecocokan(k.kode_riasec, kodeSiswa) }))
        .sort((a, b) => (b.skor ?? 0) - (a.skor ?? 0))
        .slice(0, 3),
    [pool, karir, kodeSiswa]
  );

  const jumlahCocok = kodeSiswa
    ? pool.filter((k) => (skorKecocokan(k.kode_riasec, kodeSiswa) ?? 0) >= 80).length
    : null;

  const pilihKarir = (id: string) => {
    setActiveId(id);
    setSuggestOpen(false);
  };

  const telusuri = () => {
    if (saran.length > 0) pilihKarir(saran[0].id);
    else setSuggestOpen(true);
  };

  const toggleSimpan = async () => {
    if (!karir || busy) return;
    setBusy(true);
    try {
      const targetId = targetIdKarir.get(karir.id);
      if (targetId) {
        await hapusTargetKarir(targetId);
        setTargetKarir((list) => list.filter((t) => t.id !== targetId));
        setToast(`${namaPendek(karir.nama)} dihapus dari Karir Impian`);
      } else {
        const baru = await simpanTargetKarir(karir.id);
        setTargetKarir((list) => [...list.filter((t) => t.id !== baru.id), baru]);
        setToast(`${namaPendek(karir.nama)} disimpan sebagai Karir Impian`);
      }
    } catch (err) {
      setToast(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const namaSiswa = me?.profil.nama ?? "Siswa";

  return (
    <div className="kp-page">
      <UnifiedNavbar peran="siswa" customUser={{ nama: namaSiswa, kelas: infoKelas(me) }} />

      <main className="ek-main">
        {/* ── HERO & FILTER EKSPLORASI ── */}
        <section className="ek-hero" aria-label="Eksplorasi Karir">
          <div className="ek-hero-inner">
            <div className="ek-headline-row">
              <div className="ek-headline">
                <h1 className="ek-title">Eksplorasi Karir</h1>
                <p className="ek-desc">
                  Temukan profesi yang selaras dengan minat RIASEC dan nilai rapormu, serta pelajari jalur prodi pendukungnya.
                </p>
              </div>

              <div className="ek-stats-pill">
                <div className="ek-stat">
                  <span className="ek-stat-label">KARIR TERDATA</span>
                  <span className="ek-stat-value blue">
                    {totalKarir?.toLocaleString("id-ID") ?? "–"}
                  </span>
                </div>
                <div className="ek-stat-divider" />
                <div className="ek-stat">
                  <span className="ek-stat-label">
                    {kodeSiswa ? `COCOK PROFIL ${kodeSiswa}` : "PROFIL RIASEC"}
                  </span>
                  <span className="ek-stat-value">
                    {jumlahCocok !== null ? `${jumlahCocok} Karir` : "Belum tes"}
                  </span>
                </div>
              </div>
            </div>

            <div className="ek-search">
              <div className="ek-search-box">
                <span className="ek-search-icon">
                  <IconSearch size={20} color="#006190" />
                </span>
                <input
                  id="karir-search"
                  type="text"
                  className="ek-search-input"
                  placeholder="Cari profesi atau karir..."
                  value={query}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={suggestOpen}
                  aria-controls="karir-suggest"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSuggestOpen(true);
                  }}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") telusuri();
                    if (e.key === "Escape") setSuggestOpen(false);
                  }}
                />
                <button type="button" className="ek-search-btn" onClick={telusuri}>
                  <span>Telusuri</span>
                  <IconArrowRight size={12} color="#FFFFFF" />
                </button>

                {suggestOpen && (
                  <ul id="karir-suggest" className="ek-suggest" role="listbox">
                    {saran.length === 0 ? (
                      <li className="ek-suggest-empty">
                        Belum ada karir yang cocok dengan &quot;{query}&quot;.
                      </li>
                    ) : (
                      saran.map((k) => (
                        <li key={k.id} role="option" aria-selected={k.id === karir?.id}>
                          <button
                            type="button"
                            className="ek-suggest-item"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pilihKarir(k.id)}
                          >
                            <span>{k.nama}</span>
                            <span className="ek-suggest-meta">{k.bidang_karir?.nama ?? "-"}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {trending.length > 0 && (
                <div className="ek-chips">
                  <span className="ek-chips-label">TRENDING:</span>
                  {trending.map((k) => {
                    const active = k.id === karir?.id;
                    return (
                      <button
                        key={k.id}
                        type="button"
                        className={`ek-chip ${active ? "active" : ""}`}
                        aria-pressed={active}
                        onClick={() => pilihKarir(k.id)}
                      >
                        {active && <IconFlame size={12} color="#FFFFFF" />}
                        {namaPendek(k.nama)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {(error || !karir) && (
          <p className="ek-section-desc" role={error ? "alert" : "status"} style={{ padding: "24px 0" }}>
            {error ?? (activeId === null && totalKarir === 0 ? "Belum ada data karir." : "Memuat data karir...")}
          </p>
        )}

        {/* ── SPLIT VIEW 60 : 40 ── */}
        {karir && (
          <div className="ek-split">
            {/* ════ KOLOM KIRI ════ */}
            <div className="ek-col">
              <article className="ek-card" aria-labelledby="karir-title">
                <div className="ek-career-top">
                  <div className="ek-career-head">
                    <div className="ek-badges">
                      <span className="ek-badge field">
                        <IconBriefcase size={11} color="#006190" />
                        {karir.bidang_karir?.nama ?? "Bidang karir -"}
                      </span>
                      {karir.is_trending && <span className="ek-badge trend">TRENDING</span>}
                    </div>
                    <h2 id="karir-title" className="ek-career-title">
                      {karir.nama}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className={`ek-bookmark ${isSaved ? "saved" : ""}`}
                    onClick={toggleSimpan}
                    disabled={busy}
                    aria-pressed={isSaved}
                    aria-label={isSaved ? "Hapus dari Karir Impian" : "Simpan sebagai Karir Impian"}
                    title={isSaved ? "Hapus dari Karir Impian" : "Simpan sebagai Karir Impian"}
                  >
                    <IconBookmark size={17} color="currentColor" filled={isSaved} />
                  </button>
                </div>

                <div className="ek-riasec-row">
                  <div className="ek-riasec-left">
                    <span className="ek-riasec-label">Profil RIASEC Dibutuhkan</span>
                    <div className="ek-riasec-pills">
                      {karir.kode_riasec ? (
                        [...karir.kode_riasec].map((h, i) => (
                          <span key={h} className={`ek-riasec-pill t${i}`}>
                            {NAMA_RIASEC[h as TipeRiasec]} ({h})
                          </span>
                        ))
                      ) : (
                        <span className="ek-riasec-pill t2">Belum diisi</span>
                      )}
                    </div>
                  </div>
                  <span className="ek-riasec-match">
                    <IconSparkles size={14} color="#006190" />
                    {match !== null ? (
                      `Cocok ${match}% dengan profilmu`
                    ) : (
                      <Link href="/tes-minat">Kerjakan tes minat untuk melihat kecocokan</Link>
                    )}
                  </span>
                </div>

                <div className="ek-metrics">
                  <div className="ek-metric">
                    <div className="ek-metric-head">
                      <span className="ek-metric-label">KODE RIASEC</span>
                      <IconSparkles size={15} color="#006190" />
                    </div>
                    <span className="ek-metric-value">{karir.kode_riasec ?? "-"}</span>
                    <span className="ek-metric-note">Profil minat yang dibutuhkan</span>
                  </div>

                  <div className="ek-metric">
                    <div className="ek-metric-head">
                      <span className="ek-metric-label">PRODI RELEVAN</span>
                      <IconBuilding size={16} color="#9D6B00" />
                    </div>
                    <span className="ek-metric-value">{karir.prodi_relevan.length} Prodi</span>
                    <span className="ek-metric-note">Terhubung di katalog</span>
                  </div>

                  <div className="ek-metric">
                    <div className="ek-metric-head">
                      <span className="ek-metric-label">STATUS TREN</span>
                      <IconTrendingUp size={16} color="#007BB5" />
                    </div>
                    <span className="ek-metric-value">{karir.is_trending ? "Trending" : "Reguler"}</span>
                    <span className="ek-metric-note">{karir.bidang_karir?.nama ?? "-"}</span>
                  </div>
                </div>

                <div className="ek-block">
                  <h3 className="ek-h3">Apa Peran Utama Profesi Ini?</h3>
                  <p className="ek-body">{karir.deskripsi ?? "Deskripsi karir ini belum tersedia."}</p>
                </div>

                {(karir.catatan_sumber || karir.sumber_url) && (
                  <div className="ek-block">
                    <div className="ek-block-head">
                      <h3 className="ek-h3">Sumber Data</h3>
                    </div>
                    {karir.catatan_sumber && <p className="ek-body">{karir.catatan_sumber}</p>}
                    {karir.sumber_url && (
                      <a href={karir.sumber_url} target="_blank" rel="noopener noreferrer" className="ek-major-link">
                        Buka sumber
                        <IconArrowRight size={12} color="currentColor" />
                      </a>
                    )}
                  </div>
                )}
              </article>

              {/* Prodi Rujukan */}
              <section className="ek-section" aria-labelledby="prodi-title">
                <div className="ek-section-head">
                  <div>
                    <h2 id="prodi-title" className="ek-h2">
                      Prodi Rujukan
                    </h2>
                    <p className="ek-section-desc">
                      Program studi yang relevan untuk menjadi {karir.nama}, diurutkan
                      berdasarkan kecocokan dengan profil minatmu.
                    </p>
                  </div>
                  <span className="ek-count-pill">{prodiRujukan.length} Prodi Relevan</span>
                </div>

                {prodiRujukan.length === 0 && (
                  <p className="ek-section-desc">Belum ada prodi yang dihubungkan dengan karir ini.</p>
                )}

                {prodiRujukan.map((p, idx) => (
                  <article key={p.id} className="ek-major">
                    <div className="ek-major-body">
                      <div className="ek-major-badges">
                        <span className={`ek-major-badge match ${idx > 0 ? "mid" : ""}`}>
                          {p.match !== null ? `${p.match}% MATCH` : "MATCH –"}
                          {idx === 0 && p.match !== null ? " • PRIORITAS UTAMA" : ""}
                        </span>
                        <span className="ek-major-badge riasec">RIASEC: {p.kode_riasec ?? "-"}</span>
                        <span className="ek-major-rumpun">{p.bidang_studi?.nama ?? "-"}</span>
                      </div>
                      <h3 className="ek-major-title">{p.nama}</h3>
                      <div className="ek-major-meta">
                        <span className="ek-major-meta-item">
                          <IconBuilding size={12} color="#006190" />
                          Pendidikan {labelJenis(p.jenis_pendidikan)}
                        </span>
                      </div>
                    </div>

                    <div className="ek-major-side">
                      <div
                        className="ek-ring"
                        style={{ "--p": p.match ?? 0 } as React.CSSProperties}
                        aria-label={p.match !== null ? `Kecocokan ${p.match}%` : "Kecocokan belum tersedia"}
                      >
                        <div className="ek-ring-inner">{p.match !== null ? `${p.match}%` : "–"}</div>
                      </div>
                      <Link
                        href={`/katalog-prodi/${p.id}`}
                        className="ek-major-link"
                      >
                        Lihat Detail Prodi
                        <IconArrowRight size={12} color="currentColor" />
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            </div>

            {/* ════ KOLOM KANAN ════ */}
            <aside className="ek-col" aria-label="Analisis Kesiapan Karir">
              {/* Kesiapan mapel */}
              <section className="ek-card">
                <div className="ek-side-title">
                  <span className="ek-side-icon">
                    <IconBook size={16} color="#006190" />
                  </span>
                  <div>
                    <h2 className="ek-h2">Kesiapan Mapel Pendukung</h2>
                    <p className="ek-section-desc">Nilai rapor terakhirmu pada mapel pendukung prodi rujukan</p>
                  </div>
                </div>

                {karir.mapel_pendukung.length === 0 ? (
                  <p className="ek-section-desc">Belum ada data mapel pendukung.</p>
                ) : (
                  <ul className="ek-mapel-list">
                    {karir.mapel_pendukung.map((m) => {
                      const nilai = m.nilai_terakhir_siswa == null ? null : Number(m.nilai_terakhir_siswa);
                      return (
                        <li key={m.mapel.id}>
                          <div className="ek-mapel-row">
                            <span className="ek-mapel-name">{m.mapel.nama}</span>
                            <span className="ek-mapel-score">
                              <span className="ok">{nilai ?? "–"}</span> • bobot {Number(m.bobot)}
                            </span>
                          </div>
                          <div className="ek-bar">
                            <div className="ek-bar-fill" style={{ width: `${nilai ?? 0}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="ek-legend">
                  <span>
                    <span className="ek-legend-swatch" /> Nilai terakhir kamu (– = belum ada nilai)
                  </span>
                </div>
              </section>

              {/* Karir serupa */}
              <section className="ek-card">
                <div className="ek-side-title">
                  <span className="ek-side-icon">
                    <IconSparkles size={16} color="#006190" />
                  </span>
                  <div>
                    <h2 className="ek-h2">Karir Serupa untukmu</h2>
                    <p className="ek-section-desc">
                      {kodeSiswa ? `Berdasarkan profil RIASEC ${kodeSiswa}` : "Kerjakan tes minat agar lebih personal"}
                    </p>
                  </div>
                </div>

                <ul className="ek-similar-list">
                  {serupa.map((k) => (
                    <li key={k.id}>
                      <button
                        type="button"
                        className="ek-similar"
                        onClick={() => {
                          pilihKarir(k.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <span>
                          <span className="ek-similar-name">{k.nama}</span>
                          <span className="ek-similar-meta">
                            {k.bidang_karir?.nama ?? "-"} • RIASEC {k.kode_riasec ?? "-"}
                          </span>
                        </span>
                        <span className="ek-similar-score">{k.skor !== null ? `${k.skor}%` : "–"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* CTA */}
              <section className="ek-card ek-cta">
                <h2 className="ek-h2">Yakin dengan pilihan ini?</h2>
                <p className="ek-cta-desc">
                  Simpan {namaPendek(karir.nama)} sebagai Karir Impian agar rekomendasi
                  prodi dan analisis keselarasan mapel disesuaikan untukmu.
                </p>
                <div className="ek-cta-actions">
                  <button type="button" className="ek-btn-light" onClick={toggleSimpan} disabled={busy}>
                    {isSaved ? (
                      <IconCheck size={14} color="#006190" />
                    ) : (
                      <IconBookmark size={14} color="#006190" />
                    )}
                    {isSaved ? "Tersimpan sebagai Karir Impian" : "Simpan Karir Impian"}
                  </button>
                  <button
                    type="button"
                    className="ek-btn-ghost"
                    onClick={() => setToast("Permintaan konsultasi dikirim ke Guru BK")}
                  >
                    <IconCounselor size={14} color="#FFFFFF" />
                    Konsultasi BK
                  </button>
                </div>
              </section>

              <section className="ek-card">
                <div className="ek-side-title">
                  <span className="ek-side-icon">
                    <IconTarget size={16} color="#006190" />
                  </span>
                  <div>
                    <h2 className="ek-h2">Karir Impian Tersimpan</h2>
                    <p className="ek-section-desc">{targetKarir.length} karir tersimpan</p>
                  </div>
                </div>
                <ul className="ek-similar-list">
                  {targetKarir.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="ek-similar"
                        disabled={!t.karir}
                        onClick={() => t.karir && pilihKarir(t.karir.id)}
                      >
                        <span className="ek-similar-name">{t.karir?.nama ?? t.teks_bebas ?? "-"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            </aside>
          </div>
        )}
      </main>



      {toast && (
        <div className="ek-toast" role="status">
          <IconCheck size={14} color="#CBE6FF" />
          {toast}
        </div>
      )}
    </div>
  );
}
