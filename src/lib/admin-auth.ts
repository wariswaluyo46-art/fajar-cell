import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { apiError } from "./api-response";

export const ADMIN_SESSION_COOKIE = "kfc_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

const DEFAULT_ADMIN_PIN = "123456";
const TOKEN_VERSION = 1;
const MAX_PIN_LENGTH = 64;

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ADMIN_SESSION_MAX_AGE,
} as const;

let warnedWeakPin = false;
let warnedMissingSecret = false;

export function getAdminPin(): string {
  const configured = process.env.ADMIN_PIN?.trim();
  const pin = configured || DEFAULT_ADMIN_PIN;

  if (
    process.env.NODE_ENV === "production" &&
    (!configured || pin === DEFAULT_ADMIN_PIN) &&
    !warnedWeakPin
  ) {
    warnedWeakPin = true;
    console.warn(
      "[security] ADMIN_PIN di production belum diubah atau masih memakai PIN default (123456). Segera set ADMIN_PIN yang kuat.",
    );
  }

  return pin;
}

export function isValidPinLength(pin: string): boolean {
  return pin.length <= MAX_PIN_LENGTH;
}

export function pinMatches(candidate: string): boolean {
  const expectedHash = createHash("sha256")
    .update(getAdminPin(), "utf8")
    .digest();
  const candidateHash = createHash("sha256")
    .update(candidate, "utf8")
    .digest();

  return timingSafeEqual(expectedHash, candidateHash);
}

/**
 * Secret khusus sesi. Bila tidak diisi, PIN server dipakai sebagai basis agar
 * demo tetap berjalan; ganti PIN akan otomatis membatalkan semua sesi lama.
 */
function getSessionSecret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production" && !warnedMissingSecret) {
    warnedMissingSecret = true;
    console.warn(
      "[security] ADMIN_SESSION_SECRET belum diatur di production. Tambahkan secret acak minimal 32 karakter pada environment server.",
    );
  }

  return `kfc-admin-session:${getAdminPin()}`;
}

function sign(payload: string): Buffer {
  return createHmac("sha256", getSessionSecret()).update(payload).digest();
}

export interface AdminSessionInfo {
  loginAt: string;
}

export function createAdminSessionToken(now = Date.now()): {
  token: string;
  loginAt: string;
} {
  const loginAt = new Date(now).toISOString();
  const payload = Buffer.from(
    JSON.stringify({
      v: TOKEN_VERSION,
      loginAt,
      exp: Math.floor(now / 1000) + ADMIN_SESSION_MAX_AGE,
    }),
    "utf8",
  ).toString("base64url");
  const signature = sign(payload).toString("base64url");

  return { token: `${payload}.${signature}`, loginAt };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function verifyAdminSessionToken(
  token: string | undefined,
): AdminSessionInfo | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }

  const expected = sign(payload);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    !isRecord(parsed) ||
    parsed.v !== TOKEN_VERSION ||
    typeof parsed.loginAt !== "string" ||
    typeof parsed.exp !== "number" ||
    !Number.isFinite(parsed.exp)
  ) {
    return null;
  }

  if (parsed.exp * 1000 <= Date.now()) return null;
  if (Number.isNaN(Date.parse(parsed.loginAt))) return null;

  return { loginAt: parsed.loginAt };
}

export async function getAdminSession(): Promise<AdminSessionInfo | null> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
}

export type AdminAuthGuardResult =
  | { ok: true; session: AdminSessionInfo }
  | { ok: false; response: NextResponse };

export async function requireAdminSession(): Promise<AdminAuthGuardResult> {
  const session = await getAdminSession();
  if (!session) {
    return {
      ok: false,
      response: apiError("Sesi admin berakhir. Silakan login ulang.", 401),
    };
  }
  return { ok: true, session };
}
