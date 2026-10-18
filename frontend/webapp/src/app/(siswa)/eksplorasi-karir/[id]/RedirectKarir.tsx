"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export function RedirectKarir() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/eksplorasi-karir?id=${encodeURIComponent(id)}`);
  }, [id, router]);
  return null;
}
