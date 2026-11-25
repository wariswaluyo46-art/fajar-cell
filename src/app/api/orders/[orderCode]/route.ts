import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { getCartSessionId } from "@/lib/cart-session";
import { getOrderByCodeSafe } from "@/lib/orders-db";
import type { Order } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORDER_CODE_PATTERN = /^FC-\d{8}-[A-Z0-9]{4}$/i;

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `••••••${digits.slice(-4)}`;
}

function sanitizeOrderForPublic(
  order: Order,
  isOwnerOrAdmin: boolean,
): Omit<Order, "sessionId"> {
  const { sessionId: _omitted, ...rest } = order;
  void _omitted;

  if (isOwnerOrAdmin) {
    return rest;
  }

  return {
    ...rest,
    customerPhone: maskPhone(rest.customerPhone),
    destinationAddress:
      rest.deliveryMethod === "pickup"
        ? rest.destinationAddress
        : "Alamat pengantaran disembunyikan untuk privasi",
    destinationLat: null,
    destinationLng: null,
    paymentProofUrl: null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderCode: string }> },
): Promise<Response> {
  const { orderCode } = await context.params;
  const normalized = orderCode.trim().toUpperCase();

  if (!ORDER_CODE_PATTERN.test(normalized)) {
    return apiError("Kode pesanan tidak valid.", 400);
  }

  try {
    const { order } = await getOrderByCodeSafe(normalized);
    if (!order) {
      return apiError("Pesanan tidak ditemukan.", 404);
    }

    const [sessionId, adminSession] = await Promise.all([
      getCartSessionId(),
      getAdminSession(),
    ]);
    const isOwnerOrAdmin = Boolean(
      adminSession || (sessionId && order.sessionId === sessionId),
    );

    return apiJson({
      success: true,
      order: sanitizeOrderForPublic(order, isOwnerOrAdmin),
    });
  } catch (error) {
    console.error(`GET /api/orders/${normalized} gagal:`, error);
    return apiError("Gagal memuat detail pesanan.", 500);
  }
}
