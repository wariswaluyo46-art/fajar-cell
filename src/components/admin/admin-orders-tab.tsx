"use client";

import {
  CheckCircle2,
  Eye,
  ImageIcon,
  LoaderCircle,
  RotateCcw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";

import { OrderDetailModal } from "@/components/admin/order-detail-modal";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

interface AdminOrdersTabProps {
  orders: Order[];
  isLoading: boolean;
  isTransitioning: boolean;
  onRefresh: () => Promise<void>;
  onTransition: (
    orderId: string,
    nextStatus: OrderStatus,
    adminNote: string,
  ) => Promise<boolean>;
}

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending_approval: "bg-amber-50 text-amber-800 border-amber-200",
  payment_review: "bg-sky-50 text-sky-800 border-sky-200",
  approved: "bg-royal-50 text-royal-800 border-royal-200",
  out_for_delivery: "bg-indigo-50 text-indigo-800 border-indigo-200",
  ready_for_pickup: "bg-cyan-50 text-cyan-800 border-cyan-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-300",
  expired: "bg-slate-100 text-slate-500 border-slate-300",
};

export function AdminOrdersTab({
  orders,
  isLoading,
  isTransitioning,
  onRefresh,
  onTransition,
}: AdminOrdersTabProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (keyword === "") return true;
      return `${order.orderCode} ${order.customerName} ${order.customerPhone}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [orders, query, statusFilter]);

  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) => o.status === "pending_approval" || o.status === "payment_review",
      ).length,
    [orders],
  );

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode pesanan (FC-...), nama pembeli, atau no WA..."
              aria-label="Cari pesanan"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "all")
              }
              aria-label="Filter status pesanan"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-royal-400"
            >
              <option value="all">Semua status ({orders.length})</option>
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_LABELS[st]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                void onRefresh();
              }}
              disabled={isLoading}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="size-4" aria-hidden="true" />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredOrders.length}</strong>{" "}
            dari {orders.length} pesanan
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-bold text-amber-700">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {pendingCount} pesanan menunggu konfirmasi / verifikasi bayar
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ShoppingBag className="mx-auto size-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-slate-800">
            Belum ada pesanan yang cocok
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pesanan baru dari halaman checkout akan langsung muncul di sini.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Kode & Tanggal</th>
                    <th className="px-4 py-3">Pembeli</th>
                    <th className="px-4 py-3">Pengiriman & Bayar</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <p className="font-mono text-xs font-extrabold text-royal-700">
                          {order.orderCode}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-slate-900">
                          {order.customerName}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                          {order.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-semibold text-slate-800">
                          {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
                          {order.paymentProofUrl && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <ImageIcon className="size-2.5" aria-hidden="true" />
                              Bukti
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-extrabold text-slate-900 tabular-nums">
                          {formatRupiah(order.totalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(order.items ?? []).reduce((sum, i) => sum + i.quantity, 0)} unit
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                            STATUS_BADGE_CLASS[order.status],
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-royal-700 px-3 text-xs font-bold text-white hover:bg-royal-800 cursor-pointer"
                        >
                          <Eye className="size-3.5" aria-hidden="true" />
                          Detail & Proses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 lg:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-extrabold text-royal-700">
                      {order.orderCode}
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.customerPhone} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                      STATUS_BADGE_CLASS[order.status],
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                    </p>
                    <p className="text-sm font-extrabold text-royal-700">
                      {formatRupiah(order.totalAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-royal-700 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    <Eye className="size-3.5" aria-hidden="true" />
                    Detail & Proses
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedOrder && (
        <OrderDetailModal
          key={selectedOrder.id}
          order={selectedOrder}
          isSubmitting={isTransitioning}
          onTransition={onTransition}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
