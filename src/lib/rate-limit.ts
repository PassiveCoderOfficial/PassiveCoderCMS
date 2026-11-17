/**
 * Per-IP rate limit for public endpoints (contact forms, subscribe, stock
 * alerts, reviews, bookings). In-memory per server instance, so it blunts
 * bursts and scripted spam rather than guaranteeing a global ceiling; that is
 * enough for forms. Pair with honeypots where the form has one.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
let sweptAt = 0;

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** True when this key has exceeded `max` hits in the last `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - sweptAt > 60_000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    sweptAt = now;
  }
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > max;
}

/**
 * True when this key has already used up `max` hits in its window. Does not
 * count a hit itself: for "N wrong tries, then locked" checks, where only a
 * failure is counted (rateLimited) but every try must be refused once locked.
 */
export function isLimited(key: string, max: number): boolean {
  const b = buckets.get(key);
  return !!b && b.resetAt >= Date.now() && b.count >= max;
}

/** Ready-made 429 for route handlers: `const r = tooMany(req, "subscribe", 5); if (r) return r;` */
export function tooMany(req: Request, scope: string, max: number, windowMs = 10 * 60_000): Response | null {
  if (!rateLimited(`${scope}:${clientIp(req)}`, max, windowMs)) return null;
  return Response.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } });
}
