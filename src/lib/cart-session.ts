import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const CART_SESSION_COOKIE = "kfc_cart_session";
export const CART_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const CART_SESSION_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;

export const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: CART_SESSION_MAX_AGE,
} as const;

export function isValidCartSessionId(value: unknown): value is string {
  return typeof value === "string" && CART_SESSION_PATTERN.test(value);
}

export async function getCartSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_SESSION_COOKIE)?.value;
  return isValidCartSessionId(raw) ? raw : null;
}

export async function getOrCreateCartSessionId(): Promise<{
  sessionId: string;
  isNew: boolean;
}> {
  const existing = await getCartSessionId();
  if (existing) {
    return { sessionId: existing, isNew: false };
  }

  return {
    sessionId: `cs_${randomBytes(16).toString("hex")}`,
    isNew: true,
  };
}

export function attachCartSessionCookie(
  response: NextResponse,
  sessionId: string,
): void {
  response.cookies.set(CART_SESSION_COOKIE, sessionId, CART_COOKIE_OPTIONS);
}
