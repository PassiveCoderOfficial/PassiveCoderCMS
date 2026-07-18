import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { MODULE_KEYS, type ModuleKey } from "@/components/admin/sidebar/nav-items";

type PlanModuleConfig = { included?: boolean; defaultOn?: boolean };

export async function GET() {
  const supabase = await createClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tenant } = await supabase.from("tenants").select("plan, enabled_modules").eq("id", tenantId).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { data: plan } = await supabase.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const overrides = (tenant.enabled_modules ?? {}) as Record<string, boolean>;

  // Pre-subscription tenants (plan = "free"/"trial"/"agency") have no
  // matching plans row — clients only get a real plan (Basic/Pro/Custom)
  // after subscribing. Fail open, same fallback as resolveEnabledModules().
  if (!plan) {
    return NextResponse.json({ modules: MODULE_KEYS.map((key) => ({ key, enabled: key in overrides ? !!overrides[key] : true })) });
  }

  const planModules = (plan.modules ?? {}) as Record<string, PlanModuleConfig>;
  const modules = MODULE_KEYS
    .map((key) => {
      const cfg = planModules[key];
      if (!cfg?.included) return null;
      return {
        key,
        enabled: key in overrides ? !!overrides[key] : (cfg.defaultOn ?? false),
      };
    })
    .filter((m): m is { key: ModuleKey; enabled: boolean } => m !== null);

  return NextResponse.json({ modules });
}

export async function PATCH(req: Request) {
  // Uses the admin client for the write — RLS on tenants already scopes
  // updates via is_tenant_member, but we also clamp server-side to modules
  // the plan actually includes so a tenant can never enable something their
  // plan doesn't grant, even via a crafted request.
  const supabase = await createClient();
  const admin = await createAdminClient();
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, enabled } = await req.json();
  if (!MODULE_KEYS.includes(key)) return NextResponse.json({ error: "Unknown module" }, { status: 400 });

  const { data: tenant } = await supabase.from("tenants").select("plan, enabled_modules").eq("id", tenantId).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const { data: plan } = await supabase.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  // No matching plan row (pre-subscription tenant) — fail open, same as GET.
  if (plan) {
    const planModules = (plan.modules ?? {}) as Record<string, PlanModuleConfig>;
    if (!planModules[key]?.included) {
      return NextResponse.json({ error: "This module isn't included in your plan" }, { status: 403 });
    }
  }

  const overrides = { ...(tenant.enabled_modules ?? {}), [key]: !!enabled };
  const { error } = await admin.from("tenants").update({ enabled_modules: overrides }).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
