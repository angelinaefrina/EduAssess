"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { AppShell, StatusMuat } from "../../../../../components/shared/AppShell";
import { PerkembanganView } from "../../../../../components/shared/PerkembanganView";
import {
  KartuKeselarasan,
  KartuRekomendasiJenjang,
  KartuRekomendasiMapel,
  TabelRekomendasiProdi,
} from "../../../../../components/shared/Rekomendasi";
import {
  daftarCatatan,
  detailSiswa,
  hapusCatatan,
  keluarkanSiswa,
  keselarasanSiswa,
  nilaiSiswa,
  penjelasanSiswa,
  perkembanganSiswa,
  putuskanNilai,
  rekomendasiJenjangSiswa,
  rekomendasiMapelSiswa,
  rekomendasiProdiSiswa,
  tambahCatatan,
  ubahCatatan,
} from "../../../../../lib/api/bk";
import type {
  CatatanKonseling,
  DetailSiswaBk,
  HasilRekomendasi,
  Keselarasan,
  NilaiSiswaBk,
  Perkembangan,
  RekomendasiJenjang,
  RekomendasiMapel,
  RekomendasiProdi,
  TipeRiasec,
} from "../../../../../lib/api/types";
import { badge, kelasSiswa, LABEL_PENANDA, LABEL_STATUS_NILAI } from "../../../../../lib/bk-label";
import { NAMA_RIASEC, pesanError, tanggal } from "../../../../../lib/riasec";

const TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "rekomendasi", label: "Rekomendasi" },
  { id: "nilai", label: "Nilai Rapor" },
  { id: "perkembangan", label: "Perkembangan" },
  { id: "catatan", label: "Catatan Konseling" },
] as const;
type Tab = (typeof TABS)[number]["id"];

// ─── Profil ──────────────────────────────────────────────────────────────────

function KartuProfil({ d }: { d: DetailSiswaBk }) {
  const pref = (d.preferensi ?? {}) as {
    gaya_belajar?: string | null;
    ingin_cepat_kerja?: boolean | null;
    pertimbangan_biaya?: number | null;
    jenjang_diminati?: string[];
  };
  const riasec = d.asesmen_terakhir?.riasec ?? null;
  return (
    <section className="app-card">
      <h2 className="app-card__title">Profil & Pilihan Siswa</h2>
      <dl className="app-dl">
        <dt>Peminatan</dt>
        <dd>{d.siswa?.peminatan ?? "–"}</dd>
        <dt>Angkatan</dt>
        <dd>{d.siswa?.angkatan ?? "–"}</dd>
        <dt>Mapel diambil</dt>
        <dd>{d.mapel.map((m) => m.mapel.nama).join(", ") || "–"}</dd>
        <dt>Mapel favorit</dt>
        <dd>{d.mapel_favorit.map((m) => m.mapel.nama).join(", ") || "–"}</dd>
        <dt>Rumpun karir</dt>
        <dd>{d.bidang_karir.map((b) => b.bidang_karir.nama).join(", ") || "–"}</dd>
        <dt>Karir impian</dt>
        <dd>{d.target_karir.map((t) => t.karir?.nama ?? t.teks_bebas).join(", ") || "–"}</dd>
        <dt>Jenjang diminati</dt>
        <dd>{pref.jenjang_diminati?.join(", ") || "–"}</dd>
        <dt>Gaya belajar</dt>
        <dd>
          {pref.gaya_belajar ?? "–"}
          {pref.ingin_cepat_kerja ? " • ingin cepat bekerja" : ""}
          {pref.pertimbangan_biaya ? ` • pertimbangan biaya ${pref.pertimbangan_biaya}/5` : ""}
        </dd>
      </dl>

      <h3 className="app-card__title" style={{ fontSize: 14 }}>Target Prodi</h3>
      {d.target_prodi.length === 0 ? (
        <p className="app-muted">Belum memilih target prodi.</p>
      ) : (
        <ul className="app-list">
          {d.target_prodi.map((t) => (
            <li key={t.id}>
              {t.prodi?.nama ?? "-"} {t.is_utama && <span className="app-badge app-badge--info">utama</span>}{" "}
              <span className="app-muted">({t.sumber.replace("_", " ")})</span>
            </li>
          ))}
        </ul>
      )}

      <h3 className="app-card__title" style={{ fontSize: 14 }}>Tes Minat Terakhir</h3>
      {!d.asesmen_terakhir ? (
        <p className="app-muted">Belum mengerjakan tes minat.</p>
      ) : (
        <p>
          <span className="app-mono">{d.asesmen_terakhir.kode_holland ?? "-"}</span>{" "}
          <span className="app-muted">
            • {tanggal(d.asesmen_terakhir.selesai_at)} •{" "}
            {riasec
              ? (Object.keys(NAMA_RIASEC) as TipeRiasec[])
                  .map((t) => `${t} ${riasec[t] != null ? Number(riasec[t]).toFixed(1) : "-"}`)
                  .join(", ")
              : ""}
          </span>
        </p>
      )}
    </section>
  );
}

