"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import {
  Crosshair,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { STORE_ORIGIN } from "@/lib/shipping";
import { cn, formatRupiah } from "@/lib/utils";
import { buildOutOfCodZoneUrl } from "@/lib/whatsapp";

export interface CalculatedLocationInfo {
  lat: number;
  lng: number;
  distanceKm: number;
  durationMinutes: number;
  shippingFee: number;
  codEligible: boolean;
  tierLabel: string;
  suggestion?: string;
  source: "osrm" | "haversine";
}

interface SearchResultItem {
  displayName: string;
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  selectedLat: number | null;
  selectedLng: number | null;
  address: string;
  storeOrigin?: { lat: number; lng: number };
  onAddressChange: (address: string) => void;
  onLocationCalculated: (info: CalculatedLocationInfo) => void;
}

const storePinIcon = L.divIcon({
  className: "kfc-store-marker",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#1d43d8;color:#ffffff;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(29,67,216,0.45);font-weight:800;font-size:11px;font-family:system-ui,sans-serif;">FC</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationPinIcon = L.divIcon({
  className: "kfc-dest-marker",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px 9999px 9999px 0;transform:rotate(-45deg);background:#e11d48;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(225,29,72,0.45);"><div style="width:8px;height:8px;border-radius:9999px;background:#ffffff;transform:rotate(45deg);"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewportUpdater({
  originLat,
  originLng,
  destLat,
  destLng,
}: {
  originLat: number;
  originLng: number;
  destLat: number | null;
  destLng: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (destLat === null || destLng === null) return;
    const bounds = L.latLngBounds(
      [originLat, originLng],
      [destLat, destLng],
    );
    map.fitBounds(bounds, { padding: [44, 44], maxZoom: 15 });
  }, [originLat, originLng, destLat, destLng, map]);

  return null;
}

