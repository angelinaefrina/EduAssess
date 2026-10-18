"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../../components/shared/AppShell";
import {
  buatKode,
  daftarKode,
  dashboardSiswa,
  segarkanKeselarasan,
  ubahKode,
  type FilterDashboard,
} from "../../../../lib/api/bk";
import type { DashboardBk, KodeBk, Penanda } from "../../../../lib/api/types";
import { badge, kelasSiswa, LABEL_PENANDA, labelStatus, URUTAN_PENANDA } from "../../../../lib/bk-label";
import { pesanError, tanggal } from "../../../../lib/riasec";

const LIMIT = 50;

// ─── Panel kode BK ───────────────────────────────────────────────────────────

function PanelKode() {
  const [kode, setKode] = useState<KodeBk[] | null>(null);
  const [berlaku, setBerlaku] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tanggal hari ini dibaca di klien (bukan saat prerender) untuk batas minimal input.
  const [hariIni, setHariIni] = useState<string>();

  useEffect(() => {
    daftarKode()
      .then((k) => {
        setKode(k);
        setHariIni(new Date().toISOString().slice(0, 10));
      })
      .catch((err) => setError(pesanError(err)));
  }, []);

  const buat = async () => {
    setBusy(true);
    setError(null);
    try {
      // Input tanggal = akhir hari itu (waktu lokal).
      const sampai = berlaku ? new Date(`${berlaku}T23:59:59`).toISOString() : null;
      const baru = await buatKode({ berlaku_sampai: sampai });
      setKode((k) => [baru, ...(k ?? [])]);
      setBerlaku("");
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (k: KodeBk) => {
    try {
      const baru = await ubahKode(k.id, { aktif: !k.aktif });
      setKode((list) => list?.map((x) => (x.id === k.id ? baru : x)) ?? null);
    } catch (err) {
      setError(pesanError(err));
    }
  };

  const kedaluwarsa = (k: KodeBk) => !!k.berlaku_sampai && new Date(k.berlaku_sampai) < new Date();

  return (
    <section className="app-card" aria-labelledby="kode-title">
      <div className="app-card__head">
        <div>
          <h2 className="app-card__title" id="kode-title">Kode Pendaftaran Siswa</h2>
          <p className="app-card__sub">Bagikan kode aktif ke siswa untuk dimasukkan saat onboarding.</p>
        </div>
      </div>

      <div className="app-filters">
        <label className="app-field">
          <span className="app-label">Berlaku sampai (opsional)</span>
          <input
            type="date"
            className="app-input"
            value={berlaku}
            min={hariIni}
            onChange={(e) => setBerlaku(e.target.value)}
          />
        </label>
        <button type="button" className="app-btn app-btn--primary" disabled={busy} onClick={buat}>
          {busy ? "Membuat..." : "Buat Kode Baru"}
        </button>
      </div>

      {error && <div className="app-alert">{error}</div>}

      {kode === null ? (
        !error && <p className="app-muted">Memuat kode...</p>
      ) : kode.length === 0 ? (
        <p className="app-muted">Belum ada kode. Buat kode baru untuk mendaftarkan siswa.</p>
      ) : (
        <ul className="app-list">
          {kode.map((k) => {
            const habis = kedaluwarsa(k);
            return (
              <li key={k.id} className="app-note">
                <div className="app-card__head">
                  <span className="app-mono" style={{ fontSize: 18 }}>{k.kode}</span>
                  <span className={badge(!k.aktif ? "" : habis ? "warn" : "ok")}>
                    {!k.aktif ? "Nonaktif" : habis ? "Kedaluwarsa" : "Aktif"}
                  </span>
                </div>
                <div className="app-card__head">
                  <span className="app-note__meta">
                    Dibuat {tanggal(k.created_at)} • Berlaku sampai{" "}
                    {k.berlaku_sampai ? tanggal(k.berlaku_sampai) : "tanpa batas"}
                  </span>
                  <span className="app-actions">
                    <button
                      type="button"
                      className="app-btn app-btn--sm"
                      onClick={() => navigator.clipboard?.writeText(k.kode)}
                    >
                      Salin
                    </button>
                    <button
                      type="button"
                      className={`app-btn app-btn--sm${k.aktif ? " app-btn--danger" : ""}`}
                      onClick={() => toggle(k)}
                    >
                      {k.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BkDashboardPage() {
  const [data, setData] = useState<DashboardBk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterDashboard>({ offset: 0 });
  const [q, setQ] = useState("");
  const [rombel, setRombel] = useState("");
  const [segar, setSegar] = useState<string | null>(null);
  const [busySegar, setBusySegar] = useState(false);
  const [versi, setVersi] = useState(0);

  // Teks dicari setelah berhenti mengetik.
  useEffect(() => {
    const t = setTimeout(
      () => setFilter((f) => (f.q === (q.trim() || undefined) && f.rombel === (rombel.trim() || undefined)
        ? f
        : { ...f, q: q.trim() || undefined, rombel: rombel.trim() || undefined, offset: 0 })),
      350
    );
    return () => clearTimeout(t);
  }, [q, rombel]);

  const muat = useCallback(() => dashboardSiswa({ ...filter, limit: LIMIT }), [filter]);

  useEffect(() => {
    let batal = false;
    muat()
      .then((d) => {
        if (batal) return;
        setData(d);
        setError(null);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, [muat, versi]);

  const ubahFilter = (patch: Partial<FilterDashboard>) => setFilter((f) => ({ ...f, ...patch, offset: 0 }));

  const segarkan = async () => {
    setBusySegar(true);
    setSegar(null);
    try {
      const r = await segarkanKeselarasan();
      setSegar(
        `${r.diperiksa} siswa diperiksa: ${r.dihitung_baru} dihitung ulang, ${r.dari_cache} tidak berubah, ${r.data_belum_lengkap} datanya belum lengkap.`
      );
      setVersi((v) => v + 1);
    } catch (err) {
      setSegar(pesanError(err));
    } finally {
      setBusySegar(false);
    }
  };

  const jumlah = data?.jumlah_per_penanda;
  const offset = filter.offset ?? 0;

  return (
    <AppShell peran="bk">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Panel Guru BK • UC10</span>
          <h1 className="app-title">Dashboard Siswa</h1>
          <p className="app-sub">Pantau kelengkapan data dan keselarasan target prodi siswa di sekolahmu.</p>
        </div>
        <button type="button" className="app-btn app-btn--primary" disabled={busySegar} onClick={segarkan}>
          {busySegar ? "Menghitung..." : "Segarkan Analisis Keselarasan"}
        </button>
      </div>

      {segar && <div className="app-alert app-alert--ok">{segar}</div>}

      <div className="app-stats">
        {(["selaras", "berisiko", "tidak_selaras", "nilai_menunggu"] as Penanda[]).map((p) => (
          <div key={p} className="app-stat">
            <span className="app-stat__label">{LABEL_PENANDA[p].label}</span>
            <span className="app-stat__value">{jumlah ? jumlah[p] : "–"}</span>
          </div>
        ))}
      </div>

      <div className="app-grid app-grid--side">
        <section className="app-card" aria-labelledby="siswa-title">
          <div className="app-card__head">
            <h2 className="app-card__title" id="siswa-title">
              Daftar Siswa {data ? <span className="app-muted">({data.total})</span> : null}
            </h2>
          </div>

          <div className="app-filters">
            <label className="app-field app-field--grow">
              <span className="app-label">Cari nama</span>
              <input className="app-input" value={q} placeholder="Nama siswa" onChange={(e) => setQ(e.target.value)} />
            </label>
            <label className="app-field">
              <span className="app-label">Tingkat</span>
              <select
                className="app-select"
                value={filter.tingkat ?? ""}
                onChange={(e) => ubahFilter({ tingkat: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Semua</option>
                {[10, 11, 12].map((t) => (
                  <option key={t} value={t}>Kelas {t}</option>
                ))}
              </select>
            </label>
            <label className="app-field">
              <span className="app-label">Rombel</span>
              <input className="app-input" value={rombel} placeholder="mis. IPA 1" onChange={(e) => setRombel(e.target.value)} />
            </label>
            <label className="app-field">
              <span className="app-label">Angkatan</span>
              <input
                className="app-input"
                inputMode="numeric"
                placeholder="mis. 2027"
                value={typeof filter.angkatan === "number" ? filter.angkatan : ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  ubahFilter({ angkatan: v.length === 4 ? Number(v) : undefined });
                }}
              />
            </label>
          </div>

          <div className="app-chips" role="group" aria-label="Filter penanda">
            <button
              type="button"
              className={`app-chip${!filter.penanda ? " app-chip--on" : ""}`}
              onClick={() => ubahFilter({ penanda: undefined })}
            >
              Semua
            </button>
            {URUTAN_PENANDA.map((p) => (
              <button
                key={p}
                type="button"
                className={`app-chip${filter.penanda === p ? " app-chip--on" : ""}`}
                aria-pressed={filter.penanda === p}
                onClick={() => ubahFilter({ penanda: filter.penanda === p ? undefined : p })}
              >
                {LABEL_PENANDA[p].label}
                {jumlah && <span className="app-chip__count">{jumlah[p]}</span>}
              </button>
            ))}
          </div>

          {!data ? (
            <StatusMuat error={error} />
          ) : data.items.length === 0 ? (
            <p className="app-empty">
              Belum ada siswa yang cocok. Siswa muncul di sini setelah memasukkan kode sekolah.
            </p>
          ) : (
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Kelas</th>
                    <th>Angkatan</th>
                    <th>RIASEC</th>
                    <th>Keselarasan</th>
                    <th>Penanda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((s) => {
                    const st = labelStatus(s.keselarasan.status);
                    return (
                      <tr key={s.siswa_id}>
                        <td>
                          <Link href={`/bk/siswa/${s.siswa_id}`}>{s.nama ?? "(tanpa nama)"}</Link>
                        </td>
                        <td>{kelasSiswa(s)}</td>
                        <td>{s.angkatan ?? "–"}</td>
                        <td className="app-mono">{s.kode_holland ?? "–"}</td>
                        <td>
                          <span className={badge(st.nada)}>{st.label}</span>
                        </td>
                        <td>
                          <span className="app-chips">
                            {s.penanda
                              .filter((p) => p !== s.keselarasan.status)
                              .map((p) => (
                                <span key={p} className={badge(LABEL_PENANDA[p].nada)}>
                                  {LABEL_PENANDA[p].label}
                                </span>
                              ))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > LIMIT && (
            <div className="app-pager">
              <span className="app-muted">
                {offset + 1}–{Math.min(offset + LIMIT, data.total)} dari {data.total}
              </span>
              <span className="app-actions">
                <button
                  type="button"
                  className="app-btn app-btn--sm"
                  disabled={offset === 0}
                  onClick={() => setFilter((f) => ({ ...f, offset: Math.max(0, offset - LIMIT) }))}
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  className="app-btn app-btn--sm"
                  disabled={offset + LIMIT >= data.total}
                  onClick={() => setFilter((f) => ({ ...f, offset: offset + LIMIT }))}
                >
                  Berikutnya
                </button>
              </span>
            </div>
          )}
        </section>

        <PanelKode />
      </div>
    </AppShell>
  );
}
