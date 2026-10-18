"use client";

import React, { useEffect, useState } from "react";

import { AppShell, StatusMuat } from "../../../components/shared/AppShell";
import { PerkembanganView } from "../../../components/shared/PerkembanganView";
import { perkembangan } from "../../../lib/api/siswa";
import type { Perkembangan } from "../../../lib/api/types";
import { pesanError } from "../../../lib/riasec";

export default function PerkembanganPage() {
  const [data, setData] = useState<Perkembangan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    perkembangan()
      .then(setData)
      .catch((err) => setError(pesanError(err)));
  }, []);

  return (
    <AppShell peran="siswa">
      <div className="app-head">
        <div>
          <span className="app-eyebrow">Perkembangan • UC12</span>
          <h1 className="app-title">Perkembangan Minat & Nilai</h1>
          <p className="app-sub">Bandingkan hasil tes minat dan nilai rapormu dari waktu ke waktu.</p>
        </div>
      </div>
      {data ? <PerkembanganView data={data} /> : <StatusMuat error={error} />}
    </AppShell>
  );
}
