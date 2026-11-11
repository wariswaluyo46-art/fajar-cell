/** Kontrak request/response fitur AI (Gemini) yang dipakai client dan server. */

import type {
  AccessoryType,
  Brand,
  ProductCategory,
} from "./product";

export type AiChatRole = "user" | "assistant";

export interface AiChatMessage {
  role: AiChatRole;
  content: string;
}

export interface AiChatRequest {
  messages: AiChatMessage[];
}

export type AiChatResponse =
  | { success: true; reply: string; model: string }
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
