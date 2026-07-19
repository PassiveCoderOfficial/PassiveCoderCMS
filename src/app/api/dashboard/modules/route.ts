import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { MODULE_KEYS } from "@/components/admin/sidebar/nav-items";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";

type PlanModuleConfig = { included?: boolean; defaultOn?: boolean };

export async function GET() {
  const tenantId = await apiTenantId();
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only list modules the tenant's plan actually includes (whether currently
  // on or off) — resolveEnabledModules is the single source of truth for
  // both "is this usable" (sidebar/route gating) and "should this toggle
  // even appear" (this page), including the free/trial/agency → basic
  // fallback, so there's nothing to duplicate here.
  const supabase = await createClient();
  const { data: tenant } = await supabase.from("tenants").select("plan").eq("id", tenantId).maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const admin = await createAdminClient();
  let { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  if (!plan) {
    ({ data: plan } = await admin.from("plans").select("modules").eq("id", "basic").maybeSingle());
  }
  const planModules = (plan?.modules ?? {}) as Record<string, PlanModuleConfig>;
  const enabledMap = await resolveEnabledModules(tenantId);

  const modules = MODULE_KEYS
    .filter((key) => planModules[key]?.included)
    .map((key) => ({ key, enabled: enabledMap[key] }));

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

  let { data: plan } = await admin.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  if (!plan) {
    ({ data: plan } = await admin.from("plans").select("modules").eq("id", "basic").maybeSingle());
  }
  const planModules = (plan?.modules ?? {}) as Record<string, PlanModuleConfig>;
  if (!planModules[key]?.included) {
    return NextResponse.json({ error: "This module isn't included in your plan" }, { status: 403 });
  }

  const overrides = { ...(tenant.enabled_modules ?? {}), [key]: !!enabled };
  const { error } = await admin.from("tenants").update({ enabled_modules: overrides }).eq("id", tenantId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
