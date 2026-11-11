"use client";

import {
  ArrowRight,
  BadgeCheck,
  Check,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useQuickView } from "@/components/catalog/quick-view-provider";
import { Container } from "@/components/ui/container";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast-provider";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { useProducts } from "@/hooks/use-products";
import { requiresNativeImage } from "@/lib/product-images";
import { isUsedPhone } from "@/lib/products";
import { cn, formatRupiah } from "@/lib/utils";
import { buildGeneralInquiryUrl, buildProductInquiryUrl } from "@/lib/whatsapp";
import type { Product } from "@/types";

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "Garansi Toko Resmi",
    description: "14 hari servis & pengecekan penuh",
  },
  {
    icon: BadgeCheck,
    title: "Unit 100% Original",
    description: "IMEI tembus, bukan rekondisi",
  },
  {
    icon: Wrench,
    title: "Service HP Bisa Ditunggu",
    description: "Ganti LCD & baterai cepat 45-90 menit",
  },
];

interface MotionSlide {
  id: string;
  type: "product" | "service" | "trade-in";
  tag: string;
  title: string;
  subtitle: string;
  image: string;
  price?: number;
  originalPrice?: number;
  gradeBadge?: string;
  specs: { label: string; value: string; icon?: string }[];
  ctaText: string;
  ctaHref: string;
  ctaType: "whatsapp" | "link";
  productData?: Product;
}

