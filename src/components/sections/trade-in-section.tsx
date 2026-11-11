"use client";

import {
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { useState, type FormEvent } from "react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { useToast } from "@/components/ui/toast-provider";
import { PHONE_BRANDS, TRADE_IN_COMPLETENESS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buildTradeInUrl } from "@/lib/whatsapp";
import type {
  Brand,
  CompletenessOption,
  TradeInConditionGrade,
  TradeInInput,
} from "@/types";

const CONDITION_OPTIONS: {
  value: TradeInConditionGrade;
  label: string;
  hint: string;
}[] = [
  { value: "mulus", label: "Mulus", hint: "95-100%, tanpa minus" },
  { value: "lecet-ringan", label: "Lecet ringan", hint: "Ada baret halus" },
  { value: "lecet-berat", label: "Lecet berat", hint: "Penyok / retak / minus" },
];

interface FormState {
  brand: Brand | "";
  model: string;
  condition: TradeInConditionGrade | "";
  completeness: CompletenessOption | "";
  customerName: string;
  notes: string;
}

type FieldErrors = Partial<
  Record<"brand" | "model" | "condition" | "completeness", string>
>;

const INITIAL_FORM: FormState = {
  brand: "",
  model: "",
  condition: "",
  completeness: "",
  customerName: "",
  notes: "",
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10";

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.brand) errors.brand = "Pilih merek HP lama kamu.";
  if (form.model.trim().length < 2) {
    errors.model = "Tulis tipe HP minimal 2 karakter.";
  }
  if (!form.condition) errors.condition = "Pilih kondisi fisik HP.";
  if (!form.completeness) {
    errors.completeness = "Pilih kelengkapan yang kamu punya.";
  }

  return errors;
}

const STEPS = [
  {
    title: "Isi data HP lama",
    description: "Merek, tipe, kondisi fisik, dan kelengkapannya.",
  },
  {
    title: "Kirim via WhatsApp",
    description: "Data otomatis tersusun rapi, tidak perlu ketik ulang.",
  },
  {
    title: "Cek fisik & terima harga",
    description: "Bawa unit ke toko, harga final langsung ditawarkan.",
  },
];

const PERKS = [
  { icon: Wallet, label: "Gratis penilaian" },
  { icon: ShieldCheck, label: "Transparan & aman" },
  { icon: Zap, label: "Respon cepat" },
];

