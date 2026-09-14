import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

/** Mirrors signState in connect/route.ts — verifies the state wasn't forged
 *  and hasn't expired (10 minutes, generous for a consent-screen round
 *  trip but not indefinitely replayable). */
function verifyState(state: string): { tenantId: string; userId: string } | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-insecure-secret";
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
    return { tenantId: payload.tenantId, userId: payload.userId };
  } catch {
    return null;
  }
}

function backToAnalytics(root: string, proto: string, tenantSlugOrRoot: string, query: string) {
  return NextResponse.redirect(`${proto}://${tenantSlugOrRoot}/dashboard/analytics?${query}`);
}

/**
 * Google's OAuth redirect target (single fixed URL registered in Cloud
 * Console — see connect/route.ts). Exchanges the auth code for tokens,
 * stores the refresh token, and bounces back to the originating tenant's
 * own Analytics page — property selection happens there once we know which
 * GA4 properties this Google account can see.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
  const proto = root.includes("localhost") ? "http" : "https";

  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  if (error || !code || !stateParam) {
    return NextResponse.redirect(`${proto}://${root}/dashboard/analytics?ga_error=${encodeURIComponent(error ?? "missing_code")}`);
  }

  const state = verifyState(stateParam);
  if (!state) {
    return NextResponse.redirect(`${proto}://${root}/dashboard/analytics?ga_error=invalid_state`);
  }

  const admin = await createAdminClient();
  const { data: tenant } = await admin.from("tenants").select("id, slug, custom_domain").eq("id", state.tenantId).maybeSingle();
  if (!tenant) {
    return NextResponse.redirect(`${proto}://${root}/dashboard/analytics?ga_error=tenant_not_found`);
  }
  const tenantHost = tenant.custom_domain || (tenant.slug === root.split(".")[0] ? root : `${tenant.slug}.${root}`);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return backToAnalytics(root, proto, tenantHost, "ga_error=not_configured");
  }

  const redirectUri = `${proto}://${root}/api/analytics/google/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    return backToAnalytics(root, proto, tenantHost, "ga_error=token_exchange_failed");
  }

  const { access_token, refresh_token, expires_in } = tokenJson as {
    access_token: string; refresh_token?: string; expires_in: number;
  };

  // Google only returns refresh_token on the FIRST consent (or with
  // prompt=consent forcing a fresh one, which connect/route.ts always sets)
  // — a missing one here means Google didn't grant offline access, not that
  // it's safe to proceed without it.
  if (!refresh_token) {
    return backToAnalytics(root, proto, tenantHost, "ga_error=no_refresh_token");
  }

  // Which Google account this is, purely for display on the Analytics page
  // so a tenant can tell which of their Google logins is connected.
  let connectedEmail: string | null = null;
  try {
    const meRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (meRes.ok) connectedEmail = (await meRes.json()).email ?? null;
  } catch {
    // Non-fatal — the connection still works without a display email.
  }

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  // upsert, not update — an older tenant predating the 025 upsert-on-signup
  // pattern might not have a site_settings row yet.
  const { error: dbError } = await admin
    .from("site_settings")
    .upsert({
      tenant_id: state.tenantId,
      ga_oauth_refresh_token: refresh_token,
      ga_oauth_access_token: access_token,
      ga_oauth_expires_at: expiresAt,
      ga_oauth_connected_email: connectedEmail,
      // A fresh connect always clears any previously-picked property — the
      // account that's now connected may not even have the old one.
      ga_property_id: null,
    }, { onConflict: "tenant_id" });

  if (dbError) {
    return backToAnalytics(root, proto, tenantHost, "ga_error=save_failed");
  }

  return backToAnalytics(root, proto, tenantHost, "ga_connected=1");
}
