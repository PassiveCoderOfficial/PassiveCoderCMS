/**
 * Which saved menu a converted header/footer shows (menus P5). Pure.
 *
 * Rule (decision 2026-11-17): the Studio addresses menus by id. A classic header
 * that already reads a saved menu (by id, or by location) keeps that menu.
 * One with its own typed links reuses a saved menu holding exactly the same
 * links (ids aside), else a new "Main menu" is created with those links.
 *
 * A new menu is ALWAYS created at location "none": a classic block that
 * points at location "header" but finds no menu there shows its own links
 * today, and would silently start showing the new menu if it took that
 * location. Placement by id never touches the live classic header.
 */
import type { NavItem } from "@/types/cms";
import { normalizeMenu } from "@/modules/navigation/menu-model";

export type SavedMenu = { id: string; name?: string | null; location: string | null; items: unknown };

/** Placeholder id in a draft for the menu a switch is about to create. */
export const NEW_MENU_REF = "__switch_new_menu__";

export type MenuPlan =
  /** Show this saved menu (the classic block reads it already, or its links match exactly). */
  | { kind: "saved"; menuId: string; why: "reads" | "match" }
  /** Create a saved menu with these links (location "none") and show it. */
  | { kind: "new"; name: string; items: NavItem[]; ref: string }
  /** No links anywhere: the Studio's own fallback (header menu, else the automatic menu), as the classic block does. */
  | { kind: "default" };

/** A menu's content without item ids (two menus with the same links compare equal). */
export function menuShape(items: unknown): string {
  const strip = (list: NavItem[]): unknown[] => list.map((i) => {
    const { id: _id, children, ...rest } = i;
    void _id;
    return children?.length ? { ...rest, children: strip(children) } : rest;
  });
  return JSON.stringify(strip(normalizeMenu(items)));
}

/** A saved menu with exactly these links: the header menu first, then any other. */
export function findMatchingMenu(menus: SavedMenu[], items: unknown, preferLocation = "header"): SavedMenu | null {
  const want = menuShape(items);
  if (want === "[]") return null;
  const hits = menus.filter((m) => menuShape(m.items) === want);
  return hits.find((m) => m.location === preferLocation) ?? hits[0] ?? null;
}

/**
 * The menu a classic menu block (navigation / header_nav data) should become.
 * Mirrors what the block shows today (pickNavItems): a saved menu by id, then
 * the menu at its location, then its own links.
 */
export function planMenu(
  data: { items?: unknown; menuId?: string; menuLocation?: string } | null | undefined,
  menus: SavedMenu[],
  opts: { name?: string; ref?: string; preferLocation?: string } = {},
): MenuPlan {
  const d = data ?? {};
  if (d.menuId && menus.some((m) => m.id === d.menuId)) return { kind: "saved", menuId: d.menuId, why: "reads" };
  if (d.menuLocation) {
    const at = menus.find((m) => m.location === d.menuLocation);
    if (at) return { kind: "saved", menuId: at.id, why: "reads" };
  }
  const own = normalizeMenu(d.items);
  if (!own.length) return { kind: "default" };
  const match = findMatchingMenu(menus, own, opts.preferLocation);
  if (match) return { kind: "saved", menuId: match.id, why: "match" };
  return { kind: "new", name: opts.name ?? "Main menu", items: own, ref: opts.ref ?? NEW_MENU_REF };
}

/** The menu id a plan puts on the Studio element (undefined = the Studio's default menu). */
export function planMenuId(plan: MenuPlan): string | undefined {
  return plan.kind === "saved" ? plan.menuId : plan.kind === "new" ? plan.ref : undefined;
}
