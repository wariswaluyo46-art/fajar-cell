import { randomUUID } from "node:crypto";

import type { PostgrestError } from "@supabase/supabase-js";

import type {
  PhoneSpecs,
  Product,
  ProductCategory,
  ProductInput,
  UsedCondition,
  Warranty,
} from "@/types";

import {
  isAccessoryType,
  isBrand,
  isProductCategory,
  isProductStatus,
  type ProductPatch,
} from "./product-input";
import { getFallbackThumbnail, isValidImageSource } from "./product-images";
import { products as seedProducts } from "./products";
import { getSupabaseAdmin } from "./supabase";
import { slugify } from "./utils";

const TABLE = "products";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number | string;
  original_price: number | string | null;
  stock: number | string;
  status: string;
  image_url: string;
  images: unknown;
  description: string;
  featured: boolean | number | string;
  color: string | null;
  trade_in_eligible: boolean | number | string;
  accessory_type: string | null;
  compatible_with: unknown;
  condition: unknown;
  warranty: unknown;
  specs: unknown;
  created_at: string;
  updated_at: string;
}

type PersistedProduct = Product & { slug: string };

function throwIfError(error: PostgrestError | null, action: string): void {
  if (!error) return;

  console.error(`Supabase gagal ${action}:`, error);
  throw new Error(`Supabase gagal ${action}: ${error.message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** PostgREST mengembalikan jsonb sebagai objek, tetapi string JSON tetap didukung. */
function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value ?? null;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toIsoDate(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Tanggal produk tidak valid.");
  }

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Tanggal produk tidak valid.");
  }

  return date.toISOString();
}

function readStringArray(value: unknown): string[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

function readSpecs(value: unknown): PhoneSpecs | null {
  const parsed = parseJson(value);
  if (!isRecord(parsed)) return null;

  const ram = toNumber(parsed.ram);
  const storage = toNumber(parsed.storage);
  if (ram <= 0 || storage <= 0) return null;

  const specs: PhoneSpecs = { ram, storage };

  if (typeof parsed.chipset === "string" && parsed.chipset !== "") {
    specs.chipset = parsed.chipset;
  }
  if (typeof parsed.screen === "string" && parsed.screen !== "") {
    specs.screen = parsed.screen;
  }
  if (typeof parsed.camera === "string" && parsed.camera !== "") {
    specs.camera = parsed.camera;
  }

  const battery = toNumber(parsed.battery);
  if (battery > 0) specs.battery = battery;

  return specs;
}

function readWarranty(value: unknown): Warranty | null {
  const parsed = parseJson(value);
  if (
    !isRecord(parsed) ||
    typeof parsed.active !== "boolean" ||
    typeof parsed.description !== "string"
  ) {
    return null;
  }

  return {
    active: parsed.active,
    durationDays: toNumber(parsed.durationDays),
    description: parsed.description,
  };
}

function readCondition(value: unknown): UsedCondition | null {
  const parsed = parseJson(value);
  if (!isRecord(parsed)) return null;

  const grade = typeof parsed.grade === "string" ? parsed.grade : "";
  const label = typeof parsed.label === "string" ? parsed.label : "";
  const completeness = readStringArray(parsed.completeness);

  if (grade === "" || label === "" || completeness.length === 0) return null;

  const condition: UsedCondition = {
    grade,
    label,
    minusCount: toNumber(parsed.minusCount),
    completeness,
  };

  if (parsed.batteryHealth !== undefined && parsed.batteryHealth !== null) {
    condition.batteryHealth = toNumber(parsed.batteryHealth);
  }

  return condition;
}

function mapProductRow(row: ProductRow): Product {
  if (!isProductCategory(row.category)) {
    throw new Error(`Kategori produk tidak dikenal: ${row.category}`);
  }
  if (!isProductStatus(row.status)) {
    throw new Error(`Status produk tidak dikenal: ${row.status}`);
  }
  if (!isBrand(row.brand)) {
    throw new Error(`Merek produk tidak dikenal: ${row.brand}`);
  }

  const thumbnail =
    typeof row.image_url === "string" && isValidImageSource(row.image_url)
      ? row.image_url.trim()
      : getFallbackThumbnail(row.category);
  const images = readStringArray(row.images).filter(isValidImageSource);
  if (images.length === 0) images.push(thumbnail);

  const base = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    price: toNumber(row.price),
    originalPrice:
      row.original_price === null ? undefined : toNumber(row.original_price),
    thumbnail,
    images,
    description: row.description ?? "",
    status: row.status,
    featured: toBoolean(row.featured),
    stock: toNumber(row.stock),
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  };

  if (row.category === "aksesoris") {
    const accessoryType = isAccessoryType(row.accessory_type)
      ? row.accessory_type
      : "lainnya";
    const compatibleWith = readStringArray(row.compatible_with);

    return {
      ...base,
      category: row.category,
      accessoryType,
      compatibleWith:
        compatibleWith.length > 0 ? compatibleWith : undefined,
    };
  }

  const specs = readSpecs(row.specs);
  const warranty = readWarranty(row.warranty);
  if (!specs || !warranty) {
    throw new Error(`Data spesifikasi/garansi ${row.id} tidak lengkap.`);
  }

  const color = row.color?.trim() || "Original";

  if (row.category === "handphone-bekas") {
    const condition = readCondition(row.condition);
    if (!condition) {
      throw new Error(`Data kondisi ${row.id} tidak lengkap.`);
    }

    return {
      ...base,
      category: row.category,
      specs,
      warranty,
      condition,
      color,
      tradeInEligible: toBoolean(row.trade_in_eligible),
    };
  }

  return {
    ...base,
    category: row.category,
    specs,
    warranty,
    color,
  };
}

function productFields(product: PersistedProduct): Record<string, unknown> {
  const isAccessory = product.category === "aksesoris";
  const isUsed = product.category === "handphone-bekas";

  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    price: product.price,
    original_price: product.originalPrice ?? null,
    stock: product.stock,
    status: product.status,
    image_url: product.thumbnail,
    images: product.images,
    description: product.description,
    featured: product.featured,
    color: "color" in product ? product.color : null,
    trade_in_eligible: isUsed ? product.tradeInEligible : false,
    accessory_type: isAccessory ? product.accessoryType : null,
    compatible_with: isAccessory ? product.compatibleWith ?? [] : null,
    condition: isUsed ? product.condition : null,
    warranty: isAccessory ? null : product.warranty,
    specs: isAccessory ? null : product.specs,
  };
}

function productRecord(product: PersistedProduct): Record<string, unknown> {
  return {
    id: product.id,
    ...productFields(product),
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}

function createId(category: ProductCategory): string {
  const prefix: Record<ProductCategory, string> = {
    "handphone-bekas": "hp-bekas",
    "handphone-baru": "hp-baru",
    aksesoris: "aksesoris",
  };

  return `${prefix[category]}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  let query = getSupabaseAdmin()
    .from(TABLE)
    .select("id")
    .eq("slug", slug);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);
  throwIfError(error, "memeriksa slug produk");

  return (data?.length ?? 0) > 0;
}

