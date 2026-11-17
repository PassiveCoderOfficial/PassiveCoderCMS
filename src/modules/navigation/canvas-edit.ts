/**
 * In-place menu editing on the builder canvas (menus P3, pure).
 */
import type { NavItem } from "@/types/cms";
import { flattenTree } from "./menu-model";

const pathOf = (href: string) => {
  try { return new URL(href, "http://x").pathname.replace(/\/+$/, "") || "/"; } catch { return href; }
};
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * The menu item a link clicked on the canvas stands for: the item with the
 * same text (the link's text can carry a badge or description after the
 * label), preferring the one with the same address when several match;
 * else the only item with that address. Null for links an auto list adds.
 */
export function findClickedItem(items: NavItem[], text: string, href: string): NavItem | null {
  const flat = flattenTree(items).map((f) => f.item);
  const txt = norm(text);
  const want = pathOf(href);
  const exact = flat.filter((i) => norm(i.label) === txt);
  const loose = exact.length ? exact : flat.filter((i) => norm(i.label) && txt.startsWith(norm(i.label)));
  if (loose.length) return loose.find((i) => pathOf(i.url) === want) ?? loose[0];
  if (!href) return null;
  const byUrl = flat.filter((i) => i.url && pathOf(i.url) === want);
  return byUrl.length === 1 ? byUrl[0] : null;
}
