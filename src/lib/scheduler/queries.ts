import { createClient } from "@/lib/supabase/server";
import type { Bucket, ContentItem, BrandProfile, BrandChannel } from "./types";

const ITEM_SELECT =
  "*, content_targets(*), brand_profiles(id, name, color, kind)";

/** All five tabs share one query shape — only the WHERE differs. Keeping this
 *  in one place means adding a filter (or a tab) never means touching five
 *  separate fetchers. RLS already scopes rows to tenants the caller may see;
 *  the explicit tenant_id keeps the index in play and guards against a
 *  future policy loosening. */
export async function getContentFeed(opts: {
  tenantId: string;
  bucket: Bucket;
  limit?: number;
}): Promise<ContentItem[]> {
  const { tenantId, bucket, limit = 400 } = opts;
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("content_items")
    .select(ITEM_SELECT)
    .eq("tenant_id", tenantId);

  switch (bucket) {
    case "upcoming":
      query = query
        .gte("scheduled_at", nowIso)
        .not("status", "in", "(published,archived)")
        .order("scheduled_at", { ascending: true });
      break;

    case "attention":
      // Overdue but unpublished, or outright failed. `or` can't express the
      // overdue+status pair alongside the failed case, so fetch the union by
      // date and filter the tail in JS — bounded by limit, and this tab is
      // small by definition (it's the "fix me" queue).
      query = query
        .in("status", ["scheduled", "approved", "in_review", "drafting", "failed"])
        .lte("scheduled_at", nowIso)
        .order("scheduled_at", { ascending: true });
      break;

    case "backlog":
      // Ideas and drafts with no date yet — the pool you drag onto the calendar.
      query = query
        .in("status", ["idea", "drafting"])
        .is("scheduled_at", null)
        .order("created_at", { ascending: false });
      break;

    case "published":
      query = query
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false });
      break;

    case "calendar":
      // Month grid needs everything with a date, past and future.
      query = query
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true });
      break;
  }

  const { data, error } = await query.limit(limit);
  if (error) throw new Error(`content feed (${bucket}): ${error.message}`);
  return (data ?? []) as unknown as ContentItem[];
}

/** Tab counts. One grouped read rather than five count queries. */
export async function getBucketCounts(tenantId: string) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("content_items")
    .select("status, scheduled_at, published_at")
    .eq("tenant_id", tenantId)
    .limit(5000);
  if (error) throw new Error(`bucket counts: ${error.message}`);

  const rows = data ?? [];
  const isOpen = (s: string) => !["published", "archived"].includes(s);

  return {
    upcoming: rows.filter(
      (r) => r.scheduled_at && r.scheduled_at >= nowIso && isOpen(r.status),
    ).length,
    attention: rows.filter(
      (r) =>
        r.status === "failed" ||
        (r.scheduled_at && r.scheduled_at < nowIso && isOpen(r.status)),
    ).length,
    backlog: rows.filter(
      (r) => !r.scheduled_at && ["idea", "drafting"].includes(r.status),
    ).length,
    published: rows.filter((r) => r.status === "published").length,
    calendar: rows.filter((r) => !!r.scheduled_at).length,
  } satisfies Record<Bucket, number>;
}

export async function getBrands(tenantId: string): Promise<BrandProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("position");
  if (error) throw new Error(`brands: ${error.message}`);
  return (data ?? []) as BrandProfile[];
}

export async function getChannels(tenantId: string): Promise<BrandChannel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brand_channels")
    .select("*")
    .eq("tenant_id", tenantId);
  if (error) throw new Error(`channels: ${error.message}`);
  return (data ?? []) as BrandChannel[];
}
