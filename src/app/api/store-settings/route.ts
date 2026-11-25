import { apiError, apiJson } from "@/lib/api-response";
import { getStorePaymentSettingsSafe } from "@/lib/store-settings-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const { settings } = await getStorePaymentSettingsSafe();
    return apiJson({ success: true, settings });
  } catch (error) {
    console.error("GET /api/store-settings gagal:", error);
    return apiError("Gagal memuat pengaturan toko.", 500);
  }
}
