"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";

import { PRODUCT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductStatusToggleProps {
  product: Product;
  onToggle: (product: Product) => void | Promise<void>;
  isPending?: boolean;
  className?: string;
}

/** Tombol status: satu klik untuk berpindah Ready <-> Sold Out. */
export function ProductStatusToggle({
  product,
  onToggle,
  isPending = false,
  className,
}: ProductStatusToggleProps) {
  const isReady = product.status === "ready";
  const nextLabel = PRODUCT_STATUS_LABELS[isReady ? "sold-out" : "ready"];

  return (
    <button
      type="button"
      onClick={() => {
        void onToggle(product);
      }}
      disabled={isPending}
      aria-busy={isPending}
      title={`Ubah status menjadi ${nextLabel}`}
      aria-label={`${product.name}: status ${PRODUCT_STATUS_LABELS[product.status]}, ubah menjadi ${nextLabel}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-wait disabled:opacity-70",
        isReady
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isReady ? "bg-emerald-600" : "bg-rose-600",
        )}
        aria-hidden="true"
      />
      {PRODUCT_STATUS_LABELS[product.status]}
      {isPending ? (
        <LoaderCircle
          className="size-3 animate-spin opacity-70"
          aria-hidden="true"
        />
      ) : (
        <RefreshCw
          className="size-3 opacity-50 transition group-hover:opacity-100"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
