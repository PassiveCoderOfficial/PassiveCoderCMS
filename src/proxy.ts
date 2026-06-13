import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveTenant } from "@/lib/tenant/resolve";
import { isSaaS, ROOT_DOMAIN } from "@/lib/flags";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // In standalone mode, skip tenant resolution entirely
  if (!isSaaS) return updateSession(request);

  // Pass through static assets and API routes without tenant checks
  const isInternal = pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon");
  if (isInternal) return updateSession(request);

  // Marketing / root domain — no tenant needed
  // Compare both with and without port so ROOT_DOMAIN="localhost:3000" matches host="localhost:3000"
  // and ROOT_DOMAIN="example.com" matches host="example.com" or "www.example.com"
  const hostname = host.split(":")[0].toLowerCase();
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase();
  const isRootDomain = host.toLowerCase() === ROOT_DOMAIN.toLowerCase() ||
    hostname === rootHostname ||
    hostname === `www.${rootHostname}`;
  if (isRootDomain) return updateSession(request);

  // Resolve tenant from host header
  const tenant = await resolveTenant(host);

  if (!tenant) {
    const url = request.nextUrl.clone();
    url.pathname = "/not-found";
    return NextResponse.rewrite(url);
  }

  // Suspended (trial expired) — redirect to upgrade page
  if (tenant.status === "suspended") {
    const url = request.nextUrl.clone();
    url.pathname = "/trial-expired";
    return NextResponse.rewrite(url);
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

  return updateSession(request, headers);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
