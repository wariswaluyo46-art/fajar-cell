import type { Brand } from "./product";

/** Kondisi fisik HP lama yang dinilai pada fitur tukar tambah. */
export type TradeInConditionGrade = "mulus" | "lecet-ringan" | "lecet-berat";

/** Kelengkapan HP lama yang ikut memengaruhi estimasi harga. */
export type CompletenessOption = "fullset" | "unit-saja" | "tanpa-charger";

export interface TradeInInput {
  brand: Brand;
  /** Tipe/model HP, mis. "Samsung Galaxy A52s 128GB". */
  model: string;
  condition: TradeInConditionGrade;
  completeness: CompletenessOption;
  notes?: string;
  customerName?: string;
}

/**
 * Estimasi harga hanya berupa rentang (bukan harga final) karena unit
 * tetap harus dicek fisik oleh admin toko.
 */
export interface TradeInEstimate {
  minPrice: number;
  maxPrice: number;
  note: string;
}
