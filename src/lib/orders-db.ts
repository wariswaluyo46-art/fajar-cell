import "server-only";

import type {
  AdminOrderTransitionResult,
  CartItem,
  CreateOrderInput,
  CreateOrderResult,
  Order,
  OrderChangedBy,
  OrderItem,
  OrderStatus,
  OrderStatusHistoryEntry,
  Product,
  ProductAvailability,
  ReserveCartResult,
} from "@/types";

import {
  fallbackGetAvailabilityMap,
  fallbackGetSessionReservations,
  fallbackReleaseSession,
  fallbackReserveCartItem,
} from "./cart-fallback";
import {
  CART_RESERVATION_TTL_MINUTES,
  isDeliveryMethod,
  isOrderStatus,
  isPaymentMethod,
} from "./order-constants";
import {
  fallbackCreateOrderFromCart,
  fallbackGetOrderByCode,
  fallbackListOrders,
  fallbackTransitionOrder,
} from "./orders-fallback";
import { getAllProducts } from "./products";
import { getProductById, listProducts } from "./products-db";
import { getSupabaseAdmin } from "./supabase";

export interface SessionCartSnapshot {
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  earliestExpiresAt: string | null;
  serverTime: string;
  isFallback: boolean;
}

interface AvailabilityRow {
  product_id: string;
  total_stock: number | string;
  reserved_by_others: number | string;
  reserved_by_self: number | string;
  pending_order_qty: number | string;
  available_stock: number | string;
}

interface CartReservationRow {
  id: string;
  product_id: string;
  quantity: number | string;
  expires_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

export function isOmsUnavailableError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  const lowered = message.toLowerCase();

  return (
    lowered.includes("konfigurasi supabase") ||
    lowered.includes("pgrst205") ||
    lowered.includes("42p01") ||
    lowered.includes("42883") ||
    lowered.includes("does not exist") ||
    lowered.includes("could not find the function") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("fetch failed") ||
    lowered.includes("enotfound") ||
    lowered.includes("econnrefused")
  );
}

function extractWarrantyDays(product: Product): number {
  if (product.category === "aksesoris") return 0;
  return product.warranty.active ? product.warranty.durationDays : 0;
}

export async function cleanupExpiredReservations(): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "cleanup_expired_reservations",
  );

  if (error) {
    throw new Error(
      `Supabase gagal cleanup_expired_reservations: ${error.message}`,
    );
  }

  return toInt(data, 0);
}

export async function reserveCartItem(params: {
  sessionId: string;
  productId: string;
  quantity: number;
  ttlMinutes?: number;
}): Promise<ReserveCartResult> {
  const { data, error } = await getSupabaseAdmin().rpc("reserve_cart_item", {
    p_session_id: params.sessionId,
    p_product_id: params.productId,
    p_qty: params.quantity,
    p_ttl_minutes: params.ttlMinutes ?? CART_RESERVATION_TTL_MINUTES,
  });

  if (error) {
    throw new Error(`Supabase gagal reserve_cart_item: ${error.message}`);
  }

  if (!isRecord(data)) {
    throw new Error("Respons reserve_cart_item tidak valid.");
  }

  return {
    ok: data.ok === true,
    code: toStringOrUndefined(data.code),
    message: toStringOrUndefined(data.message),
    released: data.released === true ? true : undefined,
    reservationId: toStringOrUndefined(data.reservation_id),
    productId: toStringOrUndefined(data.product_id) ?? params.productId,
    quantity:
      data.quantity !== undefined ? toInt(data.quantity, 0) : undefined,
    expiresAt: toStringOrUndefined(data.expires_at),
    availableStock:
      data.available_stock !== undefined
        ? toInt(data.available_stock, 0)
        : undefined,
  };
}

