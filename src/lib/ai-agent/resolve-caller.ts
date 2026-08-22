import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { verifyBearerUser, verifyBearerTenantMember } from "@/lib/auth/verify-bearer";

export type AgentCaller = { userId: string; tenantId: string };

/**
 * Dual auth for /api/ai-agent/*: cookie session (web) first, Bearer token
 * (mobile-ready) fallback. Mirrors the pattern used by domain connect/etc.
 * routes (see verify-bearer.ts / callerCanManageTenant).
 */
export async function resolveAgentCaller(req: Request): Promise<AgentCaller | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const tenantId = await apiTenantId();
    if (!tenantId) return null;
    return { userId: user.id, tenantId };
  }

  // Mobile: Bearer token, tenant id must be supplied by the caller (no
  // subdomain/cookie context available) — read from header.
  const bearerUser = await verifyBearerUser(req);
  if (!bearerUser) return null;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return null;
  const member = await verifyBearerTenantMember(req, tenantId);
  if (!member) return null;
  return { userId: bearerUser.userId, tenantId };
}

/** Same as resolveAgentCaller but requires editor-level membership — used by
 *  /confirm and /cancel, which mutate data. */
export async function resolveAgentEditorCaller(req: Request): Promise<AgentCaller | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const tenantId = await apiTenantId();
    if (!tenantId) return null;
    const admin = await createAdminClient();
    const { data: sa } = await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (sa) return { userId: user.id, tenantId };
    const { data: owned } = await admin.from("tenants").select("id").eq("id", tenantId).eq("owner_id", user.id).maybeSingle();
    if (owned) return { userId: user.id, tenantId };
    const { data: membership } = await admin
      .from("tenant_members")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership || membership.role === "viewer") return null;
    return { userId: user.id, tenantId };
  }

  const bearerUser = await verifyBearerUser(req);
  if (!bearerUser) return null;
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) return null;
  const member = await verifyBearerTenantMember(req, tenantId, { requireEditor: true });
  if (!member) return null;
  return { userId: bearerUser.userId, tenantId };
}
