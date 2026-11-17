/**
 * Footer menu fallbacks (pure): which links a footer menu widget shows.
 */
import type { NavItem } from "@/types/cms";
import { normalizeMenu } from "@/modules/navigation/menu-model";

export type MenuRow = { id: string; location: string | null; items: unknown };

/**
 * The menu a footer widget shows when it names none (or a deleted one): the
 * menu placed in the footer, else the header menu, else the classic header's
 * own links (most sites keep their menu there), else any saved menu, else
 * the site's published pages. Never empty for a site that has pages.
 */
export function pickFooterMenu(rows: MenuRow[], menuId: string, classic: NavItem[] | null, pages: NavItem[]): NavItem[] {
  if (menuId) {
    const own = rows.find((m) => m.id === menuId);
    if (own) return normalizeMenu(own.items);
  }
  const placed = rows.find((m) => m.location === "footer") ?? rows.find((m) => m.location === "header");
  if (placed) return normalizeMenu(placed.items);
  if (classic?.length) return classic;
  if (rows[0]) return normalizeMenu(rows[0].items);
  return pages;
}

/** Published pages as menu items (home first), the last fallback. */
export function pagesAsItems(rows: { slug: string; title: string | null }[]): NavItem[] {
  const sorted = [...rows].sort((a, b) => (a.slug === "home" ? -1 : b.slug === "home" ? 1 : 0));
  return sorted.slice(0, 8).map((p) => ({ id: `pg-${p.slug}`, label: p.title || p.slug, url: p.slug === "home" ? "/" : `/${p.slug}` }));
}
