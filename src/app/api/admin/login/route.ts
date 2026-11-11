import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_OPTIONS,
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSession,
  isValidPinLength,
  pinMatches,
} from "@/lib/admin-auth";
import type {
  AdminLoginResponse,
  AdminLogoutResponse,
  AdminSessionResponse,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_024;
const ATTEMPT_LIMIT = 8;
const ATTEMPT_WINDOW_MS = 60_000;

interface AttemptRecord {
  count: number;
  resetAt: number;
}

// Throttle sederhana per proses; cukup untuk demo lokal dan mencegah tebak PIN beruntun.
const attempts = new Map<string, AttemptRecord>();

function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();

  return firstForwarded || request.headers.get("x-real-ip") || "local";
}

function getAttemptRecord(key: string, now: number): AttemptRecord {
  const record = attempts.get(key);

  if (!record || record.resetAt <= now) {
    const fresh: AttemptRecord = { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
    attempts.set(key, fresh);
    return fresh;
  }

  return record;
}

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
  const now = Date.now();
  const key = getClientKey(request);
  const record = getAttemptRecord(key, now);

  if (record.count >= ATTEMPT_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1_000));
    return json(
      {
        success: false,
        error: `Terlalu banyak percobaan PIN. Coba lagi dalam ${retryAfter} detik.`,
      },
      429,
      retryAfter,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json({ success: false, error: "Permintaan terlalu besar." }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Format permintaan tidak valid." }, 400);
  }

  const pin =
    isRecord(body) && typeof body.pin === "string" ? body.pin.trim() : "";

  if (pin === "") {
    return json({ success: false, error: "PIN wajib diisi." }, 400);
  }

  if (!isValidPinLength(pin)) {
    return json({ success: false, error: "PIN tidak valid." }, 400);
  }

  if (!pinMatches(pin)) {
    record.count += 1;
    return json(
      {
        success: false,
        error: "PIN salah. Periksa kembali dan coba lagi.",
      },
      401,
    );
  }

  attempts.delete(key);

  const { token, loginAt } = createAdminSessionToken();
  const response = json({ success: true, loginAt }, 200);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, ADMIN_COOKIE_OPTIONS);

  return response;
}
