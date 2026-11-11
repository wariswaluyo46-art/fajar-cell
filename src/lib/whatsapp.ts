import type { Product, ServiceBookingInput, TradeInInput } from "@/types";
import { SERVICE_DAMAGES } from "@/types/service";
import {
  SITE,
  TRADE_IN_COMPLETENESS_LABELS,
  TRADE_IN_CONDITION_LABELS,
} from "./constants";
import { formatRupiah } from "./utils";

/**
 * Normalisasi nomor telepon ke format internasional tanpa "+".
 * "0812-3456-7890" -> "6281234567890"
 * "+62 812 3456 7890" -> "6281234567890"
 */
export function normalizePhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("620")) return `62${digits.slice(3)}`;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;

  return digits;
}

/** Bangun URL wa.me dengan pesan yang sudah di-encode. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const number = normalizePhoneNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildProductInquiryMessage(product: Product): string {
  const lines = [
    `Halo ${SITE.name}, saya mau tanya unit ini:`,
    "",
    `📱 ${product.name}`,
    `💰 ${formatRupiah(product.price)}`,
  ];

  if (product.category === "handphone-bekas") {
    lines.push(
      `✅ Kondisi: ${product.condition.grade} - ${product.condition.label}`,
    );
  }

  lines.push(
    `🔖 Status: ${product.status === "ready" ? "Ready Stock" : "Sold Out"}`,
    "",
    "Apakah unit ini masih tersedia? Mohon info kelengkapan dan garansinya.",
  );

  return lines.join("\n");
}

export function buildProductInquiryUrl(product: Product): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    buildProductInquiryMessage(product),
  );
}

export function buildTradeInMessage(input: TradeInInput): string {
  const lines = [
    `Halo ${SITE.name}, saya ingin tukar tambah / jual HP:`,
    "",
    `📱 Merek: ${input.brand}`,
    `📝 Tipe: ${input.model}`,
    `✨ Kondisi: ${TRADE_IN_CONDITION_LABELS[input.condition]}`,
    `📦 Kelengkapan: ${TRADE_IN_COMPLETENESS_LABELS[input.completeness]}`,
  ];

  if (input.notes?.trim()) {
    lines.push(`🗒️ Catatan: ${input.notes.trim()}`);
  }

  if (input.customerName?.trim()) {
    lines.push(`🙋 Nama: ${input.customerName.trim()}`);
  }

  lines.push("", "Mohon estimasi harga terbaiknya. Terima kasih!");

  return lines.join("\n");
}

export function buildTradeInUrl(input: TradeInInput): string {
  return buildWhatsAppUrl(SITE.whatsappNumber, buildTradeInMessage(input));
}

export function buildServiceInquiryMessage(input: ServiceBookingInput): string {
  const damageItems = SERVICE_DAMAGES.filter((d) =>
    input.damages.includes(d.id),
  );
  const damageNames =
    damageItems.length > 0
      ? damageItems.map((d) => `• ${d.name}`).join("\n")
      : "• Belum spesifik (Konsultasi kerusakan)";

  const methodText =
    input.method === "datang-langsung"
      ? "Datang Langsung ke Konter (Jl. Raya Melikan Kendaga)"
      : "Tanya Ketersediaan Sparepart & Estimasi Dulu";

  const lines = [
    `Halo ${SITE.name}, saya ingin konsultasi / booking service HP:`,
    "",
    `📱 Merek & Tipe: ${input.brand} ${input.model}`.trim(),
    "🛠️ Keluhan Kerusakan:",
    damageNames,
    "",
    `📍 Rencana Kunjungan: ${methodText}`,
  ];

  if (input.customerName?.trim()) {
    lines.push(`🙋 Nama Pelanggan: ${input.customerName.trim()}`);
  }

  if (input.notes?.trim()) {
    lines.push(`📝 Catatan Tambahan: ${input.notes.trim()}`);
  }

  lines.push(
    "",
    "Apakah teknisi sedang standby dan sparepart untuk unit ini tersedia? Mohon info estimasi biaya dan waktu pengerjaannya. Terima kasih!",
  );

  return lines.join("\n");
}

export function buildServiceInquiryUrl(input: ServiceBookingInput): string {
  return buildWhatsAppUrl(SITE.whatsappNumber, buildServiceInquiryMessage(input));
}

/** Pesan umum untuk tombol "Chat Admin WA" di header. */
export function buildGeneralInquiryUrl(): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    `Halo ${SITE.name}, saya ingin bertanya tentang produk yang tersedia.`,
  );
}
