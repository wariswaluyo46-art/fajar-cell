import { apiError, apiJson } from "@/lib/api-response";
import { isValidCoordinatePair } from "@/lib/geo-server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEARCH_RATE_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;
const USER_AGENT = "KonterFajarCell-OMS/1.0 (https://konterfajarcell.local)";

interface NominatimSearchItem {
  display_name?: string;
  lat?: string;
  lon?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
}

export async function GET(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `geo-search:${getClientKey(request)}`,
    SEARCH_RATE_LIMIT,
    SEARCH_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak pencarian lokasi. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");

  if (latRaw !== null && lngRaw !== null) {
    const lat = Number(latRaw);
    const lng = Number(lngRaw);
    if (!isValidCoordinatePair(lat, lng)) {
      return apiError("Koordinat lokasi tidak valid.", 400);
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=id`;
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(6_000),
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) {
        return apiJson({ success: true, address: "", degraded: true });
      }

      const data = (await response.json()) as NominatimReverseResponse;
      return apiJson({
        success: true,
        address: typeof data.display_name === "string" ? data.display_name : "",
      });
    } catch {
      return apiJson({ success: true, address: "", degraded: true });
    }
  }

  if (query.length < 3) {
    return apiJson({ success: true, results: [] });
  }

  if (query.length > 120) {
    return apiError("Kata kunci pencarian lokasi terlalu panjang.", 400);
  }

  try {
    // Prioritaskan area Banjarnegara & Jawa Tengah lewat viewbox
    const params = new URLSearchParams({
      format: "jsonv2",
      countrycodes: "id",
      limit: "6",
      addressdetails: "1",
      viewbox: "109.35,-7.10,110.05,-7.65",
      bounded: "0",
      "accept-language": "id",
      q: query,
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(6_000),
        headers: { "User-Agent": USER_AGENT },
      },
    );

    if (!response.ok) {
      return apiJson({ success: true, results: [], degraded: true });
    }

    const items = (await response.json()) as NominatimSearchItem[];
    const results = items
      .map((item) => {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        const displayName =
          typeof item.display_name === "string" ? item.display_name : "";
        if (!displayName || !isValidCoordinatePair(lat, lng)) return null;
        return { displayName, lat, lng };
      })
      .filter(
        (
          item,
        ): item is { displayName: string; lat: number; lng: number } =>
          item !== null,
      );

    return apiJson({ success: true, results });
  } catch {
    return apiJson({ success: true, results: [], degraded: true });
  }
}
