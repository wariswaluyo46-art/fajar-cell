"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/ui/container";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { buildGeneralInquiryUrl } from "@/lib/whatsapp";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hanya catat kode ringkas di log; jangan pernah tampilkan stack trace ke pembeli.
    console.error("[app-error]", error.digest ?? "unexpected");
  }, [error.digest]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mesh-gradient-light flex min-h-dvh items-center py-16 focus:outline-none"
    >
      <Container>
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-3xl border border-rose-200/80 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-11"
        >
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="size-8" aria-hidden="true" />
          </span>

          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Terjadi Gangguan Sementara
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Mohon maaf, halaman mengalami gangguan sementara. Data stok toko
            tetap aman — silakan muat ulang halaman atau hubungi admin lewat
            WhatsApp jika butuh bantuan cepat.
          </p>

          {error.digest && (
            <p className="mt-4 inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-slate-600">
              Kode Referensi: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 text-sm font-bold text-white shadow-md shadow-royal-600/25 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Coba Muat Ulang
            </button>

            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-royal-300 hover:bg-royal-50 hover:text-royal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600"
            >
              <Home className="size-4" aria-hidden="true" />
              Kembali ke Beranda
            </Link>

            <WhatsAppLink
              href={buildGeneralInquiryUrl()}
              size="lg"
              variant="outline"
              className="min-h-12"
            >
              Hubungi Admin WA
            </WhatsAppLink>
          </div>
        </div>
      </Container>
    </main>
  );
}
