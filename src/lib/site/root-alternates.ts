import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { hreflangFor } from "@/lib/pricing/hreflang";

/** Slugs of every published page of a tenant, once per request: hreflang
 *  alternates only list pages that exist. */
export const publishedSlugs = cache(async (tenantId: string): Promise<Set<string>> => {
  const admin = await createAdminClient();
  const { data } = await admin.from("pages").select("slug").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).limit(5000);
  return new Set((data ?? []).map((p) => p.slug as string));
});

/** Country/language alternates of a root-site page as hreflang → path,
 *  only for pages that are published. */
export async function rootAlternates(tenantId: string, slug: string): Promise<Record<string, string>> {
  const slugs = await publishedSlugs(tenantId);
  return hreflangFor(slug, async (s) => slugs.has(s));
}
