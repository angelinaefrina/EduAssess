/** Pola ILIKE "mengandung"; wildcard di input diperlakukan sebagai teks biasa. */
export function polaMengandung(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
