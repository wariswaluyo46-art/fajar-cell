import { Clock, MapPin, Navigation, Truck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { SITE } from "@/lib/constants";
import { defaultStoreSettings } from "@/lib/store";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";

export function LocationSection() {
  const store = defaultStoreSettings;

  return (
    <section
      id="lokasi"
      className="relative scroll-mt-24 sm:scroll-mt-28 overflow-hidden bg-white py-18 sm:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -left-20 size-80 -translate-y-1/2 rounded-full bg-royal-100/30 blur-3xl"
      />

      <Container className="relative">
        <Reveal>
          <SectionHeading
            eyebrow="Lokasi & Kontak"
            title="Mampir ke toko, atau minta COD"
            description="Cek unit langsung, pasang aksesoris, atau minta diantar. Hubungi admin dulu supaya unit yang kamu incar disiapkan."
          />
        </Reveal>

        <Reveal delay={100} className="mt-10">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4.5">
              {/* Kartu Alamat Toko */}
              <div className="group rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-royal-50/15 to-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-royal-300/60 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-royal-600/30 transition-transform duration-300 group-hover:scale-105">
                    <MapPin className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Alamat Toko
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {store.address}
                    </p>
                    {store.plusCode && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        <span className="text-slate-400 font-normal">Plus Code:</span>
                        <span className="font-mono text-royal-700 font-bold">{store.plusCode}</span>
                      </div>
                    )}
                    <div className="mt-4">
                      <a
                        href={store.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-royal-50 px-3.5 py-2 text-xs font-bold text-royal-700 transition-all duration-200 hover:bg-royal-100 hover:text-royal-800"
                      >
                        <Navigation className="size-3.5 text-cyan-600" aria-hidden="true" />
                        Buka di Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kartu Jam Operasional */}
              <div className="group rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-royal-300/60 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-100 to-royal-50 text-royal-700 transition-transform duration-300 group-hover:scale-105">
                    <Clock className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Jam Operasional
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Buka Setiap Hari
                      </span>
                    </div>
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                      <p className="text-base font-extrabold text-slate-900">
                        Setiap Hari : 07.30 - 21.00
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Melayani pembelian HP, konsultasi tukar tambah, pasang aksesoris, & janji temu COD.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kartu Area COD */}
              <div className="group rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-royal-300/60 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 transition-transform duration-300 group-hover:scale-105">
                    <Truck className="size-6" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Area COD
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {store.codAreas.map((area) => (
                        <span
                          key={area}
                          className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                    <WhatsAppLink
                      href={buildGeneralInquiryUrl()}
                      size="sm"
                      variant="outline"
                      className="mt-4 w-fit"
                    >
                      Tanya jangkauan COD
                    </WhatsAppLink>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Container */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-100 shadow-lg shadow-slate-200/50">
              <iframe
                src={store.mapsEmbedUrl}
                title={`Peta lokasi ${SITE.name}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="h-84 w-full border-0 sm:h-full sm:min-h-[480px]"
              />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
