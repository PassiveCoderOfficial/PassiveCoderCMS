import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem } from "@/types/cms";
import { defaultMenuItems, toDefaultMenuPages } from "@/modules/navigation/default-menu";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * The site's automatic menu (menus P3, modules/navigation/default-menu):
 * its published top-level pages. One query, only run when a header has
 * nothing else to show; cached per request.
 */
export async function loadDefaultMenu(admin: SupabaseClient, tenantId: string): Promise<NavItem[]> {
  const { data } = await admin.from("pages")
    .select("id, slug, title, type, parent_id, order_index, seo")
    .eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
    .eq("type", "page").limit(300);
  return defaultMenuItems(toDefaultMenuPages((data ?? []) as Parameters<typeof toDefaultMenuPages>[0]));
}

/** Same, once per request (the page body and the header share it). */
export const getDefaultMenu = cache(async (tenantId: string): Promise<NavItem[]> => {
  return loadDefaultMenu(await createAdminClient() as unknown as SupabaseClient, tenantId);
});