export async function reserveCartItemSafe(params: {
  sessionId: string;
  productId: string;
  quantity: number;
  ttlMinutes?: number;
}): Promise<{ result: ReserveCartResult; isFallback: boolean }> {
  try {
    const result = await reserveCartItem(params);
    return { result, isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    console.warn(
      "reserve_cart_item RPC belum tersedia, memakai fallback in-memory:",
      error instanceof Error ? error.message : error,
    );

    let product: Product | undefined;
    try {
      product = (await getProductById(params.productId)) ?? undefined;
    } catch {
      product = undefined;
    }

    if (!product) {
      product = getAllProducts().find((item) => item.id === params.productId);
    }

    return {
      result: fallbackReserveCartItem(
        params.sessionId,
        product,
        params.quantity,
        params.ttlMinutes ?? CART_RESERVATION_TTL_MINUTES,
      ),
      isFallback: true,
    };
  }
}

export async function createOrderFromCart(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "create_order_from_cart",
    {
      p_session_id: input.sessionId,
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_delivery_method: input.deliveryMethod,
      p_payment_method: input.paymentMethod,
      p_payment_unique_code: input.paymentUniqueCode ?? 0,
      p_payment_proof_url: input.paymentProofUrl ?? null,
      p_destination_address: input.destinationAddress ?? "",
      p_destination_lat: input.destinationLat ?? null,
      p_destination_lng: input.destinationLng ?? null,
      p_distance_km: input.distanceKm ?? 0,
      p_shipping_fee: input.shippingFee ?? 0,
      p_notes: input.notes ?? "",
    },
  );

  if (error) {
    throw new Error(`Supabase gagal create_order_from_cart: ${error.message}`);
  }

  if (!isRecord(data)) {
    throw new Error("Respons create_order_from_cart tidak valid.");
  }

  return {
    ok: data.ok === true,
    code: toStringOrUndefined(data.code),
    message: toStringOrUndefined(data.message),
    productId: toStringOrUndefined(data.product_id),
    orderId: toStringOrUndefined(data.order_id),
    orderCode: toStringOrUndefined(data.order_code),
    status: isOrderStatus(data.status) ? data.status : undefined,
    subtotal:
      data.subtotal !== undefined ? toInt(data.subtotal, 0) : undefined,
    shippingFee:
      data.shipping_fee !== undefined
        ? toInt(data.shipping_fee, 0)
        : undefined,
    paymentUniqueCode:
      data.payment_unique_code !== undefined
        ? toInt(data.payment_unique_code, 0)
        : undefined,
    totalAmount:
      data.total_amount !== undefined ? toInt(data.total_amount, 0) : undefined,
  };
}

export async function adminTransitionOrder(
  orderId: string,
  nextStatus: OrderStatus,
  adminNote = "",
): Promise<AdminOrderTransitionResult> {
  const { data, error } = await getSupabaseAdmin().rpc(
    "admin_transition_order",
    {
      p_order_id: orderId,
      p_next_status: nextStatus,
      p_admin_note: adminNote,
    },
  );

  if (error) {
    throw new Error(`Supabase gagal admin_transition_order: ${error.message}`);
  }

  if (!isRecord(data)) {
    throw new Error("Respons admin_transition_order tidak valid.");
  }

  return {
    ok: data.ok === true,
    code: toStringOrUndefined(data.code),
    message: toStringOrUndefined(data.message),
    unchanged: data.unchanged === true ? true : undefined,
    orderId: toStringOrUndefined(data.order_id),
    orderCode: toStringOrUndefined(data.order_code),
    fromStatus: isOrderStatus(data.from_status) ? data.from_status : undefined,
    toStatus: isOrderStatus(data.to_status) ? data.to_status : undefined,
    stockDeducted:
      typeof data.stock_deducted === "boolean"
        ? data.stock_deducted
        : undefined,
  };
}

