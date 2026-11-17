/**
 * Click-to-edit in the Header Studio preview (menus P4, carry-over from P3).
 *
 * The preview draws the real site header, which knows nothing about the
 * editor. When the owner clicks a link or button in it, the editor reads
 * where it sits (row and zone from the header's own data-hs-row /
 * data-hs-zone attributes, or the phone drawer) and its text and address,
 * and this finds the menu element and the menu item it stands for. Pure, so
 * the site markup stays untouched (no editor attributes in the header).
 */
import type { NavItem } from "@/types/cms";
import { findClickedItem } from "@/modules/navigation/canvas-edit";
import { ROW_KEYS, ZONES, allElements, drawerMenuElement, splitItems, type HeaderConfig, type HeaderElement } from "./model";

export type PreviewClick = {
  /** data-hs-row of the clicked element's row, when it is in a row. */
  row?: string | null;
  /** data-hs-zone of its zone. */
  zone?: string | null;
  /** True when the click was in the phone menu drawer (or its drop-down panel). */
  inDrawer?: boolean;
  /** True when the link sits inside a menu (a nav element). Logos, buttons, icons and drawer extras are not menu items. */
  inNav?: boolean;
  /** The link's text (or a button's accessible name). */
  text: string;
  href: string;
};

export type PreviewHit = { element: HeaderElement; item: NavItem; items: NavItem[] };

/** Items a menu element shows in the preview (same rule as MenuElement: its menu, else the header menu; split halves). */
export function elementItems(e: HeaderElement, menus: Record<string, NavItem[]>): NavItem[] {
  return splitItems(menus[e.menuId ?? ""] ?? menus[""] ?? [], e.menuPart);
}

/**
 * The menu element and item a click in the preview stands for, or null
 * (a logo, a button, an auto-list link). Elements in the clicked zone are
 * tried first, then the phone drawer's menu, then every menu element.
 * `items` is the element's whole menu (both halves of a split menu).
 */
export function locatePreviewClick(cfg: HeaderConfig, menus: Record<string, NavItem[]>, click: PreviewClick): PreviewHit | null {
  if (!click.text.trim() && !click.href) return null;
  if (!click.inNav) return null;
  const menusOf = (list: HeaderElement[]) => list.filter((e) => e.type === "menu");
  const tries: HeaderElement[][] = [];
  const row = ROW_KEYS.find((k) => k === click.row);
  const zone = ZONES.find((z) => z === click.zone);
  if (click.inDrawer) {
    const d = drawerMenuElement(cfg);
    if (d) tries.push([d]);
  } else if (row && zone) {
    tries.push(menusOf(cfg.rows[row].zones[zone]));
  }
  tries.push(menusOf(allElements(cfg, { enabledOnly: true })));
  for (const list of tries) {
    for (const e of list) {
      // In the drawer the whole menu shows; in a zone only the element's half.
      const shown = click.inDrawer ? (menus[e.menuId ?? ""] ?? menus[""] ?? []) : elementItems(e, menus);
      const item = findClickedItem(shown, click.text, click.href);
      if (item) return { element: e, item, items: menus[e.menuId ?? ""] ?? menus[""] ?? [] };
    }
  }
  return null;
}
