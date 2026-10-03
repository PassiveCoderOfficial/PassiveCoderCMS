import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  env: {
    // Sidebar footer "Passive Coder vX.Y.Z" reads this — package.json is the
    // single source of truth, bump it on every push (see CLAUDE.md).
    NEXT_PUBLIC_APP_VERSION: version,
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
        hostname: "mljchiaabgvdzdsfobxs.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // OAuth discovery for the MCP server (app/api/mcp). Clients probe both the
  // bare well-known path and one suffixed with the resource path.
  async rewrites() {
    return [
      { source: "/.well-known/oauth-protected-resource", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-protected-resource/:path*", destination: "/api/oauth/metadata/protected-resource" },
      { source: "/.well-known/oauth-authorization-server", destination: "/api/oauth/metadata/authorization-server" },
      { source: "/.well-known/oauth-authorization-server/:path*", destination: "/api/oauth/metadata/authorization-server" },
      { source: "/.well-known/openid-configuration", destination: "/api/oauth/metadata/authorization-server" },
    ];
  },
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
