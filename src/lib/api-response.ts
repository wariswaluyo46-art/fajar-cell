import { NextResponse } from "next/server";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function apiJson<T>(payload: T, status = 200): NextResponse<T> {
  return NextResponse.json(payload, {
    status,
    headers: NO_STORE,
  });
}

export function apiError(message: string, status: number): NextResponse {
  return apiJson({ success: false, error: message }, status);
}

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse };

export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<JsonBodyResult> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: apiError("Payload terlalu besar.", 413),
    };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: apiError("Gagal membaca payload.", 400),
    };
  }

  if (new TextEncoder().encode(raw).length > maxBytes) {
    return {
      ok: false,
      response: apiError("Payload terlalu besar.", 413),
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return {
      ok: false,
      response: apiError("Format JSON tidak valid.", 400),
    };
  }
}
