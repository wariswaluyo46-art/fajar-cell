/** Re-ekspor utilitas rate limit bersama agar modul AI tetap kompatibel. */
export {
  checkRateLimit,
  getClientKey,
  type RateLimitResult,
} from "@/lib/rate-limit";
