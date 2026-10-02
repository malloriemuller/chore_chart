interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const buckets = new Map<string, Bucket>();

/**
 * A best-effort, in-memory 5-attempts-per-minute limiter keyed by caller (e.g. IP).
 * Resets if the server process restarts; acceptable for a single-household app.
 */
export function registerPinAttempt(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) {
    return false;
  }
  bucket.count += 1;
  return true;
}

export function clientKeyFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