async function createUniqueSlug(
  source: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(source).slice(0, 140) || "produk";
  let slug = base;
  let counter = 2;

  while (await slugExists(slug, excludeId)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

function toProduct(row: unknown): Product {
  if (!row) {
    throw new Error("Supabase tidak mengembalikan data produk.");
  }

  return mapProductRow(row as ProductRow);
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  throwIfError(error, "memuat produk");

  return ((data ?? []) as ProductRow[]).map(mapProductRow);
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError(error, "memuat produk");

  return data ? mapProductRow(data as ProductRow) : null;
}

export async function createProductRecord(
  input: ProductInput,
): Promise<Product> {
  const now = new Date().toISOString();
  const slug = await createUniqueSlug(input.slug || input.name);
  const product = {
    ...input,
    id: createId(input.category),
    slug,
    createdAt: now,
    updatedAt: now,
  } as PersistedProduct;

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .insert(productRecord(product))
    .select("*")
    .single();

  throwIfError(error, "menyimpan produk");

  return toProduct(data);
}

export async function updateProductRecord(
  id: string,
  input: ProductInput,
): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const slug = await createUniqueSlug(input.slug || input.name, id);
  const product = {
    ...input,
    id,
    slug,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  } as PersistedProduct;

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .update(productFields(product))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "memperbarui produk");

  return data ? mapProductRow(data as ProductRow) : null;
}

export async function patchProductRecord(
  id: string,
  patch: ProductPatch,
): Promise<Product | null> {
  const existing = await getProductById(id);
  if (!existing) return null;

  const price = patch.price ?? existing.price;
  const status = patch.status ?? existing.status;
  let stock = patch.stock ?? existing.stock;

  if (status === "ready" && stock < 1) {
    stock = 1;
  }

  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .update({
      price,
      stock,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  throwIfError(error, "memperbarui stok produk");

  return data ? mapProductRow(data as ProductRow) : null;
}

export async function deleteProductRecord(id: string): Promise<boolean> {
  const { data, error } = await getSupabaseAdmin()
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("id");

  throwIfError(error, "menghapus produk");

  return (data?.length ?? 0) > 0;
}

/**
 * Reset berjalan berurutan lewat PostgREST (tanpa transaksi lintas request).
 * Seed di-upsert lebih dulu, baru produk di luar daftar seed dihapus, sehingga
 * kegagalan di tengah proses tidak mengosongkan katalog.
 */
export async function resetProductRecords(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  const seedIds = new Set(seedProducts.map((product) => product.id));
  const seedSlugs = new Set(seedProducts.map((product) => product.slug));

  const { data: existing, error: readError } = await supabase
    .from(TABLE)
    .select("id, slug");
  throwIfError(readError, "memeriksa data lama");

  const rows = (existing ?? []) as Array<{ id: string; slug: string }>;
  const conflictingIds = rows
    .filter((row) => !seedIds.has(row.id) && seedSlugs.has(row.slug))
    .map((row) => row.id);

  if (conflictingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .in("id", conflictingIds);
    throwIfError(deleteError, "membersihkan slug yang bentrok");
  }

  const seedRows = seedProducts.map((seed) =>
    productRecord(seed as PersistedProduct),
  );
  const { error: upsertError } = await supabase
    .from(TABLE)
    .upsert(seedRows, { onConflict: "id" });
  throwIfError(upsertError, "mengembalikan data contoh");

  const extraIds = rows
    .filter((row) => !seedIds.has(row.id))
    .map((row) => row.id);

  if (extraIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .in("id", extraIds);
    throwIfError(deleteError, "menghapus produk tambahan");
  }

  return listProducts();
}
