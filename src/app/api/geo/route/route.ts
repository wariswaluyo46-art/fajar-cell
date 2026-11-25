import { apiError, apiJson } from "@/lib/api-response";
import {
  calculateRouteFromOrigin,
  isValidCoordinatePair,
} from "@/lib/geo-server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getStorePaymentSettingsSafe } from "@/lib/store-settings-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_RATE_LIMIT = 60;
const ROUTE_WINDOW_MS = 60_000;

export async function GET(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `geo-route:${getClientKey(request)}`,
    ROUTE_RATE_LIMIT,
    ROUTE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak perhitungan rute. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");

  if (latRaw === null || lngRaw === null) {
    return apiError("Koordinat tujuan (lat & lng) wajib diisi.", 400);
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!isValidCoordinatePair(lat, lng)) {
    return apiError("Koordinat tujuan tidak valid.", 400);
  }

  const { settings } = await getStorePaymentSettingsSafe();
  const result = await calculateRouteFromOrigin(lat, lng, {
    lat: settings.storeLat,
    lng: settings.storeLng,
  });
  return apiJson({ success: true, ...result });
}
