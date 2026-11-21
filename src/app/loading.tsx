import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman Konter Fajar Cell"
      className="min-h-dvh bg-[#F8FAFC]"
    >
      <span className="sr-only">Memuat konten halaman...</span>

      {/* Topbar & Navbar skeleton */}
      <div className="h-8 bg-royal-950/90" />
      <Container className="pt-4">
        <div className="h-16 w-full animate-pulse rounded-3xl border border-slate-200/80 bg-white/90 motion-reduce:animate-none" />
      </Container>

      {/* Hero skeleton */}
      <Container className="py-12 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="h-7 w-52 animate-pulse rounded-full bg-royal-100 motion-reduce:animate-none" />
            <div className="h-12 w-full max-w-lg animate-pulse rounded-2xl bg-slate-200/90 motion-reduce:animate-none" />
            <div className="h-12 w-4/5 max-w-md animate-pulse rounded-2xl bg-slate-200/80 motion-reduce:animate-none" />
            <div className="h-20 w-full max-w-xl animate-pulse rounded-2xl bg-slate-200/60 motion-reduce:animate-none" />
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="h-12 w-44 animate-pulse rounded-xl bg-royal-200 motion-reduce:animate-none" />
              <div className="h-12 w-40 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
            </div>
          </div>

          <div className="mx-auto aspect-square w-full max-w-sm animate-pulse rounded-3xl border border-slate-200 bg-white p-4 motion-reduce:animate-none" />
        </div>

        {/* Catalog grid skeleton */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4 motion-reduce:animate-none"
            >
              <div className="aspect-square w-full rounded-xl bg-slate-100" />
              <div className="mt-4 h-3 w-16 rounded bg-slate-200" />
              <div className="mt-2 h-5 w-4/5 rounded bg-slate-200" />
              <div className="mt-6 h-6 w-28 rounded bg-royal-100" />
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