export function TradeInSection() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  function updateField<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setSubmitted(false);
    setErrors((previous) => {
      const next = { ...previous };
      delete next[key as keyof FieldErrors];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    const payload: TradeInInput = {
      brand: form.brand as Brand,
      model: form.model.trim(),
      condition: form.condition as TradeInConditionGrade,
      completeness: form.completeness as CompletenessOption,
      customerName: form.customerName.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    window.open(buildTradeInUrl(payload), "_blank", "noopener,noreferrer");
    setSubmitted(true);
    showToast({
      variant: "info",
      title: "Mengarahkan ke WhatsApp...",
      description: "Ringkasan tukar tambah kamu sudah disiapkan.",
    });
  }

  return (
    <section
      id="tukar-tambah"
      className="relative scroll-mt-24 sm:scroll-mt-28 overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] py-18 text-white sm:py-24"
    >
      {/* Ambient luxury tech background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 size-[500px] rounded-full bg-gradient-to-b from-royal-600/25 to-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 size-[450px] rounded-full bg-gradient-to-tr from-emerald-500/15 to-royal-600/15 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-royal-400/30 bg-royal-900/40 px-3.5 py-1.5 text-xs font-bold tracking-widest text-cyan-300 uppercase backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse-dot" aria-hidden="true" />
                Tukar Tambah
              </div>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
                HP lama jadi tambahan budget{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                  HP baru
                </span>
              </h2>

              <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300">
                Jual atau tukar HP lama kamu di Konter Fajar Cell. Isi form
                singkat, kirim ke WhatsApp admin, dan dapatkan estimasi harga
                awal tanpa harus datang dulu.
              </p>

              <ol className="mt-8 space-y-4">
                {STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 backdrop-blur-xs transition-colors hover:bg-white/[0.06]"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-royal-500 to-cyan-500 text-sm font-extrabold text-white shadow-md shadow-royal-500/30">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <ul className="mt-8 flex flex-wrap gap-2.5">
                {PERKS.map((perk) => (
                  <li
                    key={perk.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-xs"
                  >
                    <perk.icon className="size-3.5 text-cyan-400" aria-hidden="true" />
                    {perk.label}
                  </li>
                ))}
              </ul>

              <p className="mt-6 max-w-md text-xs leading-relaxed text-slate-400">
                Estimasi awal diberikan berdasarkan data yang kamu isi. Harga
                final ditentukan setelah pengecekan fisik unit di toko.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative rounded-3xl border border-white/20 bg-white p-6 text-slate-900 shadow-2xl shadow-indigo-950/60 sm:p-8 backdrop-blur-lg">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                    Cek estimasi harga
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Gratis, tanpa kewajiban membeli.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" aria-hidden="true" />
                  Via WhatsApp
                </span>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6">
                <div className="grid gap-4.5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="trade-in-brand"
                      className="text-xs font-bold tracking-wide text-slate-700 uppercase"
                    >
                      Merek HP <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="trade-in-brand"
                      value={form.brand}
                      onChange={(event) =>
                        updateField("brand", event.target.value as Brand | "")
                      }
                      aria-invalid={Boolean(errors.brand)}
                      aria-describedby={errors.brand ? "error-brand" : undefined}
                      className={cn(
                        inputClass,
                        "mt-1.5 cursor-pointer font-medium",
                        errors.brand && "border-rose-400 focus:ring-rose-100",
                      )}
                    >
                      <option value="">Pilih merek</option>
                      {PHONE_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                    {errors.brand && (
                      <p id="error-brand" className="mt-1.5 text-xs font-semibold text-rose-600">
                        {errors.brand}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="trade-in-model"
                      className="text-xs font-bold tracking-wide text-slate-700 uppercase"
                    >
                      Tipe HP <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="trade-in-model"
                      type="text"
                      value={form.model}
                      onChange={(event) => updateField("model", event.target.value)}
                      placeholder="Contoh: Samsung Galaxy A52s 128GB"
                      aria-invalid={Boolean(errors.model)}
                      aria-describedby={errors.model ? "error-model" : undefined}
                      className={cn(
                        inputClass,
                        "mt-1.5 font-medium",
                        errors.model && "border-rose-400 focus:ring-rose-100",
                      )}
                    />
                    {errors.model && (
                      <p id="error-model" className="mt-1.5 text-xs font-semibold text-rose-600">
                        {errors.model}
                      </p>
                    )}
                  </div>

                  <fieldset className="sm:col-span-2">
                    <legend className="text-xs font-bold tracking-wide text-slate-700 uppercase">
                      Kondisi fisik <span className="text-rose-500">*</span>
                    </legend>
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                      {CONDITION_OPTIONS.map((option) => {
                        const active = form.condition === option.value;
                        return (
                          <label
                            key={option.value}
                            className={cn(
                              "cursor-pointer rounded-2xl border p-3.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-royal-300",
                              active
                                ? "border-royal-600 bg-royal-50/80 ring-2 ring-royal-500/20 scale-[1.02] shadow-xs"
                                : "border-slate-200 hover:border-royal-300 hover:bg-slate-50/60",
                            )}
                          >
                            <input
                              type="radio"
                              name="trade-in-condition"
                              value={option.value}
                              checked={active}
                              onChange={() =>
                                updateField("condition", option.value)
                              }
                              className="sr-only"
                            />
                            <span className={cn(
                              "block text-sm font-bold",
                              active ? "text-royal-800" : "text-slate-900"
                            )}>
                              {option.label}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                              {option.hint}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {errors.condition && (
                      <p
                        id="error-condition"
                        className="mt-1.5 text-xs font-semibold text-rose-600"
                      >
                        {errors.condition}
                      </p>
                    )}
                  </fieldset>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="trade-in-completeness"
                      className="text-xs font-bold tracking-wide text-slate-700 uppercase"
                    >
                      Kelengkapan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="trade-in-completeness"
                      value={form.completeness}
                      onChange={(event) =>
                        updateField(
                          "completeness",
                          event.target.value as CompletenessOption | "",
                        )
                      }
                      aria-invalid={Boolean(errors.completeness)}
                      aria-describedby={
                        errors.completeness ? "error-completeness" : undefined
                      }
                      className={cn(
                        inputClass,
                        "mt-1.5 cursor-pointer font-medium",
                        errors.completeness &&
                          "border-rose-400 focus:ring-rose-100",
                      )}
                    >
                      <option value="">Pilih kelengkapan</option>
                      {Object.entries(TRADE_IN_COMPLETENESS_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                    {errors.completeness && (
                      <p
                        id="error-completeness"
                        className="mt-1.5 text-xs font-semibold text-rose-600"
                      >
                        {errors.completeness}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="trade-in-name"
                      className="text-xs font-bold tracking-wide text-slate-700 uppercase"
                    >
                      Nama kamu{" "}
                      <span className="font-normal text-slate-500 lowercase">(opsional)</span>
                    </label>
                    <input
                      id="trade-in-name"
                      type="text"
                      value={form.customerName}
                      onChange={(event) =>
                        updateField("customerName", event.target.value)
                      }
                      placeholder="Nama panggilan"
                      className={cn(inputClass, "mt-1.5 font-medium")}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="trade-in-notes"
                      className="text-xs font-bold tracking-wide text-slate-700 uppercase"
                    >
                      Catatan{" "}
                      <span className="font-normal text-slate-500 lowercase">(opsional)</span>
                    </label>
                    <textarea
                      id="trade-in-notes"
                      rows={2}
                      value={form.notes}
                      onChange={(event) =>
                        updateField("notes", event.target.value)
                      }
                      placeholder="Contoh: baterai cepat habis, pernah ganti layar"
                      className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-royal-500 focus:bg-white focus:ring-4 focus:ring-royal-500/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-wa-gradient px-5 text-base font-bold text-white shadow-md shadow-emerald-600/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 cursor-pointer"
                >
                  <MessageCircle className="size-5" aria-hidden="true" />
                  Cek Estimasi via WhatsApp
                </button>

                <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
                  Kamu akan diarahkan ke WhatsApp dengan ringkasan data di atas.
                </p>

                {submitted && (
                  <p
                    role="status"
                    className="mt-4 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs leading-relaxed font-medium text-emerald-800"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    WhatsApp dibuka di tab baru. Kirim pesannya agar admin bisa
                    menghitung estimasi harga HP kamu.
                  </p>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
