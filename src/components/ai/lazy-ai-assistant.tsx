"use client";

import dynamic from "next/dynamic";

const AiAssistant = dynamic(
  () => import("./ai-assistant").then((module) => module.AiAssistant),
  { ssr: false },
);

/** Lazy wrapper agar bundle Fajar AI tidak membebani initial JS load halaman. */
export function LazyAiAssistant() {
  return <AiAssistant />;
}
