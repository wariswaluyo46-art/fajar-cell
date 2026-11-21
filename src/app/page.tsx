import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { ProductsProvider } from "@/components/catalog/products-provider";
import { QuickViewProvider } from "@/components/catalog/quick-view-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { HomeCatalogs } from "@/components/sections/home-catalogs";
import { LocationSection } from "@/components/sections/location-section";
import { ServicePreviewBanner } from "@/components/sections/service-preview-banner";
import { TradeInSection } from "@/components/sections/trade-in-section";
import { HeroMarqueeSection } from "@/components/ui/infinite-marquee";
import { getAllProducts } from "@/lib/products";

export default function HomePage() {
  const initialProducts = getAllProducts();

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="overflow-x-hidden focus:outline-none">
        <ProductsProvider initialProducts={initialProducts}>
          <QuickViewProvider>
            <Hero />
            <HeroMarqueeSection />
            <HomeCatalogs />
          </QuickViewProvider>
        </ProductsProvider>
        <ServicePreviewBanner />
        <TradeInSection />
        <LocationSection />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
