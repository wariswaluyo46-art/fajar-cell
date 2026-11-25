import { defaultStoreSettings } from "@/lib/store";

export const STORE_ORIGIN = {
  lat: defaultStoreSettings.coordinates?.lat ?? -7.3679,
  lng: defaultStoreSettings.coordinates?.lng ?? 109.6836,
  name: defaultStoreSettings.name,
  address: defaultStoreSettings.address,
} as const;

export const COD_MAX_DISTANCE_KM = 20;

export interface ShippingCalculation {
  distanceKm: number;
  shippingFee: number;
  codEligible: boolean;
  tierLabel: string;
  suggestion?: string;
}

const EARTH_RADIUS_KM = 6_371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.round(km * 100) / 100;
}

/** Hitung jarak garis lurus (Haversine) dalam km, dibulatkan 2 desimal. */
export function calculateHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return roundDistanceKm(EARTH_RADIUS_KM * c);
}

export function estimateTravelMinutes(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 5;
  return Math.max(5, Math.round((distanceKm / 35) * 60));
}

/**
 * Kalkulasi biaya ongkir COD berdasarkan jarak tempuh dari toko:
 * - 0 - 3 km: Gratis Ongkir COD
 * - 3.1 - 10 km: Rp 2.000 / km (dibulatkan ke kelipatan Rp 1.000)
 * - 10.1 - 20 km: Rp 2.500 / km (dibulatkan ke kelipatan Rp 1.000)
 * - > 20 km: Di luar jangkauan COD langsung
 */
export function calculateCodShipping(distanceKm: number): ShippingCalculation {
  const safeKm = roundDistanceKm(distanceKm);

  if (safeKm <= 3) {
    return {
      distanceKm: safeKm,
      shippingFee: 0,
      codEligible: true,
      tierLabel: "Gratis Ongkir COD (0–3 km)",
    };
  }

  if (safeKm <= 10) {
    const fee = Math.round((safeKm * 2_000) / 1_000) * 1_000;
    return {
      distanceKm: safeKm,
      shippingFee: fee,
      codEligible: true,
      tierLabel: "COD Zona Dekat (3,1–10 km · Rp2.000/km)",
    };
  }

  if (safeKm <= COD_MAX_DISTANCE_KM) {
    const fee = Math.round((safeKm * 2_500) / 1_000) * 1_000;
    return {
      distanceKm: safeKm,
      shippingFee: fee,
      codEligible: true,
      tierLabel: "COD Zona Menengah (10,1–20 km · Rp2.500/km)",
    };
  }

  return {
    distanceKm: safeKm,
    shippingFee: 0,
    codEligible: false,
    tierLabel: "Di luar jangkauan COD langsung (> 20 km)",
    suggestion:
      "Lokasi melebihi radius COD 20 km. Pilih Ambil di Toko (Rp0) atau konsultasikan pengiriman ekspedisi via WhatsApp.",
  };
}
