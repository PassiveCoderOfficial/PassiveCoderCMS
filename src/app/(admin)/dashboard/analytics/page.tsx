import { getCurrentTenantId } from "@/lib/tenant/current";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AnalyticsClient } from "./analytics-client";

/**
 * Dashboard + Analytics merged onto one page (2026-09-14, per Wali) — this
 * used to be two separate sidebar destinations (a stats-cards/quick-actions
 * "Dashboard" and a visits/GA "Analytics"), which meant nobody landed on the
 * traffic panel by default even though it's been fully working with real
 * data since it shipped. Now the "Analytics" page renders everything: the
 * site-management summary (pages/orders/users, recent activity, quick
 * actions) at the top, own-data traffic panel below it, and the Google
 * Analytics OAuth connect card at the bottom.
 *
 * Own-data analytics reads page_view_stats (081_page_analytics.sql) directly
 * for the initial 30-day render, then hands off to the client component for
 * range switching (fetches /api/analytics from there). Doing the first paint
 * server-side avoids a loading-skeleton flash for the common case (opening
 * with the default range) while every subsequent range change stays a normal
 * client fetch.
 */
export default async function AnalyticsPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const admin = await createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  let showProSiteBanner = false;
  if (user) {
    const { data: pendingTenant } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "enm_pending")
      .maybeSingle();
    showProSiteBanner = !!pendingTenant;
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const [
    { data: rows },
    { data: gaSettings },
    { count: pageCount },
    { count: postCount },
    { count: orderCount },
    { count: productCount },
    { count: userCount },
    { data: recentOrders },
    { data: recentTransactions },
    { count: branchCount },
    { data: gaIntegration },
  ] = await Promise.all([
    admin.from("page_view_stats").select("day, path, referrer_domain, device_type, country, views").eq("tenant_id", tenantId).gte("day", sinceStr),
    // Non-secret GA fields (measurement id, picked property) live in
    // site_settings; the connected email + tokens live in
    // tenant_integrations (service-role only, see migration 101). Tokens
    // themselves are never selected here or sent to the client.
    admin.from("site_settings").select("ga_measurement_id, ga_property_id").eq("tenant_id", tenantId).maybeSingle(),
    supabase.from("pages").select("*", { count: "exact", head: true }).eq("type", "page").eq("tenant_id", tenantId),
    supabase.from("pages").select("*", { count: "exact", head: true }).eq("type", "post").eq("tenant_id", tenantId),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("products").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("tenant_members").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
    supabase.from("orders").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(5),
    // tenant_id filter is required, not just RLS: RLS lets super admins read
    // every tenant, so without it an SA viewing one tenant's dashboard saw
    // the whole platform's latest transactions mixed in.
    supabase.from("transactions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(5),
    // Restaurant sales analytics section only makes sense for a tenant
    // actually running the restaurant stack — same "does this tenant have
    // any branches" signal used elsewhere (kitchen/page.tsx's empty state).
    supabase.from("restaurant_branches").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId).eq("is_active", true),
    admin.from("tenant_integrations").select("ga_oauth_connected_email").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  return (
    <AnalyticsClient
      tenantId={tenantId}
      initialRows={rows ?? []}
      initialRange={30}
      gaConnected={!!gaSettings?.ga_measurement_id}
      gaMeasurementId={gaSettings?.ga_measurement_id ?? null}
      gaOAuthEmail={gaIntegration?.ga_oauth_connected_email ?? null}
      gaPropertyId={gaSettings?.ga_property_id ?? null}
      showProSiteBanner={showProSiteBanner}
      dashboardStats={{
        pageCount: pageCount ?? 0,
        postCount: postCount ?? 0,
        orderCount: orderCount ?? 0,
        productCount: productCount ?? 0,
        userCount: userCount ?? 0,
      }}
      recentOrders={recentOrders ?? []}
      recentTransactions={recentTransactions ?? []}
      hasRestaurantBranches={(branchCount ?? 0) > 0}
    />
  );
}
