import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyState } from "@/lib/analytics/google-oauth-state";
import { bingExchangeCode, setupBing } from "@/lib/seo/bing";

export const maxDuration = 60;

/**
 * Bing returns here after the owner approves. Stores the tokens, then runs
 * the whole setup (add site, verification tag, verify, sitemap) so the owner
 * lands on a finished state; a setup failure is shown with a retry button.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const proto = root.includes("localhost") ? "http" : "https";
  const state = verifyState(sp.get("state") ?? "");
  if (!state) return NextResponse.redirect(`${proto}://${root}/dashboard/settings/seo?bing=expired`);

  const admin = await createAdminClient();
  const { data: t } = await admin.from("tenants").select("slug, custom_domain, domain_status").eq("id", state.tenantId).maybeSingle();
  const host = t?.custom_domain && t.domain_status === "active" ? t.custom_domain : t?.slug === root.split(".")[0] ? root : `${t?.slug}.${root}`;
  const back = (q: string) => NextResponse.redirect(`${proto}://${host}/dashboard/settings/seo?${q}`);
  if (sp.get("error") || !sp.get("code")) return back("bing=cancelled");

  try {
    const tok = await bingExchangeCode(sp.get("code")!);
    if (!tok.refresh_token) throw new Error("Bing didn't grant ongoing access");
    await admin.from("tenant_integrations").upsert({
      tenant_id: state.tenantId, bing_refresh_token: tok.refresh_token, bing_access_token: tok.access_token,
      bing_expires_at: new Date(Date.now() + (tok.expires_in ?? 3600) * 1000).toISOString(), bing_error: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
  } catch (e) {
    console.error("[bing-callback]", e instanceof Error ? e.message : e);
    return back(`bing=error&msg=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
  try { await setupBing(admin, state.tenantId); }
  catch (e) { console.error("[bing] setup after connect", e instanceof Error ? e.message : e); }
  return back("bing=connected");
}
