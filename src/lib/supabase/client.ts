import { createBrowserClient } from "@supabase/ssr";
import { getCookieDomain } from "./cookie-domain";
import { requestUrl, writeScope } from "./write-scope";

/*
 * Editors that save from the browser go straight to Supabase, so the server
 * never learns the public site changed. After a successful content write we
 * tell it (api/cache/invalidate), batched so a burst of saves is one call.
 */
let pending: Set<string> | null = null;
function reportWrite(ids: string[]) {
  const first = !pending;
  pending ??= new Set();
  for (const id of ids) pending.add(id);
  if (!first) return;
  setTimeout(() => {
    const tenantIds = [...(pending ?? [])];
    pending = null;
    fetch("/api/cache/invalidate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenantIds }), keepalive: true }).catch(() => {});
  }, 800);
}

const cacheAwareFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const method = (init?.method ?? "GET").toUpperCase();
  if (res.ok && method !== "GET" && method !== "HEAD") {
    const ids = writeScope(requestUrl(input), init?.body);
    if (ids) reportWrite(ids);
  }
  return res;
};

export function createClient() {
  // The actual page host, not the platform's root domain — a tenant on their
  // own custom domain must get a host-only cookie, never one scoped to
  // passivecoder.com, which the browser would silently refuse to set at all.
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  const domain = getCookieDomain(host);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: cacheAwareFetch }, ...(domain ? { cookieOptions: { domain } } : {}) },
  );
}
