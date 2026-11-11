"use client";

import { useSyncExternalStore } from "react";

import {
  getProductsSnapshot,
  getProductsStateSnapshot,
  getServerProductsSnapshot,
  getServerProductsStateSnapshot,
  subscribeProducts,
  type ProductsState,
} from "@/lib/product-repository";
import type { Product } from "@/types";

/**
 * State katalog dari API Supabase, termasuk status loading/error.
 *
 * - SSR/hydration memakai data seed dari JSON (HTML tetap SEO-friendly).
 * - Setelah hydration, satu watcher bersama mengambil data dari `/api/products`
 *   dan menyinkronkan ulang lewat BroadcastChannel, fokus tab, serta polling.
 */
export function useProductsState(): ProductsState {
  return useSyncExternalStore(
    subscribeProducts,
    getProductsStateSnapshot,
    getServerProductsStateSnapshot,
  );
}

/** Versi ringkas untuk komponen yang hanya butuh daftar produk. */
export function useProducts(): Product[] {
  return useSyncExternalStore(
    subscribeProducts,
    getProductsSnapshot,
    getServerProductsSnapshot,
  );
}
