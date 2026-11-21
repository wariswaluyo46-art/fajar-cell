import type {
  AccessoryProduct,
  NewPhoneProduct,
  Product,
  UsedPhoneProduct,
} from "@/types";

import { PRODUCT_CATEGORY_PATHS } from "./constants";

export function isUsedPhone(product: Product): product is UsedPhoneProduct {
  return product.category === "handphone-bekas";
}

export function isNewPhone(product: Product): product is NewPhoneProduct {
  return product.category === "handphone-baru";
}

export function isAccessory(product: Product): product is AccessoryProduct {
  return product.category === "aksesoris";
}

/** Path halaman detail produk sesuai kategorinya. */
export function getProductPath(product: Product): string {
  return `${PRODUCT_CATEGORY_PATHS[product.category]}/${product.slug}`;
}
