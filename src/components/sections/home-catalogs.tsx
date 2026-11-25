"use client";

import { ArrowUpRight, Search, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { useQuickView } from "@/components/catalog/quick-view-provider";
import { AccessoryCatalog } from "@/components/sections/accessory-catalog";
import { NewPhoneCatalog } from "@/components/sections/new-phone-catalog";
import { UsedPhoneCatalog } from "@/components/sections/used-phone-catalog";
import { Container } from "@/components/ui/container";
import { useProducts } from "@/hooks/use-products";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { getProductAvailabilityInfo } from "@/lib/order-constants";
import { isAccessory, isNewPhone, isUsedPhone } from "@/lib/product-guards";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/types";

function matchesGlobalQuery(product: Product, rawQuery: string): boolean {
  const tokens = rawQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return false;

  const extra =
    product.category === "aksesoris"
      ? `${product.accessoryType} ${(product.compatibleWith ?? []).join(" ")}`
      : `${product.specs.ram}gb ${product.specs.storage}gb ${product.specs.chipset ?? ""} ${product.specs.screen ?? ""} ${product.specs.camera ?? ""} ${product.color}`;

  const haystack = `${product.name} ${product.brand} ${PRODUCT_CATEGORY_LABELS[product.category]} ${product.slug} ${extra}`.toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/**
 * Menghubungkan katalog pembeli dengan API produk Supabase serta menyediakan
 * Instant Search Bar lintas seluruh kategori.
 */
export function HomeCatalogs() {
  const products = useProducts();
  const { openQuickView } = useQuickView();
  const { addToCart, getItemQuantity } = useCart();
  const [globalQuery, setGlobalQuery] = useState("");

  const usedPhones = useMemo(() => products.filter(isUsedPhone), [products]);
  const newPhones = useMemo(() => products.filter(isNewPhone), [products]);
  const accessories = useMemo(() => products.filter(isAccessory), [products]);

  const trimmedQuery = globalQuery.trim();
  const searchResults = useMemo(() => {
    if (trimmedQuery === "") return [];
    return products
      .filter((product) => matchesGlobalQuery(product, trimmedQuery))
      .slice(0, 12);
  }, [products, trimmedQuery]);

  return (
    <>
      {/* Global Instant Search Bar Lintas Katalog */}
      <section
        aria-label="Pencarian cepat katalog"
        className="border-b border-slate-200/70 bg-white/95 py-6 sm:py-8"
      >
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-extrabold tracking-wider text-royal-700 uppercase">
                Cari Cepat di Semua Katalog
              </p>
              <p className="text-xs text-slate-500">
                {products.length} unit HP bekas, HP baru & aksesoris tersedia
              </p>
            </div>

            <div className="relative mt-2.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={globalQuery}
                onChange={(event) => setGlobalQuery(event.target.value)}
                placeholder="Ketik tipe HP, merek, RAM, chipset, atau aksesoris (mis. Samsung, POCO, 128GB, Charger)..."
                aria-label="Cari produk lintas katalog"
                className="h-12 sm:h-13 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-11 pl-11 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
              />
              {globalQuery !== "" && (
                <button
                  type="button"
                  onClick={() => setGlobalQuery("")}
                  aria-label="Hapus pencarian cepat"
                  className="absolute top-1/2 right-3 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {trimmedQuery !== "" && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-700">
                    Hasil pencarian untuk &ldquo;{trimmedQuery}&rdquo;:{" "}
                    <span className="text-royal-700">
                      {searchResults.length} produk
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setGlobalQuery("")}
                    className="text-xs font-bold text-royal-700 hover:underline cursor-pointer"
                  >
                    Tutup hasil
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <p className="py-4 text-center text-xs font-medium text-slate-500">
                    Belum ada produk yang cocok dengan kata kunci tersebut. Coba merek lain seperti Samsung, Xiaomi, OPPO, atau Infinix.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.map((product) => {
                      const cartQty = getItemQuantity(product.id);
                      const avail = getProductAvailabilityInfo(product, cartQty);
                      return (
                        <div
                          key={product.id}
                          className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs transition hover:border-royal-300"
                        >
                          <div className="flex items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.thumbnail}
                              alt={product.name}
                              className="size-16 shrink-0 rounded-xl border border-slate-100 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] font-extrabold tracking-wider text-royal-700 uppercase">
                                {PRODUCT_CATEGORY_LABELS[product.category]} •{" "}
                                {product.brand}
                              </span>
                              <button
                                type="button"
                                onClick={() => openQuickView(product)}
                                className="mt-0.5 block text-left text-xs font-extrabold text-slate-900 line-clamp-2 hover:text-royal-700 cursor-pointer"
                              >
                                {product.name}
                              </button>
                              <p className="mt-1 text-sm font-black text-royal-700">
                                {formatRupiah(product.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5">
                            <button
                              type="button"
                              disabled={!avail.canAddToCart}
                              onClick={() => {
                                void addToCart(product, 1);
                              }}
                              className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-brand-gradient px-2.5 py-1.5 text-[11px] font-extrabold text-white disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <ShoppingCart className="size-3 shrink-0" aria-hidden="true" />
                              <span>
                                {avail.isSoldOut
                                  ? "Habis"
                                  : avail.isHeldByOthers
                                    ? "Dipesan"
                                    : "+ Keranjang"}
                              </span>
                            </button>

                            <Link
                              href={`/produk/${encodeURIComponent(product.slug)}`}
                              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-royal-50 hover:text-royal-700"
                            >
                              <span>Detail</span>
                              <ArrowUpRight className="size-3 shrink-0" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </section>

      <UsedPhoneCatalog products={usedPhones} />
      <NewPhoneCatalog products={newPhones} />
      <AccessoryCatalog products={accessories} />
    </>
  );
}
