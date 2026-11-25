import { getCatalogSnapshot } from "@/lib/ai/catalog";
import { generateText, parseStrictJson } from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import { checkRateLimit, getClientKey } from "@/lib/ai/rate-limit";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { getCartSessionId } from "@/lib/cart-session";
import { getProductsAvailabilityMap } from "@/lib/orders-db";
import type { AiChatMessage, AiRecommendedProduct, Product } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1_024;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 600;
const MAX_TOTAL_CHARS = 3_500;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

type ParseResult =
  | { ok: true; messages: AiChatMessage[] }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Bersihkan karakter kontrol & penanda injeksi prompt dari input chat. */
function sanitizeUserMessage(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/={3,}\s*(katalog|info toko|keamanan|instruksi)/gi, "--- $1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseChatRequest(value: unknown): ParseResult {
  if (!isRecord(value) || !Array.isArray(value.messages)) {
    return { ok: false, error: "Format permintaan tidak valid." };
  }

  const rawMessages = value.messages;

  if (rawMessages.length === 0) {
    return { ok: false, error: "Kirim minimal satu pertanyaan." };
  }

  if (rawMessages.length > MAX_MESSAGES) {
    return {
      ok: false,
      error: `Riwayat chat maksimal ${MAX_MESSAGES} pesan.`,
    };
  }

  const messages: AiChatMessage[] = [];
  let totalChars = 0;

  for (const raw of rawMessages) {
    if (!isRecord(raw)) {
      return { ok: false, error: "Format pesan tidak valid." };
    }

    const role = raw.role;
    const content =
      typeof raw.content === "string" ? sanitizeUserMessage(raw.content) : "";

    if (role !== "user" && role !== "assistant") {
      return { ok: false, error: "Peran pesan tidak valid." };
    }

    if (content === "") {
      return { ok: false, error: "Pesan tidak boleh kosong." };
    }

    if (content.length > MAX_MESSAGE_CHARS) {
      return {
        ok: false,
        error: `Satu pesan maksimal ${MAX_MESSAGE_CHARS} karakter.`,
      };
    }

    totalChars += content.length;
    messages.push({ role, content });
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return {
      ok: false,
      error: "Riwayat chat terlalu panjang. Mulai percakapan baru.",
    };
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return { ok: false, error: "Pesan terakhir harus dari pengguna." };
  }

  return { ok: true, messages };
}

function toRecommendedSummary(
  product: Product,
  availableStock?: number,
  reservedByOthers?: number,
): AiRecommendedProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    price: product.price,
    thumbnail: product.thumbnail,
    status: product.status,
    stock: product.stock,
    availableStock,
    reservedByOthers,
  };
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `ai-chat:${getClientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );

  if (!limit.allowed) {
    const response = apiError(
      "Terlalu banyak pertanyaan. Tunggu sebentar lalu coba lagi.",
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const parsed = parseChatRequest(body.value);
  if (!parsed.ok) return apiError(parsed.error, 400);

  const { products } = await getCatalogSnapshot();
  const system = buildChatSystemPrompt(products);

  try {
    const result = await generateText({
      system,
      messages: parsed.messages.map((message) => ({
        role: message.role === "user" ? "user" : "model",
        text: message.content,
      })),
      temperature: 0.6,
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    });

    const parsedJson = parseStrictJson<{
      reply?: unknown;
      recommendedProductIds?: unknown;
    }>(result.text);

    const reply =
      parsedJson &&
      typeof parsedJson.reply === "string" &&
      parsedJson.reply.trim() !== ""
        ? parsedJson.reply.trim()
        : result.text.trim();

    const byId = new Map(products.map((p) => [p.id, p]));
    const matchedProducts: Product[] = [];
    const seen = new Set<string>();

    if (parsedJson && Array.isArray(parsedJson.recommendedProductIds)) {
      for (const rawId of parsedJson.recommendedProductIds) {
        if (typeof rawId !== "string") continue;
        const found = byId.get(rawId.trim());
        if (found && !seen.has(found.id)) {
          seen.add(found.id);
          matchedProducts.push(found);
          if (matchedProducts.length >= 3) break;
        }
      }
    }

    // Fallback heuristik bila model menyebut nama produk di teks tanpa ID JSON
    if (matchedProducts.length === 0) {
      const loweredReply = reply.toLowerCase();
      for (const product of products) {
        if (loweredReply.includes(product.name.toLowerCase())) {
          matchedProducts.push(product);
          if (matchedProducts.length >= 3) break;
        }
      }
    }

    let recommendedProducts: AiRecommendedProduct[] = [];
    if (matchedProducts.length > 0) {
      const sessionId = await getCartSessionId();
      const availabilityMap = await getProductsAvailabilityMap(
        sessionId ?? undefined,
        matchedProducts,
      );

      recommendedProducts = matchedProducts.map((product) => {
        const info = availabilityMap.get(product.id);
        return toRecommendedSummary(
          product,
          info?.availableStock,
          info ? info.reservedByOthers + info.pendingOrderQty : undefined,
        );
      });
    }

    return apiJson({
      success: true,
      reply,
      recommendedProducts,
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
