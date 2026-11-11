/** Tipe untuk alur login admin: PIN dan sesi diverifikasi server. */

import type {
  AccessoryType,
  Brand,
  ProductCategory,
  ProductStatus,
} from "./product";

export interface AdminLoginRequest {
  pin: string;
}

export type AdminLoginResponse =
  | { success: true; loginAt: string }
  | { success: false; error: string };

export type AdminSessionResponse =
  | { authenticated: true; loginAt: string }
  | { authenticated: false };

export type AdminLogoutResponse = { success: true };

/**
 * Nilai mentah form produk admin.
 *
 * Semua angka disimpan sebagai string karena berasal langsung dari input HTML.
 * Konversi + validasi dilakukan di `src/lib/product-form.ts` sebelum disimpan.
 * Field khusus kategori tetap opsional agar satu form bisa menangani ketiga tipe
 * produk (HP bekas, HP baru, aksesoris).
 */
export interface ProductFormValues {
  name: string;
  brand: Brand;
  category: ProductCategory;
  price: string;
  originalPrice: string;
  stock: string;
  status: ProductStatus;
  /** Hanya untuk UI/validasi form; tidak ikut disimpan ke produk. */
  imageSource: "upload" | "local" | "url";
  thumbnail: string;
  /** Foto tambahan / sudut pandang lain (Multi-angle gallery). */
  galleryImages: string[];
  description: string;
  featured: boolean;

  /** HP bekas & HP baru. */
  color: string;
  ram: string;
  storage: string;

  /** Hanya HP bekas. */
  conditionGrade: string;
  conditionLabel: string;
  minusCount: string;
  batteryHealth: string;
  /** Daftar kelengkapan, dipisahkan koma. */
  completeness: string;

  /** HP bekas & HP baru. */
  warrantyActive: boolean;
  warrantyDurationDays: string;
  warrantyDescription: string;

  /** Hanya aksesoris. */
  accessoryType: AccessoryType;
  /** Model HP yang kompatibel, dipisahkan koma. */
  compatibleWith: string;
}
