import { checkRateLimit, getClientKey } from "@/lib/ai/rate-limit";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { getCatalogSnapshot } from "@/lib/ai/catalog";
import { generateText } from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { buildChatSystemPrompt } from "@/lib/ai/prompts";
import type { AiChatMessage } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24 * 1_024;
const MAX_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 1_200;
const MAX_TOTAL_CHARS = 6_000;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

type ParseResult =
  | { ok: true; messages: AiChatMessage[] }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
      typeof raw.content === "string" ? raw.content.trim() : "";

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
      maxOutputTokens: 600,
    });

    return apiJson({
      success: true,
      reply: result.text,
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
