import { formatRupiah } from "@/lib/utils";
import type { ProductFormValues } from "@/types";

import {
  Checkbox,
  Field,
  SectionTitle,
  inputClass,
  type UpdateFieldFn,
} from "./form-primitives";

interface PricingStockFieldsProps {
  values: ProductFormValues;
  errors: Record<string, string>;
  onUpdate: UpdateFieldFn;
}

export function PricingStockFields({
  values,
  errors,
  onUpdate,
}: PricingStockFieldsProps) {
  const isUsed = values.category === "handphone-bekas";
  const pricePreview =
    values.price.trim() !== "" && Number(values.price) > 0
      ? formatRupiah(Number(values.price))
      : null;

  return (
    <div className="mt-7">
      <SectionTitle description="Harga dalam Rupiah tanpa titik atau koma.">
        Harga & Stok
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Harga jual (Rp)"
          htmlFor="product-price"
          required
          error={errors.price}
          hint={pricePreview ?? "Contoh: 600000"}
        >
          <input
            id="product-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={values.price}
            onChange={(event) => onUpdate("price", event.target.value)}
            placeholder="600000"
            aria-invalid={Boolean(errors.price)}
            aria-describedby={
              errors.price ? "product-price-error" : "product-price-hint"
            }
            className={inputClass(Boolean(errors.price))}
          />
        </Field>

        <Field
          label="Harga sebelum diskon"
          htmlFor="product-original-price"
          error={errors.originalPrice}
          hint="Kosongkan bila tidak ada diskon."
        >
          <input
            id="product-original-price"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            value={values.originalPrice}
            onChange={(event) =>
              onUpdate("originalPrice", event.target.value)
            }
            placeholder="750000"
            aria-invalid={Boolean(errors.originalPrice)}
            aria-describedby={
              errors.originalPrice
                ? "product-original-price-error"
                : "product-original-price-hint"
            }
            className={inputClass(Boolean(errors.originalPrice))}
          />
        </Field>

        <Field
          label="Stok tersedia"
          htmlFor="product-stock"
          required
          error={errors.stock}
          hint={
            isUsed
              ? "HP bekas umumnya 1 unit per produk."
              : "Jumlah unit yang siap dijual."
          }
        >
          <input
            id="product-stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={values.stock}
            onChange={(event) => onUpdate("stock", event.target.value)}
            aria-invalid={Boolean(errors.stock)}
            aria-describedby={
              errors.stock ? "product-stock-error" : "product-stock-hint"
            }
            className={inputClass(Boolean(errors.stock))}
          />
        </Field>

        <div className="sm:pt-6">
          <Checkbox
            id="product-featured"
            label="Tampilkan sebagai unit unggulan"
            description="Dipakai hero beranda untuk HP bekas pilihan."
            checked={values.featured}
            onChange={(checked) => onUpdate("featured", checked)}
          />
        </div>
      </div>
    </div>
  );
}