// ─── Nilai + verifikasi ──────────────────────────────────────────────────────

function KartuNilai({ siswaId, onBerubah }: { siswaId: string; onBerubah: () => void }) {
  const [data, setData] = useState<NilaiSiswaBk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pilih, setPilih] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    nilaiSiswa(siswaId)
      .then(setData)
      .catch((err) => setError(pesanError(err)));
  }, [siswaId]);

  const perSemester = useMemo(() => {
    const m = new Map<number, NilaiSiswaBk["nilai"]>();
    for (const n of data?.nilai ?? []) m.set(n.semester, [...(m.get(n.semester) ?? []), n]);
    return [...m.entries()].sort(([a], [b]) => a - b);
  }, [data]);

  const jumlahMenunggu = data?.nilai.filter((n) => n.status === "menunggu").length ?? 0;

  const putuskan = async (status: "terverifikasi" | "ditolak", semua = false) => {
    setBusy(true);
    setInfo(null);
    try {
      const r = await putuskanNilai(siswaId, { status, ids: semua ? undefined : [...pilih] });
      setInfo(`${r.jumlah} nilai ditandai ${LABEL_STATUS_NILAI[status].label.toLowerCase()}.`);
      setPilih(new Set());
      setData(await nilaiSiswa(siswaId));
      onBerubah();
    } catch (err) {
      setInfo(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <StatusMuat error={error} />;

  return (
    <section className="app-card">
      <div className="app-card__head">
        <h2 className="app-card__title">Nilai Rapor</h2>
        <span className="app-actions">
          <button
            type="button"
            className="app-btn app-btn--sm"
            disabled={busy || pilih.size === 0}
            onClick={() => putuskan("ditolak")}
          >
            Tolak terpilih ({pilih.size})
          </button>
          <button
            type="button"
            className="app-btn app-btn--sm"
            disabled={busy || pilih.size === 0}
            onClick={() => putuskan("terverifikasi")}
          >
            Setujui terpilih ({pilih.size})
          </button>
          <button
            type="button"
            className="app-btn app-btn--sm app-btn--primary"
            disabled={busy || jumlahMenunggu === 0}
            onClick={() => putuskan("terverifikasi", true)}
          >
            Setujui semua yang menunggu ({jumlahMenunggu})
          </button>
        </span>
      </div>
      {info && <div className="app-alert app-alert--ok">{info}</div>}
      {perSemester.length === 0 ? (
        <p className="app-empty">Siswa belum mengisi nilai rapor.</p>
      ) : (
        perSemester.map(([sem, list]) => (
          <div key={sem} className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }} />
                  <th>Semester {sem}</th>
                  <th className="app-num">Nilai</th>
                  <th>Sumber</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id}>
                    <td>
                      {n.status === "menunggu" && (
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${n.mapel?.nama}`}
                          checked={pilih.has(n.id)}
                          onChange={() =>
                            setPilih((p) => {
                              const s = new Set(p);
                              if (s.has(n.id)) s.delete(n.id);
                              else s.add(n.id);
                              return s;
                            })
                          }
                        />
                      )}
                    </td>
                    <td>{n.mapel?.nama ?? "-"}</td>
                    <td className="app-num app-score">{n.nilai}</td>
                    <td className="app-muted">{n.sumber.replace("_", " ")}</td>
                    <td>
                      <span className={badge(LABEL_STATUS_NILAI[n.status].nada)}>{LABEL_STATUS_NILAI[n.status].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </section>
  );
}

// ─── Catatan konseling ───────────────────────────────────────────────────────

function KartuCatatan({ siswaId }: { siswaId: string }) {
  const [list, setList] = useState<CatatanKonseling[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isi, setIsi] = useState("");
  const [tindak, setTindak] = useState("");
  const [edit, setEdit] = useState<{ id: string; isi: string; tindak: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    daftarCatatan(siswaId)
      .then(setList)
      .catch((err) => setError(pesanError(err)));
  }, [siswaId]);

  const jalankan = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const tambah = () =>
    jalankan(async () => {
      const baru = await tambahCatatan(siswaId, { isi: isi.trim(), tindak_lanjut: tindak.trim() || null });
      setList((l) => [baru, ...(l ?? [])]);
      setIsi("");
      setTindak("");
    });

  const simpanEdit = () =>
    jalankan(async () => {
      if (!edit) return;
      const baru = await ubahCatatan(edit.id, { isi: edit.isi.trim(), tindak_lanjut: edit.tindak.trim() || null });
      setList((l) => l?.map((c) => (c.id === baru.id ? baru : c)) ?? null);
      setEdit(null);
    });

  const hapus = (id: string) =>
    jalankan(async () => {
      if (!window.confirm("Hapus catatan ini?")) return;
      await hapusCatatan(id);
      setList((l) => l?.filter((c) => c.id !== id) ?? null);
    });

  return (
    <section className="app-card" aria-labelledby="catatan-title">
      <h2 className="app-card__title" id="catatan-title">Catatan Konseling</h2>
      <label className="app-field">
        <span className="app-label">Catatan baru</span>
        <textarea className="app-textarea" value={isi} maxLength={5000} onChange={(e) => setIsi(e.target.value)} />
      </label>
      <label className="app-field">
        <span className="app-label">Tindak lanjut (opsional)</span>
        <input className="app-input" value={tindak} maxLength={2000} onChange={(e) => setTindak(e.target.value)} />
      </label>
      <div className="app-actions">
        <button type="button" className="app-btn app-btn--primary" disabled={busy || !isi.trim()} onClick={tambah}>
          Simpan Catatan
        </button>
      </div>
      {error && <div className="app-alert">{error}</div>}

      {list === null ? (
        !error && <p className="app-muted">Memuat catatan...</p>
      ) : list.length === 0 ? (
        <p className="app-muted">Belum ada catatan konseling.</p>
      ) : (
        <ul className="app-list">
          {list.map((c) => (
            <li key={c.id} className="app-note">
              <span className="app-note__meta">
                {tanggal(c.created_at)} • {c.bk?.nama ?? "Guru BK"}
                {c.updated_at !== c.created_at ? " • diubah" : ""}
              </span>
              {edit?.id === c.id ? (
                <>
                  <textarea
                    className="app-textarea"
                    value={edit.isi}
                    onChange={(e) => setEdit({ ...edit, isi: e.target.value })}
                  />
                  <input
                    className="app-input"
                    placeholder="Tindak lanjut"
                    value={edit.tindak}
                    onChange={(e) => setEdit({ ...edit, tindak: e.target.value })}
                  />
                  <span className="app-actions">
                    <button type="button" className="app-btn app-btn--sm app-btn--primary" disabled={busy || !edit.isi.trim()} onClick={simpanEdit}>
                      Simpan
                    </button>
                    <button type="button" className="app-btn app-btn--sm" onClick={() => setEdit(null)}>
                      Batal
                    </button>
                  </span>
                </>
              ) : (
                <>
                  <p className="app-pre">{c.isi}</p>
                  {c.tindak_lanjut && (
                    <p>
                      <strong>Tindak lanjut:</strong> {c.tindak_lanjut}
                    </p>
                  )}
                  <span className="app-actions">
                    <button
                      type="button"
                      className="app-btn app-btn--sm"
                      onClick={() => setEdit({ id: c.id, isi: c.isi, tindak: c.tindak_lanjut ?? "" })}
                    >
                      Ubah
                    </button>
                    <button type="button" className="app-btn app-btn--sm app-btn--danger" disabled={busy} onClick={() => hapus(c.id)}>
                      Hapus
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function DetailSiswa() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("ringkasan");
  const [d, setD] = useState<DetailSiswaBk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kes, setKes] = useState<HasilRekomendasi<Keselarasan> | null>(null);
  const [prodi, setProdi] = useState<HasilRekomendasi<RekomendasiProdi> | null>(null);
  const [mapel, setMapel] = useState<HasilRekomendasi<RekomendasiMapel> | null>(null);
  const [jenjang, setJenjang] = useState<HasilRekomendasi<RekomendasiJenjang> | null>(null);
  const [pk, setPk] = useState<Perkembangan | null>(null);
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    let batal = false;
    detailSiswa(id)
      .then((x) => !batal && setD(x))
      .catch((err) => !batal && setError(pesanError(err)));
    keselarasanSiswa(id).then((x) => !batal && setKes(x)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [id, versi]);

  useEffect(() => {
    if (tab === "rekomendasi" && !prodi) {
      rekomendasiProdiSiswa(id).then(setProdi).catch((err) => setError(pesanError(err)));
      rekomendasiMapelSiswa(id).then(setMapel).catch(() => undefined);
      rekomendasiJenjangSiswa(id).then(setJenjang).catch(() => undefined);
    }
    if (tab === "perkembangan" && !pk) perkembanganSiswa(id).then(setPk).catch((err) => setError(pesanError(err)));
  }, [tab, id, prodi, pk]);

  const keluarkan = async () => {
    if (!d || !window.confirm(`Keluarkan ${d.profil.nama ?? "siswa ini"} dari sekolah? Data siswa tetap tersimpan.`)) return;
    try {
      await keluarkanSiswa(id);
      window.location.replace("/bk/dashboard");
    } catch (err) {
      setError(pesanError(err));
    }
  };

  return (
    <AppShell peran="bk">
      <Link href="/bk/dashboard" className="app-btn app-btn--sm app-btn--ghost" style={{ alignSelf: "flex-start" }}>
        ← Kembali ke dashboard
      </Link>

      {!d ? (
        <StatusMuat error={error} />
      ) : (
        <>
          <div className="app-head">
            <div>
              <span className="app-eyebrow">Detail Siswa • UC10–UC12</span>
              <h1 className="app-title">{d.profil.nama ?? "(tanpa nama)"}</h1>
              <p className="app-sub">
                {d.siswa ? kelasSiswa(d.siswa) : "Belum onboarding"} • {d.siswa?.peminatan ?? "-"} •{" "}
                {d.profil.sekolah?.nama ?? "-"}
              </p>
              <div className="app-chips" style={{ marginTop: 8 }}>
                {d.penanda.map((p) => (
                  <span key={p} className={badge(LABEL_PENANDA[p].nada)}>{LABEL_PENANDA[p].label}</span>
                ))}
              </div>
            </div>
            <button type="button" className="app-btn app-btn--danger" onClick={keluarkan}>
              Keluarkan dari Sekolah
            </button>
          </div>

          {error && <div className="app-alert">{error}</div>}

          <div className="app-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`app-chip${tab === t.id ? " app-chip--on" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === "nilai" && d.nilai.per_status.menunggu > 0 && (
                  <span className="app-chip__count">{d.nilai.per_status.menunggu}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "ringkasan" && (
            <div className="app-grid app-grid--2">
              <KartuProfil d={d} />
              <div className="app-list" style={{ gap: 20 }}>
                <KartuKeselarasan data={kes} tautan={false} penjelasan={() => penjelasanSiswa(id, "keselarasan")} />
                <section className="app-card">
                  <h2 className="app-card__title">Catatan Terbaru</h2>
                  {d.catatan_terbaru.length === 0 ? (
                    <p className="app-muted">Belum ada catatan.</p>
                  ) : (
                    <ul className="app-list">
                      {d.catatan_terbaru.map((c) => (
                        <li key={c.id} className="app-note">
                          <span className="app-note__meta">{tanggal(c.created_at)} • {c.bk?.nama ?? "Guru BK"}</span>
                          <p className="app-pre">{c.isi}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
          )}

          {tab === "rekomendasi" && (
            <>
              <TabelRekomendasiProdi data={prodi} tautan={false} penjelasan={() => penjelasanSiswa(id, "prodi")} />
              <div className="app-grid app-grid--2">
                <KartuRekomendasiMapel data={mapel} />
                <KartuRekomendasiJenjang data={jenjang} />
              </div>
            </>
          )}

          {tab === "nilai" && <KartuNilai siswaId={id} onBerubah={() => setVersi((v) => v + 1)} />}

          {tab === "perkembangan" && (pk ? <PerkembanganView data={pk} /> : <StatusMuat error={null} />)}

          {tab === "catatan" && <KartuCatatan siswaId={id} />}
        </>
      )}
    </AppShell>
  );
}
