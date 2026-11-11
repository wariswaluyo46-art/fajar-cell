import type {
  AccessoryProduct,
  Brand,
  NewPhoneProduct,
  Product,
  ProductCategory,
  UsedPhoneProduct,
} from "@/types";
import { PRODUCT_CATEGORY_PATHS } from "./constants";

import productsJson from "@/data/products.json";

/**
 * Data seed dari src/data/products.json untuk HTML awal/SSR dan fallback.
 * JSON tidak membawa literal type, jadi di-cast sekali di sini. Setelah
 * hydration, sumber kebenaran katalog adalah database Supabase lewat API.
 */
const seedProducts = productsJson as unknown as Product[];

export const products: readonly Product[] = seedProducts;

export function isUsedPhone(product: Product): product is UsedPhoneProduct {
  return product.category === "handphone-bekas";
}

export function isNewPhone(product: Product): product is NewPhoneProduct {
  return product.category === "handphone-baru";
}

export function isAccessory(product: Product): product is AccessoryProduct {
  return product.category === "aksesoris";
}

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

/** Path halaman detail produk sesuai kategorinya. */
export function getProductPath(product: Product): string {
  return `${PRODUCT_CATEGORY_PATHS[product.category]}/${product.slug}`;
}
