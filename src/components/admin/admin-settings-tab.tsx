"use client";

import {
  CheckCircle2,
  LoaderCircle,
  MapPin,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/ui/toast-provider";
import type { StorePaymentSettings } from "@/types";

interface AdminSettingsTabProps {
  initialSettings: StorePaymentSettings;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSaved: (settings: StorePaymentSettings) => void;
  onUnauthorized: () => void;
}

const DEFAULT_QRIS_IMAGE = "/images/qris-konter-fajar-cell.svg";
const MAX_QRIS_UPLOAD_BYTES = 2 * 1024 * 1024;

export function AdminSettingsTab({
  initialSettings,
  isLoading,
  onRefresh,
  onSaved,
  onUnauthorized,
}: AdminSettingsTabProps) {
  const { showToast } = useToast();

  const [qrisImageUrl, setQrisImageUrl] = useState(
    initialSettings.qrisImageUrl,
  );
  const [danaNumber, setDanaNumber] = useState(initialSettings.danaNumber);
  const [danaAccountName, setDanaAccountName] = useState(
    initialSettings.danaAccountName,
  );
  const [storeLat, setStoreLat] = useState(String(initialSettings.storeLat));
  const [storeLng, setStoreLng] = useState(String(initialSettings.storeLng));

  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleUploadQris(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_QRIS_UPLOAD_BYTES) {
      showToast({
        variant: "error",
        title: "Ukuran gambar terlalu besar",
        description: "Maksimal ukuran gambar QRIS adalah 2 MB.",
      });
      return;
    }

    setIsUploadingQris(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.success || !data.url) {
        showToast({
          variant: "error",
          title: "Gagal mengunggah foto QRIS",
          description: data?.error ?? "Gunakan file JPG, PNG, atau WebP.",
        });
        return;
      }

      setQrisImageUrl(data.url);
      showToast({
        variant: "success",
        title: "Foto QRIS terunggah",
        description: "Klik Simpan Pengaturan untuk menerapkannya di checkout.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "Koneksi bermasalah",
        description: "Gagal mengunggah foto QRIS.",
      });
    } finally {
      setIsUploadingQris(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    const latNum = Number(storeLat);
    const lngNum = Number(storeLng);

    if (
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180
    ) {
      showToast({
        variant: "error",
        title: "Koordinat tidak valid",
        description: "Periksa angka Latitude dan Longitude toko.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrisImageUrl: qrisImageUrl.trim(),
          danaNumber: danaNumber.trim(),
          danaAccountName: danaAccountName.trim(),
          storeLat: latNum,
          storeLng: lngNum,
        }),
      });

      if (res.status === 401) {
        onUnauthorized();
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        settings?: StorePaymentSettings;
      } | null;

      if (!res.ok || !data?.success || !data.settings) {
        showToast({
          variant: "error",
          title: "Gagal menyimpan pengaturan",
          description: data?.error ?? "Periksa kembali data yang dimasukkan.",
        });
        return;
      }

      onSaved(data.settings);
      showToast({
        variant: "success",
        title: "Pengaturan berhasil disimpan",
        description:
          "QRIS, nomor DANA, dan titik koordinat COD langsung diperbarui di halaman checkout.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "Koneksi bermasalah",
        description: "Gagal menghubungi server.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Pengaturan QRIS, Rekening DANA & Titik COD Toko
          </h2>
          <p className="text-xs text-slate-500">
            Perubahan di sini langsung tampil di halaman checkout pembeli tanpa deploy ulang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void onRefresh();
          }}
          disabled={isLoading}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-4" aria-hidden="true" />
          )}
          Muat Ulang
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bagian QRIS */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-royal-700" aria-hidden="true" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Gambar QRIS Merchant
            </h3>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row">
            <div className="w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrisImageUrl || DEFAULT_QRIS_IMAGE}
                alt="Pratinjau QRIS toko"
                className="h-auto w-full object-contain"
              />
            </div>

            <div className="flex-1 space-y-2.5 text-center sm:text-left">
              <p className="text-xs text-slate-600">
                Unggah gambar QRIS asli toko (JPG, PNG, atau WebP maks 2 MB).
              </p>

              <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-royal-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal-800">
                  {isUploadingQris ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                  <span>
                    {isUploadingQris ? "Mengunggah..." : "Upload Foto QRIS"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isUploadingQris}
                    onChange={(e) => {
                      void handleUploadQris(e);
                    }}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setQrisImageUrl(DEFAULT_QRIS_IMAGE)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Reset Default
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-qris-url"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              URL / Path Gambar QRIS
            </label>
            <input
              id="settings-qris-url"
              type="text"
              required
              value={qrisImageUrl}
              onChange={(e) => setQrisImageUrl(e.target.value)}
              placeholder="/images/qris-konter-fajar-cell.svg atau https://..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 font-mono text-xs text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
            />
          </div>
        </section>

        {/* Bagian DANA & Koordinat Toko */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-sky-600" aria-hidden="true" />
            <h3 className="text-sm font-extrabold text-slate-900">
              Akun DANA & Titik Lokasi Toko
            </h3>
          </div>

          <div>
            <label
              htmlFor="settings-dana-number"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Nomor DANA Tujuan <span className="text-rose-600">*</span>
            </label>
            <input
              id="settings-dana-number"
              type="text"
              required
              value={danaNumber}
              onChange={(e) => setDanaNumber(e.target.value)}
              placeholder="Contoh: 085156069234"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 font-mono text-sm font-bold text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
            />
          </div>

          <div>
            <label
              htmlFor="settings-dana-name"
              className="block text-xs font-bold text-slate-700 mb-1"
            >
              Nama Pemilik Akun DANA <span className="text-rose-600">*</span>
            </label>
            <input
              id="settings-dana-name"
              type="text"
              required
              value={danaAccountName}
              onChange={(e) => setDanaAccountName(e.target.value)}
              placeholder="Contoh: Konter Fajar Cell"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
            />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
              <MapPin className="size-3.5 text-royal-600" aria-hidden="true" />
              Koordinat Titik Asal COD (Google Maps)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-lat"
                  className="block text-[11px] font-bold text-slate-600 mb-1"
                >
                  Latitude
                </label>
                <input
                  id="settings-lat"
                  type="number"
                  step="any"
                  required
                  value={storeLat}
                  onChange={(e) => setStoreLat(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 font-mono text-xs text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="settings-lng"
                  className="block text-[11px] font-bold text-slate-600 mb-1"
                >
                  Longitude
                </label>
                <input
                  id="settings-lng"
                  type="number"
                  step="any"
                  required
                  value={storeLng}
                  onChange={(e) => setStoreLng(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 font-mono text-xs text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5 text-[11px] text-emerald-900">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
              Hanya admin yang sudah login dengan PIN yang dapat mengubah data ini.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploadingQris}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-royal-600/20 transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span>Menyimpan Pengaturan...</span>
              </>
            ) : (
              <>
                <Save className="size-4" aria-hidden="true" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>

          {initialSettings.updatedAt && (
            <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
              <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />
              Terakhir diperbarui:{" "}
              {new Date(initialSettings.updatedAt).toLocaleString("id-ID")}
            </p>
          )}
        </section>
      </div>
    </form>
  );
}
