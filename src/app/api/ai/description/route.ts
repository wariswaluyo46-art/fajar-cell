import { getAdminSession } from "@/lib/admin-auth";
import { generateText, GeminiUnavailableError } from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { buildDescriptionPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, getClientKey } from "@/lib/ai/rate-limit";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import {
  isAccessoryType,
  isBrand,
  isProductCategory,
} from "@/lib/product-input";
import type {
  AiDescriptionConditionInput,
  AiDescriptionRequest,
  AiDescriptionSpecsInput,
  AiDescriptionWarrantyInput,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1_024;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;
const MAX_DESCRIPTION_CHARS = 700;

type ParseResult =
  | { ok: true; value: AiDescriptionRequest }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (trimmed === "") return undefined;

  return trimmed.slice(0, maxLength);
}

function readNumber(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;

  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return undefined;

  return rounded;
}

function readStringArray(
  value: unknown,
  maxItems: number,
  maxLength: number,
): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter((item) => item !== "")
    .slice(0, maxItems);

  return items.length > 0 ? items : undefined;
}

function parseSpecs(value: unknown): AiDescriptionSpecsInput | undefined {
  if (!isRecord(value)) return undefined;

  const specs: AiDescriptionSpecsInput = {};
  const ram = readNumber(value.ram, 1, 4_096);
  const storage = readNumber(value.storage, 1, 8_192);
  const battery = readNumber(value.battery, 100, 20_000);
  const chipset = readString(value.chipset, 60);
  const screen = readString(value.screen, 60);
  const camera = readString(value.camera, 60);

  if (ram !== undefined) specs.ram = ram;
  if (storage !== undefined) specs.storage = storage;
  if (battery !== undefined) specs.battery = battery;
  if (chipset) specs.chipset = chipset;
  if (screen) specs.screen = screen;
  if (camera) specs.camera = camera;

  return Object.keys(specs).length > 0 ? specs : undefined;
}

function parseCondition(
  value: unknown,
): AiDescriptionConditionInput | undefined {
  if (!isRecord(value)) return undefined;

  const condition: AiDescriptionConditionInput = {};
  const grade = readString(value.grade, 60);
  const label = readString(value.label, 60);
  const minusCount = readNumber(value.minusCount, 0, 100);
  const batteryHealth = readNumber(value.batteryHealth, 0, 100);
  const completeness = readStringArray(value.completeness, 10, 40);

  if (grade) condition.grade = grade;
  if (label) condition.label = label;
  if (minusCount !== undefined) condition.minusCount = minusCount;
  if (batteryHealth !== undefined) condition.batteryHealth = batteryHealth;
  if (completeness) condition.completeness = completeness;

  return Object.keys(condition).length > 0 ? condition : undefined;
}

function parseWarranty(
  value: unknown,
): AiDescriptionWarrantyInput | undefined {
  if (!isRecord(value)) return undefined;

  const warranty: AiDescriptionWarrantyInput = {};
  const durationDays = readNumber(value.durationDays, 0, 3_650);
  const description = readString(value.description, 200);

  if (typeof value.active === "boolean") warranty.active = value.active;
  if (durationDays !== undefined) warranty.durationDays = durationDays;
  if (description) warranty.description = description;

  return Object.keys(warranty).length > 0 ? warranty : undefined;
}

function parseDescriptionRequest(value: unknown): ParseResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Format permintaan tidak valid." };
  }

  const name = readString(value.name, 100);
  if (!name || name.length < 2) {
    return { ok: false, error: "Nama produk wajib diisi minimal 2 karakter." };
  }

  const category = value.category;
  if (!isProductCategory(category)) {
    return { ok: false, error: "Kategori produk tidak valid." };
  }

  const brand = value.brand;
  if (!isBrand(brand)) {
    return { ok: false, error: "Merek produk tidak valid." };
  }

  const input: AiDescriptionRequest = { name, category, brand };

  const price = readNumber(value.price, 0, 1_000_000_000_000);
  if (price !== undefined) input.price = price;

  const color = readString(value.color, 40);
  if (color) input.color = color;

  if (category === "aksesoris") {
    if (isAccessoryType(value.accessoryType)) {
      input.accessoryType = value.accessoryType;
    }

    const compatibleWith = readStringArray(value.compatibleWith, 20, 60);
    if (compatibleWith) input.compatibleWith = compatibleWith;
  } else {
    const specs = parseSpecs(value.specs);
    if (specs) input.specs = specs;

    const warranty = parseWarranty(value.warranty);
    if (warranty) input.warranty = warranty;

    if (category === "handphone-bekas") {
      const condition = parseCondition(value.condition);
      if (condition) input.condition = condition;
    }
  }

  return { ok: true, value: input };
}

function cleanDescription(text: string): string {
  const withoutQuotes = text
    .replace(/^[\s"'“”‘’]+/, "")
    .replace(/[\s"'“”‘’]+$/, "")
    .replace(/^(deskripsi|description)\s*:\s*/i, "");

  return withoutQuotes.replace(/\s+/g, " ").trim().slice(0, MAX_DESCRIPTION_CHARS);
}

export async function POST(request: Request): Promise<Response> {
  if (!(await getAdminSession())) {
    return apiError("Sesi admin berakhir. Silakan login ulang.", 401);
  }

  const limit = checkRateLimit(
    `ai-description:${getClientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );

  if (!limit.allowed) {
    const response = apiError(
      "Terlalu banyak permintaan AI. Tunggu sebentar lalu coba lagi.",
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseDescriptionRequest(body.value);
  if (!parsed.ok) return apiError(parsed.error, 400);

  try {
    const result = await generateText({
      system:
        "Kamu adalah copywriter produk untuk toko HP dan aksesoris Konter Fajar Cell. Kamu hanya menulis deskripsi singkat berdasarkan data yang diberikan.",
      messages: [{ role: "user", text: buildDescriptionPrompt(parsed.value) }],
      temperature: 0.7,
      maxOutputTokens: 400,
    });

    const description = cleanDescription(result.text);
    if (description === "") {
      throw new GeminiUnavailableError(
        "unavailable",
        "Model tidak menghasilkan deskripsi yang bisa dipakai.",
      );
    }

    return apiJson({
      success: true,
      description,
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
