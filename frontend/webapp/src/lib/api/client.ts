/**
 * Structured error dari backend Express (src/middleware/errorHandler).
 * Shape: { error: { code, message } }
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Rincian tambahan dari backend, mis. daftar error impor CSV. */
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL =
  (typeof window === "undefined" ? process.env.INTERNAL_API_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

/** Ambil access_token Supabase dari cookie browser (client-side). */
async function getBearerToken(): Promise<string | null> {
  // Saat dipanggil dari browser, baca sesi melalui Supabase browser client.
  // Import dinamis agar file ini tetap bisa dipakai di server (tanpa window).
  if (typeof window === "undefined") return null;
  const { createSupabaseBrowser } = await import("../supabase/client");
  const supabase = createSupabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function buildHeaders(
  extra?: Record<string, string>,
  token?: string | null
): Promise<HeadersInit> {
  const accessToken = token ?? (await getBearerToken());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const code = json?.error?.code ?? "UNKNOWN";
    const message = json?.error?.message ?? res.statusText;
    throw new ApiError(res.status, code, message, json?.error?.details);
  }
  // Backend selalu membungkus response dalam { data: ... }
  return (json?.data ?? json) as T;
}

/**
 * Buat instance API client dengan access_token opsional (untuk server-side).
 * Tanpa token → token diambil otomatis dari sesi browser Supabase.
 */
export function makeApiClient(token?: string | null) {
  async function req<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const headers = await buildHeaders(undefined, token);
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    return handleResponse<T>(res);
  }

  /** Untuk unduhan file (mis. CSV) yang tetap butuh header Authorization. */
  async function getBlob(path: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: await buildHeaders(undefined, token),
      cache: "no-store",
    });
    if (!res.ok) await handleResponse(res);
    return res.blob();
  }

  return {
    getBlob,
    get: <T>(path: string) => req<T>("GET", path),
    post: <T>(path: string, data?: unknown) => req<T>("POST", path, data),
    put: <T>(path: string, data?: unknown) => req<T>("PUT", path, data),
    patch: <T>(path: string, data?: unknown) => req<T>("PATCH", path, data),
    del: <T>(path: string) => req<T>("DELETE", path),
  };
}

/** Client default untuk Client Components (token dari session browser). */
export const apiClient = makeApiClient();
