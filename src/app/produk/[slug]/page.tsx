import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { ProductDetailClient } from "@/components/catalog/product-detail-client";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCartSessionId } from "@/lib/cart-session";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { getProductsAvailabilityMap } from "@/lib/orders-db";
import { getAllProducts } from "@/lib/products";
import { getProductBySlug } from "@/lib/products-db";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

async function resolveProduct(slug: string): Promise<Product | null> {
  try {
    const dbProduct = await getProductBySlug(slug);
    if (dbProduct) return dbProduct;
  } catch {
    // Fallback ke katalog lokal bila database tidak terjangkau
  }

  return (
    getAllProducts().find((item) => item.slug === slug || item.id === slug) ??
    null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    return {
      title: "Produk Tidak Ditemukan",
    };
  }

  const priceText = formatRupiah(product.price);
  const categoryLabel = PRODUCT_CATEGORY_LABELS[product.category];
  const description = `${product.name} (${categoryLabel}) — ${priceText}. ${product.description.slice(0, 140)}`;

  return {
    title: `${product.name} — ${priceText}`,
    description,
    openGraph: {
      title: `${product.name} (${priceText}) | Konter Fajar Cell`,
      description,
      url: `/produk/${encodeURIComponent(product.slug)}`,
      images: product.thumbnail ? [{ url: product.thumbnail }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await resolveProduct(slug);

  if (!product) {
    notFound();
  }

  const sessionId = await getCartSessionId();
  const availabilityMap = await getProductsAvailabilityMap(
    sessionId ?? undefined,
    [product],
  );
  const info = availabilityMap.get(product.id);
  const enrichedProduct: Product = info
    ? {
        ...product,
        availableStock: info.availableStock,
        reservedByOthers: info.reservedByOthers + info.pendingOrderQty,
      }
    : product;

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[70dvh] focus:outline-none">
        <ProductDetailClient product={enrichedProduct} />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
