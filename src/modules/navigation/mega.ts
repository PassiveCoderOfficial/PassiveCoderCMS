/**
 * Mega menu builder (menus P4, Nov 2026): pure helpers shared by the site
 * renderer (nav-menu-studio.tsx) and the visual builder in the menu editor.
 *
 * The data stays what it always was: a mega menu is a top-level item, its
 * second-level items are the columns (label = heading, children = links)
 * and second-level items with no links are "single links" (a strip on top or
 * a highlighted last column). P4 only adds optional fields:
 * - on the item's `mega`: `cards` (0 to 2 featured cards, replacing the
 *   single `featured` once set) and `width` ("container" or "full");
 * - `megaColumns` may be 6;
 * - on a column: `megaColumn` (a column even with no links yet), `megaSpan`
 *   (2 = double width) and `megaImage`.
 * A menu without them renders exactly as before (usesMegaBuilder is false).
 */
import type { NavItem, NavMegaFeatured } from "@/types/cms";
import { MAX_MEGA_CARDS, cleanMegaCard, newNavId } from "./menu-model";

export { MAX_MEGA_CARDS };
export const MEGA_COLUMN_COUNTS = [2, 3, 4, 5, 6] as const;
export type MegaColumnCount = (typeof MEGA_COLUMN_COUNTS)[number];

/** A featured card shows when it has a title or an image. */
export function cardShows(c: NavMegaFeatured | undefined | null): c is NavMegaFeatured {
  return !!c && !!(c.title?.trim() || c.image);
}

/** The cards as stored: `cards` when set, else the old single `featured` (0 or 1). Empty cards included. */
export function megaCardsRaw(item: NavItem): NavMegaFeatured[] {
  if (Array.isArray(item.mega?.cards)) return item.mega.cards.slice(0, MAX_MEGA_CARDS);
  return item.mega?.featured ? [item.mega.featured] : [];
}

/** The cards the visitor sees (only those with a title or an image). */
export function megaCards(item: NavItem): NavMegaFeatured[] {
  return megaCardsRaw(item).filter(cardShows);
}

/** A second-level item drawn as a column: it has links, or the builder made it a column (image, heading only...). */
export function isMegaColumn(c: NavItem): boolean {
  return (c.children?.length ?? 0) > 0 || c.megaColumn === true || !!c.megaImage;
}

/** Columns and single links of a mega menu, in order. */
export function splitMega(item: NavItem): { columns: NavItem[]; singles: NavItem[] } {
  const kids = item.children ?? [];
  return { columns: kids.filter(isMegaColumn), singles: kids.filter((c) => !isMegaColumn(c)) };
}

/** Does this item use a mega builder field? False for every menu saved before P4. */
export function usesMegaBuilder(item: NavItem): boolean {
  const m = item.mega;
  if (m && (m.cards !== undefined || m.width !== undefined)) return true;
  if (item.megaColumns === 6) return true;
  return (item.children ?? []).some((c) => c.megaColumn === true || c.megaSpan === 2 || !!c.megaImage);
}

/** A new, empty column (heading only, no link of its own). */
export function newMegaColumn(heading: string): NavItem {
  return { id: newNavId(), label: heading, url: "#", megaColumn: true, children: [] };
}

/**
 * Patch that stores `cards` (0-2) on a mega item. The old single `featured`
 * becomes the first card the moment the owner edits cards, so nothing is lost
 * and only one place holds them from then on.
 */
export function cardsPatch(item: NavItem, cards: NavMegaFeatured[]): Partial<NavItem> {
  const mega = { ...(item.mega ?? {}) };
  delete mega.featured;
  mega.cards = cards.slice(0, MAX_MEGA_CARDS).map(cleanMegaCard);
  return { mega, megaMenu: true };
}

/** Patch for one column-level change of a mega item (columns live in `children`). */
export function columnsPatch(columns: NavItem[], singles: NavItem[]): Partial<NavItem> {
  // Columns first, then single links: the renderer reads them by kind, so order across kinds never matters.
  return { children: [...columns, ...singles] };
}

/** Moves one entry of a list by `dir` (-1 / +1). Same list back when it cannot move. */
export function moveEntry<T extends { id: string }>(list: T[], id: string, dir: -1 | 1): T[] {
  const i = list.findIndex((x) => x.id === id);
  const to = i + dir;
  if (i < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[i], next[to]] = [next[to], next[i]];
  return next;
}

/** Default grid columns: the stored count, else 4 with a card on the side and 5 without (as before P4). */
export function megaGridColumns(item: NavItem): number {
  return item.megaColumns ?? (megaCards(item).length ? 4 : 5);
}
