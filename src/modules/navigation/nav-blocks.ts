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
import type { Block, ContainerBlockProps, NavItem } from "@/types/cms";

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

/** A nested menu block only needs resolving when it names a menu or holds an auto list. */
export function nestedNeedsResolve(b: Block): boolean {
  if (!isNavBlock(b)) return false;
  const data = (b.data ?? {}) as { items?: unknown; menuLocation?: string };
  return !!data.menuLocation || hasAutoChildren(data.items);
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

/** True when a nested menu block somewhere in these blocks has a menu location or an auto list. */
export function hasNestedNavToResolve(blocks: Block[]): boolean {
  return collectNavBlocks(blocks).some(({ block, depth }) => depth > 0 && nestedNeedsResolve(block));
}

/**
 * The items a menu block shows: the saved menu at its location, else its own
 * links. (A location with no saved menu keeps the block's own links: a bar
 * with slightly stale links beats an empty one.)
 */
export function pickNavItems(data: { items?: NavItem[]; menuLocation?: string }, byLocation: Map<string, NavItem[]>): NavItem[] | undefined {
  return data.menuLocation ? byLocation.get(data.menuLocation) ?? data.items : data.items;
}

type Fill = (block: Block) => Promise<Block>;

/**
 * Rebuilds the tree with every menu block passed through `fill`. Top-level
 * menu blocks always go through it (as before P0). Nested ones only when
 * nestedNeedsResolve; containers are copied only when something inside them
 * changed, so untouched branches keep object identity.
 */
export async function mapNavBlocks(blocks: Block[], fill: Fill, depth = 0): Promise<Block[]> {
  let changed = false;
  const out = await Promise.all(blocks.map(async (b) => {
    if (!b || typeof b !== "object") return b;
    if (isNavBlock(b)) {
      if (depth > 0 && !nestedNeedsResolve(b)) return b;
      changed = true;
      return fill(b);
    }
    if (b.type === "container" && depth < MAX_NAV_WALK_DEPTH) {
      const c = b as ContainerBlockProps;
      const cols = c.data?.columns;
      if (!Array.isArray(cols)) return b;
      let colsChanged = false;
      const nextCols = await Promise.all(cols.map(async (col) => {
        if (!col || !Array.isArray(col.blocks)) return col;
        const next = await mapNavBlocks(col.blocks, fill, depth + 1);
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
    const data = (block.data ?? {}) as { items?: NavItem[]; menuLocation?: string };
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
      const data = (b.data ?? {}) as { items?: NavItem[]; menuLocation?: string };
      // Already pointing at `location` (whose menu was missing): nothing to change.
      if (!data.menuLocation && sameJson(data.items ?? [], items)) {
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
