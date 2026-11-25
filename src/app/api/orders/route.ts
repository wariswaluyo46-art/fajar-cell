import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { getCartSessionId } from "@/lib/cart-session";
import {
  calculateRouteFromOrigin,
  isValidCoordinatePair,
} from "@/lib/geo-server";
import { isDeliveryMethod, isPaymentMethod } from "@/lib/order-constants";
import { createOrderFromCartSafe } from "@/lib/orders-db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getStorePaymentSettingsSafe } from "@/lib/store-settings-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16 * 1_024;
const CREATE_ORDER_LIMIT = 15;
const CREATE_ORDER_WINDOW_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidProofUrl(value: string): boolean {
  return (
    value.startsWith("/images/payment-proofs/") ||
    value.startsWith("https://")
  );
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `create-order:${getClientKey(request)}`,
    CREATE_ORDER_LIMIT,
    CREATE_ORDER_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak percobaan checkout. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return apiError(
      "Sesi keranjang tidak ditemukan atau sudah kedaluwarsa. Silakan ulangi dari keranjang.",
      400,
    );
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format data pesanan tidak valid.", 400);
  }

  const raw = body.value;
  const customerName =
    typeof raw.customerName === "string" ? raw.customerName.trim() : "";
  const customerPhone =
    typeof raw.customerPhone === "string" ? raw.customerPhone.trim() : "";
  const deliveryMethod = raw.deliveryMethod;
  const paymentMethod = raw.paymentMethod;
  const notes =
    typeof raw.notes === "string" ? raw.notes.trim().slice(0, 500) : "";

  if (customerName.length < 2 || customerName.length > 120) {
    return apiError("Nama lengkap wajib diisi (2–120 karakter).", 400);
  }

  const phoneDigits = customerPhone.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return apiError("Nomor WhatsApp tidak valid (9–15 digit).", 400);
  }

  if (!isDeliveryMethod(deliveryMethod)) {
    return apiError("Metode pengiriman tidak valid.", 400);
  }

  if (!isPaymentMethod(paymentMethod)) {
    return apiError("Metode pembayaran tidak valid.", 400);
  }

  if (deliveryMethod === "pickup" && paymentMethod === "cod") {
    // Tetap valid: bayar tunai saat ambil di konter
  }

  let destinationAddress =
    typeof raw.destinationAddress === "string"
      ? raw.destinationAddress.trim().slice(0, 400)
      : "";
  let destinationLat: number | null = null;
  let destinationLng: number | null = null;
  let distanceKm = 0;
  let shippingFee = 0;

  if (deliveryMethod === "cod") {
    if (destinationAddress.length < 5) {
      return apiError(
        "Alamat pengantaran COD wajib diisi lengkap (minimal 5 karakter).",
        400,
      );
    }

    if (!isValidCoordinatePair(raw.destinationLat, raw.destinationLng)) {
      return apiError(
        "Pilih titik lokasi tujuan COD pada peta terlebih dahulu.",
        400,
      );
    }

    destinationLat = raw.destinationLat as number;
    destinationLng = raw.destinationLng as number;

    const { settings } = await getStorePaymentSettingsSafe();
    const route = await calculateRouteFromOrigin(destinationLat, destinationLng, {
      lat: settings.storeLat,
      lng: settings.storeLng,
    });
    if (!route.shipping.codEligible) {
      return apiError(
        route.shipping.suggestion ??
          "Lokasi di luar jangkauan COD langsung (> 20 km).",
        400,
      );
    }

    distanceKm = route.distanceKm;
    shippingFee = route.shipping.shippingFee;
  } else {
    destinationAddress = destinationAddress || "Ambil langsung di Konter Fajar Cell";
  }

  let paymentUniqueCode = 0;
  let paymentProofUrl: string | null = null;

  if (paymentMethod === "qris" || paymentMethod === "dana") {
    const rawCode = raw.paymentUniqueCode;
    if (
      typeof rawCode !== "number" ||
      !Number.isInteger(rawCode) ||
      rawCode < 1 ||
      rawCode > 999
    ) {
      return apiError("Kode unik pembayaran tidak valid.", 400);
    }
    paymentUniqueCode = rawCode;

    const proof =
      typeof raw.paymentProofUrl === "string" ? raw.paymentProofUrl.trim() : "";
    if (!proof || !isValidProofUrl(proof)) {
      return apiError(
        "Harap unggah bukti transfer QRIS / DANA terlebih dahulu.",
        400,
      );
    }
    paymentProofUrl = proof;
  }

  try {
    const { result } = await createOrderFromCartSafe({
      sessionId,
      customerName,
      customerPhone,
      deliveryMethod,
      paymentMethod,
      paymentUniqueCode,
      paymentProofUrl,
      destinationAddress,
      destinationLat,
      destinationLng,
      distanceKm,
      shippingFee,
      notes,
    });

    if (!result.ok) {
      const status =
        result.code === "CART_EMPTY_OR_EXPIRED" ||
        result.code === "OUT_OF_STOCK" ||
        result.code === "INSUFFICIENT_STOCK"
          ? 409
          : 400;

      return apiJson(
        {
          success: false,
          error: result.message ?? "Pesanan gagal dibuat.",
          code: result.code,
          productId: result.productId,
        },
        status,
      );
    }

    return apiJson({ success: true, order: result }, 201);
  } catch (error) {
    console.error("POST /api/orders gagal:", error);
    return apiError("Terjadi kesalahan saat memproses pesanan.", 500);
  }
}
