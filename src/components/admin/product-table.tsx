"use client";

import {
  ImageIcon,
  Pencil,
  PackageSearch,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { ProductStatusToggle } from "@/components/admin/product-status-toggle";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void | Promise<void>;
  onCreate: () => void;
  isFiltered: boolean;
  pendingStatusId?: string | null;
}

const CATEGORY_STYLES: Record<Product["category"], string> = {
  "handphone-bekas": "bg-royal-50 text-royal-700",
  "handphone-baru": "bg-emerald-50 text-emerald-700",
  aksesoris: "bg-amber-50 text-amber-700",
};

function Thumbnail({ product }: { product: Product }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === product.thumbnail;

  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {failed ? (
        <span className="flex size-full items-center justify-center text-slate-400">
          <ImageIcon className="size-5" aria-hidden="true" />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.thumbnail}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(product.thumbnail)}
        />
      )}
      {product.featured && (
        <span
          className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-royal-700 text-white"
          title="Unit unggulan"
        >
          <Star className="size-2.5 fill-current" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

function stockClass(stock: number): string {
  if (stock <= 0) return "text-rose-600";
  if (stock <= 2) return "text-amber-600";
  return "text-slate-900";
}

function ProductIdentity({ product }: { product: Product }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Thumbnail product={product} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">
          {product.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">{product.brand}</span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              CATEGORY_STYLES[product.category],
            )}
          >
            {PRODUCT_CATEGORY_LABELS[product.category]}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
  isFiltered,
  pendingStatusId = null,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <PackageSearch className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-base font-semibold text-slate-900">
          {isFiltered ? "Tidak ada produk yang cocok" : "Belum ada produk"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          {isFiltered
            ? "Coba ubah kata kunci pencarian atau filter kategori/status."
            : "Tambahkan unit pertama untuk mulai mengelola stok konter."}
        </p>
        {!isFiltered && (
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-royal-700 px-4 text-sm font-semibold text-white transition hover:bg-royal-800"
          >
            Tambah produk
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Tabel: layar sedang ke atas */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <caption className="sr-only">
              Daftar produk dan stok Konter Fajar Cell
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <th scope="col" className="px-4 py-3">
                  Produk
                </th>
                <th scope="col" className="px-4 py-3">
                  Harga
                </th>
                <th scope="col" className="px-4 py-3">
                  Stok
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Diperbarui
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={cn(
                    "transition hover:bg-slate-50/70",
                    product.status === "sold-out" && "bg-slate-50/40",
                  )}
                >
                  <td className="max-w-[320px] px-4 py-3">
                    <ProductIdentity product={product} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatRupiah(product.price)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-[11px] text-slate-500 line-through">
                        {formatRupiah(product.originalPrice)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        stockClass(product.stock),
                      )}
                    >
                      {product.stock}
                    </span>
                    <span className="ml-1 text-xs text-slate-500">unit</span>
                  </td>
                  <td className="px-4 py-3">
                    <ProductStatusToggle
                      product={product}
                      onToggle={onToggleStatus}
                      isPending={pendingStatusId === product.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">
                    {formatDate(product.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        title="Edit produk"
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-royal-200 hover:bg-royal-50 hover:text-royal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        aria-label={`Hapus ${product.name}`}
                        title="Hapus produk"
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kartu: layar kecil */}
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <article
            key={product.id}
            className={cn(
              "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
              product.status === "sold-out" && "bg-slate-50/60",
            )}
          >
            <ProductIdentity product={product} />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-base font-bold text-royal-700">
                  {formatRupiah(product.price)}
                </p>
                {product.originalPrice && (
                  <p className="text-[11px] text-slate-500 line-through">
                    {formatRupiah(product.originalPrice)}
                  </p>
                )}
              </div>
              <ProductStatusToggle
                product={product}
                onToggle={onToggleStatus}
                isPending={pendingStatusId === product.id}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <p className="text-xs text-slate-500">
                Stok{" "}
                <span
                  className={cn(
                    "font-bold",
                    stockClass(product.stock),
                  )}
                >
                  {product.stock} unit
                </span>
                <span className="mx-1.5 text-slate-300" aria-hidden="true">
                  •
                </span>
                {formatDate(product.updatedAt)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  aria-label={`Edit ${product.name}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition hover:border-royal-200 hover:bg-royal-50 hover:text-royal-700"
                >
                  <Pencil className="size-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  aria-label={`Hapus ${product.name}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
