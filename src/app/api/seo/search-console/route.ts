import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { hasGscScopes, inspectPages, resubmitSitemap, searchPerformance, setupSearchConsole, siteHomeUrl } from "@/lib/seo/search-console";

export const maxDuration = 60;

/** Search Console state for the SEO page, with 28-day search performance once set up. */
export async function GET() {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const { data: i } = await a.admin.from("tenant_integrations")
    .select("ga_oauth_refresh_token, ga_oauth_connected_email, google_scopes, gsc_site_url, gsc_verified_at, gsc_sitemap_at, gsc_error, gsc_index")
    .eq("tenant_id", a.tenantId).maybeSingle();
  const siteUrl = await siteHomeUrl(a.admin, a.tenantId);
  const base = {
    googleConnected: !!i?.ga_oauth_refresh_token,
    email: i?.ga_oauth_connected_email ?? null,
    scopesGranted: hasGscScopes(i?.google_scopes),
    siteUrl,
    // Set up for a different address (e.g. before the custom domain went live): redo it.
    setUp: !!i?.gsc_verified_at && i?.gsc_site_url === siteUrl,
    verifiedAt: i?.gsc_verified_at ?? null,
    sitemapAt: i?.gsc_sitemap_at ?? null,
    error: i?.gsc_error ?? null,
    index: i?.gsc_index ?? null,
  };
  if (!base.setUp || !siteUrl) return NextResponse.json(base);
  try {
    return NextResponse.json({ ...base, performance: await searchPerformance(a.tenantId, siteUrl) });
  } catch (e) {
    return NextResponse.json({ ...base, performanceError: e instanceof Error ? e.message : "Couldn't load search data" });
  }
}

/** Actions: setup (verify + add + sitemap), sitemap (resubmit), inspect (index status of pages). */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { action } = await req.json().catch(() => ({})) as { action?: string };
  try {
    if (action === "setup") return NextResponse.json(await setupSearchConsole(a.admin, a.tenantId));
    const { data: i } = await a.admin.from("tenant_integrations").select("gsc_site_url").eq("tenant_id", a.tenantId).maybeSingle();
    const siteUrl = i?.gsc_site_url as string | undefined;
    if (!siteUrl) return NextResponse.json({ error: "Set up Search Console first." }, { status: 400 });
    if (action === "sitemap") {
      await resubmitSitemap(a.tenantId, siteUrl);
      await a.admin.from("tenant_integrations").update({ gsc_sitemap_at: new Date().toISOString() }).eq("tenant_id", a.tenantId);
      return NextResponse.json({ ok: true });
    }
    if (action === "inspect") return NextResponse.json({ pages: await inspectPages(a.admin, a.tenantId, siteUrl) });
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Google request failed" }, { status: 502 });
  }
}
