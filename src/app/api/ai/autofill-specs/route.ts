import { requireAdminSession } from "@/lib/admin-auth";
import {
  generateText,
  GeminiUnavailableError,
  parseStrictJson,
} from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import type {
  AiAutofillSpecsData,
  Brand,
  CustomSpecItem,
  ProductCategory,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1_024;
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_TAGS = new Set([
  "parents",
  "battery",
  "gaming",
  "camera",
  "budget",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCategory(raw: unknown): ProductCategory | null {
  if (raw === "handphone-bekas" || raw === "used_phone") {
    return "handphone-bekas";
  }
  if (raw === "handphone-baru" || raw === "new_phone") {
    return "handphone-baru";
  }
  if (raw === "aksesoris" || raw === "accessory") {
    return "aksesoris";
  }
  return null;
}

function normalizeBrand(raw: unknown): Brand {
  if (typeof raw !== "string") return "Lainnya";
  const v = raw.trim().toLowerCase();
  if (v.includes("samsung")) return "Samsung";
  if (v.includes("xiaomi") || v.includes("redmi") || v.includes("poco")) {
    return "Xiaomi";
  }
  if (v.includes("infinix")) return "Infinix";
  if (v.includes("oppo")) return "Oppo";
  if (v.includes("vivo")) return "Vivo";
  if (v.includes("realme")) return "Realme";
  if (v.includes("anker")) return "Anker";
  if (v.includes("baseus")) return "Baseus";
  return "Lainnya";
}

function cleanStr(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.slice(0, maxLen);
}

function cleanPositiveNum(
  value: unknown,
  min: number,
  max: number,
  allowFloat = false,
): number | undefined {
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  const normalized = allowFloat ? Math.round(num * 10) / 10 : Math.round(num);
  if (normalized < min || normalized > max) return undefined;
  return normalized;
}

function sanitizeCustomSpecs(value: unknown): CustomSpecItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: CustomSpecItem[] = [];

  for (const item of value) {
    if (!isRecord(item)) continue;
    const key = cleanStr(item.key, 60);
    const val = cleanStr(item.value, 140);
    if (!key || !val) continue;
    const lowered = key.toLowerCase();
    if (seen.has(lowered)) continue;
    seen.add(lowered);
    result.push({ key, value: val });
    if (result.length >= 4) break;
  }

  return result;
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const limit = checkRateLimit(
    `ai-autofill:${getClientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      "Terlalu banyak permintaan AI auto-fill. Tunggu sebentar lalu coba lagi.",
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value)) {
    return apiError("Format permintaan tidak valid.", 400);
  }

  const name = cleanStr(body.value.name, 120);
  if (!name || name.length < 4) {
    return apiError("Nama produk wajib diisi minimal 4 karakter.", 400);
  }

  const category = normalizeCategory(body.value.category);
  if (!category) {
    return apiError("Kategori produk tidak valid.", 400);
  }

  const systemPrompt = `Kamu adalah asisten katalog teknis untuk toko HP Konter Fajar Cell di Indonesia.
Tugasmu menghasilkan data spesifikasi akurat dan kisaran harga pasar wajar Indonesia dalam format JSON ketat.

Aturan:
1. Balas HANYA JSON valid dengan struktur persis:
{
  "brand": "Samsung | Xiaomi | Infinix | Oppo | Vivo | Realme | Anker | Baseus | Lainnya",
  "specs": {
    "ram": number | null,
    "storage": number | null,
    "chipset": string | null,
    "screen": string | null,
    "camera": string | null,
    "frontCamera": string | null,
    "battery": number | null,
    "network": string | null,
    "os": string | null,
    "customSpecs": [{ "key": string, "value": string }]
  },
  "recommendedTags": ["parents" | "battery" | "gaming" | "camera" | "budget"],
  "shortDescription": string,
  "marketPriceHint": { "min": number, "max": number, "note": string } | null,
  "confidenceNote": string
}
2. Jika nama produk kurang spesifik (misalnya belum menyebut varian RAM/ROM), berikan tebakan varian paling umum dan tuliskan peringatan jujur pada "confidenceNote".
3. Untuk kategori aksesoris, isi specs minimal (boleh null) dan fokus pada shortDescription, brand, dan marketPriceHint.
4. Untuk customSpecs, sertakan 2-4 poin sorotan (misal NFC, Fast Charging, Refresh Rate, Slot MicroSD).
5. Untuk marketPriceHint, gunakan angka Rupiah wajar pasar Indonesia sesuai kondisi (${category === "handphone-bekas" ? "harga HP bekas/second" : category === "handphone-baru" ? "harga HP baru resmi" : "harga aksesoris"}).
6. shortDescription harus 2-3 kalimat Bahasa Indonesia natural tanpa emoji.`;

  const userPrompt = `Nama produk: ${name}\nKategori: ${category}\nBuat JSON spesifikasi sekarang.`;

  try {
    const result = await generateText({
      system: systemPrompt,
      messages: [{ role: "user", text: userPrompt }],
      temperature: 0.3,
      maxOutputTokens: 900,
      responseMimeType: "application/json",
    });

    const parsed = parseStrictJson<Record<string, unknown>>(result.text);
    if (!parsed || !isRecord(parsed)) {
      throw new GeminiUnavailableError(
        "unavailable",
        "AI tidak menghasilkan format JSON yang valid.",
      );
    }

    const rawSpecs = isRecord(parsed.specs) ? parsed.specs : {};
    const rawHint = isRecord(parsed.marketPriceHint)
      ? parsed.marketPriceHint
      : null;

    const hintMin = rawHint
      ? cleanPositiveNum(rawHint.min, 5_000, 100_000_000)
      : undefined;
    const hintMax = rawHint
      ? cleanPositiveNum(rawHint.max, 5_000, 100_000_000)
      : undefined;

    const marketPriceHint =
      hintMin !== undefined && hintMax !== undefined && hintMax >= hintMin
        ? {
            min: hintMin,
            max: hintMax,
            note:
              cleanStr(rawHint?.note, 160) ??
              "Kisaran harga pasar Indonesia sebagai referensi.",
          }
        : null;

    const recommendedTags = Array.isArray(parsed.recommendedTags)
      ? parsed.recommendedTags
          .filter(
            (t): t is string =>
              typeof t === "string" && ALLOWED_TAGS.has(t.trim()),
          )
          .slice(0, 4)
      : [];

    const data: AiAutofillSpecsData = {
      brand: normalizeBrand(parsed.brand ?? name),
      specs: {
        ram: cleanPositiveNum(rawSpecs.ram, 0.5, 128, true),
        storage: cleanPositiveNum(rawSpecs.storage, 1, 4096),
        chipset: cleanStr(rawSpecs.chipset, 120),
        screen: cleanStr(rawSpecs.screen, 160),
        camera: cleanStr(rawSpecs.camera, 120),
        frontCamera: cleanStr(rawSpecs.frontCamera, 120),
        battery: cleanPositiveNum(rawSpecs.battery, 500, 25000),
        network: cleanStr(rawSpecs.network, 60),
        os: cleanStr(rawSpecs.os, 80),
        customSpecs: sanitizeCustomSpecs(rawSpecs.customSpecs),
      },
      recommendedTags,
      shortDescription:
        cleanStr(parsed.shortDescription, 450) ??
        `${name} tersedia di Konter Fajar Cell dengan garansi toko terjamin.`,
      marketPriceHint,
      confidenceNote:
        cleanStr(parsed.confidenceNote, 240) ??
        "Periksa kembali varian RAM/ROM dan kondisi fisik unit sebelum menyimpan.",
    };

    return apiJson({ success: true, data, model: result.model });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
