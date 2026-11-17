/**
 * Menu blocks inside a block tree (pure: no React, no Supabase).
 *
 * A menu can sit at the top of a header/page (the Menu Bar `navigation`
 * block, or a lone `header_nav`), or inside a container column: every
 * container header holds its `header_nav` that way, and page sections can
 * too. The renderer fills each of them from the saved menu it names
 * (`menuLocation`) and expands auto lists (all services, latest products...).
 *
 * Until P0 (2026-11-17) only top-level blocks were filled, so a saved menu
 * chosen for a container header was ignored on the live site. The walk below
 * reaches nested blocks too. Pixel safety: a nested block is only rebuilt
 * when it actually asks for something (a menu location, or an auto list);
 * every other nested block comes back as the very same object, so its HTML
 * cannot change. Top-level blocks keep their exact old treatment.
 */
import type { Block, ContainerBlockProps, FooterBlockProps, NavItem } from "@/types/cms";
import { isEmptyMenuData } from "./default-menu";

export type NavBlockType = "navigation" | "header_nav";

/** Same depth cap the renderer uses for containers inside containers. */
export const MAX_NAV_WALK_DEPTH = 4;

export function isNavBlock(b: unknown): b is Block & { type: NavBlockType; data: { items?: NavItem[]; menuLocation?: string } } {
  const t = (b as { type?: unknown } | null)?.type;
  return t === "navigation" || t === "header_nav";
}

/** Does any item (at any level) fill its children from live data? */
export function hasAutoChildren(items: unknown): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((i) => {
    if (!i || typeof i !== "object") return false;
    const it = i as NavItem;
    if (it.childSource && it.childSource !== "manual") return true;
    return hasAutoChildren(it.children);
  });
}

/**
 * A nested menu block only needs resolving when it names a menu (by location
 * or id), holds an auto list, or (menus P3) has nothing at all, so it shows
 * the site's automatic menu. No live block was empty when P3 shipped.
 */
export function nestedNeedsResolve(b: Block): boolean {
  if (!isNavBlock(b)) return false;
  const data = (b.data ?? {}) as { items?: unknown; menuLocation?: string; menuId?: string };
  return !!data.menuLocation || !!data.menuId || hasAutoChildren(data.items) || isEmptyMenuData(data);
}

/**
 * A page-builder "Menu" block (menus P2): a `header_nav` drawn by the new
 * menu renderer (`layout` set). It is content, not site chrome: it never
 * makes a container count as a header (lib/site/global-blocks isChromeBlock)
 * and never triggers the header logo lookup in the page renderer.
 */
export function isMenuPlacement(b: unknown): boolean {
  if (!b || typeof b !== "object") return false;
  const blk = b as { type?: unknown; data?: { layout?: unknown } };
  return blk.type === "header_nav" && typeof blk.data?.layout === "string" && !!blk.data.layout;
}

/** Saved menu ids the columns of a classic footer block show (menus P2). Empty for every footer saved before P2. */
export function footerColumnMenuIds(b: unknown): string[] {
  if (!b || typeof b !== "object" || (b as { type?: unknown }).type !== "footer") return [];
  const cols = (b as FooterBlockProps).data?.columns;
  if (!Array.isArray(cols)) return [];
  return cols.map((c) => (c && typeof c.menuId === "string" ? c.menuId : "")).filter(Boolean);
}

/** Every classic footer block in the tree (top level or inside containers). */
export function collectFooterBlocks(blocks: unknown, depth = 0, out: Block[] = []): Block[] {
  if (!Array.isArray(blocks) || depth > MAX_NAV_WALK_DEPTH) return out;
  for (const b of blocks as Block[]) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "footer") out.push(b);
    else if (b.type === "container") {
      for (const col of ((b as ContainerBlockProps).data?.columns ?? [])) collectFooterBlocks(col?.blocks, depth + 1, out);
    }
  }
  return out;
}

/** Every menu block in the tree, top level first, with how deep it sits (0 = top level). */
export function collectNavBlocks(blocks: unknown, depth = 0, out: { block: Block; depth: number }[] = []): { block: Block; depth: number }[] {
  if (!Array.isArray(blocks) || depth > MAX_NAV_WALK_DEPTH) return out;
  for (const b of blocks as Block[]) {
    if (!b || typeof b !== "object") continue;
    if (isNavBlock(b)) out.push({ block: b, depth });
    else if (b.type === "container") {
      for (const col of ((b as ContainerBlockProps).data?.columns ?? [])) collectNavBlocks(col?.blocks, depth + 1, out);
    }
  }
  return out;
}

/** Menu locations read by any menu block in these trees (top level or nested). */
export function locationsReadBy(trees: unknown[]): Set<string> {
  const out = new Set<string>();
  for (const t of trees) for (const { block } of collectNavBlocks(t)) {
    const loc = (block.data as { menuLocation?: string } | undefined)?.menuLocation;
    if (loc) out.add(loc);
  }
  return out;
}

/** Saved menu ids read by any menu block (by id) or classic footer column in these trees (menus P2). */
export function menuIdsReadBy(trees: unknown[]): Set<string> {
  const out = new Set<string>();
  for (const t of trees) {
    for (const { block } of collectNavBlocks(t)) {
      const id = (block.data as { menuId?: string } | undefined)?.menuId;
      if (id) out.add(id);
    }
    for (const f of collectFooterBlocks(t)) for (const id of footerColumnMenuIds(f)) out.add(id);
  }
  return out;
}

/** True when a nested menu block somewhere in these blocks has a menu location or an auto list. */
export function hasNestedNavToResolve(blocks: Block[]): boolean {
  return collectNavBlocks(blocks).some(({ block, depth }) => depth > 0 && nestedNeedsResolve(block));
}

