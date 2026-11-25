import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LazyAiAssistant } from "@/components/ai/lazy-ai-assistant";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { OrderInvoiceClient } from "@/components/order/order-invoice-client";
import { getAdminSession } from "@/lib/admin-auth";
import { getCartSessionId } from "@/lib/cart-session";
import { getOrderByCodeSafe } from "@/lib/orders-db";

export const dynamic = "force-dynamic";

const ORDER_CODE_PATTERN = /^FC-\d{8}-[A-Z0-9]{4}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}): Promise<Metadata> {
  const { orderCode } = await params;
  return {
    title: `Invoice ${orderCode.toUpperCase()}`,
    description: `Detail invoice digital dan status pesanan ${orderCode.toUpperCase()} di Konter Fajar Cell.`,
    robots: { index: false, follow: false },
  };
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `••••••${digits.slice(-4)}`;
}

export default async function OrderInvoicePage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  const { orderCode } = await params;
  const normalized = orderCode.trim().toUpperCase();

  if (!ORDER_CODE_PATTERN.test(normalized)) {
    notFound();
  }

  const [{ order }, sessionId, adminSession] = await Promise.all([
    getOrderByCodeSafe(normalized),
    getCartSessionId(),
    getAdminSession(),
  ]);

  if (!order) {
    notFound();
  }

  const isOwnerOrAdmin = Boolean(
    adminSession || (sessionId && order.sessionId === sessionId),
  );

  const safeOrder = isOwnerOrAdmin
    ? { ...order, sessionId: undefined }
    : {
        ...order,
        sessionId: undefined,
        customerPhone: maskPhone(order.customerPhone),
        destinationAddress:
          order.deliveryMethod === "pickup"
            ? order.destinationAddress
            : "Alamat pengantaran disembunyikan untuk privasi",
        destinationLat: null,
        destinationLng: null,
        paymentProofUrl: null,
      };

  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="min-h-[70dvh] focus:outline-none">
        <OrderInvoiceClient order={safeOrder} />
      </main>
      <Footer />
      <LazyAiAssistant />
    </>
  );
}
