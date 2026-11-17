import { createAdminClient } from "@/lib/supabase/server";
import { apiUserId } from "@/lib/auth/api-caller";
import { MODULE_KEYS, type ModuleKey } from "@/components/admin/sidebar/nav-items";
import { flags, ROOT_TENANT_SLUG } from "@/lib/flags";
import { moduleInstalled } from "@/modules/registry/installed";
import { withLicensedModules } from "@/lib/licence/modules";

/** licensed: set only by a self-hosted install's module licence (lib/licence). */
type PlanModuleConfig = { included?: boolean; defaultOn?: boolean; licensed?: boolean };

/** Plans that get Projects once the release flag is on. By plan id, because
 *  "agency" has no plans row of its own (it falls back to Basic's config). */
const PROJECTS_PLANS = new Set(["pro", "biz", "agency", "custom"]);

/** Is this module part of the tenant's plan? Projects ignores plans.modules: it
 *  stays out of every plan until the flag is flipped, then on for those plans. */
export function moduleIncluded(key: ModuleKey, tenantPlan: string | null | undefined, planModules: Record<string, PlanModuleConfig>): boolean {
  // A module whose code is not in this build is in no plan (always installed
  // on the hosted platform; see modules/registry/installed.ts).
  if (!moduleInstalled(key)) return false;
  if (key === "projects") return (flags.projects && PROJECTS_PLANS.has(tenantPlan ?? "")) || planModules.projects?.licensed === true;
  return !!planModules[key]?.included;
}

/** A module is usable only if the tenant's plan includes it AND the tenant
 *  hasn't explicitly turned it off — tenants can never enable a module their
 *  plan doesn't include, only toggle within what's included. Missing a
 *  tenant override falls back to the plan's defaultOn. */
export async function resolveEnabledModules(tenantId: string): Promise<Record<ModuleKey, boolean>> {
  const admin = await createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("plan, slug, enabled_modules")
    .eq("id", tenantId)
    .maybeSingle();

  const result = {} as Record<ModuleKey, boolean>;
  if (!tenant) {
    for (const key of MODULE_KEYS) result[key] = false;
    return result;
  }

  let { data: plan } = await admin
    .from("plans")
    .select("modules")
    .eq("id", tenant.plan)
    .maybeSingle();

  // tenants.plan defaults to "free"/"trial"/"agency" pre-subscription states
  // (clients subscribe to Basic/Pro/Custom AFTER signup — there's no separate
  // paid "free" tier), so these have no plans row of their own. Rather than
  // adding fake plan rows SA would have to maintain (and that would clutter
  // the Plans admin UI), fall back to Basic's module config — pre-subscription
  // tenants get the same restrictions/defaults as the entry-level paid plan.
  if (!plan) {
    ({ data: plan } = await admin.from("plans").select("modules").eq("id", "basic").maybeSingle());
  }
  if (!plan) {
    for (const key of MODULE_KEYS) result[key] = false;
    return result;
  }

  // Self-hosted only: a valid module licence adds its modules. Hosted: no-op.
  const planModules = withLicensedModules((plan.modules ?? {}) as Record<string, PlanModuleConfig>, tenantId);
  const overrides = (tenant.enabled_modules ?? {}) as Record<string, boolean>;

  for (const key of MODULE_KEYS) {
    const cfg = planModules[key];
    if (!moduleIncluded(key, tenant.plan as string, planModules)) { result[key] = false; continue; }
    result[key] = key in overrides ? !!overrides[key] : key === "projects" ? true : (cfg?.defaultOn ?? false);
  }

  // Passive Coder's own site always has its AI tools.
  if (tenant.slug === ROOT_TENANT_SLUG) { result.ai_coder = true; result.ai_agent = true; }

  // The content scheduler is additionally gated per-user: the plan/tenant
  // toggle only decides whether the module exists for this tenant at all,
  // then tenant owners/admins plus explicitly granted users see it. Without
  // this, every member of a Pro tenant would find the scheduler in their nav
  // the moment it's switched on — it's meant for whoever runs the content.
  if (result.content_scheduler) {
    result.content_scheduler = await hasSchedulerAccess(tenantId);
  }
  return result;
}

/** Owner/admin of the tenant, holder of a content_module_grants row, or a
 *  staff/agent account assigned to this tenant (assigned_agent_id/
 *  referred_by_agent_id/staff_agent_id) — staff viewing a site they're
 *  assigned to get full module access same as an owner/admin would,
 *  consistent with how the rest of the dashboard treats staff-viewing
 *  (they're not a tenant_members row, so without this check they fell
 *  through to "no grant" and got denied even on their own assigned site). */
async function hasSchedulerAccess(tenantId: string): Promise<boolean> {
  const userId = await apiUserId();
  if (!userId) return false;
  const user = { id: userId };

  const admin = await createAdminClient();
  const { data: sa } = await admin
    .from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (sa) return true;

  const { data: member } = await admin
    .from("tenant_members")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (member && ["owner", "admin"].includes(member.role as string)) return true;

  const { data: staff } = await admin
    .from("pc_staff")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff?.status === "active") return true;
  if (staff) {
    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .or(`assigned_staff_id.eq.${staff.id},referred_by_staff_id.eq.${staff.id},staff_id.eq.${staff.id}`)
      .maybeSingle();
    if (tenant) return true;
  }

  const { data: grant } = await admin
    .from("content_module_grants")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!grant;
}

/** Server-route guard — returns whether a module is usable for the given
 *  tenant. Super admins always pass, checked internally so callers (page
 *  components) don't need to separately resolve that. */
export async function requireModule(tenantId: string, key: ModuleKey): Promise<boolean> {
  const userId = await apiUserId();
  const user = userId ? { id: userId } : null;
  if (user) {
    const admin = await createAdminClient();
    const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (sa) return true;
  }
  const modules = await resolveEnabledModules(tenantId);
  return !!modules[key];
}
