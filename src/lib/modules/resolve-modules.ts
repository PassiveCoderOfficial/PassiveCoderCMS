import { createAdminClient, createClient } from "@/lib/supabase/server";
import { MODULE_KEYS, type ModuleKey } from "@/components/admin/sidebar/nav-items";

type PlanModuleConfig = { included?: boolean; defaultOn?: boolean };

/** A module is usable only if the tenant's plan includes it AND the tenant
 *  hasn't explicitly turned it off — tenants can never enable a module their
 *  plan doesn't include, only toggle within what's included. Missing a
 *  tenant override falls back to the plan's defaultOn. */
export async function resolveEnabledModules(tenantId: string): Promise<Record<ModuleKey, boolean>> {
  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("plan, enabled_modules")
    .eq("id", tenantId)
    .maybeSingle();

  const result = {} as Record<ModuleKey, boolean>;
  if (!tenant) {
    for (const key of MODULE_KEYS) result[key] = false;
    return result;
  }

  const { data: plan } = await admin
    .from("plans")
    .select("modules")
    .eq("id", tenant.plan)
    .maybeSingle();

  // tenants.plan defaults to "free"/"trial"/"agency" pre-subscription states
  // (clients subscribe to Basic/Pro/Custom AFTER signup — there's no paid
  // "free" tier), so most tenants have no matching plans row at all. Fail
  // OPEN in that case — unsubscribed tenants keep full dashboard access,
  // same as before module gating existed. Restriction only applies once a
  // tenant is on a plan the SA has actually configured.
  if (!plan) {
    for (const key of MODULE_KEYS) result[key] = true;
    return result;
  }

  const planModules = (plan.modules ?? {}) as Record<string, PlanModuleConfig>;
  const overrides = (tenant.enabled_modules ?? {}) as Record<string, boolean>;

  for (const key of MODULE_KEYS) {
    const cfg = planModules[key];
    const included = cfg?.included ?? false;
    if (!included) { result[key] = false; continue; }
    result[key] = key in overrides ? !!overrides[key] : (cfg?.defaultOn ?? false);
  }
  return result;
}

/** Server-route guard — returns whether a module is usable for the given
 *  tenant. Super admins always pass, checked internally so callers (page
 *  components) don't need to separately resolve that. */
export async function requireModule(tenantId: string, key: ModuleKey): Promise<boolean> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (user) {
    const admin = await createAdminClient();
    const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (sa) return true;
  }
  const modules = await resolveEnabledModules(tenantId);
  return !!modules[key];
}
