import "server-only";

import { randomUUID } from "node:crypto";

import type { Product, ProductAvailability, ReserveCartResult } from "@/types";

import { CART_RESERVATION_TTL_MINUTES } from "./order-constants";

export interface FallbackReservationRecord {
  id: string;
  sessionId: string;
  productId: string;
  quantity: number;
  expiresAtMs: number;
  updatedAtMs: number;
}

const globalForCartFallback = globalThis as typeof globalThis & {
  kfcCartFallbackStore?: Map<string, FallbackReservationRecord>;
};

function getStore(): Map<string, FallbackReservationRecord> {
  if (!globalForCartFallback.kfcCartFallbackStore) {
    globalForCartFallback.kfcCartFallbackStore = new Map();
  }
  return globalForCartFallback.kfcCartFallbackStore;
}

function makeKey(sessionId: string, productId: string): string {
  return `${sessionId}::${productId}`;
}

export function cleanupFallbackExpired(now = Date.now()): void {
  const store = getStore();
  for (const [key, entry] of store) {
    if (entry.expiresAtMs <= now) {
      store.delete(key);
    }
  }
}

export function fallbackReserveCartItem(
  sessionId: string,
  product: Product | undefined,
  quantity: number,
  ttlMinutes = CART_RESERVATION_TTL_MINUTES,
): ReserveCartResult {
  const now = Date.now();
  cleanupFallbackExpired(now);
  const store = getStore();

  if (!product) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Produk tidak ditemukan.",
      productId: "",
      availableStock: 0,
    };
  }

  const key = makeKey(sessionId, product.id);

  if (quantity <= 0) {
    store.delete(key);
    return {
      ok: true,
      released: true,
      productId: product.id,
    };
  }

  if (product.status !== "ready" || product.stock <= 0) {
    return {
      ok: false,
      code: "OUT_OF_STOCK",
      message: "Stok produk tidak tersedia.",
      productId: product.id,
      availableStock: 0,
    };
  }

  let heldByOthers = 0;
  for (const entry of store.values()) {
    if (
      entry.productId === product.id &&
      entry.sessionId !== sessionId &&
      entry.expiresAtMs > now
    ) {
      heldByOthers += entry.quantity;
    }
  }

  const available = Math.max(0, product.stock - heldByOthers);

  if (quantity > available) {
    return {
      ok: false,
      code: "INSUFFICIENT_STOCK",
      message:
        available === 0
          ? "Stok sedang dipesan pengunjung lain. Cek lagi beberapa menit lagi."
          : `Stok tersedia tersisa ${available} unit.`,
      productId: product.id,
      availableStock: available,
    };
  }

  const safeTtl = Math.max(1, Math.min(ttlMinutes, 60));
  const expiresAtMs = now + safeTtl * 60_000;
  const existing = store.get(key);
  const reservationId = existing?.id ?? randomUUID();

  store.set(key, {
    id: reservationId,
    sessionId,
    productId: product.id,
    quantity,
    expiresAtMs,
    updatedAtMs: now,
  });

  return {
    ok: true,
    reservationId,
    productId: product.id,
    quantity,
    expiresAt: new Date(expiresAtMs).toISOString(),
    availableStock: available,
  };
}

export function fallbackGetSessionReservations(
  sessionId: string,
): FallbackReservationRecord[] {
  const now = Date.now();
  cleanupFallbackExpired(now);
  const store = getStore();
  const items: FallbackReservationRecord[] = [];

  for (const entry of store.values()) {
    if (entry.sessionId === sessionId && entry.expiresAtMs > now) {
      items.push(entry);
    }
  }

  return items.sort((a, b) => a.updatedAtMs - b.updatedAtMs);
}

export function fallbackReleaseSession(
  sessionId: string,
  productId?: string,
): void {
  const store = getStore();
  if (productId) {
    store.delete(makeKey(sessionId, productId));
    return;
  }

  for (const [key, entry] of store) {
    if (entry.sessionId === sessionId) {
      store.delete(key);
    }
  }
}

export function fallbackGetAvailabilityMap(
  products: Product[],
  sessionId?: string,
): Map<string, ProductAvailability> {
  const now = Date.now();
  cleanupFallbackExpired(now);
  const store = getStore();
  const byProduct = new Map<
    string,
    { reservedByOthers: number; reservedBySelf: number }
  >();

  for (const entry of store.values()) {
    if (entry.expiresAtMs <= now) continue;
    const current = byProduct.get(entry.productId) ?? {
      reservedByOthers: 0,
      reservedBySelf: 0,
    };
    if (sessionId && entry.sessionId === sessionId) {
      current.reservedBySelf += entry.quantity;
    } else {
      current.reservedByOthers += entry.quantity;
    }
    byProduct.set(entry.productId, current);
  }

  const result = new Map<string, ProductAvailability>();
  for (const product of products) {
    const counts = byProduct.get(product.id) ?? {
      reservedByOthers: 0,
      reservedBySelf: 0,
    };
    const availableStock =
      product.status !== "ready"
        ? 0
        : Math.max(0, product.stock - counts.reservedByOthers);

    result.set(product.id, {
      productId: product.id,
      totalStock: product.stock,
      reservedByOthers: counts.reservedByOthers,
      reservedBySelf: counts.reservedBySelf,
      pendingOrderQty: 0,
      availableStock,
    });
  }

  return result;
}
