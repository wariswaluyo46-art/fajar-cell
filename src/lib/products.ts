import "server-only";

import type { Brand, Product, ProductCategory } from "@/types";

import productsJson from "@/data/products.json";
import {
  getProductPath,
  isAccessory,
  isNewPhone,
  isUsedPhone,
} from "./product-guards";

export { getProductPath, isAccessory, isNewPhone, isUsedPhone };

/**
 * Data seed sisi server dari src/data/products.json untuk SSR dan fallback DB.
 * Tidak diimpor langsung oleh komponen client agar bundle JS pembeli tetap ringan.
 */
const seedProducts = productsJson as unknown as Product[];

export const products: readonly Product[] = seedProducts;

export function getAllProducts(): Product[] {
  return [...seedProducts];
}

export function getProductBySlug(slug: string): Product | undefined {
  return seedProducts.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return seedProducts.filter((product) => product.category === category);
}

export function getFeaturedProducts(limit?: number): Product[] {
  const featured = seedProducts.filter((product) => product.featured);
  return typeof limit === "number" ? featured.slice(0, limit) : featured;
}

/** Merek unik yang benar-benar ada datanya, untuk tombol filter katalog. */
export function getAvailableBrands(category?: ProductCategory): Brand[] {
  const source = category ? getProductsByCategory(category) : seedProducts;
  const brands = new Set<Brand>();
  for (const product of source) {
    brands.add(product.brand);
  }
  return [...brands].sort((a, b) => a.localeCompare(b, "id"));
}
