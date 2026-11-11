import "server-only";

/**
 * Klien Gemini sisi server.
 *
 * Kunci API tidak pernah dikirim ke browser. Model utama diambil dari
 * `GEMINI_MODEL`; bila model tersebut tidak tersedia atau kuotanya habis,
 * permintaan otomatis dicoba ke `GEMINI_FALLBACK_MODELS` agar asisten tetap
 * bisa menjawab (mis. model baru yang belum aktif di free tier).
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-2.5-flash"];
const DEFAULT_TIMEOUT_MS = 20_000;
const MIN_TIMEOUT_MS = 3_000;
const MAX_TIMEOUT_MS = 55_000;

export type GeminiFailureReason =
  | "not-configured"
  | "quota"
  | "timeout"
  | "blocked"
  | "unavailable";

export class GeminiUnavailableError extends Error {
  readonly reason: GeminiFailureReason;
  readonly retryAfterSeconds?: number;

  constructor(
    reason: GeminiFailureReason,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "GeminiUnavailableError";
    this.reason = reason;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface GeminiMessage {
  role: "user" | "model";
  text: string;
}

export interface GenerateTextInput {
  system: string;
  messages: GeminiMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateTextResult {
  text: string;
  model: string;
  usedFallback: boolean;
}

interface GeminiConfig {
  apiKey: string;
  models: string[];
  timeoutMs: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeModel(value: string): string {
  return value.trim().replace(/^models\//, "");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function readConfig(): GeminiConfig {
  const apiKey = (
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    ""
  ).trim();

  if (apiKey === "") {
    throw new GeminiUnavailableError(
      "not-configured",
      "GEMINI_API_KEY belum diisi di environment server.",
    );
  }

  const primary = normalizeModel(process.env.GEMINI_MODEL ?? DEFAULT_MODEL);
  const fallbackSource = process.env.GEMINI_FALLBACK_MODELS;
  const fallbacks =
    fallbackSource === undefined
      ? DEFAULT_FALLBACK_MODELS
      : fallbackSource.split(",").map(normalizeModel).filter(Boolean);

  // Pastikan model resmi gratis Google AI Studio selalu tersedia sebagai fallback
  const models = [
    ...new Set([
      primary,
      ...fallbacks,
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ].filter(Boolean)),
  ];
  if (models.length === 0) {
    throw new GeminiUnavailableError(
      "not-configured",
      "Tidak ada model Gemini yang dikonfigurasi.",
    );
  }

  const timeoutCandidate = Number(process.env.GEMINI_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(timeoutCandidate) && timeoutCandidate > 0
    ? clamp(timeoutCandidate, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;

  return { apiKey, models, timeoutMs };
}

function readErrorMessage(payload: unknown): string {
  if (!isRecord(payload) || !isRecord(payload.error)) return "";

  return typeof payload.error.message === "string"
    ? payload.error.message
    : "";
}

/** Mengambil `retryDelay` ("9988s") dari detail error Google bila ada. */
function readRetryAfterSeconds(
  payload: unknown,
  headerValue: string | null,
): number | undefined {
  const headerSeconds = Number(headerValue);
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) {
    return Math.ceil(headerSeconds);
  }

  if (
    !isRecord(payload) ||
    !isRecord(payload.error) ||
    !Array.isArray(payload.error.details)
  ) {
    return undefined;
  }

  for (const detail of payload.error.details) {
    if (!isRecord(detail) || typeof detail.retryDelay !== "string") continue;

    const match = /^(\d+(?:\.\d+)?)s$/.exec(detail.retryDelay.trim());
    if (match) {
      const seconds = Number(match[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return Math.ceil(seconds);
      }
    }
  }

  return undefined;
}

function readBlockedReason(payload: unknown): string | null {
  if (!isRecord(payload)) return null;

  const feedback = payload.promptFeedback;
  if (isRecord(feedback) && typeof feedback.blockReason === "string") {
    return feedback.blockReason;
  }

  return null;
}

