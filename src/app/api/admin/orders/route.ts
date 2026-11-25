import { requireAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { listOrdersSafe } from "@/lib/orders-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  try {
    const { orders, isFallback } = await listOrdersSafe();
    return apiJson({ success: true, orders, isFallback });
  } catch (error) {
    console.error("GET /api/admin/orders gagal:", error);
    return apiError("Gagal memuat daftar pesanan.", 500);
  }
}
