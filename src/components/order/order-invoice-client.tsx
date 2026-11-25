"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-constants";
import { defaultStoreSettings } from "@/lib/store";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { buildOrderConfirmationUrl } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/types";

const STATUS_BADGE_TONES: Record<OrderStatus, string> = {
  pending_approval: "border-amber-200 bg-amber-50 text-amber-800",
  payment_review: "border-sky-200 bg-sky-50 text-sky-800",
  approved: "border-royal-200 bg-royal-50 text-royal-800",
  out_for_delivery: "border-indigo-200 bg-indigo-50 text-indigo-800",
  ready_for_pickup: "border-cyan-200 bg-cyan-50 text-cyan-800",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  expired: "border-slate-300 bg-slate-100 text-slate-600",
};

export function OrderInvoiceClient({ order }: { order: Order }) {
  const googleMapsUrl =
    order.destinationLat !== null && order.destinationLng !== null
      ? `https://maps.google.com/?q=${order.destinationLat},${order.destinationLng}`
      : null;

  return (
    <Container className="py-8 sm:py-12">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-700 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Kembali ke Katalog
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="size-4" aria-hidden="true" />
            <span>Cetak / Simpan PDF</span>
          </button>

          <WhatsAppLink href={buildOrderConfirmationUrl(order)} size="md">
            Konfirmasi Cepat via WA
          </WhatsAppLink>
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <article className="invoice-sheet mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Invoice Header */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-extrabold tracking-widest text-royal-700 uppercase">
                Invoice Digital Resmi
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {defaultStoreSettings.name}
              </h1>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                {defaultStoreSettings.address} • {defaultStoreSettings.displayPhone}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Kode Pesanan
              </p>
              <p className="mt-0.5 font-mono text-xl font-black text-royal-700">
                {order.orderCode}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Dibuat: {formatDate(order.createdAt)}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold",
                  STATUS_BADGE_TONES[order.status],
                )}
              >
                <Clock className="size-3.5" aria-hidden="true" />
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Info Pembeli & Pengiriman */}
        <div className="grid gap-6 border-b border-slate-200 px-6 py-6 sm:grid-cols-2 sm:px-8">
          <div>
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Data Pembeli
            </h2>
            <p className="mt-1.5 text-sm font-extrabold text-slate-900">
              {order.customerName}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              WhatsApp: {order.customerPhone}
            </p>
            {order.notes && (
              <p className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                <strong className="font-bold text-slate-800">Catatan:</strong>{" "}
                {order.notes}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Pengiriman & Pembayaran
            </h2>
            <p className="mt-1.5 text-sm font-extrabold text-slate-900">
              {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">
              Pembayaran: {PAYMENT_METHOD_LABELS[order.paymentMethod]}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              {order.destinationAddress}
            </p>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="no-print mt-2 inline-flex items-center gap-1 text-xs font-bold text-royal-700 hover:underline"
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                Buka Koordinat di Google Maps
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* Rincian Produk */}
        <div className="px-6 py-6 sm:px-8">
          <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Rincian Produk
          </h2>

          <div className="mt-3 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {(order.items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    {item.productName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      {item.quantity} unit × {formatRupiah(item.unitPrice)}
                    </span>
                    {item.warrantyDays > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        Garansi {item.warrantyDays} hari
                      </span>
                    )}
                  </div>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-slate-900">
                  {formatRupiah(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Ringkasan Harga */}
          <dl className="mt-5 ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <dt>Subtotal Produk</dt>
              <dd className="font-bold text-slate-900">
                {formatRupiah(order.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <dt>
                Ongkir{" "}
                {order.deliveryMethod === "cod"
                  ? `(${order.distanceKm} km)`
                  : "(Self-Pickup)"}
              </dt>
              <dd className="font-bold text-slate-900">
                {order.shippingFee === 0
                  ? "Gratis"
                  : formatRupiah(order.shippingFee)}
              </dd>
            </div>
            {order.paymentUniqueCode > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <dt>Kode Unik Pembayaran</dt>
                <dd className="font-bold text-royal-700">
                  +{formatRupiah(order.paymentUniqueCode)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-base">
              <dt className="font-extrabold text-slate-900">Total Tagihan</dt>
              <dd className="text-xl font-black text-royal-700">
                {formatRupiah(order.totalAmount)}
              </dd>
            </div>
          </dl>

          {order.paymentProofUrl && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-xs font-bold text-slate-700">
                Bukti Pembayaran Terlampir:
              </p>
              <div className="mt-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.paymentProofUrl}
                  alt="Bukti transfer pesanan"
                  className="size-20 rounded-xl border border-slate-200 object-cover bg-white"
                />
                <p className="text-xs text-slate-600">
                  Bukti transfer sedang / telah diperiksa oleh admin Konter Fajar Cell.
                </p>
              </div>
            </div>
          )}

          {/* Riwayat Status */}
          {order.history && order.history.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Riwayat Status Pesanan
              </h2>
              <ul className="mt-3 space-y-2.5">
                {order.history.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-2.5 text-xs">
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-royal-600"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-bold text-slate-900">
                        {ORDER_STATUS_LABELS[entry.toStatus]}
                      </p>
                      {entry.note && (
                        <p className="text-slate-600">{entry.note}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </article>
    </Container>
  );
}
