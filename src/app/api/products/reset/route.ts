import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson } from "@/lib/api-response";
import { resetProductRecords } from "@/lib/products-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  try {
    const products = await resetProductRecords();
    return apiJson({ success: true, products });
  } catch (error) {
    console.error("POST /api/products/reset gagal:", error);
    return apiError("Data produk gagal direset.", 500);
  }
}
