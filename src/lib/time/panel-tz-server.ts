import { revalidateTag, unstable_cache } from "next/cache";
import { createProxyClient } from "@/lib/supabase/server";
import { DEFAULT_PANEL_TZ, normalizeTimeZone } from "./panel-tz";

/** Server side of the panel time zone (see ./panel-tz.ts). */

export const PANEL_TZ_TAG = "panel-timezone";
const MEMORY_TTL_MS = 60_000;
let memory: { tz: string; at: number } | null = null;

// Throws on a failed read so a bad answer is never cached; the caller falls
// back to the last good copy or Dhaka.
const load = unstable_cache(async () => {
  const admin = createProxyClient(); // plain fetch: no request headers inside the cache
  const { data, error } = await admin.from("platform_settings").select("panel_timezone").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeTimeZone((data as { panel_timezone?: string } | null)?.panel_timezone);
}, ["panel-timezone"], { revalidate: 3600, tags: [PANEL_TZ_TAG] });

/** The platform-wide panel time zone (IANA), default Asia/Dhaka. Never throws. */
export async function getPanelTimeZone(): Promise<string> {
  if (memory && Date.now() - memory.at < MEMORY_TTL_MS) return memory.tz;
  try {
    const tz = await load();
    memory = { tz, at: Date.now() };
    return tz;
  } catch {
    return memory?.tz ?? DEFAULT_PANEL_TZ;
  }
}

/** After a super admin saves a new zone. */
export function panelTimeZoneChanged(tz: string) {
  memory = { tz: normalizeTimeZone(tz), at: Date.now() };
  try { revalidateTag(PANEL_TZ_TAG, { expire: 0 }); } catch { /* outside a request */ }
}
