import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  ImageIcon,
  ImageOff,
  Link2,
  LoaderCircle,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useId, useRef, useState } from "react";

import { AiDescriptionButton } from "@/components/admin/ai-description-button";
import {
  PRODUCT_IMAGE_PATHS,
  productImageLabel,
} from "@/lib/product-images";
import { uploadProductImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import type { ProductFormValues } from "@/types";

import {
  Field,
  SectionTitle,
  inputClass,
  textareaClass,
  type PreviewStatus,
  type UpdateFieldFn,
} from "./form-primitives";

const IMAGE_SOURCE_OPTIONS = [
  { value: "upload", label: "Upload File Baru", icon: UploadCloud },
  { value: "url", label: "URL Eksternal", icon: Link2 },
  { value: "local", label: "Foto Lokal", icon: FolderOpen },
] as const;

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];

interface ImageUploadSectionProps {
  values: ProductFormValues;
  errors: Record<string, string>;
  isSaving: boolean;
  previewSource: string;
  previewStatus: PreviewStatus;
  onPreviewStatusChange: (status: PreviewStatus) => void;
  onUpdate: UpdateFieldFn;
  onThumbnailChange: (value: string) => void;
  onImageSourceChange: (source: ProductFormValues["imageSource"]) => void;
  onAddGalleryImage: (url: string) => void;
  onRemoveGalleryImage: (index: number) => void;
}

function validateClientImage(file: File): string | null {
  const lower = file.name.toLowerCase();
  if (!ALLOWED_IMAGE_EXT.some((ext) => lower.endsWith(ext))) {
    return "Format file tidak didukung. Harap pilih gambar berekstensi .jpg, .jpeg, .png, atau .webp.";
  }
  if (file.size === 0) {
    return "File gambar kosong tidak dapat diunggah.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Ukuran file melebihi 2 MB. Harap pilih gambar yang lebih kecil.";
  }
  return null;
}

export function ImageUploadSection({
  values,
  errors,
  isSaving,
  previewSource,
  previewStatus,
  onPreviewStatusChange,
  onUpdate,
  onThumbnailChange,
  onImageSourceChange,
  onAddGalleryImage,
  onRemoveGalleryImage,
}: ImageUploadSectionProps) {
  const imageListId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessName, setUploadSuccessName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileUpload(file: File) {
    setUploadError(null);
    setUploadSuccessName(null);

    const validationError = validateClientImage(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProductImage(file);
      if (!result.success || !result.url) {
        setUploadError(result.error || "Gagal mengunggah gambar ke Supabase Storage.");
        return;
      }

      onThumbnailChange(result.url);
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

    const validationError = validateClientImage(file);
    if (validationError) {
      setGalleryUploadError(validationError);
      return;
    }

    setIsUploadingGallery(true);
    try {
      const result = await uploadProductImage(file);
      if (!result.success || !result.url) {
        setGalleryUploadError(result.error || "Gagal mengunggah foto galeri.");
        return;
      }

      onAddGalleryImage(result.url);
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

  function handleTabChange(source: ProductFormValues["imageSource"]) {
    setUploadError(null);
    onImageSourceChange(source);
  }

  return (
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
                <span className="text-[10px] font-medium">Belum ada foto</span>
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
                  onLoad={() => onPreviewStatusChange("ready")}
                  onError={() => onPreviewStatusChange("error")}
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
                    <span className="text-[10px] font-medium">Memuat...</span>
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
                  onClick={() => handleTabChange(value)}
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
                  if (file) void handleFileUpload(file);
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
                    if (file) void handleFileUpload(file);
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
                        Format: JPG, JPEG, PNG, WEBP (Maksimal 2 MB)
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
                list={values.imageSource === "local" ? imageListId : undefined}
                value={values.thumbnail}
                onChange={(event) => onThumbnailChange(event.target.value)}
                placeholder={
                  values.imageSource === "url"
                    ? "https://contoh.com/foto-produk.jpg"
                    : "/images/products/infinix-smart-20.jpg"
                }
                inputMode={values.imageSource === "url" ? "url" : "text"}
                autoComplete={values.imageSource === "url" ? "off" : undefined}
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
              if (file) void handleGalleryUpload(file);
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
                    onClick={() => onRemoveGalleryImage(idx)}
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
              onGenerated={(description) => onUpdate("description", description)}
            />
          }
        >
          <textarea
            id="product-description"
            rows={3}
            value={values.description}
            onChange={(event) => onUpdate("description", event.target.value)}
            placeholder="Ceritakan kondisi unit, kelengkapan, dan keunggulannya."
            className={textareaClass(false)}
          />
        </Field>
      </div>
    </div>
  );
}
