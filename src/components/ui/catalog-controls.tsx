"use client";

import { Banknote, Compass, Search, SlidersHorizontal, X } from "lucide-react";
import { useId } from "react";

import {
  BUDGET_FILTER_OPTIONS,
  CATALOG_SORT_OPTIONS,
  NEED_FILTER_OPTIONS,
  type BudgetFilter,
  type CatalogSort,
  type NeedFilter,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

interface CatalogControlsProps {
  query: string;
  onQueryChange: (query: string) => void;
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  searchPlaceholder: string;
  budgetFilter?: BudgetFilter;
  onBudgetFilterChange?: (budget: BudgetFilter) => void;
  needFilter?: NeedFilter;
  onNeedFilterChange?: (need: NeedFilter) => void;
}

export function CatalogControls({
  query,
  onQueryChange,
  sort,
  onSortChange,
  searchPlaceholder,
  budgetFilter = "all",
  onBudgetFilterChange,
  needFilter = "all",
  onNeedFilterChange,
}: CatalogControlsProps) {
  const sortId = useId();

  return (
    <div className="flex flex-col gap-3.5 rounded-3xl border border-slate-200/90 bg-white/90 p-3.5 sm:p-4 shadow-sm backdrop-blur-md transition-shadow duration-300 hover:shadow-md">
      {/* 1. Baris Filter Kebutuhan Cepat (Smart Need-Based Filter untuk Segala Usia) */}
      {onNeedFilterChange && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-slate-800 uppercase">
              <Compass className="size-3.5 text-royal-600" aria-hidden="true" />
              Pilih Sesuai Kebutuhan Nyata
            </span>
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
              Klik salah satu untuk mempermudah pencarian
            </span>
          </div>

          <div
            className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Filter kebutuhan cepat"
          >
            {NEED_FILTER_OPTIONS.map((option) => {
              const active = needFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onNeedFilterChange(option.value)}
                  title={option.hint}
                  className={cn(
                    "group relative inline-flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:scale-95",
                    active
                      ? "bg-brand-gradient text-white shadow-md shadow-royal-600/30 scale-[1.02]"
                      : "border border-slate-200/80 bg-slate-50/90 text-slate-700 hover:border-royal-300 hover:bg-royal-50/50 hover:text-royal-800",
                  )}
                >
                  <span className="text-base">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Search Input & Sort Dropdown */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-11 sm:h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 text-sm text-slate-900 shadow-xs transition-all duration-200 outline-none placeholder:text-slate-400 focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Hapus pencarian"
              className="absolute top-1/2 right-2.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:scale-95 cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="ml-1 size-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <label htmlFor={sortId} className="sr-only">
            Urutkan produk
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as CatalogSort)}
            className="h-11 sm:h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm font-bold text-slate-700 shadow-xs transition-all duration-200 outline-none focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-500/10 sm:w-52 sm:flex-none cursor-pointer"
          >
            {CATALOG_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Baris Filter Budget Cepat */}
      {onBudgetFilterChange && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2.5 sm:pt-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase mr-1">
            <Banknote className="size-3.5 text-emerald-600" aria-hidden="true" />
            Rentang Budget:
          </span>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter rentang harga cepat">
            {BUDGET_FILTER_OPTIONS.map((option) => {
              const active = budgetFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onBudgetFilterChange(option.value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 active:scale-95",
                    active
                      ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 scale-105"
                      : "border border-slate-200/80 bg-slate-50/90 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-800",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
