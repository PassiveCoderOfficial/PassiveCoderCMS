import { NextResponse, NextRequest, type NextFetchEvent } from "next/server";
import { countRedirectHit, findRedirect, isReservedPath, rootTenantId } from "@/lib/redirects";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveBrandHost, resolveTenant } from "@/lib/tenant/resolve";
import { getStandaloneTenant } from "@/lib/tenant/standalone";
import { APP_URL, isSaaS, ROOT_DOMAIN, ROOT_TENANT_SLUG } from "@/lib/flags";
import { apiOriginVerdict } from "@/lib/security/api-origin";
import { mailShortcutFor } from "@/lib/tenant/mail-shortcuts";
import { EXPERTS_ORIGIN, LEGACY_HOSTS, legacyExpertsPath } from "@/lib/experts/legacy-redirect";
import { hubCookie, isHubLanding } from "@/modules/registry/food-delivery/attribution";
import { PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN } from "@/lib/supabase/public-render-token";
import { rootRouteFor } from "@/lib/site/root-paths";

/*
 * Anonymous public page views get their Supabase reads cached, and keep
 * rendering from the last good copy while the database is down
 * (lib/supabase/public-cache.ts). Only plain GETs of public pages from
 * visitors who are not signed in: owners, carts, checkouts, accounts,
 * bookings and every API stay live.
 */
const LIVE_PATHS = /^\/(?:dashboard|api|auth|login|signup|register|onboarding|super-admin|staff|vendor|provider|agent|kiosk|account|checkout|cart|order-confirmation|marketplace-checkout|forgot-password|reset-password|invoice|invoices|receipts|drop|oauth|table|verify|book|pm)(?:\/|$)/;
function markPublicRender(request: NextRequest, headers: Headers) {
  headers.delete(PUBLIC_RENDER_HEADER);
  if (request.method !== "GET" && request.method !== "HEAD") return;
  if (LIVE_PATHS.test(request.nextUrl.pathname)) return;
  if (request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"))) return;
  headers.set(PUBLIC_RENDER_HEADER, PUBLIC_RENDER_TOKEN);
}

/** Site redirect rule for this path (Settings > Redirects), or null. */
async function siteRedirect(request: NextRequest, event: NextFetchEvent | undefined, tenantId: string | null) {
  if (!tenantId || (request.method !== "GET" && request.method !== "HEAD") || isReservedPath(request.nextUrl.pathname)) return null;
  const hit = await findRedirect(tenantId, request.nextUrl.pathname);
  if (!hit) return null;
  const counting = countRedirectHit(hit.rule.id).catch(() => {});
  if (typeof event?.waitUntil === "function") event.waitUntil(counting);
  const dest = new URL(hit.to, request.url);
  if (!/^https?:/i.test(hit.to)) dest.search = request.nextUrl.search;
  return NextResponse.redirect(dest, hit.rule.status_code === 302 ? 302 : 301);
}

/*
 * Bot traffic (2026-10-19). Scanners ask every site for random images
 * (example.com/mmuy.png) and old WordPress URLs (/2025/12/03/slot-...).
 * Each one rendered the full site layout, about 30 database queries, just
 * to answer 404; together with real traffic that was enough to knock the
 * database over several times in one morning. Answer them here instead.
 */
const FILE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp)$/i;
const PUBLIC_DIR = /^\/(?:_next|_vercel|images|branding|brands|dashboard-shots|downloads|fonts|portfolio|media|icons|templates)\//;
const PUBLIC_ROOT_FILE = /^\/(?:pwa-icon(?:-180)?\.png|apple-icon\.png|favicon\.ico|(?:file|globe|next|vercel|window)\.svg)$/;
/** WordPress and script-kiddie paths no site on the platform serves. Checked
 *  after the site's own redirects, so imported sites keep their 301s. */
const LEGACY_JUNK = /^\/(?:wp-|xmlrpc\.php)|\.(?:php|asp|aspx|env|bak|sql)$|^\/\d{4}\/\d{2}\/(?:\d{2}\/)?[^/]+\/?$/i;
const gone = () => new NextResponse("Gone", { status: 410, headers: { "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex" } });

/** Root-site pages in another language, served from app/(marketing)/root-lang. */
const ROOT_LANG = /^\/(ar|bn)(\/|$)/;

/** First-run setup (standalone only): app/setup and api/setup. */
const SETUP_PATH = /^\/(?:api\/)?setup(?:\/|$)/;
/** Hosted sign-up and site creation: no such thing on a single-site install. */
const SAAS_SIGNUP = /^\/(?:register|signup|onboarding)(?:\/|$)/;

