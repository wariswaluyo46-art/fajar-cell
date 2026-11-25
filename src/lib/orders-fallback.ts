import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import type {
  AdminOrderTransitionResult,
  CreateOrderInput,
  CreateOrderResult,
  Order,
  OrderItem,
  OrderStatus,
  Product,
} from "@/types";

import {
  fallbackGetAvailabilityMap,
  fallbackGetSessionReservations,
  fallbackReleaseSession,
} from "./cart-fallback";
import { ORDER_ALLOWED_TRANSITIONS } from "./order-constants";

const globalForOrdersFallback = globalThis as typeof globalThis & {
  kfcOrdersFallbackStore?: Map<string, Order>;
};

function getStore(): Map<string, Order> {
  if (!globalForOrdersFallback.kfcOrdersFallbackStore) {
    globalForOrdersFallback.kfcOrdersFallbackStore = new Map();
  }
  return globalForOrdersFallback.kfcOrdersFallbackStore;
}

function generateOrderCode(store: Map<string, Order>): string {
  const now = new Date();
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");

  for (let i = 0; i < 10; i += 1) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const code = `FC-${jakartaDate}-${suffix}`;
    if (!store.has(code)) return code;
  }

  return `FC-${jakartaDate}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

export function fallbackCreateOrderFromCart(
  input: CreateOrderInput,
  products: Product[],
): CreateOrderResult {
  const store = getStore();
  const reservations = fallbackGetSessionReservations(input.sessionId);

  if (reservations.length === 0) {
    return {
      ok: false,
      code: "CART_EMPTY_OR_EXPIRED",
      message: "Keranjang kosong atau masa reservasi 15 menit sudah habis.",
    };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const availabilityMap = fallbackGetAvailabilityMap(products, input.sessionId);

  let subtotal = 0;
  const orderId = randomUUID();
  const nowIso = new Date().toISOString();
  const items: OrderItem[] = [];

  for (const res of reservations) {
    const product = productMap.get(res.productId);
    if (!product || product.status !== "ready" || product.stock <= 0) {
      return {
        ok: false,
        code: "OUT_OF_STOCK",
        productId: res.productId,
        message: `Produk "${product?.name ?? res.productId}" sudah tidak tersedia.`,
      };
    }

    const available = availabilityMap.get(product.id)?.availableStock ?? 0;
    if (res.quantity > available) {
      return {
        ok: false,
        code: "INSUFFICIENT_STOCK",
        productId: product.id,
        message: `Stok "${product.name}" tidak mencukupi (tersedia ${available} unit).`,
      };
    }

    subtotal += product.price * res.quantity;
    items.push({
      id: randomUUID(),
      orderId,
      productId: product.id,
      productName: product.name,
      productImage: product.thumbnail,
      unitPrice: product.price,
      quantity: res.quantity,
      warrantyDays:
        product.category !== "aksesoris" && product.warranty.active
          ? product.warranty.durationDays
          : 0,
      createdAt: nowIso,
    });
  }

  const shippingFee =
    input.deliveryMethod === "pickup"
      ? 0
      : Math.max(0, Math.trunc(input.shippingFee ?? 0));
  const uniqueCode =
    input.paymentMethod === "cod"
      ? 0
      : Math.max(0, Math.min(999, Math.trunc(input.paymentUniqueCode ?? 0)));
  const totalAmount = subtotal + shippingFee + uniqueCode;
  const proofUrl = input.paymentProofUrl?.trim() || null;
  const initialStatus: OrderStatus =
    (input.paymentMethod === "qris" || input.paymentMethod === "dana") &&
    proofUrl
      ? "payment_review"
      : "pending_approval";

  const orderCode = generateOrderCode(store);
  const order: Order = {
    id: orderId,
    orderCode,
    sessionId: input.sessionId,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    deliveryMethod: input.deliveryMethod,
    paymentMethod: input.paymentMethod,
    paymentUniqueCode: uniqueCode,
    paymentProofUrl: proofUrl,
    destinationAddress: input.destinationAddress?.trim() ?? "",
    destinationLat: input.destinationLat ?? null,
    destinationLng: input.destinationLng ?? null,
    distanceKm: Number(input.distanceKm ?? 0),
    shippingFee,
    subtotal,
    totalAmount,
    notes: input.notes?.trim() ?? "",
    status: initialStatus,
    stockDeducted: false,
    adminNotes: "",
    approvedAt: null,
    completedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    items,
    history: [
      {
        id: randomUUID(),
        orderId,
        fromStatus: null,
        toStatus: initialStatus,
        changedBy: "customer",
        note:
          initialStatus === "payment_review"
            ? "Pesanan dibuat dengan bukti pembayaran."
            : "Pesanan dibuat dan menunggu konfirmasi admin.",
        createdAt: nowIso,
      },
    ],
  };

  store.set(orderCode, order);
  fallbackReleaseSession(input.sessionId);

  return {
    ok: true,
    orderId,
    orderCode,
    status: initialStatus,
    subtotal,
    shippingFee,
    paymentUniqueCode: uniqueCode,
    totalAmount,
  };
}

export function fallbackGetOrderByCode(orderCode: string): Order | null {
  return getStore().get(orderCode.toUpperCase()) ?? null;
}

export function fallbackListOrders(): Order[] {
  return Array.from(getStore().values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function fallbackTransitionOrder(
  orderId: string,
  nextStatus: OrderStatus,
  adminNote = "",
): AdminOrderTransitionResult {
  const store = getStore();
  let target: Order | undefined;

  for (const order of store.values()) {
    if (order.id === orderId) {
      target = order;
      break;
    }
  }

  if (!target) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Pesanan tidak ditemukan.",
    };
  }

  if (target.status === nextStatus) {
    return {
      ok: true,
      unchanged: true,
      orderId: target.id,
      orderCode: target.orderCode,
      fromStatus: target.status,
      toStatus: nextStatus,
      stockDeducted: target.stockDeducted,
    };
  }

  const allowed = ORDER_ALLOWED_TRANSITIONS[target.status];
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      code: "INVALID_TRANSITION",
      message: `Transisi status dari "${target.status}" ke "${nextStatus}" tidak diizinkan.`,
    };
  }

  const trimmedNote = adminNote.trim();
  if (
    (nextStatus === "rejected" || nextStatus === "cancelled") &&
    trimmedNote === ""
  ) {
    return {
      ok: false,
      code: "NOTE_REQUIRED",
      message: "Alasan penolakan atau pembatalan wajib diisi.",
    };
  }

  const nowIso = new Date().toISOString();
  const prevStatus = target.status;

  let stockDeducted = target.stockDeducted;
  if (
    nextStatus === "approved" ||
    nextStatus === "out_for_delivery" ||
    nextStatus === "ready_for_pickup" ||
    nextStatus === "completed"
  ) {
    stockDeducted = true;
  } else if (
    nextStatus === "rejected" ||
    nextStatus === "cancelled" ||
    nextStatus === "expired"
  ) {
    stockDeducted = false;
  }

  const updated: Order = {
    ...target,
    status: nextStatus,
    stockDeducted,
    adminNotes: trimmedNote !== "" ? trimmedNote : target.adminNotes,
    approvedAt:
      nextStatus === "approved" && !target.approvedAt
        ? nowIso
        : target.approvedAt,
    completedAt:
      nextStatus === "completed" && !target.completedAt
        ? nowIso
        : target.completedAt,
    updatedAt: nowIso,
    history: [
      ...(target.history ?? []),
      {
        id: randomUUID(),
        orderId: target.id,
        fromStatus: prevStatus,
        toStatus: nextStatus,
        changedBy: "admin",
        note: trimmedNote,
        createdAt: nowIso,
      },
    ],
  };

  store.set(updated.orderCode, updated);

  return {
    ok: true,
    orderId: updated.id,
    orderCode: updated.orderCode,
    fromStatus: prevStatus,
    toStatus: nextStatus,
    stockDeducted,
  };
}
