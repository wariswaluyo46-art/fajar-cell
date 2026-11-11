"use client";

import {
  Headphones,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Repeat2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Type,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { NAV_ITEMS } from "@/lib/constants";
import { defaultStoreSettings } from "@/lib/store";
import { cn } from "@/lib/utils";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";

const NAV_ICONS: Record<string, LucideIcon> = {
  "#beranda": Home,
  "#hp-bekas": Smartphone,
  "#hp-baru": Sparkles,
  "#aksesoris": Headphones,
  "/service": Wrench,
  "#tukar-tambah": Repeat2,
  "#lokasi": MapPin,
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(
    pathname === "/service" ? "/service" : NAV_ITEMS[0]?.href ?? "#beranda",
  );
  const [scrolled, setScrolled] = useState(false);
  const [isElderMode, setIsElderMode] = useState(false);

  const store = defaultStoreSettings;

  // Initialize Elder Mode from localStorage on client-side
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kfc_elder_mode") === "true";
      if (stored) {
        requestAnimationFrame(() => {
          setIsElderMode(true);
        });
        document.documentElement.classList.add("elder-mode");
      }
    } catch {
      // Ignore if localStorage not accessible
    }
  }, []);

  const toggleElderMode = () => {
    const next = !isElderMode;
    setIsElderMode(next);
    try {
      localStorage.setItem("kfc_elder_mode", String(next));
    } catch {
      // Ignore
    }
    document.documentElement.classList.toggle("elder-mode", next);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Robust ScrollSpy when on homepage
  useEffect(() => {
    if (pathname !== "/") {
      requestAnimationFrame(() => {
        setActiveSection(pathname);
      });
      return;
    }

    const sectionIds = NAV_ITEMS.filter((item) => item.href.startsWith("#")).map(
      (item) => item.href.replace("#", ""),
    );

    const handleScrollSpy = () => {
      const scrollPosition = window.scrollY + 130;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (window.scrollY + windowHeight >= documentHeight - 60) {
        setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].href);
        return;
      }

      let currentSectionId = sectionIds[0];

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            currentSectionId = id;
          }
        }
      }

      setActiveSection(`#${currentSectionId}`);
    };

    handleScrollSpy();
    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    window.addEventListener("resize", handleScrollSpy);

    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
      window.removeEventListener("resize", handleScrollSpy);
    };
  }, [pathname]);

  const closeMenu = () => setIsOpen(false);

  // Smooth scroll handler dengan offset kompensasi floating navbar & multi-page router
  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    closeMenu();

    if (href.startsWith("#")) {
      if (pathname !== "/") {
        // Jika sedang di halaman /service, arahkan kembali ke homepage dengan anchor
        router.push(`/${href}`);
        return;
      }

      event.preventDefault();
      const targetId = href.replace("#", "");
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const headerOffset = 90;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
        setActiveSection(href);

        if (window.history.pushState) {
          window.history.pushState(null, "", href);
        }
      }
    } else {
      // Navigasi route biasa (misal: /service)
      setActiveSection(href);
    }
  };

  return (
    <>
      {/* Top bar tipis & elegan: Garansi, Kontak & Elder-Mode Toggle */}
      <div className="bg-gradient-to-r from-royal-950 via-[#1E1B4B] to-royal-950 text-royal-100 text-[10px] sm:text-[11px] font-medium py-1.5 border-b border-white/5">
        <Container className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 truncate">
            <ShieldCheck className="size-3 sm:size-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
            <span className="truncate">Garansi Toko Resmi • Unit Original • Siap COD Banjarnegara</span>
          </p>
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Tombol Aksesibilitas "Mode Teks Jelas" untuk Orang Tua & Lansia */}
            <button
              type="button"
              onClick={toggleElderMode}
              aria-pressed={isElderMode}
              title="Perbesar huruf & pertajam kontras agar mudah dibaca"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-95",
                isElderMode
                  ? "bg-amber-400 text-slate-950 shadow-xs shadow-amber-400/30"
                  : "bg-white/10 text-royal-200 hover:bg-white/20 hover:text-white",
              )}
            >
              <Type className="size-3 shrink-0" aria-hidden="true" />
              <span>{isElderMode ? "Mode Jelas: AKTIF" : "Aa Perjelas Teks"}</span>
            </button>

            <span className="hidden sm:inline-block text-royal-300">Setiap Hari : 07.30 - 21.00</span>
            <span className="hidden sm:inline-block h-3 w-px bg-white/20" aria-hidden="true" />
            <a
              href={buildGeneralInquiryUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <MessageCircle className="size-3 sm:size-3.5" aria-hidden="true" />
              <span>{store.displayPhone}</span>
            </a>
          </div>
        </Container>
      </div>

      {/* Floating Glassmorphic Navbar */}
      <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8 pointer-events-none">
        <div
          className={cn(
            "pointer-events-auto mx-auto max-w-7xl rounded-2xl sm:rounded-3xl border transition-all duration-300 backdrop-blur-xl",
            scrolled
              ? "bg-white/85 border-white/60 shadow-xl shadow-slate-900/10 supports-[backdrop-filter]:bg-white/80"
              : "bg-white/90 border-white/40 shadow-lg shadow-slate-900/5 supports-[backdrop-filter]:bg-white/85",
          )}
        >
          <div className="flex h-15 sm:h-16 items-center justify-between px-3 sm:px-5 gap-3">
            {/* Logo Brand */}
            <Link
              href="/"
              onClick={(event) => handleNavClick(event, "#beranda")}
              className="flex items-center gap-2.5 rounded-xl transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 shrink-0"
            >
              <span className="flex size-9.5 sm:size-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-extrabold tracking-tight text-white shadow-md shadow-royal-600/30">
                FC
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[14px] font-extrabold tracking-tight text-slate-900 sm:text-base">
                  Konter Fajar Cell
                </span>
                <span className="hidden text-[10px] font-semibold text-slate-500 sm:block">
                  HP Bekas Bergaransi • Servis HP • Siap COD
                </span>
              </span>
            </Link>

            {/* Desktop Navigation Links dengan Ikon Mini Elegan */}
            <nav
              className="hidden items-center gap-1 xl:gap-1.5 lg:flex"
              aria-label="Navigasi utama"
            >
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/service"
                    ? pathname === "/service"
                    : activeSection === item.href && pathname === "/";
                const Icon = NAV_ICONS[item.href] ?? Home;

                return (
                  <Link
                    key={item.href}
                    href={item.href.startsWith("#") && pathname !== "/" ? `/${item.href}` : item.href}
                    onClick={(event) => handleNavClick(event, item.href)}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs xl:text-sm font-semibold transition-all duration-300 ease-out cursor-pointer",
                      isActive
                        ? "bg-brand-gradient font-bold text-white shadow-md shadow-royal-600/25 scale-[1.02]"
                        : "text-slate-600 hover:bg-royal-50/80 hover:text-royal-700 hover:scale-[1.03]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 transition-transform duration-300 group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-royal-600",
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2.5 lg:flex shrink-0">
              <WhatsAppLink href={buildGeneralInquiryUrl()} size="md">
                Chat Admin
              </WhatsAppLink>
            </div>

            {/* Mobile Controls: Chat WA Ringkas & Hamburger Menu */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={toggleElderMode}
                aria-pressed={isElderMode}
                className={cn(
                  "inline-flex h-9 items-center gap-1 rounded-xl px-2.5 text-xs font-bold transition-all cursor-pointer",
                  isElderMode
                    ? "bg-amber-400 text-slate-950 font-black"
                    : "border border-slate-200 bg-white text-slate-700",
                )}
              >
                <Type className="size-3.5" aria-hidden="true" />
                <span>{isElderMode ? "Aa Aktif" : "Aa"}</span>
              </button>

              <a
                href={buildGeneralInquiryUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat Admin via WhatsApp"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-wa-gradient px-3 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whatsapp-dark"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Chat WA</span>
              </a>

              <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
                aria-label={isOpen ? "Tutup menu" : "Buka menu navigasi"}
                className="inline-flex size-9.5 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 cursor-pointer"
              >
                {isOpen ? (
                  <X className="size-5 transition-transform duration-200 rotate-90" aria-hidden="true" />
                ) : (
                  <Menu className="size-5 transition-transform duration-200" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Panel Menu Mobile Slide-Down */}
          <div
            id="mobile-menu"
            className={cn(
              "lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-slate-100/80 rounded-b-2xl sm:rounded-b-3xl",
              isOpen
                ? "max-h-[85dvh] opacity-100 shadow-2xl"
                : "max-h-0 opacity-0 pointer-events-none",
            )}
          >
            <div className="bg-white/95 backdrop-blur-xl px-4 pt-3 pb-6">
              <nav className="flex flex-col gap-1" aria-label="Navigasi mobile">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/service"
                      ? pathname === "/service"
                      : activeSection === item.href && pathname === "/";
                  const Icon = NAV_ICONS[item.href] ?? Home;

                  return (
                    <Link
                      key={item.href}
                      href={item.href.startsWith("#") && pathname !== "/" ? `/${item.href}` : item.href}
                      onClick={(event) => handleNavClick(event, item.href)}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold transition-all duration-200 active:scale-[0.98]",
                        isActive
                          ? "bg-brand-gradient text-white shadow-sm"
                          : "text-slate-700 hover:bg-royal-50 hover:text-royal-700",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "size-4.5",
                            isActive ? "text-white" : "text-royal-600",
                          )}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.href === "/service" && (
                          <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-900">
                            Bisa Ditunggu
                          </span>
                        )}
                        {isActive && (
                          <span className="size-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Mode Teks Jelas Toggle Mobile Banner */}
              <div className="mt-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-royal-100 text-royal-700 font-extrabold text-sm">
                      Aa
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Mode Teks Jelas & Nyaman
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Bagus untuk lansia & kenyamanan membaca
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleElderMode}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer",
                      isElderMode
                        ? "bg-amber-400 text-slate-950"
                        : "bg-white border border-slate-200 text-slate-700",
                    )}
                  >
                    {isElderMode ? "Aktif" : "Aktifkan"}
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <WhatsAppLink
                  href={buildGeneralInquiryUrl()}
                  size="lg"
                  className="w-full"
                >
                  Chat Admin via WhatsApp
                </WhatsAppLink>
              </div>

              <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
                Setiap Hari : 07.30 - 21.00 • Siap COD • {store.displayPhone}
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
