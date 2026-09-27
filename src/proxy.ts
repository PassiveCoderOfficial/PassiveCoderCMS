import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveTenant } from "@/lib/tenant/resolve";
import { isSaaS, ROOT_DOMAIN } from "@/lib/flags";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // In standalone mode, skip tenant resolution entirely
  if (!isSaaS) return updateSession(request);

  // Marketing / root domain — no tenant needed
  // Compare both with and without port so ROOT_DOMAIN="localhost:3000" matches host="localhost:3000"
  // and ROOT_DOMAIN="example.com" matches host="example.com" or "www.example.com"
  const hostname = host.split(":")[0].toLowerCase();
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase();
  const isRootDomain = host.toLowerCase() === ROOT_DOMAIN.toLowerCase() ||
    hostname === rootHostname ||
    hostname === `www.${rootHostname}`;

  // API routes on tenant hosts still need x-tenant-id (public form submits,
  // booking widget, storefront checkout resolve the tenant from it) — inject
  // headers but skip the page-level redirects below.
  if (pathname.startsWith("/api/")) {
    if (!isRootDomain) {
      const tenant = await resolveTenant(host);
      if (tenant) {
        const headers = new Headers(request.headers);
        headers.set("x-tenant-id", tenant.id);
        headers.set("x-tenant-slug", tenant.slug);
        headers.set("x-tenant-plan", tenant.plan);
        return updateSession(request, headers);
      }
    }
    return updateSession(request);
  }

  // Pass through static assets without tenant checks
  const isInternal = pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  if (isInternal) return updateSession(request);

  if (isRootDomain) return updateSession(request);

  // Resolve tenant from host header
  const tenant = await resolveTenant(host);

  if (!tenant) {
    const url = request.nextUrl.clone();
    url.pathname = "/not-found";
    return NextResponse.rewrite(url);
  }

  // Paused (subscription ended / unpaid): visitors get a neutral "temporarily
  // unavailable" page with 503 so search engines keep the site indexed. The
  // owner's routes stay open — this used to rewrite EVERY path, /login and
  // /dashboard included, so the owner couldn't even sign in to pay.
  const OWNER_PATHS = ["/login", "/auth", "/dashboard", "/api", "/forgot-password", "/reset-password", "/signup", "/register"];
  if (tenant.status === "suspended" && !OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/site-paused";
    url.search = `?name=${encodeURIComponent(tenant.name)}`;
    const res = NextResponse.rewrite(url, { status: 503 });
    res.headers.set("Retry-After", "86400");
    return res;
  }

  // Staff-built demo past its preview window (72h): pause (never delete) until paid.
  const isDemo = !!tenant.demo_expires_at;
  if (isDemo && new Date(tenant.demo_expires_at!).getTime() < Date.now()) {
    const url = request.nextUrl.clone();
    url.pathname = "/demo-paused";
    url.search = `?name=${encodeURIComponent(tenant.name)}`;
    const res = NextResponse.rewrite(url);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Inject tenant headers so server components can read them
  const headers = new Headers(request.headers);
  headers.set("x-tenant-id", tenant.id);
  headers.set("x-tenant-slug", tenant.slug);
  headers.set("x-tenant-plan", tenant.plan);

  // Redirect to onboarding if not yet completed
  if (!tenant.onboarding_completed && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const res = await updateSession(request, headers);
  // Demos are previews for one prospect, not something to get indexed.
  if (isDemo) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
