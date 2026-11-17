import type { NavItem } from "@/types/cms";
import { normalizeMenu } from "@/modules/navigation/menu-model";

const NAV_TYPES = new Set(["navigation", "header_nav"]);

/**
 * The links of a site's classic header (site_identity.global_header): the
 * first "navigation" (legacy header block) or "header_nav" (container header
 * row) block with items. Most sites keep their menu there rather than in a
 * saved nav_menus menu (Nov 2026: 16 of 167 sites had one), so a studio
 * header falls back to these links instead of showing an empty menu.
 */
export function classicHeaderItems(globalHeader: unknown): NavItem[] | null {
  const stack: unknown[] = Array.isArray(globalHeader) ? [...globalHeader] : [];
  while (stack.length) {
    const b = stack.shift();
    if (!b || typeof b !== "object") continue;
    const blk = b as { type?: unknown; visible?: unknown; data?: { items?: unknown; columns?: unknown } };
    if (blk.visible === false) continue;
    if (typeof blk.type === "string" && NAV_TYPES.has(blk.type) && Array.isArray(blk.data?.items) && blk.data.items.length) {
      return normalizeMenu(blk.data.items);
    }
    if (Array.isArray(blk.data?.columns)) {
      for (const c of blk.data.columns as { blocks?: unknown }[]) {
        if (c && Array.isArray(c.blocks)) stack.push(...c.blocks);
      }
    }
  }
  return null;
}
