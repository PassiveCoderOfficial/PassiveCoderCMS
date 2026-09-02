import type { SupabaseClient } from "@supabase/supabase-js";

// Server-only — never import in client components
const ENM_BASE_URL = (process.env.ENM_BASE_URL ?? "https://expertnear.me").replace(/\/$/, "");
const PARTNER_SECRET = process.env.PARTNER_SECRET ?? "";

function headers() {
  return {
    "Content-Type": "application/json",
    "x-partner-secret": PARTNER_SECRET,
  };
}

// Re-exported so server code has one import for ENM concerns; the rule itself
// lives in a client-safe module.
export { enmTierForPlan, type ENMTier } from "./enm-tier";
import type { ENMTier } from "./enm-tier";

/** Create or update ENM account for a PC tenant. Returns ENM userId. */
export async function enmProvision(opts: {
  email: string;
  name?: string;
  pcTenantId: string;
  tier: ENMTier;
}): Promise<number> {
  const res = await fetch(`${ENM_BASE_URL}/api/partner/provision`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "ENM provision failed");
  return data.userId as number;
}

/**
 * Provision the tenant's ENM account at `tier` and record it on the tenant row.
 *
 * ENM Pro is bundled with CMS Pro rather than sold separately, so every path
 * that changes a subscription's state has to call this or the entitlement
 * silently diverges from what the customer paid for. Never throws: ENM being
 * unreachable must not fail the payment that triggered it.
 */
export async function syncENMTier(
  admin: SupabaseClient,
  tenantId: string,
  tier: ENMTier,
): Promise<void> {
  try {
    const { data: tenant } = await admin.from("tenants").select("id, owner_id").eq("id", tenantId).maybeSingle();
    if (!tenant?.owner_id) return;
    const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", tenant.owner_id).maybeSingle();
    if (!profile?.email) return;
    const enmUserId = await enmProvision({
      email: profile.email,
      name: profile.full_name ?? undefined,
      pcTenantId: tenantId,
      tier,
    });
    await admin.from("tenants").update({ enm_user_id: enmUserId, enm_tier: tier }).eq("id", tenantId);
  } catch (err) {
    console.error(`[enm] tier sync failed for tenant ${tenantId} (${tier}):`, err);
  }
}

/** Issue a 5-min SSO token for an ENM userId. */
export async function enmSSOToken(userId: number): Promise<string> {
  const res = await fetch(`${ENM_BASE_URL}/api/partner/sso-token`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "ENM sso-token failed");
  return data.token as string;
}

/** Full SSO URL to redirect a user to ENM dashboard (auto-logged-in). */
export function enmSSOUrl(token: string, redirect = "/dashboard"): string {
  return `${ENM_BASE_URL}/auth/sso?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;
}
