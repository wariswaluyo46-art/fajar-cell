import type {
  PhoneSpecs,
  Product,
  ProductInput,
  ProductStatus,
  UsedCondition,
  Warranty,
} from "@/types";

import {
  isAccessoryType,
  isBrand,
  isProductCategory,
  isProductStatus,
} from "./product-input";
import { getFallbackThumbnail, isValidImageSource } from "./product-images";
import { products as seedSource } from "./products";

/**
 * Store produk sisi klien. Data selalu berasal dari API Supabase; data seed hanya
 * dipakai untuk HTML awal/SSR dan fallback bila API belum merespons.
 *
 * Satu watcher dipakai bersama semua subscriber: fetch awal, BroadcastChannel
 * untuk tab lain, resync saat fokus/online, dan polling ringan saat halaman
 * terlihat agar stok dari pengunjung lain ikut diperbarui.
 */

type Listener = () => void;

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

const seedProducts: Product[] = [...seedSource];
const initialSnapshot: ProductsState = {
  products: seedProducts,
  isLoading: false,
  error: null,
};

const listeners = new Set<Listener>();
let snapshot: ProductsState = initialSnapshot;
let activeLoad: Promise<void> | null = null;
let requestVersion = 0;

let stopProductWatcher: (() => void) | null = null;
let productChannel: BroadcastChannel | null = null;

const PRODUCTS_CHANNEL_NAME = "kfc-products-sync";
const POLL_INTERVAL_MS = 60_000;

export class ProductApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ProductApiError";
    this.status = status;
  }
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseSpecs(value: unknown): PhoneSpecs | null {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.ram) ||
    !isFiniteNumber(value.storage)
  ) {
    return null;
  }

  const specs: PhoneSpecs = { ram: value.ram, storage: value.storage };

  if (typeof value.chipset === "string" && value.chipset !== "") {
    specs.chipset = value.chipset;
  }
  if (typeof value.screen === "string" && value.screen !== "") {
    specs.screen = value.screen;
  }
  if (typeof value.camera === "string" && value.camera !== "") {
    specs.camera = value.camera;
  }
  if (isFiniteNumber(value.battery) && value.battery > 0) {
    specs.battery = value.battery;
  }

  return specs;
}

function parseWarranty(value: unknown): Warranty | null {
  if (
    !isRecord(value) ||
    typeof value.active !== "boolean" ||
    !isFiniteNumber(value.durationDays) ||
    typeof value.description !== "string"
  ) {
    return null;
  }

  return {
    active: value.active,
    durationDays: value.durationDays,
    description: value.description,
  };
}

function parseCondition(value: unknown): UsedCondition | null {
  if (
    !isRecord(value) ||
    typeof value.grade !== "string" ||
    value.grade.trim() === "" ||
    typeof value.label !== "string" ||
    value.label.trim() === "" ||
    !isFiniteNumber(value.minusCount) ||
    !Array.isArray(value.completeness)
  ) {
    return null;
  }

  const completeness = value.completeness.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
  if (completeness.length === 0) return null;

  const condition: UsedCondition = {
    grade: value.grade,
    label: value.label,
    minusCount: value.minusCount,
    completeness,
  };

  if (isFiniteNumber(value.batteryHealth)) {
    condition.batteryHealth = value.batteryHealth;
  }

  return condition;
}

function parseProduct(value: unknown): Product | null {
  if (!isRecord(value)) return null;
  if (!isProductCategory(value.category)) return null;
  if (!isProductStatus(value.status)) return null;
  if (!isBrand(value.brand)) return null;

  if (typeof value.id !== "string" || value.id.trim() === "") return null;
  if (typeof value.slug !== "string" || value.slug.trim() === "") return null;
  if (typeof value.name !== "string" || value.name.trim() === "") return null;
  if (!isFiniteNumber(value.price) || !isFiniteNumber(value.stock)) return null;
  if (!isValidDateString(value.createdAt)) return null;
  if (!isValidDateString(value.updatedAt)) return null;
  if (typeof value.featured !== "boolean") return null;
  if (typeof value.description !== "string") return null;

  const category = value.category;
  const thumbnail =
    typeof value.thumbnail === "string" &&
    isValidImageSource(value.thumbnail)
      ? value.thumbnail.trim()
      : getFallbackThumbnail(category);
  const images = Array.isArray(value.images)
    ? value.images.filter(
        (image): image is string =>
          typeof image === "string" && isValidImageSource(image),
      )
    : [];
  if (images.length === 0) images.push(thumbnail);

  const base = {
    id: value.id,
    slug: value.slug,
    name: value.name,
    brand: value.brand,
    price: value.price,
    originalPrice:
      isFiniteNumber(value.originalPrice) && value.originalPrice > 0
        ? value.originalPrice
        : undefined,
    thumbnail,
    images,
    description: value.description,
    status: value.status,
    featured: value.featured,
    stock: value.stock,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };

  if (category === "aksesoris") {
    if (!isAccessoryType(value.accessoryType)) return null;

    return {
      ...base,
      category,
      accessoryType: value.accessoryType,
      compatibleWith: Array.isArray(value.compatibleWith)
        ? value.compatibleWith.filter(
            (item): item is string => typeof item === "string",
          )
        : undefined,
    };
  }

  const specs = parseSpecs(value.specs);
  const warranty = parseWarranty(value.warranty);
  if (!specs || !warranty) return null;
  if (typeof value.color !== "string") return null;

  if (category === "handphone-bekas") {
    const condition = parseCondition(value.condition);
    if (!condition) return null;
    if (typeof value.tradeInEligible !== "boolean") return null;

    return {
      ...base,
      category,
      specs,
      warranty,
      color: value.color,
      condition,
      tradeInEligible: value.tradeInEligible,
    };
  }

  return {
    ...base,
    category,
    specs,
    warranty,
    color: value.color,
  };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

function setSnapshot(patch: Partial<ProductsState>): void {
  snapshot = { ...snapshot, ...patch };
  notify();
}

function messageFrom(error: unknown): string {
  if (error instanceof ProductApiError) return error.message;
  return "Tidak dapat memuat produk dari server.";
}

async function requestJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ProductApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.error === "string"
        ? data.error
        : "Permintaan produk gagal diproses.";
    throw new ProductApiError(message, response.status);
  }

  return data;
}

