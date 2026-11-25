import "server-only";

import { randomBytes, randomUUID } from "node:crypto";

import type {
  CreateServiceTicketInput,
  ServiceTicket,
  ServiceTicketStatus,
} from "@/types";

import { isServiceTicketStatus } from "./order-constants";
import { isOmsUnavailableError } from "./orders-db";
import { getSupabaseAdmin } from "./supabase";

interface ServiceTicketRow {
  id: string;
  ticket_code: string;
  brand: string;
  device_model: string;
  issues: unknown;
  customer_name: string;
  customer_phone: string;
  visit_type: string;
  estimated_cost_min: number | string;
  estimated_cost_max: number | string;
  notes: string;
  admin_notes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const globalForServiceTickets = globalThis as typeof globalThis & {
  kfcServiceTicketsFallbackStore?: Map<string, ServiceTicket>;
};

function getFallbackStore(): Map<string, ServiceTicket> {
  if (!globalForServiceTickets.kfcServiceTicketsFallbackStore) {
    globalForServiceTickets.kfcServiceTicketsFallbackStore = new Map();
  }
  return globalForServiceTickets.kfcServiceTicketsFallbackStore;
}

function generateTicketCode(existingCodes?: Set<string>): string {
  const now = new Date();
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");

  for (let i = 0; i < 10; i += 1) {
    const suffix = randomBytes(2).toString("hex").toUpperCase();
    const code = `SRV-${jakartaDate}-${suffix}`;
    if (!existingCodes || !existingCodes.has(code)) return code;
  }

  return `SRV-${jakartaDate}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function parseIssues(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && item.trim() !== "",
  );
}

function mapTicketRow(row: ServiceTicketRow): ServiceTicket {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    brand: row.brand,
    deviceModel: row.device_model,
    issues: parseIssues(row.issues),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    visitType:
      row.visit_type === "tanya-stok-dulu"
        ? "tanya-stok-dulu"
        : "datang-langsung",
    estimatedCostMin: Number(row.estimated_cost_min) || 0,
    estimatedCostMax: Number(row.estimated_cost_max) || 0,
    notes: row.notes ?? "",
    adminNotes: row.admin_notes ?? "",
    status: isServiceTicketStatus(row.status) ? row.status : "received",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listServiceTicketsSafe(): Promise<{
  tickets: ServiceTicket[];
  isFallback: boolean;
}> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("service_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      throw new Error(`Supabase gagal memuat tiket servis: ${error.message}`);
    }

    const dbTickets = ((data ?? []) as ServiceTicketRow[]).map(mapTicketRow);
    return { tickets: dbTickets, isFallback: false };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    const tickets = Array.from(getFallbackStore().values()).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
    return { tickets, isFallback: true };
  }
}

export async function createServiceTicketSafe(
  input: CreateServiceTicketInput,
): Promise<{ ticket: ServiceTicket; isFallback: boolean }> {
  const store = getFallbackStore();
  const ticketCode = generateTicketCode(new Set(store.keys()));
  const nowIso = new Date().toISOString();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("service_tickets")
      .insert({
        ticket_code: ticketCode,
        brand: input.brand.trim(),
        device_model: input.deviceModel.trim(),
        issues: input.issues,
        customer_name: input.customerName.trim(),
        customer_phone: input.customerPhone.trim(),
        visit_type: input.visitType,
        estimated_cost_min: input.estimatedCostMin ?? 0,
        estimated_cost_max: input.estimatedCostMax ?? 0,
        notes: input.notes?.trim() ?? "",
        status: "received",
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Supabase gagal menyimpan tiket servis: ${error.message}`);
    }

    return {
      ticket: mapTicketRow(data as ServiceTicketRow),
      isFallback: false,
    };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    const ticket: ServiceTicket = {
      id: randomUUID(),
      ticketCode,
      brand: input.brand.trim(),
      deviceModel: input.deviceModel.trim(),
      issues: input.issues,
      customerName: input.customerName.trim(),
      customerPhone: input.customerPhone.trim(),
      visitType: input.visitType,
      estimatedCostMin: input.estimatedCostMin ?? 0,
      estimatedCostMax: input.estimatedCostMax ?? 0,
      notes: input.notes?.trim() ?? "",
      adminNotes: "",
      status: "received",
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.set(ticketCode, ticket);
    return { ticket, isFallback: true };
  }
}

export async function updateServiceTicketStatusSafe(
  id: string,
  status: ServiceTicketStatus,
  adminNotes?: string,
): Promise<{ ticket: ServiceTicket | null; isFallback: boolean }> {
  try {
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (adminNotes !== undefined) {
      patch.admin_notes = adminNotes.trim();
    }

    const { data, error } = await getSupabaseAdmin()
      .from("service_tickets")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase gagal memperbarui tiket servis: ${error.message}`);
    }

    return {
      ticket: data ? mapTicketRow(data as ServiceTicketRow) : null,
      isFallback: false,
    };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    const store = getFallbackStore();
    for (const [code, existing] of store) {
      if (existing.id === id) {
        const updated: ServiceTicket = {
          ...existing,
          status,
          adminNotes:
            adminNotes !== undefined ? adminNotes.trim() : existing.adminNotes,
          updatedAt: new Date().toISOString(),
        };
        store.set(code, updated);
        return { ticket: updated, isFallback: true };
      }
    }

    return { ticket: null, isFallback: true };
  }
}

export async function getServiceTicketByCodeSafe(
  ticketCode: string,
): Promise<{ ticket: ServiceTicket | null; isFallback: boolean }> {
  const normalized = ticketCode.trim().toUpperCase();

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("service_tickets")
      .select("*")
      .eq("ticket_code", normalized)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase gagal mencari tiket servis: ${error.message}`);
    }

    return {
      ticket: data
        ? mapTicketRow(data as ServiceTicketRow)
        : (getFallbackStore().get(normalized) ?? null),
      isFallback: false,
    };
  } catch (error) {
    if (!isOmsUnavailableError(error)) {
      throw error;
    }

    return {
      ticket: getFallbackStore().get(normalized) ?? null,
      isFallback: true,
    };
  }
}
