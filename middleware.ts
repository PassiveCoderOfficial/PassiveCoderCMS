import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isSaaS, ROOT_DOMAIN } from "@/lib/flags";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";

  if (isSaaS) {
    // Strip port for local dev comparisons
    const hostNoPort = hostname.replace(/:\d+$/, "");
    const rootNoPort = ROOT_DOMAIN.replace(/:\d+$/, "");

    // Check if this is a subdomain request (not the root domain, www, or localhost)
    const isSubdomain =
      hostNoPort !== rootNoPort &&
      hostNoPort !== `www.${rootNoPort}` &&
      hostNoPort.endsWith(`.${rootNoPort}`);

    if (isSubdomain) {
      const subdomain = hostNoPort.slice(0, hostNoPort.length - rootNoPort.length - 1);

      // Look up tenant by slug (subdomain) using service role to bypass RLS
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&select=id,status&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          // Cache for 10 s at the edge to reduce DB round-trips
          next: { revalidate: 10 },
        },
      );

      const tenants: { id: string; status: string }[] = await res.json();
      const tenant = tenants?.[0];

      if (!tenant) {
        // Unknown subdomain — show 404
        return new NextResponse("Site not found", { status: 404 });
      }

      if (tenant.status === "suspended" || tenant.status === "cancelled") {
        return new NextResponse("This site is suspended", { status: 403 });
      }

      // Inject tenant id so page/layout handlers can use it without re-querying
      const requestWithTenant = new NextRequest(request, {
        headers: { "x-tenant-id": tenant.id },
      });

      return updateSession(requestWithTenant);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, images, and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
