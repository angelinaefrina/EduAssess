import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

/** Cache peran: "<user_id>:<peran>". Hanya untuk UX redirect; otorisasi tetap di backend. */
const COOKIE_PERAN = "peran";

type Peran = "siswa" | "bk";

/**
 * Peran disimpan di tabel `profil` (bukan user_metadata) dan RLS menutup akses
 * anon key, jadi peran diambil dari backend GET /me lalu di-cache di cookie.
 */
async function ambilPeran(
  request: NextRequest,
  userId: string,
  accessToken: string | undefined
): Promise<{ peran: Peran | null; dariCache: boolean }> {
  const cache = request.cookies.get(COOKIE_PERAN)?.value;
  if (cache?.startsWith(`${userId}:`)) {
    const peran = cache.slice(userId.length + 1);
    if (peran === "siswa" || peran === "bk") return { peran, dariCache: true };
  }
  if (!accessToken) return { peran: null, dariCache: false };

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return { peran: null, dariCache: false };
    const json = await res.json();
    const peran = json?.data?.peran;
    return {
      peran: peran === "siswa" || peran === "bk" ? peran : null,
      dariCache: false,
    };
  } catch {
    // Backend mati: jangan blokir navigasi, halaman akan menampilkan error API.
    return { peran: null, dariCache: false };
  }
}

/**
 * Proxy Next.js:
 * 1. Me-refresh sesi Supabase (token baru ditulis ke cookie).
 * 2. Melindungi semua route kecuali /login:
 *    – Unauthenticated → redirect ke /login
 *    – BK mengakses route siswa (/beranda, dll.) → redirect ke /bk/dashboard
 *    – Siswa mengakses route BK (/bk/...) → redirect ke /beranda
 */
export async function proxy(request: NextRequest) {
  // SEMENTARA (dev): SKIP_AUTH=true di .env.local mematikan cek login.
  if (process.env.SKIP_AUTH === "true") return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh sesi – PENTING: jangan hapus baris ini.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Halaman publik — selalu boleh diakses.
  const isPublic = pathname.startsWith("/login");

  if (!user) {
    if (isPublic) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { peran, dariCache } = await ambilPeran(
    request,
    user.id,
    session?.access_token
  );

  const beranda = peran === "bk" ? "/bk/dashboard" : "/beranda";
  const isBkRoute = pathname.startsWith("/bk");
  const isSiswaRoute = !isBkRoute && !isPublic && pathname !== "/";

  let redirectKe: string | null = null;
  if (isPublic || pathname === "/") redirectKe = beranda;
  else if (peran === "bk" && isSiswaRoute) redirectKe = "/bk/dashboard";
  else if (peran === "siswa" && isBkRoute) redirectKe = "/beranda";

  if (redirectKe) {
    const url = request.nextUrl.clone();
    url.pathname = redirectKe;
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Bawa cookie sesi yang baru di-refresh ke response redirect.
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    response = redirect;
  }

  if (peran && !dariCache) {
    response.cookies.set(COOKIE_PERAN, `${user.id}:${peran}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - _next/static (file statis)
     * - _next/image (optimasi gambar)
     * - favicon.ico
     * - api/* (Next.js API routes jika ada)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
