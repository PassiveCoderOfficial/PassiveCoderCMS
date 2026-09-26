import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";
import { createAdminClient } from "@/lib/supabase/server";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const BASE = `https://${ROOT}`;

/**
 * Every tenant subdomain and custom domain served the SAME hardcoded
 * platform-marketing sitemap (agents/onboarding/templates/... under
 * passivecoder.com) — this file never looked at the request at all.
 * A client's real pages were never listed for any search engine, and a
 * custom-domain client's sitemap.xml pointed crawlers at a different
 * company's URLs entirely. Confirmed live on sgpfloorrepair.com. Found in
 * the 2026-09-26 production audit.
 *
 * Now: resolve the tenant from the request host first. A real tenant gets
 * its own published pages, each URL built from ITS OWN real address
 * (custom domain if attached, else its subdomain) via the same publicUrl()
 * used by the dashboard's Visit Site links — one source of truth for "what
 * is this tenant's real address" the sitemap can't drift from. No tenant
 * (root domain, or SaaS mode off) falls through to the original
 * platform-marketing list.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host") ?? "";
  const tenant = await resolveTenant(host);

  if (tenant) {
    const admin = await createAdminClient();
    const { data: pages } = await admin
      .from("pages")
      .select("slug, updated_at, type")
      .eq("tenant_id", tenant.id)
      .eq("status", "published")
      .is("deleted_at", null);

    const site = { slug: tenant.slug, custom_domain: tenant.custom_domain };
    return (pages ?? []).map((p) => ({
      url: publicUrl(site, p.slug === "home" ? "/" : `/${p.slug}`),
      lastModified: p.updated_at ?? new Date().toISOString(),
      changeFrequency: (p.type === "post" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: p.slug === "home" ? 1 : 0.7,
    }));
  }

  const now = new Date().toISOString();
  return [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/agents`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/onboarding`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/templates`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/website-for-bangladeshi-businesses`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
