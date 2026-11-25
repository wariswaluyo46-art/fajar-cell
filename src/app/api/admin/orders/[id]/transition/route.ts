import { requireAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { isOrderStatus } from "@/lib/order-constants";
import { adminTransitionOrderSafe } from "@/lib/orders-db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const MUTATION_LIMIT = 60;
const MUTATION_WINDOW_MS = 60_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(
    `admin-orders:${getClientKey(request)}`,
    MUTATION_LIMIT,
    MUTATION_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan perubahan status pesanan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const { id } = await context.params;
  const orderId = id.trim();
  if (!UUID_PATTERN.test(orderId)) {
    return apiError("ID pesanan tidak valid.", 400);
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value) || !isOrderStatus(body.value.nextStatus)) {
    return apiError("Status tujuan pesanan tidak valid.", 400);
  }

  const adminNote =
    typeof body.value.adminNote === "string"
      ? body.value.adminNote.trim().slice(0, 500)
      : "";

  try {
    const { result } = await adminTransitionOrderSafe(
      orderId,
      body.value.nextStatus,
      adminNote,
    );

    if (!result.ok) {
      const status =
        result.code === "NOT_FOUND"
          ? 404
          : result.code === "INSUFFICIENT_STOCK" ||
              result.code === "INVALID_TRANSITION"
            ? 409
            : 400;

      return apiJson(
        {
          success: false,
          error: result.message ?? "Gagal mengubah status pesanan.",
          code: result.code,
        },
        status,
      );
    }

    return apiJson({ success: true, transition: result });
  } catch (error) {
    console.error(`POST /api/admin/orders/${orderId}/transition gagal:`, error);
    return apiError("Terjadi kesalahan saat memperbarui status pesanan.", 500);
  }
}
