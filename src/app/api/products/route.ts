import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { parseProductInput } from "@/lib/product-input";
import { getAllProducts } from "@/lib/products";
import { createProductRecord, listProducts } from "@/lib/products-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1_024;

export async function GET(): Promise<Response> {
  try {
    const products = await listProducts();
    return apiJson({ success: true, products });
  } catch (error) {
    console.warn("GET /api/products gagal memuat dari database, beralih ke data lokal:", error);
    try {
      const fallbackProducts = getAllProducts();
      return apiJson({ success: true, products: fallbackProducts, isFallback: true });
    } catch (fallbackError) {
      console.error("GET /api/products fallback lokal juga gagal:", fallbackError);
      return apiError("Daftar produk tidak dapat dimuat.", 500);
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseProductInput(body.value);
  if (!parsed.ok) return apiError(parsed.error, 400);

  try {
    const product = await createProductRecord(parsed.value);
    return apiJson({ success: true, product }, 201);
  } catch (error) {
    console.error("POST /api/products gagal:", error);
    return apiError("Produk gagal disimpan ke database.", 500);
  }
}
