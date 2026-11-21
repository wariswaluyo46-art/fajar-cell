"use client";

import { createContext, type ReactNode } from "react";

import type { Product } from "@/types";

export const InitialProductsContext = createContext<Product[] | null>(null);

export function ProductsProvider({
  initialProducts,
  children,
}: {
  initialProducts: Product[];
  children: ReactNode;
}) {
  return (
    <InitialProductsContext.Provider value={initialProducts}>
      {children}
    </InitialProductsContext.Provider>
  );
}
