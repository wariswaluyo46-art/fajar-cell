"use client";

import { LoaderCircle, Scale, ShoppingCart, Sparkles, Trash2, X } from "lucide-react";
import Image from "next/image";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { useProducts } from "@/hooks/use-products";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import { getProductAvailabilityInfo } from "@/lib/order-constants";
import { requiresNativeImage } from "@/lib/product-images";
import { cn, formatRupiah } from "@/lib/utils";
import { buildProductInquiryUrl } from "@/lib/whatsapp";
import type {
  AiCompareVerdict,
  NewPhoneProduct,
  Product,
  UsedPhoneProduct,
} from "@/types";

type PhoneProduct = UsedPhoneProduct | NewPhoneProduct;

interface CompareContextValue {
  compareIds: string[];
  isSelected: (productId: string) => boolean;
  toggleCompare: (product: Product) => void;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function isPhoneProduct(product: Product): product is PhoneProduct {
  return (
    product.category === "handphone-bekas" ||
    product.category === "handphone-baru"
  );
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const products = useProducts();
  const { showToast } = useToast();
  const { addToCart, getItemQuantity } = useCart();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<AiCompareVerdict | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const selectedPhones = useMemo(
    () =>
      compareIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is PhoneProduct => Boolean(p && isPhoneProduct(p))),
    [compareIds, products],
  );

  const isSelected = useCallback(
    (productId: string) => compareIds.includes(productId),
    [compareIds],
  );

  const toggleCompare = useCallback(
    (product: Product) => {
      if (!isPhoneProduct(product)) return;

      setAiVerdict(null);
      setAiError(null);
      setCompareIds((prev) => {
        if (prev.includes(product.id)) {
          return prev.filter((id) => id !== product.id);
        }

        if (prev.length >= 2) {
          showToast({
            variant: "info",
            title: "Maksimal 2 HP dibandingkan",
            description: `Mengganti pilihan pertama dengan ${product.name}.`,
          });
          return [prev[1], product.id];
        }

        const next = [...prev, product.id];
        if (next.length === 2) {
          showToast({
            variant: "success",
            title: "2 HP siap dibandingkan",
            description: "Klik Bandingkan Sekarang di bar bawah layar.",
          });
        }
        return next;
      });
    },
    [showToast],
  );

  const clearCompare = useCallback(() => {
    setCompareIds([]);
    setIsModalOpen(false);
    setAiVerdict(null);
    setAiError(null);
  }, []);

