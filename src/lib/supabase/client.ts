import { createBrowserClient } from "@supabase/ssr";
import { getCookieDomain } from "./cookie-domain";

export function createClient() {
  const domain = getCookieDomain();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    domain ? { cookieOptions: { domain } } : undefined,
  );
}
