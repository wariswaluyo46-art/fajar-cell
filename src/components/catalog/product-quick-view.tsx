"use client";

import { ImageIcon, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/ui/status-badge";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import {
  ACCESSORY_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import { requiresNativeImage } from "@/lib/product-images";
import {
  calculateDiscountPercent,
  cn,
  formatRupiah,
} from "@/lib/utils";
import { buildProductInquiryUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";

interface ProductQuickViewProps {
  product: Product;
  onClose: () => void;
}

interface SpecRow {
  label: string;
  value: string;
}

function getSpecRows(product: Product): SpecRow[] {
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
      { label: "Stok tersedia", value: `${product.stock} unit` },
      { label: "Garansi toko", value: "Tanyakan admin" },
    ];
  }

  const isUsed = product.category === "handphone-bekas";

  return [
    {
      label: "Prosesor",
      value: product.specs.chipset ?? "Tanyakan admin",
    },
    {
      label: "RAM / Penyimpanan",
      value: `${product.specs.ram}/${product.specs.storage} GB`,
    },
    {
      label: "Layar",
      value: product.specs.screen ?? "Tanyakan admin",
    },
    {
      label: "Kamera",
      value: product.specs.camera ?? "Tanyakan admin",
    },
    {
      label: "Kapasitas baterai",
      value: product.specs.battery
        ? `${product.specs.battery} mAh`
        : "Tanyakan admin",
    },
    {
      label: "Kesehatan baterai",
      value: isUsed
        ? product.condition.batteryHealth !== undefined
          ? `${product.condition.batteryHealth}%`
          : "Belum dicek"
        : "Unit baru",
    },
    {
      label: "Kelengkapan",
      value: isUsed
        ? product.condition.completeness.length > 0
          ? product.condition.completeness.join(", ")
          : product.condition.label
        : "Garansi resmi distributor",
    },
    {
      label: "Masa garansi toko",
      value:
        product.warranty.active && product.warranty.durationDays > 0
          ? `${product.warranty.durationDays} hari`
          : "Tidak aktif",
    },
    { label: "Warna", value: product.color },
    { label: "Stok tersedia", value: `${product.stock} unit` },
  ];
}

export function ProductQuickView({ product, onClose }: ProductQuickViewProps) {
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { showToast } = useToast();
  const isUsed = product.category === "handphone-bekas";
  const discount = calculateDiscountPercent(
    product.price,
    product.originalPrice,
  );
  const specs = getSpecRows(product);

  const allImages = useMemo(() => {
    const list = [product.thumbnail, ...(product.images ?? [])].filter(
      (img): img is string => typeof img === "string" && img.trim() !== "",
    );
    return Array.from(new Set(list));
  }, [product.thumbnail, product.images]);

  const currentImage = allImages[activeImageIndex] || product.thumbnail;
  const imageError = failedThumbnail === currentImage;
  const usesNativeImage = requiresNativeImage(currentImage);

  function handleWhatsAppClick() {
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp...",
      description: `Pertanyaan untuk ${product.name} sedang disiapkan.`,
    });
  }

  return (
    <Modal
      title={product.name}
      description={`${product.brand} • ${PRODUCT_CATEGORY_LABELS[product.category]}`}
      size="xl"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Harga
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <p className="text-2xl font-extrabold tracking-tight text-royal-700">
                {formatRupiah(product.price)}
              </p>
              {product.originalPrice && (
                <p className="text-xs text-slate-400 line-through">
                  {formatRupiah(product.originalPrice)}
                </p>
              )}
              {discount !== null && (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                  -{discount}%
                </span>
              )}
            </div>
          </div>
          <WhatsAppLink
            href={buildProductInquiryUrl(product)}
            size="md"
            onClick={handleWhatsAppClick}
            className="w-full shrink-0 sm:w-auto"
          >
            Tanya Unit Ini via WA
          </WhatsAppLink>
        </div>
      }
    >
      <div className="grid gap-6 sm:grid-cols-[minmax(0,0.9fr)_1.1fr] sm:gap-7">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-100 via-royal-50/20 to-slate-50">
            {imageError ? (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
                <ImageIcon className="size-10" aria-hidden="true" />
                <span className="text-xs font-medium">Foto belum tersedia</span>
              </div>
            ) : usesNativeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={currentImage}
                src={currentImage}
                alt={`Foto ${product.name} (sudut ${activeImageIndex + 1})`}
                className="size-full object-cover transition-opacity duration-300"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailedThumbnail(currentImage)}
              />
            ) : (
              <Image
                key={currentImage}
                src={currentImage}
                alt={`Foto ${product.name} (sudut ${activeImageIndex + 1})`}
                fill
                priority
                sizes="(min-width: 640px) 380px, 90vw"
                className="object-cover transition-opacity duration-300"
                onError={() => setFailedThumbnail(currentImage)}
              />
            )}

            <div className="absolute top-3 left-3">
              <StatusBadge status={product.status} />
            </div>
            {isUsed && (
              <span className="glass absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                {product.condition.grade}
              </span>
            )}
          </div>

          {/* Thumbnail Gallery Switcher (Multi-Angle) */}
          {allImages.length > 1 && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between px-0.5">
                <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  Sudut Foto ({activeImageIndex + 1}/{allImages.length})
                </span>
                <span className="text-[10px] font-medium text-royal-600">
                  Pilih untuk melihat detail
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {allImages.map((imgUrl, index) => {
                  const isActive = activeImageIndex === index;
                  const isNative = requiresNativeImage(imgUrl);
                  return (
                    <button
                      key={imgUrl + index}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`Lihat sudut foto ${index + 1}`}
                      className={cn(
                        "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-royal-600",
                        isActive
                          ? "border-royal-600 ring-2 ring-royal-200 shadow-sm scale-105"
                          : "border-slate-200/90 opacity-70 hover:border-royal-300 hover:opacity-100",
                      )}
                    >
                      {isNative ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl}
                          alt={`Sudut ${index + 1}`}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Image
                          src={imgUrl}
                          alt={`Sudut ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isUsed && (
            <div className="mt-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-4">
              <p className="text-[11px] font-bold tracking-wider text-royal-700 uppercase">
                Kondisi Fisik
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {product.condition.grade}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                {product.condition.label}
                {product.condition.minusCount > 0
                  ? ` • ${product.condition.minusCount} minus`
                  : " • Tanpa minus"}
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-royal-50 px-2.5 py-1 text-xs font-bold text-royal-700 border border-royal-200/60">
              {PRODUCT_CATEGORY_LABELS[product.category]}
            </span>
            <span
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-bold border",
                product.stock > 0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-rose-50 text-rose-700 border-rose-200/60",
              )}
            >
              Stok {product.stock} unit
            </span>
          </div>

          <p className="mt-3.5 text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>

          <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="min-w-0 border-b border-dashed border-slate-200/80 pb-2.5 last:border-0 sm:last:border-0"
              >
                <dt className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  {spec.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold break-words text-slate-900">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          {product.category !== "aksesoris" && product.warranty.description && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
              <ShieldCheck
                className="mt-0.5 size-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Garansi Toko Resmi
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                  {product.warranty.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
