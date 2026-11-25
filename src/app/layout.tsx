import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/cart-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { defaultStoreSettings } from "@/lib/store";

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
  const store = defaultStoreSettings;
  const instagramUrl = store.instagram
    ? `https://www.instagram.com/${store.instagram.replace(/^@/, "")}/`
    : undefined;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "MobilePhoneStore",
    name: store.name,
    description:
      "Pusat jual beli HP bekas bergaransi, HP baru segel resmi, aksesoris original, tukar tambah, dan service HP bisa ditunggu di Banjarmangu, Banjarnegara.",
    url: siteUrl,
    image: `${siteUrl}/images/products/infinix-smart-20.jpg`,
    telephone: store.displayPhone,
    priceRange: "Rp 15.000 - Rp 1.500.000",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Raya Melikan, Desa Kendaga, Kec. Banjarmangu",
      addressLocality: "Banjarnegara",
      addressRegion: "Jawa Tengah",
      postalCode: "53452",
      addressCountry: "ID",
    },
    hasMap: store.mapsUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "07:30",
        closes: "21:00",
      },
    ],
    areaServed: store.codAreas,
    sameAs: [store.mapsUrl, ...(instagramUrl ? [instagramUrl] : [])],
  };

  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-dvh bg-[#F8FAFC] font-sans text-slate-900 antialiased overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[120] focus:inline-flex focus:min-h-[48px] focus:items-center focus:rounded-xl focus:bg-royal-700 focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-xl focus:outline-2 focus:outline-offset-2 focus:outline-amber-400"
        >
          Lewati ke konten utama
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
