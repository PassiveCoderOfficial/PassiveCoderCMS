import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/*
 * Is this site on the free trial (tenants.trial_ends_at set; lib/sites/trial.ts)?
 * Paying clears it (endTrial). While it is set, the site's own scripts do not
 * run and its HTML is sanitised wherever it is drawn (lib/security/trial-html.ts),
 * and it cannot connect its own domain.
 *
 * Asked on every page view, so the answer is kept for a short while per
 * server instance and once per request. A site that has just paid may stay
 * restricted for up to TTL_MS; a new trial site is restricted from its first
 * request (nothing is cached before it exists).
 *
 * If the database cannot answer, the site is treated as not on trial: a paid
 * site must never lose its scripts because of a failed lookup, and a page
 * that cannot read this row cannot read its content either.
 */
const TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;
const seen = new Map<string, { trial: boolean; expiresAt: number }>();

async function lookup(tenantId: string): Promise<boolean> {
  const hit = seen.get(tenantId);
  if (hit && hit.expiresAt > Date.now()) return hit.trial;
  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.from("tenants").select("trial_ends_at").eq("id", tenantId).maybeSingle();
    if (error) return hit?.trial ?? false;
    const trial = !!data?.trial_ends_at;
    if (seen.size >= MAX_ENTRIES) seen.clear();
    seen.set(tenantId, { trial, expiresAt: Date.now() + TTL_MS });
    return trial;
  } catch {
    return hit?.trial ?? false;
  }
}

const perRequest = cache(lookup);

export async function isTrialSite(tenantId: string | null | undefined): Promise<boolean> {
  return tenantId ? perRequest(tenantId) : false;
}

/** Shown wherever a trial site is refused a custom domain. */
export const TRIAL_DOMAIN_MESSAGE = "Connect your own domain after you upgrade.";
