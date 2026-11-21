import type { Metadata } from "next";

import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { LocationSection } from "@/components/sections/location-section";
import { ServiceSection } from "@/components/sections/service-section";

export const metadata: Metadata = {
  title: "Service HP Banjarnegara — Cek Gratis, Bisa Ditunggu & Bergaransi",
  description:
    "Pusat service HP cepat & bergaransi di Banjarmangu, Banjarnegara. Ganti LCD, baterai kembung, konektor cas, mati total, bootloop, kena air. Pengecekan 100% gratis!",
  keywords: [
    "Service HP Banjarnegara",
    "Ganti LCD HP Banjarmangu",
    "Ganti Baterai HP Banjarnegara",
    "Service HP Bisa Ditunggu",
    "Reparasi HP Kendaga",
    "Service HP Mati Total Banjarnegara",
    "Konter Servis HP Terdekat",
  ],
  openGraph: {
    title: "Service HP Banjarnegara — Bisa Ditunggu & Garansi Toko Resmi",
    description:
      "Perbaikan HP cepat mulai 45 menit. Konsultasi kerusakan gratis di Konter Fajar Cell Kendaga, Banjarmangu, Banjarnegara.",
    url: "/service",
  },
};

export default function ServicePage() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="overflow-x-hidden pt-4 sm:pt-6 focus:outline-none"
      >
        <ServiceSection />
        <LocationSection />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
