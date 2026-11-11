"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ProductQuickView } from "@/components/catalog/product-quick-view";
import { useProducts } from "@/hooks/use-products";
import type { Product } from "@/types";

interface QuickViewContextValue {
  openQuickView: (product: Product) => void;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const products = useProducts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Simpan id, bukan snapshot produk, agar modal ikut ter-update saat admin
  // mengubah unit di tab lain selama quick view terbuka.
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedId) ?? null,
    [products, selectedId],
  );

  // Otomatis buka Quick View jika ada query ?product= dari link sitemap atau Google
  useEffect(() => {
    if (typeof window === "undefined" || products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const productParam = params.get("product");
    if (productParam) {
      const target = products.find(
        (p) => p.slug === productParam || p.id === productParam,
      );
      if (target) {
        requestAnimationFrame(() => {
          setSelectedId(target.id);
        });
      }
    }
  }, [products]);

  const openQuickView = useCallback((product: Product) => {
    setSelectedId(product.id);
  }, []);

  const closeQuickView = useCallback(() => {
    setSelectedId(null);
  }, []);

  const value = useMemo(() => ({ openQuickView }), [openQuickView]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      {selectedProduct && (
        <ProductQuickView
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={closeQuickView}
        />
      )}
    </QuickViewContext.Provider>
  );
}

export function useQuickView(): QuickViewContextValue {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error("useQuickView harus dipakai di dalam QuickViewProvider.");
  }
  return context;
}
