import { ACCESSORY_TYPE_LABELS } from "@/lib/constants";
import type { AccessoryType, ProductFormValues } from "@/types";

import {
  Checkbox,
  Field,
  SectionTitle,
  inputClass,
  type UpdateFieldFn,
} from "./form-primitives";

interface SpecsFieldsProps {
  values: ProductFormValues;
  errors: Record<string, string>;
  onUpdate: UpdateFieldFn;
}

export function SpecsFields({ values, errors, onUpdate }: SpecsFieldsProps) {
  const isPhone = values.category !== "aksesoris";
  const isUsed = values.category === "handphone-bekas";

  if (!isPhone) {
    return (
      <div className="mt-7">
        <SectionTitle description="Jenis aksesoris menentukan ikon pada kartu katalog.">
          Detail Aksesoris
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Jenis aksesoris"
            htmlFor="product-accessory-type"
            required
          >
            <select
              id="product-accessory-type"
              value={values.accessoryType}
              onChange={(event) =>
                onUpdate("accessoryType", event.target.value as AccessoryType)
              }
              className={inputClass(false)}
            >
              {Object.entries(ACCESSORY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Kompatibel dengan"
            htmlFor="product-compatible-with"
            hint="Opsional, pisahkan dengan koma."
          >
            <input
              id="product-compatible-with"
              type="text"
              value={values.compatibleWith}
              onChange={(event) =>
                onUpdate("compatibleWith", event.target.value)
              }
              placeholder="Samsung, Xiaomi, OPPO, Vivo"
              className={inputClass(false)}
            />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <SectionTitle
        description={
          isUsed
            ? "Kondisi fisik, kelengkapan, dan garansi toko."
            : "Spesifikasi utama dan garansi resmi."
        }
      >
        Detail Unit
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="RAM (GB)" htmlFor="product-ram" required error={errors.ram}>
          <input
            id="product-ram"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.ram}
            onChange={(event) => onUpdate("ram", event.target.value)}
            placeholder="4"
            aria-invalid={Boolean(errors.ram)}
            aria-describedby={errors.ram ? "product-ram-error" : undefined}
            className={inputClass(Boolean(errors.ram))}
          />
        </Field>

        <Field
          label="Penyimpanan (GB)"
          htmlFor="product-storage"
          required
          error={errors.storage}
        >
          <input
            id="product-storage"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={values.storage}
            onChange={(event) => onUpdate("storage", event.target.value)}
            placeholder="64"
            aria-invalid={Boolean(errors.storage)}
            aria-describedby={
              errors.storage ? "product-storage-error" : undefined
            }
            className={inputClass(Boolean(errors.storage))}
          />
        </Field>

        <Field
          label="Warna"
          htmlFor="product-color"
          hint="Contoh: Midnight, Glowing Blue, Sunset Orange."
        >
          <input
            id="product-color"
            type="text"
            value={values.color}
            onChange={(event) => onUpdate("color", event.target.value)}
            placeholder="Sunset Orange"
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Durasi garansi (hari)"
          htmlFor="product-warranty-days"
          error={errors.warrantyDurationDays}
          hint="Isi 0 bila tanpa garansi."
        >
          <input
            id="product-warranty-days"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={values.warrantyDurationDays}
            onChange={(event) =>
              onUpdate("warrantyDurationDays", event.target.value)
            }
            aria-invalid={Boolean(errors.warrantyDurationDays)}
            aria-describedby={
              errors.warrantyDurationDays
                ? "product-warranty-days-error"
                : "product-warranty-days-hint"
            }
            className={inputClass(Boolean(errors.warrantyDurationDays))}
          />
        </Field>

        <Field
          label="Keterangan garansi"
          htmlFor="product-warranty-description"
          className="sm:col-span-2"
        >
          <input
            id="product-warranty-description"
            type="text"
            value={values.warrantyDescription}
            onChange={(event) =>
              onUpdate("warrantyDescription", event.target.value)
            }
            placeholder="Garansi toko 14 hari untuk servis dan pengecekan"
            className={inputClass(false)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Checkbox
            id="product-warranty-active"
            label="Garansi aktif"
            description="Tampil sebagai badge garansi pada kartu produk."
            checked={values.warrantyActive}
            onChange={(checked) => onUpdate("warrantyActive", checked)}
          />
        </div>
      </div>

      {isUsed && (
        <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
          <Field
            label="Grade kondisi"
            htmlFor="product-condition-grade"
            required
            error={errors.conditionGrade}
            hint="Contoh: Mulus 96% atau Lecet ringan."
          >
            <input
              id="product-condition-grade"
              type="text"
              value={values.conditionGrade}
              onChange={(event) =>
                onUpdate("conditionGrade", event.target.value)
              }
              placeholder="Mulus 96%"
              aria-invalid={Boolean(errors.conditionGrade)}
              aria-describedby={
                errors.conditionGrade
                  ? "product-condition-grade-error"
                  : "product-condition-grade-hint"
              }
              className={inputClass(Boolean(errors.conditionGrade))}
            />
          </Field>

          <Field
            label="Label kelengkapan"
            htmlFor="product-condition-label"
            required
            error={errors.conditionLabel}
            hint="Contoh: Fullset Original."
          >
            <input
              id="product-condition-label"
              type="text"
              value={values.conditionLabel}
              onChange={(event) =>
                onUpdate("conditionLabel", event.target.value)
              }
              placeholder="Fullset Original"
              aria-invalid={Boolean(errors.conditionLabel)}
              aria-describedby={
                errors.conditionLabel
                  ? "product-condition-label-error"
                  : "product-condition-label-hint"
              }
              className={inputClass(Boolean(errors.conditionLabel))}
            />
          </Field>

          <Field
            label="Jumlah minus"
            htmlFor="product-minus-count"
            error={errors.minusCount}
            hint="0 berarti tanpa minus."
          >
            <input
              id="product-minus-count"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={values.minusCount}
              onChange={(event) => onUpdate("minusCount", event.target.value)}
              aria-invalid={Boolean(errors.minusCount)}
              aria-describedby={
                errors.minusCount
                  ? "product-minus-count-error"
                  : "product-minus-count-hint"
              }
              className={inputClass(Boolean(errors.minusCount))}
            />
          </Field>

          <Field
            label="Kesehatan baterai (%)"
            htmlFor="product-battery-health"
            error={errors.batteryHealth}
            hint="Opsional, isi bila sudah dicek."
          >
            <input
              id="product-battery-health"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={values.batteryHealth}
              onChange={(event) =>
                onUpdate("batteryHealth", event.target.value)
              }
              placeholder="89"
              aria-invalid={Boolean(errors.batteryHealth)}
              aria-describedby={
                errors.batteryHealth
                  ? "product-battery-health-error"
                  : "product-battery-health-hint"
              }
              className={inputClass(Boolean(errors.batteryHealth))}
            />
          </Field>

          <Field
            label="Kelengkapan"
            htmlFor="product-completeness"
            className="sm:col-span-2"
            hint="Pisahkan dengan koma: Dus, Charger, Kabel."
          >
            <input
              id="product-completeness"
              type="text"
              value={values.completeness}
              onChange={(event) => onUpdate("completeness", event.target.value)}
              placeholder="Dus, Charger, Kabel"
              className={inputClass(false)}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
