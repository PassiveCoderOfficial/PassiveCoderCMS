import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { getValidGoogleAccessToken } from "@/lib/analytics/google";

/**
 * Live GA4 report pull (Analytics Data API runReport), only reached once a
 * tenant has connected + picked a property. Shape mirrors /api/analytics
 * (our own page_view_stats aggregation) closely enough that the Analytics
 * page can render either source through mostly the same UI — total,
 * per-day series, top pages, top referrers, devices, top countries.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = [7, 30, 90].includes(Number(searchParams.get("range"))) ? Number(searchParams.get("range")) : 30;

  const admin = await createAdminClient();
  const { data: settings } = await admin
    .from("site_settings")
    .select("ga_property_id")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!settings?.ga_property_id) {
    return NextResponse.json({ error: "No GA4 property selected" }, { status: 400 });
  }

  const accessToken = await getValidGoogleAccessToken(tenantId);
  if (!accessToken) {
    return NextResponse.json({ error: "Google Analytics connection is no longer valid — reconnect." }, { status: 409 });
  }

  const property = settings.ga_property_id; // "properties/123456789"
  const dateRange = { startDate: `${range}daysAgo`, endDate: "today" };

  async function runReport(body: Record<string, unknown>) {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`GA report failed: ${res.status}`);
    return res.json();
  }

  try {
    const [byDay, byPath, byReferrer, byDevice, byCountry] = await Promise.all([
      runReport({ dateRanges: [dateRange], dimensions: [{ name: "date" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
      runReport({ dateRanges: [dateRange], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
      runReport({ dateRanges: [dateRange], dimensions: [{ name: "sessionSource" }], metrics: [{ name: "sessions" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 10 }),
      runReport({ dateRanges: [dateRange], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }] }),
      runReport({ dateRanges: [dateRange], dimensions: [{ name: "country" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 }),
    ]);

    const rowsToBuckets = (json: { rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[] }) =>
      (json.rows ?? []).map(r => ({ key: r.dimensionValues[0].value, views: Number(r.metricValues[0].value) }));

    const seriesRaw = new Map<string, number>();
    for (const r of byDay.rows ?? []) {
      // GA4 returns date as YYYYMMDD — normalize to YYYY-MM-DD to match our
      // own /api/analytics series shape.
      const raw = r.dimensionValues[0].value;
      const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      seriesRaw.set(iso, Number(r.metricValues[0].value));
    }
    const series: { day: string; views: number }[] = [];
    let total = 0;
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = seriesRaw.get(key) ?? 0;
      total += v;
      series.push({ day: key, views: v });
    }

    return NextResponse.json({
      range, total, series,
      topPaths: rowsToBuckets(byPath),
      topReferrers: rowsToBuckets(byReferrer).filter(b => b.key && b.key !== "(direct)"),
      devices: rowsToBuckets(byDevice),
      topCountries: rowsToBuckets(byCountry),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Analytics data" }, { status: 502 });
  }
}
