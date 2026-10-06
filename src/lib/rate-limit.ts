import { NextResponse } from "next/server";

interface RateLimitRule {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export const RATE_LIMITS = {
  contact: { limit: 5, windowMs: 10 * 60 * 1000 },
  newsletter: { limit: 5, windowMs: 10 * 60 * 1000 },
  login: { limit: 10, windowMs: 10 * 60 * 1000 },
  register: { limit: 10, windowMs: 60 * 60 * 1000 },
  forgotPassword: { limit: 5, windowMs: 60 * 60 * 1000 },
  checkout: { limit: 6, windowMs: 60 * 1000 },
  keyReveal: { limit: 40, windowMs: 10 * 60 * 1000 },
  orderRefresh: { limit: 30, windowMs: 60 * 1000 },
} satisfies Record<string, RateLimitRule>;

export type RateLimitBucket = keyof typeof RATE_LIMITS;

const MAX_TRACKED_KEYS = 10000;
const hits = new Map<string, number[]>();

function prune(now: number) {
  if (hits.size < MAX_TRACKED_KEYS) return;
  const longest = Math.max(...Object.values(RATE_LIMITS).map((rule) => rule.windowMs));
  for (const [key, stamps] of hits) {
    if (stamps.length === 0 || now - stamps[stamps.length - 1] > longest) hits.delete(key);
  }
  if (hits.size >= MAX_TRACKED_KEYS) {
    const overflow = hits.size - MAX_TRACKED_KEYS + 1;
    let removed = 0;
    for (const key of hits.keys()) {
      if (removed >= overflow) break;
      hits.delete(key);
      removed += 1;
    }
  }
}

export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

export function consumeRateLimit(bucket: RateLimitBucket, key: string, now = Date.now()): RateLimitResult {
  const rule = RATE_LIMITS[bucket];
  const id = `${bucket}:${key}`;
  const windowStart = now - rule.windowMs;
  const stamps = (hits.get(id) ?? []).filter((stamp) => stamp > windowStart);

  if (stamps.length >= rule.limit) {
    hits.set(id, stamps);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((stamps[0] + rule.windowMs - now) / 1000)) };
  }

  prune(now);
  stamps.push(now);
  hits.set(id, stamps);
  return { allowed: true, remaining: rule.limit - stamps.length, retryAfterSeconds: 0 };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.allowed) return null;
  return NextResponse.json(
    { code: "RATE_LIMITED", retryAfter: result.retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}

export function rateLimit(request: Request, bucket: RateLimitBucket, key?: string): NextResponse | null {
  const ip = clientIp(request);
  return rateLimitResponse(consumeRateLimit(bucket, key ? `${ip}:${key}` : ip));
}
