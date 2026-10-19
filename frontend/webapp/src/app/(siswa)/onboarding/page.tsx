"use client";

import React, { useEffect, useMemo, useState } from "react";
import "../../../styles/onboarding.css";

import {
  IconArrowRight,
  IconBookOpen,
  IconBuilding,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconCompass,
  IconDiploma,
  IconSchool,
  IconShield,
  IconUser,
} from "../../../components/siswa/Icons";
import { daftarProdi } from "../../../lib/api/katalog";
import { cariKarir, daftarBidangKarir, daftarMapel } from "../../../lib/api/master";
import { tambahTargetProdi } from "../../../lib/api/rekomendasi";
import {
  gabungSekolah,
  getMe,
  onboarding,
  type GayaBelajar,
  type JenjangPendidikan,
  type Peminatan,
  type TargetKarirItem,
} from "../../../lib/api/siswa";
import type { BidangKarir, Mapel, ProdiRingkas, SiswaSaya } from "../../../lib/api/types";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { pesanError } from "../../../lib/riasec";

// ─── Data ─────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type MapelMaster = Mapel & { is_pilihan: boolean; kelompok: string | null };
type KarirPilihan = { karir_id: string; nama: string } | { teks_bebas: string };
type ProdiPilihan = Pick<ProdiRingkas, "id" | "nama"> & { bidang?: string };

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Biodata & Sekolah" },
  { n: 2, label: "Target & Minat Rumpun" },
  { n: 3, label: "Preferensi Belajar" },
];

const PEMINATAN: Peminatan[] = ["IPA", "IPS", "Bahasa", "Merdeka", "SMK"];

const JENJANG: { id: JenjangPendidikan; title: string; desc: string; icon: React.ReactNode }[] = [
  { id: "S1", title: "S1 Akademik", desc: "Riset mendalam & landasan teori keilmuan.", icon: <IconSchool size={16} color="currentColor" /> },
  { id: "D4", title: "D4 Vokasi", desc: "Sarjana terapan, praktik siap kerja industri.", icon: <IconBuilding size={16} color="currentColor" /> },
  { id: "D3", title: "D3 Vokasi", desc: "Diploma 3 tahun berbasis keterampilan.", icon: <IconBookOpen size={16} color="currentColor" /> },
  { id: "kedinasan", title: "Kedinasan", desc: "Ikatan dinas kementerian & karier aparatur.", icon: <IconShield size={16} color="currentColor" /> },
  { id: "langsung_kerja", title: "Langsung Kerja", desc: "Masuk dunia kerja setelah lulus SMA.", icon: <IconDiploma size={16} color="currentColor" /> },
];

const GAYA: { id: GayaBelajar; label: string }[] = [
  { id: "praktik", label: "Praktik Langsung" },
  { id: "seimbang", label: "Seimbang" },
  { id: "teori", label: "Riset & Teori" },
];

const RIASEC_INFO = ["R — Realistic", "I — Investigatif", "A — Artistik", "S — Sosial", "E — Enterprising", "C — Konvensional"];

interface FormState {
  nama: string;
  tingkat: number | null;
  rombel: string;
  peminatan: Peminatan | null;
  angkatan: string;
  jenjang: JenjangPendidikan[];
  bidangKarir: number[];
  prodi: (ProdiPilihan | null)[];
  gaya: GayaBelajar | null;
  cepatKerja: boolean;
  biaya: number;
  mapel: number[];
  mapelFavorit: number[];
  karir: KarirPilihan[];
}

const FORM_AWAL: FormState = {
  nama: "",
  tingkat: null,
  rombel: "",
  peminatan: null,
  angkatan: "",
  jenjang: [],
  bidangKarir: [],
  prodi: [null, null],
  gaya: "seimbang",
  cepatKerja: false,
  biaya: 3,
  mapel: [],
  mapelFavorit: [],
  karir: [],
};

const DRAFT_KEY = "onboarding-draft";

