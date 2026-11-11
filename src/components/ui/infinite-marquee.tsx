"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface InfiniteMarqueeProps {
  children: ReactNode;
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  pauseOnHover?: boolean;
  className?: string;
}

export function InfiniteMarquee({
  children,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
}: InfiniteMarqueeProps) {
  const speedClass =
    speed === "fast"
      ? "[--duration:20s]"
      : speed === "slow"
        ? "[--duration:45s]"
        : "[--duration:30s]";

  const animationClass =
    direction === "left" ? "animate-marquee" : "animate-marquee-reverse";

  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        pauseOnHover && "pause-on-hover",
        speedClass,
        className,
      )}
    >
      <div className={cn("flex shrink-0 items-center gap-4 py-2", animationClass)}>
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn("flex shrink-0 items-center gap-4 py-2", animationClass)}
      >
        {children}
      </div>
    </div>
  );
}

export interface MarqueeItem {
  id: string;
  label: string;
  tag?: string;
  icon?: string;
}

const BRANDS = [
  { name: "Samsung", note: "Galaxy Series", tag: "Garansi Resmi SEIN" },
  { name: "Xiaomi", note: "Redmi & POCO", tag: "Garansi Resmi" },
  { name: "Infinix", note: "Zero & Note", tag: "Garansi Resmi" },
  { name: "OPPO", note: "Reno & A Series", tag: "Garansi Resmi" },
  { name: "Vivo", note: "V & Y Series", tag: "Garansi Resmi" },
  { name: "Realme", note: "Number & C Series", tag: "Garansi Resmi" },
  { name: "Anker", note: "Charger & Audio", tag: "Original 100%" },
  { name: "Baseus", note: "Kabel & TWS", tag: "Original 100%" },
];

const TRUST_SERVICES = [
  { text: "🛠️ Service HP Bisa Ditunggu", highlight: "45-90 Menit" },
  { text: "🔄 Terima Tukar Tambah HP Lama", highlight: "Estimasi Cepat" },
  { text: "✅ HP Second Bergaransi Toko", highlight: "Lulus QC 30 Titik" },
  { text: "⚡ Aksesoris 100% Original", highlight: "Garansi Ganti Baru" },
  { text: "🚚 Siap COD Banjarnegara & Sekitarnya", highlight: "Bayar di Tempat" },
  { text: "🔍 Pengecekan Mesin & Baterai", highlight: "Gratis Tanpa Syarat" },
];

export function HeroMarqueeSection() {
  return (
    <div className="relative border-y border-slate-200/80 bg-white/75 py-5 backdrop-blur-md">
      <div className="flex flex-col gap-3">
        {/* Track 1: Brand Ecosystem Loop */}
        <InfiniteMarquee direction="left" speed="normal">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-2 shadow-xs transition-all duration-200 hover:border-royal-300 hover:bg-royal-50/50 hover:shadow-sm"
            >
              <span className="flex size-7 items-center justify-center rounded-xl bg-white text-xs font-black text-royal-700 shadow-xs border border-slate-200/60">
                {brand.name.slice(0, 1)}
              </span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-extrabold text-slate-800">
                  {brand.name}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {brand.note}
                </span>
              </div>
              <span className="ml-1 rounded-md bg-royal-100/60 px-1.5 py-0.5 text-[9px] font-bold text-royal-700">
                {brand.tag}
              </span>
            </div>
          ))}
        </InfiniteMarquee>

        {/* Track 2: Trust & Service Loop */}
        <InfiniteMarquee direction="right" speed="slow">
          {TRUST_SERVICES.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/70 via-white to-cyan-50/50 px-4 py-2 shadow-xs transition-all duration-200 hover:border-emerald-300 hover:shadow-sm"
            >
              <span className="text-xs font-bold text-slate-800">
                {item.text}
              </span>
              <span className="rounded-md border border-emerald-300/60 bg-emerald-100/80 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                {item.highlight}
              </span>
            </div>
          ))}
        </InfiniteMarquee>
      </div>
    </div>
  );
}
