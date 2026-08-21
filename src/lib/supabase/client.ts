import { createBrowserClient } from "@supabase/ssr";
import { getCookieDomain } from "./cookie-domain";

export function createClient() {
  // The actual page host, not the platform's root domain — a tenant on their
  // own custom domain must get a host-only cookie, never one scoped to
  // passivecoder.com, which the browser would silently refuse to set at all.
  const host = typeof window !== "undefined" ? window.location.hostname : undefined;
  const domain = getCookieDomain(host);
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    domain ? { cookieOptions: { domain } } : undefined,
  );
}
