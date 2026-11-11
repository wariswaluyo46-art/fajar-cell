"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { defaultStoreSettings } from "@/lib/store";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const PERKS = [
  {
    icon: Clock,
    title: "Bisa Ditunggu",
    desc: "Ganti LCD & baterai mulai 45 menit",
  },
  {
    icon: Sparkles,
    title: "Cek Kerusakan Gratis",
    desc: "Tanpa biaya bila tidak jadi servis",
  },
  {
    icon: ShieldCheck,
    title: "Garansi Toko 30 Hari",
    desc: "Sparepart teruji & nota resmi",
  },
];

export function ServicePreviewBanner() {
  const store = defaultStoreSettings;
  const waConsultUrl = buildWhatsAppUrl(
    store.whatsappNumber,
    "Halo Teknisi Konter Fajar Cell, saya mau tanya konsultasi & estimasi biaya perbaikan HP saya. Apakah bisa dicek?",
  );

  return (
    <section className="relative overflow-hidden py-12 sm:py-16">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-royal-200/60 bg-gradient-to-br from-royal-900 via-royal-950 to-slate-950 p-7 text-white shadow-2xl shadow-royal-950/20 sm:p-12">
            {/* Background glowing gradients */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-cyan-500/15 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-royal-500/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12 lg:items-center">
              {/* Left Column: Copy & CTAs */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md">
                  <Wrench className="size-3.5 text-cyan-400" />
                  <span>Pusat Service & Reparasi HP Banjarnegara</span>
                </div>

                <h2 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-4xl sm:leading-tight">
                  Layar Pecah, Baterai Drop, atau HP Mati?{" "}
                  <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    Bisa Ditunggu Mulai 45 Menit!
                  </span>
                </h2>

                <p className="mt-3 text-sm text-slate-300 sm:text-base sm:leading-relaxed">
                  Teknisi berpengalaman dengan alat diagnostik modern. Pengecekan
                  100% transparan, konfirmasi harga di awal tanpa biaya siluman,
                  dan disertai garansi toko resmi.
                </p>

                {/* Perks grid */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {PERKS.map((perk) => {
                    const Icon = perk.icon;
                    return (
                      <div
                        key={perk.title}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {perk.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {perk.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/service"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-royal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-royal-500 hover:shadow-cyan-500/35 active:scale-95"
                  >
                    <span>Cek Estimasi Biaya Kerusakan</span>
                    <ArrowRight className="size-4" />
                  </Link>

                  <a
                    href={waConsultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-3.5 text-sm font-semibold text-emerald-300 backdrop-blur-md transition-all duration-200 hover:bg-emerald-500/30 active:scale-95"
                  >
                    <MessageCircle className="size-4 text-emerald-400" />
                    <span>Chat Teknisi Langsung</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Visual Repair Diagnostics Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl sm:p-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="size-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Meja Servis Siap Terima Unit
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-400/20">
                      Buka 07.30 - 21.00
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {[
                      {
                        label: "Ganti LCD / Touchscreen",
                        time: "45 - 90 Menit",
                        tag: "Bisa Ditunggu",
                        color: "emerald",
                      },
                      {
                        label: "Ganti Baterai Drop / Kembung",
                        time: "30 - 60 Menit",
                        tag: "Ready Stock",
                        color: "cyan",
                      },
                      {
                        label: "Perbaikan Konektor Cas",
                        time: "30 - 45 Menit",
                        tag: "Express",
                        color: "amber",
                      },
                      {
                        label: "Pembersihan Masuk Air (Water Damage)",
                        time: "1 - 3 Jam",
                        tag: "Chemical Wash",
                        color: "blue",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                          <span className="font-medium text-slate-200">
                            {item.label}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-cyan-300">
                            {item.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center">
                    <p className="text-xs text-emerald-200 font-medium">
                      🎯 Tidak tahu jenis kerusakannya? Jangan ragu bawa ke konter kami, teknisi kami cek gratis di depan Anda!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
