"use client";

import { LoaderCircle, Save, Sparkles, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { BasicInfoFields } from "@/components/admin/product-form/basic-info-fields";
import type { PreviewStatus } from "@/components/admin/product-form/form-primitives";
import { ImageUploadSection } from "@/components/admin/product-form/image-upload-section";
import { PricingStockFields } from "@/components/admin/product-form/pricing-stock-fields";
import { SpecsFields } from "@/components/admin/product-form/specs-fields";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import {
  createProductFormValues,
  productFormValuesToInput,
  validateProductForm,
} from "@/lib/product-form";
import { getFallbackThumbnail, isRemoteImageUrl } from "@/lib/product-images";
import type {
  AiAutofillSpecsData,
  Product,
  ProductCategory,
  ProductFormValues,
  ProductInput,
  ProductStatus,
} from "@/types";

interface ProductFormProps {
  product?: Product | null;
  onSave: (input: ProductInput) => Promise<boolean>;
  onClose: () => void;
}

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const formId = useId();
  const { showToast } = useToast();
  const [values, setValues] = useState<ProductFormValues>(() =>
    createProductFormValues(product),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [onlyFillEmpty, setOnlyFillEmpty] = useState(() => Boolean(product));
  const [autofillHint, setAutofillHint] =
    useState<AiAutofillSpecsData | null>(null);
  const [previewSource, setPreviewSource] = useState(() =>
    values.thumbnail.trim(),
  );
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(() =>
    values.thumbnail.trim() === "" ? "empty" : "loading",
  );
  const previewTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimer.current !== null) {
        window.clearTimeout(previewTimer.current);
      }
    };
  }, []);

  const isEditing = Boolean(product);

  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function schedulePreview(nextValue: string) {
    if (previewTimer.current !== null) {
      window.clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }

    const nextSource = nextValue.trim();

    if (nextSource === "") {
      setPreviewSource("");
      setPreviewStatus("empty");
      return;
    }

    // Biarkan pratinjau lama tetap tampil selama debounce. Status baru diubah
    // saat sumber berganti agar ketikan yang kembali ke nilai semula tidak
    // meninggalkan indikator loading tanpa timer.
    if (nextSource === previewSource) return;

    previewTimer.current = window.setTimeout(() => {
      setPreviewStatus("loading");
      setPreviewSource(nextSource);
      previewTimer.current = null;
    }, 300);
  }

  function handleThumbnailChange(value: string) {
    update("thumbnail", value);
    schedulePreview(value);
  }

  function handleCategoryChange(category: ProductCategory) {
    const currentThumbnail = values.thumbnail.trim();
    const currentFallback = getFallbackThumbnail(values.category);
    const nextThumbnail =
      currentThumbnail === currentFallback
        ? getFallbackThumbnail(category)
        : values.thumbnail;

    setValues((current) => ({
      ...current,
      category,
      thumbnail: nextThumbnail,
      stock:
        category === "handphone-bekas" && current.stock === "0"
          ? "1"
          : current.stock,
    }));

    if (nextThumbnail !== currentThumbnail) {
      schedulePreview(nextThumbnail);
    }

    setErrors({});
  }

  function handleImageSourceChange(source: ProductFormValues["imageSource"]) {
    if (source === values.imageSource) return;

    const fallback = getFallbackThumbnail(values.category);
    const isUrl = isRemoteImageUrl(values.thumbnail);
    let thumbnail = values.thumbnail;

    if (source === "url") {
      thumbnail = isUrl ? values.thumbnail : "";
    } else if (source === "upload") {
      thumbnail = isUrl ? values.thumbnail : "";
    } else if (isUrl || values.thumbnail.trim() === "") {
      thumbnail = fallback;
    }

    setValues((current) => ({ ...current, imageSource: source, thumbnail }));
    schedulePreview(thumbnail);

    setErrors((current) => {
      if (!current.thumbnail) return current;
      const next = { ...current };
      delete next.thumbnail;
      return next;
    });
  }

  function handleStatusChange(status: ProductStatus) {
    setValues((current) => ({
      ...current,
      status,
      stock:
        status === "ready" && Number(current.stock) < 1
          ? "1"
          : current.stock,
    }));
    setErrors((current) => {
      if (!current.stock) return current;
      const next = { ...current };
      delete next.stock;
      return next;
    });
  }

  function handleAddGalleryImage(url: string) {
    setValues((current) => ({
      ...current,
      galleryImages: [...(current.galleryImages ?? []), url],
    }));
  }

  function handleRemoveGalleryImage(index: number) {
    setValues((current) => ({
      ...current,
      galleryImages: (current.galleryImages ?? []).filter((_, i) => i !== index),
    }));
  }

  async function handleAutofillSpecs() {
    if (isAutofilling || values.name.trim().length < 4) return;

    setIsAutofilling(true);
    try {
      const res = await fetch("/api/ai/autofill-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          category: values.category,
        }),
      });

      const payload = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        data?: AiAutofillSpecsData;
      } | null;

      if (!res.ok || !payload?.success || !payload.data) {
        showToast({
          variant: "error",
          title: "Gagal auto-fill AI",
          description:
            payload?.error ?? "Asisten AI tidak dapat mengisi spesifikasi saat ini.",
        });
        return;
      }

      const aiData = payload.data;
      setAutofillHint(aiData);

      setValues((current) => {
        const pick = (existingVal: string, nextVal?: string | number) => {
          const strNext =
            nextVal !== undefined && nextVal !== null ? String(nextVal) : "";
          if (!strNext) return existingVal;
          if (onlyFillEmpty && existingVal.trim() !== "") return existingVal;
          return strNext;
        };

        const nextCustomSpecs =
          onlyFillEmpty && current.customSpecs.length > 0
            ? current.customSpecs
            : (aiData.specs.customSpecs ?? current.customSpecs);

        return {
          ...current,
          brand:
            onlyFillEmpty && current.brand !== "Samsung"
              ? current.brand
              : aiData.brand,
          ram: pick(current.ram, aiData.specs.ram),
          storage: pick(current.storage, aiData.specs.storage),
          chipset: pick(current.chipset, aiData.specs.chipset),
          screen: pick(current.screen, aiData.specs.screen),
          camera: pick(current.camera, aiData.specs.camera),
          frontCamera: pick(current.frontCamera, aiData.specs.frontCamera),
          battery: pick(current.battery, aiData.specs.battery),
          network: pick(current.network, aiData.specs.network),
          os: pick(current.os, aiData.specs.os),
          customSpecs: nextCustomSpecs,
          description: pick(current.description, aiData.shortDescription),
        };
      });

      setErrors({});
      showToast({
        variant: "success",
        title: "Spesifikasi diisi oleh AI",
        description:
          "Periksa kembali spesifikasi & harga jual sebelum menyimpan produk.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "Koneksi bermasalah",
        description: "Tidak dapat menghubungi layanan AI.",
      });
    } finally {
      setIsAutofilling(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setSubmitError(null);

    const nextErrors = validateProductForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Periksa kembali field yang ditandai merah.");
      return;
    }

    setIsSaving(true);

    try {
      const saved = await onSave(productFormValuesToInput(values, product));
      if (!saved) {
        setSubmitError(
          "Data gagal disimpan ke database. Periksa koneksi lalu coba lagi.",
        );
      }
    } catch {
      setSubmitError(
        "Data gagal disimpan ke database. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      title={isEditing ? "Edit Produk" : "Tambah Produk"}
      description={
        isEditing
          ? "Perubahan disimpan ke database Supabase dan langsung tampil di katalog pembeli."
          : "Produk baru disimpan ke database Supabase dan tampil di katalog sesuai kategori serta statusnya."
      }
      onClose={isSaving ? () => undefined : onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-xs text-slate-500 sm:block">
            Tersimpan terpusat di database Supabase.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="size-4" aria-hidden="true" />
              Batal
            </button>
            <button
              type="submit"
              form={formId}
              disabled={isSaving}
              aria-busy={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-royal-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {isSaving
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
            </button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          >
            {submitError}
          </div>
        )}

        <BasicInfoFields
          values={values}
          errors={errors}
          onUpdate={update}
          onCategoryChange={handleCategoryChange}
          onStatusChange={handleStatusChange}
          isAutofilling={isAutofilling}
          onlyFillEmpty={onlyFillEmpty}
          onOnlyFillEmptyChange={setOnlyFillEmpty}
          onAutofillSpecs={() => {
            void handleAutofillSpecs();
          }}
          autofillHint={autofillHint}
        />

        <PricingStockFields
          values={values}
          errors={errors}
          onUpdate={update}
          marketPriceHint={autofillHint?.marketPriceHint}
        />

        <SpecsFields values={values} errors={errors} onUpdate={update} />

        <ImageUploadSection
          values={values}
          errors={errors}
          isSaving={isSaving}
          previewSource={previewSource}
          previewStatus={previewStatus}
          onPreviewStatusChange={setPreviewStatus}
          onUpdate={update}
          onThumbnailChange={handleThumbnailChange}
          onImageSourceChange={handleImageSourceChange}
          onAddGalleryImage={handleAddGalleryImage}
          onRemoveGalleryImage={handleRemoveGalleryImage}
        />

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-royal-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-royal-800">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Setelah disimpan, produk tersedia di database dan tampil di katalog
          pembeli. Tab lain akan menyinkronkan data secara otomatis.
        </p>
      </form>
    </Modal>
  );
}
