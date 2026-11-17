import type { NextConfig } from "next";
import { readdirSync } from "node:fs";
import path from "node:path";
import { version } from "./package.json";

/**
 * Every top-level path segment that has a real route (route groups walked
 * through, dynamic folders skipped) plus every public/ entry. The proxy only
 * rewrites a root-domain path to a root-site builder page when its first
 * segment is NOT in this list (lib/site/root-paths.ts), so a builder page can
 * never shadow a coded route, and a new route folder is picked up on build.
 */
function topLevelRouteSegments(): string[] {
  // "media": the storage rewrite below.
  const out = new Set<string>(["media"]);
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith("(")) walk(path.join(dir, e.name));
      else if (!/^[[_@]/.test(e.name)) out.add(e.name.toLowerCase());
    }
  };
  walk(path.join(process.cwd(), "src/app"));
  try { for (const e of readdirSync(path.join(process.cwd(), "public"))) out.add(e.toLowerCase()); } catch { /* no public dir */ }
  return [...out].sort();
}

// Hosted Passive Coder sets NEXT_PUBLIC_CMS_MODE=saas; anything else runs the
// single-site (standalone) code paths (lib/flags.ts). Say so at build time, so
// a hosted deploy that lost the variable is noticed in the build log.
if (process.env.NEXT_PUBLIC_CMS_MODE !== "saas" && process.env.NEXT_PUBLIC_CMS_MODE !== "standalone") {
  console.warn(`[config] NEXT_PUBLIC_CMS_MODE is ${process.env.NEXT_PUBLIC_CMS_MODE ? `"${process.env.NEXT_PUBLIC_CMS_MODE}"` : "not set"}: running as a single-site (standalone) install. Set it to "saas" or "standalone".`);
}

const nextConfig: NextConfig = {
  // Self-hosted Docker image only (Dockerfile sets NEXT_OUTPUT_STANDALONE=1):
  // a self-contained .next/standalone server. Unset on Vercel, so the hosted
  // build is exactly as before.
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  env: {
    // Sidebar footer "Passive Coder vX.Y.Z" reads this — package.json is the
    // single source of truth, bump it on every push (see CLAUDE.md).
    NEXT_PUBLIC_APP_VERSION: version,
    ROOT_STATIC_SEGMENTS: topLevelRouteSegments().join(","),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "52mb",
    },
  },
  images: {
    // Only our own storage bucket goes through Vercel's (metered) optimizer.
    // This used to allow every host, which made /_next/image an open resize
    // proxy anyone could burn the quota through. Every <Image> now goes via
    // components/ui/smart-image.tsx, which sends Unsplash/Pexels to their own
    // free CDN resizing and serves any other host unoptimized — so nothing
    // legitimate needs another host here. Local /public files are always
    // allowed.
    remotePatterns: [
      {
        protocol: "https",
        // The install's own Supabase project (self-hosted installs have their own).
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co").hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Site media is served from each site's own domain (/media/..., a rewrite
    // to storage) with a cache-busting ?v=. Next 16 rejects local images with
    // a query string unless allowed here, which broke every uploaded image
    // (INVALID_IMAGE_OPTIMIZE_REQUEST). `search` omitted = any query allowed.
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/**", search: "" }],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // OAuth discovery for the MCP server (app/api/mcp). Clients probe both the
  // bare well-known path and one suffixed with the resource path.
  async rewrites() {
    return [
      // Site media on the site's own domain (lib/media/site-media.ts).
      { source: "/media/:path*", destination: `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co").replace(/\/$/, "")}/storage/v1/object/public/media/:path*` },
      { source: "/.well-known/oauth-protected-resource", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-authorization-server", destination: "/api/oauth/metadata/authorization-server" },
      { source: "/.well-known/oauth-authorization-server/:path*", destination: "/api/oauth/metadata/authorization-server" },
      { source: "/.well-known/openid-configuration", destination: "/api/oauth/metadata/authorization-server" },
    ];
  },
  async redirects() {
    return [
      // Saudi pages moved 2026-10-23: English is the bare country path.
      { source: "/sa/en", destination: "/sa", permanent: true },
      { source: "/sa/en/:path*", destination: "/sa/:path*", permanent: true },
      // Exact /dashboard -> analytics as a plain HTTP redirect, before any
      // render. The page-level redirect() it replaces fired mid-stream after
      // the dashboard shell had started rendering, which turned it into a
      // client-side navigation — a second request that, when it failed right
      // after login, left users on /dashboard with an error screen.
      {
        source: "/dashboard",
        destination: "/dashboard/analytics",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/dashboard/:path*",
        permanent: false,
      },
      // Sidebar group parents that have no page of their own (audit 2026-10-18).
      { source: "/dashboard/templates", destination: "/dashboard/templates/colors", permanent: false },
      { source: "/dashboard/ecommerce", destination: "/dashboard/ecommerce/products", permanent: false },
      { source: "/dashboard/real-estate", destination: "/dashboard/real-estate/properties", permanent: false },
      { source: "/dashboard/marketplace", destination: "/dashboard/marketplace/vendors", permanent: false },
    ];
  },
  async headers() {
    // Baseline security headers (audit 2026-10-18). No frame-ancestors /
    // X-Frame-Options on public pages: sites are previewed in frames (the
    // mobile app's page editor) and embedded by their owners.
    //
    // The panels themselves (dashboard, super admin, staff portal) may only be
    // framed by their own host or the platform's own hosts, so another site,
    // a tenant subdomain included, cannot lay one under a fake page and
    // trick a signed-in person into clicking (clickjacking). Nothing frames a
    // panel URL today: the page builder's preview is a blank same-origin
    // frame the builder draws into, which this header does not touch.
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "").trim();
    const scheme = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(rootDomain) ? "http" : "https";
    let appOrigin = "";
    try { appOrigin = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").origin; } catch { /* not set */ }
    const panelAncestors = [...new Set(["'self'", ...(rootDomain ? [`${scheme}://${rootDomain}`, `${scheme}://www.${rootDomain}`] : []), ...(appOrigin && appOrigin !== "null" ? [appOrigin] : [])])].join(" ");
    const panelFrameRule = { key: "Content-Security-Policy", value: `frame-ancestors ${panelAncestors}` };
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(self), microphone=(self), display-capture=(self), geolocation=(self), payment=(self)" },
      ],
    }, {
      source: "/dashboard/:path*",
      headers: [panelFrameRule],
    }, {
      source: "/super-admin/:path*",
      headers: [panelFrameRule],
    }, {
      source: "/staff/:path*",
      headers: [panelFrameRule],
    }, {
      // Uploaded files are served on every site's own domain (the /media
      // rewrite above), and uploads may be SVG or carry any content type. Opened
      // directly, such a file would run its scripts as that site (and read the
      // signed-in session). "sandbox" gives the file its own throwaway origin
      // with scripts off; images, video and fonts used by pages are unaffected.
      // Headers are matched on the incoming path, before rewrites.
      source: "/media/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: "sandbox" },
      ],
    }, {
      // PDFs: browsers' built-in PDF viewers do not open inside a sandbox, so
      // these get "no scripts" instead (later rules override earlier ones). A
      // file that only pretends to be a PDF still cannot run script.
      source: "/media/:path(.*\\.pdf)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: "script-src 'none'; base-uri 'none'; form-action 'none'" },
      ],
    }];
  },
};

export default nextConfig;
