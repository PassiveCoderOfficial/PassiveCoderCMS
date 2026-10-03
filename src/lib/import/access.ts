import "server-only";
import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { apiTenantId } from "@/lib/tenant/api";
import { siteAccess } from "@/lib/mcp/auth";

/**
 * Who may use Import / Export on the current site. Exports need read access
 * (any member); imports need write (owner/admin/editor, assigned staff,
 * super admin), the same rule as AI Connect tokens.
 */
export async function importAccess(need: "read" | "write") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const tenantId = await apiTenantId();
  if (!user || !tenantId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const admin = await createAdminClient();
  const access = await siteAccess(admin, user.id, tenantId);
  if (!access || (need === "write" && access !== "write")) {
    return { error: NextResponse.json({ error: "You don't have permission to do this on this site." }, { status: 403 }) } as const;
  }
  return { admin, userId: user.id, tenantId } as const;
}
