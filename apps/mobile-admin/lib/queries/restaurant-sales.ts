// Restaurant sales analytics — same aggregation as
// cms/src/app/api/restaurant/sales-analytics/route.ts, ported to run
// client-side on the same RLS-scoped read instead of a server round trip.
// Kept in sync by hand (small function, no shared package between the two
// apps) — if the web route's aggregation logic changes, mirror it here too.

import { supabase } from "../supabase";
import type { OrderItem } from "./restaurant";

export interface SalesAnalytics {
  range: number;
  orderCount: number;
  totalRevenue: number;
  avgTicket: number;
  bestSellers: { name: string; quantity: number; revenue: number }[];
  peakHours: { hour: number; count: number }[];
  fulfillmentSplit: { type: string; count: number }[];
}

export async function getSalesAnalytics(tenantId: string, range: 7 | 30 | 90): Promise<SalesAnalytics> {
  const since = new Date();
  since.setDate(since.getDate() - range);

  const { data, error } = await supabase
    .from("orders")
    .select("id, items, total, fulfillment_type, created_at, branch_id")
    .eq("tenant_id", tenantId)
    .not("branch_id", "is", null)
    .gte("created_at", since.toISOString())
    .not("status", "eq", "cancelled");
  if (error) throw error;

  const rows = data ?? [];

  const byProduct = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of rows) {
    const items = Array.isArray(o.items) ? (o.items as OrderItem[]) : [];
    for (const it of items) {
      const key = it.product_id ?? it.name;
      const cur = byProduct.get(key) ?? { name: it.name, quantity: 0, revenue: 0 };
      cur.quantity += it.quantity;
      cur.revenue += it.price * it.quantity;
      byProduct.set(key, cur);
    }
  }
  const bestSellers = [...byProduct.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  const byHour = new Array(24).fill(0);
  for (const o of rows) {
    const h = new Date(o.created_at).getHours();
    byHour[h] += 1;
  }

  const totalRevenue = rows.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = rows.length ? totalRevenue / rows.length : 0;
  const byFulfillment = new Map<string, number>();
  for (const o of rows) {
    byFulfillment.set(o.fulfillment_type, (byFulfillment.get(o.fulfillment_type) ?? 0) + 1);
  }

  return {
    range,
    orderCount: rows.length,
    totalRevenue,
    avgTicket,
    bestSellers,
    peakHours: byHour.map((count, hour) => ({ hour, count })),
    fulfillmentSplit: [...byFulfillment.entries()].map(([type, count]) => ({ type, count })),
  };
}
