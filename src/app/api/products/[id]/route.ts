import { getAdminSession } from "@/lib/admin-auth";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { parseProductInput, parseProductPatch } from "@/lib/product-input";
import { getAllProducts } from "@/lib/products";
import {
  deleteProductRecord,
  getProductById,
  patchProductRecord,
  updateProductRecord,
} from "@/lib/products-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1_024;

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function readId(context: RouteContext): Promise<string | null> {
  const { id } = await context.params;
  const value = id.trim();
  return value !== "" && value.length <= 64 ? value : null;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = await readId(context);
  if (!id) return apiError("ID produk tidak valid.", 400);

  try {
    const product = await getProductById(id);
    if (!product) return apiError("Produk tidak ditemukan.", 404);
    return apiJson({ success: true, product });
  } catch (error) {
    console.warn(`GET /api/products/${id} gagal dari database, beralih ke data lokal:`, error);
    const fallback = getAllProducts().find((p) => p.id === id || p.slug === id);
    if (fallback) {
      return apiJson({ success: true, product: fallback, isFallback: true });
    }
    return apiError("Produk tidak dapat dimuat dari database.", 500);
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const id = await readId(context);
  if (!id) return apiError("ID produk tidak valid.", 400);

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseProductInput(body.value);
  if (!parsed.ok) return apiError(parsed.error, 400);

  try {
    const product = await updateProductRecord(id, parsed.value);
    if (!product) return apiError("Produk tidak ditemukan.", 404);
    return apiJson({ success: true, product });
  } catch (error) {
    console.error(`PUT /api/products/${id} gagal:`, error);
    return apiError("Perubahan produk gagal disimpan ke database.", 500);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const id = await readId(context);
  if (!id) return apiError("ID produk tidak valid.", 400);

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseProductPatch(body.value);
  if (!parsed.ok) return apiError(parsed.error, 400);

  try {
    const product = await patchProductRecord(id, parsed.value);
    if (!product) return apiError("Produk tidak ditemukan.", 404);
    return apiJson({ success: true, product });
  } catch (error) {
    console.error(`PATCH /api/products/${id} gagal:`, error);
    return apiError("Perubahan stok/status gagal disimpan.", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const id = await readId(context);
  if (!id) return apiError("ID produk tidak valid.", 400);

  try {
    const deleted = await deleteProductRecord(id);
    if (!deleted) return apiError("Produk tidak ditemukan.", 404);
    return apiJson({ success: true });
  } catch (error) {
    console.error(`DELETE /api/products/${id} gagal:`, error);
    return apiError("Produk gagal dihapus dari database.", 500);
  }
}
