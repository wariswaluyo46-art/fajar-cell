"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  LoaderCircle,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CalculatedLocationInfo } from "@/components/checkout/map-location-picker";
import { Container } from "@/components/ui/container";
import { useToast } from "@/components/ui/toast-provider";
import { notifyProductsChanged } from "@/lib/product-repository";
import { requiresNativeImage } from "@/lib/product-images";
import { defaultStoreSettings } from "@/lib/store";
import { cn, formatRupiah } from "@/lib/utils";
import type {
  DeliveryMethod,
  PaymentMethod,
  StorePaymentSettings,
} from "@/types";

const MapLocationPicker = dynamic(
  () =>
    import("@/components/checkout/map-location-picker").then(
      (module) => module.MapLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500">
        <LoaderCircle className="size-6 animate-spin text-royal-600" aria-hidden="true" />
        <p className="text-xs font-semibold">Memuat peta interaktif...</p>
      </div>
    ),
  },
);

const MAX_PROOF_BYTES = 3 * 1024 * 1024;

export function CheckoutClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    items,
    subtotal,
    totalQuantity,
    earliestExpiresAt,
    serverOffsetMs,
    refreshCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("cod");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [destinationAddress, setDestinationAddress] = useState("");
  const [locationInfo, setLocationInfo] =
    useState<CalculatedLocationInfo | null>(null);

  const [uniqueCode, setUniqueCode] = useState(123);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [storePayment, setStorePayment] = useState<StorePaymentSettings>(() => ({
    qrisImageUrl:
      defaultStoreSettings.qrisImageUrl ?? "/images/qris-konter-fajar-cell.svg",
    danaNumber: defaultStoreSettings.danaNumber ?? "085156069234",
    danaAccountName:
      defaultStoreSettings.danaAccountName ?? defaultStoreSettings.name,
    storeLat: defaultStoreSettings.coordinates?.lat ?? -7.3679,
    storeLng: defaultStoreSettings.coordinates?.lng ?? 109.6836,
  }));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setUniqueCode(Math.floor(101 + Math.random() * 899));
      void fetch("/api/store-settings", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then(
          (
            data: {
              success?: boolean;
              settings?: StorePaymentSettings;
            } | null,
          ) => {
            if (data?.success && data.settings) {
              setStorePayment(data.settings);
            }
          },
        )
        .catch(() => undefined);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!earliestExpiresAt || items.length === 0) return;

    const tick = () => setNowMs(Date.now() + serverOffsetMs);
    const frame = requestAnimationFrame(tick);
    const interval = window.setInterval(tick, 1_000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [earliestExpiresAt, items.length, serverOffsetMs]);

  const handleLocationCalculated = useCallback(
    (info: CalculatedLocationInfo) => {
      setLocationInfo(info);
    },
    [],
  );

  const shippingFee =
    deliveryMethod === "pickup" ? 0 : (locationInfo?.shippingFee ?? 0);
  const activeUniqueCode = paymentMethod === "cod" ? 0 : uniqueCode;
  const totalAmount = subtotal + shippingFee + activeUniqueCode;

  const qrisImageUrl = storePayment.qrisImageUrl;
  const danaNumber = storePayment.danaNumber;
  const danaAccountName = storePayment.danaAccountName;

  function formatCountdown(): string {
    if (!earliestExpiresAt) return "15:00";
    const diffSec = Math.max(
      0,
      Math.floor((Date.parse(earliestExpiresAt) - nowMs) / 1_000),
    );
    const m = Math.floor(diffSec / 60);
    const s = diffSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  async function handleCopyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast({
        variant: "success",
        title: `${label} disalin`,
        description: `${text} siap ditempel di aplikasi pembayaran Anda.`,
      });
    } catch {
      showToast({
        variant: "error",
        title: "Gagal menyalin",
        description: "Silakan salin secara manual.",
      });
    }
  }

  async function handleProofUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_PROOF_BYTES) {
      showToast({
        variant: "error",
        title: "Ukuran file terlalu besar",
        description: "Maksimal ukuran bukti pembayaran adalah 3 MB.",
      });
      return;
    }

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/orders/upload-proof", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.success || !data.url) {
        showToast({
          variant: "error",
          title: "Gagal mengunggah bukti bayar",
          description: data?.error ?? "Pastikan format gambar JPG/PNG/WebP.",
        });
        return;
      }

      setProofUrl(data.url);
      showToast({
        variant: "success",
        title: "Bukti pembayaran terunggah",
        description: "Anda dapat melanjutkan pengiriman pesanan.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "Gagal mengunggah",
        description: "Periksa koneksi internet Anda lalu coba lagi.",
      });
    } finally {
      setIsUploadingProof(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    if (customerName.trim().length < 2) {
      showToast({
        variant: "error",
        title: "Nama belum lengkap",
        description: "Masukkan nama lengkap Anda.",
      });
      return;
    }

    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      showToast({
        variant: "error",
        title: "Nomor WhatsApp tidak valid",
        description: "Masukkan nomor WhatsApp aktif (contoh: 081234567890).",
      });
      return;
    }

    if (deliveryMethod === "cod") {
      if (!locationInfo) {
        showToast({
          variant: "error",
          title: "Titik peta COD belum dipilih",
          description:
            "Cari lokasi, gunakan GPS, atau klik peta untuk menentukan jarak COD.",
        });
        return;
      }

      if (!locationInfo.codEligible) {
        showToast({
          variant: "error",
          title: "Di luar jangkauan COD (> 20 km)",
          description:
            "Pilih Ambil di Toko atau hubungi admin via WhatsApp untuk ekspedisi.",
        });
        return;
      }

      if (destinationAddress.trim().length < 5) {
        showToast({
          variant: "error",
          title: "Alamat lengkap wajib diisi",
          description:
            "Tambahkan nama jalan, RT/RW, atau patokan rumah agar kurir mudah menemukan lokasi.",
        });
        return;
      }
    }

    if ((paymentMethod === "qris" || paymentMethod === "dana") && !proofUrl) {
      showToast({
        variant: "error",
        title: "Bukti pembayaran belum diunggah",
        description:
          "Unggah foto/screenshot bukti transfer QRIS atau DANA terlebih dahulu.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryMethod,
          paymentMethod,
          paymentUniqueCode: activeUniqueCode,
          paymentProofUrl: paymentMethod === "cod" ? null : proofUrl,
          destinationAddress:
            deliveryMethod === "cod"
              ? destinationAddress.trim()
              : "Ambil langsung di Konter Fajar Cell",
          destinationLat:
            deliveryMethod === "cod" ? (locationInfo?.lat ?? null) : null,
          destinationLng:
            deliveryMethod === "cod" ? (locationInfo?.lng ?? null) : null,
          notes: notes.trim(),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        order?: { orderCode?: string };
      } | null;

      if (!response.ok || !data?.success || !data.order?.orderCode) {
        showToast({
          variant: "error",
          title: "Pesanan gagal dibuat",
          description:
            data?.error ?? "Terjadi kendala saat memproses pesanan.",
        });
        void refreshCart();
        notifyProductsChanged();
        return;
      }

      await refreshCart();
      notifyProductsChanged();
      showToast({
        variant: "success",
        title: "Pesanan berhasil dibuat!",
        description: `Kode pesanan ${data.order.orderCode} sedang menunggu persetujuan admin.`,
      });
      router.push(`/order/${encodeURIComponent(data.order.orderCode)}`);
    } catch {
      showToast({
        variant: "error",
        title: "Koneksi gagal",
        description: "Tidak dapat mengirim pesanan. Periksa internet Anda.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ShoppingBag className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">
            Keranjang Belanja Kosong
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Belum ada produk di keranjang atau masa reservasi 15 menit sudah berakhir. Silakan pilih produk dari katalog terlebih dahulu.
          </p>
          <Link
            href="/#hp-bekas"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-extrabold text-white shadow-md"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-royal-700 hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Kembali ke Katalog
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Checkout Pesanan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pilih metode pengiriman COD / Ambil di Toko dan pembayaran yang paling nyaman.
          </p>
        </div>

        {earliestExpiresAt && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-royal-200 bg-royal-50 px-4 py-2.5 text-xs font-bold text-royal-900">
            <Clock className="size-4 text-royal-700" aria-hidden="true" />
            <span>Sisa waktu reservasi stok:</span>
            <span className="rounded-lg bg-royal-700 px-2 py-0.5 font-mono text-sm font-extrabold text-white tabular-nums">
              {formatCountdown()}
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:items-start"
      >
        {/* Kolom Kiri: Form & Peta */}
        <div className="space-y-6">
          {/* 1. Data Pembeli */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              1. Data Pembeli
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Nama Lengkap <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Nomor WhatsApp Aktif <span className="text-rose-600">*</span>
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-notes"
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                Catatan untuk Penjual / Kurir (Opsional)
              </label>
              <input
                id="checkout-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mis. minta pasang tempered glass sekalian, atau antar sore jam 4"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
              />
            </div>
          </section>

          {/* 2. Metode Pengiriman & Map Picker */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              2. Metode Pengiriman
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("cod")}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer",
                  deliveryMethod === "cod"
                    ? "border-royal-600 bg-royal-50/70 ring-2 ring-royal-500/20"
                    : "border-slate-200 bg-white hover:border-royal-300",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-royal-100 text-royal-700">
                  <Truck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    COD (Antar ke Lokasi)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Gratis 0–3 km, maksimal radius 20 km dari Konter Fajar Cell.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer",
                  deliveryMethod === "pickup"
                    ? "border-royal-600 bg-royal-50/70 ring-2 ring-royal-500/20"
                    : "border-slate-200 bg-white hover:border-royal-300",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Ambil di Toko (Self-Pickup)
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Ongkir Rp0 • Cek unit langsung di Jl. Raya Melikan, Kendaga.
                  </p>
                </div>
              </button>
            </div>

            {deliveryMethod === "cod" ? (
              <div className="space-y-4 pt-2">
                <MapLocationPicker
                  selectedLat={locationInfo?.lat ?? null}
                  selectedLng={locationInfo?.lng ?? null}
                  address={destinationAddress}
                  storeOrigin={{
                    lat: storePayment.storeLat,
                    lng: storePayment.storeLng,
                  }}
                  onAddressChange={setDestinationAddress}
                  onLocationCalculated={handleLocationCalculated}
                />

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Detail Alamat & Patokan Rumah{" "}
                    <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    required
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    placeholder="Contoh: Desa Kendaga RT 02 RW 01, dekat Balai Desa / Masjid..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-900 outline-none focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-900">
                <p className="flex items-center gap-1.5 font-extrabold">
                  <MapPin className="size-4 text-emerald-700" aria-hidden="true" />
                  Alamat Pengambilan Unit:
                </p>
                <p className="mt-1">{defaultStoreSettings.address}</p>
                <p className="mt-1 font-semibold">
                  Jam Buka: Setiap Hari 07.30 – 21.00 WIB
                </p>
              </div>
            )}
          </section>

          {/* 3. Metode Pembayaran */}
          <section className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              3. Metode Pembayaran
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition cursor-pointer",
                  paymentMethod === "cod"
                    ? "border-royal-600 bg-royal-50/70 ring-2 ring-royal-500/20"
                    : "border-slate-200 bg-white hover:border-royal-300",
                )}
              >
                <Wallet className="size-5 text-emerald-600" aria-hidden="true" />
                <span className="text-sm font-extrabold text-slate-900">
                  Bayar Tunai / COD
                </span>
                <span className="text-[11px] text-slate-600">
                  Bayar setelah cek unit langsung.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("qris")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition cursor-pointer",
                  paymentMethod === "qris"
                    ? "border-royal-600 bg-royal-50/70 ring-2 ring-royal-500/20"
                    : "border-slate-200 bg-white hover:border-royal-300",
                )}
              >
                <QrCode className="size-5 text-royal-700" aria-hidden="true" />
                <span className="text-sm font-extrabold text-slate-900">
                  QRIS
                </span>
                <span className="text-[11px] text-slate-600">
                  Scan semua e-wallet & m-banking.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("dana")}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition cursor-pointer",
                  paymentMethod === "dana"
                    ? "border-royal-600 bg-royal-50/70 ring-2 ring-royal-500/20"
                    : "border-slate-200 bg-white hover:border-royal-300",
                )}
              >
                <Wallet className="size-5 text-sky-600" aria-hidden="true" />
                <span className="text-sm font-extrabold text-slate-900">
                  Transfer DANA
                </span>
                <span className="text-[11px] text-slate-600">
                  Kirim ke akun DANA resmi toko.
                </span>
              </button>
            </div>

            {paymentMethod === "qris" && (
              <div className="rounded-2xl border border-royal-200 bg-royal-50/40 p-4 space-y-4">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="w-48 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrisImageUrl}
                      alt="QRIS Konter Fajar Cell"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <p className="text-sm font-extrabold text-slate-900">
                      Total Transfer QRIS (termasuk kode unik {uniqueCode})
                    </p>
                    <p className="text-2xl font-black text-royal-700 tabular-nums">
                      {formatRupiah(totalAmount)}
                    </p>
                    <p className="text-xs text-slate-600">
                      Transfer tepat sesuai nominal hingga 3 digit terakhir untuk mempercepat verifikasi admin.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                      <a
                        href={qrisImageUrl}
                        download="QRIS-Konter-Fajar-Cell.svg"
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <Download className="size-3.5" aria-hidden="true" />
                        Download QR
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void handleCopyText(String(totalAmount), "Nominal");
                        }}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-royal-200 bg-white px-3.5 py-2 text-xs font-bold text-royal-700 hover:bg-royal-50 cursor-pointer"
                      >
                        <Copy className="size-3.5" aria-hidden="true" />
                        Salin Nominal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "dana" && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Nomor DANA Tujuan ({danaAccountName})
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-black text-slate-900">
                      {danaNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyText(danaNumber, "Nomor DANA");
                    }}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 cursor-pointer"
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                    Salin Nomor
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sky-200/70 pt-3">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Nominal Transfer (+ Kode Unik {uniqueCode})
                    </p>
                    <p className="mt-0.5 text-xl font-black text-royal-700 tabular-nums">
                      {formatRupiah(totalAmount)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopyText(String(totalAmount), "Nominal");
                    }}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-royal-200 bg-white px-3.5 py-2 text-xs font-bold text-royal-700 hover:bg-royal-50 cursor-pointer"
                  >
                    <Copy className="size-3.5" aria-hidden="true" />
                    Salin Nominal
                  </button>
                </div>
              </div>
            )}

            {(paymentMethod === "qris" || paymentMethod === "dana") && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Upload Bukti Pembayaran <span className="text-rose-600">*</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Format JPG, PNG, atau WebP • Maksimal 3 MB
                    </p>
                  </div>
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-royal-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-royal-800">
                    {isUploadingProof ? (
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Upload className="size-4" aria-hidden="true" />
                    )}
                    <span>
                      {isUploadingProof
                        ? "Mengunggah..."
                        : proofUrl
                          ? "Ganti Bukti"
                          : "Pilih Foto Bukti"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isUploadingProof}
                      onChange={(e) => {
                        void handleProofUpload(e);
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>

                {proofUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt="Pratinjau bukti transfer"
                      className="size-16 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                        Bukti transfer siap diverifikasi admin
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {proofUrl}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan */}
        <aside className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4 lg:sticky lg:top-24">
          <h2 className="text-base font-extrabold text-slate-900">
            Ringkasan Pesanan ({totalQuantity} unit)
          </h2>

          <ul className="divide-y divide-slate-100">
            {items.map((item) => {
              const useNative = requiresNativeImage(item.thumbnail);
              return (
                <li key={item.productId} className="flex items-center gap-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {useNative ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-bold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {item.quantity}x {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-extrabold text-slate-900">
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <dt>Subtotal Produk</dt>
              <dd className="font-bold text-slate-900">
                {formatRupiah(subtotal)}
              </dd>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <dt>
                {deliveryMethod === "pickup"
                  ? "Ongkir (Ambil di Toko)"
                  : `Ongkir COD${locationInfo ? ` (${locationInfo.distanceKm} km)` : ""}`}
              </dt>
              <dd className="font-bold text-slate-900">
                {deliveryMethod === "pickup"
                  ? "Rp0"
                  : locationInfo
                    ? shippingFee === 0
                      ? "Gratis"
                      : formatRupiah(shippingFee)
                    : "Pilih titik peta"}
              </dd>
            </div>

            {activeUniqueCode > 0 && (
              <div className="flex items-center justify-between text-slate-600">
                <dt>Kode Unik Verifikasi</dt>
                <dd className="font-bold text-royal-700">
                  +{formatRupiah(activeUniqueCode)}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
              <dt className="font-extrabold text-slate-900">Total Tagihan</dt>
              <dd className="text-xl font-black text-royal-700">
                {formatRupiah(totalAmount)}
              </dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingProof}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-royal-600/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span>Membuat Pesanan...</span>
              </>
            ) : (
              <span>Buat Pesanan Sekarang</span>
            )}
          </button>

          <p className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-600">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span>
              Pesanan akan mendapatkan Invoice Digital & langsung masuk antrean konfirmasi admin Konter Fajar Cell.
            </span>
          </p>
        </aside>
      </form>
    </Container>
  );
}
