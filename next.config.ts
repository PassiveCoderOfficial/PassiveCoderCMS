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
  async redirects() {
    return [
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