export async function getProductsAvailabilityMap(
  sessionId?: string,
  fallbackProducts?: Product[],
): Promise<Map<string, ProductAvailability>> {
  const result = new Map<string, ProductAvailability>();

  try {
    const { data, error } = await getSupabaseAdmin().rpc(
      "get_products_availability",
      { p_session_id: sessionId ?? null },
    );

    if (error) {
      console.warn(
        "get_products_availability RPC gagal, fallback ke stok lokal/in-memory:",
        error.message,
      );
      return fallbackProducts
        ? fallbackGetAvailabilityMap(fallbackProducts, sessionId)
        : result;
    }

    for (const row of (data ?? []) as AvailabilityRow[]) {
      if (typeof row.product_id !== "string" || row.product_id === "") {
        continue;
      }

      result.set(row.product_id, {
        productId: row.product_id,
        totalStock: toInt(row.total_stock, 0),
        reservedByOthers: toInt(row.reserved_by_others, 0),
        reservedBySelf: toInt(row.reserved_by_self, 0),
        pendingOrderQty: toInt(row.pending_order_qty, 0),
        availableStock: toInt(row.available_stock, 0),
      });
    }

    return result;
  } catch (error) {
    console.warn(
      "getProductsAvailabilityMap tidak tersedia, fallback ke stok lokal/in-memory:",
      error instanceof Error ? error.message : error,
    );
    return fallbackProducts
      ? fallbackGetAvailabilityMap(fallbackProducts, sessionId)
      : result;
  }
}

function buildCartSnapshot(
  reservations: Array<{
    id: string;
    productId: string;
    quantity: number;
    expiresAt: string;
  }>,
  productMap: Map<string, Product>,
  availabilityMap: Map<string, ProductAvailability>,
  isFallback: boolean,
): SessionCartSnapshot {
  const items: CartItem[] = [];
  let subtotal = 0;
  let totalQuantity = 0;
  let earliestMs: number | null = null;

  for (const res of reservations) {
    const product = productMap.get(res.productId);
    if (!product || product.status !== "ready" || product.stock <= 0) {
      continue;
    }

    const avail = availabilityMap.get(product.id);
    const availableStock = avail ? avail.availableStock : product.stock;
    const quantity = Math.max(1, Math.min(res.quantity, availableStock || res.quantity));

    items.push({
      reservationId: res.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      thumbnail: product.thumbnail,
      unitPrice: product.price,
      quantity,
      availableStock,
      warrantyDays: extractWarrantyDays(product),
      expiresAt: res.expiresAt,
    });

    subtotal += product.price * quantity;
    totalQuantity += quantity;

    const expMs = Date.parse(res.expiresAt);
    if (Number.isFinite(expMs) && (earliestMs === null || expMs < earliestMs)) {
      earliestMs = expMs;
    }
  }

  return {
    items,
    subtotal,
    totalQuantity,
    earliestExpiresAt:
      earliestMs !== null ? new Date(earliestMs).toISOString() : null,
    serverTime: new Date().toISOString(),
    isFallback,
  };
}

