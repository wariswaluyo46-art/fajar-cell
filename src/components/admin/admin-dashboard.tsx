"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminLogin } from "@/components/admin/admin-login";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ProductForm } from "@/components/admin/product-form";
import { ProductTable } from "@/components/admin/product-table";
import { useToast } from "@/components/ui/toast-provider";
import { useAdminSession } from "@/hooks/use-admin-session";
import { useProductsState } from "@/hooks/use-products";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
} from "@/lib/constants";
import {
  ProductApiError,
  createProduct,
  deleteProduct,
  refreshProducts,
  resetProducts,
  toggleProductStatus,
  updateProduct,
} from "@/lib/product-repository";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type {
  Product,
  ProductCategory,
  ProductInput,
  ProductStatus,
} from "@/types";

type FormState =
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | null;

type FilterValue<T extends string> = T | "all";

function AdminLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-100 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <LoaderCircle
          className="size-7 animate-spin text-royal-700"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-slate-600">
          Memeriksa sesi admin...
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
  tone: "royal" | "emerald" | "rose" | "amber";
}) {
  const tones = {
    royal: "bg-royal-50 text-royal-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  } as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-lg font-extrabold tracking-tight break-words text-slate-900 tabular-nums sm:text-2xl">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            tones[tone],
          )}
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function DashboardContent({
  loginAt,
  onLogout,
}: {
  loginAt: string | null;
  onLogout: () => void;
}) {
  const { products, isLoading, error: loadError } = useProductsState();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<FilterValue<ProductCategory>>("all");
  const [statusFilter, setStatusFilter] =
    useState<FilterValue<ProductStatus>>("all");
  const [formState, setFormState] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = useMemo(() => {
    const ready = products.filter(
      (product) => product.status === "ready",
    ).length;
    const sold = products.length - ready;
    const units = products.reduce((total, product) => total + product.stock, 0);
    const value = products
      .filter((product) => product.status === "ready")
      .reduce((total, product) => total + product.price * product.stock, 0);

    return { total: products.length, ready, sold, units, value };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter !== "all" && product.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }
      if (keyword === "") return true;

      return `${product.name} ${product.brand} ${product.slug}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [products, query, categoryFilter, statusFilter]);

  const isFiltered =
    query.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
  }

  function showApiError(error: unknown, title: string) {
    if (error instanceof ProductApiError && error.status === 401) {
      showToast({
        variant: "error",
        title: "Sesi admin berakhir",
        description: "Silakan masuk kembali dengan PIN admin untuk melanjutkan.",
      });
      onLogout();
      return;
    }

    showToast({
      variant: "error",
      title,
      description:
        error instanceof Error
          ? error.message
          : "Coba lagi beberapa saat.",
    });
  }

  async function handleSave(input: ProductInput): Promise<boolean> {
    const editing = formState?.mode === "edit";

    try {
      if (editing) {
        const updated = await updateProduct(formState.product.id, input);
        showToast({
          variant: "success",
          title: "Produk diperbarui",
          description: `"${updated.name}" berhasil diperbarui di database.`,
        });
      } else {
        const created = await createProduct(input);
        showToast({
          variant: "success",
          title: "Produk ditambahkan",
          description: `"${created.name}" berhasil ditambahkan ke database.`,
        });
      }

      setFormState(null);
      return true;
    } catch (error) {
      showApiError(
        error,
        editing ? "Gagal menyimpan perubahan" : "Gagal menambah produk",
      );
      return false;
    }
  }

  async function handleToggleStatus(product: Product): Promise<void> {
    if (pendingStatusId !== null) return;

    setPendingStatusId(product.id);

    try {
      const updated = await toggleProductStatus(product.id);
      showToast({
        variant: "success",
        title: "Stok Produk Diperbarui",
        description: `"${updated.name}" sekarang ${PRODUCT_STATUS_LABELS[updated.status]}.`,
      });
    } catch (error) {
      showApiError(error, "Status gagal diubah");
    } finally {
      setPendingStatusId(null);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!deleteTarget || isDeleting) return;

    const target = deleteTarget;
    setIsDeleting(true);

    try {
      await deleteProduct(target.id);
      showToast({
        variant: "success",
        title: "Produk dihapus",
        description: `"${target.name}" dihapus dari database dan katalog.`,
      });
      setDeleteTarget(null);
    } catch (error) {
      showApiError(error, "Gagal menghapus produk");
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleReset(): Promise<void> {
    if (isResetting) return;

    setIsResetting(true);

    try {
      await resetProducts();
      clearFilters();
      showToast({
        variant: "success",
        title: "Data produk direset",
        description: "Katalog kembali memakai data contoh awal di database.",
      });
      setResetOpen(false);
    } catch (error) {
      showApiError(error, "Gagal mereset data");
      setResetOpen(false);
    } finally {
      setIsResetting(false);
    }
  }

  async function handleRefresh(): Promise<void> {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshProducts();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-100 pb-16">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-royal-600 to-royal-800 text-sm font-extrabold tracking-tight text-white shadow-sm">
              FC
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                Admin Konter Fajar Cell
              </p>
              <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Dashboard stok terpusat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 lg:inline-flex">
              <span
                className="size-1.5 rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              Sesi aktif
            </span>
            <Link
              href="/"
              aria-label="Lihat halaman pembeli"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-royal-200 hover:bg-royal-50 hover:text-royal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Lihat Pembeli</span>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar dari dashboard"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-royal-100 bg-royal-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-royal-700 uppercase">
              <Store className="size-3.5" aria-hidden="true" />
              Manajemen Stok
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Kelola unit & status jual
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">
              Tambah, ubah, atau hapus produk. Klik badge status untuk
              memindahkan unit antara{" "}
              <strong className="font-semibold text-emerald-700">Ready</strong>{" "}
              dan{" "}
              <strong className="font-semibold text-rose-700">Sold Out</strong>.
            </p>
            {loginAt && (
              <p className="mt-1.5 text-xs text-slate-600">
                Login sejak {formatDate(loginAt)} • data tersimpan di Supabase
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset Data
            </button>
            <button
              type="button"
              onClick={() => setFormState({ mode: "create" })}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-royal-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah Produk
            </button>
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="leading-relaxed">
              <strong className="font-bold">Data database belum termuat.</strong>{" "}
              {loadError} Sementara ini tabel memakai data contoh.
            </p>
            <button
              type="button"
              onClick={() => {
                void handleRefresh();
              }}
              disabled={isRefreshing}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60 sm:self-auto"
            >
              {isRefreshing ? (
                <LoaderCircle
                  className="size-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RotateCcw className="size-3.5" aria-hidden="true" />
              )}
              Coba lagi
            </button>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Produk"
            value={String(stats.total)}
            hint={`${stats.units} unit di semua kategori`}
            icon={Package}
            tone="royal"
          />
          <StatCard
            label="Ready Stock"
            value={String(stats.ready)}
            hint="Siap ditawarkan ke pembeli"
            icon={CheckCircle2}
            tone="emerald"
          />
          <StatCard
            label="Sold Out"
            value={String(stats.sold)}
            hint="Sudah terjual / stok habis"
            icon={XCircle}
            tone="rose"
          />
          <StatCard
            label="Nilai Stok"
            value={formatRupiah(stats.value)}
            hint="Harga jual × stok berstatus Ready"
            icon={CircleDollarSign}
            tone="amber"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, merek, atau slug produk..."
                aria-label="Cari produk"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-3 pl-9 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              <label className="sr-only" htmlFor="filter-category">
                Filter kategori
              </label>
              <select
                id="filter-category"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as FilterValue<ProductCategory>,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition outline-none focus:border-royal-400 focus:ring-4 focus:ring-royal-100"
              >
                <option value="all">Semua kategori</option>
                {(
                  Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[]
                ).map((category) => (
                  <option key={category} value={category}>
                    {PRODUCT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>

              <label className="sr-only" htmlFor="filter-status">
                Filter status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as FilterValue<ProductStatus>,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition outline-none focus:border-royal-400 focus:ring-4 focus:ring-royal-100"
              >
                <option value="all">Semua status</option>
                <option value="ready">Ready Stock</option>
                <option value="sold-out">Sold Out</option>
              </select>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span>
                Menampilkan{" "}
                <strong className="font-bold text-slate-800">
                  {filteredProducts.length}
                </strong>{" "}
                dari {products.length} produk
              </span>
              {isLoading && (
                <span
                  className="inline-flex items-center gap-1 font-medium text-royal-700"
                  aria-live="polite"
                >
                  <LoaderCircle
                    className="size-3 animate-spin"
                    aria-hidden="true"
                  />
                  Memuat database...
                </span>
              )}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-semibold text-royal-700 hover:text-royal-800 hover:underline"
              >
                Hapus filter
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <ProductTable
            products={filteredProducts}
            onEdit={(product) =>
              setFormState({ mode: "edit", product })
            }
            onDelete={setDeleteTarget}
            onToggleStatus={handleToggleStatus}
            onCreate={() => setFormState({ mode: "create" })}
            isFiltered={isFiltered}
            pendingStatusId={pendingStatusId}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden="true" />
            Perubahan tersimpan ke database Supabase dan tampil di semua perangkat.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-royal-700 hover:underline"
          >
            Buka halaman pembeli
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-600">
          <ShoppingBag className="size-3.5" aria-hidden="true" />
          {stats.ready} produk siap dijual • {stats.sold} sold out
        </p>
      </main>

      {formState && (
        <ProductForm
          key={
            formState.mode === "edit" ? formState.product.id : "new-product"
          }
          product={formState.mode === "edit" ? formState.product : null}
          onSave={handleSave}
          onClose={() => setFormState(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus produk?"
          description={`"${deleteTarget.name}" akan dihapus permanen dari database Supabase dan katalog pembeli.`}
          confirmLabel="Ya, hapus produk"
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {resetOpen && (
        <ConfirmDialog
          title="Reset ke data awal?"
          description="Semua perubahan admin (tambah, edit, hapus, ubah status) akan dihapus dan katalog kembali memakai 15 data contoh awal."
          confirmLabel="Reset data"
          tone="warning"
          isPending={isResetting}
          onConfirm={handleReset}
          onCancel={() => setResetOpen(false)}
        />
      )}
    </div>
  );
}

export function AdminDashboard() {
  const { status, loginAt, error, isSubmitting, login, logout, clearError } =
    useAdminSession();

  if (status === "checking") return <AdminLoading />;

  if (status === "unauthenticated") {
    return (
      <AdminLogin
        error={error}
        isSubmitting={isSubmitting}
        onLogin={login}
        onClearError={clearError}
      />
    );
  }

  return (
    <DashboardContent
      loginAt={loginAt}
      onLogout={() => {
        void logout();
      }}
    />
  );
}
