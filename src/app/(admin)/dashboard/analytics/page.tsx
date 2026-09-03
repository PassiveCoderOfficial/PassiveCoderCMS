import { getCurrentTenantId } from "@/lib/tenant/current";
import { createAdminClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

/**
 * Own-data analytics — reads page_view_stats (081_page_analytics.sql)
 * directly for the initial 30-day render, then hands off to the client
 * component for range switching (fetches /api/analytics from there).
 *
 * Doing the first paint server-side rather than an initial client fetch
 * avoids a loading-skeleton flash for the most common case (opening the
 * page with the default range) while keeping every subsequent range change
 * a normal client fetch.
 */
export default async function AnalyticsPage() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: rows } = await admin
    .from("page_view_stats")
    .select("day, path, referrer_domain, device_type, country, views")
    .eq("tenant_id", tenantId)
    .gte("day", sinceStr);

  // GA connection status only — the actual measurement ID is never sent to
  // the client, same reasoning as any other write-only secret field.
  const { data: gaSettings } = await admin
    .from("site_settings")
    .select("ga_measurement_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  return (
    <AnalyticsClient
      initialRows={rows ?? []}
      initialRange={30}
      gaConnected={!!gaSettings?.ga_measurement_id}
    />
  );
}