export async function getSessionCart(
  sessionId: string,
): Promise<SessionCartSnapshot> {
  let products: Product[];
  try {
    products = await listProducts();
  } catch {
    products = getAllProducts();
  }
  const productMap = new Map(products.map((product) => [product.id, product]));

  try {
    await cleanupExpiredReservations();

    const nowIso = new Date().toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from("cart_reservations")
      .select("id, product_id, quantity, expires_at")
      .eq("session_id", sessionId)
      .eq("status", "held")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Supabase gagal membaca cart_reservations: ${error.message}`);
    }

    const reservations = ((data ?? []) as CartReservationRow[]).map((row) => ({
      id: row.id,
      productId: row.product_id,
      quantity: toInt(row.quantity, 1),
      expiresAt: new Date(row.expires_at).toISOString(),
    }));

    const availabilityMap = await getProductsAvailabilityMap(sessionId, products);
    return buildCartSnapshot(reservations, productMap, availabilityMap, false);
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    const fallbackRows = fallbackGetSessionReservations(sessionId).map((row) => ({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      expiresAt: new Date(row.expiresAtMs).toISOString(),
    }));
    const availabilityMap = fallbackGetAvailabilityMap(products, sessionId);

    return buildCartSnapshot(fallbackRows, productMap, availabilityMap, true);
  }
}

export async function releaseSessionCart(
  sessionId: string,
  productId?: string,
): Promise<void> {
  try {
    let query = getSupabaseAdmin()
      .from("cart_reservations")
      .update({
        status: "released",
        updated_at: new Date().toISOString(),
      })
      .eq("session_id", sessionId)
      .eq("status", "held");

    if (productId) {
      query = query.eq("product_id", productId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`Supabase gagal melepas reservasi: ${error.message}`);
    }
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    fallbackReleaseSession(sessionId, productId);
  }
}

interface OrderRow {
  id: string;
  order_code: string;
  session_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_method: string;
  payment_method: string;
  payment_unique_code: number | string;
  payment_proof_url: string | null;
  destination_address: string;
  destination_lat: number | null;
  destination_lng: number | null;
  distance_km: number | string;
  shipping_fee: number | string;
  subtotal: number | string;
  total_amount: number | string;
  notes: string;
  status: string;
  stock_deducted: boolean;
  admin_notes: string;
  approved_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  unit_price: number | string;
  quantity: number | string;
  warranty_days: number | string;
  created_at: string;
}

interface OrderHistoryRow {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  note: string;
  created_at: string;
}

function mapOrderRow(
  row: OrderRow,
  items: OrderItem[],
  history: OrderStatusHistoryEntry[],
): Order {
  return {
    id: row.id,
    orderCode: row.order_code,
    sessionId: row.session_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryMethod: isDeliveryMethod(row.delivery_method)
      ? row.delivery_method
      : "cod",
    paymentMethod: isPaymentMethod(row.payment_method)
      ? row.payment_method
      : "cod",
    paymentUniqueCode: toInt(row.payment_unique_code, 0),
    paymentProofUrl: row.payment_proof_url ?? null,
    destinationAddress: row.destination_address ?? "",
    destinationLat:
      typeof row.destination_lat === "number" ? row.destination_lat : null,
    destinationLng:
      typeof row.destination_lng === "number" ? row.destination_lng : null,
    distanceKm: Number(row.distance_km) || 0,
    shippingFee: toInt(row.shipping_fee, 0),
    subtotal: toInt(row.subtotal, 0),
    totalAmount: toInt(row.total_amount, 0),
    notes: row.notes ?? "",
    status: isOrderStatus(row.status) ? row.status : "pending_approval",
    stockDeducted: Boolean(row.stock_deducted),
    adminNotes: row.admin_notes ?? "",
    approvedAt: row.approved_at ? new Date(row.approved_at).toISOString() : null,
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    items,
    history,
  };
}

export async function createOrderFromCartSafe(
  input: CreateOrderInput,
): Promise<{ result: CreateOrderResult; isFallback: boolean }> {
  try {
    const result = await createOrderFromCart(input);
    return { result, isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    console.warn(
      "create_order_from_cart RPC belum tersedia, memakai fallback in-memory:",
      error instanceof Error ? error.message : error,
    );

    let products: Product[];
    try {
      products = await listProducts();
    } catch {
      products = getAllProducts();
    }

    return {
      result: fallbackCreateOrderFromCart(input, products),
      isFallback: true,
    };
  }
}

export async function getOrderByCodeSafe(
  orderCode: string,
): Promise<{ order: Order | null; isFallback: boolean }> {
  const normalized = orderCode.trim().toUpperCase();

  try {
    const supabase = getSupabaseAdmin();
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", normalized)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Supabase gagal memuat order: ${orderError.message}`);
    }

    if (!orderData) {
      return { order: fallbackGetOrderByCode(normalized), isFallback: false };
    }

    const row = orderData as OrderRow;

    const [{ data: itemsData, error: itemsError }, { data: historyData, error: historyError }] =
      await Promise.all([
        supabase
          .from("order_items")
          .select("*")
          .eq("order_id", row.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_status_history")
          .select("*")
          .eq("order_id", row.id)
          .order("created_at", { ascending: true }),
      ]);

    if (itemsError) {
      throw new Error(`Supabase gagal memuat item order: ${itemsError.message}`);
    }
    if (historyError) {
      throw new Error(
        `Supabase gagal memuat riwayat order: ${historyError.message}`,
      );
    }

    const items: OrderItem[] = ((itemsData ?? []) as OrderItemRow[]).map(
      (item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        unitPrice: toInt(item.unit_price, 0),
        quantity: toInt(item.quantity, 1),
        warrantyDays: toInt(item.warranty_days, 0),
        createdAt: new Date(item.created_at).toISOString(),
      }),
    );

    const history: OrderStatusHistoryEntry[] = (
      (historyData ?? []) as OrderHistoryRow[]
    ).map((entry) => ({
      id: entry.id,
      orderId: entry.order_id,
      fromStatus:
        entry.from_status && isOrderStatus(entry.from_status)
          ? entry.from_status
          : null,
      toStatus: isOrderStatus(entry.to_status)
        ? entry.to_status
        : "pending_approval",
      changedBy:
        entry.changed_by === "admin" || entry.changed_by === "system"
          ? (entry.changed_by as OrderChangedBy)
          : "customer",
      note: entry.note ?? "",
      createdAt: new Date(entry.created_at).toISOString(),
    }));

    return { order: mapOrderRow(row, items, history), isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    return { order: fallbackGetOrderByCode(normalized), isFallback: true };
  }
}

