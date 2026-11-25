"use client";

import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  PackageSearch,
  Printer,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import {
  DELIVERY_METHOD_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SERVICE_TICKET_STATUS_LABELS,
} from "@/lib/order-constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { buildWarrantyClaimUrl } from "@/lib/whatsapp";
import type { Order, ServiceTicket, ServiceTicketStatus } from "@/types";

interface WarrantyCardData {
  warrantyCode: string;
  productName: string;
  warrantyDays: number;
  startDate: string;
  expiresAt: string;
  isActive: boolean;
}

type TrackResult =
  | {
      type: "order";
      order: Order;
      warranties: WarrantyCardData[];
    }
  | {
      type: "service";
      ticket: ServiceTicket;
    };

function getOrderStepIndex(order: Order): number {
  switch (order.status) {
    case "pending_approval":
    case "payment_review":
      return 0;
    case "approved":
      return 1;
    case "out_for_delivery":
    case "ready_for_pickup":
      return 2;
    case "completed":
      return 3;
    default:
      return -1;
  }
}

const SERVICE_STEPS: Array<{ status: ServiceTicketStatus; label: string }> = [
  { status: "received", label: "Tiket Diterima" },
  { status: "diagnosing", label: "Cek Teknisi" },
  { status: "waiting_parts", label: "Sparepart" },
  { status: "repairing", label: "Dikerjakan" },
  { status: "ready_for_pickup", label: "Siap Diambil" },
  { status: "completed", label: "Selesai" },
];

