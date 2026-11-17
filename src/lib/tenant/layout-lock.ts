import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Layout lock (tenants.layout_locked, migration 161): the client edits data
 * (collections, media, forms...) but not pages, header/footer or menus.
 * Super admins and active Passive Coder staff are never locked. The database
 * enforces it for the builder (restrictive RLS); this is the same rule for
 * service-role paths (AI tools, translations, imports) and the dashboard.
 */
export async function layoutLockedFor(admin: SupabaseClient, userId: string, tenantId: string): Promise<boolean> {
  const { data: t } = await admin.from("tenants").select("layout_locked").eq("id", tenantId).maybeSingle();
  if (!t?.layout_locked) return false;
  const [{ data: sa }, { data: staff }] = await Promise.all([
    admin.from("super_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("pc_staff").select("id").eq("user_id", userId).eq("status", "active").maybeSingle(),
  ]);
  return !sa && !staff;
}

/** AI / MCP tools that change pages, header/footer or menus. */
export const LAYOUT_TOOLS = new Set([
  "save_page_blocks", "publish_page", "create_page", "create_post", "trash_page", "update_page_meta",
  "set_site_header", "upsert_menu", "find_replace_text", "set_block_image", "generate_page_content",
]);

/** Dashboard areas hidden and blocked on a locked site. */
export const LAYOUT_PATHS = [
  "/dashboard/pages", "/dashboard/posts", "/dashboard/header-builder", "/dashboard/themes",
  "/dashboard/templates", "/dashboard/navigation", "/dashboard/aicoder",
];

export const LAYOUT_LOCK_MESSAGE = "The page layout of this site is managed by Passive Coder. Ask your account manager for layout changes; you can still edit collections, media, forms and settings.";
