import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";

/**
 * Dashboard analytics — reads from page_view_stats (081_page_analytics.sql),
 * our own aggregate pageview table. Everything here is derived server-side
 * from daily-bucketed rows; there is no per-visitor data to query in the
 * first place, so no query here can leak anything more granular than "N
 * views on day D for path P".
 *
 * `range` selects a trailing window in days — 7, 30 or 90. Kept small and
 * fixed rather than an arbitrary date-range picker, since the table only
 * retains 400 days (prune_page_view_stats) and a stats panel's job is to
 * answer "how's it going lately", not serve as a data warehouse.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = [7, 30, 90].includes(Number(searchParams.get("range")))
    ? Number(searchParams.get("range"))
    : 30;

  const admin = await createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - range);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: rows, error } = await admin
    .from("page_view_stats")
    .select("day, path, referrer_domain, device_type, country, views")
    .eq("tenant_id", tenantId)
    .gte("day", sinceStr);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byDay = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  const byDevice = new Map<string, number>();
  const byCountry = new Map<string, number>();
  let total = 0;

  for (const r of rows ?? []) {
    total += r.views;
    byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.views);
    byPath.set(r.path, (byPath.get(r.path) ?? 0) + r.views);
    byDevice.set(r.device_type, (byDevice.get(r.device_type) ?? 0) + r.views);
    // 'direct' / 'unknown' are the DB-level sentinels for "no referrer" / "no
    // geo header" — a composite primary key can't hold null, so those columns
    // are coalesced before insert. They mean "not applicable", not a real
    // referrer or country, so they're excluded here rather than showing up
    // as a fake top entry in either list.
    if (r.referrer_domain && r.referrer_domain !== "direct") byReferrer.set(r.referrer_domain, (byReferrer.get(r.referrer_domain) ?? 0) + r.views);
    if (r.country && r.country !== "unknown") byCountry.set(r.country, (byCountry.get(r.country) ?? 0) + r.views);
  }

  const topN = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, views]) => ({ key, views }));

  // Fill every day in the range, including zero-view days, so the chart
  // never silently skips a gap — a missing day and a zero-view day should
  // look the same to whoever's reading the trend, not different.
  const series: { day: string; views: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, views: byDay.get(key) ?? 0 });
  }

  return NextResponse.json({
    range,
    total,
    series,
    topPaths: topN(byPath, 10),
    topReferrers: topN(byReferrer, 10),
    devices: topN(byDevice, 4),
    topCountries: topN(byCountry, 10),
  });
}