export function TrackClient() {
  const [code, setCode] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const paramCode = new URLSearchParams(window.location.search).get("code");
    if (paramCode) {
      const frame = requestAnimationFrame(() => {
        setCode(paramCode.trim().toUpperCase());
      });
      return () => cancelAnimationFrame(frame);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSearching) return;

    setError(null);
    setResult(null);

    const normalizedCode = code.trim().toUpperCase();
    const cleanedLast4 = phoneLast4.replace(/\D/g, "").slice(0, 4);

    if (!normalizedCode) {
      setError("Masukkan kode pesanan (FC-...) atau kode servis (SRV-...).");
      return;
    }

    if (cleanedLast4.length !== 4) {
      setError("Masukkan tepat 4 digit terakhir nomor WhatsApp Anda.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalizedCode,
          phoneLast4: cleanedLast4,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        type?: "order" | "service";
        order?: Order;
        warranties?: WarrantyCardData[];
        ticket?: ServiceTicket;
      } | null;

      if (!res.ok || !data?.success) {
        setError(
          data?.error ??
            "Data tidak ditemukan. Periksa kembali kode dan 4 digit terakhir HP Anda.",
        );
        return;
      }

      if (data.type === "order" && data.order) {
        setResult({
          type: "order",
          order: data.order,
          warranties: Array.isArray(data.warranties) ? data.warranties : [],
        });
      } else if (data.type === "service" && data.ticket) {
        setResult({
          type: "service",
          ticket: data.ticket,
        });
      }
    } catch {
      setError("Gagal menghubungi server. Periksa koneksi internet Anda.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="no-print text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-royal-200 bg-royal-50 px-3.5 py-1 text-xs font-extrabold text-royal-800">
            <PackageSearch className="size-4" aria-hidden="true" />
            Pelacakan Pesanan, Servis & E-Warranty
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Lacak Status Pesanan & Servis HP
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Pantau progres pesanan COD, status pengerjaan teknisi, dan cetak Kartu Garansi Elektronik (E-Warranty) resmi.
          </p>
        </div>

        {/* Form Pencarian */}
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="no-print mt-8 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-[1.4fr_0.9fr]">
            <div>
              <label
                htmlFor="track-code"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Kode Pesanan / Kode Servis
              </label>
              <input
                id="track-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Contoh: FC-20261125-A1B2 atau SRV-20261125-C3D4"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 font-mono text-sm font-bold text-slate-900 uppercase outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
              />
            </div>

            <div>
              <label
                htmlFor="track-phone4"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                4 Digit Terakhir No. HP
              </label>
              <input
                id="track-phone4"
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={phoneLast4}
                onChange={(e) =>
                  setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Contoh: 9234"
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 font-mono text-sm font-bold tracking-widest text-slate-900 outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-royal-600/25 transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
          >
            {isSearching ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span>Mencari Data...</span>
              </>
            ) : (
              <>
                <Search className="size-4" aria-hidden="true" />
                <span>Lacak Status Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Hasil Pelacakan Order */}
        {result?.type === "order" && (
          <div className="mt-8 space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    Status Pesanan
                  </p>
                  <h2 className="mt-0.5 font-mono text-xl font-black text-royal-700">
                    {result.order.orderCode}
                  </h2>
                  <p className="mt-1 text-xs text-slate-600">
                    {result.order.customerName} ({result.order.customerPhone}) •{" "}
                    {formatDate(result.order.createdAt)}
                  </p>
                </div>

                <Link
                  href={`/order/${encodeURIComponent(result.order.orderCode)}`}
                  className="no-print inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-royal-200 bg-royal-50 px-3.5 py-2 text-xs font-extrabold text-royal-700 hover:bg-royal-100"
                >
                  <span>Lihat Invoice Digital</span>
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              </div>

              {/* Stepper Timeline Order */}
              {getOrderStepIndex(result.order) >= 0 ? (
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    "Pesanan Masuk",
                    "Disetujui Admin",
                    result.order.deliveryMethod === "pickup"
                      ? "Siap Diambil"
                      : "Kurir Menuju Lokasi",
                    "Selesai & Garansi",
                  ].map((label, idx) => {
                    const current = getOrderStepIndex(result.order);
                    const done = idx <= current;
                    return (
                      <div
                        key={label}
                        className={cn(
                          "rounded-2xl border p-3.5 transition-colors",
                          done
                            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                            : "border-slate-200 bg-slate-50/60 text-slate-400",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-black",
                              done
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 text-slate-500",
                            )}
                          >
                            {done ? "✓" : idx + 1}
                          </span>
                          <p className="text-xs font-extrabold">{label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                  <AlertTriangle
                    className="mt-0.5 size-5 shrink-0 text-rose-600"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-extrabold">
                      Status: {ORDER_STATUS_LABELS[result.order.status]}
                    </p>
                    {result.order.adminNotes && (
                      <p className="mt-1">Catatan Admin: {result.order.adminNotes}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Detail Ringkas */}
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-3">
                <div>
                  <p className="font-bold text-slate-500 uppercase">Pengiriman</p>
                  <p className="mt-1 font-extrabold text-slate-900">
                    {DELIVERY_METHOD_LABELS[result.order.deliveryMethod]}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase">Pembayaran</p>
                  <p className="mt-1 font-extrabold text-slate-900">
                    {PAYMENT_METHOD_LABELS[result.order.paymentMethod]}
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 uppercase">Total Tagihan</p>
                  <p className="mt-1 text-sm font-black text-royal-700">
                    {formatRupiah(result.order.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Barang */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {(result.order.items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-slate-500">
                        {item.quantity} × {formatRupiah(item.unitPrice)}
                      </p>
                    </div>
                    <p className="font-extrabold text-slate-900">
                      {formatRupiah(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Kartu Garansi Elektronik (E-Warranty) */}
            {result.warranties.length > 0 && (
              <section className="invoice-sheet rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-royal-50 p-6 shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <Award className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold tracking-widest text-emerald-700 uppercase">
                        Kartu Garansi Elektronik (E-Warranty)
                      </p>
                      <h3 className="text-lg font-black text-slate-900">
                        Konter Fajar Cell — Banjarnegara
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="no-print inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Printer className="size-3.5" aria-hidden="true" />
                    Cetak Kartu Garansi
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {result.warranties.map((w) => (
                    <div
                      key={w.warrantyCode}
                      className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-royal-700">
                          {w.warrantyCode}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-extrabold",
                            w.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {w.isActive ? "Garansi Aktif" : "Masa Garansi Habis"}
                        </span>
                      </div>

                      <p className="text-sm font-extrabold text-slate-900">
                        {w.productName}
                      </p>

                      <p className="flex items-center gap-1.5 text-xs text-slate-600">
                        <ShieldCheck
                          className="size-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>
                          Berlaku {w.warrantyDays} hari ({formatDate(w.startDate)} –{" "}
                          <strong>{formatDate(w.expiresAt)}</strong>)
                        </span>
                      </p>

                      <div className="no-print pt-1">
                        <WhatsAppLink
                          href={buildWarrantyClaimUrl(
                            result.order.orderCode,
                            w.warrantyCode,
                            w.productName,
                          )}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          Klaim Garansi via WA
                        </WhatsAppLink>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Hasil Pelacakan Tiket Servis */}
        {result?.type === "service" && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-700 uppercase">
                  <Wrench className="size-3.5" aria-hidden="true" />
                  Tiket Servis HP
                </p>
                <h2 className="mt-0.5 font-mono text-xl font-black text-slate-900">
                  {result.ticket.ticketCode}
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {result.ticket.brand} {result.ticket.deviceModel} •{" "}
                  {result.ticket.customerName} ({result.ticket.customerPhone})
                </p>
              </div>

              <span className="rounded-full border border-royal-200 bg-royal-50 px-3 py-1 text-xs font-extrabold text-royal-800">
                {SERVICE_TICKET_STATUS_LABELS[result.ticket.status]}
              </span>
            </div>

            {result.ticket.status !== "cancelled" ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {SERVICE_STEPS.map((step, idx) => {
                  const currentIdx = SERVICE_STEPS.findIndex(
                    (s) => s.status === result.ticket.status,
                  );
                  const done = idx <= currentIdx;
                  return (
                    <div
                      key={step.status}
                      className={cn(
                        "rounded-2xl border p-3 text-center",
                        done
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-slate-200 bg-slate-50/60 text-slate-400",
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          "mx-auto size-4",
                          done ? "text-emerald-600" : "text-slate-300",
                        )}
                        aria-hidden="true"
                      />
                      <p className="mt-1.5 text-[11px] font-extrabold">
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                Tiket servis ini dibatalkan.
              </p>
            )}

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <p className="font-bold text-slate-700">Keluhan Dilaporkan:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.ticket.issues.map((issue) => (
                  <span
                    key={issue}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700"
                  >
                    {issue}
                  </span>
                ))}
              </div>
              {result.ticket.adminNotes && (
                <p className="pt-2 text-slate-700">
                  <strong>Catatan Teknisi:</strong> {result.ticket.adminNotes}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </Container>
  );
}
