import type { Metadata } from "next";

import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { TrackClient } from "@/components/track/track-client";

export const metadata: Metadata = {
  title: "Lacak Pesanan, Servis HP & E-Warranty",
  description:
    "Lacak status pesanan COD, progres service HP teknisi, dan cetak Kartu Garansi Elektronik resmi Konter Fajar Cell.",
};

export default function LacakPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[70dvh] focus:outline-none">
        <TrackClient />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
