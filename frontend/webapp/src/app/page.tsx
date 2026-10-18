import { redirect } from "next/navigation";

/**
 * Root page: proxy.ts sudah me-redirect "/" sesuai peran (dari backend GET /me).
 * Page ini hanya fallback bila proxy tidak sempat menentukan peran.
 */
export default function RootPage() {
  redirect("/beranda");
}
