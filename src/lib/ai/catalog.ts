import "server-only";

import {
  ACCESSORY_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
  SITE,
} from "@/lib/constants";
import { products as seedProducts } from "@/lib/products";
import { listProducts } from "@/lib/products-db";
import { defaultStoreSettings } from "@/lib/store";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/types";

const CACHE_TTL_MS = 30_000;
const MAX_PRODUCTS_IN_PROMPT = 80;

export interface CatalogSnapshot {
  products: Product[];
  source: "database" | "seed";
}

let cachedSnapshot: { at: number; snapshot: CatalogSnapshot } | null = null;

/**
 * Katalog ringkas untuk prompt AI. Database tetap menjadi sumber utama, dengan
 * fallback ke seed JSON bila Supabase belum dikonfigurasi atau sedang down.
 * Cache 30 detik mencegah setiap pesan chat menembak database.
 */
export async function getCatalogSnapshot(): Promise<CatalogSnapshot> {
  if (
    cachedSnapshot &&
    Date.now() - cachedSnapshot.at < CACHE_TTL_MS
  ) {
    return cachedSnapshot.snapshot;
  }

  let snapshot: CatalogSnapshot;

  try {
    const rows = await listProducts();
    snapshot = {
      products: rows.length > 0 ? rows : [...seedProducts],
      source: rows.length > 0 ? "database" : "seed",
    };
  } catch (error) {
    console.warn(
      "[ai] katalog database tidak tersedia, memakai data seed:",
      error instanceof Error ? error.message : String(error),
    );
    snapshot = { products: [...seedProducts], source: "seed" };
  }

  cachedSnapshot = { at: Date.now(), snapshot };
  return snapshot;
}

function describeProduct(product: Product): string {
  const fields = [
    `[${PRODUCT_CATEGORY_LABELS[product.category]}] ${product.name}`,
    product.brand,
    formatRupiah(product.price),
    product.status === "ready" ? "Ready Stock" : "Sold Out",
  ];

  if (product.stock > 0 && product.status === "ready") {
    fields.push(`stok ${product.stock}`);
  }

  if (product.category === "aksesoris") {
    fields.push(
      `jenis ${ACCESSORY_TYPE_LABELS[product.accessoryType]}`,
    );
    if (product.compatibleWith && product.compatibleWith.length > 0) {
      fields.push(`kompatibel ${product.compatibleWith.join(", ")}`);
    }
  } else {
    const specs = [`${product.specs.ram}GB RAM`, `${product.specs.storage}GB`];
    if (product.specs.chipset) specs.push(product.specs.chipset);
    if (product.specs.screen) specs.push(`layar ${product.specs.screen}`);
    if (product.specs.camera) specs.push(`kamera ${product.specs.camera}`);
    if (product.specs.battery) specs.push(`baterai ${product.specs.battery} mAh`);
    fields.push(specs.join(" / "));
    fields.push(`warna ${product.color}`);

    if (product.category === "handphone-bekas") {
      const condition = product.condition;
      const conditionParts = [
        condition.grade,
        condition.label,
        `minus ${condition.minusCount}`,
      ];
      if (condition.batteryHealth !== undefined) {
        conditionParts.push(`baterai ${condition.batteryHealth}%`);
      }
      if (condition.completeness.length > 0) {
        conditionParts.push(`kelengkapan ${condition.completeness.join(", ")}`);
      }
      fields.push(`kondisi ${conditionParts.join(", ")}`);
    }

    fields.push(
      product.warranty.active
        ? `garansi ${product.warranty.durationDays} hari`
        : "tanpa garansi",
    );
  }

  return `- ${fields.join(" | ")}`;
}

export function buildCatalogText(products: Product[]): string {
  const shown = products.slice(0, MAX_PRODUCTS_IN_PROMPT);
  const lines = shown.map(describeProduct);

  if (products.length > shown.length) {
    lines.push(
      `- ...dan ${products.length - shown.length} produk lain yang tidak ditampilkan.`,
    );
  }

  return lines.length > 0 ? lines.join("\n") : "(katalog sedang kosong)";
}

export function buildStoreText(): string {
  const store = defaultStoreSettings;
  const hours = store.operationalHours
    .map((hour) =>
      hour.closed
        ? `${hour.day}: tutup`
        : `${hour.day}: ${hour.open}-${hour.close}`,
    )
    .join(", ");

  return [
    `Nama toko: ${SITE.name}`,
    `Alamat: ${store.address}`,
    `WhatsApp admin: ${SITE.whatsappNumber} (https://wa.me/${SITE.whatsappNumber})`,
    `Jam operasional: ${hours}`,
    `Area COD: ${store.codAreas.join(", ")}`,
    `Instagram: ${store.instagram ?? "-"}`,
  ].join("\n");
}
