import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { getOrderByCodeSafe } from "@/lib/orders-db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getServiceTicketByCodeSafe } from "@/lib/service-tickets-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_048;
const TRACK_RATE_LIMIT = 30;
const TRACK_WINDOW_MS = 60_000;
const ORDER_CODE_PATTERN = /^FC-\d{8}-[A-Z0-9]{4}$/i;
const SERVICE_CODE_PATTERN = /^SRV-\d{8}-[A-Z0-9]{4}$/i;
const LAST4_PATTERN = /^\d{4}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `track:${getClientKey(request)}`,
    TRACK_RATE_LIMIT,
    TRACK_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan pelacakan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format permintaan tidak valid.", 400);
  }

  const code =
    typeof body.value.code === "string"
      ? body.value.code.trim().toUpperCase()
      : "";
  const phoneLast4 =
    typeof body.value.phoneLast4 === "string"
      ? body.value.phoneLast4.trim()
      : "";

  if (!ORDER_CODE_PATTERN.test(code) && !SERVICE_CODE_PATTERN.test(code)) {
    return apiError(
      "Format kode tidak valid. Gunakan kode FC-YYYYMMDD-XXXX atau SRV-YYYYMMDD-XXXX.",
      400,
    );
  }

  if (!LAST4_PATTERN.test(phoneLast4)) {
    return apiError(
      "Masukkan tepat 4 digit terakhir nomor WhatsApp Anda.",
      400,
    );
  }

  try {
    if (ORDER_CODE_PATTERN.test(code)) {
      const { order } = await getOrderByCodeSafe(code);
      const actualLast4 = order?.customerPhone.replace(/\D/g, "").slice(-4);

      if (!order || actualLast4 !== phoneLast4) {
        return apiError(
          "Kode pesanan atau 4 digit terakhir nomor HP tidak cocok.",
          404,
        );
      }

      const { sessionId: _omitted, ...safeOrderBase } = order;
      void _omitted;

      const safeOrder = {
        ...safeOrderBase,
        customerPhone: `••••••${phoneLast4}`,
      };

      const warranties =
        order.status === "completed"
          ? (order.items ?? [])
              .filter((item) => item.warrantyDays > 0)
              .map((item, idx) => {
                const startIso = order.completedAt ?? order.updatedAt;
                const startMs = Date.parse(startIso);
                const expiresMs =
                  startMs + item.warrantyDays * 24 * 60 * 60 * 1_000;
                return {
                  warrantyCode: `WRT-${order.orderCode.replace(/^FC-/, "")}-${idx + 1}`,
                  productName: item.productName,
                  warrantyDays: item.warrantyDays,
                  startDate: startIso,
                  expiresAt: new Date(expiresMs).toISOString(),
                  isActive: expiresMs > Date.now(),
                };
              })
          : [];

      return apiJson({
        success: true,
        type: "order",
        order: safeOrder,
        warranties,
      });
    }

    const { ticket } = await getServiceTicketByCodeSafe(code);
    const ticketLast4 = ticket?.customerPhone.replace(/\D/g, "").slice(-4);

    if (!ticket || ticketLast4 !== phoneLast4) {
      return apiError(
        "Kode servis atau 4 digit terakhir nomor HP tidak cocok.",
        404,
      );
    }

    return apiJson({
      success: true,
      type: "service",
      ticket: {
        ...ticket,
        customerPhone: `••••••${phoneLast4}`,
      },
    });
  } catch (error) {
    console.error("POST /api/track gagal:", error);
    return apiError("Gagal melacak status. Silakan coba lagi.", 500);
  }
}
