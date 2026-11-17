/**
 * Saving a menu with history (menus P1, Nov 2026). Used by the Navigation
 * API, restore / undo, and the MCP menu tools, with a service-role client
 * (callers check edit access first). Needs no Next.js runtime, so MCP tests
 * run it against a fake client.
 *
 * History lives in nav_menu_versions (migration 252). Until that migration
 * is applied every history call fails softly: the menu still saves and
 * `history` comes back false.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem } from "@/types/cms";
import { normalizeMenu } from "./menu-model";
import {
  MENU_HISTORY_CAP, beforeVersionTime, nextVersionTime, needsBeforeVersion, newestFirst, sameSnapshot, undoTarget, versionsToTrim,
  type MenuVersion, type MenuVersionSource,
} from "./menu-history";

const TABLE = "nav_menu_versions";

export type MenuRow = { id: string; tenant_id: string; name: string; slug?: string; location: string; items: unknown; updated_at?: string };

/** Every version of one menu, newest first. null = history not available (table missing or a read error). */
export async function listMenuVersions(db: SupabaseClient, tenantId: string, menuId: string): Promise<MenuVersion[] | null> {
  const { data, error } = await db.from(TABLE).select("id, menu_id, name, items, saved_by, source, created_at")
    .eq("tenant_id", tenantId).eq("menu_id", menuId).order("created_at", { ascending: false }).limit(MENU_HISTORY_CAP + 20);
  if (error) return null;
  return newestFirst((data ?? []) as MenuVersion[]);
}

async function insertVersion(db: SupabaseClient, row: { menu_id: string; tenant_id: string; name: string; items: unknown; saved_by: string | null; source: MenuVersionSource; created_at?: string }): Promise<boolean> {
  const { error } = await db.from(TABLE).insert({ created_at: new Date().toISOString(), ...row });
  return !error;
}

async function trim(db: SupabaseClient, tenantId: string, menuId: string) {
  const all = await listMenuVersions(db, tenantId, menuId);
  const drop = all ? versionsToTrim(all) : [];
  if (drop.length) await db.from(TABLE).delete().eq("tenant_id", tenantId).in("id", drop);
}

export interface SaveInput {
  tenantId: string;
  menuId: string;
  patch: { name?: string; slug?: string; location?: string; items?: NavItem[] };
  userId: string | null;
  source: MenuVersionSource;
}

export interface SaveResult {
  menu: MenuRow | null;
  error?: string;
  /** False when history could not be written (migration 252 not applied). */
  history: boolean;
}

/**
 * Updates one menu and records the new content as a version. Writes a
 * "before" version first when the menu has none yet (or was changed outside
 * the app), so the save can be undone. A save that changes only the location
 * keeps no version (placement is not content).
 */
export async function saveMenuWithHistory(db: SupabaseClient, input: SaveInput): Promise<SaveResult> {
  const { tenantId, menuId, patch, userId, source } = input;
  const { data: current } = await db.from("nav_menus").select("id, tenant_id, name, slug, location, items, updated_at")
    .eq("id", menuId).eq("tenant_id", tenantId).maybeSingle();
  if (!current) return { menu: null, error: "Menu not found", history: false };
  const cur = current as MenuRow;
  const next = { name: patch.name ?? cur.name, items: patch.items ?? cur.items };
  const contentChanges = !sameSnapshot(cur, next);

  let history = false;
  let known: { created_at: string }[] = [];
  if (contentChanges) {
    const versions = await listMenuVersions(db, tenantId, menuId);
    history = versions !== null;
    known = versions ?? [];
    if (versions && needsBeforeVersion(versions, cur)) {
      // When it last changed, kept after the newest version and before this save.
      const at = beforeVersionTime(versions, cur.updated_at);
      history = await insertVersion(db, {
        menu_id: menuId, tenant_id: tenantId, name: cur.name, items: normalizeMenu(cur.items), saved_by: null, source: "before", created_at: at,
      });
      known = [...known, { created_at: at }];
    }
  }

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of ["name", "slug", "location", "items"] as const) if (patch[k] !== undefined) row[k] = patch[k];
  const { data, error } = await db.from("nav_menus").update(row).eq("id", menuId).eq("tenant_id", tenantId)
    .select("*").maybeSingle();
  if (error) return { menu: null, error: error.message, history: false };
  if (!data) return { menu: null, error: "Menu not found", history: false };

  if (contentChanges && history) {
    history = await insertVersion(db, { menu_id: menuId, tenant_id: tenantId, name: next.name, items: next.items, saved_by: userId, source, created_at: nextVersionTime(known) });
    if (history) await trim(db, tenantId, menuId);
  }
  return { menu: data as MenuRow, history };
}

/** First version of a menu that was just created (so its first edit can be undone). */
export async function recordNewMenu(db: SupabaseClient, menu: MenuRow, userId: string | null, source: MenuVersionSource): Promise<boolean> {
  return insertVersion(db, { menu_id: menu.id, tenant_id: menu.tenant_id, name: menu.name, items: normalizeMenu(menu.items), saved_by: userId, source });
}

/**
 * Puts an older version back (as a new save, so it can itself be undone).
 * `versionId` = a version from the list; "undo" = the newest version that
 * differs from the menu now (one step back).
 */
export async function restoreMenuVersion(
  db: SupabaseClient,
  input: { tenantId: string; menuId: string; versionId: string | "undo"; userId: string | null; source?: MenuVersionSource },
): Promise<SaveResult & { restored?: MenuVersion }> {
  const { tenantId, menuId, versionId, userId } = input;
  const versions = await listMenuVersions(db, tenantId, menuId);
  if (versions === null) return { menu: null, error: "Menu history is not switched on yet.", history: false };
  let target: MenuVersion | null = null;
  if (versionId === "undo") {
    const { data: current } = await db.from("nav_menus").select("name, items").eq("id", menuId).eq("tenant_id", tenantId).maybeSingle();
    if (!current) return { menu: null, error: "Menu not found", history: false };
    target = undoTarget(versions, current as { name: string; items: unknown });
    if (!target) return { menu: null, error: "There is no earlier version to go back to.", history: true };
  } else {
    target = versions.find((v) => v.id === versionId) ?? null;
    if (!target) return { menu: null, error: "Version not found", history: true };
  }
  const res = await saveMenuWithHistory(db, {
    tenantId, menuId, userId,
    source: input.source ?? (versionId === "undo" ? "undo" : "restore"),
    patch: { name: target.name || undefined, items: normalizeMenu(target.items) },
  });
  return { ...res, restored: target };
}
