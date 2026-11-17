/**
 * Where each saved menu actually shows on the live site (pure).
 *
 * The Navigation screen used to promise things per location ("Footer: primary
 * footer links", "Mobile: overrides the header menu on small screens") that no
 * renderer did. P0 (2026-11-17) replaces those promises with this: a menu is
 * "shown" only when something live reads it.
 *
 * Readers today:
 * - a menu block (Menu Bar `navigation`, or `header_nav` at any depth) in the
 *   classic header, footer or pre-footer, or on a published page, that names
 *   the menu's location;
 * - a live Studio header menu element (by menu id; no id = the menu placed in
 *   "header");
 * - a live Studio footer menu widget (by id; no id = "footer", then "header").
 * When a Studio header (footer) is live, the classic header (footer) blocks
 * are not drawn, so their reads do not count.
 */
import { locationsReadBy } from "./nav-blocks";

export type MenuPlace = "header" | "footer" | "prefooter" | "pages" | "studioHeader" | "studioFooter";

export interface ReaderInput {
  classicHeader: unknown;
  classicFooter: unknown;
  classicPrefooter: unknown;
  /** Block trees of published pages (any language). */
  pages: unknown[];
  /** Menu ids of a live Studio header's menu elements ("" = default), or null when no Studio header is live. */
  studioHeaderRefs: string[] | null;
  /** Same for a live Studio footer's menu widgets. */
  studioFooterRefs: string[] | null;
}

/** What reads menus on the live site: per location, the places that read it; plus the live studios' menu refs. Serialisable. */
export interface MenuReaders {
  byLocation: Record<string, MenuPlace[]>;
  studioHeaderRefs: string[] | null;
  studioFooterRefs: string[] | null;
}

/** Built once on the server from the site's block trees and studio documents. */
export function menuReaders(input: ReaderInput): MenuReaders {
  const byLocation: Record<string, MenuPlace[]> = {};
  const read = (trees: unknown[], place: MenuPlace) => {
    for (const loc of locationsReadBy(trees)) {
      const list = (byLocation[loc] ??= []);
      if (!list.includes(place)) list.push(place);
    }
  };
  if (!input.studioHeaderRefs) read([input.classicHeader], "header");
  if (!input.studioFooterRefs) read([input.classicFooter], "footer");
  read([input.classicPrefooter], "prefooter");
  read(input.pages, "pages");
  return { byLocation, studioHeaderRefs: input.studioHeaderRefs, studioFooterRefs: input.studioFooterRefs };
}

/**
 * For each menu id, the live places that show it (empty = not shown
 * anywhere). Uses the menus' current (possibly unsaved) locations, so the
 * screen answers "where will this show once saved".
 */
export function menuUsage(menus: { id: string; location: string | null }[], readers: MenuReaders): Record<string, MenuPlace[]> {
  const out: Record<string, MenuPlace[]> = {};
  for (const m of menus) out[m.id] = [];
  const add = (id: string | undefined, place: MenuPlace) => {
    if (!id || !out[id] || out[id].includes(place)) return;
    out[id].push(place);
  };
  const atLocation = (loc: string) => menus.find((m) => m.location === loc)?.id;
  for (const [loc, places] of Object.entries(readers.byLocation)) for (const p of places) add(atLocation(loc), p);
  const own = (ref: string) => (ref && menus.some((m) => m.id === ref) ? ref : undefined);
  for (const ref of readers.studioHeaderRefs ?? []) add(own(ref) ?? atLocation("header"), "studioHeader");
  for (const ref of readers.studioFooterRefs ?? []) add(own(ref) ?? atLocation("footer") ?? atLocation("header"), "studioFooter");
  return out;
}
