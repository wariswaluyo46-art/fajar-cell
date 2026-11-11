"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageCircle,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import { buildServiceInquiryUrl } from "@/lib/whatsapp";
import {
  SERVICE_DAMAGES,
  type ServiceBookingInput,
  type ServiceDamageId,
  type ServiceMethod,
} from "@/types/service";

const QUICK_BRANDS = [
  "Samsung",
  "Xiaomi / Redmi",
  "OPPO",
  "Vivo",
  "Infinix",
  "Realme",
  "Lainnya",
];

const SERVICE_WORKFLOW = [
  {
    step: "01",
    title: "Cek Kerusakan Gratis",
    desc: "Bawa HP ke konter atau konsultasikan via WA. Pengecekan 100% gratis tanpa paksaan.",
    icon: "🆓",
  },
  {
    step: "02",
    title: "Konfirmasi Biaya di Awal",
    desc: "Biaya sparepart dan jasa disepakati sebelum dibongkar. Tidak ada biaya siluman di akhir.",
    icon: "🤝",
  },
  {
    step: "03",
    title: "Pengerjaan Cepat & Rapi",
    desc: "Meja servis transparan di depan Anda. Ganti LCD & baterai bisa ditunggu 45-90 menit.",
    icon: "⚡",
  },
  {
    step: "04",
    title: "Garansi Toko Resmi",
    desc: "Disertai nota fisik & garansi servis 14-30 hari. Jika kendala terulang, kami tangani kembali.",
    icon: "🛡️",
  },
];

const SERVICE_FAQS = [
  {
    q: "Berapa lama servis ganti LCD atau ganti baterai?",
    a: "Untuk penggantian LCD dan baterai yang sparepart-nya ready stock, pengerjaan membutuhkan waktu 45 hingga 90 menit dan bisa langsung ditunggu di konter kami.",
  },
  {
    q: "Apakah data dan foto di dalam HP saya aman?",
    a: "Sangat aman. Privasi pelanggan adalah prioritas utama kami. Untuk perbaikan hardware seperti layar, baterai, kamera, dan port cas, memori dan data tidak diotak-atik sama sekali.",
  },
  {
    q: "Bagaimana jika setelah dicek saya tidak jadi servis?",
    a: "Tidak masalah sama sekali! Pengecekan dan konsultasi kerusakan di Konter Fajar Cell 100% Gratis. Kamu tidak dipungut biaya jika membatalkan servis.",
  },
  {
    q: "Berapa lama masa garansi servis yang diberikan?",
    a: "Kami memberikan garansi toko resmi mulai dari 14 hari hingga 30 hari tergantung jenis sparepart dan kerusakan yang diperbaiki.",
  },
  {
    q: "Di mana alamat konter untuk servis langsung?",
    a: "Konter kami beralamat di Jl. Raya Melikan, Desa Kendaga, Kec. Banjarmangu, Banjarnegara. Buka setiap hari mulai pukul 07.30 sampai 21.00 WIB.",
  },
];

