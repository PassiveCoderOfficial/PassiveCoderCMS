import { createAdminClient } from "@/lib/supabase/server";

/** Returns a valid access token for the tenant's connected Google account,
 *  refreshing it against Google's token endpoint first if the cached one has
 *  expired (or is about to, inside a minute — avoids a token dying mid a
 *  multi-call report fetch). Returns null if never connected or the refresh
 *  itself fails (revoked grant, deleted Cloud project, etc). */
export async function getValidGoogleAccessToken(tenantId: string): Promise<string | null> {
  const admin = await createAdminClient();
  // tenant_integrations, not site_settings — site_settings is public-read
  // (every page renders from it), so OAuth secrets stored there were
  // readable by anyone with the anon key. See migration 101.
  const { data: settings } = await admin
    .from("tenant_integrations")
    .select("ga_oauth_refresh_token, ga_oauth_access_token, ga_oauth_expires_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!settings?.ga_oauth_refresh_token) return null;

  const stillValid = settings.ga_oauth_access_token && settings.ga_oauth_expires_at
    && new Date(settings.ga_oauth_expires_at).getTime() - Date.now() > 60_000;
  if (stillValid) return settings.ga_oauth_access_token;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: settings.ga_oauth_refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    // A refresh failure most often means the tenant revoked our access from
    // their Google account — not something to retry, just report "not
    // connected" upstream. We don't clear the stored refresh_token here so
    // the Analytics page can still show "connected as x@gmail.com" and let
    // them explicitly disconnect/reconnect rather than silently losing the
    // record of what was connected.
    return null;
  }

  await admin
    .from("tenant_integrations")
    .update({
      ga_oauth_access_token: json.access_token,
      ga_oauth_expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    })
    .eq("tenant_id", tenantId);

  return json.access_token as string;
}
