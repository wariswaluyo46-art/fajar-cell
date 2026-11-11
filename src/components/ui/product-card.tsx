"use client";

import { ImageIcon, Layers, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { useQuickView } from "@/components/catalog/quick-view-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { useToast } from "@/components/ui/toast-provider";
import { requiresNativeImage } from "@/lib/product-images";
import { calculateDiscountPercent, cn, formatRupiah } from "@/lib/utils";
import { buildProductInquiryUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { openQuickView } = useQuickView();
  const { showToast } = useToast();
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  const [failedSecondary, setFailedSecondary] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<0 | 1>(0);
  const [isCardHovered, setIsCardHovered] = useState(false);

  const isUsed = product.category === "handphone-bekas";
  const isPhone = isUsed || product.category === "handphone-baru";
  const imageError = failedThumbnail === product.thumbnail;
  const usesNativeImage = requiresNativeImage(product.thumbnail);

  const secondaryImage = useMemo(() => {
    if (product.images && product.images.length > 1) {
      const candidate = product.images.find(
        (img) => img !== product.thumbnail && img.trim() !== "",
      );
      if (candidate) return candidate;
    }

    // Auto-detect standard pattern for known local product images
    if (
      typeof product.thumbnail === "string" &&
      product.thumbnail.startsWith("/images/products/") &&
      product.thumbnail.endsWith(".jpg") &&
      !product.thumbnail.includes("-2.jpg")
    ) {
      return product.thumbnail.replace(/\.jpg$/, "-2.jpg");
    }

    return null;
  }, [product.thumbnail, product.images]);

  const hasSecondary = Boolean(secondaryImage && failedSecondary !== secondaryImage);
  const showSecondary = hasSecondary && (isCardHovered || activeImageIndex === 1);

  const discount = calculateDiscountPercent(
    product.price,
    product.originalPrice,
  );

  function handleWhatsAppClick() {
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp...",
      description: `Pertanyaan untuk ${product.name} sedang disiapkan.`,
    });
  }

  function handleTogglePhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? 1 : 0));
  }

  return (
    <article
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-royal-400/50 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.18)]",
        className,
      )}
    >
      {/* Aspect Square Visual Image Box with Dual-Image Motion Clip */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 via-royal-50/20 to-slate-50">
        {imageError ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="size-8" aria-hidden="true" />
            <span className="text-[11px] font-medium">Foto belum tersedia</span>
          </div>
        ) : (
          <>
            {/* Primary Image */}
            {usesNativeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.thumbnail}
                alt={`Foto depan ${product.name}`}
                className={cn(
                  "size-full object-cover transition-all duration-700 ease-out",
                  showSecondary
                    ? "opacity-0 scale-105"
                    : "opacity-100 scale-100 group-hover:scale-[1.04]",
                )}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailedThumbnail(product.thumbnail)}
              />
            ) : (
              <Image
                src={product.thumbnail}
                alt={`Foto depan ${product.name}`}
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 45vw, 90vw"
                className={cn(
                  "object-cover transition-all duration-700 ease-out",
                  showSecondary
                    ? "opacity-0 scale-105"
                    : "opacity-100 scale-100 group-hover:scale-[1.04]",
                )}
                onError={() => setFailedThumbnail(product.thumbnail)}
              />
            )}

            {/* Secondary Image (Smooth Motion Crossfade + Ken Burns Zoom) */}
            {hasSecondary && secondaryImage && (
              <>
                {requiresNativeImage(secondaryImage) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={secondaryImage}
                    alt={`Foto belakang / sudut kedua ${product.name}`}
                    className={cn(
                      "absolute inset-0 size-full object-cover transition-all duration-700 ease-out",
                      showSecondary
                        ? "opacity-100 scale-105"
                        : "opacity-0 scale-100 pointer-events-none",
                    )}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedSecondary(secondaryImage)}
                  />
                ) : (
                  <Image
                    src={secondaryImage}
                    alt={`Foto belakang / sudut kedua ${product.name}`}
                    fill
                    sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 640px) 45vw, 90vw"
                    className={cn(
                      "object-cover transition-all duration-700 ease-out",
                      showSecondary
                        ? "opacity-100 scale-105"
                        : "opacity-0 scale-100 pointer-events-none",
                    )}
                    onError={() => setFailedSecondary(secondaryImage)}
                  />
                )}
              </>
            )}
          </>
        )}

        {/* Top Floating Badges */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 z-20 pointer-events-none">
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm pointer-events-auto">
            {isUsed ? product.condition.grade : "Unit Baru"}
          </span>
          <div className="pointer-events-auto">
            <StatusBadge status={product.status} />
          </div>
        </div>

        {/* Dual-Image Interactive Motion Pill Indicator */}
        {hasSecondary && (
          <div className="absolute bottom-3 left-3 z-20">
            <button
              type="button"
              onClick={handleTogglePhoto}
              title="Ketuk untuk memutar sudut foto depan/belakang"
              aria-label={`Ubah tampilan foto ${product.name}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer pointer-events-auto active:scale-95",
                showSecondary
                  ? "bg-royal-700 text-white shadow-royal-600/30"
                  : "bg-white/90 text-slate-700 hover:bg-white hover:text-royal-700",
              )}
            >
              <Layers className="size-3 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>{showSecondary ? "2/2 Foto" : "1/2 Foto"}</span>
              <RefreshCw
                className={cn(
                  "size-2.5 transition-transform duration-300",
                  showSecondary && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4.5">
        <p className="text-[11px] font-bold tracking-[0.14em] text-royal-700 uppercase">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base leading-snug font-bold text-slate-900 transition-colors duration-200 group-hover:text-royal-700">
          {product.name}
        </h3>

        {isUsed && (
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {product.condition.label}
          </p>
        )}

        {isPhone && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              {product.specs.ram}/{product.specs.storage} GB
            </span>
            {isUsed && product.condition.batteryHealth !== undefined && (
              <span className="inline-flex items-center rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                BH {product.condition.batteryHealth}%
              </span>
            )}
            {product.category === "handphone-baru" && (
              <span className="inline-flex items-center rounded-lg border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Garansi resmi
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-xl font-extrabold tracking-tight text-royal-700">
              {formatRupiah(product.price)}
            </p>
            {discount !== null && (
              <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                -{discount}%
              </span>
            )}
          </div>
          {product.originalPrice && (
            <p className="text-xs text-slate-400 line-through">
              {formatRupiah(product.originalPrice)}
            </p>
          )}
          <WhatsAppLink
            href={buildProductInquiryUrl(product)}
            size="sm"
            onClick={handleWhatsAppClick}
            className="relative z-20 mt-3.5 w-full"
            aria-label={`Tanya via WA - ${product.name}`}
          >
            Tanya via WA
          </WhatsAppLink>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openQuickView(product)}
        aria-label={`Lihat detail ${product.name}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-royal-600 focus-visible:ring-inset cursor-pointer"
      />
    </article>
  );
}
