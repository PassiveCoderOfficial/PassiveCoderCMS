import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { expandDynamicChildren } from "@/modules/navigation/dynamic-children";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { resolveLiveHeader } from "@/modules/header-studio/doc";
import { classicHeaderItems } from "@/modules/header-studio/classic-links";
import { menuRefs, type HeaderConfig } from "@/modules/header-studio/model";
import type { NavItem } from "@/types/cms";

export interface StudioHeaderData {
  config: HeaderConfig;
  /** Menus the header uses, by element menuId ("" = the default header menu), expanded. */
  menus: Record<string, NavItem[]>;
}

type MenuRow = { id: string; location: string | null; items: unknown };

/** The saved menu an element points at: its own id, else the menu placed in the header. */
export function pickMenu(rows: MenuRow[], menuId: string): MenuRow | undefined {
  if (menuId) {
    const own = rows.find((m) => m.id === menuId);
    if (own) return own;
  }
  return rows.find((m) => m.location === "header");
}

/** Loads and expands the menus a header config uses. */
export async function loadHeaderMenus(tenantId: string, config: HeaderConfig): Promise<Record<string, NavItem[]>> {
  const refs = menuRefs(config);
  if (!refs.length) return {};
  const admin = await createAdminClient();
  const [{ data }, { data: identity }] = await Promise.all([
    admin.from("nav_menus").select("id, location, items").eq("tenant_id", tenantId),
    admin.from("site_identity").select("global_header").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  const rows = (data ?? []) as MenuRow[];
  // No saved header menu: the classic header's own links (most sites keep
  // their menu there), then any saved menu.
  const classic = classicHeaderItems((identity as { global_header?: unknown } | null)?.global_header);
  const out: Record<string, NavItem[]> = {};
  await Promise.all(refs.map(async (ref) => {
    const row = pickMenu(rows, ref);
    const items = row ? normalizeMenu(row.items) : classic ?? (rows[0] ? normalizeMenu(rows[0].items) : null);
    out[ref] = items ? await expandDynamicChildren(admin, tenantId, items) : [];
  }));
  return out;
}

/**
 * The site's live studio header, once per request (the layout and the page
 * share it through React cache). Null = the classic header path: no studio
 * document, nothing published, switched back to classic, or the
 * header_studio column not there yet (migration 240 not applied), which is
 * why this is its own query: an error here can only ever mean "classic".
 */
export const getStudioHeader = cache(async (tenantId: string | null): Promise<StudioHeaderData | null> => {
  if (!tenantId) return null;
  try {
    const admin = await createAdminClient();
    const { data, error } = await admin.from("site_identity").select("header_studio").eq("tenant_id", tenantId).maybeSingle();
    if (error || !data) return null;
    const config = resolveLiveHeader((data as { header_studio?: unknown }).header_studio);
    if (!config) return null;
    return { config, menus: await loadHeaderMenus(tenantId, config) };
  } catch {
    return null;
  }
});
