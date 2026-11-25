import { AlertCircle, LoaderCircle, Sparkles } from "lucide-react";

import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { cn, formatRupiah } from "@/lib/utils";
import type {
  AiAutofillSpecsData,
  Brand,
  ProductCategory,
  ProductFormValues,
  ProductStatus,
} from "@/types";

import {
  Field,
  SectionTitle,
  inputClass,
  type UpdateFieldFn,
} from "./form-primitives";

const CATEGORY_OPTIONS: ProductCategory[] = [
  "handphone-bekas",
  "handphone-baru",
  "aksesoris",
];

const BRAND_OPTIONS: Brand[] = [
  "Samsung",
  "Xiaomi",
  "Infinix",
  "Oppo",
  "Vivo",
  "Realme",
  "Anker",
  "Baseus",
  "Lainnya",
];

const STATUS_OPTIONS: ProductStatus[] = ["ready", "sold-out"];

interface BasicInfoFieldsProps {
  values: ProductFormValues;
  errors: Record<string, string>;
  onUpdate: UpdateFieldFn;
  onCategoryChange: (category: ProductCategory) => void;
  onStatusChange: (status: ProductStatus) => void;
  isAutofilling?: boolean;
  onlyFillEmpty?: boolean;
  onOnlyFillEmptyChange?: (checked: boolean) => void;
  onAutofillSpecs?: () => void;
  autofillHint?: AiAutofillSpecsData | null;
}

const TAG_LABELS: Record<string, string> = {
  parents: "Ramah Orang Tua",
  battery: "Baterai Awet",
  gaming: "Gaming & Multitask",
  camera: "Kamera Jernih",
  budget: "Harga Hemat",
};

export function BasicInfoFields({
  values,
  errors,
  onUpdate,
  onCategoryChange,
  onStatusChange,
  isAutofilling = false,
  onlyFillEmpty = true,
  onOnlyFillEmptyChange,
  onAutofillSpecs,
  autofillHint,
}: BasicInfoFieldsProps) {
  return (
    <>
      <fieldset>
        <legend className="sr-only">Kategori produk</legend>
        <SectionTitle description="Kategori menentukan detail tambahan yang perlu diisi.">
          Kategori
        </SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          {CATEGORY_OPTIONS.map((category) => {
            const active = values.category === category;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600",
                  active
                    ? "border-royal-600 bg-royal-50 text-royal-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-royal-200 hover:text-royal-700",
                )}
              >
                {PRODUCT_CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="Nama produk"
          htmlFor="product-name"
          required
          error={errors.name}
          className="sm:col-span-2"
          hint="Contoh: Samsung Galaxy M30s 4/64GB atau Infinix Smart 20."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="product-name"
              data-autofocus
              type="text"
              value={values.name}
              onChange={(event) => onUpdate("name", event.target.value)}
              placeholder="Nama unit / produk"
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "product-name-error" : "product-name-hint"
              }
              className={cn(inputClass(Boolean(errors.name)), "flex-1")}
            />
            {onAutofillSpecs && (
              <button
                type="button"
                onClick={onAutofillSpecs}
                disabled={isAutofilling || values.name.trim().length < 4}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isAutofilling ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4 text-cyan-200" aria-hidden="true" />
                )}
                <span>
                  {isAutofilling
                    ? "Mengisi Spek..."
                    : "✨ Isi Spek Otomatis (AI)"}
                </span>
              </button>
            )}
          </div>

          {onOnlyFillEmptyChange && (
            <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFillEmpty}
                onChange={(e) => onOnlyFillEmptyChange(e.target.checked)}
                className="size-4 rounded border-slate-300 text-royal-600"
              />
              <span>Hanya isi kolom yang kosong (aman saat mengedit produk lama)</span>
            </label>
          )}

          {autofillHint && (
            <div className="mt-2.5 rounded-xl border border-royal-200 bg-royal-50/70 p-3 text-xs space-y-1.5">
              <p className="flex items-start gap-1.5 font-semibold text-royal-900">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-royal-700" aria-hidden="true" />
                <span>{autofillHint.confidenceNote}</span>
              </p>
              {autofillHint.marketPriceHint && (
                <p className="text-slate-700">
                  <strong>Referensi harga pasar:</strong>{" "}
                  {formatRupiah(autofillHint.marketPriceHint.min)} –{" "}
                  {formatRupiah(autofillHint.marketPriceHint.max)} (
                  {autofillHint.marketPriceHint.note})
                </p>
              )}
              {autofillHint.recommendedTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">
                    Cocok untuk:
                  </span>
                  {autofillHint.recommendedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-royal-700 border border-royal-200"
                    >
                      {TAG_LABELS[tag] ?? tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </Field>

        <Field label="Merek" htmlFor="product-brand" required>
          <select
            id="product-brand"
            value={values.brand}
            onChange={(event) =>
              onUpdate("brand", event.target.value as Brand)
            }
            className={inputClass(false)}
          >
            {BRAND_OPTIONS.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Status unit"
          htmlFor="product-status"
          required
          hint="Klik salah satu; status bisa diubah kapan saja dari tabel."
        >
          <div
            id="product-status"
            className="grid grid-cols-2 gap-2"
            role="group"
            aria-label="Status unit"
          >
            {STATUS_OPTIONS.map((status) => {
              const active = values.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onStatusChange(status)}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600",
                    active
                      ? status === "ready"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-rose-300 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      status === "ready" ? "bg-emerald-600" : "bg-rose-600",
                    )}
                    aria-hidden="true"
                  />
                  {status === "ready" ? "Ready" : "Sold"}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </>
  );
}
