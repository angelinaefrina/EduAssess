"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../../components/shared/AppShell";
import { detailProdi } from "../../../../lib/api/katalog";
import { hapusTargetProdi, tambahTargetProdi, terakhirAsesmen } from "../../../../lib/api/rekomendasi";
import type { DetailProdi as TDetailProdi, HasilAsesmen, TipeRiasec } from "../../../../lib/api/types";
import { labelJenis, NAMA_RIASEC, pesanError, skorKecocokan } from "../../../../lib/riasec";

export function DetailProdi() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<TDetailProdi | null>(null);
  const [asesmen, setAsesmen] = useState<HasilAsesmen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([detailProdi(id), terakhirAsesmen()])
      .then(([d, a]) => {
        setP(d);
        setAsesmen(a);
      })
      .catch((err) => setError(pesanError(err)));
  }, [id]);

  const toggleTarget = async () => {
    if (!p) return;
    setBusy(true);
    setError(null);
    try {
      if (p.status_target?.tersimpan && p.status_target.target_id) {
        await hapusTargetProdi(p.status_target.target_id);
      } else {
        await tambahTargetProdi({ prodi_id: p.id, sumber: "katalog" });
      }
      setP(await detailProdi(id));
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const cocok = p ? skorKecocokan(p.kode_riasec, asesmen?.kode_holland ?? null) : null;

  return (
    <AppShell peran="siswa">
      <Link href="/katalog-prodi" className="app-btn app-btn--sm app-btn--ghost" style={{ alignSelf: "flex-start" }}>
        ← Kembali ke katalog
      </Link>

      {!p ? (
        <StatusMuat error={error} />
      ) : (
        <>
          <div className="app-head">
            <div>
              <span className="app-eyebrow">{p.bidang_studi?.nama ?? "Program Studi"}</span>
              <h1 className="app-title">{p.nama}</h1>
              <p className="app-sub">
                Pendidikan {labelJenis(p.jenis_pendidikan)} • RIASEC {p.kode_riasec ?? "-"}
                {cocok !== null && ` • ${cocok}% cocok dengan profil ${asesmen?.kode_holland}`}
              </p>
            </div>
            {p.status_target && (
              <button
                type="button"
                className={`app-btn${p.status_target.tersimpan ? "" : " app-btn--primary"}`}
                disabled={busy}
                onClick={toggleTarget}
              >
                {p.status_target.tersimpan
                  ? p.status_target.is_utama
                    ? "Target utama • Hapus"
                    : "Tersimpan • Hapus target"
                  : "Jadikan Target"}
              </button>
            )}
          </div>

          {error && <div className="app-alert">{error}</div>}
          {p.catatan_sumber && /belum/i.test(p.catatan_sumber) && (
            <div className="app-alert app-alert--warn">Data prodi ini masih draf: {p.catatan_sumber}</div>
          )}

          <div className="app-grid app-grid--side">
            <div className="app-list" style={{ gap: 20 }}>
              <section className="app-card">
                <h2 className="app-card__title">Tentang Prodi</h2>
                <p>{p.deskripsi ?? "Deskripsi belum tersedia."}</p>
                {p.kode_riasec && (
                  <div className="app-chips">
                    {[...p.kode_riasec].map((h) => (
                      <span key={h} className="app-chip">{NAMA_RIASEC[h as TipeRiasec]} ({h})</span>
                    ))}
                  </div>
                )}
                {p.sumber_url && (
                  <a href={p.sumber_url} target="_blank" rel="noopener noreferrer" className="app-btn app-btn--sm" style={{ alignSelf: "flex-start" }}>
                    Lihat sumber data ↗
                  </a>
                )}
              </section>

              <section className="app-card">
                <h2 className="app-card__title">Mapel Pendukung & Nilaimu</h2>
                {p.mapel_pendukung.length === 0 ? (
                  <p className="app-muted">Belum ada data mapel pendukung.</p>
                ) : (
                  <div className="app-table-wrap">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>Mapel</th>
                          <th className="app-num">Bobot</th>
                          <th className="app-num">Nilai terakhirmu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.mapel_pendukung.map((m) => (
                          <tr key={m.mapel.id}>
                            <td>{m.mapel.nama}</td>
                            <td className="app-num">{Number(m.bobot)}</td>
                            <td className="app-num app-score">{m.nilai_terakhir_siswa ?? "–"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="app-card">
                <h2 className="app-card__title">Perguruan Tinggi ({p.perguruan_tinggi.length})</h2>
                {p.perguruan_tinggi.length === 0 ? (
                  <p className="app-muted">Belum ada data perguruan tinggi.</p>
                ) : (
                  <div className="app-table-wrap">
                    <table className="app-table">
                      <thead>
                        <tr>
                          <th>Nama</th>
                          <th>Jenjang</th>
                          <th>Kota</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {p.perguruan_tinggi.map((pt) => (
                          <tr key={`${pt.id}-${pt.jenjang}`}>
                            <td>{pt.nama}</td>
                            <td>{pt.jenjang}</td>
                            <td>{pt.kota ?? "–"}</td>
                            <td>
                              {(pt.sumber_url ?? pt.situs_url) && (
                                <a href={(pt.sumber_url ?? pt.situs_url)!} target="_blank" rel="noopener noreferrer">
                                  Situs ↗
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <section className="app-card">
              <h2 className="app-card__title">Contoh Karir</h2>
              {p.contoh_karir.length === 0 ? (
                <p className="app-muted">Belum ada data karir.</p>
              ) : (
                <ul className="app-list">
                  {p.contoh_karir.map((k) => (
                    <li key={k.id}>
                      <Link href={`/eksplorasi-karir?id=${k.id}`}>{k.nama}</Link>{" "}
                      {k.is_trending && <span className="app-badge app-badge--info">trending</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}