/**
 * True when these (visible, top-level) blocks hold anything the page renderer
 * must fill from saved menus WITHOUT the header logo lookup: a nested menu
 * block that names a menu or holds an auto list (P0), a page "Menu" block at
 * the top level, or a classic footer column that shows a saved menu (P2).
 * Blocks saved before P2 only ever match the first case, as before.
 */
export function hasMenusToResolve(blocks: Block[]): boolean {
  if (hasNestedNavToResolve(blocks)) return true;
  return blocks.some((b) => isMenuPlacement(b)) || collectFooterBlocks(blocks).some((f) => footerColumnMenuIds(f).length > 0);
}

/**
 * The items a menu block shows: the saved menu it names by id (menus P2),
 * else the saved menu at its location, else its own links. (A menu that is
 * missing keeps the block's own links: a bar with slightly stale links beats
 * an empty one.) Blocks without `menuId` resolve exactly as before P2.
 */
export function pickNavItems(data: { items?: NavItem[]; menuLocation?: string; menuId?: string }, byLocation: Map<string, NavItem[]>, byId?: Map<string, NavItem[]>): NavItem[] | undefined {
  if (data.menuId && byId) {
    const own = byId.get(data.menuId);
    if (own) return own;
  }
  return data.menuLocation ? byLocation.get(data.menuLocation) ?? data.items : data.items;
}

type Fill = (block: Block) => Promise<Block>;

/**
 * Rebuilds the tree with every menu block passed through `fill`. Top-level
 * menu blocks always go through it (as before P0). Nested ones only when
 * nestedNeedsResolve; containers are copied only when something inside them
 * changed, so untouched branches keep object identity.
 */
export async function mapNavBlocks(blocks: Block[], fill: Fill, depth = 0, fillFooter?: Fill): Promise<Block[]> {
  let changed = false;
  const out = await Promise.all(blocks.map(async (b) => {
    if (!b || typeof b !== "object") return b;
    if (isNavBlock(b)) {
      if (depth > 0 && !nestedNeedsResolve(b)) return b;
      changed = true;
      return fill(b);
    }
    // Classic footer columns that show a saved menu (menus P2). Footers
    // without one (every footer saved before P2) are not touched.
    if (fillFooter && b.type === "footer") {
      if (!footerColumnMenuIds(b).length) return b;
      changed = true;
      return fillFooter(b);
    }
    if (b.type === "container" && depth < MAX_NAV_WALK_DEPTH) {
      const c = b as ContainerBlockProps;
      const cols = c.data?.columns;
      if (!Array.isArray(cols)) return b;
      let colsChanged = false;
      const nextCols = await Promise.all(cols.map(async (col) => {
        if (!col || !Array.isArray(col.blocks)) return col;
        const next = await mapNavBlocks(col.blocks, fill, depth + 1, fillFooter);
        if (next === col.blocks) return col;
        colsChanged = true;
        return { ...col, blocks: next };
      }));
      if (!colsChanged) return b;
      changed = true;
      return { ...c, data: { ...c.data, columns: nextCols } } as Block;
    }
    return b;
  }));
  return changed ? out : blocks;
}

/**
 * The first menu block holding its own links (no menu location), at any
 * depth, for the Navigation page's "import this menu" offer. Also returns
 * blocks whose menu location has no saved menu yet (`missing`), since those
 * show their own links too.
 */
export function findImportableNav(
  blocks: unknown,
  savedLocations: Set<string>,
): { block: Block; items: NavItem[]; pointsAt?: string } | null {
  for (const { block } of collectNavBlocks(blocks)) {
    const data = (block.data ?? {}) as { items?: NavItem[]; menuLocation?: string; menuId?: string };
    // A Menu block that shows a saved menu by id (menus P2): nothing to import.
    if (data.menuId) continue;
    if (!Array.isArray(data.items) || data.items.length === 0) continue;
    // A block that reads a saved menu which exists: nothing to import.
    if (data.menuLocation && savedLocations.has(data.menuLocation)) return null;
    return data.menuLocation ? { block, items: data.items, pointsAt: data.menuLocation } : { block, items: data.items };
  }
  return null;
}

/** Deep equality for plain JSON (menus). */
export function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Points every menu block that shows `items` (same links, any depth) at
 * `location`, for the import. A container header usually holds a desktop and
 * a phone copy; only copies with exactly the imported links are repointed,
 * so a different phone menu is never replaced by the desktop one.
 * Returns the new tree and how many blocks were repointed.
 */
export function pointNavBlocksAt(blocks: Block[], items: NavItem[], location: string, depth = 0): { blocks: Block[]; count: number } {
  let count = 0;
  const walk = (list: Block[], d: number): Block[] => list.map((b) => {
    if (!b || typeof b !== "object") return b;
    if (isNavBlock(b)) {
      const data = (b.data ?? {}) as { items?: NavItem[]; menuLocation?: string; menuId?: string };
      // Already pointing at `location` (whose menu was missing), or at a menu by id: nothing to change.
      if (!data.menuLocation && !data.menuId && sameJson(data.items ?? [], items)) {
        count++;
        return { ...b, data: { ...b.data, menuLocation: location } } as Block;
      }
      return b;
    }
    if (b.type === "container" && d < MAX_NAV_WALK_DEPTH) {
      const c = b as ContainerBlockProps;
      if (!Array.isArray(c.data?.columns)) return b;
      return { ...c, data: { ...c.data, columns: c.data.columns.map((col) => (col && Array.isArray(col.blocks) ? { ...col, blocks: walk(col.blocks, d + 1) } : col)) } } as Block;
    }
    return b;
  });
  const next = walk(blocks, depth);
  return { blocks: next, count };
}
