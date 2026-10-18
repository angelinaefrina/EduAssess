/**
 * UC14 / F11: penjelasan berbahasa alami yang HANYA bersumber dari hasil perhitungan.
 * Dua mode lewat env LLM_PROVIDER:
 *   - mock      : template dari komponen skor (services/penjelasanTemplate.ts), tanpa API.
 *                 Default bila ANTHROPIC_API_KEY kosong. model_llm = "mock".
 *   - anthropic : Claude API dengan env.LLM_MODEL (default claude-haiku-5-5).
 * Tidak ada nama/ID siswa yang dikirim ke API — hanya angka & nama prodi/karir/mapel.
 */
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import type { JenisRekomendasi } from '../models/rekomendasi.model';
import { penjelasanTemplate } from './penjelasanTemplate';

const SISTEM = `Kamu menjelaskan hasil sebuah sistem rekomendasi jurusan kepada siswa SMA di Indonesia.

Aturan wajib:
- Gunakan HANYA informasi di dalam <data>. Jangan menambahkan fakta lain: jangan menyebut gaji, prospek kerja, peluang diterima, nama kampus, akreditasi, atau statistik apa pun yang tidak ada di data.
- Jangan mengubah, membulatkan ulang, atau mengarang angka, peringkat, maupun status. Kutip angka apa adanya bila perlu.
- Jelaskan MENGAPA hasilnya demikian dengan merujuk komponen yang tersedia: "minat" (kecocokan hasil tes minat RIASEC dengan kode RIASEC prodi), "akademik" (nilai rapor pada mapel pendukung prodi; mapel pendukung yang tidak diambil dihitung 0, sehingga cakupan rendah menurunkan skor), dan "karir" (kecocokan dengan target karir atau bidang karir yang diminati siswa). Untuk jenjang, rujuk alasan poin yang tercantum.
- Bila data menunjukkan kekurangan (mis. data_kurang/cakupan nilai rendah, mapel pendukung tidak diambil, katalog_draf bernilai true), sebutkan dengan jujur bahwa hasil perlu dibaca hati-hati.
- Tegaskan bahwa ini hasil perhitungan sistem, bukan keputusan, dan sarankan siswa berdiskusi dengan guru BK.
- Sapa siswa dengan "kamu". Bahasa Indonesia yang santun dan mudah dipahami. 2–4 paragraf pendek, tanpa judul, tanpa tabel, tanpa daftar bernomor.`;

const PANDUAN_JENIS: Record<JenisRekomendasi, string> = {
  prodi: 'Jelaskan 3 prodi teratas dan rumpun yang paling menonjol.',
  mapel: 'Jelaskan mapel pilihan teratas dan prodi kandidat yang membutuhkannya. Bila "relevan" false, sampaikan bahwa rekomendasi mapel pilihan ditujukan untuk kelas 10–11.',
  jenis_pendidikan: 'Jelaskan urutan jenjang pendidikan (S1/D3/D4/kedinasan) berdasarkan alasan poin dari preferensi siswa.',
  keselarasan: 'Jelaskan status keselarasan target prodi utama, alasan statusnya, dan mapel pendukung yang perlu diperkuat.',
};

/** Buang field id (uuid) agar yang dikirim ke API hanya informasi yang perlu dijelaskan. */
function tanpaId(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(tanpaId);
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v)
        .filter(([k]) => k !== 'id' && !k.endsWith('_id'))
        .map(([k, x]) => [k, tanpaId(x)]),
    );
  }
  return v;
}

export class PenjelasanGagal extends Error {
  constructor(
    public readonly alasan: 'LLM_MENOLAK' | 'LLM_GAGAL',
    message: string,
  ) {
    super(message);
  }
}

let klien: Anthropic | null = null;
function client(): Anthropic {
  // env.ts memastikan key ada bila LLM_PROVIDER=anthropic.
  klien ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30_000, maxRetries: 1 });
  return klien;
}

export const PenjelasanLLMService = {
  provider: () => env.LLM_PROVIDER,
  /** Nilai yang disimpan di hasil_rekomendasi.model_llm. */
  model: () => (env.LLM_PROVIDER === 'mock' ? 'mock' : env.LLM_MODEL),

  async jelaskan(jenis: JenisRekomendasi, hasil: unknown): Promise<string> {
    if (env.LLM_PROVIDER === 'mock') return penjelasanTemplate(jenis, hasil);

    let respons: Anthropic.Message;
    try {
      respons = await client().messages.create({
        model: env.LLM_MODEL,
        max_tokens: 4000,
        output_config: { effort: 'low' },
        system: SISTEM,
        messages: [
          {
            role: 'user',
            content: `${PANDUAN_JENIS[jenis]}\n\n<data>\n${JSON.stringify(tanpaId(hasil), null, 2)}\n</data>`,
          },
        ],
      });
    } catch (err) {
      if (err instanceof PenjelasanGagal) throw err;
      if (err instanceof Anthropic.APIError) {
        throw new PenjelasanGagal('LLM_GAGAL', `Claude API ${err.status ?? ''}: ${err.message}`);
      }
      throw new PenjelasanGagal('LLM_GAGAL', err instanceof Error ? err.message : String(err));
    }

    if (respons.stop_reason === 'refusal') {
      throw new PenjelasanGagal('LLM_MENOLAK', `Model menolak (${respons.stop_details?.category ?? 'tanpa kategori'})`);
    }
    if (respons.stop_reason === 'max_tokens') {
      throw new PenjelasanGagal('LLM_GAGAL', 'Penjelasan terpotong (max_tokens)');
    }
    const teks = respons.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!teks) throw new PenjelasanGagal('LLM_GAGAL', 'Respons kosong');
    return teks;
  },
};