export function ServiceSection() {
  const { showToast } = useToast();

  const [selectedBrand, setSelectedBrand] = useState("Samsung");
  const [phoneModel, setPhoneModel] = useState("");
  const [selectedDamages, setSelectedDamages] = useState<ServiceDamageId[]>([
    "lcd",
  ]);
  const [serviceMethod, setServiceMethod] =
    useState<ServiceMethod>("datang-langsung");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  const toggleDamage = (id: ServiceDamageId) => {
    setSelectedDamages((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id],
    );
  };

  const selectedDamageItems = useMemo(
    () => SERVICE_DAMAGES.filter((d) => selectedDamages.includes(d.id)),
    [selectedDamages],
  );

  const canWait = useMemo(
    () => selectedDamageItems.every((d) => d.canWait),
    [selectedDamageItems],
  );

  const estimatedTimeText = useMemo(() => {
    if (!canWait) return "1 - 3 Hari Kerja (Pengecekan Jalur Mesin Detail)";
    if (selectedDamageItems.length > 1) return "⚡ Bisa Ditunggu 60 - 120 Menit";
    return `⚡ Bisa Ditunggu ${selectedDamageItems[0]?.estimatedMinutes ?? "45 - 90 Menit"}`;
  }, [canWait, selectedDamageItems]);

  const bookingInput: ServiceBookingInput = useMemo(
    () => ({
      brand: selectedBrand,
      model: phoneModel.trim() || "Semua Tipe",
      damages: selectedDamages,
      method: serviceMethod,
      customerName,
      notes,
    }),
    [selectedBrand, phoneModel, selectedDamages, serviceMethod, customerName, notes],
  );

  const waUrl = useMemo(
    () => buildServiceInquiryUrl(bookingInput),
    [bookingInput],
  );

  const handleBookingClick = () => {
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp Servis...",
      description: "Format booking servis otomatis sedang disiapkan ke WhatsApp Admin.",
    });
  };

  return (
    <section id="service-section" className="relative py-12 sm:py-18 overflow-hidden">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 -right-20 size-96 rounded-full bg-cyan-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1/3 -left-20 size-80 rounded-full bg-royal-200/30 blur-3xl"
      />

      <Container className="relative">
        {/* Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-4 py-1.5 text-xs font-bold text-cyan-900 shadow-xs">
              <Wrench className="size-3.5 text-cyan-700" aria-hidden="true" />
              Layanan Service HP Banjarnegara
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              HP Rusak? <span className="gradient-text">Bisa Ditunggu</span> &
              Bergaransi Toko
            </h1>
            <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Solusi cepat untuk ganti LCD pecah, ganti baterai kembung, port cas rusak,
              hingga mati total. Pengecekan gratis dan harga transparan di awal.
            </p>
          </div>
        </Reveal>

        {/* 3-Step Instant Estimator & Booking Wizard */}
        <div className="mt-10 sm:mt-14 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/5 p-5 sm:p-8 backdrop-blur-xl">
            {/* Step 1: Pilih Merek & Ketik Tipe HP */}
            <div className="border-b border-slate-100 pb-6 sm:pb-8">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-xl bg-brand-gradient text-xs font-black text-white shadow-sm shadow-royal-600/30">
                  1
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Pilih Merek & Ketik Model HP Anda
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bantu teknisi mengetahui jenis tipe unit yang akan diservis
                  </p>
                </div>
              </div>

              {/* Brand Selector Chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_BRANDS.map((brand) => {
                  const active = selectedBrand === brand;
                  return (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={cn(
                        "rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer active:scale-95",
                        active
                          ? "bg-brand-gradient text-white shadow-md shadow-royal-600/25 scale-[1.02]"
                          : "border border-slate-200/80 bg-slate-50/80 text-slate-700 hover:border-royal-300 hover:bg-royal-50/50",
                      )}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>

              {/* Model Input */}
              <div className="mt-4">
                <label
                  htmlFor="phone-model-input"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Tipe / Seri HP (Contoh: Redmi Note 12, Samsung A55, Infinix Note 30):
                </label>
                <input
                  id="phone-model-input"
                  type="text"
                  value={phoneModel}
                  onChange={(e) => setPhoneModel(e.target.value)}
                  placeholder="Ketik tipe HP Anda di sini..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-royal-400 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
                />
              </div>
            </div>

            {/* Step 2: Interactive Visual Damage Diagnostic */}
            <div className="py-6 sm:py-8 border-b border-slate-100">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-xl bg-brand-gradient text-xs font-black text-white shadow-sm shadow-royal-600/30">
                    2
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Pilih Gejala Kerusakan (Bisa Lebih dari Satu)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sentuh kartu kerusakan di bawah untuk melihat estimasi waktu & biaya
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-royal-50 px-3 py-1 text-xs font-extrabold text-royal-700 border border-royal-200/60">
                  {selectedDamages.length} kerusakan dipilih
                </span>
              </div>

              {/* Grid 6 Kartu Visual Kerusakan */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICE_DAMAGES.map((damage) => {
                  const isChecked = selectedDamages.includes(damage.id);
                  return (
                    <div
                      key={damage.id}
                      onClick={() => toggleDamage(damage.id)}
                      className={cn(
                        "group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 cursor-pointer select-none",
                        isChecked
                          ? "border-royal-500 bg-royal-50/40 shadow-md shadow-royal-600/10 ring-2 ring-royal-400/30 -translate-y-0.5"
                          : "border-slate-200/90 bg-white hover:border-royal-300 hover:bg-slate-50/60 hover:-translate-y-0.5",
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl">{damage.icon}</span>
                          <span
                            className={cn(
                              "flex size-5.5 items-center justify-center rounded-lg border transition-all",
                              isChecked
                                ? "bg-royal-600 border-royal-600 text-white"
                                : "border-slate-300 bg-white",
                            )}
                          >
                            {isChecked && (
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                            )}
                          </span>
                        </div>

                        <h4 className="mt-3 text-sm font-extrabold text-slate-900 leading-snug">
                          {damage.name}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                          {damage.subtitle}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-royal-700">
                          <Clock className="size-3" aria-hidden="true" />
                          {damage.estimatedMinutes}
                        </span>
                        <span className="font-extrabold text-emerald-700">
                          {damage.warrantyText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Realtime Estimator Banner */}
              <div className="mt-6 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50/80 via-white to-royal-50/70 p-4 sm:p-5 shadow-xs">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/30">
                    <Zap className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-slate-900">
                        Ringkasan Estimasi Service HP Anda
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                        Garansi Toko 14 - 30 Hari
                      </span>
                    </div>

                    <div className="mt-2.5 grid gap-2 sm:grid-cols-2 text-xs">
                      <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200/70">
                        <span className="text-slate-500 block">Estimasi Waktu:</span>
                        <strong className="text-royal-700 font-extrabold text-sm">
                          {estimatedTimeText}
                        </strong>
                      </div>
                      <div className="rounded-xl bg-white/90 p-2.5 border border-slate-200/70">
                        <span className="text-slate-500 block">Kisaran Biaya:</span>
                        <strong className="text-emerald-700 font-extrabold text-sm">
                          {selectedDamageItems.length > 0
                            ? selectedDamageItems[0].priceRangeText
                            : "Rp 150.000 - Rp 450.000"}
                        </strong>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-500 italic">
                      *Estimasi biaya akurat disesuaikan dengan ketersediaan tipe sparepart (Original / OEM) dan dikonfirmasi kepada Anda sebelum pengerjaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Pilih Metode Layanan & Booking WA */}
            <div className="pt-6 sm:pt-8">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-xl bg-brand-gradient text-xs font-black text-white shadow-sm shadow-royal-600/30">
                  3
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Pilih Rencana Layanan & Kirim ke WhatsApp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilih cara Anda ingin kami melayani servis HP Anda
                  </p>
                </div>
              </div>

              {/* Service Method Radio Cards */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label
                  onClick={() => setServiceMethod("datang-langsung")}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all",
                    serviceMethod === "datang-langsung"
                      ? "border-royal-500 bg-royal-50/50 ring-2 ring-royal-400/30"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name="service-method"
                    checked={serviceMethod === "datang-langsung"}
                    onChange={() => setServiceMethod("datang-langsung")}
                    className="mt-1 text-royal-600"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      📍 Datang Langsung ke Konter
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Jl. Raya Melikan Kendaga. Unit dicek langsung di meja servis, bisa ditonton santai.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setServiceMethod("tanya-stok-dulu")}
                  className={cn(
                    "flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition-all",
                    serviceMethod === "tanya-stok-dulu"
                      ? "border-royal-500 bg-royal-50/50 ring-2 ring-royal-400/30"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name="service-method"
                    checked={serviceMethod === "tanya-stok-dulu"}
                    onChange={() => setServiceMethod("tanya-stok-dulu")}
                    className="mt-1 text-royal-600"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900">
                      💬 Tanya Stok Sparepart & Estimasi Dulu
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Pastikan teknisi standby dan sparepart tersedia sebelum Anda berangkat ke toko.
                    </span>
                  </div>
                </label>
              </div>

              {/* Optional Name & Notes Inputs */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="service-customer-name"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Nama Anda (Opsional):
                  </label>
                  <input
                    id="service-customer-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Pak Budi"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="service-notes"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Catatan Tambahan (Opsional):
                  </label>
                  <input
                    id="service-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Jatuh dari motor, layar kedip-kedip"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-royal-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Large High-Conversion WhatsApp CTA Button */}
              <div className="mt-6">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleBookingClick}
                  className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-wa-gradient px-6 text-base sm:text-lg font-extrabold text-white shadow-xl shadow-emerald-600/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <MessageCircle className="size-6 shrink-0 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                  <span>Konsultasi & Booking Service via WhatsApp</span>
                  <ArrowRight className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </a>

                <p className="mt-3 text-center text-xs text-slate-500">
                  Respon cepat oleh teknisi resmi Konter Fajar Cell • Buka Setiap Hari 07.30 - 21.00 WIB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transparansi & Keunggulan SOP Teknisi (Amanah & Terpercaya untuk Segala Usia) */}
        <div className="mt-16 sm:mt-22">
          <SectionHeading
            eyebrow="SOP & Transparansi"
            title="4 Alasan Pelanggan Nyaman Servis di Sini"
            description="Tidak perlu khawatir dibohongi atau data hilang. Kami bekerja transparan dengan nota resmi."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_WORKFLOW.map((item) => (
              <div
                key={item.step}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-royal-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-mono text-xs font-black text-slate-400">
                      STEP {item.step}
                    </span>
                  </div>
                  <h4 className="mt-4 text-base font-extrabold text-slate-900 leading-snug">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Service FAQ Accordion */}
        <div className="mt-16 sm:mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Pertanyaan yang Sering Diajukan
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Informasi lengkap seputar garansi, keamanan data, dan waktu pengerjaan
            </p>
          </div>

          <div className="space-y-3">
            {SERVICE_FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 transition-all duration-200 open:border-royal-300 open:shadow-xs"
              >
                <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900 text-sm sm:text-base list-none">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-royal-600 shrink-0" aria-hidden="true" />
                    {faq.q}
                  </span>
                  <span className="ml-2 text-slate-400 transition-transform duration-200 group-open:rotate-180">
                    ▾
                  </span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 pl-6 border-t border-slate-100 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
