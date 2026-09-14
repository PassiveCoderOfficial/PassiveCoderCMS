import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { requireModule } from "@/lib/modules/resolve-modules";

/**
 * Restaurant sales analytics (Tier 2, docs/business/06-restaurant-vertical.md)
 * — best-sellers, peak hours, average ticket size. Gated the same way as
 * the rest of the restaurant stack ("pos" module = Biz plan).
 *
 * Aggregated in JS from the same orders.items jsonb shape POS/checkout
 * already write ({product_id, name, price, quantity}) rather than a new
 * SQL function or summary table — order volume at this stage doesn't
 * justify the extra migration/maintenance surface, and this mirrors how
 * /api/analytics already aggregates page_view_stats client-side-shaped.
 * Revisit with a real aggregate table only if a tenant's order count makes
 * this measurably slow.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requireModule(tenantId, "pos"))) {
    return NextResponse.json({ error: "Restaurant analytics is not available on your plan" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = [7, 30, 90].includes(Number(searchParams.get("range"))) ? Number(searchParams.get("range")) : 30;
  const since = new Date();
  since.setDate(since.getDate() - range);

  const admin = await createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, items, total, fulfillment_type, created_at, branch_id")
    .eq("tenant_id", tenantId)
    .not("branch_id", "is", null) // restaurant orders only — a non-restaurant order on the same tenant has no branch
    .gte("created_at", since.toISOString())
    .not("status", "eq", "cancelled");

  const rows = orders ?? [];

  // Best sellers — summed across every order's items array.
  const byProduct = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of rows) {
    const items = Array.isArray(o.items) ? o.items as { product_id: string; name: string; price: number; quantity: number }[] : [];
    for (const it of items) {
      const key = it.product_id ?? it.name;
      const cur = byProduct.get(key) ?? { name: it.name, quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.price * it.quantity;
      byProduct.set(key, cur);
    }
  }
  const bestSellers = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  // Peak hours — order count bucketed by hour-of-day (0-23), local to
  // whatever timezone the created_at timestamps read as on the server. Good
  // enough for "which hours are busiest" without per-tenant timezone
  // plumbing this doesn't have elsewhere yet.
  const byHour = new Array(24).fill(0);
  for (const o of rows) {
    const h = new Date(o.created_at).getHours();
    byHour[h] += 1;
  }

  // Ticket size + fulfillment split.
  const totalRevenue = rows.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = rows.length ? totalRevenue / rows.length : 0;
  const byFulfillment = new Map<string, number>();
  for (const o of rows) {
    byFulfillment.set(o.fulfillment_type, (byFulfillment.get(o.fulfillment_type) ?? 0) + 1);
  }

  return NextResponse.json({
    range,
    orderCount: rows.length,
    totalRevenue,
    avgTicket,
    bestSellers,
    peakHours: byHour.map((count, hour) => ({ hour, count })),
    fulfillmentSplit: [...byFulfillment.entries()].map(([type, count]) => ({ type, count })),
  });
}
