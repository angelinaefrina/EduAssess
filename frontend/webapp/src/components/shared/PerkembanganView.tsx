"use client";

import React from "react";

import type { Perkembangan, TipeRiasec } from "../../lib/api/types";
import { badge, LABEL_STATUS_NILAI } from "../../lib/bk-label";
import { NAMA_RIASEC, tanggal } from "../../lib/riasec";

const TIPE: TipeRiasec[] = ["R", "I", "A", "S", "E", "C"];
const tanda = (x: number) => `${x > 0 ? "+" : ""}${x}`;

/** Perkembangan minat & nilai (dipakai halaman siswa dan detail siswa BK). */
export function PerkembanganView({ data }: { data: Perkembangan }) {
  const { minat, nilai } = data;
  return (
    <>
      <section className="app-card" aria-labelledby="pk-minat">
        <h2 className="app-card__title" id="pk-minat">Perkembangan Minat (RIASEC)</h2>
        {minat.riwayat.length === 0 ? (
          <p className="app-muted">Belum ada hasil tes minat.</p>
        ) : (
          <>
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Semester</th>
                    <th>Kode Holland</th>
                    {TIPE.map((t) => (
                      <th key={t} className="app-num" title={NAMA_RIASEC[t]}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {minat.riwayat.map((r) => (
                    <tr key={r.asesmen_id}>
                      <td>{tanggal(r.selesai_at)}</td>
                      <td>{r.semester ?? "–"}</td>
                      <td className="app-mono">{r.kode_holland ?? "–"}</td>
                      {TIPE.map((t) => (
                        <td key={t} className="app-num">
                          {r.riasec?.[t] != null ? Number(r.riasec[t]).toFixed(2) : "–"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {minat.perubahan ? (
              <p>
                Dari <span className="app-mono">{minat.perubahan.dari.kode_holland ?? "-"}</span> ke{" "}
                <span className="app-mono">{minat.perubahan.ke.kode_holland ?? "-"}</span>{" "}
                {minat.perubahan.kode_holland_berubah ? (
                  <span className="app-badge app-badge--warn">kode berubah</span>
                ) : (
                  <span className="app-badge app-badge--ok">kode tetap</span>
                )}
                <span className="app-muted">
                  {" "}
                  • selisih skor:{" "}
                  {TIPE.map((t) => `${t} ${tanda(minat.perubahan!.selisih_per_tipe[t] ?? 0)}`).join(", ")}
                </span>
              </p>
            ) : (
              <p className="app-muted">Perubahan minat terlihat setelah tes minat dikerjakan minimal dua kali.</p>
            )}
          </>
        )}
      </section>

      <section className="app-card" aria-labelledby="pk-nilai">
        <h2 className="app-card__title" id="pk-nilai">Perkembangan Nilai Rapor</h2>
        {nilai.semester.length === 0 ? (
          <p className="app-muted">Belum ada nilai rapor.</p>
        ) : (
          <>
            <div className="app-table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Mapel</th>
                    {nilai.semester.map((s) => (
                      <th key={s} className="app-num">Sem {s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nilai.per_mapel.map((m) => (
                    <tr key={m.mapel.id}>
                      <td>{m.mapel.nama}</td>
                      {nilai.semester.map((s) => {
                        const n = m.nilai[s];
                        return (
                          <td key={s} className="app-num" title={n ? LABEL_STATUS_NILAI[n.status].label : undefined}>
                            {n ? (
                              <span className={n.status === "menunggu" ? "app-muted" : undefined}>{n.nilai}</span>
                            ) : (
                              "–"
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td><strong>Rata-rata</strong></td>
                    {nilai.rata_rata_per_semester.map((r) => (
                      <td key={r.semester} className="app-num app-score">{r.rata_rata}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="app-muted">
              Angka abu-abu = <span className={badge("info")}>menunggu verifikasi</span>. Nilai ditolak tidak dihitung.
            </p>
            {nilai.perubahan && (
              <p>
                Semester {nilai.perubahan.dari_semester} → {nilai.perubahan.ke_semester}: rata-rata mapel yang sama{" "}
                <strong>
                  {nilai.perubahan.rata_rata_mapel_sama.dari ?? "–"} → {nilai.perubahan.rata_rata_mapel_sama.ke ?? "–"}
                </strong>
                {nilai.perubahan.mapel.length > 0 && (
                  <span className="app-muted">
                    {" "}
                    • naik terbanyak: {nilai.perubahan.mapel[0].mapel.nama} ({tanda(nilai.perubahan.mapel[0].selisih)})
                    {nilai.perubahan.mapel.length > 1 &&
                      ` • turun terbanyak: ${nilai.perubahan.mapel[nilai.perubahan.mapel.length - 1].mapel.nama} (${tanda(
                        nilai.perubahan.mapel[nilai.perubahan.mapel.length - 1].selisih
                      )})`}
                  </span>
                )}
              </p>
            )}
          </>
        )}
      </section>
    </>
  );
}
