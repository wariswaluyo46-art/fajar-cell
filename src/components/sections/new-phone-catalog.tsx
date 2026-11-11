"use client";

import { BadgeCheck, Smartphone } from "lucide-react";
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
import type { NewPhoneProduct } from "@/types";

interface NewPhoneCatalogProps {
  products: NewPhoneProduct[];
}

export function NewPhoneCatalog({ products }: NewPhoneCatalogProps) {
  const [budgetFilter, setBudgetFilter] = useState<BudgetFilter>("all");
  const [needFilter, setNeedFilter] = useState<NeedFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CatalogSort>("newest");

  const searchMatched = useMemo(
    () => products.filter((product) => matchesProductQuery(product, query)),
    [products, query],
  );

  const filteredProducts = useMemo(() => {
    const byCriteria = searchMatched.filter(
      (product) =>
        matchesBudget(product.price, budgetFilter) &&
        matchesNeed(product, needFilter),
    );
    return sortProducts(byCriteria, sort);
  }, [searchMatched, budgetFilter, needFilter, sort]);

  const hasActiveFilters =
    query.trim() !== "" || budgetFilter !== "all" || needFilter !== "all";

  function resetFilters() {
    setQuery("");
    setBudgetFilter("all");
    setNeedFilter("all");
  }

  return (
    <section
      id="hp-baru"
      className="relative scroll-mt-24 sm:scroll-mt-28 overflow-hidden bg-white py-16 sm:py-22"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 size-80 rounded-full bg-emerald-100/30 blur-3xl"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="HP Baru"
            title="Unit Baru Bergaransi Resmi"
            description="Stok baru dengan garansi resmi distributor. Tersedia cicilan dan tukar tambah."
            action={
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 text-xs font-bold text-emerald-800 shadow-xs">
                <BadgeCheck className="size-4 text-emerald-600" aria-hidden="true" />
                Garansi resmi 1 tahun
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
            searchPlaceholder="Cari HP baru berdasarkan nama atau merek..."
          />
        </Reveal>

        <Reveal delay={120} className="mt-9">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-royal-100 text-royal-700">
                <Smartphone className="size-7" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-bold text-slate-800">
                Tidak ada unit HP baru yang sesuai filter
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Coba ubah kata kunci pencarian atau rentang budget harga.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-royal-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-royal-800 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