  const requestAiVerdict = useCallback(async () => {
    if (aiLoading || selectedPhones.length !== 2) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [selectedPhones[0].id, selectedPhones[1].id],
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        verdict?: AiCompareVerdict;
      } | null;

      if (!res.ok || !data?.success || !data.verdict) {
        setAiError(
          data?.error ?? "Gagal meminta analisis AI. Coba lagi sebentar.",
        );
        return;
      }

      setAiVerdict(data.verdict);
    } catch {
      setAiError("Tidak dapat menghubungi layanan AI.");
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, selectedPhones]);

  const value = useMemo(
    () => ({ compareIds, isSelected, toggleCompare, clearCompare }),
    [compareIds, isSelected, toggleCompare, clearCompare],
  );

  const [firstPhone, secondPhone] = selectedPhones;

  return (
    <CompareContext.Provider value={value}>
      {children}

      {/* Floating Compare Bar */}
      {selectedPhones.length > 0 && (
        <div
          role="region"
          aria-label="Perbandingan HP"
          className="fixed bottom-4 left-3 right-20 z-[85] sm:left-1/2 sm:right-auto sm:w-full sm:max-w-xl sm:-translate-x-1/2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-royal-200 bg-white/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {selectedPhones.map((phone) => (
                <div
                  key={phone.id}
                  className="flex min-w-0 max-w-[170px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={phone.thumbnail}
                    alt={phone.name}
                    className="size-7 shrink-0 rounded-lg object-cover"
                  />
                  <span className="truncate text-[11px] font-bold text-slate-800">
                    {phone.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCompare(phone)}
                    aria-label={`Hapus ${phone.name} dari perbandingan`}
                    className="shrink-0 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {selectedPhones.length === 1 && (
                <span className="text-[11px] font-medium text-slate-500">
                  Pilih 1 HP lagi...
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                aria-label="Bersihkan perbandingan"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={selectedPhones.length < 2}
                onClick={() => setIsModalOpen(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand-gradient px-3.5 py-2 text-xs font-extrabold text-white shadow-sm disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              >
                <Scale className="size-3.5" aria-hidden="true" />
                <span>Bandingkan ({selectedPhones.length}/2)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Compare Modal */}
      {isModalOpen && firstPhone && secondPhone && (
        <Modal
          title="Perbandingan Spesifikasi HP"
          description="Bandingkan harga, performa, baterai, kondisi fisik, dan masa garansi."
          size="xl"
          onClose={() => setIsModalOpen(false)}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  void requestAiVerdict();
                }}
                disabled={aiLoading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
              >
                {aiLoading ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4 text-cyan-200" aria-hidden="true" />
                )}
                <span>
                  {aiLoading
                    ? "Menganalisis Perbandingan..."
                    : aiVerdict
                      ? "Analisis Ulang dengan AI"
                      : "✨ Minta Analisis AI"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup Perbandingan
              </button>
            </div>
          }
        >
          {aiError && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
              {aiError}
            </div>
          )}

          {aiVerdict && (
            <div className="mb-5 rounded-2xl border border-royal-200 bg-royal-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-royal-700" aria-hidden="true" />
                <h3 className="text-xs font-extrabold tracking-wider text-royal-800 uppercase">
                  Verdict Analisis Fajar AI
                </h3>
              </div>
              <p className="text-xs leading-relaxed font-medium text-slate-800">
                {aiVerdict.summary}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {(
                  [
                    { key: "gaming", label: "Performa / Gaming" },
                    { key: "battery", label: "Baterai" },
                    { key: "camera", label: "Kamera" },
                    { key: "parents", label: "Ramah Orang Tua" },
                    { key: "value", label: "Value for Money" },
                  ] as const
                ).map((cat) => {
                  const winner = aiVerdict.winnerByCategory[cat.key];
                  return (
                    <div
                      key={cat.key}
                      className="rounded-xl border border-royal-200/80 bg-white p-2.5 text-[11px]"
                    >
                      <p className="font-bold text-slate-500 uppercase text-[10px]">
                        {cat.label}
                      </p>
                      <p className="mt-0.5 font-extrabold text-royal-700 line-clamp-1">
                        {winner.winnerName}
                      </p>
                      <p className="mt-0.5 text-slate-600 leading-snug">
                        {winner.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="w-36 py-3 pr-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                    Spesifikasi
                  </th>
                  {[firstPhone, secondPhone].map((phone) => {
                    const useNative = requiresNativeImage(phone.thumbnail);
                    return (
                      <th key={phone.id} className="w-1/2 px-3 py-3 align-top">
                        <div className="flex items-center gap-3">
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {useNative ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={phone.thumbnail}
                                alt={phone.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <Image
                                src={phone.thumbnail}
                                alt={phone.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold tracking-wider text-royal-700 uppercase">
                              {phone.brand} •{" "}
                              {PRODUCT_CATEGORY_LABELS[phone.category]}
                            </span>
                            <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                              {phone.name}
                            </p>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">Harga</td>
                  {[firstPhone, secondPhone].map((phone, idx) => {
                    const other = idx === 0 ? secondPhone : firstPhone;
                    const isCheaper = phone.price < other.price;
                    return (
                      <td key={phone.id} className="px-3 py-3">
                        <span
                          className={cn(
                            "text-base font-black",
                            isCheaper ? "text-emerald-700" : "text-royal-700",
                          )}
                        >
                          {formatRupiah(phone.price)}
                        </span>
                        {isCheaper && (
                          <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                            Lebih Hemat
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    RAM / ROM
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 font-bold text-slate-900">
                      {phone.specs.ram} GB / {phone.specs.storage} GB
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Baterai
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-800">
                      <span className="font-bold">
                        {phone.specs.battery
                          ? `${phone.specs.battery} mAh`
                          : "-"}
                      </span>
                      {phone.category === "handphone-bekas" &&
                        phone.condition.batteryHealth !== undefined && (
                          <span className="ml-1.5 text-xs text-slate-500">
                            (BH {phone.condition.batteryHealth}%)
                          </span>
                        )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Chipset
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-700">
                      {phone.specs.chipset ?? "-"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">Layar</td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-700">
                      {phone.specs.screen ?? "-"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">Kamera</td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-700">
                      {phone.specs.camera ?? "-"}
                      {phone.specs.frontCamera && (
                        <span className="block text-[11px] text-slate-500">
                          Depan: {phone.specs.frontCamera}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Jaringan & OS
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-700">
                      {[phone.specs.network, phone.specs.os]
                        .filter(Boolean)
                        .join(" • ") || "-"}
                    </td>
                  ))}
                </tr>

                {(firstPhone.specs.customSpecs?.length ||
                  secondPhone.specs.customSpecs?.length) ? (
                  <tr>
                    <td className="py-3 pr-3 font-bold text-slate-600">
                      Fitur Tambahan
                    </td>
                    {[firstPhone, secondPhone].map((phone) => (
                      <td key={phone.id} className="px-3 py-3 text-slate-700">
                        {phone.specs.customSpecs &&
                        phone.specs.customSpecs.length > 0
                          ? phone.specs.customSpecs
                              .map((item) => `${item.key}: ${item.value}`)
                              .join(" • ")
                          : "-"}
                      </td>
                    ))}
                  </tr>
                ) : null}

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Kondisi Fisik
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-800">
                      {phone.category === "handphone-bekas"
                        ? `${phone.condition.grade} (${phone.condition.minusCount > 0 ? `${phone.condition.minusCount} minus` : "Tanpa minus"})`
                        : "Unit Baru Segel Resmi"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Kelengkapan
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-slate-700">
                      {phone.category === "handphone-bekas"
                        ? phone.condition.completeness.join(", ")
                        : "Fullset Box Segel Resmi"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">
                    Garansi
                  </td>
                  {[firstPhone, secondPhone].map((phone) => (
                    <td key={phone.id} className="px-3 py-3 text-emerald-800 font-semibold">
                      {phone.warranty.active
                        ? `${phone.warranty.durationDays} hari — ${phone.warranty.description}`
                        : "Tanpa garansi"}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="py-3 pr-3 font-bold text-slate-600">Aksi</td>
                  {[firstPhone, secondPhone].map((phone) => {
                    const qty = getItemQuantity(phone.id);
                    const avail = getProductAvailabilityInfo(phone, qty);
                    return (
                      <td key={phone.id} className="px-3 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={!avail.canAddToCart}
                            onClick={() => {
                              void addToCart(phone, 1).then((ok) => {
                                if (ok) setIsModalOpen(false);
                              });
                            }}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-1.5 text-xs font-extrabold text-white disabled:opacity-50 cursor-pointer"
                          >
                            <ShoppingCart className="size-3.5" aria-hidden="true" />
                            <span>
                              {avail.canAddToCart ? "Keranjang" : "Tidak Tersedia"}
                            </span>
                          </button>
                          <WhatsAppLink
                            href={buildProductInquiryUrl(phone)}
                            size="sm"
                            variant="outline"
                          >
                            Tanya WA
                          </WhatsAppLink>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </CompareContext.Provider>
  );
}

export function useCompareOptional(): CompareContextValue | null {
  return useContext(CompareContext);
}
