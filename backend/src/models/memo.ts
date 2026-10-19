// Cache di memori untuk query data master (mapel, katalog, instrumen asesmen).
// Data ini hanya berubah lewat migrasi / skrip impor, jadi basi paling lama
// MASTER_TTL_MS masih aman, sementara setiap request tidak lagi menyentuh DB.
export const MASTER_TTL_MS = 60_000;
const MAKS_ENTRI = 500;

/**
 * Bungkus `fn` agar hasilnya di-cache per argumen selama `ttlMs`. Promise ikut
 * disimpan sehingga request serentak cukup memicu satu query; hasil gagal tidak
 * di-cache. Argumen harus bisa di-JSON-kan.
 */
export function memo<A extends unknown[], T>(fn: (...args: A) => Promise<T>, ttlMs = MASTER_TTL_MS) {
  const cache = new Map<string, { sampai: number; hasil: Promise<T> }>();

  return (...args: A): Promise<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const entri = cache.get(key);
    if (entri && entri.sampai > now) return entri.hasil;

    // Kombinasi filter katalog tidak terbatas; cegah cache tumbuh tanpa batas.
    if (cache.size >= MAKS_ENTRI) cache.clear();

    const hasil = fn(...args);
    cache.set(key, { sampai: now + ttlMs, hasil });
    hasil.catch(() => {
      if (cache.get(key)?.hasil === hasil) cache.delete(key);
    });
    return hasil;
  };
}
