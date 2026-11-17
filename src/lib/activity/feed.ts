import type { SupabaseClient } from "@supabase/supabase-js";
import { categoryFilter, sourceFilter, VISITOR_VIA, type FeedRow } from "@/lib/activity/labels";
import { zonedInstant } from "@/lib/time/panel-tz";

export const FEED_PAGE_SIZE = 50;

export type FeedFilters = {
  /** Only this person's actions. A regular staff member's page always sets this to themselves. */
  actorId?: string | null;
  tenantId?: string | null;
  category?: string | null;
  /** Where the row came from: panel, app, mcp, release, database, or people (all but database). */
  source?: string | null;
  /** Inclusive, YYYY-MM-DD, UTC. */
  from?: string | null;
  /** Zone the from/to days are in (panel zone); UTC when unset. */
  tz?: string | null;
  to?: string | null;
  search?: string | null;
  page?: number;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Letters, digits and a few marks only, so a search can't change the query. */
export function cleanSearch(q: string | null | undefined): string {
  return (q ?? "").toLowerCase().replace(/[^\p{L}\p{N}@.\-_ ]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * One page of the action list, newest first. Reads one row extra rather than
 * counting, so paging stays quick as the logs grow. Callers pass a service-role
 * client and must have checked who is asking: the rows hold client data.
 */
export async function readFeed(admin: SupabaseClient, f: FeedFilters): Promise<{ rows: FeedRow[]; hasMore: boolean; page: number }> {
  const page = Math.max(1, Math.floor(f.page ?? 1) || 1);
  const start = (page - 1) * FEED_PAGE_SIZE;
  let q = admin.from("action_feed")
    .select("id, created_at, actor_id, action, tenant_id, target_user_id, via, ok, error, args, before, after, actor_name, actor_role, site_name, reason")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, start + FEED_PAGE_SIZE);
  if (f.actorId && UUID.test(f.actorId)) q = q.eq("actor_id", f.actorId);
  if (f.tenantId && UUID.test(f.tenantId)) q = q.eq("tenant_id", f.tenantId);
  const cat = categoryFilter(f.category);
  if (cat) q = q.or(cat);
  const src = sourceFilter(f.source);
  if (src) q = src.op === "eq" ? q.eq("via", src.value) : q.neq("via", src.value);
  // Public forms and checkout only show when asked for, so they can't bury what the team did.
  if (f.category !== "visitors") q = q.neq("via", VISITOR_VIA);
  // Days are calendar days in the panel zone, not UTC.
  if (f.from && DAY.test(f.from)) q = q.gte("created_at", zonedInstant(f.from, "00:00:00", f.tz ?? undefined).toISOString());
  if (f.to && DAY.test(f.to)) q = q.lte("created_at", zonedInstant(f.to, "23:59:59.999", f.tz ?? undefined).toISOString());
  const s = cleanSearch(f.search);
  if (s) q = q.ilike("search_text", `%${s}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as FeedRow[];
  return { rows: rows.slice(0, FEED_PAGE_SIZE), hasMore: rows.length > FEED_PAGE_SIZE, page };
}
