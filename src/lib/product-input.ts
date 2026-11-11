import type {
  AccessoryType,
  Brand,
  PhoneSpecs,
  ProductCategory,
  ProductInput,
  ProductStatus,
  UsedCondition,
  Warranty,
} from "@/types";

import { isValidImageSource } from "./product-images";
import { slugify } from "./utils";

const CATEGORIES: readonly ProductCategory[] = [
  "handphone-bekas",
  "handphone-baru",
  "aksesoris",
];

const BRANDS: readonly Brand[] = [
  "Samsung",
  "Xiaomi",
  "Infinix",
  "Oppo",
  "Vivo",
  "Realme",
  "Anker",
  "Baseus",
  "Lainnya",
];

const STATUSES: readonly ProductStatus[] = ["ready", "sold-out"];

const ACCESSORY_TYPES: readonly AccessoryType[] = [
  "charger",
  "tws",
  "headset",
  "tempered-glass",
  "powerbank",
  "speaker",
  "case",
  "lainnya",
];

const MAX_IMAGES = 8;

export function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === "string" &&
    CATEGORIES.includes(value as ProductCategory)
  );
}

export function isProductStatus(value: unknown): value is ProductStatus {
  return (
    typeof value === "string" && STATUSES.includes(value as ProductStatus)
  );
}

export function isBrand(value: unknown): value is Brand {
  return typeof value === "string" && BRANDS.includes(value as Brand);
}

export function isAccessoryType(value: unknown): value is AccessoryType {
  return (
    typeof value === "string" &&
    ACCESSORY_TYPES.includes(value as AccessoryType)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function asString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return null;
  return trimmed;
}

function parseStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (trimmed === "" || trimmed.length > 100) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= maxItems) break;
  }

  return result;
}

function parseSpecs(value: unknown): PhoneSpecs | null {
  if (!isRecord(value)) return null;

  const ram = asInteger(value.ram);
  const storage = asInteger(value.storage);
  if (ram === null || ram <= 0 || storage === null || storage <= 0) {
    return null;
  }

  const specs: PhoneSpecs = { ram, storage };

  const chipset = asString(value.chipset, 120);
  const screen = asString(value.screen, 160);
  const camera = asString(value.camera, 120);
  const battery = asInteger(value.battery);

  if (chipset) specs.chipset = chipset;
  if (screen) specs.screen = screen;
  if (camera) specs.camera = camera;
  if (battery !== null && battery > 0) specs.battery = battery;

  return specs;
}

function parseWarranty(value: unknown): Warranty | null {
  if (!isRecord(value) || typeof value.active !== "boolean") return null;

  const durationDays = asInteger(value.durationDays);
  const description = asString(value.description, 240);
  if (durationDays === null || durationDays < 0 || description === null) {
    return null;
  }

  return { active: value.active, durationDays, description };
}

function parseCondition(value: unknown): UsedCondition | null {
  if (!isRecord(value)) return null;

  const grade = asString(value.grade, 80);
  const label = asString(value.label, 80);
  const minusCount = asInteger(value.minusCount);
  const completeness = parseStringList(value.completeness, 20);

  if (!grade || !label || minusCount === null || minusCount < 0) return null;
  if (completeness.length === 0) return null;

  const condition: UsedCondition = {
    grade,
    label,
    minusCount,
    completeness,
  };

  if (value.batteryHealth !== undefined) {
    const health = asInteger(value.batteryHealth);
    if (health === null || health < 0 || health > 100) return null;
    condition.batteryHealth = health;
  }

  return condition;
}

export type ProductInputResult =
  | { ok: true; value: ProductInput }
  | { ok: false; error: string };

/**
 * Validasi payload API produk. Form admin sudah memvalidasi di browser, tetapi
 * Route Handler tetap memeriksa ulang karena request bisa datang dari luar UI.
 */
