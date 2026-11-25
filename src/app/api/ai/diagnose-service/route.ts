import {
  generateText,
  GeminiUnavailableError,
  parseStrictJson,
} from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { SERVICE_DAMAGES, type ServiceDamageId } from "@/types/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_048;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

const ALLOWED_DAMAGE_IDS = new Set<ServiceDamageId>([
  "lcd",
  "battery",
  "charging",
  "water",
  "audio",
  "software",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: string, maxLen: number): string {
  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `ai-diagnose:${getClientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan analisa gejala. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (!isRecord(body.value) || typeof body.value.symptom !== "string") {
    return apiError("Tuliskan keluhan gejala HP Anda terlebih dahulu.", 400);
  }

  const symptom = cleanText(body.value.symptom, 400);
  if (symptom.length < 6) {
    return apiError("Jelaskan gejala kerusakan minimal 6 karakter.", 400);
  }

  const brand =
    typeof body.value.brand === "string"
      ? cleanText(body.value.brand, 60)
      : "";
  const model =
    typeof body.value.model === "string"
      ? cleanText(body.value.model, 80)
      : "";

  const catalogLines = SERVICE_DAMAGES.map(
    (d) => `- "${d.id}": ${d.name} (${d.subtitle})`,
  ).join("\n");

  const systemPrompt = `Kamu adalah asisten teknisi servis HP Konter Fajar Cell.
Analisa keluhan pelanggan dan pilih kategori kerusakan yang paling relevan dari daftar resmi berikut:
${catalogLines}

Aturan wajib:
1. Balas HANYA JSON valid:
{
  "damageIds": ["lcd" | "battery" | "charging" | "water" | "audio" | "software"],
  "reasoning": "Penjelasan singkat 1-2 kalimat mengapa kategori ini dipilih.",
  "firstAidTip": "1 tips aman pertolongan pertama sebelum dibawa ke konter (misal jangan di-cas jika kena air)."
}
2. Pilih 1-3 damageIds yang paling relevan.
3. Jangan beri diagnosa berbahaya (jangan suruh bongkar sendiri atau masuk ke beras untuk HP kena air).`;

  const userPrompt = `Perangkat: ${brand || "-"} ${model || "-"}\nKeluhan gejala: ${symptom}`;

  try {
    const result = await generateText({
      system: systemPrompt,
      messages: [{ role: "user", text: userPrompt }],
      temperature: 0.25,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    });

    const parsed = parseStrictJson<Record<string, unknown>>(result.text);
    if (!parsed || !isRecord(parsed)) {
      throw new GeminiUnavailableError(
        "unavailable",
        "AI tidak menghasilkan hasil pra-diagnosa yang valid.",
      );
    }

    const damageIds = Array.isArray(parsed.damageIds)
      ? Array.from(
          new Set(
            parsed.damageIds.filter(
              (id): id is ServiceDamageId =>
                typeof id === "string" &&
                ALLOWED_DAMAGE_IDS.has(id as ServiceDamageId),
            ),
          ),
        ).slice(0, 3)
      : [];

    if (damageIds.length === 0) {
      damageIds.push("lcd");
    }

    const reasoning =
      typeof parsed.reasoning === "string" && parsed.reasoning.trim() !== ""
        ? cleanText(parsed.reasoning, 260)
        : "Kategori kerusakan dipilih berdasarkan gejala yang Anda jelaskan.";

    const firstAidTip =
      typeof parsed.firstAidTip === "string" && parsed.firstAidTip.trim() !== ""
        ? cleanText(parsed.firstAidTip, 260)
        : "Matikan perangkat bila terasa panas berlebih atau terkena cairan, dan segera bawa ke konter untuk pengecekan gratis.";

    return apiJson({
      success: true,
      damageIds,
      reasoning,
      firstAidTip,
      model: result.model,
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
