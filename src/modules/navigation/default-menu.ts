/**
 * The default menu (menus P3, pure): what a header shows when it has nothing
 * to show. Product decision (2026-11-17): a header (classic header block,
 * Menu block, Studio menu element) with no saved menu and no typed links
 * shows an automatic menu built from the site's published pages: Home
 * first, Contact last, the others in between by the pages' own order (else
 * by title); only top-level pages; legal pages (privacy, terms, refund...)
 * only when there is nothing else. It is never stored: the first time the
 * owner edits it on the canvas it becomes a real saved menu (with a history
 * version) and the block points at it by id.
 *
 * Every live header in production shows links today (scripts/check-menu-
 * resolve.ts proves it), so this only ever fills a header that would be
 * empty.
 */
import type { NavItem } from "@/types/cms";

/** Item ids of the automatic menu start with this, so the editor can tell it apart. */
export const AUTO_ITEM_PREFIX = "auto-";
/** At most this many links (Home and Contact included). */
export const DEFAULT_MENU_MAX = 8;

export type DefaultMenuPage = {
  id: string;
  slug: string;
  title: string | null;
  type?: string | null;
  parent_id?: string | null;
  order_index?: number | null;
  /** Language of a translated page (pages.seo.lang); translated copies are left out. */
  lang?: string | null;
};

const LEGAL = /(^|-)(privacy|terms|terms-and-conditions|terms-of-service|refund|refunds|return-policy|returns|cookie|cookies|cookie-policy|disclaimer|legal|gdpr|shipping-policy)(-|$)/i;
const CONTACT = /^contact(-us)?$/i;

export function isLegalSlug(slug: string): boolean {
  return LEGAL.test(slug);
}

const isHome = (p: DefaultMenuPage) => p.slug.toLowerCase() === "home";

/** Top-level, untranslated, ordinary pages (not posts or landing pages). */
function menuCandidates(pages: DefaultMenuPage[]): DefaultMenuPage[] {
  return pages.filter((p) =>
    !!p && typeof p.slug === "string" && p.slug !== "" &&
    (p.type ?? "page") === "page" &&
    !p.parent_id && !p.slug.includes("/") && !p.lang);
}

/**
 * The automatic menu for these published pages. Home first, Contact last,
 * the rest by `order_index` when the site has ordered its pages, else by
 * title. Legal pages only when no other page exists. Empty when the site has
 * no pages.
 */
export function defaultMenuItems(pages: DefaultMenuPage[], max = DEFAULT_MENU_MAX): NavItem[] {
  const all = menuCandidates(pages);
  const home = all.find(isHome);
  const contact = all.find((p) => !isHome(p) && CONTACT.test(p.slug));
  let middle = all.filter((p) => p !== home && p !== contact);
  const nonLegal = middle.filter((p) => !isLegalSlug(p.slug));
  // Legal pages only when nothing else exists (besides Home and Contact).
  if (nonLegal.length || home || contact) middle = nonLegal;
  const ordered = middle.some((p) => typeof p.order_index === "number" && p.order_index !== 0);
  const title = (p: DefaultMenuPage) => (p.title || p.slug).toLocaleLowerCase();
  middle = [...middle].sort((a, b) => {
    if (ordered) {
      const d = (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER);
      if (d) return d;
    }
    return title(a) < title(b) ? -1 : title(a) > title(b) ? 1 : 0;
  });
  const room = Math.max(0, max - (home ? 1 : 0) - (contact ? 1 : 0));
  const list = [...(home ? [home] : []), ...middle.slice(0, room), ...(contact ? [contact] : [])];
  return list.map((p) => ({
    id: `${AUTO_ITEM_PREFIX}${p.id}`,
    label: (p.title || p.slug).trim() || p.slug,
    url: isHome(p) ? "/" : `/${p.slug}`,
    kind: "page" as const,
    ref: p.id,
  }));
}

/** True when these items are (still) the automatic menu, not a saved one. */
export function isDefaultMenu(items: NavItem[] | undefined | null): boolean {
  return !!items?.length && items.every((i) => typeof i?.id === "string" && i.id.startsWith(AUTO_ITEM_PREFIX));
}

type MenuBlockData = { items?: unknown; menuLocation?: string; menuId?: string };

/** No saved menu named and no typed links: the block on its own would show nothing. */
export function isEmptyMenuData(data: MenuBlockData | undefined | null): boolean {
  if (!data) return true;
  return !data.menuId && !data.menuLocation && !(Array.isArray(data.items) && data.items.length > 0);
}

/**
 * Should this menu block show the automatic menu? Only when it has no saved
 * menu (none named, or the named one is gone) and no typed links. A saved
 * menu that exists is respected even when the owner emptied it.
 */
export function wantsDefaultMenu(
  data: MenuBlockData | undefined | null,
  byLocation: Map<string, unknown>,
  byId?: Map<string, unknown>,
): boolean {
  if (!data) return true;
  if (data.menuId && byId?.has(data.menuId)) return false;
  if (data.menuLocation && byLocation.has(data.menuLocation)) return false;
  return !(Array.isArray(data.items) && data.items.length > 0);
}

/** Pages rows (as read from the database) to DefaultMenuPage. */
export function toDefaultMenuPages(rows: { id: unknown; slug: unknown; title?: unknown; type?: unknown; parent_id?: unknown; order_index?: unknown; seo?: unknown }[]): DefaultMenuPage[] {
  return rows.map((r) => {
    const lang = r.seo && typeof r.seo === "object" ? (r.seo as { lang?: unknown }).lang : null;
    return {
      id: String(r.id),
      slug: String(r.slug ?? ""),
      title: typeof r.title === "string" ? r.title : null,
      type: typeof r.type === "string" ? r.type : null,
      parent_id: r.parent_id ? String(r.parent_id) : null,
      order_index: typeof r.order_index === "number" ? r.order_index : null,
      lang: typeof lang === "string" && lang.trim() ? lang.trim().toLowerCase() : null,
    };
  });
}
