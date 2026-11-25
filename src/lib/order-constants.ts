import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  Product,
  ServiceTicketStatus,
} from "@/types";

export const CART_RESERVATION_TTL_MINUTES = 15;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_approval: "Menunggu Konfirmasi Admin",
  payment_review: "Menunggu Verifikasi Pembayaran",
  approved: "Disetujui Admin",
  out_for_delivery: "Sedang Diantar Kurir COD",
  ready_for_pickup: "Siap Diambil di Konter",
  completed: "Selesai",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  expired: "Kedaluwarsa",
};

export const ORDER_ALLOWED_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pending_approval: [
    "payment_review",
    "approved",
    "rejected",
    "cancelled",
    "expired",
  ],
  payment_review: ["approved", "rejected", "cancelled", "expired"],
  approved: ["out_for_delivery", "ready_for_pickup", "completed", "cancelled"],
  out_for_delivery: ["completed", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  completed: [],
  rejected: [],
  cancelled: [],
  expired: [],
};

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  cod: "COD (Bayar / Antar ke Lokasi)",
  pickup: "Ambil di Toko (Self-Pickup)",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  qris: "QRIS",
  dana: "Transfer DANA",
  cod: "Bayar Tunai saat COD / di Toko",
};

export const SERVICE_TICKET_STATUS_LABELS: Record<ServiceTicketStatus, string> =
  {
    received: "Tiket Diterima",
    diagnosing: "Sedang Dicek Teknisi",
    waiting_parts: "Menunggu Sparepart",
    repairing: "Sedang Dikerjakan",
    ready_for_pickup: "Selesai & Siap Diambil",
    completed: "Sudah Diambil / Lunas",
    cancelled: "Dibatalkan",
  };

const ORDER_STATUS_SET = new Set<string>(Object.keys(ORDER_STATUS_LABELS));
const DELIVERY_METHOD_SET = new Set<string>(
  Object.keys(DELIVERY_METHOD_LABELS),
);
const PAYMENT_METHOD_SET = new Set<string>(Object.keys(PAYMENT_METHOD_LABELS));
const SERVICE_TICKET_STATUS_SET = new Set<string>(
  Object.keys(SERVICE_TICKET_STATUS_LABELS),
);

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUS_SET.has(value);
}

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return typeof value === "string" && DELIVERY_METHOD_SET.has(value);
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && PAYMENT_METHOD_SET.has(value);
}

export function isServiceTicketStatus(
  value: unknown,
): value is ServiceTicketStatus {
  return typeof value === "string" && SERVICE_TICKET_STATUS_SET.has(value);
}

export interface ProductAvailabilityState {
  effectiveAvailable: number;
  reservedByOthers: number;
  isSoldOut: boolean;
  isHeldByOthers: boolean;
  remainingToAdd: number;
  canAddToCart: boolean;
}

/** Hitung status stok efektif produk dengan memperhitungkan hold pengunjung lain & qty di keranjang sendiri. */
export function getProductAvailabilityInfo(
  product: Product,
  cartQty = 0,
): ProductAvailabilityState {
  const isSoldOut = product.status !== "ready" || product.stock <= 0;
  const effectiveAvailable = isSoldOut
    ? 0
    : Math.max(0, product.availableStock ?? product.stock);
  const reservedByOthers = Math.max(0, product.reservedByOthers ?? 0);
  const isHeldByOthers =
    !isSoldOut && effectiveAvailable === 0 && reservedByOthers > 0;
  const remainingToAdd = Math.max(0, effectiveAvailable - cartQty);
  const canAddToCart = !isSoldOut && !isHeldByOthers && remainingToAdd > 0;

  return {
    effectiveAvailable,
    reservedByOthers,
    isSoldOut,
    isHeldByOthers,
    remainingToAdd,
    canAddToCart,
  };
}
