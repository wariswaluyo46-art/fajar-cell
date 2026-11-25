import { requireAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { listServiceTicketsSafe } from "@/lib/service-tickets-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const { tickets, isFallback } = await listServiceTicketsSafe();
    return apiJson({ success: true, tickets, isFallback });
  } catch (error) {
    console.error("GET /api/admin/service-tickets gagal:", error);
    return apiError("Gagal memuat daftar tiket servis.", 500);
  }
}
