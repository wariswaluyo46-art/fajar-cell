import type { Metadata } from "next";

import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Checkout Pesanan — COD & Pengambilan di Toko",
  description:
    "Selesaikan pembelian HP bekas bergaransi, HP baru, atau aksesoris di Konter Fajar Cell dengan kalkulasi ongkir COD otomatis, QRIS, dan DANA.",
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[70dvh] focus:outline-none">
        <CheckoutClient />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
