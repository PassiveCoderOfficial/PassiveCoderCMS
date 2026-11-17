import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/tenant/site-urls";
import { submitIndexNow } from "@/lib/seo/indexnow";
import { inspectPages, platformGoogleReady, resubmitSitemap, setupSearchConsole } from "@/lib/seo/search-console";
import { contentPath } from "@/lib/posts/post-route";
import { rootTenantId } from "@/lib/site/root-builder";
import { rootPathOf } from "@/lib/pricing/hreflang";
import { ROOT_BASE } from "@/lib/seo/sitemap-entries";
import { bingSubmitSitemap } from "@/lib/seo/bing";

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
  const started = Date.now();

  const admin = await createAdminClient();
  const since = new Date(Date.now() - 26 * 3600_000).toISOString();
  const [{ data: pages }, { data: products }] = await Promise.all([
    admin.from("pages").select("tenant_id, slug, seo, type").eq("status", "published").is("deleted_at", null)
      .not("tenant_id", "is", null).gte("updated_at", since).limit(5000),
    admin.from("products").select("tenant_id, slug").eq("status", "active").gte("updated_at", since).limit(5000),
  ]);

  const byTenant = new Map<string, Set<string>>();
  const add = (t: string, path: string) => { if (!byTenant.has(t)) byTenant.set(t, new Set()); byTenant.get(t)!.add(path); };
  // The root site lives on the bare root domain with posts under /blog and
  // pages at their root paths, not on its tenant subdomain.
  const rootId = await rootTenantId().catch(() => null);
  const rootUrls: string[] = [];
  for (const p of pages ?? []) {
    if ((p.seo as { no_index?: boolean } | null)?.no_index) continue;
    if (p.tenant_id === rootId) {
      rootUrls.push(`${ROOT_BASE}${p.type === "post" ? `/blog/${p.slug}` : rootPathOf(p.slug as string)}`);
      continue;
    }
    add(p.tenant_id as string, contentPath({ slug: p.slug as string, type: p.type as string | null }));
  }
  for (const p of products ?? []) add(p.tenant_id as string, `/products/${p.slug}`);

  const ids = [...byTenant.keys()];
  const { data: tenants } = ids.length
    ? await admin.from("tenants").select("id, slug, custom_domain, domain_status, demo_expires_at").in("id", ids)
    : { data: [] };

  const summary: { sites: number; urls: number; failed: number; google?: number; bing?: number; inspected?: number; setUp?: number } = { sites: 0, urls: 0, failed: 0 };
  if (rootUrls.length) {
    const r = await submitIndexNow(new URL(ROOT_BASE).host, rootUrls);
    summary.sites++; summary.urls += rootUrls.length;
    if (!r.ok) { summary.failed++; console.warn("[indexnow] root", r.status); }
  }
  for (const t of tenants ?? []) {
    if (t.demo_expires_at) continue;
    const site = { slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null };
    const urls = [...byTenant.get(t.id as string)!].map((p) => publicUrl(site, p));
    const host = new URL(urls[0]).host;
    const r = await submitIndexNow(host, urls);
    summary.sites++; summary.urls += urls.length;
    if (!r.ok) { summary.failed++; console.warn("[indexnow]", host, r.status); }
  }
  // Google: sites set up in Search Console get their sitemap resubmitted
  // whenever something changed, so Google re-reads it promptly.
  if (rootId && rootUrls.length) ids.push(rootId);
  if (ids.length) {
    const { data: gsc } = await admin.from("tenant_integrations").select("tenant_id, gsc_site_url").in("tenant_id", ids).not("gsc_site_url", "is", null);
    for (const g of gsc ?? []) {
      try {
        if (await resubmitSitemap(g.tenant_id as string, g.gsc_site_url as string)) {
          await admin.from("tenant_integrations").update({ gsc_sitemap_at: new Date().toISOString() }).eq("tenant_id", g.tenant_id);
          summary.google = (summary.google ?? 0) + 1;
        }
      } catch (e) { console.warn("[gsc] sitemap", g.gsc_site_url, e instanceof Error ? e.message : e); }
    }
  }
  // Bing: same for sites connected through Bing Webmaster Tools.
  if (ids.length) {
    const { data: bs } = await admin.from("tenant_integrations").select("tenant_id, bing_site_url").in("tenant_id", ids).not("bing_site_url", "is", null);
    for (const b of bs ?? []) {
      try {
        await bingSubmitSitemap(b.tenant_id as string, b.bing_site_url as string);
        await admin.from("tenant_integrations").update({ bing_sitemap_at: new Date().toISOString() }).eq("tenant_id", b.tenant_id);
        summary.bing = (summary.bing ?? 0) + 1;
      } catch (e) { console.warn("[bing] sitemap", b.bing_site_url, e instanceof Error ? e.message : e); }
    }
  }
  // New sites: the platform's Google account sets up Search Console for a
  // few live sites that have none yet (owners can still use their own Google).
  try {
    if (await platformGoogleReady()) {
      const [{ data: live }, { data: have }] = await Promise.all([
        admin.from("tenants").select("id").eq("status", "active").is("demo_expires_at", null).order("created_at", { ascending: false }).limit(2000),
        admin.from("tenant_integrations").select("tenant_id, gsc_verified_at, gsc_error").limit(5000),
      ]);
      // Skip sites already set up or that failed before (retried from Super Admin).
      const skip = new Set((have ?? []).filter((h) => h.gsc_verified_at || h.gsc_error).map((h) => h.tenant_id as string));
      for (const t of (live ?? []).filter((t) => !skip.has(t.id as string)).slice(0, 5)) {
        if (Date.now() - started > 40_000) break;
        try { await setupSearchConsole(admin, t.id as string); summary.setUp = (summary.setUp ?? 0) + 1; }
        catch (e) { console.warn("[gsc] setup", t.id, e instanceof Error ? e.message : e); }
      }
    }
  } catch (e) { console.warn("[gsc] setup batch", e instanceof Error ? e.message : e); }
  // Google index check: every day, the sites whose "Pages in Google" report
  // is oldest get their next batch checked (missing pages daily, indexed
  // pages weekly), within what is left of this run's time.
  try {
    const { data: due } = await admin.from("tenant_integrations").select("tenant_id, gsc_site_url, gsc_index")
      .not("gsc_site_url", "is", null).not("gsc_verified_at", "is", null).limit(500);
    const oldest = (due ?? [])
      .map((d) => ({ ...d, at: new Date(((d.gsc_index as { at?: string } | null)?.at) ?? 0).getTime() }))
      .filter((d) => Date.now() - d.at > 20 * 3600_000)
      .sort((a, b) => a.at - b.at);
    for (const d of oldest) {
      const left = 100_000 - (Date.now() - started);
      if (left < 25_000) break;
      try {
        await inspectPages(admin, d.tenant_id as string, d.gsc_site_url as string, { max: 60, budgetMs: Math.min(40_000, left - 15_000) });
        summary.inspected = (summary.inspected ?? 0) + 1;
      } catch (e) { console.warn("[gsc] inspect", d.gsc_site_url, e instanceof Error ? e.message : e); }
    }
  } catch (e) { console.warn("[gsc] inspect batch", e instanceof Error ? e.message : e); }
  console.log("[indexnow]", JSON.stringify(summary));
  return NextResponse.json(summary);
}

export const GET = handle;
export const POST = handle;
