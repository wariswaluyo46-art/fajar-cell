import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type {
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
}

export function BasicInfoFields({
  values,
  errors,
  onUpdate,
  onCategoryChange,
  onStatusChange,
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
          hint="Contoh: Samsung Galaxy M30s atau Infinix Smart 20."
        >
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
            className={inputClass(Boolean(errors.name))}
          />
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
