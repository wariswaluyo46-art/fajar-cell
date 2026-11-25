import type {
  CartItem,
  Order,
  Product,
  ServiceBookingInput,
  ServiceTicket,
  TradeInInput,
} from "@/types";
import { SERVICE_DAMAGES } from "@/types/service";
import {
  SITE,
  TRADE_IN_COMPLETENESS_LABELS,
  TRADE_IN_CONDITION_LABELS,
} from "./constants";
import {
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  SERVICE_TICKET_STATUS_LABELS,
} from "./order-constants";
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

export function buildServiceInquiryMessage(
  input: ServiceBookingInput,
  ticketCode?: string,
): string {
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
    ...(ticketCode ? [`🎫 Kode Tiket Servis: *${ticketCode}*`] : []),
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

export function buildServiceInquiryUrl(
  input: ServiceBookingInput,
  ticketCode?: string,
): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    buildServiceInquiryMessage(input, ticketCode),
  );
}

/** Pesan umum untuk tombol "Chat Admin WA" di header. */
export function buildGeneralInquiryUrl(): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    `Halo ${SITE.name}, saya ingin bertanya tentang produk yang tersedia.`,
  );
}

export function buildCodInquiryMessage(): string {
  return [
    `Halo ${SITE.name}, saya ingin menanyakan jangkauan layanan COD (Cash on Delivery).`,
    "",
    "Lokasi saya di area: [isi nama desa / kecamatan Anda]",
    "",
    "Apakah lokasi tersebut masuk area COD (Banjarmangu, Banjarnegara Kota, Wanadadi, Madukara, atau sekitarnya) dan berapa estimasi ongkirnya? Terima kasih!",
  ].join("\n");
}

export function buildCodInquiryUrl(): string {
  return buildWhatsAppUrl(SITE.whatsappNumber, buildCodInquiryMessage());
}

export function buildCartInquiryMessage(
  items: CartItem[],
  subtotal: number,
): string {
  const lines = [
    `Halo ${SITE.name}, saya ingin menanyakan isi keranjang belanja saya:`,
    "",
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.quantity}x ${formatRupiah(item.unitPrice)})`,
    );
  });

  lines.push(
    "",
    `💰 Subtotal: ${formatRupiah(subtotal)}`,
    "",
    "Apakah semua unit di atas siap untuk diproses COD / ambil di konter?",
  );

  return lines.join("\n");
}

export function buildCartInquiryUrl(
  items: CartItem[],
  subtotal: number,
): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    buildCartInquiryMessage(items, subtotal),
  );
}

export function buildOrderConfirmationMessage(order: Order): string {
  const lines = [
    `Halo ${SITE.name}, saya baru membuat pesanan dan ingin konfirmasi cepat:`,
    "",
    `🧾 Kode Pesanan: *${order.orderCode}*`,
    `🙋 Nama: ${order.customerName}`,
    `📱 No. HP: ${order.customerPhone}`,
    `🚚 Pengiriman: ${DELIVERY_METHOD_LABELS[order.deliveryMethod]}`,
    `💳 Pembayaran: ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
    "",
    "📦 Rincian Pesanan:",
  ];

  (order.items ?? []).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.productName} (${item.quantity}x ${formatRupiah(item.unitPrice)})`,
    );
  });

  lines.push("");
  lines.push(`• Subtotal: ${formatRupiah(order.subtotal)}`);
  if (order.deliveryMethod === "cod") {
    lines.push(
      `• Ongkir COD (${order.distanceKm} km): ${order.shippingFee === 0 ? "Gratis" : formatRupiah(order.shippingFee)}`,
    );
    lines.push(`• Alamat: ${order.destinationAddress}`);
    if (
      order.destinationLat !== null &&
      order.destinationLng !== null
    ) {
      lines.push(
        `📍 Titik Peta: https://maps.google.com/?q=${order.destinationLat},${order.destinationLng}`,
      );
    }
  }
  if (order.paymentUniqueCode > 0) {
    lines.push(`• Kode Unik: ${formatRupiah(order.paymentUniqueCode)}`);
  }
  lines.push(`💰 *Total Tagihan: ${formatRupiah(order.totalAmount)}*`);

  if (order.notes.trim()) {
    lines.push(`📝 Catatan: ${order.notes.trim()}`);
  }

  lines.push("", "Mohon konfirmasi dan persetujuan pesanan saya. Terima kasih!");
  return lines.join("\n");
}

