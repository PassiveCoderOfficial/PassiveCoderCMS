import { MetadataRoute } from "next";

const BASE = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com"}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/super-admin/", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
