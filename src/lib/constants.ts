import type {
  AccessoryType,
  Brand,
  CompletenessOption,
  ProductCategory,
  ProductStatus,
  TradeInConditionGrade,
} from "@/types";

export const SITE = {
  name: "Konter Fajar Cell",
  tagline: "Pusat HP Bekas Bergaransi & Aksesoris Original",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "6285156069234",
} as const;

/**
 * Navigasi halaman pembeli. Saat ini memakai anchor satu halaman;
 * ganti href ke rute katalog saat halaman terpisah sudah dibuat.
 */
export const NAV_ITEMS = [
  { label: "Beranda", href: "#beranda" },
  { label: "HP Bekas", href: "#hp-bekas" },
  { label: "HP Baru", href: "#hp-baru" },
  { label: "Aksesoris", href: "#aksesoris" },
  { label: "Service HP", href: "/service" },
  { label: "Tukar Tambah", href: "#tukar-tambah" },
  { label: "Lokasi", href: "#lokasi" },
] as const;

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  "handphone-bekas": "HP Bekas",
  "handphone-baru": "HP Baru",
  aksesoris: "Aksesoris",
};

/** Rute katalog per kategori, dipakai untuk link produk. */
export const PRODUCT_CATEGORY_PATHS: Record<ProductCategory, string> = {
  "handphone-bekas": "/katalog/hp-bekas",
  "handphone-baru": "/katalog/hp-baru",
  aksesoris: "/katalog/aksesoris",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ready: "Ready Stock",
  "sold-out": "Sold Out",
};

/** Merek yang tampil sebagai tombol filter di katalog HP. */
export const PHONE_BRANDS = [
  "Samsung",
  "Xiaomi",
  "Infinix",
  "Oppo",
  "Vivo",
  "Realme",
] as const satisfies readonly Brand[];

export const ACCESSORY_TYPE_LABELS: Record<AccessoryType, string> = {
  charger: "Charger",
  tws: "TWS",
  headset: "Headset",
  "tempered-glass": "Tempered Glass",
  powerbank: "Powerbank",
  speaker: "Speaker Bluetooth",
  case: "Case / Cover",
  lainnya: "Lainnya",
};

export const TRADE_IN_CONDITION_LABELS: Record<TradeInConditionGrade, string> = {
  mulus: "Mulus (95-100%)",
  "lecet-ringan": "Lecet ringan",
  "lecet-berat": "Lecet berat / ada minus",
};

export const TRADE_IN_COMPLETENESS_LABELS: Record<CompletenessOption, string> = {
  fullset: "Fullset (dus, charger, kabel)",
  "unit-saja": "Unit saja",
  "tanpa-charger": "Unit + dus, tanpa charger",
};

