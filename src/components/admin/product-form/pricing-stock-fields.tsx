import { AlertTriangle } from "lucide-react";

import { formatRupiah } from "@/lib/utils";
import type { AiMarketPriceHint, ProductFormValues } from "@/types";

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
  marketPriceHint?: AiMarketPriceHint | null;
}

export function PricingStockFields({
  values,
  errors,
  onUpdate,
  marketPriceHint,
}: PricingStockFieldsProps) {
  const isUsed = values.category === "handphone-bekas";
  const numericPrice = Number(values.price);
  const pricePreview =
    values.price.trim() !== "" && numericPrice > 0
      ? formatRupiah(numericPrice)
      : null;

  const priceSanityWarning =
    marketPriceHint &&
    values.price.trim() !== "" &&
    Number.isFinite(numericPrice) &&
    numericPrice > 0
      ? numericPrice < marketPriceHint.min * 0.55
        ? `Harga jual (${formatRupiah(numericPrice)}) jauh di bawah referensi pasar AI (${formatRupiah(marketPriceHint.min)} – ${formatRupiah(marketPriceHint.max)}). Pastikan bukan salah ketik angka nol.`
        : numericPrice > marketPriceHint.max * 1.5
          ? `Harga jual (${formatRupiah(numericPrice)}) jauh di atas referensi pasar AI (${formatRupiah(marketPriceHint.min)} – ${formatRupiah(marketPriceHint.max)}). Periksa kembali nominal harga.`
          : null
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

      {priceSanityWarning && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-900"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <span>{priceSanityWarning}</span>
        </div>
      )}
    </div>
  );
}
