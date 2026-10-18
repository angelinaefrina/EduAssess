import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Gunakan di Server Components, Server Actions, dan Route Handlers.
 * Membaca + menulis cookie agar token Supabase di-refresh otomatis.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll dipanggil dari Server Component – cookie bisa ditulis
            // hanya dari middleware. Abaikan error ini jika ada middleware yang
            // me-refresh sesi.
          }
        },
      },
    }
  );
}