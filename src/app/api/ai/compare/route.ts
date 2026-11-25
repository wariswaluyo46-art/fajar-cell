import { getCatalogSnapshot } from "@/lib/ai/catalog";
import {
  generateText,
  GeminiUnavailableError,
  parseStrictJson,
} from "@/lib/ai/gemini";
import { aiErrorResponse } from "@/lib/ai/http";
import { apiError, apiJson, readJsonBody } from "@/lib/api-response";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { formatRupiah } from "@/lib/utils";
import type {
  AiCompareCategoryWinner,
  AiCompareVerdict,
  Product,
} from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_048;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;
const ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeForCompare(product: Product): string {
  if (product.category === "aksesoris") {
    return `ID: ${product.id} | Nama: ${product.name} | Harga: ${formatRupiah(product.price)}`;
  }

  const parts = [
    `ID: ${product.id}`,
    `Nama: ${product.name}`,
    `Kategori: ${product.category}`,
    `Harga: ${formatRupiah(product.price)}`,
    `RAM/ROM: ${product.specs.ram}/${product.specs.storage}GB`,
    `Chipset: ${product.specs.chipset ?? "-"}`,
    `Layar: ${product.specs.screen ?? "-"}`,
    `Kamera: ${product.specs.camera ?? "-"}`,
    `Kamera Depan: ${product.specs.frontCamera ?? "-"}`,
    `Baterai: ${product.specs.battery ? `${product.specs.battery}mAh` : "-"}`,
    `Jaringan: ${product.specs.network ?? "-"}`,
    `OS: ${product.specs.os ?? "-"}`,
    `Garansi: ${product.warranty.active ? `${product.warranty.durationDays} hari` : "tidak ada"}`,
  ];

  if (product.category === "handphone-bekas") {
    parts.push(
      `Kondisi: ${product.condition.grade}, minus ${product.condition.minusCount}, BH ${product.condition.batteryHealth ?? "-"}%`,
    );
  }

  return parts.join(" | ");
}

function sanitizeWinner(
  raw: unknown,
  first: Product,
  second: Product,
): AiCompareCategoryWinner {
  const byId = new Map<string, Product>([
    [first.id, first],
    [second.id, second],
  ]);

  if (isRecord(raw)) {
    const rawId = typeof raw.winnerId === "string" ? raw.winnerId.trim() : "";
    const matched = byId.get(rawId) ?? first;
    const reason =
      typeof raw.reason === "string" && raw.reason.trim() !== ""
        ? raw.reason.trim().slice(0, 180)
        : "Unggul berdasarkan perbandingan spesifikasi dan harga.";
    return {
      winnerId: matched.id,
      winnerName: matched.name,
      reason,
    };
  }

  return {
    winnerId: first.id,
    winnerName: first.name,
    reason: "Pilihan seimbang berdasarkan spesifikasi utama.",
  };
}

export async function POST(request: Request): Promise<Response> {
  const limit = checkRateLimit(
    `ai-compare:${getClientKey(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    const response = apiError(
      `Terlalu banyak permintaan analisis perbandingan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
      429,
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return response;
  }

  const body = await readJsonBody(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  if (
    !isRecord(body.value) ||
    !Array.isArray(body.value.productIds) ||
    body.value.productIds.length !== 2
  ) {
    return apiError("Pilih tepat 2 produk untuk dibandingkan.", 400);
  }

  const [rawA, rawB] = body.value.productIds;
  const idA = typeof rawA === "string" ? rawA.trim() : "";
  const idB = typeof rawB === "string" ? rawB.trim() : "";

  if (!ID_PATTERN.test(idA) || !ID_PATTERN.test(idB) || idA === idB) {
    return apiError("ID 2 produk harus valid dan berbeda.", 400);
  }

  const { products } = await getCatalogSnapshot();
  const productA = products.find((p) => p.id === idA);
  const productB = products.find((p) => p.id === idB);

  if (!productA || !productB) {
    return apiError("Salah satu produk tidak ditemukan di katalog.", 404);
  }

  const systemPrompt = `Kamu adalah analis gadget senior Konter Fajar Cell. Bandingkan 2 HP berikut secara objektif hanya berdasarkan data yang diberikan.

Balas HANYA JSON valid dengan format persis:
{
  "summary": "Ringkasan perbandingan jujur 2-3 kalimat Bahasa Indonesia.",
  "winnerByCategory": {
    "gaming": { "winnerId": "id_pemenang", "reason": "alasan singkat maks 15 kata" },
    "battery": { "winnerId": "id_pemenang", "reason": "alasan singkat maks 15 kata" },
    "camera": { "winnerId": "id_pemenang", "reason": "alasan singkat maks 15 kata" },
    "parents": { "winnerId": "id_pemenang", "reason": "alasan singkat maks 15 kata" },
    "value": { "winnerId": "id_pemenang", "reason": "alasan singkat maks 15 kata" }
  }
}
Pastikan winnerId selalu persis salah satu dari "${productA.id}" atau "${productB.id}".`;

  const userPrompt = `Produk 1: ${describeForCompare(productA)}\nProduk 2: ${describeForCompare(productB)}`;

  try {
    const result = await generateText({
      system: systemPrompt,
      messages: [{ role: "user", text: userPrompt }],
      temperature: 0.3,
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    });

    const parsed = parseStrictJson<Record<string, unknown>>(result.text);
    if (!parsed || !isRecord(parsed)) {
      throw new GeminiUnavailableError(
        "unavailable",
        "AI tidak menghasilkan perbandingan yang valid.",
      );
    }

    const rawWinners = isRecord(parsed.winnerByCategory)
      ? parsed.winnerByCategory
      : {};

    const verdict: AiCompareVerdict = {
      summary:
        typeof parsed.summary === "string" && parsed.summary.trim() !== ""
          ? parsed.summary.trim().slice(0, 400)
          : `${productA.name} dan ${productB.name} memiliki keunggulan masing-masing sesuai kebutuhan dan budget Anda.`,
      winnerByCategory: {
        gaming: sanitizeWinner(rawWinners.gaming, productA, productB),
        battery: sanitizeWinner(rawWinners.battery, productA, productB),
        camera: sanitizeWinner(rawWinners.camera, productA, productB),
        parents: sanitizeWinner(rawWinners.parents, productA, productB),
        value: sanitizeWinner(rawWinners.value, productA, productB),
      },
    };

    return apiJson({ success: true, verdict, model: result.model });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
