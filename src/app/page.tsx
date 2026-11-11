import { QuickViewProvider } from "@/components/catalog/quick-view-provider";
import { AiAssistant } from "@/components/ai/ai-assistant";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { HomeCatalogs } from "@/components/sections/home-catalogs";
import { LocationSection } from "@/components/sections/location-section";
import { ServicePreviewBanner } from "@/components/sections/service-preview-banner";
import { TradeInSection } from "@/components/sections/trade-in-section";
import { HeroMarqueeSection } from "@/components/ui/infinite-marquee";

export default function HomePage() {
  return (
    <>
      <a
        href="#hp-bekas"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-royal-700 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Lewati ke katalog
      </a>
      <Navbar />
      <main className="overflow-x-hidden">
        <QuickViewProvider>
          <Hero />
          <HeroMarqueeSection />
          <HomeCatalogs />
        </QuickViewProvider>
        <ServicePreviewBanner />
        <TradeInSection />
        <LocationSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <AiAssistant />
    </>
  );
}
