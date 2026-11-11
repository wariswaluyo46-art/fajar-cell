import type { Product } from "@/types";

export type CatalogSort = "cheapest" | "priciest" | "newest";

export const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: "cheapest", label: "Harga Termurah" },
  { value: "priciest", label: "Harga Tertinggi" },
  { value: "newest", label: "Terbaru" },
];

export type BudgetFilter = "all" | "under-2m" | "2m-4m" | "above-4m";

export const BUDGET_FILTER_OPTIONS: { value: BudgetFilter; label: string }[] = [
  { value: "all", label: "Semua Harga" },
  { value: "under-2m", label: "< 2 Juta" },
  { value: "2m-4m", label: "2 - 4 Juta" },
  { value: "above-4m", label: "> 4 Juta" },
];

export type NeedFilter =
  | "all"
  | "parents"
  | "battery"
  | "gaming"
  | "camera"
  | "budget";

export const NEED_FILTER_OPTIONS: {
  value: NeedFilter;
  label: string;
  shortLabel: string;
  icon: string;
  hint: string;
}[] = [
  {
    value: "all",
    label: "Semua Kebutuhan",
    shortLabel: "Semua Kebutuhan",
    icon: "✨",
    hint: "Tampilkan seluruh pilihan HP",
  },
  {
    value: "parents",
    label: "👓 Ramah Orang Tua (Layar Besar & Suara Jelas)",
    shortLabel: "👓 Ramah Orang Tua",
    icon: "👓",
    hint: "Layar lapang, font besar mudah dibaca & suara nyaring",
  },
  {
    value: "battery",
    label: "🔋 Baterai Awet Seharian",
    shortLabel: "🔋 Baterai Awet",
    icon: "🔋",
    hint: "Kapasitas 5000 mAh+ tahan 1-2 hari aktif",
  },
  {
    value: "gaming",
    label: "🎮 Gaming & Multitasking (Remaja)",
    shortLabel: "🎮 Gaming & Multitask",
    icon: "🎮",
    hint: "RAM 8GB+ & prosesor kencang bebas patah-patah",
  },
  {
    value: "camera",
    label: "📸 Kamera Jernih & Konten",
    shortLabel: "📸 Kamera Jernih",
    icon: "📸",
    hint: "Hasil foto tajam, video jernih & stabil",
  },
  {
    value: "budget",
    label: "💰 Harga Hemat < 2 Juta",
    shortLabel: "💰 Hemat < 2 Jt",
    icon: "💰",
    hint: "Harga paling ekonomis & terjangkau",
  },
];

export function matchesBudget(price: number, filter: BudgetFilter): boolean {
  if (filter === "all") return true;
  if (filter === "under-2m") return price < 2_000_000;
  if (filter === "2m-4m") return price >= 2_000_000 && price <= 4_000_000;
  if (filter === "above-4m") return price > 4_000_000;
  return true;
}

export function matchesNeed(product: Product, filter: NeedFilter): boolean {
  if (filter === "all") return true;

  if (filter === "budget") {
    return product.price < 2_000_000;
  }

  if (product.category === "aksesoris") {
    return false;
  }

  const specs = product.specs;

  if (filter === "parents") {
    const screenText = specs.screen?.toLowerCase() ?? "";
    const hasBigScreen =
      screenText.includes("6.5") ||
      screenText.includes("6.6") ||
      screenText.includes("6.7") ||
      screenText.includes("6.8");
    const hasBigBattery = (specs.battery ?? 0) >= 4500;
    const isAffordable = product.price <= 4_500_000;

    return hasBigScreen || (hasBigBattery && isAffordable);
  }

  if (filter === "battery") {
    return (specs.battery ?? 0) >= 5000;
  }

  if (filter === "gaming") {
    const isHighRam = specs.ram >= 8;
    const isHighChipset =
      specs.chipset?.toLowerCase().includes("snapdragon 8") ||
      specs.chipset?.toLowerCase().includes("snapdragon 7") ||
      specs.chipset?.toLowerCase().includes("dimensity") ||
      specs.chipset?.toLowerCase().includes("g99");
    return isHighRam || isHighChipset || specs.ram >= 6;
  }

  if (filter === "camera") {
    const isSamsungS =
      product.brand === "Samsung" &&
      (product.name.includes("S22") || product.name.includes("A55"));
    const isPro = product.name.toLowerCase().includes("pro");
    const isHighMP =
      Boolean(specs.camera?.includes("108MP")) ||
      Boolean(specs.camera?.includes("64MP")) ||
      Boolean(specs.camera?.includes("200MP")) ||
      Boolean(specs.camera?.includes("50MP"));
    return isSamsungS || isPro || isHighMP;
  }

  return true;
}

export function matchesProductQuery(product: Product, query: string): boolean {
  const keyword = query.trim().toLowerCase();
  if (keyword === "") return true;

  return `${product.name} ${product.brand} ${product.slug}`
    .toLowerCase()
    .includes(keyword);
}

export function sortProducts<T extends Product>(
  products: T[],
  sort: CatalogSort,
): T[] {
  return [...products].sort((first, second) => {
    if (sort === "cheapest") {
      return first.price - second.price || first.name.localeCompare(second.name);
    }

    if (sort === "priciest") {
      return second.price - first.price || first.name.localeCompare(second.name);
    }

    return (
      Date.parse(second.createdAt) - Date.parse(first.createdAt) ||
      first.name.localeCompare(second.name)
    );
  });
}
