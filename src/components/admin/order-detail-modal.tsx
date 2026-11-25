"use client";

import {
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Navigation,
  ShieldCheck,
  Truck,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";

import { Modal } from "@/components/ui/modal";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_ALLOWED_TRANSITIONS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/order-constants";
import { STORE_ORIGIN } from "@/lib/shipping";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { buildBuyerStatusWhatsAppUrl } from "@/lib/whatsapp";
import type { Order, OrderStatus } from "@/types";

interface OrderDetailModalProps {
  order: Order;
  isSubmitting: boolean;
  onTransition: (
    orderId: string,
    nextStatus: OrderStatus,
    adminNote: string,
  ) => Promise<boolean>;
  onClose: () => void;
}

const TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
  approved: "Setujui Pesanan / Verifikasi Bayar",
  out_for_delivery: "Tandai Sedang Diantar (COD)",
  ready_for_pickup: "Tandai Siap Diambil di Konter",
  completed: "Selesaikan Pesanan (Terbitkan Garansi)",
};

export function OrderDetailModal({
  order,
  isSubmitting,
  onTransition,
  onClose,
}: OrderDetailModalProps) {
  const [adminNote, setAdminNote] = useState(order.adminNotes ?? "");
  const [rejectMode, setRejectMode] = useState<"rejected" | "cancelled" | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [isProofZoomed, setIsProofZoomed] = useState(false);

  const allowed = ORDER_ALLOWED_TRANSITIONS[order.status] ?? [];

  const positiveActions = allowed.filter((status) => {
    if (status === "rejected" || status === "cancelled" || status === "expired") {
      return false;
    }
    if (status === "payment_review") return false;
    if (status === "out_for_delivery" && order.deliveryMethod !== "cod") {
      return false;
    }
    if (status === "ready_for_pickup" && order.deliveryMethod !== "pickup") {
      return false;
    }
    return true;
  });

  const canReject = allowed.includes("rejected");
  const canCancel = allowed.includes("cancelled");

  const googleMapsRouteUrl =
    order.destinationLat !== null && order.destinationLng !== null
      ? `https://www.google.com/maps/dir/?api=1&origin=${STORE_ORIGIN.lat},${STORE_ORIGIN.lng}&destination=${order.destinationLat},${order.destinationLng}&travelmode=driving`
      : null;

  async function handlePositiveAction(nextStatus: OrderStatus) {
    if (isSubmitting) return;
    await onTransition(order.id, nextStatus, adminNote.trim());
  }

  async function handleNegativeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!rejectMode || isSubmitting) return;
    if (rejectReason.trim() === "") return;
    const ok = await onTransition(order.id, rejectMode, rejectReason.trim());
    if (ok) {
      setRejectMode(null);
      setRejectReason("");
    }
  }

  return (
    <>
      <Modal
        title={`Pesanan ${order.orderCode}`}
        description={`${ORDER_STATUS_LABELS[order.status]} • Dibuat ${formatDate(order.createdAt)}`}
        size="xl"
        onClose={onClose}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={buildBuyerStatusWhatsAppUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-wa-gradient px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Hubungi Pembeli via WA
              </a>
              <a
                href={`/order/${encodeURIComponent(order.orderCode)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <span>Buka Invoice</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Kolom Kiri: Data Pembeli, Barang & Riwayat */}
          <div className="space-y-5">
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">
                  Pembeli
                </p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">
                  {order.customerName}
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-slate-700">
                  {order.customerPhone}
                </p>
                {order.notes && (
                  <p className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-600 border border-slate-200/80">
                    <strong>Catatan:</strong> {order.notes}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">
                  Pengiriman & Pembayaran
                </p>
                <p className="mt-1 text-xs font-extrabold text-slate-900">
                  {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-royal-700">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                  {order.paymentUniqueCode > 0
                    ? ` (Kode unik +${order.paymentUniqueCode})`
                    : ""}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {order.destinationAddress}
                </p>
                {googleMapsRouteUrl && (
                  <a
                    href={googleMapsRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-royal-50 px-2.5 py-1.5 text-xs font-bold text-royal-700 border border-royal-200 hover:bg-royal-100"
                  >
                    <Navigation className="size-3.5" aria-hidden="true" />
                    Buka Rute di Google Maps ({order.distanceKm} km)
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>

            {/* Rincian Produk */}
            <div>
              <h3 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                Rincian Barang ({order.stockDeducted ? "Stok sudah dikurangi" : "Stok masih ditahan"})
              </h3>
              <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {(order.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">
                        {item.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                        {item.warrantyDays > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <ShieldCheck className="size-3" aria-hidden="true" />
                            Garansi {item.warrantyDays} hari
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-slate-900">
                      {formatRupiah(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <dl className="mt-3 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="font-bold text-slate-900">
                    {formatRupiah(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Ongkir</dt>
                  <dd className="font-bold text-slate-900">
                    {order.shippingFee === 0
                      ? "Gratis"
                      : formatRupiah(order.shippingFee)}
                  </dd>
                </div>
                {order.paymentUniqueCode > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <dt>Kode Unik</dt>
                    <dd className="font-bold text-royal-700">
                      +{formatRupiah(order.paymentUniqueCode)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                  <dt className="font-extrabold text-slate-900">Total Tagihan</dt>
                  <dd className="font-black text-royal-700">
                    {formatRupiah(order.totalAmount)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Timeline Riwayat */}
            {order.history && order.history.length > 0 && (
              <div>
                <h3 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase">
                  Riwayat Status
                </h3>
                <ul className="mt-2 space-y-2 rounded-2xl border border-slate-200 p-4">
                  {order.history.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-royal-600"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-bold text-slate-900">
                          {ORDER_STATUS_LABELS[entry.toStatus]}{" "}
                          <span className="font-normal text-slate-400">
                            ({entry.changedBy})
                          </span>
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

          {/* Kolom Kanan: Bukti Bayar & Panel Aksi Approval */}
          <div className="space-y-5">
            {order.paymentProofUrl && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold text-slate-900">
                    Bukti Pembayaran ({PAYMENT_METHOD_LABELS[order.paymentMethod]})
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsProofZoomed(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-royal-700 hover:underline cursor-pointer"
                  >
                    <ZoomIn className="size-3.5" aria-hidden="true" />
                    Perbesar
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProofZoomed(true)}
                  className="mt-2.5 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.paymentProofUrl}
                    alt="Bukti pembayaran"
                    className="max-h-64 w-full object-contain"
                  />
                </button>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-royal-700" aria-hidden="true" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Proses Pesanan (State Machine)
                </h3>
              </div>

              {allowed.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-slate-600">
                  Pesanan sudah berada pada status akhir (
                  <strong>{ORDER_STATUS_LABELS[order.status]}</strong>).
                </p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="admin-order-note"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Catatan Admin (Opsional untuk approval)
                    </label>
                    <input
                      id="admin-order-note"
                      type="text"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Mis. kurir Mas Fajar berangkat jam 14.00"
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-royal-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {positiveActions.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          void handlePositiveAction(nextStatus);
                        }}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <LoaderCircle
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        )}
                        <span>
                          {TRANSITION_LABELS[nextStatus] ??
                            ORDER_STATUS_LABELS[nextStatus]}
                        </span>
                      </button>
                    ))}
                  </div>

                  {(canReject || canCancel) && !rejectMode && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      {canReject && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setRejectMode("rejected")}
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <XCircle className="size-3.5" aria-hidden="true" />
                          Tolak Pesanan
                        </button>
                      )}
                      {canCancel && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setRejectMode("cancelled")}
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <XCircle className="size-3.5" aria-hidden="true" />
                          Batalkan Pesanan
                        </button>
                      )}
                    </div>
                  )}

                  {rejectMode && (
                    <form
                      onSubmit={(e) => {
                        void handleNegativeSubmit(e);
                      }}
                      className="space-y-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3"
                    >
                      <p className="text-xs font-extrabold text-rose-900">
                        {rejectMode === "rejected"
                          ? "Alasan Penolakan (Wajib Diisi)"
                          : "Alasan Pembatalan (Wajib Diisi)"}
                      </p>
                      <textarea
                        rows={2}
                        required
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Mis. Bukti transfer tidak terbaca / unit terjual offline..."
                        className="w-full rounded-lg border border-rose-200 bg-white p-2 text-xs text-slate-900 outline-none focus:border-rose-400"
                      />
                      <p className="text-[11px] text-rose-800">
                        Stok unit akan otomatis dilepas/dikembalikan ke katalog.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSubmitting || rejectReason.trim() === ""}
                          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? "Memproses..." : "Konfirmasi"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectMode(null);
                            setRejectReason("");
                          }}
                          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>

            {order.deliveryMethod === "cod" &&
              order.destinationLat !== null &&
              order.destinationLng !== null && (
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-royal-600"
                    aria-hidden="true"
                  />
                  <span>
                    Koordinat tujuan: {order.destinationLat.toFixed(5)},{" "}
                    {order.destinationLng.toFixed(5)} (Jarak {order.distanceKm} km)
                  </span>
                </div>
              )}
          </div>
        </div>
      </Modal>

      {/* Lightbox Zoom Bukti Transfer */}
      {isProofZoomed && order.paymentProofUrl && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setIsProofZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau bukti pembayaran diperbesar"
        >
          <button
            type="button"
            onClick={() => setIsProofZoomed(false)}
            aria-label="Tutup pratinjau gambar"
            className="fixed top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg cursor-pointer"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.paymentProofUrl}
            alt="Bukti pembayaran diperbesar"
            className={cn(
              "max-h-[90dvh] max-w-[92vw] rounded-2xl bg-white object-contain shadow-2xl",
            )}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
