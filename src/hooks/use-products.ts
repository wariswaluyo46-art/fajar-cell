"use client";

import { useContext, useMemo, useSyncExternalStore } from "react";

import { InitialProductsContext } from "@/components/catalog/products-provider";
import {
  getProductsStateSnapshot,
  getServerProductsStateSnapshot,
  subscribeProducts,
  type ProductsState,
} from "@/lib/product-repository";
import type { Product } from "@/types";

/**
 * State katalog dari API Supabase, termasuk status loading/error.
 *
 * - SSR/hydration memakai `initialProducts` yang disuntikkan Server Component
 *   lewat `ProductsProvider` (HTML tetap SEO-friendly tanpa duplikasi JSON di bundle).
 * - Setelah hydration, satu watcher bersama mengambil data dari `/api/products`
 *   dan menyinkronkan ulang lewat BroadcastChannel, fokus tab, serta polling.
 */
export function useProductsState(): ProductsState {
  const initialProducts = useContext(InitialProductsContext);
  const state = useSyncExternalStore(
    subscribeProducts,
    getProductsStateSnapshot,
    getServerProductsStateSnapshot,
  );

  return useMemo(() => {
    if (!state.hasLoaded && initialProducts !== null) {
      return { ...state, products: initialProducts };
    }
    return state;
  }, [state, initialProducts]);
}

/** Versi ringkas untuk komponen yang hanya butuh daftar produk. */
export function useProducts(): Product[] {
  return useProductsState().products;
}
