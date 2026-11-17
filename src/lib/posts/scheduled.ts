import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";

/*
 * Scheduled posts/pages (status 'scheduled' + scheduled_at, stored UTC).
 *
 * Publishing happens in the DB function publish_due_scheduled (migration 184).
 * Three callers keep it exact without a sub-daily Vercel cron:
 *  - public renders call publishDueForSite() (at most once a minute per site
 *    per server instance; an RPC is a POST so it is never served from the
 *    public read cache),
 *  - the daily publish-scheduled cron sweeps every site as a backstop,
 *  - MCP list/schedule tools sweep the site they touch.
 * Whenever rows flip, that site's public cache is expired so lists, the
 * sitemap and the post page show it at once.
 */

const THROTTLE_MS = 60_000;
const lastRun = new Map<string, number>();

/** Publish this site's due scheduled rows; never throws (renders must not fail). */
export async function publishDueForSite(tenantId: string | null): Promise<number> {
  const key = tenantId ?? "root";
  const now = Date.now();
  if (now - (lastRun.get(key) ?? 0) < THROTTLE_MS) return 0;
  lastRun.set(key, now);
  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.rpc("publish_due_scheduled", { p_tenant: tenantId, p_all: false });
    if (error) return 0;
    const n = ((data ?? []) as { published: number }[]).reduce((s, r) => s + (r.published ?? 0), 0);
    if (n > 0) {
      invalidateSiteCache(tenantId);
      // revalidateTag is not allowed mid-render; after() runs it once the
      // response is done, so the shared Data Cache expires too.
      try { after(() => invalidateSiteCache(tenantId)); } catch { /* no request scope */ }
    }
    return n;
  } catch {
    return 0;
  }
}

/** Cron backstop: every site. */
export async function publishDueAllSites(): Promise<{ tenant_id: string | null; published: number }[]> {
  const admin = await createAdminClient();
  const { data, error } = await admin.rpc("publish_due_scheduled", { p_tenant: null, p_all: true });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { tenant_id: string | null; published: number }[];
  for (const r of rows) invalidateSiteCache(r.tenant_id);
  return rows;
}
