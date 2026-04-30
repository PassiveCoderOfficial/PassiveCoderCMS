import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const CMS_MODE = process.env.NEXT_PUBLIC_CMS_MODE ?? "standalone";
const isSaaS = CMS_MODE === "saas";
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAdminRoute && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user && !request.nextUrl.searchParams.get("error")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
        `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(subdomain)}&select=id,status&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const tenants: { id: string; status: string }[] = await res.json();
      const tenant = tenants?.[0];

      if (!tenant) {
        return new NextResponse("Site not found", { status: 404 });
      }

      if (tenant.status === "suspended" || tenant.status === "cancelled") {
        return new NextResponse("This site is suspended", { status: 403 });
      }

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot|css|js)$).*)",
  ],
};
