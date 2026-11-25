import "server-only";

import {
  calculateCodShipping,
  calculateHaversineKm,
  estimateTravelMinutes,
  roundDistanceKm,
  STORE_ORIGIN,
  type ShippingCalculation,
} from "./shipping";

export interface RouteCalculationResult {
  source: "osrm" | "haversine";
  distanceKm: number;
  durationMinutes: number;
  coordinates: Array<[number, number]>;
  shipping: ShippingCalculation;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

export function isValidCoordinatePair(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Hitung rute jalan via OSRM public API (`router.project-osrm.org`), dengan
 * fallback otomatis ke rumus Haversine agar selalu 100% gratis dan reliabel.
 */
export async function calculateRouteFromOrigin(
  destLat: number,
  destLng: number,
  origin?: { lat: number; lng: number },
): Promise<RouteCalculationResult> {
  const originLat = origin?.lat ?? STORE_ORIGIN.lat;
  const originLng = origin?.lng ?? STORE_ORIGIN.lng;
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_500),
      headers: {
        "User-Agent": "KonterFajarCell-OMS/1.0",
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as OsrmRouteResponse;
      const route = payload.routes?.[0];
      if (
        payload.code === "Ok" &&
        route &&
        typeof route.distance === "number" &&
        Number.isFinite(route.distance)
      ) {
        const distanceKm = roundDistanceKm(route.distance / 1_000);
        const durationMinutes =
          typeof route.duration === "number" && Number.isFinite(route.duration)
            ? Math.max(1, Math.round(route.duration / 60))
            : estimateTravelMinutes(distanceKm);

        const rawCoords = route.geometry?.coordinates ?? [];
        const coordinates: Array<[number, number]> =
          rawCoords.length >= 2
            ? rawCoords
                .filter(
                  (pair) =>
                    Array.isArray(pair) &&
                    pair.length >= 2 &&
                    isValidCoordinatePair(pair[1], pair[0]),
                )
                .map((pair) => [pair[1], pair[0]])
            : [
                [originLat, originLng],
                [destLat, destLng],
              ];

        return {
          source: "osrm",
          distanceKm,
          durationMinutes,
          coordinates,
          shipping: calculateCodShipping(distanceKm),
        };
      }
    }
  } catch (error) {
    console.warn(
      "OSRM routing gagal/timeout, beralih ke rumus Haversine:",
      error instanceof Error ? error.message : error,
    );
  }

  const distanceKm = calculateHaversineKm(
    originLat,
    originLng,
    destLat,
    destLng,
  );
  return {
    source: "haversine",
    distanceKm,
    durationMinutes: estimateTravelMinutes(distanceKm),
    coordinates: [
      [originLat, originLng],
      [destLat, destLng],
    ],
    shipping: calculateCodShipping(distanceKm),
  };
}
