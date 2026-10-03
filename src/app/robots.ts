import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { resolveTenant } from "@/lib/tenant/resolve";
import { publicUrl } from "@/lib/tenant/site-urls";
import { createAdminClient } from "@/lib/supabase/server";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const BASE = `https://www.${ROOT}`;

/** Crawlers that fetch pages to cite them in AI answers. Always allowed:
 *  blocking them hides the site from ChatGPT search, Claude, Perplexity. */
const AI_SEARCH_BOTS = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Bingbot", "Googlebot"];
/** Crawlers that collect content to train models. Owners can opt out. */
const AI_TRAINING_BOTS = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Bytespider"];

/**
 * Sitemap points at the site's own sitemap (a 2026-09-26 audit found tenant
 * robots.txt pointing at the platform's). AI crawlers are named explicitly so
 * the policy is unambiguous: answer/search bots welcome, training bots per
 * the owner's "Allow AI training" setting.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  const tenant = await resolveTenant(host);
  const privatePaths = tenant ? ["/dashboard/", "/api/"] : ["/dashboard/", "/super-admin/", "/api/"];

  let allowTraining = true;
  if (tenant) {
    const admin = await createAdminClient();
    const { data } = await admin.from("site_settings").select("allow_ai_training").eq("tenant_id", tenant.id).maybeSingle();
    allowTraining = data?.allow_ai_training !== false;
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: privatePaths },
      { userAgent: AI_SEARCH_BOTS, allow: "/", disallow: privatePaths },
      allowTraining
        ? { userAgent: AI_TRAINING_BOTS, allow: "/", disallow: privatePaths }
        : { userAgent: AI_TRAINING_BOTS, disallow: "/" },
    ],
    sitemap: tenant ? publicUrl({ slug: tenant.slug, custom_domain: tenant.custom_domain }, "/sitemap.xml") : `${BASE}/sitemap.xml`,
  };
}
