import type {
  PhoneSpecs,
  Product,
  ProductFormValues,
  ProductInput,
  UsedCondition,
  Warranty,
} from "@/types";

import {
  getFallbackThumbnail,
  isDataImageUrl,
  isLocalImagePath,
  isRemoteImageUrl,
} from "./product-images";

const DEFAULT_WARRANTY_DESCRIPTION =
  "Garansi toko 14 hari untuk servis dan pengecekan";

const DEFAULT_DESCRIPTION: Record<ProductFormValues["category"], string> = {
  "handphone-bekas":
    "Unit second original, semua fungsi normal, dan sudah dicek teknisi Konter Fajar Cell.",
  "handphone-baru":
    "Unit baru segel, garansi resmi distributor, dan siap dipakai.",
  aksesoris:
    "Produk original, sudah dicek kualitasnya, dan bergaransi toko.",
};

function toInteger(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;

  return parsed;
}

function splitList(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function createProductFormValues(
  product?: Product | null,
): ProductFormValues {
  if (!product) {
    return {
      name: "",
      brand: "Samsung",
      category: "handphone-bekas",
      price: "",
      originalPrice: "",
      stock: "1",
      status: "ready",
      imageSource: "upload",
      thumbnail: getFallbackThumbnail("handphone-bekas"),
      galleryImages: [],
      description: "",
      featured: false,
      color: "",
      ram: "",
      storage: "",
      conditionGrade: "Mulus 95%",
      conditionLabel: "Fullset Original",
      minusCount: "0",
      batteryHealth: "",
      completeness: "Dus, Charger, Kabel",
      warrantyActive: true,
      warrantyDurationDays: "14",
      warrantyDescription: DEFAULT_WARRANTY_DESCRIPTION,
      accessoryType: "charger",
      compatibleWith: "",
    };
  }

  const isPhone =
    product.category === "handphone-bekas" ||
    product.category === "handphone-baru";
  const isUsed = product.category === "handphone-bekas";

  return {
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: String(product.price),
    originalPrice:
      product.originalPrice === undefined ? "" : String(product.originalPrice),
    stock: String(product.stock),
    status: product.status,
    imageSource: isRemoteImageUrl(product.thumbnail)
      ? product.thumbnail.includes("supabase.co/storage")
        ? "upload"
        : "url"
      : "local",
    thumbnail: product.thumbnail,
    galleryImages: product.images
      ? product.images.filter((img) => img !== product.thumbnail)
      : [],
    description: product.description,
    featured: product.featured,
    color: isPhone ? product.color : "",
    ram: isPhone ? String(product.specs.ram) : "",
    storage: isPhone ? String(product.specs.storage) : "",
    conditionGrade: isUsed ? product.condition.grade : "Mulus 95%",
    conditionLabel: isUsed ? product.condition.label : "Fullset Original",
    minusCount: isUsed ? String(product.condition.minusCount) : "0",
    batteryHealth:
      isUsed && product.condition.batteryHealth !== undefined
        ? String(product.condition.batteryHealth)
        : "",
    completeness: isUsed ? product.condition.completeness.join(", ") : "",
    warrantyActive: isPhone ? product.warranty.active : true,
    warrantyDurationDays: isPhone
      ? String(product.warranty.durationDays)
      : "14",
    warrantyDescription: isPhone
      ? product.warranty.description
      : DEFAULT_WARRANTY_DESCRIPTION,
    accessoryType:
      product.category === "aksesoris" ? product.accessoryType : "charger",
    compatibleWith:
      product.category === "aksesoris"
        ? (product.compatibleWith ?? []).join(", ")
        : "",
  };
}

export function validateProductForm(
  values: ProductFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = values.name.trim();

  if (name.length < 2) {
    errors.name = "Nama produk minimal 2 karakter.";
  } else if (name.length > 100) {
    errors.name = "Nama produk maksimal 100 karakter.";
  }

  const price = toInteger(values.price);
  if (price === null || price <= 0) {
    errors.price = "Harga wajib diisi dengan angka lebih dari 0.";
  }

  if (values.originalPrice.trim() !== "") {
    const originalPrice = toInteger(values.originalPrice);
    if (originalPrice === null || originalPrice <= 0) {
      errors.originalPrice = "Harga sebelum diskon harus angka lebih dari 0.";
    } else if (price !== null && originalPrice <= price) {
      errors.originalPrice =
        "Harga sebelum diskon harus lebih besar dari harga jual.";
    }
  }

  const stock = toInteger(values.stock);
  if (stock === null || stock < 0) {
    errors.stock = "Stok harus bilangan bulat 0 atau lebih.";
  } else if (values.status === "ready" && stock < 1) {
    errors.stock = "Stok minimal 1 untuk produk berstatus Ready Stock.";
  }

  const thumbnail = values.thumbnail.trim();

  if (values.imageSource === "url") {
    if (thumbnail === "") {
      errors.thumbnail = "URL gambar eksternal wajib diisi.";
    } else if (!isRemoteImageUrl(thumbnail)) {
      errors.thumbnail =
        "URL gambar harus berupa direct link yang diawali http:// atau https://.";
    }
  } else if (values.imageSource === "upload") {
    if (thumbnail === "") {
      errors.thumbnail = "Silakan unggah foto produk terlebih dahulu.";
    } else if (!isRemoteImageUrl(thumbnail) && !isLocalImagePath(thumbnail)) {
      errors.thumbnail = "File foto belum valid atau belum berhasil diunggah.";
    }
  } else if (
    thumbnail !== "" &&
    !isLocalImagePath(thumbnail) &&
    !isDataImageUrl(thumbnail)
  ) {
    errors.thumbnail =
      "Path lokal harus diawali /images/... atau gunakan tab Upload / URL eksternal.";
  }

  if (values.category !== "aksesoris") {
    const ram = toInteger(values.ram);
    const storage = toInteger(values.storage);

    if (ram === null || ram <= 0) {
      errors.ram = "RAM wajib diisi (contoh: 8).";
    }
    if (storage === null || storage <= 0) {
      errors.storage = "Penyimpanan wajib diisi (contoh: 256).";
    }

    const warrantyDays = toInteger(values.warrantyDurationDays);
    if (warrantyDays === null || warrantyDays < 0) {
      errors.warrantyDurationDays =
        "Durasi garansi harus bilangan bulat 0 atau lebih.";
    }
  }

  if (values.category === "handphone-bekas") {
    if (values.conditionGrade.trim() === "") {
      errors.conditionGrade = "Grade kondisi wajib diisi.";
    }
    if (values.conditionLabel.trim() === "") {
      errors.conditionLabel = "Label kelengkapan wajib diisi.";
    }

    const minusCount = toInteger(values.minusCount);
    if (minusCount === null || minusCount < 0) {
      errors.minusCount = "Jumlah minus harus 0 atau lebih.";
    }

    if (values.batteryHealth.trim() !== "") {
      const batteryHealth = toInteger(values.batteryHealth);
      if (
        batteryHealth === null ||
        batteryHealth < 0 ||
        batteryHealth > 100
      ) {
        errors.batteryHealth = "Kesehatan baterai harus 0-100%.";
      }
    }
  }

  return errors;
}

/** Konversi nilai form (string) menjadi payload produk yang siap disimpan. */
export function productFormValuesToInput(
  values: ProductFormValues,
  existing?: Product | null,
): ProductInput {
  const name = values.name.trim();
  const category = values.category;
  const price = Math.max(0, toInteger(values.price) ?? 0);
  const stock = Math.max(0, toInteger(values.stock) ?? 0);
  const originalPrice = toInteger(values.originalPrice);
  const thumbnail =
    values.thumbnail.trim() || getFallbackThumbnail(category);
  const gallery = (values.galleryImages ?? []).filter(
    (img) => img.trim() !== "",
  );
  const images = Array.from(new Set([thumbnail, ...gallery]));
  const description =
    values.description.trim() || DEFAULT_DESCRIPTION[category];

  const common = {
    name,
    brand: values.brand,
    category,
    price,
    originalPrice:
      originalPrice !== null && originalPrice > 0 ? originalPrice : undefined,
    thumbnail,
    images,
    description,
    status: values.status,
    featured: values.featured,
    stock,
    slug:
      existing && existing.name === name ? existing.slug : undefined,
  };

  if (category === "aksesoris") {
    const compatibleWith = splitList(values.compatibleWith);

    return {
      ...common,
      category,
      accessoryType: values.accessoryType,
      compatibleWith:
        compatibleWith.length > 0 ? compatibleWith : undefined,
    };
  }

  const specs: PhoneSpecs = {
    ...(existing &&
    (existing.category === "handphone-bekas" ||
      existing.category === "handphone-baru")
      ? existing.specs
      : {}),
    ram: Math.max(0, toInteger(values.ram) ?? 0),
    storage: Math.max(0, toInteger(values.storage) ?? 0),
  };

  const warranty: Warranty = {
    active: values.warrantyActive,
    durationDays: Math.max(0, toInteger(values.warrantyDurationDays) ?? 0),
    description: values.warrantyDescription.trim(),
  };

  if (category === "handphone-bekas") {
    const batteryHealth = toInteger(values.batteryHealth);
    const condition: UsedCondition = {
      grade: values.conditionGrade.trim(),
      label: values.conditionLabel.trim(),
      minusCount: Math.max(0, toInteger(values.minusCount) ?? 0),
      completeness: splitList(values.completeness),
      ...(batteryHealth !== null && batteryHealth >= 0
        ? { batteryHealth }
        : {}),
    };

    return {
      ...common,
      category,
      color: values.color.trim() || "Original",
      specs,
      warranty,
      condition,
      tradeInEligible:
        existing?.category === "handphone-bekas"
          ? existing.tradeInEligible
          : true,
    };
  }

  return {
    ...common,
    category,
    color: values.color.trim() || "Original",
    specs,
    warranty,
  };
}
