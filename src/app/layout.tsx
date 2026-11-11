import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Konter Fajar Cell - Pusat HP Bekas Bergaransi, HP Baru & Aksesoris Original",
    template: "%s | Konter Fajar Cell Banjarnegara",
  },
  description:
    "Pusat jual beli HP bekas bergaransi, unit baru segel distributor, dan aksesoris original di Banjarnegara. Alamat: Jl. Raya Melikan, Desa Kendaga, Kec. Banjarmangu, Kab. Banjarnegara, Jawa Tengah 53452. Siap COD & tukar tambah!",
  keywords: [
    "Konter HP Banjarnegara",
    "Jual Beli HP Bekas Banjarmangu",
    "Tukar Tambah HP Banjarnegara",
    "Fajar Cell Kendaga",
    "Aksesoris HP Original",
    "HP Second Bergaransi Banjarnegara",
    "Konter HP Murah Banjarmangu",
    "COD HP Banjarnegara",
  ],
  authors: [{ name: "Konter Fajar Cell" }],
  creator: "Konter Fajar Cell",
  publisher: "Konter Fajar Cell",
  formatDetection: {
    telephone: true,
    address: true,
    email: false,
  },
  openGraph: {
    title:
      "Konter Fajar Cell - Pusat HP Bekas Bergaransi, HP Baru & Aksesoris Original",
    description:
      "Toko HP terpercaya di Banjarmangu, Banjarnegara. Cek unit sepuasnya di Jl. Raya Melikan, Desa Kendaga, atau pesan antar COD.",
    url: "/",
    siteName: "Konter Fajar Cell",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/products/infinix-smart-20.jpg",
        width: 800,
        height: 800,
        alt: "Konter Fajar Cell Banjarnegara",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konter Fajar Cell - HP Bekas Bergaransi & Aksesoris Banjarnegara",
    description:
      "Pusat jual beli HP bekas & baru bergaransi di Banjarmangu, Banjarnegara. Buka Setiap Hari 07.30 - 21.00 WIB. Siap COD!",
    images: ["/images/products/infinix-smart-20.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2457eb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh bg-[#F8FAFC] font-sans text-slate-900 antialiased overflow-x-hidden">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
