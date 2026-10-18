"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../../components/shared/AppShell";
import { imporNilai, nilaiMenunggu, putuskanNilai, unduhTemplate } from "../../../../lib/api/bk";
import { ApiError } from "../../../../lib/api/client";
import type { HasilImporNilai, SiswaRingkas } from "../../../../lib/api/types";
import { kelasSiswa } from "../../../../lib/bk-label";
import { pesanError } from "../../../../lib/riasec";

type BarisMenunggu = SiswaRingkas & { jumlah_menunggu: number };

const SEMESTER = [1, 2, 3, 4, 5, 6];

export default function BkNilaiRaporPage() {
  const [menunggu, setMenunggu] = useState<BarisMenunggu[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Template & impor
  const [semester, setSemester] = useState(1);
  const [tingkat, setTingkat] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [busyImpor, setBusyImpor] = useState(false);
  const [hasil, setHasil] = useState<HasilImporNilai | null>(null);
  const [errImpor, setErrImpor] = useState<{ pesan: string; daftar: string[] } | null>(null);

  const muat = () =>
    nilaiMenunggu()
      .then(setMenunggu)
      .catch((err) => setError(pesanError(err)));

  useEffect(() => {
    muat();
  }, []);

  const setujuiSemua = async (s: BarisMenunggu) => {
    if (!s.siswa_id) return;
    setBusyId(s.siswa_id);
    try {
      await putuskanNilai(s.siswa_id, { status: "terverifikasi" });
      await muat();
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusyId(null);
    }
  };

  const unduh = async () => {
    setErrImpor(null);
    try {
      await unduhTemplate({ semester, tingkat: tingkat || undefined });
    } catch (err) {
      setErrImpor({ pesan: pesanError(err), daftar: [] });
    }
  };

  const impor = async () => {
    if (!file) return;
    setBusyImpor(true);
    setHasil(null);
    setErrImpor(null);
    try {
      const csv = await file.text();
      setHasil(await imporNilai(semester, csv));
      await muat();
    } catch (err) {
      const detail = err instanceof ApiError ? (err.details as { errors?: string[]; total_error?: number }) : null;
      setErrImpor({ pesan: pesanError(err), daftar: detail?.errors ?? [] });
    } finally {
      setBusyImpor(false);
    }
  };

  return (
    <AppShell peran="bk">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Panel Guru BK • Nilai Rapor</span>
          <h1 className="app-title">Verifikasi & Impor Nilai</h1>
          <p className="app-sub">
            Setujui nilai yang diinput siswa, atau impor nilai satu semester sekaligus dari file CSV.
          </p>
        </div>
      </div>

      <div className="app-grid app-grid--side">
        <section className="app-card" aria-labelledby="menunggu-title">
          <div className="app-card__head">
            <h2 className="app-card__title" id="menunggu-title">Nilai Menunggu Verifikasi</h2>
            {menunggu && <span className="app-muted">{menunggu.length} siswa</span>}
          </div>
          {error && <div className="app-alert">{error}</div>}
          {!menunggu ? (
            !error && <StatusMuat error={null} />
          ) : menunggu.length === 0 ? (
            <p className="app-empty">Tidak ada nilai yang menunggu verifikasi.</p>
          ) : (
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Kelas</th>
                    <th className="app-num">Menunggu</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {menunggu.map((s) => (
                    <tr key={s.siswa_id}>
                      <td>
                        <Link href={`/bk/siswa/${s.siswa_id}`}>{s.nama ?? "(tanpa nama)"}</Link>
                      </td>
                      <td>{kelasSiswa(s)}</td>
                      <td className="app-num app-score">{s.jumlah_menunggu}</td>
                      <td>
                        <span className="app-actions" style={{ justifyContent: "flex-end" }}>
                          <Link href={`/bk/siswa/${s.siswa_id}`} className="app-btn app-btn--sm">
                            Periksa
                          </Link>
                          <button
                            type="button"
                            className="app-btn app-btn--sm app-btn--primary"
                            disabled={busyId === s.siswa_id}
                            onClick={() => setujuiSemua(s)}
                          >
                            Setujui semua
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="app-card" aria-labelledby="impor-title">
          <h2 className="app-card__title" id="impor-title">Impor Nilai dari CSV</h2>
          <ol className="app-muted" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Unduh template untuk semester yang dipilih.</li>
            <li>Isi nilai (1–100) per kolom kode mapel; kosongkan bila tidak diambil.</li>
            <li>Unggah kembali file CSV-nya.</li>
          </ol>
          <div className="app-filters">
            <label className="app-field">
              <span className="app-label">Semester</span>
              <select className="app-select" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                {SEMESTER.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </label>
            <label className="app-field">
              <span className="app-label">Tingkat (template)</span>
              <select
                className="app-select"
                value={tingkat}
                onChange={(e) => setTingkat(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Semua</option>
                {[10, 11, 12].map((t) => (
                  <option key={t} value={t}>Kelas {t}</option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" className="app-btn" onClick={unduh}>
            Unduh Template CSV
          </button>

          <label className="app-field">
            <span className="app-label">File CSV terisi</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="app-input"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="button" className="app-btn app-btn--primary" disabled={!file || busyImpor} onClick={impor}>
            {busyImpor ? "Mengimpor..." : `Impor ke Semester ${semester}`}
          </button>

          {hasil && (
            <div className="app-alert app-alert--ok">
              {hasil.jumlah_nilai} nilai untuk {hasil.jumlah_siswa} siswa tersimpan di semester {hasil.semester}.
              {hasil.sel_kosong_dilewati > 0 && ` ${hasil.sel_kosong_dilewati} sel kosong dilewati.`}
              {hasil.kolom_diabaikan.length > 0 && ` Kolom diabaikan: ${hasil.kolom_diabaikan.join(", ")}.`}
            </div>
          )}
          {errImpor && (
            <div className="app-alert">
              {errImpor.pesan}
              {errImpor.daftar.length > 0 && (
                <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                  {errImpor.daftar.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
