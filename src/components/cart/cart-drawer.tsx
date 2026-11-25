"use client";

import {
  ArrowRight,
  Clock,
  LoaderCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { requiresNativeImage } from "@/lib/product-images";
import { cn, formatRupiah } from "@/lib/utils";
import { buildCartInquiryUrl } from "@/lib/whatsapp";

function formatRemaining(targetIso: string | null, nowMs: number): {
  label: string;
  secondsLeft: number;
} {
  if (!targetIso) return { label: "15:00", secondsLeft: 900 };
  const targetMs = Date.parse(targetIso);
  if (!Number.isFinite(targetMs)) return { label: "15:00", secondsLeft: 900 };

  const diffSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1_000));
  const mins = Math.floor(diffSeconds / 60);
  const secs = diffSeconds % 60;
  return {
    label: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    secondsLeft: diffSeconds,
  };
}

export function CartDrawer() {
  const {
    items,
    subtotal,
    totalQuantity,
    earliestExpiresAt,
    serverOffsetMs,
    isLoading,
    isDrawerOpen,
    pendingProductId,
    closeDrawer,
    updateItemQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isDrawerOpen) return;

    const tick = () => {
      setNowMs(Date.now() + serverOffsetMs);
    };
    const frame = requestAnimationFrame(tick);
    const interval = window.setInterval(tick, 1_000);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDrawer, isDrawerOpen, serverOffsetMs]);

  if (!isDrawerOpen) return null;

  const timer = formatRemaining(earliestExpiresAt, nowMs);
  const isCritical = timer.secondsLeft < 60;
  const isWarning = !isCritical && timer.secondsLeft < 180;

  return (
    <div
      className="fixed inset-0 z-[110] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Tutup panel keranjang"
        onClick={closeDrawer}
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
              <ShoppingCart className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="cart-drawer-title"
                className="text-base font-extrabold tracking-tight text-slate-900"
              >
                Keranjang Belanja
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {totalQuantity > 0
                  ? `${totalQuantity} unit diamankan sementara`
                  : "Belum ada produk dipilih"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Tutup keranjang"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Countdown Banner */}
        {items.length > 0 && earliestExpiresAt && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 border-b px-5 py-3 text-xs font-semibold transition-colors",
              isCritical
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : isWarning
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-royal-200/70 bg-royal-50/90 text-royal-900",
            )}
          >
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span>
                Stok diamankan khusus untuk Anda. Selesaikan checkout sebelum waktu habis:
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 font-mono text-sm font-extrabold tabular-nums",
                isCritical
                  ? "bg-rose-600 text-white"
                  : isWarning
                    ? "bg-amber-500 text-slate-950"
                    : "bg-royal-700 text-white",
              )}
            >
              {timer.label}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-12 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ShoppingBag className="size-8" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">
                Keranjang Anda masih kosong
              </h3>
              <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
                Pilih HP bekas bergaransi, HP baru, atau aksesoris favorit. Unit yang dimasukkan ke keranjang otomatis diamankan 15 menit.
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition hover:opacity-95 cursor-pointer"
              >
                Jelajahi Katalog
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {items.map((item) => {
                const isItemPending = pendingProductId === item.productId;
                const itemTimer = formatRemaining(item.expiresAt, nowMs);
                const useNative = requiresNativeImage(item.thumbnail);
                const categoryLabel =
                  PRODUCT_CATEGORY_LABELS[
                    item.category as keyof typeof PRODUCT_CATEGORY_LABELS
                  ] ?? item.category;

                return (
                  <li
                    key={item.productId}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3.5 transition hover:border-royal-200"
                  >
                    <div className="flex gap-3">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {useNative ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="size-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Image
                            src={item.thumbnail}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold tracking-wider text-royal-700 uppercase">
                              {item.brand} • {categoryLabel}
                            </p>
                            <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                              {item.name}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              void removeItem(item.productId);
                            }}
                            disabled={isItemPending}
                            aria-label={`Hapus ${item.name} dari keranjang`}
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                          >
                            {isItemPending ? (
                              <LoaderCircle
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Trash2 className="size-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-extrabold text-royal-700">
                            {formatRupiah(item.unitPrice)}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-600 border border-slate-200/80">
                            <Clock className="size-3 text-royal-600" aria-hidden="true" />
                            {itemTimer.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 pt-2.5">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            void updateItemQuantity(
                              item.productId,
                              item.quantity - 1,
                            );
                          }}
                          disabled={isItemPending}
                          aria-label={`Kurangi jumlah ${item.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-extrabold text-slate-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void updateItemQuantity(
                              item.productId,
                              item.quantity + 1,
                            );
                          }}
                          disabled={
                            isItemPending ||
                            item.quantity >= item.availableStock
                          }
                          aria-label={`Tambah jumlah ${item.name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">
                          Maks {item.availableStock} unit
                        </p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {formatRupiah(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50/90 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Subtotal ({totalQuantity} unit)
                </p>
                <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                  Ongkir COD & metode bayar dipilih saat checkout
                </p>
              </div>
              <p className="text-xl font-extrabold tracking-tight text-royal-700">
                {formatRupiah(subtotal)}
              </p>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-royal-600/25 transition hover:opacity-95 active:scale-[0.99]"
            >
              <span>Lanjut ke Checkout</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>

            <div className="flex flex-col gap-2 sm:flex-row">
              <WhatsAppLink
                href={buildCartInquiryUrl(items, subtotal)}
                size="sm"
                variant="outline"
                className="w-full flex-1"
              >
                Tanya Isi Keranjang via WA
              </WhatsAppLink>
              <button
                type="button"
                onClick={() => {
                  void clearCart();
                }}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
