import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { exchangeCode, fetchOrg, readState, type ZohoConn } from "@/lib/email/zoho";

/**
 * Zoho returns here after the owner approves. The signed state carries the
 * site and user; Zoho says which data centre the account lives in. The
 * refresh token is stored server-side only.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const state = readState(sp.get("state") ?? "");
  const fallback = new URL("/dashboard/settings/email", req.url);
  if (!state) return NextResponse.redirect(`${fallback}?zoho=expired`);
  const back = new URL(state.r);
  if (sp.get("error") || !sp.get("code")) return NextResponse.redirect(`${back}?zoho=cancelled`);

  try {
    const accountsServer = sp.get("accounts-server") || "https://accounts.zoho.com";
    if (!/^https:\/\/accounts\.zoho\.[a-z.]+$/.test(accountsServer)) throw new Error("Unexpected Zoho server");
    const tok = await exchangeCode(sp.get("code")!, accountsServer, sp.get("location") ?? "us");
    const conn: ZohoConn = { tenant_id: state.t, dc: tok.dc, accounts_server: accountsServer, refresh_token: tok.refreshToken, zoid: null, org_name: null };
    const org = await fetchOrg(conn, tok.accessToken);
    const admin = await createAdminClient();
    await admin.from("email_zoho_connections").upsert({
      tenant_id: state.t, dc: tok.dc, accounts_server: accountsServer, refresh_token: tok.refreshToken,
      zoid: org.zoid, org_name: org.name, connected_by: state.u, connected_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    // Zoho is now this site's mailbox provider, with its region set.
    await admin.from("tenant_email_settings").upsert({
      tenant_id: state.t, provider: "zoho",
      zoho_region: ["com", "in", "eu", "com.au"].includes(tok.dc) ? tok.dc : "com",
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });
    return NextResponse.redirect(`${back}?zoho=connected`);
  } catch (e) {
    console.error("[zoho-callback]", e instanceof Error ? e.message : e);
    return NextResponse.redirect(`${back}?zoho=error&msg=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
}
