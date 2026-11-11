"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminSessionResponse,
} from "@/types";

export type AdminAuthStatus = "checking" | "authenticated" | "unauthenticated";

interface UseAdminSessionResult {
  status: AdminAuthStatus;
  loginAt: string | null;
  error: string | null;
  isSubmitting: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseLoginResponse(value: unknown): AdminLoginResponse | null {
  if (!isRecord(value)) return null;

  if (value.success === true && typeof value.loginAt === "string") {
    return { success: true, loginAt: value.loginAt };
  }

  if (value.success === false && typeof value.error === "string") {
    return { success: false, error: value.error };
  }

  return null;
}

function parseSessionResponse(value: unknown): AdminSessionResponse | null {
  if (!isRecord(value)) return null;

  if (value.authenticated === true && typeof value.loginAt === "string") {
    return { authenticated: true, loginAt: value.loginAt };
  }

  if (value.authenticated === false) {
    return { authenticated: false };
  }

  return null;
}

/**
 * Sesi admin memakai cookie HttpOnly yang ditandatangani server. Browser tidak
 * pernah menyimpan PIN maupun status login di LocalStorage, sehingga sesi tetap
 * aman dan otomatis kedaluwarsa setelah 12 jam.
 */
export function useAdminSession(): UseAdminSessionResult {
  const [status, setStatus] = useState<AdminAuthStatus>("checking");
  const [loginAt, setLoginAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSession() {
      try {
        const response = await fetch("/api/admin/login", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Sesi tidak dapat diperiksa.");

        const data: unknown = await response.json();
        const session = parseSessionResponse(data);
        if (controller.signal.aborted) return;

        if (session?.authenticated) {
          setLoginAt(session.loginAt);
          setStatus("authenticated");
        } else {
          setStatus("unauthenticated");
        }
      } catch {
        if (controller.signal.aborted) return;
        setError(
          "Tidak dapat memeriksa sesi admin. Periksa koneksi lalu muat ulang halaman.",
        );
        setStatus("unauthenticated");
      }
    }

    void checkSession();

    return () => controller.abort();
  }, []);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const value = pin.trim();

    if (value === "") {
      setError("PIN wajib diisi.");
      return false;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const body: AdminLoginRequest = { pin: value };
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => null);
      const payload = parseLoginResponse(data);

      if (!response.ok || !payload || !payload.success) {
        setError(
          payload && !payload.success
            ? payload.error
            : "PIN tidak dapat diverifikasi. Coba lagi.",
        );
        return false;
      }

      setLoginAt(payload.loginAt);
      setStatus("authenticated");
      setError(null);
      return true;
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Permintaan logout gagal.");
      setError(null);
    } catch {
      setError(
        "Sesi di layar ditutup, tetapi server tidak dapat dihubungi. Muat ulang halaman untuk memastikan sesi berakhir.",
      );
    } finally {
      setLoginAt(null);
      setStatus("unauthenticated");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    loginAt,
    error,
    isSubmitting,
    login,
    logout,
    clearError,
  };
}
