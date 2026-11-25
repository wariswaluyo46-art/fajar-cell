"use client";

import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  ImageIcon,
  LoaderCircle,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Container } from "@/components/ui/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast-provider";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import {
  ACCESSORY_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import { getProductAvailabilityInfo } from "@/lib/order-constants";
import { requiresNativeImage } from "@/lib/product-images";
import { calculateDiscountPercent, cn, formatRupiah } from "@/lib/utils";
import { buildProductInquiryUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";

export function ProductDetailClient({ product }: { product: Product }) {
  const { showToast } = useToast();
  const { addToCart, getItemQuantity, openDrawer, pendingProductId } =
    useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const isPhone = product.category !== "aksesoris";
  const isUsed = product.category === "handphone-bekas";
  const discount = calculateDiscountPercent(
    product.price,
    product.originalPrice,
  );

  const cartQty = getItemQuantity(product.id);
  const availability = getProductAvailabilityInfo(product, cartQty);
  const isCartPending = pendingProductId === product.id;

  const allImages = useMemo(() => {
    const list = [product.thumbnail, ...(product.images ?? [])].filter(
      (img): img is string => typeof img === "string" && img.trim() !== "",
    );
    return Array.from(new Set(list));
  }, [product.thumbnail, product.images]);

  const currentImage = allImages[activeImageIndex] || product.thumbnail;
  const usesNative = requiresNativeImage(currentImage);

  const specRows = useMemo(() => {
    if (product.category === "aksesoris") {
      return [
        {
          label: "Jenis aksesoris",
          value: ACCESSORY_TYPE_LABELS[product.accessoryType],
        },
        {
          label: "Kompatibel dengan",
          value:
            product.compatibleWith && product.compatibleWith.length > 0
              ? product.compatibleWith.join(", ")
              : "Universal",
        },
        { label: "Stok tersedia", value: `${availability.effectiveAvailable} unit` },
      ];
    }

    return [
      { label: "Prosesor / Chipset", value: product.specs.chipset ?? "-" },
      {
        label: "RAM / Penyimpanan",
        value: `${product.specs.ram}/${product.specs.storage} GB`,
      },
      { label: "Layar", value: product.specs.screen ?? "-" },
      { label: "Kamera Belakang", value: product.specs.camera ?? "-" },
      ...(product.specs.frontCamera
        ? [{ label: "Kamera Depan", value: product.specs.frontCamera }]
        : []),
      {
        label: "Baterai",
        value: product.specs.battery ? `${product.specs.battery} mAh` : "-",
      },
      ...(product.specs.network
        ? [{ label: "Jaringan", value: product.specs.network }]
        : []),
      ...(product.specs.os
        ? [{ label: "Sistem Operasi", value: product.specs.os }]
        : []),
      { label: "Warna", value: product.color },
      ...(product.specs.customSpecs ?? []).map((item) => ({
        label: item.key,
        value: item.value,
      })),
    ];
  }, [availability.effectiveAvailable, product]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast({
        variant: "success",
        title: "Link produk disalin",
        description: "Bagikan link ini langsung ke WhatsApp atau teman Anda.",
      });
      window.setTimeout(() => setCopiedLink(false), 2_000);
    } catch {
      showToast({
        variant: "error",
        title: "Gagal menyalin link",
        description: "Salin URL langsung dari bilah browser.",
      });
    }
  }

  function handleAddToCart() {
    if (cartQty > 0 && availability.remainingToAdd === 0) {
      openDrawer();
      return;
    }
    if (!availability.canAddToCart || isCartPending) return;
    void addToCart(product, 1);
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-700 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Kembali ke Katalog
        </Link>

        <button
          type="button"
          onClick={() => {
            void handleCopyLink();
          }}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          {copiedLink ? (
            <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          <span>{copiedLink ? "Link Disalin" : "Salin Link Produk"}</span>
        </button>
      </div>

      <div className="grid gap-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
        {/* Galeri Foto */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {failedImage === currentImage ? (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="size-10" aria-hidden="true" />
                <span className="text-xs font-medium">Foto belum tersedia</span>
              </div>
            ) : usesNative ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt={product.name}
                className="size-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setFailedImage(currentImage)}
              />
            ) : (
              <Image
                src={currentImage}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 480px, 92vw"
                className="object-cover"
                onError={() => setFailedImage(currentImage)}
              />
            )}

            <div className="absolute top-3 left-3">
              <StatusBadge status={product.status} />
            </div>
            {isUsed && (
              <span className="glass absolute right-3 bottom-3 rounded-full px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
                {product.condition.grade}
              </span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition cursor-pointer",
                    activeImageIndex === idx
                      ? "border-royal-600 ring-2 ring-royal-200"
                      : "border-slate-200 opacity-75 hover:opacity-100",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={`Sudut ${idx + 1}`}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info & Spesifikasi */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-royal-200 bg-royal-50 px-2.5 py-1 text-xs font-extrabold text-royal-700">
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
              {product.brand}
            </span>
            <span
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-bold",
                availability.effectiveAvailable > 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              Stok siap order: {availability.effectiveAvailable} unit
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-2.5">
            <p className="text-3xl font-black tracking-tight text-royal-700">
              {formatRupiah(product.price)}
            </p>
            {product.originalPrice && (
              <p className="text-sm text-slate-400 line-through">
                {formatRupiah(product.originalPrice)}
              </p>
            )}
            {discount !== null && (
              <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                Hemat {discount}%
              </span>
            )}
          </div>

          {availability.isHeldByOthers && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900">
              <Clock className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>
                Sedang dipesan orang lain (cek lagi dalam beberapa menit).
              </span>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>

          {/* CTA Buttons */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                isCartPending ||
                (!availability.canAddToCart && cartQty === 0)
              }
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-royal-600/25 transition hover:opacity-95 disabled:opacity-55 cursor-pointer disabled:cursor-not-allowed"
            >
              {isCartPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShoppingCart className="size-4" aria-hidden="true" />
              )}
              <span>
                {availability.isSoldOut
                  ? "Stok Habis"
                  : availability.isHeldByOthers
                    ? "Sedang Dipesan Orang Lain"
                    : cartQty > 0
                      ? availability.remainingToAdd > 0
                        ? `Tambah Lagi (${cartQty} di Keranjang)`
                        : `Lihat Keranjang (${cartQty})`
                      : "Tambah ke Keranjang"}
              </span>
            </button>

            <WhatsAppLink
              href={buildProductInquiryUrl(product)}
              size="lg"
              className="flex-1"
            >
              Tanya Unit Ini via WA
            </WhatsAppLink>
          </div>

          {/* Kondisi Fisik & Kelengkapan (HP Bekas) */}
          {isUsed && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs space-y-1.5">
              <p className="font-extrabold text-royal-700 uppercase tracking-wider text-[11px]">
                Kondisi & Kelengkapan
              </p>
              <p className="text-sm font-bold text-slate-900">
                {product.condition.grade} — {product.condition.label} (
                {product.condition.minusCount > 0
                  ? `${product.condition.minusCount} minus`
                  : "Tanpa minus"}
                )
              </p>
              {product.condition.batteryHealth !== undefined && (
                <p className="text-slate-700">
                  Kesehatan Baterai: <strong>{product.condition.batteryHealth}%</strong>
                </p>
              )}
              <p className="text-slate-600">
                Kelengkapan: {product.condition.completeness.join(", ")}
              </p>
            </div>
          )}

          {/* Tabel Spesifikasi Lengkap */}
          <div className="mt-6">
            <h2 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">
              Spesifikasi Lengkap
            </h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {specRows.map((spec) => (
                <div
                  key={spec.label}
                  className="border-b border-dashed border-slate-200 pb-2"
                >
                  <dt className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    {spec.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {isPhone && product.warranty.description && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-extrabold text-emerald-900">
                  {product.warranty.active
                    ? `Garansi Resmi / Toko ${product.warranty.durationDays} Hari`
                    : "Informasi Garansi"}
                </p>
                <p className="mt-0.5 text-xs text-emerald-800">
                  {product.warranty.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
