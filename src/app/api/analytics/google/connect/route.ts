import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { signState } from "@/lib/analytics/google-oauth-state";

/**
 * Kicks off real Google OAuth for "Connect Google Analytics" (2026-09-14,
 * supersedes the "no OAuth, no Reporting API pull" note in
 * 081_page_analytics.sql). Redirects to Google's consent screen with
 * analytics.readonly scope so we can later pull the tenant's own GA4 report
 * data via the Analytics Data API — the paste-your-Measurement-ID field
 * (site_settings.ga_measurement_id, still supported) only ever wrote data
 * OUT to the tenant's GA; this reads it back.
 *
 * The OAuth redirect_uri registered in Google Cloud Console must be a single
 * fixed URL (Google doesn't accept a wildcard across every tenant
 * subdomain), so the callback lives on the root domain — state carries the
 * tenant id and where to bounce back to, signed so a forged state can't
 * attach someone else's Google grant to a different tenant.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth is not configured on this deployment yet (missing GOOGLE_CLIENT_ID)." },
      { status: 503 },
    );
  }

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const proto = root.includes("localhost") ? "http" : "https";
  const redirectUri = `${proto}://${root}/api/analytics/google/callback`;

  const state = signState({ tenantId, userId: user.id, ts: Date.now() });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/analytics.readonly email");
  authUrl.searchParams.set("access_type", "offline"); // needed to get a refresh_token back
  authUrl.searchParams.set("prompt", "consent"); // forces a refresh_token even on a repeat connect
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