function bacaDraft(): Partial<FormState> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<FormState>) : null;
  } catch {
    return null;
  }
}

function simpanDraft(form: FormState) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    /* penyimpanan browser tidak tersedia — abaikan */
  }
}

function hapusDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* abaikan */
  }
}

/** Isi form dari data yang sudah tersimpan di backend (bila pernah onboarding). */
function dariMe(me: SiswaSaya): Partial<FormState> {
  const pref = (me.preferensi ?? {}) as {
    gaya_belajar?: GayaBelajar | null;
    ingin_cepat_kerja?: boolean | null;
    pertimbangan_biaya?: number | null;
    jenjang_diminati?: JenjangPendidikan[];
  };
  return {
    nama: me.profil.nama ?? "",
    tingkat: me.siswa?.tingkat ?? null,
    rombel: me.siswa?.rombel ?? "",
    peminatan: (me.siswa?.peminatan as Peminatan | null) ?? null,
    angkatan: me.siswa?.angkatan ? String(me.siswa.angkatan) : "",
    jenjang: pref.jenjang_diminati ?? [],
    bidangKarir: me.bidang_karir.map((b) => b.bidang_karir.id),
    gaya: pref.gaya_belajar ?? "seimbang",
    cepatKerja: pref.ingin_cepat_kerja ?? false,
    biaya: pref.pertimbangan_biaya ?? 3,
    mapel: me.mapel.map((m) => m.mapel.id),
    mapelFavorit: me.mapel_favorit.map((m) => m.mapel.id),
    karir: me.target_karir.map((t) =>
      t.karir ? { karir_id: t.karir.id, nama: t.karir.nama } : { teks_bebas: t.teks_bebas ?? "" }
    ),
  };
}

const toggle = <T,>(list: T[], v: T, maks?: number) =>
  list.includes(v) ? list.filter((x) => x !== v) : maks && list.length >= maks ? list : [...list, v];

const namaKarir = (k: KarirPilihan) => ("nama" in k ? k.nama : k.teks_bebas);

// ─── Picker (pencarian prodi / karir) ─────────────────────────────────────────

function Picker<T extends { id: string; nama: string }>({
  placeholder,
  cari,
  meta,
  onPilih,
  teksBebas,
}: {
  placeholder: string;
  cari: (q: string) => Promise<T[]>;
  meta?: (item: T) => string;
  onPilih: (item: T) => void;
  teksBebas?: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hasil, setHasil] = useState<T[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      cari(q.trim())
        .then(setHasil)
        .catch(() => setHasil([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, cari]);

  return (
    <div className="ob-picker">
      <input
        className="ob-input"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <ul className="ob-picker__list" role="listbox">
          {hasil.length === 0 && <li className="ob-picker__empty">Tidak ada hasil.</li>}
          {hasil.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="ob-picker__item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPilih(item);
                  setQ("");
                  setOpen(false);
                }}
              >
                <span>{item.nama}</span>
                {meta && <small>{meta(item)}</small>}
              </button>
            </li>
          ))}
          {teksBebas && q.trim() && (
            <li>
              <button
                type="button"
                className="ob-picker__item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  teksBebas(q.trim());
                  setQ("");
                  setOpen(false);
                }}
              >
                <span>Tambahkan &quot;{q.trim()}&quot;</span>
                <small>teks bebas</small>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

const cariProdi = (q: string) =>
  daftarProdi({ q: q || undefined, limit: 8 }).then((h) =>
    h.items.map((p) => ({ id: p.id, nama: p.nama, bidang: p.bidang_studi?.nama ?? "" }))
  );