function parseProductsResponse(data: unknown): Product[] {
  if (
    !isRecord(data) ||
    data.success !== true ||
    !Array.isArray(data.products)
  ) {
    throw new ProductApiError("Respons daftar produk tidak valid.", 502);
  }

  const parsed = data.products.map(parseProduct);
  if (data.products.length > 0 && parsed.every((item) => item === null)) {
    throw new ProductApiError("Data produk dari server tidak valid.", 502);
  }

  return parsed.filter((product): product is Product => product !== null);
}

function parseProductResponse(data: unknown): Product {
  if (!isRecord(data) || data.success !== true) {
    throw new ProductApiError("Respons produk tidak valid.", 502);
  }

  const product = parseProduct(data.product);
  if (!product) {
    throw new ProductApiError("Data produk dari server tidak valid.", 502);
  }

  return product;
}

export function getProductsStateSnapshot(): ProductsState {
  return snapshot;
}

export function getServerProductsStateSnapshot(): ProductsState {
  return initialSnapshot;
}

/** @deprecated Gunakan `useProductsState()` agar status loading/error ikut terbaca. */
export function getProductsSnapshot(): Product[] {
  return snapshot.products;
}

export function getServerProductsSnapshot(): Product[] {
  return seedProducts;
}

function broadcastProductsChange(): void {
  productChannel?.postMessage("products-updated");
}

function applyProduct(product: Product, mode: "upsert" | "prepend"): void {
  requestVersion += 1;

  let products: Product[];
  if (mode === "prepend") {
    products = [
      product,
      ...snapshot.products.filter((item) => item.id !== product.id),
    ];
  } else if (snapshot.products.some((item) => item.id === product.id)) {
    products = snapshot.products.map((item) =>
      item.id === product.id ? product : item,
    );
  } else {
    products = [product, ...snapshot.products];
  }

  setSnapshot({ products, isLoading: false, error: null });
  broadcastProductsChange();
}

export async function refreshProducts(): Promise<void> {
  if (!isBrowser() || activeLoad) return activeLoad ?? Promise.resolve();

  const version = ++requestVersion;
  setSnapshot({ isLoading: true, error: null });

  activeLoad = (async () => {
    try {
      const data = await requestJson("/api/products");
      if (version !== requestVersion) return;

      setSnapshot({
        products: parseProductsResponse(data),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (version !== requestVersion) return;
      setSnapshot({ isLoading: false, error: messageFrom(error) });
    } finally {
      activeLoad = null;
    }
  })();

  return activeLoad;
}

function startProductWatcher(): void {
  if (stopProductWatcher !== null || !isBrowser()) return;

  const resync = () => {
    void refreshProducts();
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") resync();
  };

  window.addEventListener("focus", resync);
  window.addEventListener("online", resync);
  window.addEventListener("pageshow", resync);
  document.addEventListener("visibilitychange", handleVisibility);

  const pollTimer = window.setInterval(() => {
    if (document.visibilityState === "visible") resync();
  }, POLL_INTERVAL_MS);

  if (typeof BroadcastChannel !== "undefined") {
    productChannel = new BroadcastChannel(PRODUCTS_CHANNEL_NAME);
    productChannel.addEventListener("message", resync);
  }

  stopProductWatcher = () => {
    window.removeEventListener("focus", resync);
    window.removeEventListener("online", resync);
    window.removeEventListener("pageshow", resync);
    document.removeEventListener("visibilitychange", handleVisibility);
    window.clearInterval(pollTimer);
    productChannel?.close();
    productChannel = null;
    stopProductWatcher = null;
  };

  void refreshProducts();
}

export function subscribeProducts(listener: Listener): () => void {
  listeners.add(listener);
  startProductWatcher();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopProductWatcher?.();
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const data = await requestJson("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const product = parseProductResponse(data);
  applyProduct(product, "prepend");
  return product;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const data = await requestJson(`/api/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  const product = parseProductResponse(data);
  applyProduct(product, "upsert");
  return product;
}

export async function setProductStatus(
  id: string,
  status: ProductStatus,
): Promise<Product> {
  const data = await requestJson(`/api/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const product = parseProductResponse(data);
  applyProduct(product, "upsert");
  return product;
}

export async function toggleProductStatus(id: string): Promise<Product> {
  const existing = snapshot.products.find((product) => product.id === id);
  if (!existing) {
    throw new ProductApiError("Produk tidak ditemukan di daftar.", 404);
  }

  return setProductStatus(
    id,
    existing.status === "ready" ? "sold-out" : "ready",
  );
}

export async function deleteProduct(id: string): Promise<void> {
  await requestJson(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  requestVersion += 1;
  setSnapshot({
    products: snapshot.products.filter((product) => product.id !== id),
    isLoading: false,
    error: null,
  });
  broadcastProductsChange();
}

export async function resetProducts(): Promise<Product[]> {
  const data = await requestJson("/api/products/reset", { method: "POST" });
  const products = parseProductsResponse(data);

  requestVersion += 1;
  setSnapshot({ products, isLoading: false, error: null });
  broadcastProductsChange();

  return products;
}
