"use client";

import {
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Save,
  Search,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SERVICE_TICKET_STATUS_LABELS } from "@/lib/order-constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import { buildServiceTicketStatusWhatsAppUrl } from "@/lib/whatsapp";
import type { ServiceTicket, ServiceTicketStatus } from "@/types";

interface AdminServiceTicketsTabProps {
  tickets: ServiceTicket[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onUpdateTicket: (
    id: string,
    status: ServiceTicketStatus,
    adminNotes: string,
  ) => Promise<boolean>;
}

const TICKET_BADGE_CLASS: Record<ServiceTicketStatus, string> = {
  received: "bg-amber-50 text-amber-800 border-amber-200",
  diagnosing: "bg-sky-50 text-sky-800 border-sky-200",
  waiting_parts: "bg-orange-50 text-orange-800 border-orange-200",
  repairing: "bg-indigo-50 text-indigo-800 border-indigo-200",
  ready_for_pickup: "bg-cyan-50 text-cyan-800 border-cyan-200",
  completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-300",
};

function TicketRowCard({
  ticket,
  onUpdate,
}: {
  ticket: ServiceTicket;
  onUpdate: (
    id: string,
    status: ServiceTicketStatus,
    adminNotes: string,
  ) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<ServiceTicketStatus>(ticket.status);
  const [adminNotes, setAdminNotes] = useState(ticket.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onUpdate(ticket.id, status, adminNotes);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-extrabold text-royal-700">
              {ticket.ticketCode}
            </span>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                TICKET_BADGE_CLASS[ticket.status],
              )}
            >
              {SERVICE_TICKET_STATUS_LABELS[ticket.status]}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-extrabold text-slate-900">
            {ticket.brand} {ticket.deviceModel}
          </h3>
          <p className="text-xs text-slate-600">
            {ticket.customerName} ({ticket.customerPhone}) •{" "}
            {formatDate(ticket.createdAt)}
          </p>
        </div>

        <a
          href={buildServiceTicketStatusWhatsAppUrl({
            ...ticket,
            status,
            adminNotes,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-wa-gradient px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95"
        >
          <MessageCircle className="size-3.5" aria-hidden="true" />
          Hubungi via WA
        </a>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ticket.issues.map((issue) => (
          <span
            key={issue}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
          >
            {issue}
          </span>
        ))}
        {ticket.estimatedCostMax > 0 && (
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
            Estimasi: {formatRupiah(ticket.estimatedCostMin)} –{" "}
            {formatRupiah(ticket.estimatedCostMax)}
          </span>
        )}
      </div>

      {ticket.notes && (
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <strong>Keluhan pelanggan:</strong> {ticket.notes}
        </p>
      )}

      <div className="grid gap-2.5 border-t border-slate-100 pt-3 sm:grid-cols-[200px_1fr_auto]">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ServiceTicketStatus)}
          aria-label={`Ubah status tiket ${ticket.ticketCode}`}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-royal-400"
        >
          {(
            Object.keys(SERVICE_TICKET_STATUS_LABELS) as ServiceTicketStatus[]
          ).map((st) => (
            <option key={st} value={st}>
              {SERVICE_TICKET_STATUS_LABELS[st]}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Catatan teknisi / estimasi biaya pasti..."
          aria-label={`Catatan teknisi untuk ${ticket.ticketCode}`}
          className="h-10 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
        />

        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-royal-700 px-4 text-xs font-extrabold text-white hover:bg-royal-800 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-3.5" aria-hidden="true" />
          )}
          Simpan
        </button>
      </div>
    </div>
  );
}

export function AdminServiceTicketsTab({
  tickets,
  isLoading,
  onRefresh,
  onUpdateTicket,
}: AdminServiceTicketsTabProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ServiceTicketStatus | "all"
  >("all");

  const filteredTickets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }
      if (keyword === "") return true;
      return `${ticket.ticketCode} ${ticket.customerName} ${ticket.customerPhone} ${ticket.brand} ${ticket.deviceModel}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [tickets, query, statusFilter]);

  return (
    <div className="space-y-4">
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
              placeholder="Cari kode tiket (SRV-...), perangkat, atau nama pelanggan..."
              aria-label="Cari tiket servis"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-9 text-sm text-slate-900 outline-none focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as ServiceTicketStatus | "all",
                )
              }
              aria-label="Filter status tiket servis"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-royal-400"
            >
              <option value="all">Semua status ({tickets.length})</option>
              {(
                Object.keys(
                  SERVICE_TICKET_STATUS_LABELS,
                ) as ServiceTicketStatus[]
              ).map((st) => (
                <option key={st} value={st}>
                  {SERVICE_TICKET_STATUS_LABELS[st]}
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
              Refresh
            </button>
          </div>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Wrench className="mx-auto size-10 text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-slate-800">
            Belum ada tiket servis
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Booking servis dari halaman /service akan otomatis tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <TicketRowCard
              key={ticket.id}
              ticket={ticket}
              onUpdate={onUpdateTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
