/**
 * Tipe produk Konter Fajar Cell.
 *
 * Produk dimodelkan sebagai discriminated union berdasarkan `category`,
 * sehingga TypeScript bisa memastikan field khusus (mis. `condition` hanya
 * untuk HP bekas) tidak tertukar antar kategori.
 */

export type ProductCategory = "handphone-bekas" | "handphone-baru" | "aksesoris";

export type ProductStatus = "ready" | "sold-out";

export type Brand =
  | "Samsung"
  | "Xiaomi"
  | "Infinix"
  | "Oppo"
  | "Vivo"
  | "Realme"
  | "Anker"
  | "Baseus"
  | "Lainnya";

export type AccessoryType =
  | "charger"
  | "tws"
  | "headset"
  | "tempered-glass"
  | "powerbank"
  | "speaker"
  | "case"
  | "lainnya";

/** Spesifikasi teknis singkat yang tampil di card produk. */
export interface PhoneSpecs {
  /** RAM dalam GB. */
  ram: number;
  /** Penyimpanan internal dalam GB. */
  storage: number;
  chipset?: string;
  screen?: string;
  /** Kapasitas baterai dalam mAh. */
  battery?: number;
  camera?: string;
}

/** Kondisi fisik unit bekas. */
export interface UsedCondition {
  /** Ringkasan kondisi, mis. "Mulus 96%". */
  grade: string;
  /** Kelengkapan utama, mis. "Fullset Original". */
  label: string;
  /** Jumlah minus/lecet yang tercatat. 0 berarti tanpa minus. */
  minusCount: number;
  /** Detail kelengkapan bawaan unit. */
  completeness: string[];
  /** Kesehatan baterai (persen), bila diketahui. */
  batteryHealth?: number;
}

export interface Warranty {
  active: boolean;
  /** Durasi garansi dalam hari. 0 berarti tanpa garansi. */
  durationDays: number;
  description: string;
}

interface ProductBase {
  id: string;
  /** URL-friendly, unik, dipakai untuk halaman detail produk. */
  slug: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  /** Harga dalam Rupiah (bilangan bulat, tanpa desimal). */
  price: number;
  /** Harga sebelum diskon. Kosongkan bila tidak ada diskon. */
  originalPrice?: number;
  /** Foto utama (rasio 1:1 atau 4:3). */
  thumbnail: string;
  /** Daftar foto tambahan/galeri untuk multi-angle preview. */
  images?: string[];
  description: string;
  status: ProductStatus;
  /** Tampil di section unggulan beranda. */
  featured: boolean;
  /** Jumlah unit tersedia. Unit HP bekas umumnya 1. */
  stock: number;
  /** Tanggal ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

export interface UsedPhoneProduct extends ProductBase {
  category: "handphone-bekas";
  specs: PhoneSpecs;
  condition: UsedCondition;
  warranty: Warranty;
  color: string;
  /** Bisa ditukar tambah / dijual kembali ke toko. */
  tradeInEligible: boolean;
}

export interface NewPhoneProduct extends ProductBase {
  category: "handphone-baru";
  specs: PhoneSpecs;
  warranty: Warranty;
  color: string;
}

export interface AccessoryProduct extends ProductBase {
  category: "aksesoris";
  accessoryType: AccessoryType;
  /** Model HP yang kompatibel, mis. ["Samsung Galaxy A55", "Redmi Note 13"]. */
  compatibleWith?: string[];
}

export type Product = UsedPhoneProduct | NewPhoneProduct | AccessoryProduct;

/**
 * Payload produk dari form admin. Metadata (`id`, `createdAt`, `updatedAt`)
 * diurus server, sedangkan `slug` opsional agar server bisa menjamin keunikan.
 */
export type ProductInput = (
  | Omit<UsedPhoneProduct, "id" | "slug" | "createdAt" | "updatedAt">
  | Omit<NewPhoneProduct, "id" | "slug" | "createdAt" | "updatedAt">
  | Omit<AccessoryProduct, "id" | "slug" | "createdAt" | "updatedAt">
) & {
  slug?: string;
};

/** Ringkasan produk untuk kartu di halaman katalog. */
export type ProductSummary = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "brand"
  | "category"
  | "price"
  | "originalPrice"
  | "thumbnail"
  | "status"
  | "stock"
> & {
  conditionLabel?: string;
};
