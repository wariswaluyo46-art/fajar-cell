/** Kontrak request/response fitur AI (Gemini) yang dipakai client dan server. */

import type {
  AccessoryType,
  Brand,
  CustomSpecItem,
  ProductCategory,
  ProductStatus,
} from "./product";
import type { ServiceDamageId } from "./service";

export type AiChatRole = "user" | "assistant";

export interface AiRecommendedProduct {
  id: string;
  slug: string;
  name: string;
  brand: Brand;
  category: ProductCategory;
  price: number;
  thumbnail: string;
  status: ProductStatus;
  stock: number;
  availableStock?: number;
  reservedByOthers?: number;
}

export interface AiChatMessage {
  role: AiChatRole;
  content: string;
  recommendedProducts?: AiRecommendedProduct[];
}

export interface AiChatRequest {
  messages: Array<{ role: AiChatRole; content: string }>;
}

export type AiChatResponse =
  | {
      success: true;
      reply: string;
      recommendedProducts?: AiRecommendedProduct[];
      model: string;
    }
  | { success: false; error: string };

/** Data ringkas dari form admin untuk generator deskripsi. */
export interface AiDescriptionSpecsInput {
  ram?: number;
  storage?: number;
  chipset?: string;
  screen?: string;
  camera?: string;
  battery?: number;
}

export interface AiDescriptionConditionInput {
  grade?: string;
  label?: string;
  minusCount?: number;
  batteryHealth?: number;
  completeness?: string[];
}

export interface AiDescriptionWarrantyInput {
  active?: boolean;
  durationDays?: number;
  description?: string;
}

export interface AiDescriptionRequest {
  name: string;
  category: ProductCategory;
  brand: Brand;
  price?: number;
  color?: string;
  specs?: AiDescriptionSpecsInput;
  condition?: AiDescriptionConditionInput;
  warranty?: AiDescriptionWarrantyInput;
  accessoryType?: AccessoryType;
  compatibleWith?: string[];
}

export type AiDescriptionResponse =
  | { success: true; description: string; model: string }
  | { success: false; error: string };

export interface AiMarketPriceHint {
  min: number;
  max: number;
  note: string;
}

export interface AiAutofillSpecsData {
  brand: Brand;
  specs: {
    ram?: number;
    storage?: number;
    chipset?: string;
    screen?: string;
    camera?: string;
    frontCamera?: string;
    battery?: number;
    network?: string;
    os?: string;
    customSpecs?: CustomSpecItem[];
  };
  recommendedTags: string[];
  shortDescription: string;
  marketPriceHint: AiMarketPriceHint | null;
  confidenceNote: string;
}

export type AiAutofillSpecsResponse =
  | { success: true; data: AiAutofillSpecsData; model: string }
  | { success: false; error: string };

export interface AiCompareCategoryWinner {
  winnerId: string;
  winnerName: string;
  reason: string;
}

export interface AiCompareVerdict {
  summary: string;
  winnerByCategory: {
    gaming: AiCompareCategoryWinner;
    battery: AiCompareCategoryWinner;
    camera: AiCompareCategoryWinner;
    parents: AiCompareCategoryWinner;
    value: AiCompareCategoryWinner;
  };
}

export type AiCompareResponse =
  | { success: true; verdict: AiCompareVerdict; model: string }
  | { success: false; error: string };

export type AiDiagnoseServiceResponse =
  | {
      success: true;
      damageIds: ServiceDamageId[];
      reasoning: string;
      firstAidTip: string;
      model: string;
    }
  | { success: false; error: string };
