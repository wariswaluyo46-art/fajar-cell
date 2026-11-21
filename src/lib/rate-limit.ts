import "server-only";

/**
 * Rate limiter in-memory reusable sisi server dengan batas memori terikat.
 *
 * Mencegah penyalahgunaan kuota AI, brute-force PIN admin, maupun spam mutasi.
 * Pada deployment multi-instance berskala besar, ganti backend Map ini ke Redis/Upstash.
 */

const MAX_BUCKETS = 2_000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function getClientKey(request: Request): string {
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const forwarded = request.headers.get("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();

  const candidate =
    vercelForwarded?.split(",")[0]?.trim() ||
    realIp?.trim() ||
    firstForwarded ||
    "local";

  return candidate.slice(0, 64) || "local";
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function ensureCapacity(now: number): void {
  if (buckets.size < MAX_BUCKETS) return;
  pruneExpired(now);

  // Evict oldest insertion-ordered entries if map is still full (guards against spoofed IP floods).
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey === undefined) break;
    buckets.delete(oldestKey);
  }
}

function computeRetryAfter(resetAt: number, now: number): number {
  return Math.max(1, Math.ceil((resetAt - now) / 1_000));
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    ensureCapacity(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: computeRetryAfter(bucket.resetAt, now),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Memeriksa status limit tanpa menambah hitungan (dipakai sebelum verifikasi PIN). */
export function getRateLimitStatus(
  key: string,
  limit: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (bucket) buckets.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: computeRetryAfter(bucket.resetAt, now),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/** Mencatat satu percobaan gagal pada jendela waktu yang sama. */
export function recordRateLimitAttempt(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    ensureCapacity(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