/*
 * Standalone (self-hosted) mode: the install serves exactly one site, so every
 * request gets that site's x-tenant-* headers (pages and /api alike) and the
 * same redirects, junk filter and public-render marking as a SaaS tenant host.
 * Before the site exists (first run) everything goes to /setup.
 */
async function standaloneProxy(request: NextRequest, event?: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return updateSession(request);

  let tenant: Awaited<ReturnType<typeof getStandaloneTenant>>;
  try {
    tenant = await getStandaloneTenant();
  } catch {
    // The installer must still open when the database does not answer or has
    // no tables yet: its system check is what tells the owner why. Its routes
    // decide for themselves who may use them (lib/installer/server.ts) and
    // refuse once a site exists.
    if (SETUP_PATH.test(pathname)) {
      const bare = new Headers(request.headers);
      for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan"]) bare.delete(h);
      // No session refresh: Supabase itself may be what is missing.
      return NextResponse.next({ request: { headers: bare } });
    }
    return new NextResponse("Database unavailable. If you are installing this site, open /setup to see what is wrong.", { status: 503, headers: { "Retry-After": "30" } });
  }

  const headers = new Headers(request.headers);
  // A visitor's own x-tenant-* headers never get through.
  for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan"]) headers.delete(h);

  if (!tenant) {
    if (SETUP_PATH.test(pathname)) return updateSession(request, headers);
    if (isApi) return NextResponse.json({ error: "This site has not been set up yet." }, { status: 503 });
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Set up already: the setup page and sign-up flows lead to sign-in.
  if (!isApi && (SETUP_PATH.test(pathname) || SAAS_SIGNUP.test(pathname))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // Root-site internals are a hosted-platform feature.
  if (/^\/root-(?:lang|page)(?:\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/not-found";
    return NextResponse.rewrite(url);
  }

  headers.set("x-tenant-id", tenant.id);
  headers.set("x-tenant-slug", tenant.slug);
  headers.set("x-tenant-plan", tenant.plan);
  if (isApi) return updateSession(request, headers);

  markPublicRender(request, headers);
  const r = await siteRedirect(request, event, tenant.id);
  if (r) return r;
  if (LEGACY_JUNK.test(pathname)) return gone();
  return updateSession(request, headers);
}

/**
 * Cross-site writes to the API (lib/security/api-origin.ts): a request that
 * carries cookies and an Origin from someone else's website is refused.
 * Returns the 403, or null to carry on.
 */
async function crossSiteApiWrite(request: NextRequest): Promise<NextResponse | null> {
  let appHost: string | null = null;
  try { appHost = new URL(APP_URL).host; } catch { /* not set */ }
  const v = apiOriginVerdict({
    method: request.method,
    pathname: request.nextUrl.pathname,
    origin: request.headers.get("origin"),
    hasCookies: !!request.headers.get("cookie"),
    requestHosts: [request.headers.get("host"), request.headers.get("x-forwarded-host"), request.nextUrl.host],
    appHost,
    rootDomain: ROOT_DOMAIN,
  });
  if (v.verdict === "allow") return null;
  // The Origin is a verified custom domain: allowed only for a request
  // addressed to that same site (its subdomain or another of its domains),
  // never to another site or to the platform's own hosts. A partner's
  // dashboard domain calls its own host, which passed above as "same host".
  // Not on a single-site install: there every host resolves to the one site.
  if (v.verdict === "lookup" && isSaaS && /^[a-z0-9.-]+$/.test(v.host)) {
    const from = await resolveTenant(v.host).catch(() => null);
    const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
    const to = from ? await resolveTenant(requestHost).catch(() => null) : null;
    if (from && to && from.id === to.id) return null;
  }
  return NextResponse.json({ error: "This request came from another website and was blocked." }, { status: 403 });
}

export async function proxy(request: NextRequest, event?: NextFetchEvent) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const isApiPath = pathname === "/api" || pathname.startsWith("/api/");

  // Image paths: real public files go straight through; anything else is a
  // file that does not exist (site images live in storage, under /media).
  // Never /api: an API path that merely ends in ".png" must still go through
  // the session and header handling below (a visitor's own x-tenant-id and
  // other internal headers are stripped there).
  if (!isApiPath && FILE_EXT.test(pathname)) {
    if (PUBLIC_DIR.test(pathname) || PUBLIC_ROOT_FILE.test(pathname)) return NextResponse.next();
    return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
  }

  if (isApiPath) {
    const blocked = await crossSiteApiWrite(request);
    if (blocked) return blocked;
  }

  if (!isSaaS) return standaloneProxy(request, event);

  // Marketing / root domain — no tenant needed
  // Compare both with and without port so ROOT_DOMAIN="localhost:3000" matches host="localhost:3000"
  // and ROOT_DOMAIN="example.com" matches host="example.com" or "www.example.com"
  const hostname = host.split(":")[0].toLowerCase();
  const rootHostname = ROOT_DOMAIN.split(":")[0].toLowerCase();
  const isRootDomain = host.toLowerCase() === ROOT_DOMAIN.toLowerCase() ||
    hostname === rootHostname ||
    hostname === `www.${rootHostname}`;

  // ExpertNear.Me is retired: permanent redirect into the Experts directory.
  if (LEGACY_HOSTS.has(hostname)) {
    return NextResponse.redirect(`${EXPERTS_ORIGIN}${legacyExpertsPath(pathname)}`, 301);
  }

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

  // Bare domain is the main address: www pages move to passivecoder.com.
  // /api stays on www (handled above) so the mobile apps, WordPress plugin and
  // payment webhooks that call www keep working. Only on when CANONICAL_APEX=1,
  // set together with the Vercel domain change (else apex->www would loop).
  if (process.env.CANONICAL_APEX === "1" && hostname === `www.${rootHostname}` && !pathname.startsWith("/.well-known/")) {
    const url = request.nextUrl.clone();
    url.host = rootHostname;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Experts directory (experts.passivecoder.com): served from app/experts-site,
  // no tenant. The marker header lets those routes refuse other hosts.
  if (hostname === `experts.${rootHostname}` || hostname === "experts.localhost") {
    const expertsHeaders = new Headers(request.headers);
    for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan", "x-food-host"]) expertsHeaders.delete(h);
    expertsHeaders.set("x-experts-host", "1");
    expertsHeaders.set("x-pathname", pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/experts-site${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers: expertsHeaders } });
  }

  // Food delivery hub (restaurant.passivecoder.com): served from app/food-site,
  // no tenant. Same pattern as the experts host above.
  if (hostname === `restaurant.${rootHostname}` || hostname === "restaurant.localhost") {
    const foodHeaders = new Headers(request.headers);
    for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan", "x-experts-host"]) foodHeaders.delete(h);
    foodHeaders.set("x-food-host", "1");
    foodHeaders.set("x-pathname", pathname);
    const url = request.nextUrl.clone();
    url.pathname = `/food-site${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers: foodHeaders } });
  }

  if (isRootDomain) {
    const r = await siteRedirect(request, event, await rootTenantId(ROOT_TENANT_SLUG).catch(() => null));
    if (r) return r;
    if (LEGACY_JUNK.test(pathname)) return gone();
    const rootHeaders = new Headers(request.headers);
    // A visitor's own x-tenant-* headers must never reach the root site
    // (updateSession only strips them when it builds the headers itself).
    for (const h of ["x-tenant-id", "x-tenant-slug", "x-tenant-plan"]) rootHeaders.delete(h);
    markPublicRender(request, rootHeaders);
    let res = await updateSession(request, rootHeaders);
    // The root site's Arabic/Bangla pages live under app/(marketing)/root-lang:
    // as plain /ar and /bn folders they would outrank every tenant's own
    // /[lang]/shop and /[lang]/products routes.
    // Root-site builder pages and blog posts with no route folder of their
    // own (/blog, /<post-slug>) render from app/(marketing)/root-page; the
    // (site) catch-all has no tenant on this host and would 404 them.
    // app/(marketing)/root-page itself is internal: never served directly.
    const internalRootPage = pathname === "/root-page" || pathname.startsWith("/root-page/");
    const route = !internalRootPage && !ROOT_LANG.test(pathname) ? await rootRouteFor(pathname) : null;
    // Old /<post-slug> address of a blog post: now /blog/<post-slug>.
    if (route && "redirect" in route) {
      const dest = request.nextUrl.clone();
      dest.pathname = route.redirect;
      return NextResponse.redirect(dest, 301);
    }
    const builderSlug = route ? route.slug : null;
    if (ROOT_LANG.test(pathname) || builderSlug || internalRootPage) {
      const url = request.nextUrl.clone();
      url.pathname = internalRootPage ? "/not-found" : builderSlug ? `/root-page/${builderSlug}` : `/root-lang${pathname}`;
      const rewritten = NextResponse.rewrite(url, { request: { headers: rootHeaders } });
      res.cookies.getAll().forEach((c) => rewritten.cookies.set(c));
      res = rewritten;
    }
    const resell = request.nextUrl.searchParams.get("resell")?.trim();
    // ?ref= referral links were removed 2026-10-26 (reseller-only program).
    // Reseller sign-up link: the new site is resold by that partner.
    if (resell && /^[A-Za-z0-9]{4,32}$/.test(resell)) {
      res.cookies.set("resell_code", resell, { maxAge: 60 * 60 * 24 * 90, path: "/", sameSite: "lax", secure: true, httpOnly: true, domain: `.${rootHostname}` });
    }
    return res;
  }

  // Root-site language and builder pages are internal to the root domain.
  if (/^\/root-(?:lang|page)(?:\/|$)/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/not-found";
    return NextResponse.rewrite(url);
  }

  // Resolve tenant from host header
  const tenant = await resolveTenant(host);

  if (!tenant) {
    // A white-label partner's dashboard domain (panel.agency.com): their
    // clients sign in and use the dashboard there, under the partner's brand.
    const brandPartner = await resolveBrandHost(host);
    if (brandPartner) {
      if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", request.url));
      const headers = new Headers(request.headers);
      headers.set("x-brand-partner", brandPartner);
      return updateSession(request, headers);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/not-found";
    return NextResponse.rewrite(url);
  }

  // Alias domain (renovation.example.com): everything 301s to the main
  // domain under the alias's section, unless the site's own redirects map
  // this old path somewhere more precise (/plumbing -> /renovation/plumbing).
  if (tenant.alias) {
    const { prefix, primaryHost } = tenant.alias;
    const p = pathname === "/" ? "" : pathname.replace(/\/+$/, "");
    const already = !prefix || p === `/${prefix}` || p.startsWith(`/${prefix}/`);
    const sectionPath = already ? p || "/" : `/${prefix}${p}`;
    let to = sectionPath;
    if (p && !isReservedPath(p)) {
      // Old sub-domain paths: the section's own rule (/industry/contact) wins;
      // a bare-path rule (/plumbing -> renovation/plumbing) only when it
      // points into a section, so shared rules (contact -> contact-us) don't
      // send section visitors to the main site's page.
      const own = await findRedirect(tenant.id, sectionPath).catch(() => null);
      const bare = own || already ? null : await findRedirect(tenant.id, p).catch(() => null);
      const hit = own ?? (bare && (bare.to.replace(/^\/+/, "") === prefix || /^\/?[^/]+\/./.test(bare.to) || /^https?:/i.test(bare.to)) ? bare : null);
      if (hit) {
        to = hit.to;
        const counting = countRedirectHit(hit.rule.id).catch(() => {});
        if (typeof event?.waitUntil === "function") event.waitUntil(counting);
      }
    }
    const dest = new URL(to, `https://${primaryHost}`);
    if (!/^https?:/i.test(to)) dest.search = request.nextUrl.search;
    return NextResponse.redirect(dest, 301);
  }

  // Email shortcuts (/webmail, /mail, /cpanel) for sites whose email stayed
  // with their old host: lib/tenant/mail-shortcuts.ts.
  const mailTo = mailShortcutFor(tenant, request.method, pathname);
  if (mailTo) return NextResponse.redirect(mailTo, 302);

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

  // Passive Coder AI account (plan "ai", migration 246): no website. Every
  // public path and the dashboard home go to its API keys screen.
  if (tenant.plan === "ai" && (!OWNER_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) || pathname === "/dashboard" || pathname === "/dashboard/analytics")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/api-keys";
    url.search = "";
    return NextResponse.redirect(url, 307);
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
  markPublicRender(request, headers);

  const r = await siteRedirect(request, event, tenant.id);
  if (r) return r;
  if (LEGACY_JUNK.test(pathname)) return gone();

  // Redirect to onboarding if not yet completed
  if (!tenant.onboarding_completed && !pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const res = await updateSession(request, headers);
  // Demos and free trials are not finished sites: keep them out of search.
  if (isDemo || tenant.trial_ends_at) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  // Food hub attribution: a visit from restaurant.passivecoder.com (?via=hub)
  // marks this browser on the restaurant's own site for 30 days.
  if (isHubLanding(request.nextUrl.searchParams)) res.cookies.set(hubCookie);
  return res;
}

export const config = {
  matcher: [
    // Images included: unknown image paths are answered at the top of proxy().
    "/((?!_next/static|_next/image).*)",
  ],
};
