import { AtSign, Clock, Lock, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { NAV_ITEMS, SITE } from "@/lib/constants";
import { defaultStoreSettings } from "@/lib/store";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";

export function Footer() {
  const store = defaultStoreSettings;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-slate-300 border-t border-white/10">
      {/* Ambient glow decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-1/4 size-72 rounded-full bg-royal-600/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 size-64 rounded-full bg-cyan-600/10 blur-3xl"
      />

      <Container className="relative py-14 pb-24 sm:py-18 sm:pb-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-sm font-extrabold text-white shadow-md shadow-royal-600/30">
                FC
              </span>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Konter Fajar Cell
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Pusat HP bekas bergaransi, HP baru, dan aksesoris original. Unit
              dicek teknisi, harga transparan, dan siap COD di sekitar kota.
            </p>
            <WhatsAppLink
              href={buildGeneralInquiryUrl()}
              size="md"
              className="mt-6"
            >
              Chat Admin WA
            </WhatsAppLink>
          </div>

          <nav aria-label="Navigasi footer">
            <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Menu Navigasi
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href.startsWith("#") ? `/${item.href}` : item.href}
                    className="font-medium text-slate-300 transition-colors duration-200 hover:text-white hover:translate-x-0.5 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
              Kontak Toko
            </h2>
            <ul className="mt-4 space-y-3.5 text-sm">
              <li>
                <a
                  href={buildGeneralInquiryUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2.5 font-medium transition-colors duration-200 hover:text-white"
                >
                  <MessageCircle
                    className="mt-0.5 size-4 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                  {store.displayPhone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-cyan-400"
                  aria-hidden="true"
                />
                <span className="leading-relaxed text-slate-300">{store.address}</span>
              </li>
              {store.instagram && (
                <li>
                  <a
                    href={`https://instagram.com/${store.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 font-medium transition-colors duration-200 hover:text-white"
                  >
                    <AtSign
                      className="size-4 shrink-0 text-cyan-400"
                      aria-hidden="true"
                    />
                    {store.instagram}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h2 className="flex items-center gap-2 text-xs font-bold tracking-widest text-cyan-400 uppercase">
              <Clock className="size-3.5 text-cyan-400" aria-hidden="true" />
              Jam Operasional
            </h2>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-300">Buka Setiap Hari</span>
              </div>
              <p className="mt-2 text-sm font-extrabold text-white">
                Setiap Hari : 07.30 - 21.00
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                Siap melayani transaksi di konter atau janji temu COD wilayah Banjarnegara.
              </p>
            </div>
          </div>
        </div>

        {/* Baris paling bawah: Copyright, COD, dan Link Login Admin yang tersamar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {SITE.name}. Semua hak dilindungi.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-slate-400 font-medium">
              Area COD: <span className="text-slate-200">{store.codAreas.join(", ")}</span>
            </span>
            {/* Login Admin tersamar dengan opasitas rendah dan icon gembok */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500/40 transition-colors duration-200 hover:text-slate-300"
              title="Portal Khusus Petugas Toko"
              aria-label="Login Petugas Toko"
            >
              <Lock className="size-3" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
