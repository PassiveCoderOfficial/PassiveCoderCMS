import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/tenant/site-urls";
import { submitIndexNow } from "@/lib/seo/indexnow";

export const maxDuration = 120;

/**
 * Daily: tell Bing (via IndexNow) about every page, post and product
 * published or updated in the last ~day, grouped per site host. ChatGPT
 * search and Copilot answer from Bing's index, so new content reaches them
 * in days instead of weeks. Demo sites are skipped (they're temporary).
 */
async function handle(req: Request) {
  const bearer = req.headers.get("authorization");
  const viaCron = !!process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`;
  const viaManual = !!process.env.INTERNAL_CRON_SECRET && req.headers.get("x-cron-secret") === process.env.INTERNAL_CRON_SECRET;
  if (!viaCron && !viaManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  const since = new Date(Date.now() - 26 * 3600_000).toISOString();
  const [{ data: pages }, { data: products }] = await Promise.all([
    admin.from("pages").select("tenant_id, slug, seo").eq("status", "published").is("deleted_at", null)
      .not("tenant_id", "is", null).gte("updated_at", since).limit(5000),
    admin.from("products").select("tenant_id, slug").eq("status", "active").gte("updated_at", since).limit(5000),
  ]);

  const byTenant = new Map<string, Set<string>>();
  const add = (t: string, path: string) => { if (!byTenant.has(t)) byTenant.set(t, new Set()); byTenant.get(t)!.add(path); };
  for (const p of pages ?? []) {
    if ((p.seo as { no_index?: boolean } | null)?.no_index) continue;
    add(p.tenant_id as string, p.slug === "home" ? "/" : `/${p.slug}`);
  }
  for (const p of products ?? []) add(p.tenant_id as string, `/products/${p.slug}`);

  const ids = [...byTenant.keys()];
  const { data: tenants } = ids.length
    ? await admin.from("tenants").select("id, slug, custom_domain, domain_status, demo_expires_at").in("id", ids)
    : { data: [] };

  const summary = { sites: 0, urls: 0, failed: 0 };
  for (const t of tenants ?? []) {
    if (t.demo_expires_at) continue;
    const site = { slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null };
    const urls = [...byTenant.get(t.id as string)!].map((p) => publicUrl(site, p));
    const host = new URL(urls[0]).host;
    const r = await submitIndexNow(host, urls);
    summary.sites++; summary.urls += urls.length;
    if (!r.ok) { summary.failed++; console.warn("[indexnow]", host, r.status); }
  }
  console.log("[indexnow]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const GET = handle;
export const POST = handle;
