"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { AppShell, StatusMuat } from "../../../components/shared/AppShell";
import { daftarMapel } from "../../../lib/api/master";
import { daftarNilai, simpanSemester } from "../../../lib/api/nilai";
import { getMe } from "../../../lib/api/siswa";
import type { DaftarNilai, Mapel, NilaiRapor, SiswaSaya } from "../../../lib/api/types";
import { badge, LABEL_STATUS_NILAI } from "../../../lib/bk-label";
import { pesanError } from "../../../lib/riasec";

export default function NilaiRaporPage() {
  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [semuaMapel, setSemuaMapel] = useState<Mapel[]>([]);
  const [data, setData] = useState<DaftarNilai | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState(1);
  const [isian, setIsian] = useState<Record<number, string>>({});
  const [tambahan, setTambahan] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMe(), daftarMapel(), daftarNilai()])
      .then(([m, mp, n]) => {
        setMe(m);
        setSemuaMapel(mp);
        setData(n);
        setSemester(n.semester_maks ?? 1);
      })
      .catch((err) => setError(pesanError(err)));
  }, []);

  const nilaiSemester = useMemo(
    () => new Map((data?.nilai ?? []).filter((n) => n.semester === semester && n.mapel).map((n) => [n.mapel!.id, n])),
    [data, semester]
  );

  // Isi form dengan nilai yang sudah tersimpan setiap kali semester / data berubah.
  const isianAwal = useMemo(() => {
    const o: Record<number, string> = {};
    nilaiSemester.forEach((n, id) => (o[id] = String(n.nilai)));
    return o;
  }, [nilaiSemester]);
  const [kunciIsian, setKunciIsian] = useState("");
  const kunci = `${semester}:${data?.nilai.length ?? 0}`;
  if (kunci !== kunciIsian) {
    setKunciIsian(kunci);
    setIsian(isianAwal);
    setTambahan([]);
  }

  // Baris form: mapel yang diambil + mapel yang sudah punya nilai + tambahan manual.
  const barisMapel = useMemo(() => {
    const ids = new Set([...(me?.mapel.map((m) => m.mapel.id) ?? []), ...nilaiSemester.keys(), ...tambahan]);
    return semuaMapel.filter((m) => ids.has(m.id));
  }, [me, nilaiSemester, tambahan, semuaMapel]);
  const bisaDitambah = semuaMapel.filter((m) => !barisMapel.some((b) => b.id === m.id));

  const semesterMaks = data?.semester_maks ?? null;
  const daftarSemester = Array.from({ length: semesterMaks ?? 0 }, (_, i) => i + 1);

  const tidakValid = Object.entries(isian).filter(([, v]) => v.trim() !== "" && !(Number(v) > 0 && Number(v) <= 100));

  const simpan = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const nilai = Object.entries(isian)
        .filter(([id, v]) => v.trim() !== "" && nilaiSemester.get(Number(id))?.status !== "terverifikasi")
        .map(([id, v]) => ({ mapel_id: Number(id), nilai: Number(v) }));
      setData(await simpanSemester(semester, nilai));
      setInfo(`Nilai semester ${semester} tersimpan dan menunggu verifikasi Guru BK.`);
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const status = (n: NilaiRapor | undefined) =>
    n ? <span className={badge(LABEL_STATUS_NILAI[n.status].nada)}>{LABEL_STATUS_NILAI[n.status].label}</span> : <span className="app-muted">Belum diisi</span>;

  return (
    <AppShell peran="siswa">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Nilai Rapor</span>
          <h1 className="app-title">Input Nilai Rapor</h1>
          <p className="app-sub">
            Nilai yang kamu input akan diverifikasi Guru BK. Nilai terverifikasi terkunci dan hanya bisa diubah oleh BK.
          </p>
        </div>
      </div>

      {!data || !me ? (
        <StatusMuat error={error} />
      ) : !me.siswa ? (
        <div className="app-alert app-alert--warn">
          Lengkapi profil dulu di <Link href="/onboarding">onboarding</Link> sebelum mengisi nilai.
        </div>
      ) : semesterMaks === null ? (
        <div className="app-alert app-alert--warn">
          Tingkat kelas belum diisi. Lengkapi di <Link href="/onboarding">profil</Link>.
        </div>
      ) : (
        <section className="app-card">
          <div className="app-tabs" role="tablist" aria-label="Semester">
            {daftarSemester.map((s) => {
              const ada = data.nilai.filter((n) => n.semester === s).length;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={semester === s}
                  className={`app-chip${semester === s ? " app-chip--on" : ""}`}
                  onClick={() => setSemester(s)}
                >
                  Semester {s}
                  {ada > 0 && <span className="app-chip__count">{ada}</span>}
                </button>
              );
            })}
          </div>

          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Mata Pelajaran</th>
                  <th className="app-num">Nilai (1–100)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {barisMapel.map((m) => {
                  const n = nilaiSemester.get(m.id);
                  const terkunci = n?.status === "terverifikasi";
                  return (
                    <tr key={m.id}>
                      <td>{m.nama}</td>
                      <td className="app-num">
                        <input
                          className="app-input app-nilai-input"
                          inputMode="decimal"
                          aria-label={`Nilai ${m.nama}`}
                          disabled={terkunci}
                          value={isian[m.id] ?? ""}
                          onChange={(e) => setIsian((x) => ({ ...x, [m.id]: e.target.value.replace(",", ".") }))}
                        />
                      </td>
                      <td>{status(n)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {bisaDitambah.length > 0 && (
            <label className="app-field" style={{ maxWidth: 320 }}>
              <span className="app-label">Tambah mapel lain</span>
              <select
                className="app-select"
                value=""
                onChange={(e) => e.target.value && setTambahan((t) => [...t, Number(e.target.value)])}
              >
                <option value="">Pilih mapel…</option>
                {bisaDitambah.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </label>
          )}

          <p className="app-muted">Kosongkan nilai untuk mapel yang tidak kamu ambil di semester ini (nilainya akan dihapus).</p>
          {tidakValid.length > 0 && <div className="app-alert">Nilai harus angka lebih dari 0 sampai 100.</div>}
          {error && <div className="app-alert">{error}</div>}
          {info && <div className="app-alert app-alert--ok">{info}</div>}
          <div className="app-actions">
            <button
              type="button"
              className="app-btn app-btn--primary"
              disabled={busy || tidakValid.length > 0}
              onClick={simpan}
            >
              {busy ? "Menyimpan..." : `Simpan Semester ${semester}`}
            </button>
          </div>
        </section>
      )}
    </AppShell>
  );
}