export async function listOrdersSafe(): Promise<{
  orders: Order[];
  isFallback: boolean;
}> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: orderRows, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (orderError) {
      throw new Error(`Supabase gagal memuat daftar order: ${orderError.message}`);
    }

    const rows = (orderRows ?? []) as OrderRow[];
    if (rows.length === 0) {
      return { orders: fallbackListOrders(), isFallback: false };
    }

    const orderIds = rows.map((row) => row.id);
    const [{ data: itemsData, error: itemsError }, { data: historyData, error: historyError }] =
      await Promise.all([
        supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("order_status_history")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: true }),
      ]);

    if (itemsError) {
      throw new Error(`Supabase gagal memuat item order: ${itemsError.message}`);
    }
    if (historyError) {
      throw new Error(
        `Supabase gagal memuat riwayat order: ${historyError.message}`,
      );
    }

    const itemsByOrder = new Map<string, OrderItem[]>();
    for (const item of (itemsData ?? []) as OrderItemRow[]) {
      const list = itemsByOrder.get(item.order_id) ?? [];
      list.push({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        unitPrice: toInt(item.unit_price, 0),
        quantity: toInt(item.quantity, 1),
        warrantyDays: toInt(item.warranty_days, 0),
        createdAt: new Date(item.created_at).toISOString(),
      });
      itemsByOrder.set(item.order_id, list);
    }

    const historyByOrder = new Map<string, OrderStatusHistoryEntry[]>();
    for (const entry of (historyData ?? []) as OrderHistoryRow[]) {
      const list = historyByOrder.get(entry.order_id) ?? [];
      list.push({
        id: entry.id,
        orderId: entry.order_id,
        fromStatus:
          entry.from_status && isOrderStatus(entry.from_status)
            ? entry.from_status
            : null,
        toStatus: isOrderStatus(entry.to_status)
          ? entry.to_status
          : "pending_approval",
        changedBy:
          entry.changed_by === "admin" || entry.changed_by === "system"
            ? (entry.changed_by as OrderChangedBy)
            : "customer",
        note: entry.note ?? "",
        createdAt: new Date(entry.created_at).toISOString(),
      });
      historyByOrder.set(entry.order_id, list);
    }

    const orders = rows.map((row) =>
      mapOrderRow(
        row,
        itemsByOrder.get(row.id) ?? [],
        historyByOrder.get(row.id) ?? [],
      ),
    );

    return { orders, isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    console.warn(
      "listOrdersSafe memakai fallback in-memory:",
      error instanceof Error ? error.message : error,
    );
    return { orders: fallbackListOrders(), isFallback: true };
  }
}

export async function adminTransitionOrderSafe(
  orderId: string,
  nextStatus: OrderStatus,
  adminNote = "",
): Promise<{ result: AdminOrderTransitionResult; isFallback: boolean }> {
  try {
    const result = await adminTransitionOrder(orderId, nextStatus, adminNote);
    return { result, isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    console.warn(
      "admin_transition_order RPC belum tersedia, memakai fallback in-memory:",
      error instanceof Error ? error.message : error,
    );
    return {
      result: fallbackTransitionOrder(orderId, nextStatus, adminNote),
      isFallback: true,
    };
  }
}