export function MapLocationPicker({
  selectedLat,
  selectedLng,
  address,
  storeOrigin,
  onAddressChange,
  onLocationCalculated,
}: MapLocationPickerProps) {
  const originLat = storeOrigin?.lat ?? STORE_ORIGIN.lat;
  const originLng = storeOrigin?.lng ?? STORE_ORIGIN.lng;
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<[number, number]>>([]);
  const [routeMeta, setRouteMeta] = useState<CalculatedLocationInfo | null>(
    null,
  );

  // Debounce pencarian lokasi via Nominatim proxy
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      const frame = requestAnimationFrame(() => {
        setSearchResults([]);
      });
      return () => cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/geo/search?q=${encodeURIComponent(trimmed)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const data = (await res.json().catch(() => null)) as {
          success?: boolean;
          results?: SearchResultItem[];
        } | null;
        if (res.ok && data?.success && Array.isArray(data.results)) {
          setSearchResults(data.results);
        }
      } catch {
        // Abaikan abort atau gangguan jaringan sesaat
      } finally {
        setIsSearching(false);
      }
    }, 420);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  const calculateDestination = useCallback(
    async (lat: number, lng: number, shouldReverseGeocode: boolean) => {
      setGeoError(null);
      setIsRouting(true);

      try {
        const routePromise = fetch(
          `/api/geo/route?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
          { cache: "no-store" },
        );

        const reversePromise = shouldReverseGeocode
          ? fetch(
              `/api/geo/search?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
              { cache: "no-store" },
            )
          : null;

        const [routeRes, reverseRes] = await Promise.all([
          routePromise,
          reversePromise,
        ]);

        const routeData = (await routeRes.json().catch(() => null)) as {
          success?: boolean;
          error?: string;
          source?: "osrm" | "haversine";
          distanceKm?: number;
          durationMinutes?: number;
          coordinates?: Array<[number, number]>;
          shipping?: {
            shippingFee: number;
            codEligible: boolean;
            tierLabel: string;
            suggestion?: string;
          };
        } | null;

        if (!routeRes.ok || !routeData?.success || !routeData.shipping) {
          setGeoError(
            routeData?.error ?? "Gagal menghitung jarak ke titik tujuan.",
          );
          return;
        }

        const info: CalculatedLocationInfo = {
          lat,
          lng,
          distanceKm: routeData.distanceKm ?? 0,
          durationMinutes: routeData.durationMinutes ?? 10,
          shippingFee: routeData.shipping.shippingFee,
          codEligible: routeData.shipping.codEligible,
          tierLabel: routeData.shipping.tierLabel,
          suggestion: routeData.shipping.suggestion,
          source: routeData.source ?? "haversine",
        };

        setRouteCoords(
          Array.isArray(routeData.coordinates) ? routeData.coordinates : [],
        );
        setRouteMeta(info);
        onLocationCalculated(info);

        if (reverseRes && reverseRes.ok) {
          const reverseData = (await reverseRes.json().catch(() => null)) as {
            success?: boolean;
            address?: string;
          } | null;
          if (reverseData?.success && reverseData.address) {
            onAddressChange(reverseData.address);
          }
        }
      } catch {
        setGeoError(
          "Tidak dapat menghubungi layanan peta. Pastikan koneksi internet aktif.",
        );
      } finally {
        setIsRouting(false);
      }
    },
    [onAddressChange, onLocationCalculated],
  );

  function handleSelectSearchItem(item: SearchResultItem) {
    setSearchResults([]);
    setSearchQuery(item.displayName);
    onAddressChange(item.displayName);
    void calculateDestination(item.lat, item.lng, false);
  }

  function handleUseGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Browser tidak mendukung fitur lokasi GPS.");
      return;
    }

    setGeoError(null);
    setIsLocatingGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const { latitude, longitude } = position.coords;
        void calculateDestination(latitude, longitude, true);
      },
      (err) => {
        setIsLocatingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Izin lokasi ditolak. Aktifkan izin lokasi browser atau pilih titik langsung pada peta.",
          );
        } else {
          setGeoError(
            "Gagal mendeteksi lokasi GPS. Silakan cari nama desa/kecamatan atau klik peta.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  }

  const markerEventHandlers = useMemo(
    () => ({
      dragend(event: L.DragEndEvent) {
        const marker = event.target as L.Marker;
        const pos = marker.getLatLng();
        void calculateDestination(pos.lat, pos.lng, true);
      },
    }),
    [calculateDestination],
  );

  return (
    <div className="space-y-3">
      {/* Search Bar & GPS */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari desa, kecamatan, atau patokan (mis. Wanadadi, Banjarnegara)..."
            aria-label="Cari lokasi pengantaran COD"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-royal-500 focus:ring-4 focus:ring-royal-500/10"
          />
          {isSearching && (
            <LoaderCircle
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-royal-600"
              aria-hidden="true"
            />
          )}

          {searchResults.length > 0 && (
            <ul className="absolute right-0 left-0 z-[500] mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
              {searchResults.map((item, idx) => (
                <li key={`${item.lat}-${item.lng}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectSearchItem(item)}
                    className="flex w-full items-start gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-royal-50 hover:text-royal-800 cursor-pointer"
                  >
                    <MapPin
                      className="mt-0.5 size-3.5 shrink-0 text-royal-600"
                      aria-hidden="true"
                    />
                    <span className="line-clamp-2">{item.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={isLocatingGps}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-royal-200 bg-royal-50 px-3.5 py-2 text-xs font-extrabold text-royal-800 transition hover:bg-royal-100 disabled:opacity-60 cursor-pointer"
        >
          {isLocatingGps ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Crosshair className="size-4" aria-hidden="true" />
          )}
          <span>Gunakan Lokasi Saya (GPS)</span>
        </button>
      </div>

      {geoError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700">
          {geoError}
        </p>
      )}

      {/* Map Container */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        <MapContainer
          center={[originLat, originLng]}
          zoom={13}
          scrollWheelZoom={true}
          className="z-0 h-72 w-full sm:h-80"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            onSelect={(lat, lng) => {
              void calculateDestination(lat, lng, true);
            }}
          />
          <MapViewportUpdater
            originLat={originLat}
            originLng={originLng}
            destLat={selectedLat}
            destLng={selectedLng}
          />

          {/* Marker Toko (Biru) */}
          <Marker
            position={[originLat, originLng]}
            icon={storePinIcon}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-slate-900">{STORE_ORIGIN.name}</p>
                <p className="mt-0.5 text-slate-600">{STORE_ORIGIN.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Marker Tujuan (Merah, Draggable) */}
          {selectedLat !== null && selectedLng !== null && (
            <Marker
              position={[selectedLat, selectedLng]}
              icon={destinationPinIcon}
              draggable={true}
              eventHandlers={markerEventHandlers}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Titik Pengantaran COD</p>
                  <p className="mt-0.5 text-slate-600">
                    Geser pin ini untuk menyesuaikan titik lokasi.
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Polyline Rute */}
          {routeCoords.length >= 2 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: routeMeta?.source === "osrm" ? "#2457eb" : "#d97706",
                weight: 4,
                opacity: 0.85,
                dashArray: routeMeta?.source === "haversine" ? "8 6" : undefined,
              }}
            />
          )}
        </MapContainer>

        {isRouting && (
          <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-white/55 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-royal-700 shadow-lg">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Menghitung rute & ongkir...
            </span>
          </div>
        )}
      </div>

      <p className="text-[11px] font-medium text-slate-500">
        Tip: Klik langsung di peta atau geser pin merah ke lokasi rumah / titik COD Anda.
      </p>

      {/* Kartu Info Rute & Ongkir */}
      {routeMeta && (
        <div
          className={cn(
            "rounded-2xl border p-4 transition-colors",
            routeMeta.codEligible
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-amber-300 bg-amber-50",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
              <Truck className="size-4 text-royal-700" aria-hidden="true" />
              {routeMeta.tierLabel}
            </span>
            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
              {routeMeta.source === "osrm"
                ? "Rute Jalan OSRM"
                : "Estimasi Haversine"}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Jarak Tempuh
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900 tabular-nums">
                {routeMeta.distanceKm} km
              </p>
            </div>
            <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Estimasi Waktu
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-slate-900 tabular-nums">
                ~{routeMeta.durationMinutes} mnt
              </p>
            </div>
            <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200/70">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Ongkir COD
              </p>
              <p className="mt-0.5 text-sm font-extrabold text-royal-700 tabular-nums">
                {routeMeta.codEligible
                  ? routeMeta.shippingFee === 0
                    ? "Gratis"
                    : formatRupiah(routeMeta.shippingFee)
                  : "N/A"}
              </p>
            </div>
          </div>

          {!routeMeta.codEligible && (
            <div className="mt-3 space-y-2 border-t border-amber-200 pt-3">
              <p className="flex items-start gap-2 text-xs font-semibold text-amber-900">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <span>
                  {routeMeta.suggestion ??
                    "Jarak melebihi radius COD 20 km."}
                </span>
              </p>
              <WhatsAppLink
                href={buildOutOfCodZoneUrl(routeMeta.distanceKm, address)}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Navigation className="size-3.5" aria-hidden="true" />
                Tanya Kirim Ekspedisi via WA
              </WhatsAppLink>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
