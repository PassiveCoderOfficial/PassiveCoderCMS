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
 * Push the tenant's business profile to ENM as their expert listing.
 *
 * Runs after provisioning — the account has to exist first. Best-effort by
 * design: a directory profile failing to update must never break the CMS
 * action that triggered it.
 *
 * Returns the public profile link when ENM issued one.
 */
export async function enmPushProfile(
  admin: SupabaseClient,
  tenantId: string,
): Promise<string | null> {
  try {
    const [{ data: tenant }, { data: profile }] = await Promise.all([
      admin.from("tenants").select("id, owner_id, slug").eq("id", tenantId).maybeSingle(),
      admin.from("tenant_business_profiles").select("*").eq("tenant_id", tenantId).maybeSingle(),
    ]);
    // No profile means nothing worth publishing — an empty listing is worse
    // than no listing.
    if (!tenant || !profile?.completed_at) return null;

    const { data: owner } = await admin
      .from("profiles").select("email").eq("id", tenant.owner_id).maybeSingle();
    if (!owner?.email) return null;

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";

    const res = await fetch(`${ENM_BASE_URL}/api/partner/expert`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        pcTenantId: tenantId,
        email: owner.email,
        businessName: profile.business_name ?? undefined,
        ownerName: profile.owner_name ?? undefined,
        primaryService: profile.primary_service ?? undefined,
        services: Array.isArray(profile.services) ? profile.services : [],
        serviceAreas: Array.isArray(profile.service_areas) ? profile.service_areas : [],
        phone: profile.phone ?? undefined,
        whatsapp: profile.whatsapp ?? undefined,
        officeAddress: profile.office_address ?? undefined,
        countryCode: profile.country_code ?? undefined,
        about: profile.about ?? undefined,
        yearsOperating: profile.years_operating,
        customersServed: profile.customers_served,
        webAddress: tenant.slug ? `https://${tenant.slug}.${rootDomain}` : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.error(`[enm] profile push failed for tenant ${tenantId}:`, data.error ?? res.status);
      return null;
    }
    return (data.profileLink as string | null) ?? null;
  } catch (err) {
    console.error(`[enm] profile push failed for tenant ${tenantId}:`, err);
    return null;
  }
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
