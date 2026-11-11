"use client";

import {
  BatteryCharging,
  BatteryFull,
  Headphones,
  ImageIcon,
  Package,
  Shield,
  Smartphone,
  Speaker,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { useQuickView } from "@/components/catalog/quick-view-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { useToast } from "@/components/ui/toast-provider";
import { ACCESSORY_TYPE_LABELS } from "@/lib/constants";
import { requiresNativeImage } from "@/lib/product-images";
import { cn, formatRupiah } from "@/lib/utils";
import { buildProductInquiryUrl } from "@/lib/whatsapp";
import type { AccessoryProduct, AccessoryType } from "@/types";

const ACCESSORY_ICONS: Record<AccessoryType, LucideIcon> = {
  charger: BatteryCharging,
  tws: Headphones,
  headset: Headphones,
  "tempered-glass": Shield,
  powerbank: BatteryFull,
  speaker: Speaker,
  case: Smartphone,
  lainnya: Package,
};

interface AccessoryCardProps {
  product: AccessoryProduct;
  className?: string;
}

export function AccessoryCard({ product, className }: AccessoryCardProps) {
  const { openQuickView } = useQuickView();
  const { showToast } = useToast();
  const [failedThumbnail, setFailedThumbnail] = useState<string | null>(null);
  const Icon = ACCESSORY_ICONS[product.accessoryType];
  const isSoldOut = product.status === "sold-out";
  const imageError = failedThumbnail === product.thumbnail;
  const usesNativeImage = requiresNativeImage(product.thumbnail);

  function handleWhatsAppClick() {
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp...",
      description: `Pertanyaan untuk ${product.name} sedang disiapkan.`,
    });
  }

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-royal-400/50 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.18)]",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 via-royal-50/20 to-slate-50">
        {imageError ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
            <ImageIcon className="size-8" aria-hidden="true" />
            <span className="text-[11px] font-medium">Foto belum tersedia</span>
          </div>
        ) : usesNativeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={`Foto ${product.name}`}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailedThumbnail(product.thumbnail)}
          />
        ) : (
          <Image
            src={product.thumbnail}
            alt={`Foto ${product.name}`}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            onError={() => setFailedThumbnail(product.thumbnail)}
          />
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
            <Icon className="size-3 text-royal-600" aria-hidden="true" />
            {ACCESSORY_TYPE_LABELS[product.accessoryType]}
          </span>
          <StatusBadge status={product.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4.5">
        <p className="text-[11px] font-bold tracking-[0.14em] text-royal-700 uppercase">
          {product.brand}
        </p>
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-bold text-slate-900 transition-colors duration-200 group-hover:text-royal-700 sm:text-base">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {isSoldOut ? "Stok habis" : `Stok tersedia: ${product.stock}`}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-royal-700">
              {formatRupiah(product.price)}
            </p>
            {product.originalPrice && (
              <p className="text-[11px] text-slate-400 line-through">
                {formatRupiah(product.originalPrice)}
              </p>
            )}
          </div>
          <WhatsAppLink
            href={buildProductInquiryUrl(product)}
            size="sm"
            onClick={handleWhatsAppClick}
            className="relative z-20"
            aria-label={`Tanya ${product.name} via WhatsApp`}
          >
            Tanya
          </WhatsAppLink>
        </div>
      </div>

      <button
        type="button"
        onClick={() => openQuickView(product)}
        aria-label={`Lihat detail ${product.name}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:ring-2 focus-visible:ring-royal-600 focus-visible:ring-inset"
      />
    </article>
  );
}
