"use client";

import { AccessoryCatalog } from "@/components/sections/accessory-catalog";
import { NewPhoneCatalog } from "@/components/sections/new-phone-catalog";
import { UsedPhoneCatalog } from "@/components/sections/used-phone-catalog";
import { useProducts } from "@/hooks/use-products";
import { isAccessory, isNewPhone, isUsedPhone } from "@/lib/products";

/**
 * Menghubungkan katalog pembeli dengan API produk Supabase.
 *
 * Server tetap merender data seed (SEO), lalu setelah hydration daftar produk
 * diganti dengan data terbaru dari `/api/products`.
 */
export function HomeCatalogs() {
  const products = useProducts();
  const usedPhones = products.filter(isUsedPhone);
  const newPhones = products.filter(isNewPhone);
  const accessories = products.filter(isAccessory);

  return (
    <>
      <UsedPhoneCatalog products={usedPhones} />
      <NewPhoneCatalog products={newPhones} />
      <AccessoryCatalog products={accessories} />
    </>
  );
}
