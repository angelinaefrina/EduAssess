"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../components/shared/AppShell";
import { getInstrumen, kirimAsesmen, terakhirAsesmen } from "../../../lib/api/rekomendasi";
import type { HasilAsesmen, Instrumen, TipeRiasec } from "../../../lib/api/types";
import { NAMA_RIASEC, pesanError, tanggal } from "../../../lib/riasec";

const SKALA = [
  { v: 1, label: "Sangat tidak sesuai" },
  { v: 2, label: "Tidak sesuai" },
  { v: 3, label: "Netral" },
  { v: 4, label: "Sesuai" },
  { v: 5, label: "Sangat sesuai" },
];
const TIPE: TipeRiasec[] = ["R", "I", "A", "S", "E", "C"];

function Hasil({ h }: { h: HasilAsesmen }) {
  return (
    <section className="app-card">
      <div className="app-card__head">
        <h2 className="app-card__title">
          Hasil Tes Minat: <span className="app-mono">{h.kode_holland ?? "-"}</span>
        </h2>
        <span className="app-muted">{tanggal(h.selesai_at)}</span>
      </div>
      <ul className="app-bars">
        {TIPE.map((t) => {
          const skor = Number(h.riasec?.[t] ?? 0);
          return (
            <li key={t}>
              <div className="app-bar__head">
                <span>{NAMA_RIASEC[t]} ({t})</span>
                <strong>{skor.toFixed(2)} / 5</strong>
              </div>
              <div className="app-bar__track">
                <div className="app-bar__fill" style={{ width: `${(skor / 5) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="app-actions">
        <Link href="/rekomendasi" className="app-btn app-btn--primary">Lihat Rekomendasi Prodi</Link>
      </div>
    </section>
  );
}

function Butir({
  no,
  teks,
  nilai,
  onPilih,
}: {
  no: number;
  teks: string;
  nilai: number | undefined;
  onPilih: (v: number) => void;
}) {
  return (
    <li className="app-note" style={{ background: nilai ? "var(--color-brand-50)" : "#fff", border: "1px solid var(--color-ink-100)" }}>
      <p>
        <strong>{no}.</strong> {teks}
      </p>
      <div className="app-chips" role="radiogroup" aria-label={`Jawaban pernyataan ${no}`}>
        {SKALA.map((s) => (
          <button
            key={s.v}
            type="button"
            role="radio"
            aria-checked={nilai === s.v}
            className={`app-chip${nilai === s.v ? " app-chip--on" : ""}`}
            onClick={() => onPilih(s.v)}
          >
            {s.v} • {s.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export default function TesMinatPage() {
  const [instrumen, setInstrumen] = useState<Instrumen | null>(null);
  const [terakhir, setTerakhir] = useState<HasilAsesmen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mulai, setMulai] = useState(false);
  const [riasec, setRiasec] = useState<Record<number, number>>({});
  const [kemampuan, setKemampuan] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([getInstrumen(), terakhirAsesmen()])
      .then(([i, t]) => {
        setInstrumen(i);
        setTerakhir(t);
        setMulai(!t);
      })
      .catch((err) => setError(pesanError(err)));
  }, []);

  const total = (instrumen?.riasec.length ?? 0) + (instrumen?.kemampuan.length ?? 0);
  const terjawab = Object.keys(riasec).length + Object.keys(kemampuan).length;
  const lengkap = total > 0 && terjawab === total;

  const kirim = async () => {
    if (!instrumen || !lengkap) return;
    setBusy(true);
    setError(null);
    try {
      const hasil = await kirimAsesmen({
        riasec: Object.entries(riasec).map(([id, skor]) => ({ butir_id: Number(id), skor })),
        kemampuan: Object.entries(kemampuan).map(([id, skor]) => ({ dimensi_id: Number(id), skor })),
      });
      setTerakhir(hasil);
      setMulai(false);
      setRiasec({});
      setKemampuan({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const urut = <T extends { urutan: number }>(xs: T[]) => [...xs].sort((a, b) => a.urutan - b.urutan);

  return (
    <AppShell peran="siswa">
      <div className="app-head">
        <div>
          <h1 className="app-title">Tes Minat & Kemampuan Diri</h1>
          <p className="app-sub">
            Jawab sesuai dirimu, bukan jawaban yang menurutmu &quot;benar&quot;. Tidak ada jawaban salah.
          </p>
        </div>
        {terakhir && !mulai && (
          <button type="button" className="app-btn app-btn--primary" onClick={() => setMulai(true)}>
            Kerjakan Ulang Tes
          </button>
        )}
      </div>

      {!instrumen ? (
        <StatusMuat error={error} />
      ) : (
        <>
          {terakhir && !mulai && <Hasil h={terakhir} />}

          {mulai && (
            <>
              <div className="app-card" style={{ position: "sticky", top: 84, zIndex: 10 }}>
                <div className="app-bar__head">
                  <span>Progres menjawab</span>
                  <strong>
                    {terjawab} / {total}
                  </strong>
                </div>
                <div className="app-bar__track">
                  <div className="app-bar__fill" style={{ width: `${total ? (terjawab / total) * 100 : 0}%` }} />
                </div>
              </div>

              <section className="app-card">
                <h2 className="app-card__title">Bagian 1 — Minat ({instrumen.riasec.length} pernyataan)</h2>
                <ol className="app-list">
                  {urut(instrumen.riasec).map((b, i) => (
                    <Butir
                      key={b.id}
                      no={i + 1}
                      teks={b.pernyataan}
                      nilai={riasec[b.id]}
                      onPilih={(v) => setRiasec((r) => ({ ...r, [b.id]: v }))}
                    />
                  ))}
                </ol>
              </section>

              <section className="app-card">
                <h2 className="app-card__title">Bagian 2 — Kemampuan Diri ({instrumen.kemampuan.length} pernyataan)</h2>
                <ol className="app-list">
                  {urut(instrumen.kemampuan).map((b, i) => (
                    <Butir
                      key={b.id}
                      no={i + 1}
                      teks={b.pernyataan}
                      nilai={kemampuan[b.id]}
                      onPilih={(v) => setKemampuan((r) => ({ ...r, [b.id]: v }))}
                    />
                  ))}
                </ol>
              </section>

              {error && <div className="app-alert">{error}</div>}
              <div className="app-actions">
                {terakhir && (
                  <button type="button" className="app-btn" onClick={() => setMulai(false)}>
                    Batal
                  </button>
                )}
                <button type="button" className="app-btn app-btn--primary" disabled={!lengkap || busy} onClick={kirim}>
                  {busy ? "Mengirim..." : lengkap ? "Kirim Jawaban" : `Jawab semua pernyataan (${total - terjawab} lagi)`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