export function buildOrderConfirmationUrl(order: Order): string {
  return buildWhatsAppUrl(
    SITE.whatsappNumber,
    buildOrderConfirmationMessage(order),
  );
}

export function buildOutOfCodZoneUrl(
  distanceKm: number,
  address: string,
): string {
  const message = [
    `Halo ${SITE.name}, lokasi saya berada di luar radius COD 20 km (~${distanceKm} km).`,
    "",
    `📍 Alamat tujuan: ${address || "[isi alamat lengkap]"}`,
    "",
    "Apakah bisa dikirim menggunakan ekspedisi (J&T/JNE/Pos) atau saya atur penjemputan? Mohon infonya!",
  ].join("\n");

  return buildWhatsAppUrl(SITE.whatsappNumber, message);
}

export function buildBuyerStatusMessage(order: Order): string {
  const header = `Halo Kak ${order.customerName}, ini admin ${SITE.name}.`;

  switch (order.status) {
    case "approved":
      return `${header}\n\nPesanan *${order.orderCode}* (Total ${formatRupiah(order.totalAmount)}) sudah kami *setujui* dan sedang kami siapkan.${order.deliveryMethod === "pickup" ? " Sebentar lagi unit siap diambil di konter." : " Sebentar lagi kurir kami bersiap menuju lokasi Anda."}`;
    case "out_for_delivery":
      return `${header}\n\nPesanan *${order.orderCode}* sudah kami setujui dan kurir COD sedang menuju lokasi Anda (${order.destinationAddress}). Mohon pastikan nomor ini aktif ya Kak.`;
    case "ready_for_pickup":
      return `${header}\n\nPesanan *${order.orderCode}* sudah *siap diambil* di ${SITE.name} (Jl. Raya Melikan, Kendaga). Kami buka sampai jam 21.00 WIB.`;
    case "completed":
      return `${header}\n\nTerima kasih telah berbelanja di ${SITE.name}! Pesanan *${order.orderCode}* telah selesai. Simpan kode order ini untuk klaim E-Warranty di halaman /lacak ya Kak.`;
    case "rejected":
    case "cancelled":
      return `${header}\n\nMohon maaf, pesanan *${order.orderCode}* dibatalkan/ditolak.${order.adminNotes ? ` Alasan: ${order.adminNotes}` : ""} Hubungi kami jika ingin memilih unit pengganti.`;
    default:
      return `${header}\n\nKami sedang memproses pesanan *${order.orderCode}* (Total ${formatRupiah(order.totalAmount)}). Ada detail yang ingin kami konfirmasi sebentar.`;
  }
}

export function buildBuyerStatusWhatsAppUrl(order: Order): string {
  return buildWhatsAppUrl(order.customerPhone, buildBuyerStatusMessage(order));
}

export function buildServiceTicketStatusWhatsAppUrl(
  ticket: ServiceTicket,
): string {
  const message = [
    `Halo Kak ${ticket.customerName}, ini admin ${SITE.name}.`,
    "",
    `Update tiket servis *${ticket.ticketCode}* (${ticket.brand} ${ticket.deviceModel}):`,
    `📌 Status saat ini: *${SERVICE_TICKET_STATUS_LABELS[ticket.status]}*`,
    ...(ticket.adminNotes.trim()
      ? [`📝 Catatan teknisi: ${ticket.adminNotes.trim()}`]
      : []),
    "",
    "Jika ada pertanyaan atau konfirmasi pengerjaan, balas pesan ini ya Kak.",
  ].join("\n");

  return buildWhatsAppUrl(ticket.customerPhone, message);
}

export function buildWarrantyClaimUrl(
  orderCode: string,
  warrantyCode: string,
  productName: string,
): string {
  const message = [
    `Halo ${SITE.name}, saya ingin konsultasi / klaim E-Warranty:`,
    "",
    `🛡️ No. E-Warranty: *${warrantyCode}*`,
    `🧾 Kode Pesanan: *${orderCode}*`,
    `📱 Produk: ${productName}`,
    "",
    "Mohon bantuan pengecekan kendala unit saya. Terima kasih!",
  ].join("\n");

  return buildWhatsAppUrl(SITE.whatsappNumber, message);
}
