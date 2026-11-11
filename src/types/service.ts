export type ServiceDamageId =
  | "lcd"
  | "battery"
  | "charging"
  | "water"
  | "audio"
  | "software";

export interface ServiceDamageItem {
  id: ServiceDamageId;
  name: string;
  shortName: string;
  subtitle: string;
  icon: string;
  estimatedMinutes: string;
  priceRangeText: string;
  warrantyText: string;
  canWait: boolean;
  notes: string;
}

export type ServiceMethod = "datang-langsung" | "tanya-stok-dulu";

export interface ServiceBookingInput {
  brand: string;
  model: string;
  damages: ServiceDamageId[];
  method: ServiceMethod;
  customerName?: string;
  notes?: string;
}

export const SERVICE_DAMAGES: ServiceDamageItem[] = [
  {
    id: "lcd",
    name: "Layar Pecah / Bergaris / Blank (Ganti LCD)",
    shortName: "Layar & LCD",
    subtitle: "Layar retak, sentuhan macet, bergaris, atau gelap total",
    icon: "📱",
    estimatedMinutes: "45 - 90 Menit",
    priceRangeText: "Rp 250.000 - Rp 850.000+",
    warrantyText: "Garansi Toko 30 Hari",
    canWait: true,
    notes: "LCD original / OEM presisi, warna cerah & sentuhan halus",
  },
  {
    id: "battery",
    name: "Baterai Cepat Habis / Kembung / Drop",
    shortName: "Baterai Baru",
    subtitle: "Baterai boros, mati saat 20%, atau tutup belakang terangkat",
    icon: "🔋",
    estimatedMinutes: "30 - 60 Menit",
    priceRangeText: "Rp 150.000 - Rp 450.000",
    warrantyText: "Garansi Toko 30 Hari",
    canWait: true,
    notes: "Baterai kualitas premium dengan IC protector anti kembung",
  },
  {
    id: "charging",
    name: "Tidak Bisa Cas / Konektor Longgar",
    shortName: "Port Charger",
    subtitle: "Kabel harus digoyang, pengisian lambat, atau tidak merespons",
    icon: "🔌",
    estimatedMinutes: "30 - 60 Menit",
    priceRangeText: "Rp 75.000 - Rp 250.000",
    warrantyText: "Garansi Toko 14 Hari",
    canWait: true,
    notes: "Port Type-C / Micro USB presisi & kencang",
  },
  {
    id: "water",
    name: "Mati Total / Terkena Air / Korsleting",
    shortName: "Mati Total & Air",
    subtitle: "HP kemasukan air, jatuh keras, atau tidak menyala sama sekali",
    icon: "💧",
    estimatedMinutes: "1 - 3 Hari (Analisa Detail)",
    priceRangeText: "Mulai Rp 150.000 (Cek Gratis)",
    warrantyText: "Garansi Toko 30 Hari",
    canWait: false,
    notes: "Pembersihan korosi ultrasonik, analisa jalur & reball IC mesin",
  },
  {
    id: "audio",
    name: "Suara Speaker Kresek / Mic Mati",
    shortName: "Speaker & Mic",
    subtitle: "Lawan bicara tidak dengar suara, atau dering musik mati",
    icon: "🔊",
    estimatedMinutes: "30 - 60 Menit",
    priceRangeText: "Rp 85.000 - Rp 250.000",
    warrantyText: "Garansi Toko 14 Hari",
    canWait: true,
    notes: "Penggantian buzzer speaker musik dan modul microphone jernih",
  },
  {
    id: "software",
    name: "Lupa Pola / Sandi / Mentok Logo (Bootloop)",
    shortName: "Software & Sistem",
    subtitle: "HP restart terus, lupa akun/pola, atau lemot berat",
    icon: "🔓",
    estimatedMinutes: "30 - 90 Menit",
    priceRangeText: "Rp 75.000 - Rp 200.000",
    warrantyText: "Garansi Toko 7 Hari",
    canWait: true,
    notes: "Flash ROM resmi pabrik, bypass aman & update OS terbaru",
  },
];
