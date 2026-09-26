import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { getValidGoogleAccessToken } from "@/lib/analytics/google";

/** Connection state for the Analytics page: whether a Google account is
 *  attached, which one (for display), and the list of GA4 properties that
 *  account can see (via the Admin API) so the tenant can pick one — a
 *  Google login can have several GA4 properties, we don't guess. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  // OAuth secrets live in tenant_integrations (service-role only); the
  // non-secret property id stays in site_settings. See migration 101.
  const [{ data: integration }, { data: siteSettings }] = await Promise.all([
    admin
      .from("tenant_integrations")
      .select("ga_oauth_refresh_token, ga_oauth_connected_email")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    admin
      .from("site_settings")
      .select("ga_property_id")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);
  const settings = integration
    ? { ...integration, ga_property_id: siteSettings?.ga_property_id ?? null }
    : null;

  if (!settings?.ga_oauth_refresh_token) {
    return NextResponse.json({ connected: false });
  }

  const accessToken = await getValidGoogleAccessToken(tenantId);
  if (!accessToken) {
    // Grant revoked on Google's side — still "connected" in our record
    // (so the UI can offer disconnect/reconnect) but token-dead.
    return NextResponse.json({
      connected: true, tokenValid: false,
      email: settings.ga_oauth_connected_email, propertyId: settings.ga_property_id, properties: [],
    });
  }

  // GA4 Admin API: list every account, then every property under each —
  // there's no single "list all properties I can see" call.
  const properties: { id: string; displayName: string }[] = [];
  try {
    const accountsRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const accountsJson = await accountsRes.json();
    for (const account of accountsJson.accounts ?? []) {
      const propsRes = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties?filter=${encodeURIComponent(`parent:${account.name}`)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const propsJson = await propsRes.json();
      for (const p of propsJson.properties ?? []) {
        properties.push({ id: p.name, displayName: p.displayName ?? p.name });
      }
    }
  } catch {
    // Listing failed (rate limit, transient network) — connection itself is
    // still real, just can't offer the picker right now.
  }

  return NextResponse.json({
    connected: true, tokenValid: true,
    email: settings.ga_oauth_connected_email, propertyId: settings.ga_property_id, properties,
  });
}
