"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";

import { Modal } from "@/components/ui/modal";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  tone?: "danger" | "warning";
  isPending?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  tone = "danger",
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      description={description}
      onClose={isPending ? () => undefined : onCancel}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            data-autofocus
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isPending}
            aria-busy={isPending}
            className={
              tone === "danger"
                ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                : "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-royal-700 px-4 text-sm font-semibold text-white transition hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-70"
            }
          >
            {isPending && (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isPending ? "Memproses..." : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            tone === "danger"
              ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"
              : "flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"
          }
        >
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          Tindakan ini langsung mengubah data di database Supabase. Pastikan tidak
          ada perubahan lain yang belum disimpan.
        </p>
      </div>
    </Modal>
  );
}
