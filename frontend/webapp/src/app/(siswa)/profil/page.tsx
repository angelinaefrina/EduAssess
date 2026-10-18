"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../components/shared/AppShell";
import { getTarget, hapusTargetProdi, jadikanTargetUtama } from "../../../lib/api/rekomendasi";
import { gabungSekolah, getMe, hapusTargetKarir } from "../../../lib/api/siswa";
import type { DaftarTarget, SiswaSaya } from "../../../lib/api/types";
import { labelJenis, pesanError } from "../../../lib/riasec";

const LABEL_KURANG_PROFIL: Record<string, string> = {
  nama: "nama",
  tingkat: "tingkat kelas",
  peminatan: "peminatan",
  sekolah: "sekolah (kode BK)",
};

export default function ProfilPage() {
  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [target, setTarget] = useState<DaftarTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kode, setKode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getMe(), getTarget()])
      .then(([m, t]) => {
        setMe(m);
        setTarget(t);
      })
      .catch((err) => setError(pesanError(err)));
  }, []);

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

  const pref = (me?.preferensi ?? {}) as {
    gaya_belajar?: string | null;
    ingin_cepat_kerja?: boolean | null;
    pertimbangan_biaya?: number | null;
    jenjang_diminati?: string[];
  };

  return (
    <AppShell peran="siswa">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Profil Siswa</span>
          <h1 className="app-title">{me?.profil.nama ?? "Profil"}</h1>
          <p className="app-sub">{me?.profil.sekolah?.nama ?? "Belum terdaftar di sekolah"}</p>
        </div>
        <Link href="/onboarding" className="app-btn app-btn--primary">
          Ubah Profil & Preferensi
        </Link>
      </div>

      {error && <div className="app-alert">{error}</div>}

      {!me || !target ? (
        !error && <StatusMuat error={null} />
      ) : (
        <>
          {!me.kelengkapan.lengkap && (
            <div className="app-alert app-alert--warn">
              Profil belum lengkap: {me.kelengkapan.kurang.map((k) => LABEL_KURANG_PROFIL[k] ?? k).join(", ")}.
            </div>
          )}

          <div className="app-grid app-grid--2">
            <section className="app-card">
              <h2 className="app-card__title">Data Diri</h2>
              <dl className="app-dl">
                <dt>Kelas</dt>
                <dd>
                  {me.siswa?.tingkat ? `Kelas ${me.siswa.tingkat}${me.siswa.rombel ? ` ${me.siswa.rombel}` : ""}` : "–"}
                </dd>
                <dt>Peminatan</dt>
                <dd>{me.siswa?.peminatan ?? "–"}</dd>
                <dt>Tahun lulus</dt>
                <dd>{me.siswa?.angkatan ?? "–"}</dd>
                <dt>Mapel diambil</dt>
                <dd>{me.mapel.map((m) => m.mapel.nama).join(", ") || "–"}</dd>
                <dt>Mapel favorit</dt>
                <dd>{me.mapel_favorit.map((m) => m.mapel.nama).join(", ") || "–"}</dd>
                <dt>Rumpun karir</dt>
                <dd>{me.bidang_karir.map((b) => b.bidang_karir.nama).join(", ") || "–"}</dd>
                <dt>Jenjang diminati</dt>
                <dd>{pref.jenjang_diminati?.join(", ") || "–"}</dd>
                <dt>Gaya belajar</dt>
                <dd>{pref.gaya_belajar ?? "–"}</dd>
                <dt>Ingin cepat kerja</dt>
                <dd>{pref.ingin_cepat_kerja == null ? "–" : pref.ingin_cepat_kerja ? "Ya" : "Tidak"}</dd>
                <dt>Pertimbangan biaya</dt>
                <dd>{pref.pertimbangan_biaya ? `${pref.pertimbangan_biaya} / 5` : "–"}</dd>
              </dl>

              {!me.profil.sekolah && (
                <div className="app-filters">
                  <label className="app-field app-field--grow">
                    <span className="app-label">Kode sekolah dari Guru BK</span>
                    <input
                      className="app-input"
                      value={kode}
                      maxLength={20}
                      onChange={(e) => setKode(e.target.value.toUpperCase())}
                    />
                  </label>
                  <button
                    type="button"
                    className="app-btn app-btn--primary"
                    disabled={busy || !kode.trim()}
                    onClick={() =>
                      jalankan(async () => {
                        await gabungSekolah(kode.trim());
                        setMe(await getMe());
                        setKode("");
                      })
                    }
                  >
                    Gabung Sekolah
                  </button>
                </div>
              )}
            </section>

            <div className="app-list" style={{ gap: 20 }}>
              <section className="app-card">
                <div className="app-card__head">
                  <h2 className="app-card__title">Target Prodi</h2>
                  <Link href="/katalog-prodi" className="app-btn app-btn--sm">Tambah dari Katalog</Link>
                </div>
                {target.prodi.length === 0 ? (
                  <p className="app-muted">Belum ada target prodi.</p>
                ) : (
                  <ul className="app-list">
                    {target.prodi.map((t) => (
                      <li key={t.id} className="app-note">
                        <div className="app-card__head">
                          <span>
                            <strong>{t.prodi?.nama ?? "-"}</strong>{" "}
                            {t.is_utama && <span className="app-badge app-badge--info">Target utama</span>}
                            <span className="app-muted" style={{ display: "block" }}>
                              {t.prodi?.bidang_studi?.nama ?? "-"} • {labelJenis(t.prodi ? [t.prodi.jenis_pendidikan].flat() : [])}
                            </span>
                          </span>
                          <span className="app-actions">
                            {!t.is_utama && (
                              <button
                                type="button"
                                className="app-btn app-btn--sm"
                                disabled={busy}
                                onClick={() =>
                                  jalankan(async () => {
                                    const prodi = await jadikanTargetUtama(t.id);
                                    setTarget((x) => x && { ...x, prodi });
                                  })
                                }
                              >
                                Jadikan utama
                              </button>
                            )}
                            <button
                              type="button"
                              className="app-btn app-btn--sm app-btn--danger"
                              disabled={busy}
                              onClick={() =>
                                jalankan(async () => {
                                  const prodi = await hapusTargetProdi(t.id);
                                  setTarget((x) => x && { ...x, prodi });
                                })
                              }
                            >
                              Hapus
                            </button>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="app-card">
                <div className="app-card__head">
                  <h2 className="app-card__title">Karir Impian</h2>
                  <Link href="/eksplorasi-karir" className="app-btn app-btn--sm">Eksplorasi Karir</Link>
                </div>
                {target.karir.length === 0 ? (
                  <p className="app-muted">Belum ada karir impian.</p>
                ) : (
                  <ul className="app-list">
                    {target.karir.map((k) => (
                      <li key={k.id} className="app-card__head">
                        <span>{k.karir?.nama ?? k.teks_bebas}</span>
                        <button
                          type="button"
                          className="app-btn app-btn--sm app-btn--danger"
                          disabled={busy}
                          onClick={() =>
                            jalankan(async () => {
                              await hapusTargetKarir(k.id);
                              setTarget((x) => x && { ...x, karir: x.karir.filter((y) => y.id !== k.id) });
                            })
                          }
                        >
                          Hapus
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
