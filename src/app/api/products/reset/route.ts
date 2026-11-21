import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { resetProductRecords } from "@/lib/products-db";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 512;
const RESET_CONFIRMATION_TOKEN = "RESET_KATALOG";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request): Promise<Response> {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_ADMIN_CATALOG_RESET !== "true"
  ) {
    return apiError(
      "Fitur reset katalog dinonaktifkan di lingkungan produksi demi keamanan data.",
      403,
    );
  }

  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const limit = checkRateLimit(
    `admin-reset:${getClientKey(request)}`,
    2,
    5 * 60_000,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan reset. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (
    !isRecord(body.value) ||
    body.value.confirm !== RESET_CONFIRMATION_TOKEN
  ) {
    return apiError(
      "Konfirmasi eksplisit diperlukan untuk mereset katalog.",
      400,
    );
  }

  try {
    const products = await resetProductRecords();
    return apiJson({ success: true, products });
  } catch (error) {
    console.error("POST /api/products/reset gagal:", error);
    return apiError("Data produk gagal direset.", 500);
  }
}
