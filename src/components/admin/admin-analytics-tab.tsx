"use client";

import {
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Download,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";

import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-constants";
import { formatRupiah } from "@/lib/utils";
import type { Order } from "@/types";

interface AdminAnalyticsTabProps {
  orders: Order[];
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? "");
  // Netralisasi potensi CSV formula injection (=, +, -, @, tab, CR)
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function AdminAnalyticsTab({ orders }: AdminAnalyticsTabProps) {
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyCompletedRevenue = 0;
    let activePipelineValue = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let validOrdersCount = 0;
    let validOrdersSum = 0;

    const topProductsMap = new Map<
      string,
      { name: string; units: number; revenue: number }
    >();
    const paymentCounts = new Map<string, number>();

    for (const order of orders) {
      const created = new Date(order.createdAt);
      const isThisMonth =
        created.getMonth() === currentMonth &&
        created.getFullYear() === currentYear;

      if (order.status === "completed") {
        completedCount += 1;
        if (isThisMonth) {
          monthlyCompletedRevenue += order.totalAmount;
        }
      }

      if (
        order.status === "pending_approval" ||
        order.status === "payment_review"
      ) {
        pendingCount += 1;
      }

      if (
        order.status === "approved" ||
        order.status === "out_for_delivery" ||
        order.status === "ready_for_pickup"
      ) {
        activePipelineValue += order.totalAmount;
      }

      if (
        order.status !== "rejected" &&
        order.status !== "cancelled" &&
        order.status !== "expired"
      ) {
        validOrdersCount += 1;
        validOrdersSum += order.totalAmount;
        paymentCounts.set(
          order.paymentMethod,
          (paymentCounts.get(order.paymentMethod) ?? 0) + 1,
        );

        for (const item of order.items ?? []) {
          const current = topProductsMap.get(item.productName) ?? {
            name: item.productName,
            units: 0,
            revenue: 0,
          };
          current.units += item.quantity;
          current.revenue += item.unitPrice * item.quantity;
          topProductsMap.set(item.productName, current);
        }
      }
    }

    const avgOrderValue =
      validOrdersCount > 0 ? Math.round(validOrdersSum / validOrdersCount) : 0;

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 8);

    return {
      monthlyCompletedRevenue,
      activePipelineValue,
      completedCount,
      pendingCount,
      avgOrderValue,
      validOrdersCount,
      topProducts,
      paymentCounts,
    };
  }, [orders]);

  function handleExportCsv() {
    const headers = [
      "Kode Pesanan",
      "Tanggal",
      "Nama Pembeli",
      "No WhatsApp",
      "Pengiriman",
      "Pembayaran",
      "Jarak (km)",
      "Ongkir",
      "Subtotal",
      "Kode Unik",
      "Total",
      "Status",
      "Daftar Produk",
    ];

    const rows = orders.map((order) => {
      const itemsText = (order.items ?? [])
        .map((i) => `${i.productName} (${i.quantity}x)`)
        .join("; ");

      return [
        order.orderCode,
        order.createdAt,
        order.customerName,
        order.customerPhone,
        DELIVERY_METHOD_LABELS[order.deliveryMethod],
        PAYMENT_METHOD_LABELS[order.paymentMethod],
        order.distanceKm,
        order.shippingFee,
        order.subtotal,
        order.paymentUniqueCode,
        order.totalAmount,
        ORDER_STATUS_LABELS[order.status],
        itemsText,
      ]
        .map(escapeCsvCell)
        .join(",");
    });

    const csv = `\uFEFF${headers.map(escapeCsvCell).join(",")}\r\n${rows.join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateSlug = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    link.href = url;
    link.download = `laporan-pesanan-fajar-cell-${dateSlug}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Ringkasan Penjualan & Laporan OMS
          </h2>
          <p className="text-xs text-slate-500">
            Data omzet dihitung dari pesanan berstatus Selesai dan pesanan aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={orders.length === 0}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-royal-700 px-4 text-xs font-extrabold text-white shadow-xs transition hover:bg-royal-800 disabled:opacity-50 cursor-pointer"
        >
          <Download className="size-4" aria-hidden="true" />
          Export Laporan CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Omzet Bulan Ini
            </p>
            <CircleDollarSign
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 sm:text-2xl">
            {formatRupiah(metrics.monthlyCompletedRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            +{formatRupiah(metrics.activePipelineValue)} sedang diproses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Order Selesai
            </p>
            <CheckCircle2
              className="size-4 text-royal-600"
              aria-hidden="true"
            />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 sm:text-2xl">
            {metrics.completedCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Dari {metrics.validOrdersCount} pesanan valid
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Menunggu Approval
            </p>
            <Clock className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 sm:text-2xl">
            {metrics.pendingCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Perlu konfirmasi / cek bukti bayar
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase">
              Rata-Rata Order
            </p>
            <TrendingUp className="size-4 text-sky-600" aria-hidden="true" />
          </div>
          <p className="mt-2 text-lg font-black text-slate-900 sm:text-2xl">
            {formatRupiah(metrics.avgOrderValue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Per transaksi pesanan valid
          </p>
        </div>
      </div>

      {/* Produk Terlaris & Distribusi Metode Bayar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-royal-700" aria-hidden="true" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Produk Terlaris
            </h3>
          </div>

          {metrics.topProducts.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              Belum ada data transaksi produk.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {metrics.topProducts.map((item, idx) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-royal-100 font-bold text-royal-700">
                      {idx + 1}
                    </span>
                    <span className="truncate font-bold text-slate-900">
                      {item.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-extrabold text-slate-900">
                      {item.units} unit
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatRupiah(item.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-slate-900">
            Distribusi Metode Pembayaran
          </h3>
          {metrics.validOrdersCount === 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              Belum ada data metode pembayaran.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {(["cod", "qris", "dana"] as const).map((method) => {
                const count = metrics.paymentCounts.get(method) ?? 0;
                const percent = Math.round(
                  (count / metrics.validOrdersCount) * 100,
                );
                return (
                  <div key={method}>
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{PAYMENT_METHOD_LABELS[method]}</span>
                      <span>
                        {count} order ({percent}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-brand-gradient transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