export function parseProductInput(value: unknown): ProductInputResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Payload produk tidak valid." };
  }

  if (!isProductCategory(value.category)) {
    return { ok: false, error: "Kategori produk tidak valid." };
  }

  const category = value.category;
  const name = asString(value.name, 100);
  if (!name || name.length < 2) {
    return { ok: false, error: "Nama produk minimal 2 karakter." };
  }

  if (!isBrand(value.brand)) {
    return { ok: false, error: "Merek produk tidak valid." };
  }

  const price = asInteger(value.price);
  if (price === null || price <= 0) {
    return { ok: false, error: "Harga harus bilangan bulat lebih dari 0." };
  }

  let originalPrice: number | undefined;
  if (value.originalPrice !== undefined && value.originalPrice !== null) {
    const parsed = asInteger(value.originalPrice);
    if (parsed === null || parsed <= 0) {
      return { ok: false, error: "Harga sebelum diskon tidak valid." };
    }
    if (parsed <= price) {
      return {
        ok: false,
        error: "Harga sebelum diskon harus lebih besar dari harga jual.",
      };
    }
    originalPrice = parsed;
  }

  const stock = asInteger(value.stock);
  if (stock === null || stock < 0 || stock > 1_000_000) {
    return { ok: false, error: "Stok harus bilangan bulat 0 atau lebih." };
  }

  if (!isProductStatus(value.status)) {
    return { ok: false, error: "Status produk tidak valid." };
  }
  const status = value.status;

  if (status === "ready" && stock < 1) {
    return {
      ok: false,
      error: "Produk berstatus Ready Stock harus memiliki stok minimal 1.",
    };
  }

  const thumbnail = asString(value.thumbnail, 2048);
  if (!thumbnail || !isValidImageSource(thumbnail)) {
    return {
      ok: false,
      error:
        "Gambar utama harus path lokal (/images/...) atau URL http(s) yang valid.",
    };
  }

  const images = parseStringList(value.images, MAX_IMAGES).filter(
    isValidImageSource,
  );
  if (images.length === 0) images.push(thumbnail);

  const description = asString(value.description, 4000) ?? "";
  const featured = value.featured === true;

  const slugSource = typeof value.slug === "string" ? value.slug : "";
  const slug = slugSource.trim() ? slugify(slugSource).slice(0, 150) : undefined;

  const common = {
    name,
    brand: value.brand,
    price,
    originalPrice,
    thumbnail,
    images,
    description,
    status,
    featured,
    stock,
    slug,
  };

  if (category === "aksesoris") {
    if (!isAccessoryType(value.accessoryType)) {
      return { ok: false, error: "Jenis aksesoris tidak valid." };
    }

    const compatibleWith = parseStringList(value.compatibleWith, 30);

    return {
      ok: true,
      value: {
        ...common,
        category,
        accessoryType: value.accessoryType,
        compatibleWith:
          compatibleWith.length > 0 ? compatibleWith : undefined,
      },
    };
  }

  const specs = parseSpecs(value.specs);
  if (!specs) {
    return {
      ok: false,
      error: "Spesifikasi RAM dan penyimpanan wajib diisi dengan benar.",
    };
  }

  const warranty = parseWarranty(value.warranty);
  if (!warranty) {
    return { ok: false, error: "Data garansi tidak valid." };
  }

  const color = asString(value.color, 64) || "Original";

  if (category === "handphone-bekas") {
    const condition = parseCondition(value.condition);
    if (!condition) {
      return { ok: false, error: "Data kondisi HP bekas tidak valid." };
    }

    return {
      ok: true,
      value: {
        ...common,
        category,
        specs,
        warranty,
        color,
        condition,
        tradeInEligible: value.tradeInEligible === true,
      },
    };
  }

  return {
    ok: true,
    value: {
      ...common,
      category,
      specs,
      warranty,
      color,
    },
  };
}

export interface ProductPatch {
  price?: number;
  stock?: number;
  status?: ProductStatus;
}

export type ProductPatchResult =
  | { ok: true; value: ProductPatch }
  | { ok: false; error: string };

/** PATCH hanya dipakai untuk perubahan cepat harga, stok, dan status. */
export function parseProductPatch(value: unknown): ProductPatchResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Payload perubahan tidak valid." };
  }

  const patch: ProductPatch = {};

  if (value.price !== undefined) {
    const price = asInteger(value.price);
    if (price === null || price <= 0) {
      return { ok: false, error: "Harga harus bilangan bulat lebih dari 0." };
    }
    patch.price = price;
  }

  if (value.stock !== undefined) {
    const stock = asInteger(value.stock);
    if (stock === null || stock < 0 || stock > 1_000_000) {
      return { ok: false, error: "Stok harus bilangan bulat 0 atau lebih." };
    }
    patch.stock = stock;
  }

  if (value.status !== undefined) {
    if (!isProductStatus(value.status)) {
      return { ok: false, error: "Status produk tidak valid." };
    }
    patch.status = value.status;
  }

  if (
    patch.price === undefined &&
    patch.stock === undefined &&
    patch.status === undefined
  ) {
    return {
      ok: false,
      error: "Tidak ada field harga, stok, atau status yang diubah.",
    };
  }

  return { ok: true, value: patch };
}
