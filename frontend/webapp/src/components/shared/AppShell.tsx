"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import "../../styles/app.css";

import { IconCompass, IconUser } from "../siswa/Icons";
import { getProfilSaya } from "../../lib/api/master";
import type { ProfilSaya } from "../../lib/api/types";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const NAV = {
  bk: [
    { href: "/bk/dashboard", label: "Dashboard Siswa" },
    { href: "/bk/nilai-rapor", label: "Verifikasi Nilai" },
    { href: "/bk/ringkasan", label: "Ringkasan Angkatan" },
  ],
  siswa: [
    { href: "/beranda", label: "Beranda" },
    { href: "/rekomendasi", label: "Rekomendasi" },
    { href: "/nilai-rapor", label: "Nilai Rapor" },
    { href: "/tes-minat", label: "Tes Minat" },
    { href: "/perkembangan", label: "Perkembangan" },
    { href: "/profil", label: "Profil" },
  ],
};

/** Kerangka halaman fungsional (header + navigasi sesuai peran). */
export function AppShell({ peran, children }: { peran: "bk" | "siswa"; children: React.ReactNode }) {
  const pathname = usePathname();
  const [profil, setProfil] = useState<ProfilSaya | null>(null);

  useEffect(() => {
    getProfilSaya().then(setProfil).catch(() => setProfil(null));
  }, []);

  const keluar = async () => {
    await createSupabaseBrowser().auth.signOut();
    window.location.replace("/login");
  };

  return (
    <div className="app-page">
      <header className="app-header">
        <nav className="app-nav" aria-label="Navigasi utama">
          <Link href={peran === "bk" ? "/bk/dashboard" : "/beranda"} className="app-brand">
            <span className="app-brand__icon" aria-hidden="true">
              <IconCompass size={18} color="#FFFFFF" />
            </span>
            <span>
              <span className="app-brand__name">ArahMasaDepan</span>
              <span className="app-brand__badge">{peran === "bk" ? "Panel Guru BK" : "Siswa SMA"}</span>
            </span>
          </Link>

          <ul className="app-links">
            {NAV[peran].map((l) => {
              const aktif = pathname === l.href || pathname.startsWith(`${l.href}/`);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`app-link${aktif ? " app-link--active" : ""}`}
                    aria-current={aktif ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="app-user">
            <span className="app-user__name">
              {profil?.nama ?? "…"}
              <span className="app-user__role">
                {profil?.sekolah?.nama ?? (peran === "bk" ? "Guru BK" : "Siswa")}
              </span>
            </span>
            <IconUser size={18} color="#3F4850" />
            <button type="button" className="app-btn app-btn--sm" onClick={keluar}>
              Keluar
            </button>
          </div>
        </nav>
      </header>
      <main className="app-main" id="main-content">
        {children}
      </main>
    </div>
  );
}

/** Pesan status (memuat / error) yang seragam. */
export function StatusMuat({ error, teks = "Memuat data..." }: { error: string | null; teks?: string }) {
  return error ? (
    <div className="app-alert" role="alert">
      {error}
    </div>
  ) : (
    <p className="app-empty" role="status">
      {teks}
    </p>
  );
}
