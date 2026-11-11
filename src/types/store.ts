/** Profil dan pengaturan toko yang bisa diubah admin. */

export interface OperationalHour {
  /** Nama hari dalam bahasa Indonesia, mis. "Senin". */
  day: string;
  /** Jam buka format 24 jam, mis. "08.00". */
  open: string;
  /** Jam tutup format 24 jam, mis. "21.00". */
  close: string;
  /** true jika toko tutup pada hari tersebut. */
  closed?: boolean;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  /** Nomor WhatsApp tersimpan dalam format internasional, mis. "6281234567890". */
  whatsappNumber: string;
  /** Nomor versi tampilan, mis. "+62 812-3456-7890". */
  displayPhone: string;
  address: string;
  /** Plus Code lokasi toko Google Maps, mis. "MM7X+969". */
  plusCode?: string;
  /** URL embed Google Maps untuk iframe. */
  mapsEmbedUrl: string;
  /** URL Google Maps yang dibuka di tab baru. */
  mapsUrl: string;
  operationalHours: OperationalHour[];
  /** Wilayah yang dijangkau layanan COD. */
  codAreas: string[];
  instagram?: string;
}