const cariKarirPicker = (q: string) => cariKarir(q || undefined, 8);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [me, setMe] = useState<SiswaSaya | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [mapelList, setMapelList] = useState<MapelMaster[]>([]);
  const [bidangList, setBidangList] = useState<BidangKarir[]>([]);
  const [form, setForm] = useState<FormState>(FORM_AWAL);
  const [step, setStep] = useState<Step>(1);
  const [kode, setKode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    let batal = false;
    Promise.all([getMe(), daftarMapel(), daftarBidangKarir(), createSupabaseBrowser().auth.getUser()])
      .then(([m, mapel, bidang, user]) => {
        if (batal) return;
        setMe(m);
        setMapelList(mapel);
        setBidangList(bidang);
        setEmail(user.data.user?.email ?? null);
        const wajib = mapel.filter((x) => !x.is_pilihan).map((x) => x.id);
        const awal = { ...FORM_AWAL, mapel: wajib, ...dariMe(m) };
        if (!m.mapel.length) awal.mapel = wajib;
        setForm({ ...awal, ...(bacaDraft() ?? {}) });
        setSiap(true);
      })
      .catch((err) => !batal && setError(pesanError(err)));
    return () => {
      batal = true;
    };
  }, []);

  const ubah = (patch: Partial<FormState>) => {
    setForm((f) => {
      const next = { ...f, ...patch };
      simpanDraft(next);
      return next;
    });
  };

  const sekolah = me?.profil.sekolah ?? null;
  const angkatan = Number(form.angkatan);
  const angkatanValid = !form.angkatan || (Number.isInteger(angkatan) && angkatan >= 2000 && angkatan <= 2100);
  const step1Valid = !!sekolah && !!form.nama.trim() && !!form.tingkat && !!form.peminatan && angkatanValid;
  const step2Valid = form.jenjang.length > 0;

  const progres = useMemo(() => {
    const isian = [
      !!sekolah,
      !!form.nama.trim(),
      !!form.tingkat,
      !!form.peminatan,
      form.jenjang.length > 0,
      form.bidangKarir.length > 0,
      !!form.prodi[0],
      form.mapel.length > 0,
      form.mapelFavorit.length > 0,
      form.karir.length > 0,
    ];
    return Math.round((isian.filter(Boolean).length / isian.length) * 100);
  }, [form, sekolah]);

  const keluar = async () => {
    await createSupabaseBrowser().auth.signOut();
    window.location.replace("/login");
  };

  const verifikasiKode = async () => {
    if (!kode.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await gabungSekolah(kode.trim().toUpperCase());
      const m = await getMe();
      setMe(m);
      setInfo(`Terdaftar di ${m.profil.sekolah?.nama ?? "sekolah"}.`);
      setKode("");
    } catch (err) {
      setError(pesanError(err));
    } finally {
      setBusy(false);
    }
  };

  const lanjut = () => {
    setError(null);
    setInfo(null);
    if (step === 1 && !step1Valid) {
      setError(
        !sekolah
          ? "Masukkan kode sekolah dari Guru BK terlebih dahulu."
          : !angkatanValid
            ? "Tahun lulus harus antara 2000 dan 2100."
            : "Lengkapi nama, tingkat kelas, dan peminatan."
      );
      return;
    }
    if (step === 2 && !step2Valid) {
      setError("Pilih minimal satu target jenjang pendidikan.");
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const simpan = async () => {
    if (busy) return;
    if (!step1Valid || !step2Valid) {
      setStep(!step1Valid ? 1 : 2);
      setError("Masih ada isian wajib yang kosong.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const target_karir: TargetKarirItem[] = form.karir.map((k) =>
        "karir_id" in k ? { karir_id: k.karir_id } : { teks_bebas: k.teks_bebas }
      );
      await onboarding({
        profil: {
          nama: form.nama.trim(),
          tingkat: form.tingkat!,
          peminatan: form.peminatan!,
          rombel: form.rombel.trim() || null,
          angkatan: form.angkatan ? angkatan : null,
        },
        preferensi: {
          gaya_belajar: form.gaya,
          ingin_cepat_kerja: form.cepatKerja,
          pertimbangan_biaya: form.biaya,
          jenjang_diminati: form.jenjang,
        },
        mapel_ids: form.mapel,
        mapel_favorit_ids: form.mapelFavorit.filter((id) => form.mapel.includes(id)),
        bidang_karir_ids: form.bidangKarir,
        target_karir,
      });
      // Target prodi pertama otomatis menjadi target utama di backend.
      for (const p of form.prodi) {
        if (p) await tambahTargetProdi({ prodi_id: p.id, sumber: "katalog" });
      }
      hapusDraft();
      window.location.replace("/beranda");
    } catch (err) {
      setError(pesanError(err));
      setBusy(false);
    }
  };

  const mapelDipilih = mapelList.filter((m) => form.mapel.includes(m.id));
  const namaTampil = form.nama.trim() || me?.profil.nama || "Siswa";
  const kelas = form.tingkat ? `Kelas ${form.tingkat}${form.rombel.trim() ? ` ${form.rombel.trim()}` : ""}` : "-";

  return (
    <div className="page-onboarding">
      {/* ── Top bar ── */}
      <div className="ob-topbar-wrap">
        <header className="ob-topbar">
          <button type="button" className="ob-exit" onClick={keluar}>
            <IconArrowRight size={14} color="currentColor" />
            Keluar Sesi
          </button>
          <span className="ob-session">
            <span className="ob-session__icon" aria-hidden="true">
              <IconCompass size={16} color="#FFFFFF" />
            </span>
            <span>Profil Awal Siswa</span>
          </span>
          <div className="ob-progress" aria-label={`Progres pengisian ${progres}%`}>
            <div className="ob-progress__head">
              <span>Progres Pengisian</span>
              <span>{progres}% Selesai</span>
            </div>
            <div className="ob-progress__track">
              <div className="ob-progress__fill" style={{ width: `${progres}%` }} />
            </div>
          </div>
          <span className="ob-saved">
            <IconClock size={13} color="#7C5400" />
            Draf tersimpan di perangkat ini
          </span>
        </header>
      </div>

      <main className="ob-container">
        {/* ── Stepper ── */}
        <section className="ob-stepper" aria-label="Langkah onboarding">
          <div>
            <span className="ob-badge">Tahap Inisialisasi Profil Siswa</span>
            <h1 className="ob-title">Peta Arah Studi &amp; Potensi Diri</h1>
            <p className="ob-desc">
              Lengkapi profil awalmu agar rekomendasi prodi, karir, dan analisis keselarasan bisa
              disesuaikan untukmu.
            </p>
          </div>

          <ol className="ob-steps">
            {STEPS.map((s, i) => {
              const status = s.n < step ? "done" : s.n === step ? "active" : "pending";
              return (
                <React.Fragment key={s.n}>
                  {i > 0 && <span className={`ob-step-line${s.n <= step ? " ob-step-line--done" : ""}`} aria-hidden="true" />}
                  <li>
                    <button
                      type="button"
                      className={`ob-step ob-step--${status}`}
                      disabled={status === "pending"}
                      onClick={() => setStep(s.n)}
                      aria-current={status === "active" ? "step" : undefined}
                    >
                      <span className="ob-step__num">
                        {status === "done" ? <IconCheck size={14} color="#006190" /> : s.n}
                      </span>
                      <span className="ob-step__label">
                        <small>Langkah {s.n}{status === "active" ? " (Aktif)" : ""}</small>
                        <span>{s.label}</span>
                      </span>
                    </button>
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        </section>

        <div className="ob-grid">
          {/* ════ PANEL KIRI ════ */}
          <aside className="ob-aside" aria-label="Ringkasan profil">
            <section className="ob-welcome">
              <div className="ob-welcome__icon" aria-hidden="true">
                <IconCompass size={24} color="#FFFFFF" />
              </div>
              <h2>Selamat Datang di EduAssess!</h2>
              <p>
                Platform pendamping untuk memandu transisi siswa SMA ke pendidikan tinggi dan dunia
                kerja.
              </p>
              <div className="ob-welcome__stats">
                <div className="ob-welcome__stat">
                  <strong>3</strong>
                  <span>Langkah Singkat</span>
                </div>
                <div className="ob-welcome__stat">
                  <strong>±5 mnt</strong>
                  <span>Waktu Pengisian</span>
                </div>
              </div>
            </section>

            <section className="ob-card ob-student" aria-label="Kartu siswa">
              <div className="ob-student__head">
                <div className="ob-student__who">
                  <span className="ob-avatar" aria-hidden="true">
                    {namaTampil.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div className="ob-student__name">{namaTampil}</div>
                    <div className="ob-student__mono">{email ?? "-"}</div>
                  </div>
                </div>
                <span className={`ob-chip-status${sekolah ? "" : " ob-chip-status--warn"}`}>
                  {sekolah ? <IconCheckCircle size={12} color="#0D1A37" /> : null}
                  {sekolah ? "Terdaftar" : "Belum Terdaftar"}
                </span>
              </div>

              <dl className="ob-meta">
                <div>
                  <dt>Asal Sekolah</dt>
                  <dd>{sekolah?.nama ?? "-"}</dd>
                </div>
                <div>
                  <dt>Tingkat &amp; Kelas</dt>
                  <dd>{kelas}</dd>
                </div>
                <div className="ob-meta__full">
                  <dt>Peminatan</dt>
                  <dd className="ob-dot">{form.peminatan ?? "-"}</dd>
                </div>
              </dl>

              <div className="ob-seal">
                <IconShield size={16} color="#006190" />
                <div>
                  <strong>Data Hanya untuk Pendampingan</strong>
                  <span>Profilmu hanya dapat dilihat olehmu dan Guru BK sekolahmu.</span>
                </div>
              </div>
            </section>

            <section className="ob-card ob-riasec" aria-label="Pengenalan RIASEC">
              <div className="ob-riasec__head">
                <h3>Tes Minat Berikutnya</h3>
                <span className="ob-tag">Holland RIASEC</span>
              </div>
              <p>
                Setelah profil awal, kamu akan mengerjakan tes minat untuk memetakan kecenderunganmu ke
                enam tipe berikut.
              </p>
              <div className="ob-riasec__chips">
                {RIASEC_INFO.map((r) => (
                  <span key={r} className="ob-riasec__chip">{r}</span>
                ))}
              </div>
            </section>
          </aside>

          {/* ════ PANEL KANAN: FORM ════ */}
          <section className="ob-card ob-form" aria-label={`Langkah ${step}`}>
            {!siap && !error && <p className="ob-section__hint">Memuat data...</p>}

            {siap && step === 1 && (
              <>
                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 1.1</span>
                      <h2 className="ob-section__title">Kode Sekolah dari Guru BK</h2>
                    </div>
                    <span className="ob-pill">Wajib</span>
                  </div>
                  {sekolah ? (
                    <div className="ob-alert ob-alert--ok">
                      Kamu sudah terdaftar di <strong>{sekolah.nama}</strong>
                      {sekolah.kota ? ` (${sekolah.kota})` : ""}.
                    </div>
                  ) : (
                    <>
                      <p className="ob-section__hint">
                        Minta kode pendaftaran ke Guru BK sekolahmu agar profilmu terhubung ke sekolah.
                      </p>
                      <div className="ob-input-row">
                        <input
                          className="ob-input"
                          placeholder="Contoh: 7KQP4M"
                          value={kode}
                          maxLength={20}
                          onChange={(e) => setKode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && verifikasiKode()}
                        />
                        <button
                          type="button"
                          className="ob-btn ob-btn--primary ob-btn--sm"
                          disabled={busy || !kode.trim()}
                          onClick={verifikasiKode}
                        >
                          {busy ? "Memeriksa..." : "Verifikasi"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="ob-section">
                  <div>
                    <span className="ob-section__eyebrow">Bagian 1.2</span>
                    <h2 className="ob-section__title">Biodata Siswa</h2>
                  </div>
                  <div className="ob-fields">
                    <label className="ob-field ob-field--full">
                      <span className="ob-label">Nama Lengkap</span>
                      <input
                        className="ob-input"
                        value={form.nama}
                        maxLength={100}
                        onChange={(e) => ubah({ nama: e.target.value })}
                      />
                    </label>
                    <div className="ob-field">
                      <span className="ob-label">Tingkat Kelas</span>
                      <div className="ob-chips">
                        {[10, 11, 12].map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`ob-chip ob-chip--sm${form.tingkat === t ? " ob-chip--on" : ""}`}
                            aria-pressed={form.tingkat === t}
                            onClick={() => ubah({ tingkat: t })}
                          >
                            Kelas {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="ob-field">
                      <span className="ob-label">Rombel (opsional)</span>
                      <input
                        className="ob-input"
                        placeholder="Contoh: IPA 1"
                        value={form.rombel}
                        maxLength={30}
                        onChange={(e) => ubah({ rombel: e.target.value })}
                      />
                    </label>
                    <div className="ob-field ob-field--full">
                      <span className="ob-label">Peminatan</span>
                      <div className="ob-chips">
                        {PEMINATAN.map((p) => (
                          <button
                            key={p}
                            type="button"
                            className={`ob-chip ob-chip--sm${form.peminatan === p ? " ob-chip--on" : ""}`}
                            aria-pressed={form.peminatan === p}
                            onClick={() => ubah({ peminatan: p })}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="ob-field">
                      <span className="ob-label">Tahun Lulus SMA (opsional)</span>
                      <input
                        className="ob-input"
                        inputMode="numeric"
                        placeholder="Contoh: 2027"
                        value={form.angkatan}
                        maxLength={4}
                        onChange={(e) => ubah({ angkatan: e.target.value.replace(/\D/g, "") })}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {siap && step === 2 && (
              <>
                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 2.1</span>
                      <h2 className="ob-section__title">Target Jenjang Pendidikan</h2>
                    </div>
                    <span className="ob-pill">Pilih minimal 1</span>
                  </div>
                  <div className="ob-options">
                    {JENJANG.map((j) => {
                      const on = form.jenjang.includes(j.id);
                      return (
                        <button
                          key={j.id}
                          type="button"
                          className={`ob-option${on ? " ob-option--on" : ""}`}
                          aria-pressed={on}
                          onClick={() => ubah({ jenjang: toggle(form.jenjang, j.id) })}
                        >
                          <span className="ob-option__top">
                            <span className="ob-option__icon" style={{ color: on ? "#FFFFFF" : "#0B1C30" }}>
                              {j.icon}
                            </span>
                            <span className="ob-option__check">
                              {on && <IconCheck size={10} color="#FFFFFF" />}
                            </span>
                          </span>
                          <span>
                            <h4>{j.title}</h4>
                            <p>{j.desc}</p>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 2.2</span>
                      <h2 className="ob-section__title">Rumpun Minat Karir</h2>
                    </div>
                    <span className="ob-count">{form.bidangKarir.length}/3 Dipilih</span>
                  </div>
                  <div className="ob-chips">
                    {bidangList.map((b) => {
                      const on = form.bidangKarir.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          className={`ob-chip${on ? " ob-chip--on" : ""}`}
                          aria-pressed={on}
                          disabled={!on && form.bidangKarir.length >= 3}
                          onClick={() => ubah({ bidangKarir: toggle(form.bidangKarir, b.id, 3) })}
                        >
                          {b.nama}
                          {on && <IconCheck size={12} color="#FFFFFF" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ob-section">
                  <div>
                    <span className="ob-section__eyebrow">Bagian 2.3</span>
                    <h2 className="ob-section__title">Target Program Studi</h2>
                    <p className="ob-section__hint">Opsional — bisa diubah nanti dari Katalog atau Rekomendasi.</p>
                  </div>
                  {form.prodi.map((p, i) => (
                    <div key={i} className={`ob-slot${i === 0 ? " ob-slot--primary" : ""}`}>
                      <div className="ob-slot__head">
                        <span className="ob-slot__title">
                          <span className="ob-slot__num">{i + 1}</span>
                          {i === 0 ? "Pilihan Prioritas Utama" : "Pilihan Alternatif"}
                        </span>
                        <span className={`ob-slot__badge${i === 0 ? "" : " ob-slot__badge--blue"}`}>
                          {i === 0 ? "Target Utama" : "Cadangan"}
                        </span>
                      </div>
                      {p ? (
                        <div className="ob-selected">
                          <span>
                            {p.nama}
                            {p.bidang && <small>{p.bidang}</small>}
                          </span>
                          <button
                            type="button"
                            className="ob-link"
                            onClick={() => ubah({ prodi: form.prodi.map((x, j) => (j === i ? null : x)) })}
                          >
                            Ganti
                          </button>
                        </div>
                      ) : (
                        <Picker
                          placeholder="Cari program studi, mis. Teknik Informatika"
                          cari={cariProdi}
                          meta={(x) => x.bidang}
                          onPilih={(x) => ubah({ prodi: form.prodi.map((y, j) => (j === i ? x : y)) })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="ob-section">
                  <div>
                    <span className="ob-section__eyebrow">Bagian 2.4</span>
                    <h2 className="ob-section__title">Preferensi Arah Studi</h2>
                    <p className="ob-section__hint">Geser indikator sesuai prioritas masa depanmu.</p>
                  </div>

                  <div className="ob-pref">
                    <div className="ob-pref__ends">
                      {GAYA.map((g) => (
                        <span key={g.id} className={form.gaya === g.id ? "on" : ""}>
                          {g.label}
                        </span>
                      ))}
                    </div>
                    <input
                      type="range"
                      className="ob-range"
                      min={0}
                      max={2}
                      step={1}
                      value={Math.max(0, GAYA.findIndex((g) => g.id === form.gaya))}
                      aria-label="Gaya belajar"
                      onChange={(e) => ubah({ gaya: GAYA[Number(e.target.value)].id })}
                    />
                    <div className="ob-pref__foot">
                      <span>Orientasi Praktik</span>
                      <span>Bobot Teori Ilmiah</span>
                    </div>
                  </div>

                  <div className="ob-pref">
                    <div className="ob-pref__ends">
                      <span className={form.biaya <= 2 ? "on" : ""}>Biaya Bukan Kendala</span>
                      <span className={form.biaya >= 4 ? "on" : ""}>Biaya Sangat Dipertimbangkan</span>
                    </div>
                    <input
                      type="range"
                      className="ob-range"
                      min={1}
                      max={5}
                      step={1}
                      value={form.biaya}
                      aria-label="Seberapa besar biaya kuliah dipertimbangkan"
                      onChange={(e) => ubah({ biaya: Number(e.target.value) })}
                    />
                    <div className="ob-pref__foot">
                      <span>Skala 1</span>
                      <span>Skala {form.biaya} dari 5</span>
                    </div>
                  </div>

                  <div className="ob-toggles">
                    <button
                      type="button"
                      className="ob-toggle"
                      role="switch"
                      aria-checked={form.cepatKerja}
                      onClick={() => ubah({ cepatKerja: !form.cepatKerja })}
                    >
                      <span>
                        <strong>Ingin Cepat Bekerja</strong>
                        <span>Prioritaskan jalur siap kerja</span>
                      </span>
                      <span className={`ob-switch${form.cepatKerja ? " ob-switch--on" : ""}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {siap && step === 3 && (
              <>
                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 3.1</span>
                      <h2 className="ob-section__title">Mata Pelajaran yang Diambil</h2>
                    </div>
                    <span className="ob-count">{form.mapel.length} Dipilih</span>
                  </div>
                  <div className="ob-chips">
                    {mapelList.map((m) => {
                      const on = form.mapel.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`ob-chip ob-chip--sm${on ? " ob-chip--on" : ""}`}
                          aria-pressed={on}
                          title={m.kelompok ?? undefined}
                          onClick={() => {
                            const mapel = toggle(form.mapel, m.id);
                            ubah({ mapel, mapelFavorit: form.mapelFavorit.filter((id) => mapel.includes(id)) });
                          }}
                        >
                          {m.nama}
                          {m.is_pilihan && !on && <small>(pilihan)</small>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 3.2</span>
                      <h2 className="ob-section__title">Mapel Favorit</h2>
                    </div>
                    <span className="ob-count">{form.mapelFavorit.length}/3 Dipilih</span>
                  </div>
                  {mapelDipilih.length === 0 ? (
                    <p className="ob-section__hint">Pilih mapel yang diambil terlebih dahulu.</p>
                  ) : (
                    <div className="ob-chips">
                      {mapelDipilih.map((m) => {
                        const on = form.mapelFavorit.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`ob-chip ob-chip--sm${on ? " ob-chip--on" : ""}`}
                            aria-pressed={on}
                            disabled={!on && form.mapelFavorit.length >= 3}
                            onClick={() => ubah({ mapelFavorit: toggle(form.mapelFavorit, m.id, 3) })}
                          >
                            {m.nama}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="ob-section">
                  <div className="ob-section__head">
                    <div>
                      <span className="ob-section__eyebrow">Bagian 3.3</span>
                      <h2 className="ob-section__title">Karir Impian</h2>
                      <p className="ob-section__hint">Opsional — dipakai sebagai masukan rekomendasi.</p>
                    </div>
                    <span className="ob-count">{form.karir.length}/5</span>
                  </div>
                  {form.karir.length > 0 && (
                    <div className="ob-chips">
                      {form.karir.map((k, i) => (
                        <button
                          key={`${namaKarir(k)}-${i}`}
                          type="button"
                          className="ob-chip ob-chip--sm ob-chip--on"
                          title="Hapus"
                          onClick={() => ubah({ karir: form.karir.filter((_, j) => j !== i) })}
                        >
                          {namaKarir(k)} ✕
                        </button>
                      ))}
                    </div>
                  )}
                  {form.karir.length < 5 && (
                    <Picker
                      placeholder="Cari karir, mis. Data Scientist"
                      cari={cariKarirPicker}
                      onPilih={(x) =>
                        !form.karir.some((k) => "karir_id" in k && k.karir_id === x.id) &&
                        ubah({ karir: [...form.karir, { karir_id: x.id, nama: x.nama }] })
                      }
                      teksBebas={(q) => ubah({ karir: [...form.karir, { teks_bebas: q.slice(0, 100) }] })}
                    />
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="ob-alert" role="alert">
                {error}
              </div>
            )}
            {info && !error && (
              <div className="ob-alert ob-alert--ok" role="status">
                {info}
              </div>
            )}

            {siap && (
              <div className="ob-actions">
                <div className="ob-actions__left">
                  {step > 1 && (
                    <button type="button" className="ob-btn ob-btn--soft" onClick={() => setStep((s) => (s - 1) as Step)}>
                      Kembali
                    </button>
                  )}
                </div>
                {step < 3 ? (
                  <button type="button" className="ob-btn ob-btn--primary" onClick={lanjut}>
                    Lanjut ke Langkah {step + 1}
                    <IconArrowRight size={14} color="#FFFFFF" />
                  </button>
                ) : (
                  <button type="button" className="ob-btn ob-btn--primary" disabled={busy} onClick={simpan}>
                    {busy ? "Menyimpan..." : "Simpan & Masuk ke Beranda"}
                    <IconArrowRight size={14} color="#FFFFFF" />
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <p className="ob-note">
          <IconUser size={16} color="#7C5400" />
          Data ini dapat kamu ubah kembali kapan saja melalui halaman profil.
        </p>
      </main>
    </div>
  );
}
