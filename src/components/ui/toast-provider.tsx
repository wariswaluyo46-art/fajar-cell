"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "info" | "error";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Lama notifikasi tampil, default 4200 ms. */
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastInput, "description">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

const TOAST_TONES: Record<ToastVariant, string> = {
  success: "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
  info: "bg-royal-50 text-royal-600 border border-royal-200/60",
  error: "bg-rose-50 text-rose-600 border border-rose-200/60",
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const Icon = TOAST_ICONS[toast.variant];

  useEffect(() => {
    const timer = window.setTimeout(
      () => onDismiss(toast.id),
      toast.durationMs,
    );
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.durationMs, toast.id]);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3.5 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          TOAST_TONES[toast.variant],
        )}
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-bold text-slate-900">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Tutup notifikasi"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 cursor-pointer"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Toast global untuk halaman pembeli dan admin.
 * Diletakkan di root layout agar notifikasi tetap tampil meskipun
 * komponen pemicunya sudah unmount (mis. setelah login berhasil).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((input: ToastInput) => {
    counterRef.current += 1;
    const toast: ToastItem = {
      id: `toast-${Date.now()}-${counterRef.current}`,
      title: input.title,
      description: input.description,
      variant: input.variant ?? "success",
      durationMs: input.durationMs ?? 4200,
    };

    // Maksimal tiga toast aktif agar layar kecil tidak tertutup.
    setToasts((current) => [...current.slice(-2), toast]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[200] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:top-6 sm:right-6 sm:items-end">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider.");
  }
  return context;
}
