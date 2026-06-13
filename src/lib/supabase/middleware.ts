import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  // Next 16: request headers MUST be forwarded as `{ request: { headers } }`.
  // Passing the whole NextRequest strips all request headers downstream.
  const headers = requestHeaders ?? new Headers(request.headers);
  let supabaseResponse = NextResponse.next({ request: { headers } });

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
            supabaseResponse.cookies.set(name, value, options),
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
