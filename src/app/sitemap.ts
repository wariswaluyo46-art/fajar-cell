import type { MetadataRoute } from "next";

import { getAllProducts } from "@/lib/products";
import { listProducts } from "@/lib/products-db";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  let productsList: Product[] = [];
  try {
    productsList = await listProducts();
  } catch (error) {
    console.warn("Gagal memuat produk dari database untuk sitemap, beralih ke data lokal:", error);
    productsList = getAllProducts();
  }

  if (!productsList || productsList.length === 0) {
    productsList = getAllProducts();
  }

  // Filter produk yang aktif (ready stock atau memiliki stok)
  const activeProducts = productsList.filter(
    (product) => product.status === "ready" || product.stock > 0,
  );

  const productEntries: MetadataRoute.Sitemap = activeProducts.map((product) => {
    let lastMod = new Date();
    if (product.updatedAt) {
      const parsedDate = new Date(product.updatedAt);
      if (!isNaN(parsedDate.getTime())) {
        lastMod = parsedDate;
      }
    }

    return {
      url: `${baseUrl}/?product=${encodeURIComponent(product.slug || product.id)}`,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: product.featured ? 0.9 : 0.8,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...productEntries,
  ];
}

