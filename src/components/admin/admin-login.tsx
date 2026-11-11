"use client";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useToast } from "@/components/ui/toast-provider";

interface AdminLoginProps {
  error: string | null;
  isSubmitting: boolean;
  onLogin: (pin: string) => Promise<boolean>;
  onClearError: () => void;
}

export function AdminLogin({
  error,
  isSubmitting,
  onLogin,
  onClearError,
}: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    if (await onLogin(pin)) {
      showToast({
        variant: "success",
        title: "PIN Admin Benar",
        description: "Selamat datang di dashboard Konter Fajar Cell.",
      });
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-royal-600/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-32 size-96 rounded-full bg-emerald-500/15 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-400"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali ke halaman pembeli
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-royal-600 to-royal-800 text-white shadow-lg shadow-royal-900/30">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
            Dashboard Admin
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            Masukkan PIN untuk mengelola stok, harga, dan status unit Konter
            Fajar Cell.
          </p>

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <label
              htmlFor="admin-pin"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              PIN Admin
            </label>

            <div className="relative">
              <input
                id="admin-pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value);
                  if (error) onClearError();
                }}
                placeholder="••••••"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-pin-error" : undefined}
                disabled={isSubmitting}
                autoFocus
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 pr-12 text-center text-lg font-bold tracking-[0.35em] text-slate-900 shadow-inner transition outline-none placeholder:tracking-[0.35em] placeholder:text-slate-300 focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-100"
              />
              <button
                type="button"
                onClick={() => setShowPin((value) => !value)}
                aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
              >
                {showPin ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {error && (
              <p
                id="admin-pin-error"
                role="alert"
                className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-royal-700 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogIn className="size-4" aria-hidden="true" />
              )}
              {isSubmitting ? "Memeriksa PIN..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-royal-100 bg-royal-50/70 px-3.5 py-3">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-royal-700"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-royal-900">
              PIN diverifikasi di server. Setelah login, browser hanya menerima
              cookie sesi HttpOnly yang berlaku 12 jam.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Konter Fajar Cell • Dashboard stok Supabase
        </p>
      </div>
    </main>
  );
}
