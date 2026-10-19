"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import "../../styles/navbar.css";

import { IconCompass, IconUser } from "../siswa/Icons";
import { getProfilSaya } from "../../lib/api/master";
import type { ProfilSaya } from "../../lib/api/types";
import { createSupabaseBrowser } from "../../lib/supabase/client";

export const GLOBAL_NAV_ITEMS = {
  siswa: [
    { href: "/beranda", label: "Beranda" },
    { href: "/rekomendasi", label: "Rekomendasi" },
    { href: "/eksplorasi-karir", label: "Eksplorasi Karir" },
    { href: "/analitik", label: "Analisis Keselarasan" },
    { href: "/katalog-prodi", label: "Katalog Kampus" },
    { href: "/nilai-rapor", label: "Nilai Rapor" },
    { href: "/tes-minat", label: "Tes Minat" },
  ],
  bk: [
    { href: "/bk/dashboard", label: "Dashboard Siswa" },
    { href: "/bk/nilai-rapor", label: "Verifikasi Nilai" },
    { href: "/bk/ringkasan", label: "Ringkasan Angkatan" },
  ],
};

export interface UnifiedNavbarProps {
  peran?: "siswa" | "bk";
  customUser?: {
    nama?: string | null;
    kelas?: string | null;
  };
}

export function UnifiedNavbar({ peran = "siswa", customUser }: UnifiedNavbarProps) {
  const pathname = usePathname();
  const [profil, setProfil] = useState<ProfilSaya | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getProfilSaya()
      .then(setProfil)
      .catch(() => setProfil(null));
  }, []);

  const keluar = async () => {
    try {
      await createSupabaseBrowser().auth.signOut();
    } catch {
      // ignore
    }
    window.location.replace("/login");
  };

  const navLinks = GLOBAL_NAV_ITEMS[peran] || GLOBAL_NAV_ITEMS.siswa;
  const brandHref = peran === "bk" ? "/bk/dashboard" : "/beranda";
  const namaTampil = customUser?.nama ?? profil?.nama ?? "Siswa";
  const subTampil = customUser?.kelas ?? profil?.sekolah?.nama ?? (peran === "bk" ? "Guru BK" : "Siswa SMA");
  const inisial = (namaTampil || "S")[0].toUpperCase();

  return (
    <header className="unified-navbar-wrapper">
      <nav className="unified-navbar-container" aria-label="Navigasi Utama EduAssess">
        {/* ── Brand Logo & Text ── */}
        <Link href={brandHref} className="unified-brand">
          <div className="unified-brand-icon" aria-hidden="true">
            <IconCompass size={20} color="#FFFFFF" />
          </div>
          <div className="unified-brand-text">
            <span className="unified-brand-title">
              Edu<span className="unified-brand-title-accent">Assess</span>
            </span>
            <span className="unified-brand-badge">
              {peran === "bk" ? "Panel Guru BK" : "Siswa SMA"}
            </span>
          </div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <ul className="unified-links">
          {navLinks.map((item) => {
            const aktif =
              pathname === item.href ||
              (item.href !== "/beranda" && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`unified-link ${aktif ? "active" : ""}`}
                  aria-current={aktif ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Right Actions: User Profile & Logout ── */}
        <div className="unified-actions">
          <Link href="/profil" className="unified-user-pill" title="Profil Siswa">
            <div className="unified-user-avatar" aria-hidden="true">
              {inisial}
            </div>
            <div className="unified-user-meta">
              <span className="unified-user-name">{namaTampil}</span>
              <span className="unified-user-sub">{subTampil}</span>
            </div>
          </Link>

          <button
            type="button"
            className="unified-logout-btn"
            onClick={keluar}
            title="Keluar dari akun"
          >
            Keluar
          </button>

          {/* Hamburger Button for Mobile */}
          <button
            type="button"
            className="unified-mobile-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile Navigation Drawer ── */}
      <div
        className={`unified-drawer-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className="unified-drawer"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="unified-drawer-head">
            <div className="unified-brand">
              <div className="unified-brand-icon" style={{ width: 30, height: 30 }}>
                <IconCompass size={16} color="#FFFFFF" />
              </div>
              <span className="unified-brand-title" style={{ fontSize: 17 }}>
                Edu<span className="unified-brand-title-accent">Assess</span>
              </span>
            </div>
            <button
              type="button"
              className="unified-mobile-btn"
              style={{ display: "flex", border: "none", background: "transparent" }}
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="unified-drawer-links">
            {navLinks.map((item) => {
              const aktif =
                pathname === item.href ||
                (item.href !== "/beranda" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`unified-drawer-link ${aktif ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="unified-drawer-footer">
            <Link
              href="/profil"
              className="unified-drawer-link"
              onClick={() => setMobileOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div className="unified-user-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                {inisial}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{namaTampil}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{subTampil}</div>
              </div>
            </Link>
            <button
              type="button"
              className="unified-logout-btn"
              onClick={keluar}
              style={{ width: "100%", textAlign: "center" }}
            >
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default UnifiedNavbar;
