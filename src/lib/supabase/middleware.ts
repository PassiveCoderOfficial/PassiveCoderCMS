import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withCookieDomain } from "./cookie-domain";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { ACTOR_HEADER, isPublicWrite, signActor, type ActorVia } from "./write-actor";

/** Don't let a slow key lookup hold a write: the action just goes unattributed. */
const ACTOR_LOOKUP_MS = 500;

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  // Next 16: request headers MUST be forwarded as `{ request: { headers } }`.
  // Passing the whole NextRequest strips all request headers downstream.
  const headers = requestHeaders ?? new Headers(request.headers);
  // Internal headers are only ever set here/in the proxy. Anything a browser
  // sent under these names is dropped (root-domain requests used to pass
  // them through untouched), then x-pathname is set from the real URL — the
  // dashboard layout's plan guard reads it, and without it that guard never
  // matched a path, so plan-gated pages were reachable by typing the URL.
  // The mobile app names the site it acts on with X-Tenant-Id; on API calls
  // that value moves to x-requested-tenant-id, which getApiCaller() only
  // honours after checking the caller's membership server-side.
  const requestedTenant = request.headers.get("x-tenant-id");
  headers.delete("x-requested-tenant-id");
  if (requestedTenant && request.nextUrl.pathname.startsWith("/api/")) {
    headers.set("x-requested-tenant-id", requestedTenant);
  }
  if (!requestHeaders) {
    for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan"]) headers.delete(h);
  }
  headers.delete("x-invoke-path");
  headers.delete(ACTOR_HEADER);
  // Hub markers are set only by the proxy's own rewrites (which don't come
  // through here); a browser-sent copy must never unlock hub routes.
  headers.delete("x-experts-host");
  headers.delete("x-food-host");
  headers.set("x-pathname", request.nextUrl.pathname);
  let supabaseResponse = NextResponse.next({ request: { headers } });
  // The host this specific request actually arrived on — a tenant's custom
  // domain must get a host-only cookie, never one scoped to the platform's
  // root domain, which the browser silently refuses on any other host.
  const host = request.nextUrl.hostname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, withCookieDomain(host, options)),
          );
        },
      },
    },
  );

  // Use getSession() in middleware — reads JWT from cookie, no network call.
  // Layout uses getUser() (network) for security. Middleware just needs to know
  // if a session token exists to route the request correctly.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Writes only: say who is asking, for the action list (lib/supabase/write-actor.ts).
  // getClaims checks the token's signature with cached public keys, no network per
  // request. The header was dropped above, so only this signed value can reach a route.
  if (request.method !== "GET" && request.method !== "HEAD" && !isPublicWrite(request.method, request.nextUrl.pathname)) {
    const bearer = /^Bearer\s+(ey[\w-]+\.[\w-]+\.[\w-]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
    const token = session?.access_token ?? bearer;
    const via: ActorVia = session ? "web" : "app";
    if (token) {
      const claims = await Promise.race([
        supabase.auth.getClaims(token).then((r) => r.data?.claims ?? null).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), ACTOR_LOOKUP_MS)),
      ]);
      if (typeof claims?.sub === "string") {
        headers.set(ACTOR_HEADER, signActor({ userId: claims.sub, via }));
        const stamped = NextResponse.next({ request: { headers } });
        supabaseResponse.cookies.getAll().forEach((c) => stamped.cookies.set(c));
        supabaseResponse = stamped;
      }
    }
  }

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAdminRoute && !session) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Respect ?redirect= param so users land on their intended page after login
  if (isAuthRoute && session && !request.nextUrl.searchParams.get("error")) {
    // Same-site paths only, so a sign-in link can never bounce to another site.
    const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get("redirect"), "/dashboard");
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}
