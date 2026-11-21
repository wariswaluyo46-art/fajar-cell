import { ArrowLeft, SearchX, Wrench } from "lucide-react";
import Link from "next/link";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="mesh-gradient-light flex min-h-[70dvh] items-center py-16 sm:py-24 focus:outline-none"
      >
        <Container>
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200/90 bg-white/95 p-8 text-center shadow-xl shadow-slate-900/5 sm:p-12">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-royal-50 text-royal-700 shadow-inner">
              <SearchX className="size-8" aria-hidden="true" />
            </span>

            <p className="mt-5 inline-flex items-center rounded-full border border-royal-200 bg-royal-50 px-3 py-1 text-xs font-extrabold tracking-wider text-royal-700 uppercase">
              Error 404
            </p>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Halaman Tidak Ditemukan
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              Maaf, halaman yang Anda cari mungkin sudah dipindahkan, unit sudah
              terjual, atau alamat tautannya keliru. Silakan pilih menu di bawah
              untuk melanjutkan belanja atau konsultasi.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali ke Katalog HP
              </Link>

              <Link
                href="/service"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-royal-200 bg-white px-5 py-3 text-sm font-bold text-royal-700 transition hover:border-royal-400 hover:bg-royal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
              >
                <Wrench className="size-4" aria-hidden="true" />
                Layanan Service HP
              </Link>

              <WhatsAppLink
                href={buildGeneralInquiryUrl()}
                size="lg"
                variant="outline"
                className="min-h-12"
              >
                Chat Admin WhatsApp
              </WhatsAppLink>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
