import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { siteAccess } from "@/lib/mcp/auth";

/**
 * True when the signed-in user may change things on this site (owner, admin,
 * editor, assigned staff, super admin). View-only members get false. Use in
 * dashboard API writes that otherwise only checked membership.
 */
export async function canWriteSite(tenantId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  return (await siteAccess(await createAdminClient(), user.id, tenantId)) === "write";
}
