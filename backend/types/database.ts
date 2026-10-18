export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      asesmen: {
        Row: {
          id: string
          mulai_at: string
          responden_id: string | null
          selesai_at: string | null
          semester: number | null
          siswa_id: string | null
        }
        Insert: {
          id?: string
          mulai_at?: string
          responden_id?: string | null
          selesai_at?: string | null
          semester?: number | null
          siswa_id?: string | null
        }
        Update: {
          id?: string
          mulai_at?: string
          responden_id?: string | null
          selesai_at?: string | null
          semester?: number | null
          siswa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      asesmen_kemampuan: {
        Row: {
          asesmen_id: string
          dimensi_id: number
          skor: number
        }
        Insert: {
          asesmen_id: string
          dimensi_id: number
          skor: number
        }
        Update: {
          asesmen_id?: string
          dimensi_id?: number
          skor?: number
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_kemampuan_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "asesmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_kemampuan_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "v_asesmen_terakhir_siswa"
            referencedColumns: ["asesmen_id"]
          },
          {
            foreignKeyName: "asesmen_kemampuan_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "v_profil_asesmen"
            referencedColumns: ["asesmen_id"]
          },
          {
            foreignKeyName: "asesmen_kemampuan_dimensi_id_fkey"
            columns: ["dimensi_id"]
            isOneToOne: false
            referencedRelation: "dimensi_kemampuan"
            referencedColumns: ["id"]
          },
        ]
      }
      asesmen_riasec: {
        Row: {
          asesmen_id: string
          butir_id: number
          skor: number
        }
        Insert: {
          asesmen_id: string
          butir_id: number
          skor: number
        }
        Update: {
          asesmen_id?: string
          butir_id?: number
          skor?: number
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_riasec_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "asesmen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_riasec_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "v_asesmen_terakhir_siswa"
            referencedColumns: ["asesmen_id"]
          },
          {
            foreignKeyName: "asesmen_riasec_asesmen_id_fkey"
            columns: ["asesmen_id"]
            isOneToOne: false
            referencedRelation: "v_profil_asesmen"
            referencedColumns: ["asesmen_id"]
          },
          {
            foreignKeyName: "asesmen_riasec_butir_id_fkey"
            columns: ["butir_id"]
            isOneToOne: false
            referencedRelation: "riasec_butir"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_impor: {
        Row: {
          created_at: string
          dibuat_dari: string | null
          id: string
          keterangan: string | null
          nama_file: string | null
          parameter: Json | null
          sumber: Database["public"]["Enums"]["sumber_data"]
        }
        Insert: {
          created_at?: string
          dibuat_dari?: string | null
          id?: string
          keterangan?: string | null
          nama_file?: string | null
          parameter?: Json | null
          sumber: Database["public"]["Enums"]["sumber_data"]
        }
        Update: {
          created_at?: string
          dibuat_dari?: string | null
          id?: string
          keterangan?: string | null
          nama_file?: string | null
          parameter?: Json | null
          sumber?: Database["public"]["Enums"]["sumber_data"]
        }
        Relationships: [
          {
            foreignKeyName: "batch_impor_dibuat_dari_fkey"
            columns: ["dibuat_dari"]
            isOneToOne: false
            referencedRelation: "batch_impor"
            referencedColumns: ["id"]
          },
        ]
      }
      bidang_karir: {
        Row: {
          id: number
          kode: string
          nama: string
        }
        Insert: {
          id?: never
          kode: string
          nama: string
        }
        Update: {
          id?: never
          kode?: string
          nama?: string
        }
        Relationships: []
      }
      bidang_studi: {
        Row: {
          deskripsi: string | null
          id: number
          kode: string
          nama: string
        }
        Insert: {
          deskripsi?: string | null
          id?: never
          kode: string
          nama: string
        }
        Update: {
          deskripsi?: string | null
          id?: never
          kode?: string
          nama?: string
        }
        Relationships: []
      }
      catatan_konseling: {
        Row: {
          bk_id: string | null
          created_at: string
          id: string
          isi: string
          siswa_id: string
          tindak_lanjut: string | null
          updated_at: string
        }
        Insert: {
          bk_id?: string | null
          created_at?: string
          id?: string
          isi: string
          siswa_id: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Update: {
          bk_id?: string | null
          created_at?: string
          id?: string
          isi?: string
          siswa_id?: string
          tindak_lanjut?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catatan_konseling_bk_id_fkey"
            columns: ["bk_id"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_konseling_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_konseling_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "catatan_konseling_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      dimensi_kemampuan: {
        Row: {
          id: number
          kode: string
          nomor_survei: number | null
          pernyataan: string
          urutan: number
        }
        Insert: {
          id?: never
          kode: string
          nomor_survei?: number | null
          pernyataan: string
          urutan: number
        }
        Update: {
          id?: never
          kode?: string
          nomor_survei?: number | null
          pernyataan?: string
          urutan?: number
        }
        Relationships: []
      }
      hasil_rekomendasi: {
        Row: {
          created_at: string
          hasil: Json
          id: string
          input_hash: string
          jenis: Database["public"]["Enums"]["jenis_rekomendasi"]
          model_llm: string | null
          penjelasan: string | null
          siswa_id: string
          versi_algo: string
        }
        Insert: {
          created_at?: string
          hasil: Json
          id?: string
          input_hash: string
          jenis: Database["public"]["Enums"]["jenis_rekomendasi"]
          model_llm?: string | null
          penjelasan?: string | null
          siswa_id: string
          versi_algo?: string
        }
        Update: {
          created_at?: string
          hasil?: Json
          id?: string
          input_hash?: string
          jenis?: Database["public"]["Enums"]["jenis_rekomendasi"]
          model_llm?: string | null
          penjelasan?: string | null
          siswa_id?: string
          versi_algo?: string
        }
        Relationships: [
          {
            foreignKeyName: "hasil_rekomendasi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hasil_rekomendasi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "hasil_rekomendasi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      karir: {
        Row: {
          bidang_karir_id: number | null
          catatan_sumber: string | null
          deskripsi: string | null
          id: string
          is_trending: boolean
          kode_riasec: string | null
          nama: string
          sumber_url: string | null
        }
        Insert: {
          bidang_karir_id?: number | null
          catatan_sumber?: string | null
          deskripsi?: string | null
          id?: string
          is_trending?: boolean
          kode_riasec?: string | null
          nama: string
          sumber_url?: string | null
        }
        Update: {
          bidang_karir_id?: number | null
          catatan_sumber?: string | null
          deskripsi?: string | null
          id?: string
          is_trending?: boolean
          kode_riasec?: string | null
          nama?: string
          sumber_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karir_bidang_karir_id_fkey"
            columns: ["bidang_karir_id"]
            isOneToOne: false
            referencedRelation: "bidang_karir"
            referencedColumns: ["id"]
          },
        ]
      }
      karir_prodi: {
        Row: {
          karir_id: string
          prodi_id: string
        }
        Insert: {
          karir_id: string
          prodi_id: string
        }
        Update: {
          karir_id?: string
          prodi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "karir_prodi_karir_id_fkey"
            columns: ["karir_id"]
            isOneToOne: false
            referencedRelation: "karir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "karir_prodi_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      kode_bk: {
        Row: {
          aktif: boolean
          berlaku_sampai: string | null
          created_at: string
          dibuat_oleh: string | null
          id: string
          kode: string
          sekolah_id: string
        }
        Insert: {
          aktif?: boolean
          berlaku_sampai?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          id?: string
          kode: string
          sekolah_id: string
        }
        Update: {
          aktif?: boolean
          berlaku_sampai?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          id?: string
          kode?: string
          sekolah_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kode_bk_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kode_bk_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      mapel: {
        Row: {
          id: number
          is_pilihan: boolean
          kelompok: string | null
          kode: string
          nama: string
          nomor_survei: number | null
        }
        Insert: {
          id?: never
          is_pilihan?: boolean
          kelompok?: string | null
          kode: string
          nama: string
          nomor_survei?: number | null
        }
        Update: {
          id?: never
          is_pilihan?: boolean
          kelompok?: string | null
          kode?: string
          nama?: string
          nomor_survei?: number | null
        }
        Relationships: []
      }
      nilai_rapor: {
        Row: {
          created_at: string
          diverifikasi_at: string | null
          diverifikasi_oleh: string | null
          id: string
          mapel_id: number
          nilai: number
          semester: number
          siswa_id: string
          status: Database["public"]["Enums"]["status_verifikasi"]
          sumber: Database["public"]["Enums"]["sumber_nilai"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          diverifikasi_at?: string | null
          diverifikasi_oleh?: string | null
          id?: string
          mapel_id: number
          nilai: number
          semester: number
          siswa_id: string
          status?: Database["public"]["Enums"]["status_verifikasi"]
          sumber?: Database["public"]["Enums"]["sumber_nilai"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          diverifikasi_at?: string | null
          diverifikasi_oleh?: string | null
          id?: string
          mapel_id?: number
          nilai?: number
          semester?: number
          siswa_id?: string
          status?: Database["public"]["Enums"]["status_verifikasi"]
          sumber?: Database["public"]["Enums"]["sumber_nilai"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nilai_rapor_diverifikasi_oleh_fkey"
            columns: ["diverifikasi_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_rapor_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_rapor_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_rapor_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "nilai_rapor_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      nilai_tes: {
        Row: {
          created_at: string
          id: string
          jenis_tes: string
          mapel_id: number | null
          siswa_id: string
          skor: number
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_tes: string
          mapel_id?: number | null
          siswa_id: string
          skor: number
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_tes?: string
          mapel_id?: number | null
          siswa_id?: string
          skor?: number
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "nilai_tes_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_tes_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nilai_tes_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "nilai_tes_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      perguruan_tinggi: {
        Row: {
          id: string
          jenis: Database["public"]["Enums"]["jenis_pendidikan"]
          kota: string | null
          nama: string
          situs_url: string | null
        }
        Insert: {
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_pendidikan"]
          kota?: string | null
          nama: string
          situs_url?: string | null
        }
        Update: {
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_pendidikan"]
          kota?: string | null
          nama?: string
          situs_url?: string | null
        }
        Relationships: []
      }
      preferensi_pendidikan: {
        Row: {
          gaya_belajar: Database["public"]["Enums"]["gaya_belajar"] | null
          ingin_cepat_kerja: boolean | null
          jenjang_diminati: Database["public"]["Enums"]["jenjang_pendidikan"][]
          pertimbangan_biaya: number | null
          siswa_id: string
          updated_at: string
        }
        Insert: {
          gaya_belajar?: Database["public"]["Enums"]["gaya_belajar"] | null
          ingin_cepat_kerja?: boolean | null
          jenjang_diminati?: Database["public"]["Enums"]["jenjang_pendidikan"][]
          pertimbangan_biaya?: number | null
          siswa_id: string
          updated_at?: string
        }
        Update: {
          gaya_belajar?: Database["public"]["Enums"]["gaya_belajar"] | null
          ingin_cepat_kerja?: boolean | null
          jenjang_diminati?: Database["public"]["Enums"]["jenjang_pendidikan"][]
          pertimbangan_biaya?: number | null
          siswa_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferensi_pendidikan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferensi_pendidikan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "preferensi_pendidikan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      prodi: {
        Row: {
          bidang_studi_id: number
          catatan_sumber: string | null
          deskripsi: string | null
          id: string
          jenis_pendidikan: Database["public"]["Enums"]["jenis_pendidikan"][]
          kode_riasec: string | null
          nama: string
          sumber_url: string | null
        }
        Insert: {
          bidang_studi_id: number
          catatan_sumber?: string | null
          deskripsi?: string | null
          id?: string
          jenis_pendidikan?: Database["public"]["Enums"]["jenis_pendidikan"][]
          kode_riasec?: string | null
          nama: string
          sumber_url?: string | null
        }
        Update: {
          bidang_studi_id?: number
          catatan_sumber?: string | null
          deskripsi?: string | null
          id?: string
          jenis_pendidikan?: Database["public"]["Enums"]["jenis_pendidikan"][]
          kode_riasec?: string | null
          nama?: string
          sumber_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prodi_bidang_studi_id_fkey"
            columns: ["bidang_studi_id"]
            isOneToOne: false
            referencedRelation: "bidang_studi"
            referencedColumns: ["id"]
          },
        ]
      }
      prodi_mapel: {
        Row: {
          bobot: number
          mapel_id: number
          prodi_id: string
        }
        Insert: {
          bobot?: number
          mapel_id: number
          prodi_id: string
        }
        Update: {
          bobot?: number
          mapel_id?: number
          prodi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prodi_mapel_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prodi_mapel_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      prodi_pt: {
        Row: {
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          prodi_id: string
          pt_id: string
          sumber_url: string | null
        }
        Insert: {
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          prodi_id: string
          pt_id: string
          sumber_url?: string | null
        }
        Update: {
          jenjang?: Database["public"]["Enums"]["jenjang_pendidikan"]
          prodi_id?: string
          pt_id?: string
          sumber_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prodi_pt_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prodi_pt_pt_id_fkey"
            columns: ["pt_id"]
            isOneToOne: false
            referencedRelation: "perguruan_tinggi"
            referencedColumns: ["id"]
          },
        ]
      }
      profil: {
        Row: {
          created_at: string
          id: string
          nama: string | null
          peran: Database["public"]["Enums"]["peran_pengguna"]
          sekolah_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          nama?: string | null
          peran?: Database["public"]["Enums"]["peran_pengguna"]
          sekolah_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string | null
          peran?: Database["public"]["Enums"]["peran_pengguna"]
          sekolah_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      responden: {
        Row: {
          batch_id: string
          belum_ada_gambaran_karir: boolean
          bidang_studi_id: number
          bimbingan_bk: string | null
          butuh_bantuan: number | null
          created_at: string
          dicatat_at: string | null
          faktor_keputusan: string[]
          fit_kemampuan: number
          fit_menikmati_materi: number
          fit_minat: number
          fit_pilih_ulang_sama: number
          fit_puas: number
          fit_termotivasi: number
          fit_tujuan_karier: number
          fit_yakin_lulus: number
          fitur_berguna: string[]
          frekuensi_ingin_pindah: number | null
          hal_penting_diketahui: string | null
          id: string
          info_cukup: number | null
          ipk: number | null
          jenis_sekolah: Database["public"]["Enums"]["jenis_sekolah_asal"]
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          keandalan_nilai: Database["public"]["Enums"]["keandalan_nilai"]
          kekhawatiran_ai: string[]
          kemungkinan_pakai: number | null
          kepercayaan_ai: number | null
          kesesuaian_ekspektasi: number | null
          kesulitan: string[]
          mapel_favorit_lain: string | null
          membandingkan_jurusan: string | null
          paham_kemampuan_prodi: number | null
          paham_matkul: number | null
          peminatan: Database["public"]["Enums"]["peminatan_sekolah"]
          persetujuan: boolean
          prodi_id: string | null
          prodi_teks: string
          riwayat_pindah: Database["public"]["Enums"]["riwayat_pindah"]
          saran: string | null
          semester: number | null
          status_pilihan: Database["public"]["Enums"]["status_pilihan_prodi"]
          sumber_informasi: string[]
          tahun_lulus: number | null
          tantangan: string[]
          tes_minat: string | null
          usia_min_18: boolean
          yakin_pilihan: number | null
        }
        Insert: {
          batch_id: string
          belum_ada_gambaran_karir?: boolean
          bidang_studi_id: number
          bimbingan_bk?: string | null
          butuh_bantuan?: number | null
          created_at?: string
          dicatat_at?: string | null
          faktor_keputusan?: string[]
          fit_kemampuan: number
          fit_menikmati_materi: number
          fit_minat: number
          fit_pilih_ulang_sama: number
          fit_puas: number
          fit_termotivasi: number
          fit_tujuan_karier: number
          fit_yakin_lulus: number
          fitur_berguna?: string[]
          frekuensi_ingin_pindah?: number | null
          hal_penting_diketahui?: string | null
          id?: string
          info_cukup?: number | null
          ipk?: number | null
          jenis_sekolah: Database["public"]["Enums"]["jenis_sekolah_asal"]
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"]
          keandalan_nilai: Database["public"]["Enums"]["keandalan_nilai"]
          kekhawatiran_ai?: string[]
          kemungkinan_pakai?: number | null
          kepercayaan_ai?: number | null
          kesesuaian_ekspektasi?: number | null
          kesulitan?: string[]
          mapel_favorit_lain?: string | null
          membandingkan_jurusan?: string | null
          paham_kemampuan_prodi?: number | null
          paham_matkul?: number | null
          peminatan: Database["public"]["Enums"]["peminatan_sekolah"]
          persetujuan: boolean
          prodi_id?: string | null
          prodi_teks: string
          riwayat_pindah: Database["public"]["Enums"]["riwayat_pindah"]
          saran?: string | null
          semester?: number | null
          status_pilihan: Database["public"]["Enums"]["status_pilihan_prodi"]
          sumber_informasi?: string[]
          tahun_lulus?: number | null
          tantangan?: string[]
          tes_minat?: string | null
          usia_min_18: boolean
          yakin_pilihan?: number | null
        }
        Update: {
          batch_id?: string
          belum_ada_gambaran_karir?: boolean
          bidang_studi_id?: number
          bimbingan_bk?: string | null
          butuh_bantuan?: number | null
          created_at?: string
          dicatat_at?: string | null
          faktor_keputusan?: string[]
          fit_kemampuan?: number
          fit_menikmati_materi?: number
          fit_minat?: number
          fit_pilih_ulang_sama?: number
          fit_puas?: number
          fit_termotivasi?: number
          fit_tujuan_karier?: number
          fit_yakin_lulus?: number
          fitur_berguna?: string[]
          frekuensi_ingin_pindah?: number | null
          hal_penting_diketahui?: string | null
          id?: string
          info_cukup?: number | null
          ipk?: number | null
          jenis_sekolah?: Database["public"]["Enums"]["jenis_sekolah_asal"]
          jenjang?: Database["public"]["Enums"]["jenjang_pendidikan"]
          keandalan_nilai?: Database["public"]["Enums"]["keandalan_nilai"]
          kekhawatiran_ai?: string[]
          kemungkinan_pakai?: number | null
          kepercayaan_ai?: number | null
          kesesuaian_ekspektasi?: number | null
          kesulitan?: string[]
          mapel_favorit_lain?: string | null
          membandingkan_jurusan?: string | null
          paham_kemampuan_prodi?: number | null
          paham_matkul?: number | null
          peminatan?: Database["public"]["Enums"]["peminatan_sekolah"]
          persetujuan?: boolean
          prodi_id?: string | null
          prodi_teks?: string
          riwayat_pindah?: Database["public"]["Enums"]["riwayat_pindah"]
          saran?: string | null
          semester?: number | null
          status_pilihan?: Database["public"]["Enums"]["status_pilihan_prodi"]
          sumber_informasi?: string[]
          tahun_lulus?: number | null
          tantangan?: string[]
          tes_minat?: string | null
          usia_min_18?: boolean
          yakin_pilihan?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "responden_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_impor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_bidang_studi_id_fkey"
            columns: ["bidang_studi_id"]
            isOneToOne: false
            referencedRelation: "bidang_studi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      responden_bidang_karir: {
        Row: {
          bidang_karir_id: number
          responden_id: string
        }
        Insert: {
          bidang_karir_id: number
          responden_id: string
        }
        Update: {
          bidang_karir_id?: number
          responden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responden_bidang_karir_bidang_karir_id_fkey"
            columns: ["bidang_karir_id"]
            isOneToOne: false
            referencedRelation: "bidang_karir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_bidang_karir_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_bidang_karir_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "responden_bidang_karir_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
        ]
      }
      responden_mapel_favorit: {
        Row: {
          mapel_id: number
          responden_id: string
        }
        Insert: {
          mapel_id: number
          responden_id: string
        }
        Update: {
          mapel_id?: number
          responden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responden_mapel_favorit_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_mapel_favorit_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_mapel_favorit_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "responden_mapel_favorit_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
        ]
      }
      responden_nilai: {
        Row: {
          mapel_id: number
          nilai: number
          responden_id: string
        }
        Insert: {
          mapel_id: number
          nilai: number
          responden_id: string
        }
        Update: {
          mapel_id?: number
          nilai?: number
          responden_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responden_nilai_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_nilai_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_nilai_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "responden_nilai_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
        ]
      }
      riasec_butir: {
        Row: {
          aktif: boolean
          id: number
          nomor_survei: number | null
          pernyataan: string
          tipe: Database["public"]["Enums"]["tipe_riasec"]
          urutan: number
        }
        Insert: {
          aktif?: boolean
          id?: never
          nomor_survei?: number | null
          pernyataan: string
          tipe: Database["public"]["Enums"]["tipe_riasec"]
          urutan: number
        }
        Update: {
          aktif?: boolean
          id?: never
          nomor_survei?: number | null
          pernyataan?: string
          tipe?: Database["public"]["Enums"]["tipe_riasec"]
          urutan?: number
        }
        Relationships: []
      }
      sekolah: {
        Row: {
          created_at: string
          id: string
          kota: string | null
          nama: string
          npsn: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kota?: string | null
          nama: string
          npsn?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kota?: string | null
          nama?: string
          npsn?: string | null
        }
        Relationships: []
      }
      siswa: {
        Row: {
          angkatan: number | null
          created_at: string
          id: string
          onboarding_selesai: boolean
          peminatan: Database["public"]["Enums"]["peminatan_sekolah"] | null
          rombel: string | null
          tingkat: number | null
          updated_at: string
        }
        Insert: {
          angkatan?: number | null
          created_at?: string
          id: string
          onboarding_selesai?: boolean
          peminatan?: Database["public"]["Enums"]["peminatan_sekolah"] | null
          rombel?: string | null
          tingkat?: number | null
          updated_at?: string
        }
        Update: {
          angkatan?: number | null
          created_at?: string
          id?: string
          onboarding_selesai?: boolean
          peminatan?: Database["public"]["Enums"]["peminatan_sekolah"] | null
          rombel?: string | null
          tingkat?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
      siswa_bidang_karir: {
        Row: {
          bidang_karir_id: number
          siswa_id: string
        }
        Insert: {
          bidang_karir_id: number
          siswa_id: string
        }
        Update: {
          bidang_karir_id?: number
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_bidang_karir_bidang_karir_id_fkey"
            columns: ["bidang_karir_id"]
            isOneToOne: false
            referencedRelation: "bidang_karir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_bidang_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_bidang_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "siswa_bidang_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      siswa_mapel: {
        Row: {
          mapel_id: number
          siswa_id: string
        }
        Insert: {
          mapel_id: number
          siswa_id: string
        }
        Update: {
          mapel_id?: number
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_mapel_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_mapel_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_mapel_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "siswa_mapel_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      siswa_mapel_favorit: {
        Row: {
          mapel_id: number
          siswa_id: string
        }
        Insert: {
          mapel_id: number
          siswa_id: string
        }
        Update: {
          mapel_id?: number
          siswa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siswa_mapel_favorit_mapel_id_fkey"
            columns: ["mapel_id"]
            isOneToOne: false
            referencedRelation: "mapel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_mapel_favorit_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_mapel_favorit_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "siswa_mapel_favorit_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      target_karir: {
        Row: {
          created_at: string
          id: string
          karir_id: string | null
          siswa_id: string
          sumber: Database["public"]["Enums"]["sumber_target"]
          teks_bebas: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          karir_id?: string | null
          siswa_id: string
          sumber: Database["public"]["Enums"]["sumber_target"]
          teks_bebas?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          karir_id?: string | null
          siswa_id?: string
          sumber?: Database["public"]["Enums"]["sumber_target"]
          teks_bebas?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "target_karir_karir_id_fkey"
            columns: ["karir_id"]
            isOneToOne: false
            referencedRelation: "karir"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "target_karir_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      target_prodi: {
        Row: {
          created_at: string
          id: string
          is_utama: boolean
          prodi_id: string
          siswa_id: string
          sumber: Database["public"]["Enums"]["sumber_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_utama?: boolean
          prodi_id: string
          siswa_id: string
          sumber: Database["public"]["Enums"]["sumber_target"]
        }
        Update: {
          created_at?: string
          id?: string
          is_utama?: boolean
          prodi_id?: string
          siswa_id?: string
          sumber?: Database["public"]["Enums"]["sumber_target"]
        }
        Relationships: [
          {
            foreignKeyName: "target_prodi_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_prodi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_prodi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "target_prodi_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
    }
    Views: {
      v_asesmen_terakhir_siswa: {
        Row: {
          asesmen_id: string | null
          kemampuan: Json | null
          kode_holland: string | null
          responden_id: string | null
          riasec: Json | null
          selesai_at: string | null
          siswa_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      v_fitur_responden: {
        Row: {
          batch_id: string | null
          bidang_karir: string[] | null
          bidang_studi: string | null
          cocok: boolean | null
          ipk: number | null
          jenjang: Database["public"]["Enums"]["jenjang_pendidikan"] | null
          keandalan_nilai: Database["public"]["Enums"]["keandalan_nilai"] | null
          kemampuan: Json | null
          kode_holland: string | null
          mapel_favorit: string[] | null
          nilai: Json | null
          peminatan: Database["public"]["Enums"]["peminatan_sekolah"] | null
          prodi_id: string | null
          responden_id: string | null
          riasec: Json | null
          skor_kecocokan: number | null
          sumber_data: Database["public"]["Enums"]["sumber_data"] | null
        }
        Relationships: [
          {
            foreignKeyName: "responden_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_impor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responden_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      v_fitur_siswa: {
        Row: {
          bidang_karir: string[] | null
          kemampuan: Json | null
          kode_holland: string | null
          mapel_favorit: string[] | null
          nilai: Json | null
          peminatan: Database["public"]["Enums"]["peminatan_sekolah"] | null
          riasec: Json | null
          siswa_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
      v_label_responden: {
        Row: {
          cocok: boolean | null
          responden_id: string | null
          skor_kecocokan: number | null
        }
        Insert: {
          cocok?: never
          responden_id?: string | null
          skor_kecocokan?: never
        }
        Update: {
          cocok?: never
          responden_id?: string | null
          skor_kecocokan?: never
        }
        Relationships: []
      }
      v_profil_asesmen: {
        Row: {
          asesmen_id: string | null
          kemampuan: Json | null
          kode_holland: string | null
          responden_id: string | null
          riasec: Json | null
          selesai_at: string | null
          siswa_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "responden"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_responden_id_fkey"
            columns: ["responden_id"]
            isOneToOne: false
            referencedRelation: "v_label_responden"
            referencedColumns: ["responden_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "siswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_fitur_siswa"
            referencedColumns: ["siswa_id"]
          },
          {
            foreignKeyName: "asesmen_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "v_status_siswa"
            referencedColumns: ["siswa_id"]
          },
        ]
      }
      v_ringkasan_bidang_angkatan: {
        Row: {
          angkatan: number | null
          bidang_studi: string | null
          jumlah: number | null
          sekolah_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ringkasan_karir_angkatan: {
        Row: {
          angkatan: number | null
          bidang_karir: string | null
          jumlah: number | null
          sekolah_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ringkasan_mapel_angkatan: {
        Row: {
          angkatan: number | null
          jumlah: number | null
          mapel: string | null
          sekolah_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      v_ringkasan_minat_angkatan: {
        Row: {
          angkatan: number | null
          jumlah: number | null
          sekolah_id: string | null
          tipe_dominan: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
        ]
      }
      v_status_siswa: {
        Row: {
          ada_nilai_menunggu: boolean | null
          angkatan: number | null
          belum_asesmen: boolean | null
          belum_isi_nilai: boolean | null
          kode_holland: string | null
          nama: string | null
          profil_belum_lengkap: boolean | null
          rombel: string | null
          sekolah_id: string | null
          siswa_id: string | null
          status_keselarasan: string | null
          tingkat: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profil_sekolah_id_fkey"
            columns: ["sekolah_id"]
            isOneToOne: false
            referencedRelation: "sekolah"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: true
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      impor_katalog: { Args: { p: Json }; Returns: Json }
    }
    Enums: {
      gaya_belajar: "praktik" | "teori" | "seimbang"
      jenis_pendidikan: "akademik" | "vokasi" | "kedinasan" | "kerja"
      jenis_rekomendasi: "prodi" | "mapel" | "jenis_pendidikan" | "keselarasan"
      jenis_sekolah_asal: "SMA" | "MA" | "SMK" | "kesetaraan"
      jenjang_pendidikan: "D3" | "D4" | "S1" | "kedinasan" | "langsung_kerja"
      keandalan_nilai: "rapor" | "catatan" | "ingatan" | "tidak_mengisi"
      peminatan_sekolah: "IPA" | "IPS" | "Bahasa" | "Merdeka" | "SMK"
      peran_pengguna: "siswa" | "bk"
      riwayat_pindah: "belum" | "pernah_tidak_cocok" | "pernah_alasan_lain"
      status_pilihan_prodi:
        | "pilihan_pertama"
        | "bukan_pertama_diinginkan"
        | "ingin_jurusan_lain"
        | "belum_punya_pilihan"
      status_verifikasi: "menunggu" | "terverifikasi" | "ditolak"
      sumber_data: "survei" | "sintetis"
      sumber_nilai: "input_siswa" | "impor_bk"
      sumber_target:
        | "onboarding"
        | "eksplorasi_karir"
        | "rekomendasi"
        | "katalog"
      tipe_riasec: "R" | "I" | "A" | "S" | "E" | "C"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      gaya_belajar: ["praktik", "teori", "seimbang"],
      jenis_pendidikan: ["akademik", "vokasi", "kedinasan", "kerja"],
      jenis_rekomendasi: ["prodi", "mapel", "jenis_pendidikan", "keselarasan"],
      jenis_sekolah_asal: ["SMA", "MA", "SMK", "kesetaraan"],
      jenjang_pendidikan: ["D3", "D4", "S1", "kedinasan", "langsung_kerja"],
      keandalan_nilai: ["rapor", "catatan", "ingatan", "tidak_mengisi"],
      peminatan_sekolah: ["IPA", "IPS", "Bahasa", "Merdeka", "SMK"],
      peran_pengguna: ["siswa", "bk"],
      riwayat_pindah: ["belum", "pernah_tidak_cocok", "pernah_alasan_lain"],
      status_pilihan_prodi: [
        "pilihan_pertama",
        "bukan_pertama_diinginkan",
        "ingin_jurusan_lain",
        "belum_punya_pilihan",
      ],
      status_verifikasi: ["menunggu", "terverifikasi", "ditolak"],
      sumber_data: ["survei", "sintetis"],
      sumber_nilai: ["input_siswa", "impor_bk"],
      sumber_target: [
        "onboarding",
        "eksplorasi_karir",
        "rekomendasi",
        "katalog",
      ],
      tipe_riasec: ["R", "I", "A", "S", "E", "C"],
    },
  },
} as const
