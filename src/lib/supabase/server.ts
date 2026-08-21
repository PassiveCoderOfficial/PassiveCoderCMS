import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { withCookieDomain } from "./cookie-domain";

export async function createClient() {
  const cookieStore = await cookies();
  // The incoming request's own host — a tenant's custom domain must get a
  // host-only cookie. x-forwarded-host first: Vercel's edge network puts the
  // original client-facing host there, while `host` can be an internal one.
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, withCookieDomain(host, options)),
            );
          } catch {}
        },
      },
    },
  );
}

// Service-role client — bypasses RLS. No cookie context needed.
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
