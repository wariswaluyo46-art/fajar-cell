"use client";

import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  ImageIcon,
  ImageOff,
  Link2,
  LoaderCircle,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Modal } from "@/components/ui/modal";
import { AiDescriptionButton } from "@/components/admin/ai-description-button";
import {
  ACCESSORY_TYPE_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/constants";
import {
  createProductFormValues,
  productFormValuesToInput,
  validateProductForm,
} from "@/lib/product-form";
import {
  PRODUCT_IMAGE_PATHS,
  getFallbackThumbnail,
  isRemoteImageUrl,
  productImageLabel,
} from "@/lib/product-images";
import { uploadProductImage } from "@/lib/upload-image";
import { cn, formatRupiah } from "@/lib/utils";
import type {
  AccessoryType,
  Brand,
  Product,
  ProductCategory,
  ProductFormValues,
  ProductInput,
  ProductStatus,
} from "@/types";

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

const IMAGE_SOURCE_OPTIONS = [
  { value: "upload", label: "Upload File Baru", icon: UploadCloud },
  { value: "url", label: "URL Eksternal", icon: Link2 },
  { value: "local", label: "Foto Lokal", icon: FolderOpen },
] as const;

type PreviewStatus = "empty" | "loading" | "ready" | "error";

interface ProductFormProps {
  product?: Product | null;
  onSave: (input: ProductInput) => Promise<boolean>;
  onClose: () => void;
}

function inputClass(hasError: boolean): string {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-royal-400 focus:ring-4 focus:ring-royal-100",
    hasError ? "border-rose-300 bg-rose-50/40" : "border-slate-200",
  );
}

