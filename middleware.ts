import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const CMS_MODE = process.env.NEXT_PUBLIC_CMS_MODE ?? "standalone";
const isSaaS = CMS_MODE === "saas";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

const REF_COOKIE = "ref_code";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2;

async function updateSession(request: NextRequest) {
  // Inject pathname so server layouts can read it via headers() — merge onto
  // the existing header set rather than replacing it, so upstream headers
  // (e.g. x-tenant-id set by the subdomain-routing block below) survive.
  const mergedHeaders = new Headers(request.headers);
  mergedHeaders.set("x-pathname", request.nextUrl.pathname);
  const requestWithPathname = new NextRequest(request, { headers: mergedHeaders });
  request = requestWithPathname;
  // Next 16: NextResponse.next() must be given `{ request: { headers } }`
  // specifically, not `{ request }` (the whole NextRequest object) — passing
  // the whole request silently strips every request header downstream, which
  // is exactly the same gotcha already documented in
  // src/lib/supabase/middleware.ts's own updateSession (an unrelated,
  // same-named function). This was the actual reason x-pathname read back as
  // null in every server layout no matter how correctly it was set here:
  // set correctly, then discarded one line later by this call's shape.
  let supabaseResponse = NextResponse.next({ request: { headers: mergedHeaders } });

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
          // Same fix as above: { headers } specifically, or x-pathname (and
          // x-tenant-id, on the subdomain path) silently vanish from this
          // point on for any request that sets a Supabase cookie — which is
          // most authenticated requests, since session refresh runs here.
          supabaseResponse = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/") ||
    pathname === "/super-admin" || pathname.startsWith("/super-admin/");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Capture ?ref= param and store as persistent cookie — set AFTER supabase may have
  // replaced supabaseResponse in setAll, so it always lands on the final response.
  const refParam = request.nextUrl.searchParams.get("ref");
  if (refParam) {
    const cleaned = refParam.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 32);
    if (cleaned.length >= 3) {
      supabaseResponse.cookies.set(REF_COOKIE, cleaned, {
        maxAge: REF_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
    }
  }

  if (isAdminRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isVerifyPendingRoute = pathname.startsWith("/verify-pending");
  if (isAdminRoute && user && !isVerifyPendingRoute) {
    const { checkAndEnforceLock } = await import("@/lib/verification");
    const status = await checkAndEnforceLock(user.id);
    if (status?.locked) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/verify-pending";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Logged-in user hitting /login or /register — send them where they belong.
  // We don't know SA status here without a DB call, so redirect to /dashboard and
  // let the layout handle the SA→/super-admin redirect. Only bypass if an error
  // param is present (e.g. ?error=unauthorized — let them see the login page).
  if (isAuthRoute && user && !request.nextUrl.searchParams.get("error")) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
    // Avoid redirect loops: if redirectTo is itself an auth route, go to /dashboard.
    const safeRedirect = redirectTo.startsWith("/login") || redirectTo.startsWith("/register")
      ? "/dashboard"
      : redirectTo;
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";

  if (isSaaS) {
    const hostNoPort = hostname.replace(/:\d+$/, "");
    const rootNoPort = ROOT_DOMAIN.replace(/:\d+$/, "");

    const isSubdomain =
      hostNoPort !== rootNoPort &&
      hostNoPort !== `www.${rootNoPort}` &&
      hostNoPort.endsWith(`.${rootNoPort}`);


    if (isSubdomain) {
      const subdomain = hostNoPort.slice(0, hostNoPort.length - rootNoPort.length - 1);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&select=id,status,trial_ends_at&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const tenants: { id: string; status: string; trial_ends_at: string | null }[] = await res.json();
      const tenant = tenants?.[0];

      if (!tenant) {
        return new NextResponse("Site not found", { status: 404 });
      }

      if (tenant.status === "suspended" || tenant.status === "cancelled") {
        return new NextResponse("This site is suspended", { status: 403 });
      }

      if (
        tenant.status === "trial" &&
        tenant.trial_ends_at &&
        new Date(tenant.trial_ends_at).getTime() < Date.now()
      ) {
        return new NextResponse("This site's trial has expired.", { status: 403 });
      }

      // Merge onto the ORIGINAL headers rather than replacing them —
      // `new NextRequest(request, { headers: {...} })` takes `headers` as a
      // full replacement, not a patch, so this previously discarded every
      // header on the request except x-tenant-id. updateSession() below sets
      // x-pathname on whatever it's handed, so that header was silently
      // empty for every tenant-subdomain request — the exact case this
      // middleware exists for. Found via a real pageview quietly not being
      // recorded: x-pathname read back as null downstream for every path
      // except "/", which only "worked" because a local fallback happened to
      // produce the right value there by coincidence.
      const tenantHeaders = new Headers(request.headers);
      tenantHeaders.set("x-tenant-id", tenant.id);
      const requestWithTenant = new NextRequest(request, { headers: tenantHeaders });

      return updateSession(requestWithTenant);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
