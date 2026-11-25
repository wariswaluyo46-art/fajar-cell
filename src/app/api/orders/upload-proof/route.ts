import { apiError, apiJson } from "@/lib/api-response";
import { getCartSessionId } from "@/lib/cart-session";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  buildSafeImageFileName,
  detectImageSignature,
  uploadImageWithFallback,
} from "@/lib/image-upload-server";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Batas ukuran bukti transfer maksimal 3 MB */
const MAX_PROOF_BYTES = 3 * 1024 * 1024;
const UPLOAD_LIMIT = 15;
const UPLOAD_WINDOW_MS = 60_000;

export async function POST(request: Request): Promise<Response> {
  const sessionId = await getCartSessionId();
  if (!sessionId) {
    return apiError(
      "Sesi keranjang tidak ditemukan. Silakan tambahkan produk ke keranjang terlebih dahulu.",
      401,
    );
  }

  const limit = checkRateLimit(
    `upload-proof:${getClientKey(request)}`,
    UPLOAD_LIMIT,
    UPLOAD_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak unggahan bukti bayar. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("File bukti pembayaran tidak ditemukan.", 400);
    }

    if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
      return apiError(
        "Format file tidak didukung. Unggah gambar JPG, PNG, atau WebP.",
        400,
      );
    }

    if (file.size === 0 || file.size > MAX_PROOF_BYTES) {
      return apiError(
        file.size === 0
          ? "File gambar kosong tidak dapat diunggah."
          : "Ukuran bukti pembayaran maksimal 3 MB.",
        400,
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_PROOF_BYTES) {
      return apiError(
        "Ukuran bukti pembayaran tidak valid atau melebihi 3 MB.",
        400,
      );
    }

    const detected = detectImageSignature(buffer);
    if (!detected) {
      return apiError(
        "Isi file bukan gambar JPEG, PNG, atau WebP yang valid.",
        400,
      );
    }

    const fileName = buildSafeImageFileName(
      file.name,
      detected.ext,
      "bukti-bayar",
    );

    const uploaded = await uploadImageWithFallback({
      buffer,
      detected,
      fileName,
      bucketName: "payment-proofs",
      storagePrefix: "proofs",
      localPublicSubdir: "payment-proofs",
      maxBytes: MAX_PROOF_BYTES,
    });

    return apiJson({
      success: true,
      url: uploaded.url,
      fileName: uploaded.fileName,
      storage: uploaded.storage,
    });
  } catch (error) {
    console.error("POST /api/orders/upload-proof gagal:", error);
    return apiError(
      "Terjadi kesalahan saat mengunggah bukti pembayaran.",
      500,
    );
  }
}
