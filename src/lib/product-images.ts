import type { ProductCategory } from "@/types";

const FALLBACK_THUMBNAILS: Record<ProductCategory, string> = {
  "handphone-bekas": "/images/products/samsung-galaxy-m30s.jpg",
  "handphone-baru": "/images/products/infinix-smart-20.jpg",
  aksesoris: "/images/products/earphone-samsung-akg.jpg",
};

export function getFallbackThumbnail(category: ProductCategory): string {
  return FALLBACK_THUMBNAILS[category];
}

/**
 * Path publik lokal, diawali tepat satu "/".
 * "//host/file.jpg" dan "/\\host" ditolak agar tidak lolos sebagai URL eksternal.
 */
export function isLocalImagePath(value: string): boolean {
  return /^\/(?![/\\])/.test(value.trim());
}

export function isDataImageUrl(value: string): boolean {
  return /^data:image\//i.test(value.trim());
}

/** Direct link gambar dari luar; hanya protokol http(s) yang diterima. */
export function isRemoteImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidImageSource(value: string): boolean {
  return (
    isLocalImagePath(value) ||
    isDataImageUrl(value) ||
    isRemoteImageUrl(value)
  );
}

/**
 * next/image hanya dipakai untuk aset lokal. Data URL dan URL eksternal
 * dirender sebagai <img> agar admin bebas memakai direct link tanpa
 * menambahkan remotePatterns per host.
 */
export function requiresNativeImage(value: string): boolean {
  return isDataImageUrl(value) || isRemoteImageUrl(value);
}

/**
 * Daftar foto contoh yang tersedia di `public/images/products/`.
 * Dipakai sebagai saran (datalist) pada form admin, bukan daftar tertutup:
 * admin tetap bisa mengetik path lokal lain.
 */
export const PRODUCT_IMAGE_PATHS = [
  "/images/products/infinix-smart-20.jpg",
  "/images/products/poco-c81-pro.jpg",
  "/images/products/samsung-galaxy-m30s.jpg",
  "/images/products/oppo-a18.jpg",
  "/images/products/oppo-a15.jpg",
  "/images/products/xiaomi-redmi-9.jpg",
  "/images/products/vivo-y1s.jpg",
  "/images/products/oppo-a71-2018.jpg",
  "/images/products/xiaomi-redmi-6a.jpg",
  "/images/products/xiaomi-redmi-7.jpg",
  "/images/products/samsung-galaxy-j2-prime.jpg",
  "/images/products/oppo-a3s.jpg",
  "/images/products/earphone-samsung-akg.jpg",
  "/images/products/earphone-realme-buds-7.jpg",
  "/images/products/charger-samsung-bst-c08.jpg",
  "/images/products/charger-realme-op52caed.jpg",
  "/images/products/charger-kodok-lcd.jpg",
  "/images/products/kabel-metal-head-180w.jpg",
  "/images/products/kabel-super-cable-120w.jpg",
  "/images/products/kabel-meeplus-me04m.jpg",
  "/images/products/earphone-ecle-braided.jpg",
  "/images/products/earphone-u19-macaron.jpg",
  "/images/products/tempered-glass-xpro-redmi-9a.jpg",
  "/images/products/card-reader-usb-all-in-one.jpg",
] as const;

/** "/images/products/samsung-galaxy-m30s.jpg" -> "Samsung Galaxy M30s" */
export function productImageLabel(path: string): string {
  const file = path.split("/").pop() ?? path;
  const name = file.replace(/\.(jpe?g|png|webp|avif)$/i, "").replace(/-/g, " ");

  return name.replace(/\b\w/g, (character) => character.toUpperCase());
}
