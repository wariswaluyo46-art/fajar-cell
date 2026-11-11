"use client";

import { Smartphone } from "lucide-react";
import { useMemo, useState } from "react";

import { CatalogControls } from "@/components/ui/catalog-controls";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/ui/product-card";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import {
  matchesBudget,
  matchesNeed,
  matchesProductQuery,
  sortProducts,
  type BudgetFilter,
  type CatalogSort,
  type NeedFilter,
} from "@/lib/catalog";
import { PHONE_BRANDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Brand, UsedPhoneProduct } from "@/types";

interface UsedPhoneCatalogProps {
  products: UsedPhoneProduct[];
}

type BrandFilter = Brand | "all";

export function UsedPhoneCatalog({ products }: UsedPhoneCatalogProps) {
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>("all");
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("all");
  const [needFilter, setNeedFilter] = useState<NeedFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("newest");

  const brands = useMemo(
    () => PHONE_BRANDS.filter((brand) => products.some((p) => p.brand === brand)),
    [products],
  );

  const searchMatched = useMemo(
    () => products.filter((product) => matchesProductQuery(product, query)),
    [products, query],
  );

  const brandCounts = useMemo(() => {
    const counts = new Map<Brand, number>();
    for (const product of searchMatched) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
    return counts;
  }, [searchMatched]);

  const filteredProducts = useMemo(() => {
    const byCriteria = searchMatched.filter((product) => {
      const matchBrand =
        selectedBrand === "all" || product.brand === selectedBrand;
      const matchBudget = matchesBudget(product.price, budgetFilter);
      const matchNeed = matchesNeed(product, needFilter);
      return matchBrand && matchBudget && matchNeed;
    });

    return sortProducts(byCriteria, sort);
  }, [searchMatched, selectedBrand, budgetFilter, needFilter, sort]);

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedBrand !== "all" ||
    budgetFilter !== "all" ||
    needFilter !== "all";

  function resetFilters() {
    setQuery("");
    setSelectedBrand("all");
    setBudgetFilter("all");
    setNeedFilter("all");
  }

  const emptyTitle = query.trim()
    ? "Produk tidak ditemukan"
    : selectedBrand === "all"
      ? "Belum ada unit tersedia"
      : `Belum ada unit ${selectedBrand}`;

  return (
    <section
      id="hp-bekas"
      className="relative scroll-mt-24 sm:scroll-mt-28 border-y border-slate-100 bg-[#F8FAFC]/50 py-16 sm:py-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-0 size-72 rounded-full bg-royal-100/40 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-0 size-72 rounded-full bg-cyan-100/30 blur-3xl"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Katalog Unggulan"
            title="HP Bekas Pilihan, Sudah Dicek Teknisi"
            description="Setiap unit dicek fungsi dan kelengkapannya. Cari unit favoritmu, lalu tanya langsung via WhatsApp."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-royal-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs">
                <span className="size-2 rounded-full bg-royal-600 animate-pulse-dot" aria-hidden="true" />
                <span className="font-extrabold text-royal-700">
                  {products.length} unit
                </span>{" "}
                siap dilihat
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
            needFilter={needFilter}
            onNeedFilterChange={setNeedFilter}
            budgetFilter={budgetFilter}
            onBudgetFilterChange={setBudgetFilter}
            searchPlaceholder="Cari HP bekas berdasarkan nama atau merek..."
          />
        </Reveal>

        <Reveal delay={120} className="mt-5">
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter merek HP bekas"
          >
            <button
              type="button"
              onClick={() => setSelectedBrand("all")}
              aria-pressed={selectedBrand === "all"}
              className={cn(
                "shrink-0 rounded-full border px-4.5 py-2 text-sm font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:scale-95 cursor-pointer",
                selectedBrand === "all"
                  ? "border-transparent bg-brand-gradient text-white shadow-md shadow-royal-600/30"
                  : "border-slate-200/80 bg-white/90 text-slate-600 hover:border-royal-300 hover:text-royal-700 hover:bg-royal-50/50 backdrop-blur-xs",
              )}
            >
              Semua
              <span
                className={cn(
                  "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold transition-colors",
                  selectedBrand === "all"
                    ? "bg-white/25 text-white"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {searchMatched.length}
              </span>
            </button>

            {brands.map((brand) => {
              const active = selectedBrand === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-full border px-4.5 py-2 text-sm font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:scale-95 cursor-pointer",
                    active
                      ? "border-transparent bg-brand-gradient text-white shadow-md shadow-royal-600/30"
                      : "border-slate-200/80 bg-white/90 text-slate-600 hover:border-royal-300 hover:text-royal-700 hover:bg-royal-50/50 backdrop-blur-xs",
                  )}
                >
                  {brand}
                  <span
                    className={cn(
                      "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold transition-colors",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {brandCounts.get(brand) ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <p
          className="mt-4 text-sm font-semibold text-slate-500"
          aria-live="polite"
        >
          Menampilkan{" "}
          <span className="font-extrabold text-slate-900">
            {filteredProducts.length}
          </span>{" "}
          dari {products.length} unit
          {selectedBrand === "all" ? "" : ` merek ${selectedBrand}`}
        </p>

        {filteredProducts.length > 0 ? (
          <Reveal delay={160}>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Reveal>
        ) : (
          <Reveal delay={160}>
            <div className="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-xs sm:py-16">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-50 to-cyan-50 text-royal-600 shadow-inner">
                <Smartphone className="size-7" aria-hidden="true" />
              </span>
              <p className="mt-4 text-lg font-bold text-slate-900">
                {emptyTitle}
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                Stok berganti setiap hari. Coba kata kunci lain atau tanyakan
                unit yang kamu cari lewat WhatsApp.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-brand-gradient px-5 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition-all duration-300 hover:shadow-lg hover:shadow-royal-600/35 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 cursor-pointer"
                >
                  Reset pencarian & filter
                </button>
              )}
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
