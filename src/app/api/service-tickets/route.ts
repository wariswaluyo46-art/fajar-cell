import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { createServiceTicketSafe } from "@/lib/service-tickets-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_192;
const BOOKING_RATE_LIMIT = 15;
const BOOKING_WINDOW_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `service-booking:${getClientKey(request)}`,
    BOOKING_RATE_LIMIT,
    BOOKING_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak pengajuan booking servis. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format data booking servis tidak valid.", 400);
  }

  const raw = body.value;
  const brand =
    typeof raw.brand === "string" ? raw.brand.trim().slice(0, 64) : "";
  const deviceModel =
    typeof raw.deviceModel === "string"
      ? raw.deviceModel.trim().slice(0, 120)
      : "";
  const customerName =
    typeof raw.customerName === "string"
      ? raw.customerName.trim().slice(0, 120)
      : "";
  const customerPhone =
    typeof raw.customerPhone === "string"
      ? raw.customerPhone.trim().slice(0, 32)
      : "";
  const visitType =
    raw.visitType === "tanya-stok-dulu"
      ? "tanya-stok-dulu"
      : "datang-langsung";
  const notes =
    typeof raw.notes === "string" ? raw.notes.trim().slice(0, 500) : "";

  const issues = Array.isArray(raw.issues)
    ? raw.issues
        .filter((i): i is string => typeof i === "string")
        .map((i) => i.trim().slice(0, 120))
        .filter((i) => i !== "")
        .slice(0, 10)
    : [];

  const estimatedCostMin =
    typeof raw.estimatedCostMin === "number" &&
    Number.isFinite(raw.estimatedCostMin) &&
    raw.estimatedCostMin >= 0
      ? Math.trunc(raw.estimatedCostMin)
      : 0;
  const estimatedCostMax =
    typeof raw.estimatedCostMax === "number" &&
    Number.isFinite(raw.estimatedCostMax) &&
    raw.estimatedCostMax >= 0
      ? Math.trunc(raw.estimatedCostMax)
      : 0;

  if (brand === "") {
    return apiError("Merek HP wajib dipilih.", 400);
  }

  if (issues.length === 0) {
    return apiError("Pilih minimal satu keluhan kerusakan.", 400);
  }

  if (customerName.length < 2) {
    return apiError("Nama pelanggan wajib diisi minimal 2 karakter.", 400);
  }

  const phoneDigits = customerPhone.replace(/\D/g, "");
  if (phoneDigits.length < 9 || phoneDigits.length > 15) {
    return apiError("Nomor WhatsApp tidak valid (9–15 digit).", 400);
  }

  try {
    const { ticket } = await createServiceTicketSafe({
      brand,
      deviceModel: deviceModel || "Semua Tipe",
      issues,
      customerName,
      customerPhone,
      visitType,
      estimatedCostMin,
      estimatedCostMax,
      notes,
    });

    return apiJson({ success: true, ticket }, 201);
  } catch (error) {
    console.error("POST /api/service-tickets gagal:", error);
    return apiError("Gagal menyimpan tiket servis.", 500);
  }
}