function readCandidateText(payload: unknown): {
  text: string | null;
  finishReason: string | null;
} {
  if (!isRecord(payload) || !Array.isArray(payload.candidates)) {
    return { text: null, finishReason: null };
  }

  const candidate = payload.candidates[0];
  if (!isRecord(candidate)) return { text: null, finishReason: null };

  const finishReason =
    typeof candidate.finishReason === "string" ? candidate.finishReason : null;

  if (!isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
    return { text: null, finishReason };
  }

  const text = candidate.content.parts
    .map((part) =>
      isRecord(part) && typeof part.text === "string" ? part.text : "",
    )
    .join("")
    .trim();

  return { text: text === "" ? null : text, finishReason };
}

async function requestModel(
  model: string,
  input: GenerateTextInput,
  config: GeminiConfig,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: input.system }] },
          contents: input.messages.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
          generationConfig: {
            temperature: input.temperature ?? 0.6,
            maxOutputTokens: input.maxOutputTokens ?? 512,
            topP: 0.9,
          },
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );
  } catch (error) {
    clearTimeout(timer);

    if (controller.signal.aborted) {
      throw new GeminiUnavailableError(
        "timeout",
        `Model ${model} melewati batas ${config.timeoutMs} ms.`,
      );
    }

    throw new GeminiUnavailableError(
      "unavailable",
      `Gagal menghubungi Gemini (${model}): ${
        error instanceof Error ? error.message : "kesalahan jaringan"
      }`,
    );
  }

  // Timer tetap aktif saat membaca body agar koneksi yang menggantung juga
  // dibatalkan, bukan hanya saat menunggu header response.
  const raw = await response.text().catch(() => "");
  clearTimeout(timer);
  let payload: unknown = null;
  if (raw !== "") {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = readErrorMessage(payload) || `HTTP ${response.status}`;

    if (response.status === 401 || response.status === 403) {
      throw new GeminiUnavailableError("not-configured", message);
    }

    if (response.status === 429) {
      throw new GeminiUnavailableError(
        "quota",
        message,
        readRetryAfterSeconds(payload, response.headers.get("retry-after")),
      );
    }

    if (response.status === 400 && /api key not valid/i.test(message)) {
      throw new GeminiUnavailableError("not-configured", message);
    }

    throw new GeminiUnavailableError(
      "unavailable",
      `Model ${model} menolak permintaan (${response.status}): ${message.slice(0, 240)}`,
    );
  }

  const blocked = readBlockedReason(payload);
  if (blocked) {
    throw new GeminiUnavailableError(
      "blocked",
      `Permintaan diblokir oleh filter keamanan (${blocked}).`,
    );
  }

  const { text, finishReason } = readCandidateText(payload);
  if (text) return text;

  if (finishReason === "SAFETY" || finishReason === "PROHIBITED_CONTENT") {
    throw new GeminiUnavailableError(
      "blocked",
      `Balasan diblokir oleh filter keamanan (${finishReason}).`,
    );
  }

  throw new GeminiUnavailableError(
    "unavailable",
    `Model ${model} tidak menghasilkan teks (finish: ${finishReason ?? "kosong"}).`,
  );
}

/** Prioritas alasan agar pesan ke pengguna paling relevan. */
function failurePriority(error: GeminiUnavailableError): number {
  switch (error.reason) {
    case "quota":
      return 4;
    case "timeout":
      return 3;
    case "not-configured":
      return 2;
    case "blocked":
      return 2;
    default:
      return 1;
  }
}

export async function generateText(
  input: GenerateTextInput,
): Promise<GenerateTextResult> {
  const config = readConfig();
  let lastFailure: GeminiUnavailableError | null = null;

  for (const [index, model] of config.models.entries()) {
    try {
      const text = await requestModel(model, input, config);
      return { text, model, usedFallback: index > 0 };
    } catch (error) {
      if (!(error instanceof GeminiUnavailableError)) throw error;

      // Kunci salah atau permintaan diblokir tidak akan membaik dengan model
      // lain, jadi langsung hentikan rantai fallback.
      if (
        error.reason === "not-configured" ||
        error.reason === "blocked"
      ) {
        throw error;
      }

      console.warn(
        `[ai] ${model} gagal (${error.reason}): ${error.message.slice(0, 240)}`,
      );

      if (
        !lastFailure ||
        failurePriority(error) > failurePriority(lastFailure)
      ) {
        lastFailure = error;
      }
    }
  }

  throw (
    lastFailure ??
    new GeminiUnavailableError(
      "unavailable",
      "Semua model Gemini gagal merespons.",
    )
  );
}
