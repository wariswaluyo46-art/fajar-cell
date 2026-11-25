import { requireAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { isServiceTicketStatus } from "@/lib/order-constants";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { updateServiceTicketStatusSafe } from "@/lib/service-tickets-db";

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(
    `admin-tickets:${getClientKey(request)}`,
    MUTATION_LIMIT,
    MUTATION_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak perubahan tiket servis. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const { id } = await context.params;
  const ticketId = id.trim();
  if (!UUID_PATTERN.test(ticketId)) {
    return apiError("ID tiket servis tidak valid.", 400);
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value) || !isServiceTicketStatus(body.value.status)) {
    return apiError("Status tiket servis tidak valid.", 400);
  }

  const adminNotes =
    typeof body.value.adminNotes === "string"
      ? body.value.adminNotes.trim().slice(0, 500)
      : undefined;

  try {
    const { ticket } = await updateServiceTicketStatusSafe(
      ticketId,
      body.value.status,
      adminNotes,
    );
    if (!ticket) {
      return apiError("Tiket servis tidak ditemukan.", 404);
    }

    return apiJson({ success: true, ticket });
  } catch (error) {
    console.error(`PATCH /api/admin/service-tickets/${ticketId} gagal:`, error);
    return apiError("Gagal memperbarui tiket servis.", 500);
  }
}
