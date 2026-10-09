import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { siteHomeUrl } from "@/lib/seo/search-console";
import { bingConfigured, bingStats, bingSubmitSitemap, setupBing } from "@/lib/seo/bing";

export const maxDuration = 60;

/** Bing connection state, with 28-day Bing search data once set up. */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { data: i } = await a.admin.from("tenant_integrations")
    .select("bing_refresh_token, bing_site_url, bing_verified_at, bing_sitemap_at, bing_error").eq("tenant_id", a.tenantId).maybeSingle();
  const siteUrl = await siteHomeUrl(a.admin, a.tenantId);
  const norm = (u?: string | null) => (u ?? "").replace(/\/$/, "").toLowerCase();
  const base = {
    configured: bingConfigured(), connected: !!i?.bing_refresh_token, siteUrl,
    setUp: !!i?.bing_verified_at && norm(i?.bing_site_url) === norm(siteUrl),
    sitemapAt: i?.bing_sitemap_at ?? null, error: i?.bing_error ?? null,
  };
  if (!base.setUp) return NextResponse.json(base);
  try { return NextResponse.json({ ...base, stats: await bingStats(a.tenantId, i!.bing_site_url as string) }); }
  catch (e) { return NextResponse.json({ ...base, statsError: e instanceof Error ? e.message : "Couldn't load Bing data" }); }
}

/** Actions: setup (retry), sitemap (resubmit), disconnect. */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { action } = await req.json().catch(() => ({})) as { action?: string };
  try {
    if (action === "setup") return NextResponse.json(await setupBing(a.admin, a.tenantId));
    if (action === "disconnect") {
      await a.admin.from("tenant_integrations").update({ bing_refresh_token: null, bing_access_token: null, bing_expires_at: null, bing_site_url: null, bing_verified_at: null, bing_error: null }).eq("tenant_id", a.tenantId);
      return NextResponse.json({ ok: true });
    }
    if (action === "sitemap") {
      const { data: i } = await a.admin.from("tenant_integrations").select("bing_site_url").eq("tenant_id", a.tenantId).maybeSingle();
      if (!i?.bing_site_url) return NextResponse.json({ error: "Set up Bing first." }, { status: 400 });
      await bingSubmitSitemap(a.tenantId, i.bing_site_url as string);
      await a.admin.from("tenant_integrations").update({ bing_sitemap_at: new Date().toISOString() }).eq("tenant_id", a.tenantId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bing request failed" }, { status: 502 });
  }
}
