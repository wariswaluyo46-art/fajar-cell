import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_OPTIONS,
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSession,
  isValidPinLength,
  pinMatches,
} from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/api-response";
import {
  clearRateLimit,
  getClientKey,
  getRateLimitStatus,
  recordRateLimitAttempt,
} from "@/lib/rate-limit";
import type {
  AdminLoginResponse,
  AdminLogoutResponse,
  AdminSessionResponse,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_024;
const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 15 * 60_000;

function json(
  payload: AdminLoginResponse | AdminSessionResponse | AdminLogoutResponse,
  status: number,
  retryAfterSeconds?: number,
): NextResponse {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return NextResponse.json(payload, { status, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function GET(): Promise<Response> {
  const session = await getAdminSession();

  return json(
    session
      ? { authenticated: true, loginAt: session.loginAt }
      : { authenticated: false },
    200,
  );
}

export async function DELETE(): Promise<Response> {
  const response = json({ success: true }, 200);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}

export async function POST(request: Request): Promise<Response> {
  const key = `admin-login:${getClientKey(request)}`;
  const status = getRateLimitStatus(key, ATTEMPT_LIMIT);

  if (!status.allowed) {
    return json(
      {
        success: false,
        error: `Terlalu banyak percobaan PIN. Coba lagi dalam ${status.retryAfterSeconds} detik.`,
      },
      429,
      status.retryAfterSeconds,
    );
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const pin =
    isRecord(body.value) && typeof body.value.pin === "string"
      ? body.value.pin.trim()
      : "";

  if (pin === "") {
    return json({ success: false, error: "PIN wajib diisi." }, 400);
  }

  if (!isValidPinLength(pin)) {
    return json({ success: false, error: "PIN tidak valid." }, 400);
  }

  if (!pinMatches(pin)) {
    recordRateLimitAttempt(key, ATTEMPT_WINDOW_MS);
    return json(
      {
        success: false,
        error: "PIN salah. Periksa kembali dan coba lagi.",
      },
      401,
    );
  }

  clearRateLimit(key);

  const { token, loginAt } = createAdminSessionToken();
  const response = json({ success: true, loginAt }, 200);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, ADMIN_COOKIE_OPTIONS);

  return response;
}
