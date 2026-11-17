"use client";

/**
 * Saving a menu from the builder (menus P3): the in-place canvas editor and
 * the "Edit full menu" drawer. Every save goes through /api/navigation, so
 * it is live at once and keeps a history version (menus P1).
 *
 * A header that shows the automatic menu (its pages) or its own typed links
 * has no saved menu yet: the first edit creates one ("materialises" it) with
 * those links, and the caller points the block / Studio element at it by id.
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { NavItem } from "@/types/cms";
import { newNavId, normalizeMenu } from "@/modules/navigation/menu-model";
import { AUTO_ITEM_PREFIX } from "@/modules/navigation/default-menu";
import { menuUsage, type MenuPlace, type MenuReaders } from "@/modules/navigation/menu-usage";
import type { TranslationKey } from "@/lib/i18n/locales/en";

export type EditableMenu = { id: string; name?: string | null; location?: string | null; items?: NavItem[] | null };

/** Saves a menu's links (live, with history). Null when it failed (a toast says why). */
export async function saveMenuItems(id: string, items: NavItem[], failMsg: string): Promise<EditableMenu | null> {
  try {
    const res = await fetch("/api/navigation", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, items }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.menu) throw new Error(json.error || failMsg);
    return json.menu as EditableMenu;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : failMsg);
    return null;
  }
}

/** Automatic-menu items get ordinary ids once they are saved as a real menu. */
export function withRealIds(items: NavItem[]): NavItem[] {
  return items.map((i) => ({
    ...i,
    ...(i.id.startsWith(AUTO_ITEM_PREFIX) ? { id: newNavId() } : {}),
    ...(i.children?.length ? { children: withRealIds(i.children) } : {}),
  }));
}

/**
 * Creates a saved menu holding `items` (the first in-place edit of an
 * automatic menu or of a block's own links). It takes `location` when that
 * slot is free, else stays unassigned; the caller links to it by id either way.
 */
export async function materializeMenu(items: NavItem[], name: string, location: string, menus: EditableMenu[], failMsg: string): Promise<EditableMenu | null> {
  const free = location !== "none" && !menus.some((m) => m.location === location);
  const post = async (loc: string) => fetch("/api/navigation", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, location: loc, items: normalizeMenu(withRealIds(items)) }),
  });
  try {
    let res = await post(free ? location : "none");
    // Someone took the slot meanwhile: keep it unassigned (linked by id anyway).
    if (res.status === 409) res = await post("none");
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.menu) throw new Error(json.error || failMsg);
    return json.menu as EditableMenu;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : failMsg);
    return null;
  }
}

let readersPromise: Promise<MenuReaders | null> | null = null;

/** What reads menus on the live site ("Used in"); fetched once per editor session. */
export function fetchMenuReaders(force = false): Promise<MenuReaders | null> {
  if (force) readersPromise = null;
  readersPromise ??= fetch("/api/navigation/usage")
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => (j?.readers ?? null) as MenuReaders | null)
    .catch(() => null);
  return readersPromise;
}

export const PLACE_KEY: Record<MenuPlace, TranslationKey> = {
  header: "navPage.placeHeader",
  footer: "navPage.placeFooter",
  prefooter: "navPage.placePrefooter",
  pages: "navPage.placePages",
  studioHeader: "navPage.placeStudioHeader",
  studioFooter: "navPage.placeStudioFooter",
};

/** The live places that show this menu (empty = shown nowhere yet), or null while loading. */
export function useMenuPlaces(menuId: string | undefined, menus: EditableMenu[] | null): MenuPlace[] | null {
  const [readers, setReaders] = useState<MenuReaders | null | undefined>(undefined);
  useEffect(() => {
    if (!menuId) return;
    let live = true;
    fetchMenuReaders().then((r) => live && setReaders(r));
    return () => { live = false; };
  }, [menuId]);
  return useMemo(() => {
    if (!menuId || !menus || readers === undefined) return null;
    if (!readers) return [];
    return menuUsage(menus.map((m) => ({ id: m.id, location: m.location ?? null })), readers)[menuId] ?? [];
  }, [menuId, menus, readers]);
}
