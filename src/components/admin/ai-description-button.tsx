"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/components/ui/toast-provider";
import type {
  AiDescriptionRequest,
  ProductFormValues,
} from "@/types";

interface AiDescriptionButtonProps {
  values: ProductFormValues;
  disabled?: boolean;
  onGenerated: (description: string) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readError(value: unknown): string | null {
  if (
    isRecord(value) &&
    typeof value.error === "string" &&
    value.error.trim() !== ""
  ) {
    return value.error;
  }

  return null;
}

function readDescription(value: unknown): string | null {
  if (!isRecord(value) || value.success !== true) return null;

  const description =
    typeof value.description === "string" ? value.description.trim() : "";

  return description === "" ? null : description;
}

function parsePositiveNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseList(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");

  return items.length > 0 ? items : undefined;
}

function buildRequest(values: ProductFormValues): AiDescriptionRequest {
  const isPhone = values.category !== "aksesoris";
  const isUsed = values.category === "handphone-bekas";

  const request: AiDescriptionRequest = {
    name: values.name.trim(),
    category: values.category,
    brand: values.brand,
  };

  const price = parsePositiveNumber(values.price);
  if (price !== undefined) request.price = price;

  if (isPhone) {
    const color = values.color.trim();
    if (color !== "") request.color = color;

    request.specs = {
      ram: parsePositiveNumber(values.ram),
      storage: parsePositiveNumber(values.storage),
    };

    request.warranty = {
      active: values.warrantyActive,
      durationDays: parsePositiveNumber(values.warrantyDurationDays),
      description: values.warrantyDescription.trim() || undefined,
    };

    if (isUsed) {
      request.condition = {
        grade: values.conditionGrade.trim() || undefined,
        label: values.conditionLabel.trim() || undefined,
        minusCount: parsePositiveNumber(values.minusCount),
        batteryHealth: parsePositiveNumber(values.batteryHealth),
        completeness: parseList(values.completeness),
      };
    }
  } else {
    request.accessoryType = values.accessoryType;
    request.compatibleWith = parseList(values.compatibleWith);
  }

  return request;
}

/**
 * Tombol kecil di form produk admin untuk membuat deskripsi lewat Gemini.
 * Hasilnya hanya dimasukkan ke textarea; admin tetap harus memeriksa dan
 * menyimpan sendiri.
 */
export function AiDescriptionButton({
  values,
  disabled,
  onGenerated,
}: AiDescriptionButtonProps) {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleClick() {
    if (isGenerating) return;

    if (values.name.trim().length < 2) {
      showToast({
        variant: "error",
        title: "Isi nama produk dulu",
        description:
          "AI membutuhkan nama produk agar deskripsi yang dibuat relevan.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/ai/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRequest(values)),
        cache: "no-store",
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const unauthorized = response.status === 401;
        showToast({
          variant: "error",
          title: unauthorized
            ? "Sesi admin berakhir"
            : "AI gagal menulis deskripsi",
          description:
            readError(data) ??
            (unauthorized
              ? "Silakan login ulang untuk memakai fitur AI."
              : "Coba lagi beberapa saat lagi."),
        });
        return;
      }

      const description = readDescription(data);
      if (!description) {
        showToast({
          variant: "error",
          title: "Balasan AI tidak valid",
          description: "Coba lagi beberapa saat lagi.",
        });
        return;
      }

      onGenerated(description);
      showToast({
        variant: "success",
        title: "Deskripsi dibuat AI",
        description:
          "Periksa dan sesuaikan isinya sebelum menyimpan produk.",
      });
    } catch {
      showToast({
        variant: "error",
        title: "Tidak dapat menghubungi AI",
        description: "Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isGenerating}
      aria-busy={isGenerating}
      className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[11px] font-bold text-royal-700 transition hover:bg-royal-50 hover:text-royal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? (
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Sparkles className="size-3.5" aria-hidden="true" />
      )}
      {isGenerating ? "Menulis..." : "Tulis dengan AI"}
    </button>
  );
}
