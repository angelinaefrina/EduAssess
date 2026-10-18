"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import "../../../styles/auth.css";
import {
  IconAlertCircle,
  IconArahInLogo,
  IconArrowRight,
  IconBadgeCheck,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconGraduationCap,
  IconHelpCircle,
  IconHome,
  IconIdCard,
  IconLock,
  IconLockShield,
  IconLoginTab,
  IconShieldCheck,
  IconSparkle,
  IconTeacher,
  IconUserPlusTab,
} from "../../../components/auth/AuthIcons";

type AuthMode = "login" | "register";
type UserRole = "siswa" | "bk";

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/beranda";

  // Tab & Role State
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<UserRole>("siswa");

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Dialogs State
  const [activeModal, setActiveModal] = useState<"help" | "forgot" | "status" | "privacy" | null>(null);
  const [statusServer, setStatusServer] = useState<{ api: boolean; db: boolean; ms: number } | "memuat" | null>(null);

  async function cekStatusServer() {
    setActiveModal("status");
    setStatusServer("memuat");
    const mulai = performance.now();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"}/health`, { cache: "no-store" });
      const json = await res.json();
      setStatusServer({ api: res.ok, db: json?.data?.db === "ok", ms: Math.round(performance.now() - mulai) });
    } catch {
      setStatusServer({ api: false, db: false, ms: 0 });
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const supabase = createSupabaseBrowser();
      let emailToSubmit = identifier.trim();
      if (!emailToSubmit.includes("@")) {
        emailToSubmit = `${emailToSubmit}@sekolah.id`;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToSubmit,
        password,
      });

      if (authError) {
        setError(authError.message || "Email / NISN atau kata sandi tidak valid.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Berhasil masuk! Mengarahkan ke dashboard portal...");
      const destination = role === "bk" ? "/bk/dashboard" : nextPath;
      setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.";
      setError(msg);
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowser();
      let emailToSubmit = identifier.trim();
      if (!emailToSubmit.includes("@")) {
        emailToSubmit = `${emailToSubmit}@sekolah.id`;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: emailToSubmit,
        password,
        options: {
          data: {
            nama: fullName.trim() || undefined,
            peran: role,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Pendaftaran akun gagal. Silakan coba kembali.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Akun berhasil didaftarkan! Silakan masuk dengan kredensial Anda.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* ================= HEADER ================= */}
      <header className="auth-header">
        <div className="auth-header-container">
          <Link href="/" className="auth-brand" aria-label="ArahIn Beranda">
            <div className="auth-brand-top">
              <Image
                src="/images/logo-tight.png"
                alt="ArahIn Logo"
                width={32}
                height={32}
                style={{ objectFit: "contain" }}
              />
              <span className="auth-brand-name">
                Arah<span className="auth-brand-name-in">In</span>
              </span>
            </div>
            <span className="auth-brand-slogan">
              Discover Your Potential. Define Your Future.
            </span>
          </Link>

          <nav className="auth-header-nav">
            <button
              type="button"
              className="auth-nav-link"
              onClick={() => setActiveModal("help")}
            >
              <IconHelpCircle size={16} color="#334155" />
              <span>Bantuan & Panduan</span>
            </button>
            <Link href="/beranda" className="auth-nav-link">
              <IconHome size={16} color="#334155" />
              <span>Kembali ke Beranda</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="auth-main">
        <div className="auth-content-container">
          {/* Breadcrumb & Status Bar */}
          <div className="auth-topbar">
            <div className="auth-breadcrumb">
              <span className="auth-breadcrumb-primary">Portal Masuk Terpadu</span>
              <span className="auth-breadcrumb-separator">
                <IconChevronRight size={11} color="#64748B" />
              </span>
              <span className="auth-breadcrumb-secondary">
                {mode === "login"
                  ? "Autentikasi Kredensial Sekolah (NISN / NIP)"
                  : "Registrasi Kredensial Baru Sekolah"}
              </span>
            </div>

            <div className="auth-status-pill">
              <span className="auth-status-dot" />
              <span className="auth-status-text">
                Gateway SSO Dapodik Aktif • Sesi Aman 256-bit
              </span>
            </div>
          </div>

          {/* Dual Column Layout Grid */}
          <div className="auth-grid">
            {/* ============= SISI KIRI: HERO SHOWCASE ============= */}
            <div className="auth-hero-column">
              <div className="auth-hero-card">
                <Image
                  src="/images/hero-character.png"
                  alt="Ilustrasi Siswa ArahMasaDepan Belajar dengan Laptop"
                  width={460}
                  height={345}
                  priority
                  className="auth-hero-image"
                />
              </div>

              {/* Badge */}
              <div className="auth-hero-badge">
                <IconSparkle size={13} color="#0284C7" />
                <span>Eksplorasi Minat & Bakat Terpadu</span>
              </div>

              {/* Title */}
              <h1 className="auth-hero-title">
                Selamat Datang di
                <br />
                Arah<span className="auth-hero-title-in">In</span>
              </h1>

              {/* Subtitle */}
              <p className="auth-hero-subtitle">
                Mulai petualangan menuju jurusan dan kampus impianmu dengan
                panduan data rapor serta rekomendasi diagnostik ilmiah yang
                akurat.
              </p>
            </div>

            {/* ============= SISI KANAN: INTERACTIVE AUTH CARD ============= */}
            <div className="auth-card-wrapper">
              <div className="auth-card">
                {/* 1. Mode Tabs (Masuk vs Daftar) */}
                <div className="auth-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "login"}
                    className={`auth-tab-btn ${mode === "login" ? "active" : "inactive"}`}
                    onClick={() => {
                      setMode("login");
                      setError(null);
                      setSuccessMessage(null);
                    }}
                  >
                    <IconLoginTab
                      size={16}
                      color={mode === "login" ? "#006190" : "#475569"}
                    />
                    <span>Masuk (Login)</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "register"}
                    className={`auth-tab-btn ${mode === "register" ? "active" : "inactive"}`}
                    onClick={() => {
                      setMode("register");
                      setError(null);
                      setSuccessMessage(null);
                    }}
                  >
                    <IconUserPlusTab
                      size={16}
                      color={mode === "register" ? "#006190" : "#475569"}
                    />
                    <span>Daftar Akun Baru</span>
                  </button>
                </div>

                {/* 2. Role Switcher ("Pilih Peran Akun:") */}
                <div className="auth-role-section">
                  <span className="auth-role-title">Pilih Peran Akun:</span>
                  <div className="auth-role-control">
                    <button
                      type="button"
                      className={`auth-role-btn ${role === "siswa" ? "active" : "inactive"}`}
                      onClick={() => setRole("siswa")}
                    >
                      <IconGraduationCap
                        size={16}
                        color={role === "siswa" ? "#FFFFFF" : "#475569"}
                      />
                      <span>Siswa SMA</span>
                    </button>
                    <button
                      type="button"
                      className={`auth-role-btn ${role === "bk" ? "active" : "inactive"}`}
                      onClick={() => setRole("bk")}
                    >
                      <IconTeacher
                        size={16}
                        color={role === "bk" ? "#FFFFFF" : "#475569"}
                      />
                      <span>Guru BK / Konselor</span>
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="auth-alert-error" role="alert">
                    <IconAlertCircle size={16} color="#B91C1C" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="auth-alert-success" role="status">
                    <IconBadgeCheck size={16} color="#15803D" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* 3. Form Section */}
                {mode === "login" ? (
                  /* ============= FORM LOGIN ============= */
                  <form onSubmit={handleLogin} className="auth-form">
                    {/* Identifier Field */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="login-identifier" className="auth-field-label">
                          {role === "siswa"
                            ? "NISN atau Email Terdaftar"
                            : "NIP atau Email Resmi"}
                        </label>
                        <span className="auth-field-hint">
                          {role === "siswa" ? "10 digit NISN" : "18 digit NIP"}
                        </span>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconIdCard size={17} color="#64748B" />
                        </span>
                        <input
                          id="login-identifier"
                          type="text"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder={
                            role === "siswa"
                              ? "Contoh: 0064921820 atau siswa@sman1.sch.id"
                              : "Contoh: 19850315... atau bk@sman1.sch.id"
                          }
                          className="auth-input"
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="login-password" className="auth-field-label">
                          Kata Sandi
                        </label>
                        <button
                          type="button"
                          className="auth-field-link"
                          onClick={() => setActiveModal("forgot")}
                        >
                          Lupa kata sandi?
                        </button>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconLock size={17} color="#64748B" />
                        </span>
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan kata sandi akun Anda"
                          className="auth-input"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="auth-input-toggle"
                          aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <IconEyeOff size={16} color="#64748B" />
                          ) : (
                            <IconEye size={16} color="#64748B" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Kredensial Aman */}
                    <div className="auth-remember-row">
                      <label className="auth-checkbox-label">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="auth-checkbox"
                        />
                        <span>Ingat akun di perangkat ini</span>
                      </label>
                      <div className="auth-security-indicator">
                        <IconLockShield size={13} color="#475569" />
                        <span>Kredensial Aman</span>
                      </div>
                    </div>

                    {/* CTA Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="auth-submit-btn"
                    >
                      {loading ? (
                        <span>Memproses Autentikasi...</span>
                      ) : (
                        <>
                          <span>
                            {role === "siswa"
                              ? "Masuk ke Portal Siswa"
                              : "Masuk ke Portal Guru BK"}
                          </span>
                          <IconArrowRight size={16} color="#FFFFFF" />
                        </>
                      )}
                    </button>

                    {/* Dapodik Sync Notice Box */}
                    <div className="auth-notice-box">
                      <span className="auth-notice-icon">
                        <IconBadgeCheck size={18} color="#006190" />
                      </span>
                      <span className="auth-notice-text">
                        <span className="auth-notice-bold">Sinkronisasi Dapodik: </span>
                        Akun siswa otomatis tersinkronisasi jika sekolah Anda telah
                        mengaktifkan integrasi Dapodik SMAN 1 Jakarta.
                      </span>
                    </div>

                    {/* Alternative Switch Helper */}
                    <div className="auth-switch-helper">
                      <span className="auth-switch-label">Belum punya akun?</span>
                      <button
                        type="button"
                        className="auth-switch-btn"
                        onClick={() => {
                          setMode("register");
                          setError(null);
                        }}
                      >
                        Aktivasi Akun dengan NISN
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ============= FORM REGISTRASI ============= */
                  <form onSubmit={handleRegister} className="auth-form">
                    {/* Full Name */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="reg-name" className="auth-field-label">
                          Nama Lengkap
                        </label>
                        <span className="auth-field-hint">Sesuai Rapor / Dokumen</span>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconIdCard size={17} color="#64748B" />
                        </span>
                        <input
                          id="reg-name"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Nama lengkap sesuai data resmi"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    {/* Identifier (Email / NISN) */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="reg-identifier" className="auth-field-label">
                          {role === "siswa"
                            ? "Email Siswa / Akun Belajar.id"
                            : "Email Resmi Guru / Sekolah"}
                        </label>
                        <span className="auth-field-hint">Wajib Diisi</span>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconIdCard size={17} color="#64748B" />
                        </span>
                        <input
                          id="reg-identifier"
                          type="email"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="contoh: nama@sekolah.sch.id"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="reg-password" className="auth-field-label">
                          Kata Sandi
                        </label>
                        <span className="auth-field-hint">Min. 6 Karakter</span>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconLock size={17} color="#64748B" />
                        </span>
                        <input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Buat kata sandi akun"
                          className="auth-input"
                        />
                        <button
                          type="button"
                          className="auth-input-toggle"
                          aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <IconEyeOff size={16} color="#64748B" />
                          ) : (
                            <IconEye size={16} color="#64748B" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="reg-confirm-password" className="auth-field-label">
                          Ulangi Kata Sandi
                        </label>
                      </div>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">
                          <IconLock size={17} color="#64748B" />
                        </span>
                        <input
                          id="reg-confirm-password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Konfirmasi kata sandi"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    {/* Submit CTA */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="auth-submit-btn"
                    >
                      {loading ? (
                        <span>Mendaftarkan Akun...</span>
                      ) : (
                        <>
                          <span>
                            {role === "siswa"
                              ? "Daftar & Aktivasi Akun Siswa"
                              : "Daftar Akun Guru BK"}
                          </span>
                          <IconArrowRight size={16} color="#FFFFFF" />
                        </>
                      )}
                    </button>

                    {/* Alternative Switch Helper */}
                    <div className="auth-switch-helper">
                      <span className="auth-switch-label">Sudah punya akun?</span>
                      <button
                        type="button"
                        className="auth-switch-btn"
                        onClick={() => {
                          setMode("login");
                          setError(null);
                        }}
                      >
                        Masuk ke Portal Siswa
                      </button>
                    </div>
                  </form>
                )}

                {/* 4. Strict Security Assurance Footer Badge */}
                <div className="auth-card-footer-badge">
                  <span className="auth-card-footer-icon">
                    <IconShieldCheck size={14} color="#006190" />
                  </span>
                  <span className="auth-card-footer-text">
                    Autentikasi Internal Sekolah • Tanpa Integrasi Akun Pihak Ketiga
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="auth-footer">
        <div className="auth-footer-container">
          <div className="auth-footer-copy">
            © 2025 ArahMasaDepan • Terintegrasi Data Pokok Pendidikan (Dapodik)
          </div>
          <div className="auth-footer-links">
            <button
              type="button"
              className="auth-footer-link"
              onClick={() => setActiveModal("help")}
            >
              Pusat Bantuan
            </button>
            <button
              type="button"
              className="auth-footer-link"
              onClick={() => setActiveModal("privacy")}
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              className="auth-footer-link"
              onClick={cekStatusServer}
            >
              Status Server
            </button>
          </div>
        </div>
      </footer>

      {/* ================= MODAL DIALOGS ================= */}
      {activeModal && (
        <div className="auth-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {activeModal === "help" && (
              <>
                <h3 style={{ margin: 0, color: "#0F172A", fontSize: "18px", fontWeight: 700 }}>
                  Pusat Bantuan & Panduan
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "20px" }}>
                  ArahIn membantu siswa SMA mengeksplorasi minat, bakat (RIASEC), dan pilihan jurusan kuliah secara akurat menggunakan data nilai rapor terverifikasi dan rekomendasi kecerdasan buatan.
                </p>
                <div style={{ background: "#F1F5F9", padding: "12px", borderRadius: "8px", fontSize: "12.5px", color: "#334155" }}>
                  <strong>Panduan Akses:</strong>
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    <li>Masukkan 10 digit NISN atau email resmi sekolah.</li>
                    <li>Jika belum pernah aktivasi, klik tombol Aktivasi Akun dengan NISN.</li>
                    <li>Untuk Guru BK/Konselor, pilih peran Guru BK sebelum masuk.</li>
                  </ul>
                </div>
              </>
            )}

            {activeModal === "forgot" && (
              <>
                <h3 style={{ margin: 0, color: "#0F172A", fontSize: "18px", fontWeight: 700 }}>
                  Pemulihan Kata Sandi
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "20px" }}>
                  Silakan masukkan NISN atau Email terdaftar Anda. Tautan pengaturan ulang kata sandi akan dikirimkan atau hubungi Guru BK di sekolah Anda.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#1E293B" }}>
                    NISN / Email Terdaftar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0064921820 atau siswa@sekolah.sch.id"
                    defaultValue={identifier}
                    style={{
                      height: "42px",
                      padding: "0 12px",
                      borderRadius: "6px",
                      border: "1px solid #CBD5E1",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                </div>
              </>
            )}

            {activeModal === "privacy" && (
              <>
                <h3 style={{ margin: 0, color: "#0F172A", fontSize: "18px", fontWeight: 700 }}>
                  Kebijakan Privasi Data Siswa
                </h3>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "20px" }}>
                  Seluruh data akademik, nilai rapor, dan hasil asesmen minat bakat RIASEC dilindungi dengan enkripsi AES-256 bit dan hanya dapat diakses oleh siswa bersangkutan serta Guru BK yang berwenang.
                </p>
              </>
            )}

            {activeModal === "status" && (
              <>
                <h3 style={{ margin: 0, color: "#0F172A", fontSize: "18px", fontWeight: 700 }}>
                  Status Layanan Server
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                  {statusServer === "memuat" || statusServer === null ? (
                    <span style={{ color: "#475569" }}>Memeriksa server...</span>
                  ) : (
                    [
                      ["Backend API", statusServer.api, statusServer.api ? `Online (${statusServer.ms}ms)` : "Tidak terjangkau"],
                      ["Database", statusServer.db, statusServer.db ? "Terhubung" : "Tidak terhubung"],
                    ].map(([label, ok, teks]) => (
                      <div
                        key={String(label)}
                        style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: ok ? "#F0FDF4" : "#FEF2F2", color: ok ? "#15803D" : "#B91C1C" }}
                      >
                        <span>{label}</span>
                        <strong>{teks}</strong>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              className="auth-submit-btn"
              style={{ marginTop: "6px", height: "40px", fontSize: "13px" }}
              onClick={() => setActiveModal(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Memuat antarmuka...</div>}>
      <AuthComponent />
    </Suspense>
  );
}
