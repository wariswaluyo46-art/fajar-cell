import { Plus, Trash2 } from "lucide-react";

import { ACCESSORY_TYPE_LABELS } from "@/lib/constants";
import type { AccessoryType, CustomSpecItem, ProductFormValues } from "@/types";

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

const QUICK_CUSTOM_SPECS: readonly CustomSpecItem[] = [
  { key: "NFC", value: "Ada" },
  { key: "Fast Charging", value: "33W" },
  { key: "Refresh Rate", value: "120Hz" },
  { key: "Sertifikasi IP", value: "IP54 Splash Proof" },
];

export function SpecsFields({ values, errors, onUpdate }: SpecsFieldsProps) {
  const isPhone = values.category !== "aksesoris";
  const isUsed = values.category === "handphone-bekas";

  function handleAddCustomSpec(preset?: CustomSpecItem) {
    const current = values.customSpecs ?? [];
    if (current.length >= 15) return;

    if (preset) {
      const exists = current.some(
        (item) => item.key.trim().toLowerCase() === preset.key.toLowerCase(),
      );
      if (exists) return;
      onUpdate("customSpecs", [...current, { ...preset }]);
      return;
    }

    onUpdate("customSpecs", [...current, { key: "", value: "" }]);
  }

  function handleUpdateCustomSpec(
    index: number,
    field: "key" | "value",
    nextVal: string,
  ) {
    const current = values.customSpecs ?? [];
    const next = current.map((item, i) =>
      i === index ? { ...item, [field]: nextVal } : item,
    );
    onUpdate("customSpecs", next);
  }

  function handleRemoveCustomSpec(index: number) {
    const current = values.customSpecs ?? [];
    onUpdate(
      "customSpecs",
      current.filter((_, i) => i !== index),
    );
  }

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
            ? "Spesifikasi lengkap HP, kondisi fisik, kelengkapan, dan garansi toko."
            : "Spesifikasi lengkap HP baru dan garansi resmi."
        }
      >
        Spesifikasi & Detail Unit
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="RAM (GB)" htmlFor="product-ram" required error={errors.ram}>
          <input
            id="product-ram"
            type="number"
            inputMode="decimal"
            min={0.5}
            step="any"
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
          label="Chipset / Prosesor"
          htmlFor="product-chipset"
          hint="Contoh: Snapdragon 685 / MediaTek Helio G99."
        >
          <input
            id="product-chipset"
            type="text"
            value={values.chipset}
            onChange={(event) => onUpdate("chipset", event.target.value)}
            placeholder="MediaTek Helio G85"
            maxLength={120}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Ukuran & Tipe Layar"
          htmlFor="product-screen"
          hint="Contoh: 6.67 inci AMOLED 120Hz."
        >
          <input
            id="product-screen"
            type="text"
            value={values.screen}
            onChange={(event) => onUpdate("screen", event.target.value)}
            placeholder="6.67 inci Super AMOLED 120Hz"
            maxLength={160}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Kamera Belakang"
          htmlFor="product-camera"
          hint="Contoh: 50MP + 8MP + 2MP."
        >
          <input
            id="product-camera"
            type="text"
            value={values.camera}
            onChange={(event) => onUpdate("camera", event.target.value)}
            placeholder="50MP AI Dual Camera"
            maxLength={120}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Kamera Depan"
          htmlFor="product-front-camera"
          hint="Contoh: 16MP."
        >
          <input
            id="product-front-camera"
            type="text"
            value={values.frontCamera}
            onChange={(event) => onUpdate("frontCamera", event.target.value)}
            placeholder="8MP"
            maxLength={120}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Kapasitas Baterai (mAh)"
          htmlFor="product-battery"
          error={errors.battery}
          hint="Contoh: 5000."
        >
          <input
            id="product-battery"
            type="number"
            inputMode="numeric"
            min={500}
            max={25000}
            step={10}
            value={values.battery}
            onChange={(event) => onUpdate("battery", event.target.value)}
            placeholder="5000"
            aria-invalid={Boolean(errors.battery)}
            aria-describedby={
              errors.battery ? "product-battery-error" : "product-battery-hint"
            }
            className={inputClass(Boolean(errors.battery))}
          />
        </Field>

        <Field
          label="Jaringan"
          htmlFor="product-network"
          hint="Contoh: 4G LTE / 5G Dual SIM."
        >
          <input
            id="product-network"
            type="text"
            value={values.network}
            onChange={(event) => onUpdate("network", event.target.value)}
            placeholder="4G LTE / 5G"
            maxLength={60}
            className={inputClass(false)}
          />
        </Field>

        <Field
          label="Sistem Operasi (OS)"
          htmlFor="product-os"
          hint="Contoh: Android 14 / HyperOS."
        >
          <input
            id="product-os"
            type="text"
            value={values.os}
            onChange={(event) => onUpdate("os", event.target.value)}
            placeholder="Android 14"
            maxLength={80}
            className={inputClass(false)}
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

      {/* Custom Specs Editor (Dynamic Key-Value) */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold text-slate-800">
              Spesifikasi Tambahan (Opsional)
            </p>
            <p className="text-[11px] text-slate-500">
              Tambahkan detail penting seperti NFC, Fast Charging, Refresh Rate, atau Fingerprint.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleAddCustomSpec()}
            disabled={(values.customSpecs ?? []).length >= 15}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-royal-200 bg-white px-3 text-xs font-bold text-royal-700 hover:bg-royal-50 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Tambah Baris
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">
            Saran cepat:
          </span>
          {QUICK_CUSTOM_SPECS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handleAddCustomSpec(preset)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-royal-300 hover:text-royal-700 cursor-pointer"
            >
              + {preset.key}
            </button>
          ))}
        </div>

        {(values.customSpecs ?? []).length > 0 && (
          <div className="space-y-2 pt-1">
            {(values.customSpecs ?? []).map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
              >
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) =>
                    handleUpdateCustomSpec(idx, "key", e.target.value)
                  }
                  placeholder="Nama (mis. NFC)"
                  maxLength={60}
                  aria-label={`Nama spesifikasi tambahan ${idx + 1}`}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-royal-400"
                />
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) =>
                    handleUpdateCustomSpec(idx, "value", e.target.value)
                  }
                  placeholder="Nilai (mis. Ada / 33W)"
                  maxLength={140}
                  aria-label={`Nilai spesifikasi tambahan ${idx + 1}`}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-royal-400"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomSpec(idx)}
                  aria-label={`Hapus spesifikasi tambahan ${idx + 1}`}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
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
