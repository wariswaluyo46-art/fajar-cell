import type { NextResponse } from "next/server";

import { apiError, apiJson } from "@/lib/api-response";

import { GeminiUnavailableError, type GeminiFailureReason } from "./gemini";

const MAX_RETRY_AFTER_SECONDS = 3_600;

const RESPONSES: Record<
  GeminiFailureReason,
  { status: number; message: string }
> = {
  "not-configured": {
    status: 503,
    message: "Fitur AI belum aktif. Hubungi admin toko untuk mengaktifkannya.",
  },
  quota: {
    status: 429,
    message:
      "Kuota AI toko sedang penuh. Coba lagi beberapa saat lagi atau langsung chat via WhatsApp.",
  },
  timeout: {
    status: 504,
    message: "Asisten AI terlalu lama merespons. Silakan coba lagi.",
  },
  blocked: {
    status: 422,
    message:
      "Pertanyaan itu tidak dapat diproses. Coba tulis dengan cara atau topik lain.",
  },
  unavailable: {
    status: 503,
    message: "Asisten AI sedang sibuk. Coba lagi sebentar lagi.",
  },
};

/** Mengubah error Gemini menjadi response JSON yang aman untuk client. */
export function aiErrorResponse(error: unknown): NextResponse {
  if (error instanceof GeminiUnavailableError) {
    const config = RESPONSES[error.reason];
    const response = apiJson(
      { success: false, error: config.message },
      config.status,
    );

    if (error.retryAfterSeconds) {
      response.headers.set(
        "Retry-After",
        String(Math.min(error.retryAfterSeconds, MAX_RETRY_AFTER_SECONDS)),
      );
    }

    return response;
  }

  console.error("[ai] error tak terduga:", error);
  return apiError(
    "Fitur AI sedang bermasalah. Coba lagi beberapa saat lagi.",
    502,
  );
}
