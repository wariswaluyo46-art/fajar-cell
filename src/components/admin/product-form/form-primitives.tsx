import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { ProductFormValues } from "@/types";

export type PreviewStatus = "empty" | "loading" | "ready" | "error";

export type UpdateFieldFn = <K extends keyof ProductFormValues>(
  key: K,
  value: ProductFormValues[K],
) => void;

export function inputClass(hasError: boolean): string {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-royal-400 focus:ring-4 focus:ring-royal-100",
    hasError ? "border-rose-300 bg-rose-50/40" : "border-slate-200",
  );
}

export function textareaClass(hasError: boolean): string {
  return cn(
    "w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-royal-400 focus:ring-4 focus:ring-royal-100",
    hasError ? "border-rose-300 bg-rose-50/40" : "border-slate-200",
  );
}

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  action,
  children,
}: FieldProps) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-slate-700"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  children,
  description,
}: {
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="mb-4 border-b border-slate-100 pb-2">
      <h3 className="text-sm font-bold text-slate-900">{children}</h3>
      {description && (
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition hover:border-royal-200"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 rounded border-slate-300 text-royal-700 accent-royal-700"
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
