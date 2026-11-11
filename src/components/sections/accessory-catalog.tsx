"use client";

import { Cable, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

import { AccessoryCard } from "@/components/ui/accessory-card";
import { CatalogControls } from "@/components/ui/catalog-controls";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  matchesProductQuery,
  sortProducts,
  type CatalogSort,
} from "@/lib/catalog";
import type { AccessoryProduct } from "@/types";

interface AccessoryCatalogProps {
  products: AccessoryProduct[];
}

export function AccessoryCatalog({ products }: AccessoryCatalogProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("newest");

  const filteredProducts = useMemo(
    () =>
      sortProducts(
        products.filter((product) => matchesProductQuery(product, query)),
        sort,
      ),
    [products, query, sort],
  );

  return (
    <section
      id="aksesoris"
      className="relative scroll-mt-24 sm:scroll-mt-28 overflow-hidden border-t border-slate-100 bg-[#F8FAFC]/60 py-16 sm:py-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 right-10 size-80 rounded-full bg-royal-100/30 blur-3xl"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Aksesoris"
            title="Aksesoris Original & Bergaransi"
            description="Charger, TWS, powerbank, hingga tempered glass. Semua produk dicek keasliannya dan bisa dipasang langsung di toko."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs">
                <Cable className="size-4 text-royal-600" aria-hidden="true" />
                Pasang gratis di toko
              </div>
            }
          />
        </Reveal>

        <Reveal delay={80} className="mt-8">
          <CatalogControls
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            searchPlaceholder="Cari aksesoris berdasarkan nama atau jenis..."
          />
        </Reveal>

        <p
          className="mt-4 text-sm font-semibold text-slate-500"
          aria-live="polite"
        >
          Menampilkan{" "}
          <span className="font-extrabold text-slate-900">
            {filteredProducts.length}
          </span>{" "}
          dari {products.length} aksesoris
        </p>

        {filteredProducts.length > 0 ? (
          <Reveal delay={140}>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <AccessoryCard key={product.id} product={product} />
              ))}
            </div>
          </Reveal>
        ) : (
          <Reveal delay={140}>
            <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-xs sm:py-16">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-50 to-cyan-50 text-royal-600 shadow-inner">
                <SearchX className="size-7" aria-hidden="true" />
              </span>
              <p className="mt-4 text-lg font-bold text-slate-900">
                Aksesoris tidak ditemukan
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                Coba kata kunci lain, atau tanyakan produk yang kamu butuhkan
                langsung ke admin lewat WhatsApp.
              </p>
              {query.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition-all duration-300 hover:shadow-lg hover:shadow-royal-600/35 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 cursor-pointer"
                >
                  Hapus pencarian
                </button>
              )}
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
