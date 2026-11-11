"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Jeda animasi dalam milidetik. */
  delay?: number;
}

/**
 * Fade-in + slide-up saat elemen masuk viewport.
 *
 * SSR merender elemen dalam keadaan terlihat agar konten tetap tampil tanpa
 * JavaScript. Setelah mount, elemen yang masih di bawah viewport diberi state
 * "hidden" lewat data attribute, lalu IntersectionObserver mengubahnya menjadi
 * "visible". Hanya transform dan opacity yang dianimasikan supaya tidak memicu
 * layout shift.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") return;

    if (node.getBoundingClientRect().top <= window.innerHeight - 80) return;

    node.dataset.revealState = "hidden";

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        node.dataset.revealState = "visible";
        observer.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      delete node.dataset.revealState;
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
      className={cn("reveal", className)}
    >
      {children}
    </div>
  );
}
