import type { SupabaseClient } from "@supabase/supabase-js";
import { normCert, normDate, withDefaults, type ResultRow, type ResultsSettings } from "./fields";

export async function loadSettings(admin: SupabaseClient, tenantId: string): Promise<ResultsSettings> {
  const { data } = await admin.from("results_settings").select("*").eq("tenant_id", tenantId).maybeSingle();
  return withDefaults(data);
}

/** One published result by exact certificate number (case/space-insensitive). */
export async function findByCertificate(admin: SupabaseClient, tenantId: string, cert: string): Promise<ResultRow | null> {
  const want = normCert(cert);
  if (!want || want.length > 100) return null;
  // ilike without wildcards = case-insensitive equality; escape LIKE metachars.
  const pattern = cert.trim().replace(/\s+/g, " ").replace(/[\\%_]/g, (m) => `\\${m}`);
  const { data } = await admin.from("results").select("*, course:results_courses(name, slug, page_url)")
    .eq("tenant_id", tenantId).eq("status", "published").ilike("certificate_no", pattern).limit(5);
  return ((data ?? []) as ResultRow[]).find((r) => normCert(r.certificate_no) === want) ?? null;
}

/** Second factor check for strict lookup modes. */
export function passesSecondFactor(row: ResultRow, s: ResultsSettings, input: { dob?: string; roll?: string }): boolean {
  if (s.lookup_mode === "certificate_dob") {
    const want = normDate(row.dob);
    return !!want && normDate(input.dob) === want;
  }
  if (s.lookup_mode === "certificate_roll") {
    const want = (row.roll ?? "").trim().toLowerCase();
    return !!want && (input.roll ?? "").trim().toLowerCase() === want;
  }
  return true;
}

/** Failed lookups from this IP in the last `minutes` (verify page + lookup API throttle). */
export async function recentMisses(admin: SupabaseClient, ip: string, minutes = 10): Promise<number> {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const { count } = await admin.from("results_lookup_log").select("id", { count: "exact", head: true })
    .eq("ip", ip).eq("found", false).gte("created_at", since);
  return count ?? 0;
}
