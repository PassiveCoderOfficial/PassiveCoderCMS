import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const BASE = `https://${ROOT}`;

/**
 * Same bug as sitemap.ts: every tenant's robots.txt pointed crawlers at
 * passivecoder.com/sitemap.xml (the platform's own list) instead of the
 * tenant's real one — a client's actual pages were never discoverable via
 * their own robots.txt. Found in the 2026-09-26 production audit.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (tenant) {
    const site = { slug: tenant.slug, custom_domain: tenant.custom_domain };
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/"] }],
      sitemap: publicUrl(site, "/sitemap.xml"),
    };
  }

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
