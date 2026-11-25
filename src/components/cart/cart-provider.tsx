"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { useToast } from "@/components/ui/toast-provider";
import { notifyProductsChanged } from "@/lib/product-repository";
import type { CartItem, Product } from "@/types";

const CART_CHANNEL_NAME = "kfc-cart-sync";

interface CartApiResponse {
  success?: boolean;
  error?: string;
  items?: CartItem[];
  subtotal?: number;
  totalQuantity?: number;
  earliestExpiresAt?: string | null;
  serverTime?: string;
}

interface CartContextValue {
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
  earliestExpiresAt: string | null;
  serverOffsetMs: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  pendingProductId: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (product: Product, delta?: number) => Promise<boolean>;
  updateItemQuantity: (productId: string, nextQty: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [earliestExpiresAt, setEarliestExpiresAt] = useState<string | null>(
    null,
  );
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const expiredGuardRef = useRef<string | null>(null);

  const broadcastCartChange = useCallback(() => {
    channelRef.current?.postMessage("cart-updated");
  }, []);

  const applyCartPayload = useCallback((data: CartApiResponse) => {
    setItems(Array.isArray(data.items) ? data.items : []);
    setSubtotal(typeof data.subtotal === "number" ? data.subtotal : 0);
    setTotalQuantity(
      typeof data.totalQuantity === "number" ? data.totalQuantity : 0,
    );
    setEarliestExpiresAt(
      typeof data.earliestExpiresAt === "string"
        ? data.earliestExpiresAt
        : null,
    );

    if (typeof data.serverTime === "string") {
      const serverMs = Date.parse(data.serverTime);
      if (Number.isFinite(serverMs)) {
        setServerOffsetMs(serverMs - Date.now());
      }
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (isAdminRoute) return;

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as
        | CartApiResponse
        | null;
      if (response.ok && data?.success) {
        applyCartPayload(data);
      }
    } catch {
      // Abaikan gangguan jaringan sesaat saat sync latar belakang
    }
  }, [applyCartPayload, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return;

    const frame = requestAnimationFrame(() => {
      void refreshCart();
    });

    const handleFocus = () => {
      void refreshCart();
    };
    window.addEventListener("focus", handleFocus);

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CART_CHANNEL_NAME);
      channelRef.current = channel;
      channel.addEventListener("message", handleFocus);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("focus", handleFocus);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [isAdminRoute, refreshCart]);

  // Pantau batas waktu reservasi 15 menit agar otomatis dilepas saat 00:00
  useEffect(() => {
    if (isAdminRoute || !earliestExpiresAt || items.length === 0) {
      expiredGuardRef.current = null;
      return;
    }

    const expiresMs = Date.parse(earliestExpiresAt);
    if (!Number.isFinite(expiresMs)) return;

    const remainingMs = expiresMs - (Date.now() + serverOffsetMs);
    const delayMs = Math.max(400, remainingMs + 500);

    const timer = window.setTimeout(() => {
      if (expiredGuardRef.current === earliestExpiresAt) return;
      expiredGuardRef.current = earliestExpiresAt;

      void refreshCart();
      notifyProductsChanged();
      broadcastCartChange();

      showToast({
        variant: "info",
        title: "Masa reservasi berakhir",
        description:
          "Waktu hold keranjang 15 menit telah habis sehingga stok dilepas kembali.",
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    broadcastCartChange,
    earliestExpiresAt,
    isAdminRoute,
    items.length,
    refreshCart,
    serverOffsetMs,
    showToast,
  ]);

  const updateItemQuantity = useCallback(
    async (productId: string, nextQty: number): Promise<boolean> => {
      setPendingProductId(productId);
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity: Math.max(0, Math.trunc(nextQty)),
          }),
        });

        const data = (await response.json().catch(() => null)) as
          | CartApiResponse
          | null;

        if (!response.ok || !data?.success) {
          showToast({
            variant: "error",
            title: "Stok tidak mencukupi",
            description:
              data?.error ??
              "Gagal memperbarui jumlah produk di keranjang.",
          });
          notifyProductsChanged();
          void refreshCart();
          return false;
        }

        applyCartPayload(data);
        broadcastCartChange();
        notifyProductsChanged();
        return true;
      } catch {
        showToast({
          variant: "error",
          title: "Koneksi bermasalah",
          description: "Tidak dapat memperbarui keranjang. Coba lagi.",
        });
        return false;
      } finally {
        setPendingProductId(null);
      }
    },
    [applyCartPayload, broadcastCartChange, refreshCart, showToast],
  );

  const addToCart = useCallback(
    async (product: Product, delta = 1): Promise<boolean> => {
      const existingQty =
        items.find((item) => item.productId === product.id)?.quantity ?? 0;
      const targetQty = existingQty + delta;

      const ok = await updateItemQuantity(product.id, targetQty);
      if (ok) {
        setIsDrawerOpen(true);
        showToast({
          variant: "success",
          title: "Diamankan di Keranjang",
          description: `${product.name} ditahan khusus untuk Anda selama 15 menit.`,
        });
      }
      return ok;
    },
    [items, showToast, updateItemQuantity],
  );

  const removeItem = useCallback(
    async (productId: string): Promise<boolean> => {
      setPendingProductId(productId);
      try {
        const response = await fetch(
          `/api/cart?productId=${encodeURIComponent(productId)}`,
          { method: "DELETE", cache: "no-store" },
        );
        const data = (await response.json().catch(() => null)) as
          | CartApiResponse
          | null;

        if (!response.ok || !data?.success) {
          showToast({
            variant: "error",
            title: "Gagal menghapus item",
            description: data?.error ?? "Silakan coba lagi.",
          });
          return false;
        }

        applyCartPayload(data);
        broadcastCartChange();
        notifyProductsChanged();
        return true;
      } catch {
        showToast({
          variant: "error",
          title: "Koneksi bermasalah",
          description: "Tidak dapat menghapus produk dari keranjang.",
        });
        return false;
      } finally {
        setPendingProductId(null);
      }
    },
    [applyCartPayload, broadcastCartChange, showToast],
  );

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | CartApiResponse
        | null;

      if (response.ok && data?.success) {
        applyCartPayload(data);
        broadcastCartChange();
        notifyProductsChanged();
        showToast({
          variant: "info",
          title: "Keranjang dikosongkan",
          description: "Semua stok reservasi telah dilepas kembali.",
        });
      }
    } catch {
      showToast({
        variant: "error",
        title: "Gagal mengosongkan keranjang",
        description: "Periksa koneksi internet lalu coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [applyCartPayload, broadcastCartChange, showToast]);

  const getItemQuantity = useCallback(
    (productId: string) =>
      items.find((item) => item.productId === productId)?.quantity ?? 0,
    [items],
  );

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setIsDrawerOpen((prev) => !prev),
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      subtotal,
      totalQuantity,
      earliestExpiresAt,
      serverOffsetMs,
      isLoading,
      isDrawerOpen,
      pendingProductId,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      refreshCart,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      getItemQuantity,
    }),
    [
      items,
      subtotal,
      totalQuantity,
      earliestExpiresAt,
      serverOffsetMs,
      isLoading,
      isDrawerOpen,
      pendingProductId,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      refreshCart,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      getItemQuantity,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {!isAdminRoute && <CartDrawer />}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart harus dipakai di dalam CartProvider.");
  }
  return context;
}
