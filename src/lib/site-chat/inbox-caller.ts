import "server-only";
import type { NextRequest } from "next/server";
import { apiUser, getApiCaller } from "@/lib/auth/api-caller";
import { siteAccess } from "@/lib/mcp/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/super-admin";
import { ROOT_TENANT_SLUG } from "@/lib/flags";
import { rootTenantId } from "@/lib/site/root-builder";

/** Who is calling a site's chat inbox or spam tools, and for which site. See /api/site-chat/inbox. */
export type InboxCaller = { tenantId: string; userId: string; role: string; user?: { email?: string | null } | null };

export async function resolveInboxCaller(req: NextRequest): Promise<InboxCaller | null> {
  if (req.nextUrl.searchParams.get("root") !== "1") {
    const caller = await getApiCaller(req);
    if (!caller?.tenantId) return null;
    // Super admins and staff working on a client's site are not members of it:
    // without this they were "viewer" and every inbox action came back Forbidden.
    let role = caller.role ?? null;
    if (!role || role === "viewer") {
      if ((await siteAccess(await createAdminClient(), caller.userId, caller.tenantId)) === "write") role = "editor";
    }
    return { tenantId: caller.tenantId, userId: caller.userId, role: role ?? "viewer", user: caller.user };
  }
  const user = await apiUser(req);
  if (!user) return null;
  const caller = { userId: user.id, user };
  const admin = await createAdminClient();
  let allowed = await isSuperAdmin(caller.userId);
  if (!allowed) {
    const { data: staff } = await admin.from("pc_staff").select("status").eq("user_id", caller.userId).maybeSingle();
    allowed = !!staff && staff.status === "active";
  }
  if (!allowed) return null;
  let tenantId = await rootTenantId();
  if (!tenantId) {
    const { data: t } = await admin.from("tenants").select("id").eq("slug", ROOT_TENANT_SLUG).maybeSingle();
    tenantId = (t?.id as string | undefined) ?? null;
  }
  return tenantId ? { tenantId, userId: caller.userId, role: "editor", user: caller.user } : null;
}