export function Hero() {
  const products = useProducts();
  const { openQuickView } = useQuickView();
  const { showToast } = useToast();

  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const usedPhones = useMemo(() => products.filter(isUsedPhone), [products]);

  const featuredPhone1 = useMemo(() => {
    return (
      usedPhones.find((p) => p.slug.includes("m30s")) ??
      usedPhones.find((p) => p.brand === "Samsung") ??
      usedPhones[0]
    );
  }, [usedPhones]);

  const featuredPhone2 = useMemo(() => {
    return (
      usedPhones.find((p) => p.slug.includes("poco")) ??
      usedPhones.find((p) => p.slug.includes("oppo-a18")) ??
      usedPhones.find((p) => p.slug.includes("redmi-9")) ??
      usedPhones[1] ??
      usedPhones[0]
    );
  }, [usedPhones]);

  const slides: MotionSlide[] = useMemo(() => {
    const list: MotionSlide[] = [];

    if (featuredPhone1) {
      list.push({
        id: "slide-phone-1",
        type: "product",
        tag: "Unit Pilihan Terlaris",
        title: featuredPhone1.name,
        subtitle: "Layar Super AMOLED • Baterai Jumbo 6000mAh",
        image: featuredPhone1.thumbnail,
        price: featuredPhone1.price,
        originalPrice: featuredPhone1.originalPrice,
        gradeBadge: featuredPhone1.condition?.grade ?? "Mulus 95%",
        specs: [
          { label: "RAM / ROM", value: `${featuredPhone1.specs.ram}/${featuredPhone1.specs.storage} GB` },
          { label: "Baterai", value: `${featuredPhone1.specs.battery ?? 6000} mAh` },
          { label: "Garansi", value: "14 Hari Toko" },
        ],
        ctaText: "Tanya Unit via WA",
        ctaHref: buildProductInquiryUrl(featuredPhone1),
        ctaType: "whatsapp",
        productData: featuredPhone1,
      });
    }

    if (featuredPhone2) {
      list.push({
        id: "slide-phone-2",
        type: "product",
        tag: "Best Seller Pilihan",
        title: featuredPhone2.name,
        subtitle: "Unit Original • Kamera Jernih & Baterai Awet",
        image: featuredPhone2.thumbnail,
        price: featuredPhone2.price,
        originalPrice: featuredPhone2.originalPrice,
        gradeBadge: featuredPhone2.condition?.grade ?? "Mulus 96%",
        specs: [
          { label: "RAM / ROM", value: `${featuredPhone2.specs.ram}/${featuredPhone2.specs.storage} GB` },
          { label: "Kondisi", value: featuredPhone2.condition?.label ?? "Fullset" },
          { label: "Baterai", value: `${featuredPhone2.specs.battery ?? 5000} mAh` },
        ],
        ctaText: "Tanya Unit via WA",
        ctaHref: buildProductInquiryUrl(featuredPhone2),
        ctaType: "whatsapp",
        productData: featuredPhone2,
      });
    }

    list.push({
      id: "slide-service",
      type: "service",
      tag: "Layanan Servis HP",
      title: "Service HP Bisa Ditunggu",
      subtitle: "Ganti LCD, Baterai Kembung, Matot & Port Cas",
      image: "/images/products/samsung-galaxy-m30s.jpg",
      gradeBadge: "⚡ 45-90 Menit",
      specs: [
        { label: "Pengerjaan", value: "Bisa Ditunggu" },
        { label: "Pengecekan", value: "Gratis Tanpa Syarat" },
        { label: "Garansi", value: "Hingga 30 Hari" },
      ],
      ctaText: "Cek Biaya Service HP",
      ctaHref: "/service",
      ctaType: "link",
    });

    list.push({
      id: "slide-trade-in",
      type: "trade-in",
      tag: "Tukar Tambah Resmi",
      title: "Tukar Tambah HP Lama ke Baru",
      subtitle: "Bawa HP lamamu, pulang bawa HP idaman hari ini",
      image: "/images/products/infinix-smart-20.jpg",
      gradeBadge: "🔄 Estimasi Cepat",
      specs: [
        { label: "Estimasi", value: "Langsung via WA" },
        { label: "Nilai Tukar", value: "Transparan & Adil" },
        { label: "COD", value: "Area Banjarnegara" },
      ],
      ctaText: "Hitung Tukar Tambah",
      ctaHref: "#tukar-tambah",
      ctaType: "link",
    });

    return list;
  }, [featuredPhone1, featuredPhone2]);

  // Auto-slide every 3.5 seconds with Instagram-Story style loop
  useEffect(() => {
    if (isPaused || slides.length === 0) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const currentSlide = slides[activeSlide] ?? slides[0];

  function handleGeneralWhatsAppClick() {
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp...",
      description: "Chat admin dibuka di tab baru.",
    });
  }

  function handleCardClick() {
    if (currentSlide?.productData) {
      openQuickView(currentSlide.productData);
    }
  }

  return (
    <section
      id="beranda"
      className="relative scroll-mt-24 sm:scroll-mt-28 overflow-hidden mesh-gradient-light pt-4 sm:pt-6 pb-12 sm:pb-16"
    >
      {/* Decorative ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-gradient-to-br from-royal-200/50 to-cyan-200/40 blur-3xl animate-subtle-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-48 -left-24 size-72 rounded-full bg-gradient-to-tr from-emerald-200/30 to-cyan-200/20 blur-3xl"
      />

      <Container className="relative py-6 sm:py-10 lg:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Kolom Kiri: Teks Hero & Keunggulan Toko */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-royal-200/80 bg-white/80 px-4 py-1.5 text-xs font-semibold text-royal-800 shadow-xs backdrop-blur-md">
              <MapPin className="size-3.5 text-royal-600 shrink-0" aria-hidden="true" />
              <span>Konter HP Terpercaya di Banjarmangu, Banjarnegara</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Pusat{" "}
              <span className="gradient-text">HP Bekas Bergaransi</span>,
              Unit Baru & Layanan Service
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
              Setiap unit lolos uji teknisi ketat, kondisi transparan apa adanya, dan siap COD.
              Layar HP pecah atau baterai boros? Kami juga melayani <strong>Service HP cepat yang bisa ditunggu</strong>.
            </p>

            {/* Tombol Aksi Utama */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#hp-bekas"
                className="group/btn inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 text-base font-bold text-white shadow-lg shadow-royal-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-royal-600/35 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 cursor-pointer"
              >
                Lihat Katalog HP
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/service"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-royal-200 bg-white/90 px-5 text-sm sm:text-base font-bold text-royal-700 shadow-sm transition-all duration-300 hover:border-royal-400 hover:bg-royal-50 hover:-translate-y-0.5 cursor-pointer"
              >
                <Wrench className="size-4 text-cyan-600" aria-hidden="true" />
                Layanan Service HP
              </Link>
              <WhatsAppLink
                href={buildGeneralInquiryUrl()}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleGeneralWhatsAppClick}
              >
                Chat Admin WA
              </WhatsAppLink>
            </div>

            {/* AUTHENTIC LOCAL TRUST TICKER */}
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-royal-100 to-cyan-50 text-base shadow-xs">
                  📍
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    Datang Langsung ke Toko
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                    Bisa cek unit & servis santai
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-base shadow-xs">
                  🤝
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    Bisa COD & Antar Area
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                    Transaksi aman di tempat
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/85 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-50 text-base shadow-xs">
                  ⚡
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    Pengerjaan Cepat
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                    Servis ditunggu 45-90 menit
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Kinetic Bento Hero & Motion Clip Showcase */}
          <div
            className="relative mx-auto w-full max-w-sm sm:max-w-md animate-fade-up lg:max-w-sm"
            style={{ animationDelay: "140ms" }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Ambient background glow */}
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-royal-300/40 via-cyan-200/25 to-emerald-200/20 blur-2xl animate-subtle-glow"
            />

            {/* Floating Bento Badge 1: Status Toko Real-time (Gentle Float) */}
            <div className="absolute -top-4 -right-3 sm:-top-5 sm:-right-4 hidden items-center gap-2 rounded-2xl glass border border-white/90 px-3.5 py-2 shadow-lg shadow-royal-950/10 animate-float pointer-events-auto z-20 sm:flex">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                  Buka Hari Ini
                </span>
                <span className="text-[9px] font-semibold text-emerald-700 leading-tight">
                  07.30 - 21.00 WIB
                </span>
              </div>
            </div>

            {/* Floating Bento Badge 2: Shortcut Service HP (Gentle Float Delayed) */}
            <Link
              href="/service"
              className="absolute top-24 -left-3 sm:top-24 sm:-left-6 hidden items-center gap-2 rounded-2xl glass border border-white/90 px-3.5 py-2 shadow-lg shadow-royal-950/10 animate-float-delayed pointer-events-auto z-20 transition-all duration-300 hover:scale-105 hover:border-royal-300 sm:flex cursor-pointer"
            >
              <span className="flex size-7.5 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-royal-600 text-white shadow-xs">
                <Wrench className="size-4" aria-hidden="true" />
              </span>
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-extrabold text-slate-900 leading-tight">
                  Cek Biaya Service
                </span>
                <span className="text-[9px] font-bold text-cyan-700 leading-tight">
                  ⚡ Bisa Ditunggu
                </span>
              </div>
            </Link>

            {/* Main Interactive Bento Showcase Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/85 bg-white/95 p-3.5 shadow-[--shadow-card-glow] backdrop-blur-md transition-all duration-500 hover:shadow-[--shadow-card-hover-glow]">
              {/* Instagram Story / Motion Clip Progress Bar Tabs */}
              <div className="mb-2.5 flex items-center gap-1.5 px-0.5">
                {slides.map((slide, idx) => {
                  const isActive = activeSlide === idx;
                  const isPast = idx < activeSlide;

                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Lihat slide ${idx + 1}: ${slide.title}`}
                      className="group/tab relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/90 transition-all cursor-pointer"
                    >
                      <div
                        className={cn(
                          "size-full rounded-full bg-brand-gradient transition-all duration-300",
                          isPast && "w-full",
                          isActive && !isPaused && "animate-[shimmer_3.5s_linear_forwards] w-full",
                          isActive && isPaused && "w-full opacity-90",
                          !isActive && !isPast && "w-0",
                        )}
                      />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  title={isPaused ? "Lanjutkan putar otomatis" : "Jeda slide"}
                  aria-label={isPaused ? "Lanjutkan putar" : "Jeda"}
                  className="ml-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {isPaused ? (
                    <Play className="size-3" aria-hidden="true" />
                  ) : (
                    <Pause className="size-3" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Visual Image Showcase Box */}
              <div
                onClick={handleCardClick}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 via-royal-50/20 to-slate-50",
                  currentSlide.productData && "cursor-pointer",
                )}
              >
                {failedImages[currentSlide.image] ? (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400">
                    <Sparkles className="size-8" aria-hidden="true" />
                    <span className="text-[11px] font-medium">{currentSlide.title}</span>
                  </div>
                ) : requiresNativeImage(currentSlide.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={currentSlide.image}
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [currentSlide.image]: true }))
                    }
                  />
                ) : (
                  <Image
                    key={currentSlide.image}
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    fill
                    priority
                    sizes="(min-width: 1024px) 384px, 90vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                    onError={() =>
                      setFailedImages((prev) => ({ ...prev, [currentSlide.image]: true }))
                    }
                  />
                )}

                {/* Overlaid Badges */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 z-10 pointer-events-none">
                  <span className="glass rounded-full px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
                    {currentSlide.gradeBadge}
                  </span>
                  <div className="pointer-events-auto">
                    {currentSlide.productData ? (
                      <StatusBadge status={currentSlide.productData.status} />
                    ) : (
                      <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        Tersedia Setiap Hari
                      </span>
                    )}
                  </div>
                </div>

                {/* Motion Tag indicator pill */}
                <div className="absolute bottom-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md">
                    <Sparkles className="size-3 text-cyan-400" aria-hidden="true" />
                    {currentSlide.tag}
                  </span>
                </div>
              </div>

              {/* Info Details Section */}
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold tracking-wider text-royal-700 uppercase">
                    {currentSlide.tag}
                  </p>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Slide {activeSlide + 1} dari {slides.length}
                  </span>
                </div>

                <h2 className="mt-1 line-clamp-1 text-base sm:text-lg font-bold text-slate-900">
                  {currentSlide.title}
                </h2>
                <p className="line-clamp-1 text-xs text-slate-500">
                  {currentSlide.subtitle}
                </p>

                {/* Spec / Benefit Highlights Pills */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {currentSlide.specs.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      <Check className="size-3 text-royal-600" aria-hidden="true" />
                      {item.label}: <strong className="font-bold text-slate-900">{item.value}</strong>
                    </span>
                  ))}
                </div>

                {/* Pricing (for products) */}
                {currentSlide.price !== undefined && (
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-xl font-extrabold text-royal-700">
                      {formatRupiah(currentSlide.price)}
                    </p>
                    {currentSlide.originalPrice && (
                      <p className="text-xs text-slate-400 line-through">
                        {formatRupiah(currentSlide.originalPrice)}
                      </p>
                    )}
                  </div>
                )}

                {/* Action CTA */}
                <div className="mt-3">
                  {currentSlide.ctaType === "whatsapp" ? (
                    <WhatsAppLink
                      href={currentSlide.ctaHref}
                      size="md"
                      className="w-full justify-center"
                    >
                      {currentSlide.ctaText}
                    </WhatsAppLink>
                  ) : (
                    <Link
                      href={currentSlide.ctaHref}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition-all duration-300 hover:shadow-lg hover:shadow-royal-600/35 hover:-translate-y-0.5 cursor-pointer"
                    >
                      {currentSlide.ctaText}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Keunggulan Garansi di Bawah Hero */}
        <div
          className="mt-12 grid animate-fade-up gap-3.5 sm:mt-16 sm:grid-cols-3 sm:gap-5"
          style={{ animationDelay: "260ms" }}
        >
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.title}
              className="group/trust flex items-start gap-3.5 rounded-2xl border border-slate-200/70 bg-white/80 p-4.5 shadow-xs backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-royal-100 to-royal-50 text-royal-700 transition-transform duration-300 group-hover/trust:scale-110">
                <badge.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {badge.title}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
