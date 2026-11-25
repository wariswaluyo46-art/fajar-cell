import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { CART_RESERVATION_TTL_MINUTES } from "@/lib/order-constants";
import {
  attachCartSessionCookie,
  getCartSessionId,
  getOrCreateCartSessionId,
} from "@/lib/cart-session";
import {
  getSessionCart,
  releaseSessionCart,
  reserveCartItemSafe,
} from "@/lib/orders-db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const CART_RATE_LIMIT = 60;
const CART_RATE_WINDOW_MS = 60_000;
const PRODUCT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emptyCartPayload() {
  return {
    success: true,
    items: [],
    subtotal: 0,
    totalQuantity: 0,
    earliestExpiresAt: null,
    serverTime: new Date().toISOString(),
    isFallback: false,
  };
}

export async function GET(): Promise<Response> {
  try {
    const sessionId = await getCartSessionId();
    if (!sessionId) {
      return apiJson(emptyCartPayload());
    }

    const cart = await getSessionCart(sessionId);
    return apiJson({ success: true, ...cart });
  } catch (error) {
    console.error("GET /api/cart gagal:", error);
    return apiError("Gagal memuat isi keranjang.", 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `cart:${getClientKey(request)}`,
    CART_RATE_LIMIT,
    CART_RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan keranjang. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format permintaan keranjang tidak valid.", 400);
  }

  const productId =
    typeof body.value.productId === "string"
      ? body.value.productId.trim()
      : "";
  const quantity = body.value.quantity;

  if (!PRODUCT_ID_PATTERN.test(productId)) {
    return apiError("ID produk tidak valid.", 400);
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 0 ||
    quantity > 99
  ) {
    return apiError("Jumlah produk harus bilangan bulat antara 0 sampai 99.", 400);
  }

  try {
    const { sessionId } = await getOrCreateCartSessionId();
    const { result } = await reserveCartItemSafe({
      sessionId,
      productId,
      quantity,
      ttlMinutes: CART_RESERVATION_TTL_MINUTES,
    });

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "OUT_OF_STOCK" ||
              result.code === "INSUFFICIENT_STOCK"
            ? 409
            : 400;

      return apiJson(
        {
          success: false,
          error: result.message ?? "Stok tidak mencukupi.",
          code: result.code,
          availableStock: result.availableStock,
        },
        status,
      );
    }

    const cart = await getSessionCart(sessionId);
    const response = apiJson({
      success: true,
      reservation: result,
      ...cart,
    });
    attachCartSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    console.error("POST /api/cart gagal:", error);
    return apiError("Gagal memperbarui keranjang belanja.", 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `cart:${getClientKey(request)}`,
    CART_RATE_LIMIT,
    CART_RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan keranjang. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const rawProductId = new URL(request.url).searchParams.get("productId")?.trim();
  if (rawProductId !== undefined && rawProductId !== "" && !PRODUCT_ID_PATTERN.test(rawProductId)) {
    return apiError("ID produk tidak valid.", 400);
  }

  try {
    const sessionId = await getCartSessionId();
    if (!sessionId) {
      return apiJson(emptyCartPayload());
    }

    await releaseSessionCart(sessionId, rawProductId || undefined);
    const cart = await getSessionCart(sessionId);
    const response = apiJson({ success: true, ...cart });
    attachCartSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    console.error("DELETE /api/cart gagal:", error);
    return apiError("Gagal menghapus item dari keranjang.", 500);
  }
}
