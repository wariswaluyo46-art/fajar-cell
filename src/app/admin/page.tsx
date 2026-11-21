import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ProductsProvider } from "@/components/catalog/products-provider";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Admin",
  description:
    "Dashboard pengelolaan stok, harga, dan status unit Konter Fajar Cell.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const initialProducts = getAllProducts();

  return (
    <ProductsProvider initialProducts={initialProducts}>
      <AdminDashboard />
    </ProductsProvider>
  );
}
