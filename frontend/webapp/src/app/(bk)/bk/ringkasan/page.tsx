"use client";

import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../../components/shared/AppShell";
import { ringkasan, type FilterAngkatan } from "../../../../lib/api/bk";
import type { RingkasanBk, TipeRiasec } from "../../../../lib/api/types";
import { NAMA_RIASEC, pesanError } from "../../../../lib/riasec";

function Distribusi({
  judul,
  data,
  total,
  label = (n) => n,
}: {
  judul: string;
  data: { nama: string; jumlah: number }[];
  total: number;
  label?: (nama: string) => string;
}) {
  const maks = Math.max(1, ...data.map((d) => d.jumlah));
  return (
    <section className="app-card">
      <h2 className="app-card__title">{judul}</h2>
      {data.length === 0 ? (
        <p className="app-muted">Belum ada data.</p>
      ) : (
        <ul className="app-bars">
          {data.map((d) => (
            <li key={d.nama}>
              <div className="app-bar__head">
                <span>{label(d.nama)}</span>
                <strong>
                  {d.jumlah}
                  {total > 0 && <span className="app-muted"> ({Math.round((d.jumlah / total) * 100)}%)</span>}
                </strong>
              </div>
              <div className="app-bar__track">
                <div className="app-bar__fill" style={{ width: `${(d.jumlah / maks) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function BkRingkasanPage() {
  const [angkatan, setAngkatan] = useState<FilterAngkatan>(undefined);
  const [data, setData] = useState<RingkasanBk | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let batal = false;
    ringkasan(angkatan)
      .then((d) => !batal && setData(d))
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, [angkatan]);

  const nilaiSelect = angkatan === undefined ? "" : String(angkatan);

  return (
    <AppShell peran="bk">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Panel Guru BK • UC13</span>
          <h1 className="app-title">Ringkasan Angkatan</h1>
          <p className="app-sub">Gambaran minat, target prodi, karir, dan mapel pilihan siswa di sekolahmu.</p>
        </div>
        <label className="app-field" style={{ minWidth: 200 }}>
          <span className="app-label">Angkatan (tahun lulus)</span>
          <select
            className="app-select"
            value={nilaiSelect}
            onChange={(e) => {
              const v = e.target.value;
              setAngkatan(v === "" ? undefined : v === "kosong" ? "kosong" : Number(v));
            }}
          >
            <option value="">Semua angkatan</option>
            {data?.angkatan_tersedia.map((a) => (
              <option key={a.angkatan ?? "kosong"} value={a.angkatan ?? "kosong"}>
                {a.angkatan ?? "Belum diisi"} ({a.jumlah_siswa} siswa)
              </option>
            ))}
          </select>
        </label>
      </div>

      {!data ? (
        <StatusMuat error={error} />
      ) : (
        <>
          <div className="app-stats">
            <div className="app-stat">
              <span className="app-stat__label">Jumlah siswa</span>
              <span className="app-stat__value">{data.jumlah_siswa}</span>
            </div>
            <div className="app-stat">
              <span className="app-stat__label">Sudah tes minat</span>
              <span className="app-stat__value">{data.jumlah_sudah_asesmen}</span>
              <span className="app-stat__note">
                {data.jumlah_siswa ? Math.round((data.jumlah_sudah_asesmen / data.jumlah_siswa) * 100) : 0}% dari siswa
              </span>
            </div>
          </div>

          <div className="app-grid app-grid--2">
            <Distribusi
              judul="Minat Dominan (RIASEC)"
              data={data.minat_dominan}
              total={data.jumlah_sudah_asesmen}
              label={(n) => (NAMA_RIASEC[n as TipeRiasec] ? `${NAMA_RIASEC[n as TipeRiasec]} (${n})` : n)}
            />
            <Distribusi judul="Rumpun Target Prodi" data={data.rumpun_target} total={0} />
            <Distribusi judul="Bidang Karir yang Diminati" data={data.bidang_karir_target} total={0} />
            <Distribusi judul="Mapel Pilihan yang Diambil" data={data.mapel_pilihan} total={data.jumlah_siswa} />
          </div>
        </>
      )}
    </AppShell>
  );
}
