"use client";

import Link from "next/link";
import React, { useState } from "react";

import type {
  HasilRekomendasi,
  Keselarasan,
  Penjelasan,
  RekomendasiJenjang,
  RekomendasiMapel,
  RekomendasiProdi,
} from "../../lib/api/types";
import { badge, labelStatus } from "../../lib/bk-label";
import { LABEL_KURANG, labelJenis, persen, pesanError } from "../../lib/riasec";

/** Tampilan bila prasyarat rekomendasi belum lengkap. */
export function BelumTersedia({ kurang, tautan = true }: { kurang: string[]; tautan?: boolean }) {
  return (
    <div className="app-alert app-alert--warn">
      Belum bisa dihitung. Yang perlu dilengkapi:
      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
        {kurang.map((k) => {
          const info = LABEL_KURANG[k] ?? { label: k, href: "" };
          return (
            <li key={k}>{tautan && info.href ? <Link href={info.href}>{info.label}</Link> : info.label}</li>
          );
        })}
      </ul>
    </div>
  );
}

/** Tombol + teks penjelasan naratif dari backend (LLM atau template). */
export function TombolPenjelasan({ ambil }: { ambil: () => Promise<Penjelasan> }) {
  const [hasil, setHasil] = useState<Penjelasan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const klik = async () => {
    setBusy(true);
    setError(null);
    try {
      setHasil(await ambil());
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-list">
      {!hasil && (
        <button type="button" className="app-btn app-btn--sm" disabled={busy} onClick={klik}>
          {busy ? "Menyusun penjelasan..." : "Jelaskan hasil ini"}
        </button>
      )}
      {error && <div className="app-alert">{error}</div>}
      {hasil && (
        <div className="app-note">
          <span className="app-note__meta">Penjelasan ({hasil.model})</span>
          <p className="app-pre">{hasil.penjelasan ?? `Penjelasan belum tersedia: ${hasil.alasan ?? "coba lagi nanti"}.`}</p>
        </div>
      )}
    </div>
  );
}

const SkorBar = ({ label, nilai }: { label: string; nilai: number }) => (
  <li>
    <div className="app-bar__head">
      <span>{label}</span>
      <strong>{persen(nilai)}</strong>
    </div>
    <div className="app-bar__track">
      <div className="app-bar__fill" style={{ width: `${Math.round(nilai * 100)}%` }} />
    </div>
  </li>
);

export function KartuKeselarasan({
  data,
  penjelasan,
  tautan = true,
}: {
  data: HasilRekomendasi<Keselarasan> | null;
  penjelasan?: () => Promise<Penjelasan>;
  tautan?: boolean;
}) {
  return (
    <section className="app-card" aria-labelledby="kes-title">
      <div className="app-card__head">
        <h2 className="app-card__title" id="kes-title">Keselarasan Target Prodi Utama</h2>
        {data?.tersedia && (
          <span className={badge(labelStatus(data.hasil.status).nada)}>{labelStatus(data.hasil.status).label}</span>
        )}
      </div>
      {!data ? (
        <p className="app-muted">Memuat...</p>
      ) : !data.tersedia ? (
        <BelumTersedia kurang={data.kurang} tautan={tautan} />
      ) : (
        <>
          <p>
            <strong>{data.hasil.target.prodi.nama}</strong>{" "}
            <span className="app-muted">
              • peringkat {data.hasil.target.peringkat} dari {data.hasil.jumlah_prodi_dinilai} prodi
            </span>
          </p>
          <ul className="app-bars">
            <SkorBar label="Skor total" nilai={data.hasil.target.skor.total} />
            <SkorBar label="Kecocokan minat (RIASEC)" nilai={data.hasil.target.skor.minat} />
            <SkorBar label="Kesiapan akademik" nilai={data.hasil.target.skor.akademik} />
            <SkorBar label="Keterkaitan karir" nilai={data.hasil.target.skor.karir} />
          </ul>
          {data.hasil.alasan_status.length > 0 && (
            <p className="app-muted">Dasar status: {data.hasil.alasan_status.join("; ")}.</p>
          )}

          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Mapel pendukung</th>
                  <th className="app-num">Bobot</th>
                  <th className="app-num">Nilai</th>
                  <th className="app-num">Selisih*</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.hasil.kesenjangan.mapel.map((m) => (
                  <tr key={m.kode}>
                    <td>{m.nama}</td>
                    <td className="app-num">{m.bobot}</td>
                    <td className="app-num">{m.nilai ?? "–"}</td>
                    <td className="app-num">{m.selisih == null ? "–" : `${m.selisih > 0 ? "+" : ""}${m.selisih}`}</td>
                    <td>
                      <span
                        className={badge(
                          m.status === "aman" ? "ok" : m.status === "di_bawah_rata_rata" ? "warn" : ""
                        )}
                      >
                        {m.status === "aman"
                          ? "Aman"
                          : m.status === "di_bawah_rata_rata"
                            ? "Di bawah rata-rata"
                            : "Tidak diambil"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="app-muted">
            *Dibanding rata-rata nilai siswa sendiri ({data.hasil.kesenjangan.rata_rata_siswa ?? "–"}).
          </p>

          {data.hasil.alternatif.length > 0 && (
            <p className="app-muted">
              Alternatif teratas: {data.hasil.alternatif.map((a) => `${a.prodi.nama} (${persen(a.skor.total)})`).join(", ")}
            </p>
          )}
          {data.hasil.katalog_draf && (
            <p className="app-muted">Catatan: sebagian data katalog masih draf dan belum diverifikasi.</p>
          )}
          {penjelasan && <TombolPenjelasan ambil={penjelasan} />}
        </>
      )}
    </section>
  );
}

export function TabelRekomendasiProdi({
  data,
  penjelasan,
  tautan = true,
}: {
  data: HasilRekomendasi<RekomendasiProdi> | null;
  penjelasan?: () => Promise<Penjelasan>;
  tautan?: boolean;
}) {
  return (
    <section className="app-card" aria-labelledby="rek-title">
      <div className="app-card__head">
        <h2 className="app-card__title" id="rek-title">Rekomendasi Prodi</h2>
        {data?.tersedia && (
          <span className="app-muted">
            Bobot minat {persen(data.hasil.bobot.minat)} • akademik {persen(data.hasil.bobot.akademik)} • karir{" "}
            {persen(data.hasil.bobot.karir)}
          </span>
        )}
      </div>
      {!data ? (
        <p className="app-muted">Memuat...</p>
      ) : !data.tersedia ? (
        <BelumTersedia kurang={data.kurang} tautan={tautan} />
      ) : (
        <>
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Prodi</th>
                  <th>Jenis</th>
                  <th className="app-num">Total</th>
                  <th className="app-num">Minat</th>
                  <th className="app-num">Akademik</th>
                  <th className="app-num">Karir</th>
                </tr>
              </thead>
              <tbody>
                {data.hasil.prodi.map((p) => (
                  <tr key={p.prodi.id}>
                    <td>{p.peringkat}</td>
                    <td>
                      {p.prodi.nama}
                      <div className="app-muted">
                        {p.prodi.bidang_studi?.nama ?? "-"} • RIASEC {p.prodi.kode_riasec ?? "-"}
                        {p.akademik.data_kurang ? " • data nilai kurang" : ""}
                      </div>
                    </td>
                    <td>{labelJenis(p.prodi.jenis_pendidikan)}</td>
                    <td className="app-num app-score">{persen(p.skor.total)}</td>
                    <td className="app-num">{persen(p.skor.minat)}</td>
                    <td className="app-num">{persen(p.skor.akademik)}</td>
                    <td className="app-num">{persen(p.skor.karir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="app-muted">
            Dinilai dari {data.hasil.jumlah_prodi_dinilai} prodi • profil {data.hasil.kode_holland ?? "-"}
          </p>
          {penjelasan && <TombolPenjelasan ambil={penjelasan} />}
        </>
      )}
    </section>
  );
}

export function KartuRekomendasiMapel({ data }: { data: HasilRekomendasi<RekomendasiMapel> | null }) {
  return (
    <section className="app-card">
      <div className="app-card__head">
        <h2 className="app-card__title">Rekomendasi Mapel Pilihan</h2>
        {data?.tersedia && !data.hasil.relevan && <span className="app-badge">Kelas 12: hanya referensi</span>}
      </div>
      {!data ? (
        <p className="app-muted">Memuat...</p>
      ) : !data.tersedia ? (
        <BelumTersedia kurang={data.kurang} tautan={false} />
      ) : data.hasil.mapel.length === 0 ? (
        <p className="app-muted">Tidak ada mapel pilihan yang relevan.</p>
      ) : (
        <ul className="app-bars">
          {data.hasil.mapel.slice(0, 6).map((m) => (
            <li key={m.mapel.id}>
              <div className="app-bar__head">
                <span>
                  {m.mapel.nama} {m.sudah_diambil && <span className="app-badge app-badge--ok">diambil</span>}
                </span>
                <strong>{persen(m.skor)}</strong>
              </div>
              <div className="app-bar__track">
                <div className="app-bar__fill" style={{ width: `${Math.round(m.skor * 100)}%` }} />
              </div>
              <span className="app-muted">Mendukung: {m.dukungan.map((d) => d.prodi).join(", ")}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const LABEL_JENJANG: Record<string, string> = {
  S1: "S1 Akademik",
  D4: "D4 Sarjana Terapan",
  D3: "D3 Vokasi",
  kedinasan: "Sekolah Kedinasan",
};

export function KartuRekomendasiJenjang({ data }: { data: HasilRekomendasi<RekomendasiJenjang> | null }) {
  const maks = data?.tersedia ? Math.max(1, ...data.hasil.jenjang.map((j) => j.poin)) : 1;
  return (
    <section className="app-card">
      <h2 className="app-card__title">Rekomendasi Jenjang Pendidikan</h2>
      {!data ? (
        <p className="app-muted">Memuat...</p>
      ) : !data.tersedia ? (
        <BelumTersedia kurang={data.kurang} tautan={false} />
      ) : (
        <>
          <ul className="app-bars">
            {data.hasil.jenjang.map((j) => (
              <li key={j.jenjang}>
                <div className="app-bar__head">
                  <span>{LABEL_JENJANG[j.jenjang] ?? j.jenjang}</span>
                  <strong>{j.poin} poin</strong>
                </div>
                <div className="app-bar__track">
                  <div className="app-bar__fill" style={{ width: `${(j.poin / maks) * 100}%` }} />
                </div>
                {j.alasan.length > 0 && <span className="app-muted">{j.alasan.join(", ")}</span>}
              </li>
            ))}
          </ul>
          {data.hasil.catatan && <p className="app-muted">{data.hasil.catatan}</p>}
        </>
      )}
    </section>
  );
}
