import { requireAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import {
  getStorePaymentSettingsSafe,
  isAllowedQrisImageUrl,
  updateStorePaymentSettingsSafe,
} from "@/lib/store-settings-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_096;
const SETTINGS_RATE_LIMIT = 20;
const SETTINGS_WINDOW_MS = 60_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const { settings, isFallback } = await getStorePaymentSettingsSafe();
    return apiJson({ success: true, settings, isFallback });
  } catch (error) {
    console.error("GET /api/admin/store-settings gagal:", error);
    return apiError("Gagal memuat pengaturan pembayaran toko.", 500);
  }
}

export async function PUT(request: Request): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(
    `admin-settings:${getClientKey(request)}`,
    SETTINGS_RATE_LIMIT,
    SETTINGS_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak pembaruan pengaturan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format pengaturan tidak valid.", 400);
  }

  const qrisImageUrl =
    typeof body.value.qrisImageUrl === "string"
      ? body.value.qrisImageUrl.trim()
      : "";
  const danaNumber =
    typeof body.value.danaNumber === "string"
      ? body.value.danaNumber.trim()
      : "";
  const danaAccountName =
    typeof body.value.danaAccountName === "string"
      ? body.value.danaAccountName.trim()
      : "";
  const storeLat = Number(body.value.storeLat);
  const storeLng = Number(body.value.storeLng);

  if (!isAllowedQrisImageUrl(qrisImageUrl)) {
    return apiError(
      "URL gambar QRIS tidak valid. Gunakan foto hasil unggah atau URL HTTPS yang valid.",
      400,
    );
  }

  const danaDigits = danaNumber.replace(/\D/g, "");
  if (
    !/^[0-9+\-\s]{8,24}$/.test(danaNumber) ||
    danaDigits.length < 8 ||
    danaDigits.length > 16
  ) {
    return apiError(
      "Nomor DANA tidak valid (harus 8–16 digit angka).",
      400,
    );
  }

  if (danaAccountName.length < 2 || danaAccountName.length > 120) {
    return apiError(
      "Nama pemilik akun DANA wajib diisi (2–120 karakter).",
      400,
    );
  }

  if (
    !Number.isFinite(storeLat) ||
    !Number.isFinite(storeLng) ||
    storeLat < -90 ||
    storeLat > 90 ||
    storeLng < -180 ||
    storeLng > 180
  ) {
    return apiError("Koordinat titik toko tidak valid.", 400);
  }

  try {
    const { settings, isFallback } = await updateStorePaymentSettingsSafe({
      qrisImageUrl,
      danaNumber,
      danaAccountName,
      storeLat,
      storeLng,
    });
    return apiJson({ success: true, settings, isFallback });
  } catch (error) {
    console.error("PUT /api/admin/store-settings gagal:", error);
    return apiError("Gagal menyimpan pengaturan pembayaran toko.", 500);
  }
}
