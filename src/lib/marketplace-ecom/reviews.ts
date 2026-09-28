import { createAdminClient } from "@/lib/supabase/server";

/** Quick tags shoppers can tap, Shopee-style. Stored as the key. */
export const REVIEW_TAGS = [
  "High quality",
  "Arrived early",
  "Good value",
  "As described",
  "Well packed",
  "Fast seller reply",
] as const;

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  tags: { tag: string; count: number }[];
  with_media: number;
}

/** Aggregate a product's published reviews for the summary header. */
export async function reviewSummary(productId: string): Promise<ReviewSummary> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("product_reviews")
    .select("rating, tags, images")
    .eq("product_id", productId)
    .eq("status", "published");
  const rows = data ?? [];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary["distribution"];
  const tagCounts = new Map<string, number>();
  let total = 0;
  let withMedia = 0;
  for (const r of rows) {
    distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    total += r.rating;
    if ((r.images ?? []).length) withMedia++;
    for (const t of r.tags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  return {
    average: rows.length ? Math.round((total / rows.length) * 10) / 10 : 0,
    count: rows.length,
    distribution,
    tags: [...tagCounts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count),
    with_media: withMedia,
  };
}

/**
 * Delivered parcels in which this buyer received the product and hasn't
 * reviewed it yet. Only these may be reviewed — that's what makes every
 * review a verified purchase.
 */
export async function reviewableSubOrders(
  tenantId: string, userId: string, productId: string,
): Promise<{ sub_order_id: string; delivered_at: string | null }[]> {
  const admin = await createAdminClient();
  const { data: subs } = await admin
    .from("sub_orders")
    .select("id, items, delivered_at, orders!inner(customer_id)")
    .eq("tenant_id", tenantId)
    .eq("status", "delivered")
    .eq("orders.customer_id", userId);

  const candidates = (subs ?? []).filter((s) =>
    ((s.items ?? []) as { product_id?: string }[]).some((i) => i.product_id === productId),
  );
  if (!candidates.length) return [];

  const { data: done } = await admin
    .from("product_reviews")
    .select("sub_order_id")
    .eq("product_id", productId)
    .in("sub_order_id", candidates.map((c) => c.id));
  const reviewed = new Set((done ?? []).map((d) => d.sub_order_id));
  return candidates
    .filter((c) => !reviewed.has(c.id))
    .map((c) => ({ sub_order_id: c.id, delivered_at: c.delivered_at }));
}

/** "Rahim K." — first name plus initial, so reviews feel human without
 *  publishing a buyer's full name. */
export function publicReviewerName(fullName: string | null | undefined, email?: string | null): string {
  const name = (fullName ?? "").trim();
  if (name) {
    const [first, ...rest] = name.split(/\s+/);
    const last = rest.pop();
    return last ? `${first} ${last[0].toUpperCase()}.` : first;
  }
  const local = (email ?? "").split("@")[0];
  if (local && !email?.endsWith("@nomail.local")) return `${local.slice(0, 2)}***${local.slice(-1)}`;
  return "Verified buyer";
}