function textareaClass(hasError: boolean): string {
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

function Field({
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

function SectionTitle({
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

function Checkbox({
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

export function ProductForm({ product, onSave, onClose }: ProductFormProps) {
  const formId = useId();
  const imageListId = useId();
  const [values, setValues] = useState<ProductFormValues>(() =>
    createProductFormValues(product),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewSource, setPreviewSource] = useState(() =>
    values.thumbnail.trim(),
  );
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(() =>
    values.thumbnail.trim() === "" ? "empty" : "loading",
  );
  const previewTimer = useRef<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessName, setUploadSuccessName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimer.current !== null) {
        window.clearTimeout(previewTimer.current);
      }
    };
  }, []);

  const isEditing = Boolean(product);
  const isPhone = values.category !== "aksesoris";
  const isUsed = values.category === "handphone-bekas";
  const pricePreview =
    values.price.trim() !== "" && Number(values.price) > 0
      ? formatRupiah(Number(values.price))
      : null;

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

  async function handleFileUpload(file: File) {
    setUploadError(null);
    setUploadSuccessName(null);

    const fileNameLower = file.name.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setUploadError(
        "Format file tidak didukung. Harap pilih gambar berekstensi .jpg, .jpeg, .png, atau .webp.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran file melebihi 5 MB. Harap pilih gambar yang lebih kecil.");
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadProductImage(file);
      if (!result.success || !result.url) {
        setUploadError(result.error || "Gagal mengunggah gambar ke Supabase Storage.");
        return;
      }

      handleThumbnailChange(result.url);
      setUploadSuccessName(file.name);
      setUploadError(null);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah foto ke Supabase Storage.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleGalleryUpload(file: File) {
    setGalleryUploadError(null);

    const fileNameLower = file.name.toLowerCase();
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isValid) {
      setGalleryUploadError(
        "Format file galeri tidak didukung. Pilih .jpg, .jpeg, .png, atau .webp.",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setGalleryUploadError("Ukuran file melebihi 5 MB.");
      return;
    }

    setIsUploadingGallery(true);

    try {
      const result = await uploadProductImage(file);
      if (!result.success || !result.url) {
        setGalleryUploadError(result.error || "Gagal mengunggah foto galeri.");
        return;
      }

      const uploadedUrl = result.url;
      setValues((current) => ({
        ...current,
        galleryImages: [...(current.galleryImages ?? []), uploadedUrl],
      }));
      setGalleryUploadError(null);
    } catch (err) {
      setGalleryUploadError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah foto tambahan galeri.",
      );
    } finally {
      setIsUploadingGallery(false);
    }
  }

  function removeGalleryImage(index: number) {
    setValues((current) => ({
      ...current,
      galleryImages: (current.galleryImages ?? []).filter((_, i) => i !== index),
    }));
  }

  function handleImageSourceChange(
    source: ProductFormValues["imageSource"],
  ) {
    if (source === values.imageSource) return;

    setUploadError(null);
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
                  onClick={() => handleCategoryChange(category)}
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
            hint="Contoh: Samsung Galaxy A55 5G atau Anker 20W Charger."
          >
            <input
              id="product-name"
              data-autofocus
              type="text"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
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
                update("brand", event.target.value as Brand)
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
                    onClick={() => handleStatusChange(status)}
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
                        status === "ready"
                          ? "bg-emerald-600"
                          : "bg-rose-600",
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
              hint={pricePreview ?? "Contoh: 6499000"}
            >
              <input
                id="product-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={values.price}
                onChange={(event) => update("price", event.target.value)}
                placeholder="6499000"
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
                  update("originalPrice", event.target.value)
                }
                placeholder="7299000"
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
                onChange={(event) => update("stock", event.target.value)}
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
                onChange={(checked) => update("featured", checked)}
              />
            </div>
          </div>
        </div>

        {isPhone && (
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
                  onChange={(event) => update("ram", event.target.value)}
                  placeholder="8"
                  aria-invalid={Boolean(errors.ram)}
                  aria-describedby={
                    errors.ram ? "product-ram-error" : undefined
                  }
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
                  onChange={(event) => update("storage", event.target.value)}
                  placeholder="256"
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
                hint="Contoh: Midnight, Titanium, Original."
              >
                <input
                  id="product-color"
                  type="text"
                  value={values.color}
                  onChange={(event) => update("color", event.target.value)}
                  placeholder="Midnight"
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
                    update("warrantyDurationDays", event.target.value)
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
                    update("warrantyDescription", event.target.value)
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
                  onChange={(checked) => update("warrantyActive", checked)}
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
                      update("conditionGrade", event.target.value)
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
                      update("conditionLabel", event.target.value)
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
                    onChange={(event) =>
                      update("minusCount", event.target.value)
                    }
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
                      update("batteryHealth", event.target.value)
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
                    onChange={(event) =>
                      update("completeness", event.target.value)
                    }
                    placeholder="Dus, Charger, Kabel"
                    className={inputClass(false)}
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {values.category === "aksesoris" && (
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
                    update(
                      "accessoryType",
                      event.target.value as AccessoryType,
                    )
                  }
                  className={inputClass(false)}
                >
                  {Object.entries(ACCESSORY_TYPE_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
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
                    update("compatibleWith", event.target.value)
                  }
                  placeholder="Samsung Galaxy A55, Redmi Note 13"
                  className={inputClass(false)}
                />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-7">
          <SectionTitle description="Unggah foto langsung ke Supabase Storage, tempel URL eksternal, atau pilih foto lokal. Pratinjau tampil otomatis.">
            Foto & Deskripsi
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Pratinjau
              </span>
              <div className="relative flex aspect-square w-[104px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {previewSource === "" ? (
                  <div className="flex flex-col items-center gap-1 px-2 text-center text-slate-400">
                    <ImageIcon className="size-6" aria-hidden="true" />
                    <span className="text-[10px] font-medium">
                      Belum ada foto
                    </span>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={previewSource}
                      src={previewSource}
                      alt="Pratinjau foto produk"
                      className={cn(
                        "size-full object-cover transition-opacity duration-200",
                        previewStatus === "ready" ? "opacity-100" : "opacity-0",
                      )}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onLoad={() => setPreviewStatus("ready")}
                      onError={() => setPreviewStatus("error")}
                    />
                    {previewStatus === "loading" && (
                      <span
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-500"
                        aria-live="polite"
                      >
                        <LoaderCircle
                          className="size-5 animate-spin"
                          aria-hidden="true"
                        />
                        <span className="text-[10px] font-medium">
                          Memuat...
                        </span>
                      </span>
                    )}
                    {previewStatus === "error" && (
                      <span
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-rose-50 px-2 text-center text-rose-600"
                        role="status"
                      >
                        <ImageOff className="size-5" aria-hidden="true" />
                        <span className="text-[10px] leading-tight font-medium">
                          Gambar gagal dimuat
                        </span>
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                {values.imageSource === "upload"
                  ? "Supabase Storage"
                  : values.imageSource === "url"
                    ? "URL eksternal"
                    : "File lokal"}
              </p>
            </div>

            <div className="min-w-0">
              <div
                className="mb-3 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
                role="group"
                aria-label="Sumber foto produk"
              >
                {IMAGE_SOURCE_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = values.imageSource === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleImageSourceChange(value)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600",
                        active
                          ? "bg-white text-royal-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {values.imageSource === "upload" ? (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!isUploading) setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (isUploading) return;
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => {
                      if (!isUploading) fileInputRef.current?.click();
                    }}
                    className={cn(
                      "group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200",
                      isDragging
                        ? "border-royal-500 bg-royal-50/70 ring-4 ring-royal-100 scale-[1.01]"
                        : isUploading
                          ? "border-royal-300 bg-royal-50/30 cursor-wait"
                          : "border-slate-200 bg-slate-50/60 hover:border-royal-400 hover:bg-royal-50/20",
                      errors.thumbnail && !values.thumbnail
                        ? "border-rose-300 bg-rose-50/30"
                        : "",
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        e.target.value = "";
                      }}
                      className="sr-only"
                      aria-label="Pilih file gambar dari komputer"
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-royal-100 text-royal-700 shadow-inner">
                          <LoaderCircle
                            className="size-6 animate-spin text-royal-600"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Mengunggah ke Supabase Storage...
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Mohon tunggu sebentar, file sedang diproses.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-royal-600/25 transition-transform duration-200 group-hover:scale-110">
                          <UploadCloud className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Tarik & lepas gambar ke sini, atau{" "}
                            <span className="text-royal-600 underline underline-offset-2">
                              pilih dari komputer
                            </span>
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Format: JPG, JPEG, PNG, WEBP (Maksimal 5 MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                    >
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0 text-rose-600"
                        aria-hidden="true"
                      />
                      <p>{uploadError}</p>
                    </div>
                  )}

                  {uploadSuccessName && !uploadError && (
                    <div
                      role="status"
                      className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2
                          className="size-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span className="truncate font-medium">
                          File{" "}
                          <strong className="font-semibold">
                            {uploadSuccessName}
                          </strong>{" "}
                          berhasil diunggah ke Supabase Storage!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="shrink-0 text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  )}

                  {values.thumbnail && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-500">
                      <span className="truncate font-mono">
                        URL: {values.thumbnail}
                      </span>
                      <span className="shrink-0 font-semibold text-emerald-600">
                        Siap Disimpan
                      </span>
                    </div>
                  )}

                  {errors.thumbnail && (
                    <p className="text-xs text-rose-600">{errors.thumbnail}</p>
                  )}
                </div>
              ) : (
                <Field
                  label={
                    values.imageSource === "url"
                      ? "URL gambar eksternal"
                      : "Path foto lokal"
                  }
                  htmlFor="product-thumbnail"
                  error={errors.thumbnail}
                  hint={
                    values.imageSource === "url"
                      ? "Tempel direct link gambar (http/https). Pratinjau tampil otomatis."
                      : "Pilih dari daftar atau ketik path lokal, mis. /images/products/unit-baru.jpg."
                  }
                >
                  <input
                    id="product-thumbnail"
                    type={values.imageSource === "url" ? "url" : "text"}
                    list={
                      values.imageSource === "local" ? imageListId : undefined
                    }
                    value={values.thumbnail}
                    onChange={(event) =>
                      handleThumbnailChange(event.target.value)
                    }
                    placeholder={
                      values.imageSource === "url"
                        ? "https://contoh.com/foto-produk.jpg"
                        : "/images/products/infinix-smart-20.jpg"
                    }
                    inputMode={values.imageSource === "url" ? "url" : "text"}
                    autoComplete={
                      values.imageSource === "url" ? "off" : undefined
                    }
                    spellCheck={values.imageSource === "url" ? false : undefined}
                    aria-invalid={Boolean(errors.thumbnail)}
                    aria-describedby={
                      errors.thumbnail
                        ? "product-thumbnail-error"
                        : "product-thumbnail-hint"
                    }
                    className={inputClass(Boolean(errors.thumbnail))}
                  />
                  {values.imageSource === "local" && (
                    <datalist id={imageListId}>
                      {PRODUCT_IMAGE_PATHS.map((path) => (
                        <option key={path} value={path}>
                          {productImageLabel(path)}
                        </option>
                      ))}
                    </datalist>
                  )}
                </Field>
              )}
            </div>

            {/* Bagian Galeri Foto Tambahan (Multi-Angle) */}
            <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Galeri Foto Tambahan (Multi-Angle)
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Foto sudut fisik lain (tampak belakang, bezel, atau kelengkapan).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingGallery}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-royal-700 shadow-xs transition hover:border-royal-300 hover:bg-royal-50 focus-visible:outline-2 focus-visible:outline-royal-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploadingGallery ? (
                    <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-3.5" aria-hidden="true" />
                  )}
                  Upload Foto Sudut Lain
                </button>
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Upload foto tambahan galeri"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleGalleryUpload(file);
                  e.target.value = "";
                }}
              />

              {galleryUploadError && (
                <p className="mt-2 text-xs text-rose-600">{galleryUploadError}</p>
              )}

              {values.galleryImages && values.galleryImages.length > 0 ? (
                <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {values.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={imgUrl + idx}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Galeri ${idx + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        aria-label={`Hapus foto sudut ${idx + 1}`}
                        className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition hover:bg-rose-700 cursor-pointer"
                      >
                        <Trash2 className="size-3" aria-hidden="true" />
                      </button>
                      <span className="absolute bottom-1 left-1 rounded bg-slate-900/70 px-1 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400 italic">
                  Belum ada foto tambahan. Klik &quot;Upload Foto Sudut Lain&quot; untuk menambahkan foto galeri.
                </p>
              )}
            </div>

            <Field
              label="Deskripsi"
              htmlFor="product-description"
              className="sm:col-span-2"
              hint="Kosongkan untuk memakai deskripsi default sesuai kategori."
              action={
                <AiDescriptionButton
                  values={values}
                  disabled={isSaving}
                  onGenerated={(description) =>
                    update("description", description)
                  }
                />
              }
            >
              <textarea
                id="product-description"
                rows={3}
                value={values.description}
                onChange={(event) =>
                  update("description", event.target.value)
                }
                placeholder="Ceritakan kondisi unit, kelengkapan, dan keunggulannya."
                className={textareaClass(false)}
              />
            </Field>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 rounded-xl bg-royal-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-royal-800">
          <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Setelah disimpan, produk tersedia di database dan tampil di katalog
          pembeli. Tab lain akan menyinkronkan data secara otomatis.
        </p>
      </form>
    </Modal>
  );
}
