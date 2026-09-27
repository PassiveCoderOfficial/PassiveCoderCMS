import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { withCookieDomain } from "./cookie-domain";

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  // Next 16: request headers MUST be forwarded as `{ request: { headers } }`.
  // Passing the whole NextRequest strips all request headers downstream.
  const headers = requestHeaders ?? new Headers(request.headers);
  // Internal headers are only ever set here/in the proxy. Anything a browser
  // sent under these names is dropped (root-domain requests used to pass
  // them through untouched), then x-pathname is set from the real URL — the
  // dashboard layout's plan guard reads it, and without it that guard never
  // matched a path, so plan-gated pages were reachable by typing the URL.
  if (!requestHeaders) {
    for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan"]) headers.delete(h);
  }
  headers.delete("x-invoke-path");
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
    const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}
