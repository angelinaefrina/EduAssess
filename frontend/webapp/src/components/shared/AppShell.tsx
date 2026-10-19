"use client";

import React from "react";
import "../../styles/app.css";
import { UnifiedNavbar } from "./UnifiedNavbar";

/** Kerangka halaman fungsional (header + navigasi seragam sesuai peran). */
export function AppShell({ peran, children }: { peran: "bk" | "siswa"; children: React.ReactNode }) {
  return (
    <div className="app-page">
      <UnifiedNavbar peran={peran} />
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
