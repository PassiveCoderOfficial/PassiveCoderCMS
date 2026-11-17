/**
 * Menu Studio data model (Header & Footer Studio, phase 1, Nov 2026).
 *
 * Menus stay where they always were: nav_menus.items, a NavItem[] JSON tree.
 * The studio only ADDS optional fields to NavItem (description, badge,
 * showIcon, device, openOn, mega, childIds, studio, plus the "products" and
 * "posts" auto-list sources). No migration: old rows simply lack them.
 *
 * Pixel safety: the site renderer only switches an item to the studio
 * renderer when usesStudio() is true for it, which needs one of those new
 * fields. Every menu saved before the studio therefore keeps its exact legacy
 * markup (tests: src/modules/navigation/__tests__/nav-legacy-render.test.ts).
 *
 * Pure functions only (no React, no Supabase), so tests and the dashboard
 * editor share them.
 */
import type { NavItem, NavChildSource, NavLinkKind, NavAudience, NavMegaConfig, NavMegaFeatured } from "@/types/cms";

/** Top level = 1, dropdown / mega column = 2, links inside a column or flyout = 3. */
export const MAX_MENU_DEPTH = 3;

const DEVICES = new Set(["all", "desktop", "mobile"]);
const OPEN_ON = new Set(["hover", "click"]);
const SOURCES = new Set<NavChildSource>(["manual", "services", "service_groups", "product_categories", "pages", "blog_categories", "products", "posts"]);
export const LINK_KINDS: readonly NavLinkKind[] = ["custom", "page", "post", "product", "service", "service_group", "category"];
const KINDS = new Set<string>(LINK_KINDS);
const AUDIENCES = new Set<string>(["guests", "members"]);
/** Language codes a per-language label may use ("bn", "ar", "zh-hk"...). */
const LANG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/;

/** Auto-list sources only the studio renderer knows. */
const STUDIO_SOURCES = new Set<NavChildSource>(["products", "posts"]);

export function newNavId(): string {
  return `nav-${Math.random().toString(36).slice(2, 9)}`;
}

function ownStudioField(i: NavItem): boolean {
  return !!(
    i.studio ||
    (typeof i.description === "string" && i.description.trim()) ||
    (typeof i.badge === "string" && i.badge.trim()) ||
    i.showIcon ||
    (i.device && i.device !== "all") ||
    i.openOn ||
    i.mega ||
    // Mega builder (menus P4): 6 columns (legacy draws at most 5) and column fields.
    (i.megaColumns as number) === 6 ||
    i.megaColumn === true ||
    i.megaSpan === 2 ||
    (typeof i.megaImage === "string" && !!i.megaImage.trim()) ||
    // Menus P1: who sees the item is decided in the browser, by the studio renderer.
    (i.audience && AUDIENCES.has(i.audience)) ||
    (i.childIds && i.childIds.length) ||
    (i.childSource && STUDIO_SOURCES.has(i.childSource))
  );
}

/**
 * True when this item (or anything under it) uses a Menu Studio feature, so
 * it must render through the studio renderer. False for every menu saved
 * before the studio existed: those keep the legacy renderer byte for byte.
 */
export function usesStudio(item: NavItem): boolean {
  if (ownStudioField(item)) return true;
  return (item.children ?? []).some(usesStudio);
}

export function hasGrandchildren(item: NavItem): boolean {
  return (item.children ?? []).some((c) => (c.children?.length ?? 0) > 0);
}

/** Mega menu or plain dropdown, the same inference the legacy renderer uses, plus `mega`. */
export function isMegaItem(item: NavItem): boolean {
  if (item.mega) return true;
  return item.megaMenu ?? hasGrandchildren(item);
}

/** Levels in this item's subtree, the item itself counted (leaf = 1). */
export function subtreeHeight(item: NavItem): number {
  const kids = item.children ?? [];
  return 1 + (kids.length ? Math.max(...kids.map(subtreeHeight)) : 0);
}

export function menuDepth(items: NavItem[]): number {
  return items.length ? Math.max(...items.map(subtreeHeight)) : 0;
}

/**
 * Cleans a stored or submitted menu without changing anything valid:
 * a correct legacy menu comes back deep-equal (test: "normalize keeps valid
 * legacy menus unchanged"). Fixes only what would crash or never render:
 * non-objects dropped, missing id/label/url filled, children past level 3
 * dropped (no renderer ever drew them), unknown enum values removed.
 */
export function normalizeMenu(input: unknown, depth = 1): NavItem[] {
  if (!Array.isArray(input)) return [];
  const out: NavItem[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const item = { ...(raw as Record<string, unknown>) } as NavItem & Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id) item.id = newNavId();
    if (typeof item.label !== "string") item.label = item.label == null ? "" : String(item.label);
    if (typeof item.url !== "string") item.url = "#";
    if (item.device !== undefined && !DEVICES.has(item.device as string)) delete item.device;
    if (item.openOn !== undefined && !OPEN_ON.has(item.openOn as string)) delete item.openOn;
    if (item.childSource !== undefined && !SOURCES.has(item.childSource)) delete item.childSource;
    if (item.childIds !== undefined) {
      if (!Array.isArray(item.childIds)) delete item.childIds;
      else item.childIds = item.childIds.filter((x): x is string => typeof x === "string" && !!x);
    }
    if (item.mega !== undefined && (typeof item.mega !== "object" || item.mega === null || Array.isArray(item.mega))) delete item.mega;
    // Mega builder (menus P4): only checked when present, so older menus come back untouched.
    if (item.mega && ((item.mega as Record<string, unknown>).cards !== undefined || (item.mega as Record<string, unknown>).width !== undefined)) item.mega = cleanMegaConfig(item.mega);
    if (item.megaColumn !== undefined && item.megaColumn !== true) delete item.megaColumn;
    if (item.megaSpan !== undefined && item.megaSpan !== 2) delete item.megaSpan;
    if (item.megaImage !== undefined && (typeof item.megaImage !== "string" || !item.megaImage.trim())) delete item.megaImage;
    // Menus P1 fields: only checked when present, so older menus come back untouched.
    if (item.kind !== undefined && !KINDS.has(item.kind as string)) { delete item.kind; delete item.ref; }
    if (item.ref !== undefined && (typeof item.ref !== "string" || !item.ref || !item.kind || item.kind === "custom")) delete item.ref;
    if (item.audience !== undefined && !AUDIENCES.has(item.audience as string)) delete item.audience;
    if (item.labels !== undefined) {
      const clean = cleanLabels(item.labels);
      if (clean) item.labels = clean; else delete item.labels;
    }
    if (item.children !== undefined) {
      if (!Array.isArray(item.children)) delete item.children;
      else if (depth >= MAX_MENU_DEPTH) item.children = item.children.length ? [] : item.children;
      else item.children = normalizeMenu(item.children, depth + 1);
    }
    out.push(item);
  }
  return out;
}

const CARD_FIELDS = ["image", "title", "text", "url", "ctaLabel"] as const;
/** Most featured cards a mega menu shows (menus P4). */
export const MAX_MEGA_CARDS = 2;

/** One featured card with only its text fields (empty ones dropped). */
export function cleanMegaCard(input: unknown): NavMegaFeatured {
  const out: NavMegaFeatured = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) return out;
  for (const k of CARD_FIELDS) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === "string" && v.trim()) out[k] = v;
  }
  return out;
}

/** The mega builder fields of `mega` checked: up to 2 cards, a known width. Other keys are kept as they are. */
function cleanMegaConfig(mega: NavMegaConfig): NavMegaConfig {
  const next = { ...mega } as NavMegaConfig & Record<string, unknown>;
  if (next.cards !== undefined) {
    if (!Array.isArray(next.cards)) delete next.cards;
    else next.cards = next.cards.filter((c) => c && typeof c === "object" && !Array.isArray(c)).slice(0, MAX_MEGA_CARDS).map(cleanMegaCard);
  }
  if (next.width !== undefined && next.width !== "container" && next.width !== "full") delete next.width;
  return next;
}

/** Per-language labels: lower-case language codes to non-empty text. Null when nothing usable is left. */
function cleanLabels(input: unknown): Record<string, string> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const code = k.trim().toLowerCase();
    if (LANG_RE.test(code) && typeof v === "string" && v.trim()) out[code] = v;
  }
  return Object.keys(out).length ? out : null;
}

// ── Menus P1: links by id, per-language labels, audience ─────────────────

/** A link the renderer looks up by id ("page:<uuid>"). */
export function refKey(kind: NavLinkKind, id: string): string {
  return `${kind}:${id}`;
}

/** Every id-based link in the tree, grouped by kind (for one query per kind). */
export function collectRefs(items: NavItem[], out: Map<NavLinkKind, Set<string>> = new Map()): Map<NavLinkKind, Set<string>> {
  for (const i of items) {
    if (i.kind && i.kind !== "custom" && i.ref) {
      const set = out.get(i.kind) ?? new Set<string>();
      set.add(i.ref);
      out.set(i.kind, set);
    }
    if (i.children?.length) collectRefs(i.children, out);
  }
  return out;
}

/**
 * Fills each id-based link's `url` with its live address. A record that is
 * gone (deleted, unpublished) keeps the stored url, the last known one.
 * Items without a ref are returned as the same objects, and the same array
 * comes back when nothing changed, so menus saved before P1 are untouched.
 */
export function applyRefUrls(items: NavItem[], urls: Map<string, string>): NavItem[] {
  let changed = false;
  const out = items.map((i) => {
    let next = i;
    if (i.kind && i.kind !== "custom" && i.ref) {
      const live = urls.get(refKey(i.kind, i.ref));
      if (live !== undefined && live !== i.url) next = { ...next, url: live };
    }
    if (i.children?.length) {
      const kids = applyRefUrls(i.children, urls);
      if (kids !== i.children) next = { ...next, children: kids };
    }
    if (next !== i) changed = true;
    return next;
  });
  return changed ? out : items;
}

/**
 * Labels in the page's language: an item with a label for `lang` shows it,
 * every other item keeps `label`. Same array back when nothing changes.
 */
export function localizeMenu(items: NavItem[], lang: string | null | undefined): NavItem[] {
  const code = lang?.trim().toLowerCase();
  if (!code) return items;
  const base = code.split("-")[0];
  let changed = false;
  const out = items.map((i) => {
    let next = i;
    const own = i.labels?.[code] ?? i.labels?.[base];
    if (own && own.trim() && own !== i.label) next = { ...next, label: own };
    if (i.children?.length) {
      const kids = localizeMenu(i.children, code);
      if (kids !== i.children) next = { ...next, children: kids };
    }
    if (next !== i) changed = true;
    return next;
  });
  return changed ? out : items;
}

/** Does any item (any level) show only to guests or only to signed-in customers? */
export function hasAudience(items: NavItem[] | undefined): boolean {
  return !!items?.some((i) => (i.audience && AUDIENCES.has(i.audience)) || hasAudience(i.children));
}

/**
 * Items this visitor sees. `signedIn` null = not known yet (first paint):
 * guest-only items show, customer-only items wait, so a signed-out visitor
 * (most of them) never sees a flash. Same array back when nothing is hidden.
 */
export function filterForAudience(items: NavItem[], signedIn: boolean | null): NavItem[] {
  let changed = false;
  const out: NavItem[] = [];
  for (const i of items) {
    const a = i.audience as NavAudience | undefined;
    if (a === "members" && signedIn !== true) { changed = true; continue; }
    if (a === "guests" && signedIn === true) { changed = true; continue; }
    if (i.children?.length) {
      const kids = filterForAudience(i.children, signedIn);
      if (kids !== i.children) { changed = true; out.push({ ...i, children: kids }); continue; }
    }
    out.push(i);
  }
  return changed ? out : items;
}

/** A link-picker choice (see /api/navigation/link-targets). */
export type RefTarget = { url: string; kind?: NavLinkKind; ref?: string };

/**
 * On save from the Navigation screen: items whose URL is exactly one of the
 * site's pages (or products, categories...) and that are not linked by id
 * yet get that id, so a later rename follows. The URL itself is not
 * changed, so the live menu looks the same. Ambiguous URLs are left alone.
 */
export function attachRefs(items: NavItem[], targets: RefTarget[]): NavItem[] {
  const byUrl = new Map<string, RefTarget | null>();
  for (const t of targets) {
    if (!t.kind || t.kind === "custom" || !t.ref) continue;
    byUrl.set(t.url, byUrl.has(t.url) ? null : t);
  }
  if (!byUrl.size) return items;
  let changed = false;
  const out = items.map((i) => {
    let next = i;
    if (!i.kind && !i.lang && !i.ref) {
      const hit = byUrl.get(i.url);
      if (hit) next = { ...next, kind: hit.kind, ref: hit.ref };
    }
    if (i.children?.length) {
      const kids = attachRefs(i.children, targets);
      if (kids !== i.children) next = { ...next, children: kids };
    }
    if (next !== i) changed = true;
    return next;
  });
  return changed ? out : items;
}

/** Items shown on one device: desktop menu bar or phone drawer. Unset / "all" shows on both. */
export function filterForDevice(items: NavItem[], device: "desktop" | "mobile"): NavItem[] {
  const hide = device === "desktop" ? "mobile" : "desktop";
  let changed = false;
  const out: NavItem[] = [];
  for (const i of items) {
    if (i.device === hide) { changed = true; continue; }
    if (i.children?.length) {
      const kids = filterForDevice(i.children, device);
      if (kids !== i.children) { changed = true; out.push({ ...i, children: kids }); continue; }
    }
    out.push(i);
  }
  // Same array back when nothing was hidden, so callers can skip work.
  return changed ? out : items;
}

/** Ids of every third-level item (used to tell structure the owner added from structure that was already there). */
export function collectDeepIds(items: NavItem[]): Set<string> {
  const ids = new Set<string>();
  for (const top of items) for (const c of top.children ?? []) for (const g of c.children ?? []) ids.add(g.id);
  return ids;
}

/**
 * Last pass before the editor saves. A plain dropdown (megaMenu false) with a
 * third level the owner just added gets `studio: true`, because only the
 * studio renderer draws that level (as side flyouts). Third-level items that
 * were already there at load keep the legacy look (legacy hid them), so
 * re-saving an untouched menu changes nothing. Items that no longer need the
 * marker lose it.
 */
export function prepareForSave(items: NavItem[], legacyDeepIds: Set<string> = new Set()): NavItem[] {
  return normalizeMenu(items).map((top) => {
    const plainDropdown = top.megaMenu === false && !top.mega;
    const newDeep = (top.children ?? []).some((c) => (c.children ?? []).some((g) => !legacyDeepIds.has(g.id)));
    const needs = plainDropdown && hasGrandchildren(top) && (top.studio === true || newDeep);
    if (needs && !top.studio) return { ...top, studio: true as const };
    if (!needs && top.studio) {
      const rest = { ...top };
      delete rest.studio;
      return rest;
    }
    return top;
  });
}

// ── Tree editing (drag and drop, keyboard indent/outdent) ─────────────────

export type FlatNavItem = {
  id: string;
  parentId: string | null;
  depth: number; // 0-based: 0 = top level
  item: NavItem;
};

export function flattenTree(items: NavItem[], parentId: string | null = null, depth = 0): FlatNavItem[] {
  return items.flatMap((item) => [
    { id: item.id, parentId, depth, item },
    ...flattenTree(item.children ?? [], item.id, depth + 1),
  ]);
}

/** Rebuilds a tree from a flat, depth-annotated list (in display order). */
export function buildTree(flat: FlatNavItem[]): NavItem[] {
  const root: NavItem[] = [];
  const byId = new Map<string, NavItem>();
  for (const f of flat) {
    const node: NavItem = { ...f.item };
    if (node.children) node.children = [];
    byId.set(f.id, node);
    const parent = f.parentId ? byId.get(f.parentId) : undefined;
    if (parent) (parent.children ??= []).push(node);
    else root.push(node);
  }
  return root;
}

function findPath(items: NavItem[], id: string, path: number[] = []): number[] | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === id) return [...path, i];
    const sub = findPath(items[i].children ?? [], id, [...path, i]);
    if (sub) return sub;
  }
  return null;
}

export function findItem(items: NavItem[], id: string): NavItem | null {
  for (const i of items) {
    if (i.id === id) return i;
    const sub = findItem(i.children ?? [], id);
    if (sub) return sub;
  }
  return null;
}

/** 1-based level of an item in the tree (0 when not found). */
export function levelOf(items: NavItem[], id: string): number {
  return findPath(items, id)?.length ?? 0;
}

export function removeItem(items: NavItem[], id: string): NavItem[] {
  return items
    .filter((i) => i.id !== id)
    .map((i) => (i.children?.length ? { ...i, children: removeItem(i.children, id) } : i));
}

export function updateItem(items: NavItem[], id: string, patch: Partial<NavItem>): NavItem[] {
  return items.map((i) => {
    if (i.id === id) {
      const next = { ...i, ...patch } as NavItem & Record<string, unknown>;
      // A patch value of undefined clears the field rather than storing a key with no value.
      for (const k of Object.keys(patch)) if ((patch as Record<string, unknown>)[k] === undefined) delete next[k];
      return next;
    }
    return i.children?.length ? { ...i, children: updateItem(i.children, id, patch) } : i;
  });
}

/** Can the item `id` live under `parentId` (null = top level) without going past level 3? */
export function canPlace(items: NavItem[], id: string, parentId: string | null): boolean {
  const item = findItem(items, id);
  if (!item) return false;
  if (parentId === null) return subtreeHeight(item) <= MAX_MENU_DEPTH;
  if (parentId === id || findItem(item.children ?? [], parentId)) return false; // into itself
  const parentLevel = levelOf(items, parentId);
  if (!parentLevel) return false;
  return parentLevel + subtreeHeight(item) <= MAX_MENU_DEPTH;
}

/** Moves an item (with its subtree) under parentId at index. Returns the same array when the move is not allowed. */
export function moveItem(items: NavItem[], id: string, parentId: string | null, index: number): NavItem[] {
  if (!canPlace(items, id, parentId)) return items;
  const item = findItem(items, id)!;
  const without = removeItem(items, id);
  const insert = (list: NavItem[]): NavItem[] => {
    const next = [...list];
    next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
    return next;
  };
  if (parentId === null) return insert(without);
  const place = (list: NavItem[]): NavItem[] => list.map((i) => {
    if (i.id === parentId) return { ...i, children: insert(i.children ?? []) };
    return i.children?.length ? { ...i, children: place(i.children) } : i;
  });
  return place(without);
}

/** Makes the item a child of the sibling above it (keyboard / button indent). */
export function indentItem(items: NavItem[], id: string): NavItem[] {
  const path = findPath(items, id);
  if (!path || path[path.length - 1] === 0) return items;
  const siblings = path.length === 1 ? items : findItemByPath(items, path.slice(0, -1))!.children!;
  const prev = siblings[path[path.length - 1] - 1];
  return moveItem(items, id, prev.id, (prev.children ?? []).length);
}

/**
 * One list entry moved up (-1) or down (+1). Nothing else changes: the
 * entries are the same objects, so a menu stored on a block keeps its exact
 * shape (the Menu Bar block's own link editor uses this). Same array back
 * when the move would leave the list.
 */
export function moveInList<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[index], next[to]] = [next[to], next[index]];
  return next;
}

/**
 * What a flat list of links would lose if it replaced this menu: sub-menus,
 * auto lists or Menu Studio settings (mega, icons, badges...). Empty = the
 * menu is flat and plain, safe to replace with a flat list.
 */
export function structureLostByFlatReplace(items: unknown): string[] {
  const menu = normalizeMenu(items);
  const out = new Set<string>();
  for (const i of menu) {
    if (i.children?.length) out.add("sub-menus");
    if (i.childSource && i.childSource !== "manual") out.add("auto lists");
    if (usesStudio(i)) out.add("menu settings (mega menu, icons, badges or similar)");
    if (hasLabels(i)) out.add("labels in other languages");
  }
  return [...out];
}

/** What one item carries that a careless replace could wipe (its own level only, not its sub-items). */
function itemFeatures(i: NavItem): string[] {
  const out: string[] = [];
  if (i.children?.length) out.push("sub-menus");
  if (i.childSource && i.childSource !== "manual") out.push("auto lists");
  if (ownStudioField(i)) out.push("menu settings (mega menu, icons, badges or similar)");
  if (i.labels && Object.keys(i.labels).length) out.push("labels in other languages");
  return out;
}

/**
 * What replacing `existing` with `next` would lose (menus P1, MCP): for every
 * item of the old menu (any level), each of its sub-menu / auto list / studio
 * settings / translations that the item with the same id in the new menu no
 * longer has (a removed item loses them all). Empty = safe to replace.
 */
export function structureLostByReplace(existing: unknown, next: unknown): string[] {
  const after = new Map(flattenTree(normalizeMenu(next)).map((f) => [f.id, new Set(itemFeatures(f.item))]));
  const out = new Set<string>();
  for (const f of flattenTree(normalizeMenu(existing))) {
    const kept = after.get(f.id);
    for (const feat of itemFeatures(f.item)) if (!kept?.has(feat)) out.add(feat);
  }
  return [...out];
}

function hasLabels(i: NavItem): boolean {
  return !!(i.labels && Object.keys(i.labels).length) || (i.children ?? []).some(hasLabels);
}

/** True when the item is first among its siblings, so "nest under the item above" has nothing to nest under. */
export function isFirstAmongSiblings(items: NavItem[], id: string): boolean {
  const path = findPath(items, id);
  return !!path && path[path.length - 1] === 0;
}

/** Moves the item out one level, right after its parent. */
export function outdentItem(items: NavItem[], id: string): NavItem[] {
  const path = findPath(items, id);
  if (!path || path.length < 2) return items;
  const parentPath = path.slice(0, -1);
  const grandParentId = parentPath.length === 1 ? null : findItemByPath(items, parentPath.slice(0, -1))!.id;
  return moveItem(items, id, grandParentId, parentPath[parentPath.length - 1] + 1);
}

/** Moves the item one place up or down among its siblings. */
export function shiftItem(items: NavItem[], id: string, dir: -1 | 1): NavItem[] {
  const path = findPath(items, id);
  if (!path) return items;
  const idx = path[path.length - 1];
  const parentId = path.length === 1 ? null : findItemByPath(items, path.slice(0, -1))!.id;
  const siblings = parentId === null ? items : findItem(items, parentId)!.children ?? [];
  const target = idx + dir;
  if (target < 0 || target >= siblings.length) return items;
  return moveItem(items, id, parentId, target);
}

function findItemByPath(items: NavItem[], path: number[]): NavItem | null {
  let list = items;
  let node: NavItem | null = null;
  for (const i of path) {
    node = list[i] ?? null;
    if (!node) return null;
    list = node.children ?? [];
  }
  return node;
}

/**
 * Drag-and-drop projection: where the dragged item lands given the row it is
 * over and how far it was dragged sideways (each `indent` px = one level).
 * Depth is clamped so the moved subtree never passes level 3.
 */
export function projectDrop(
  flat: FlatNavItem[],
  activeId: string,
  overId: string,
  offsetX: number,
  indent: number,
): { depth: number; parentId: string | null; index: number } | null {
  const activeIdx = flat.findIndex((f) => f.id === activeId);
  const overIdx = flat.findIndex((f) => f.id === overId);
  if (activeIdx < 0 || overIdx < 0) return null;
  const active = flat[activeIdx];
  // The dragged subtree moves as one: take it out of the list first.
  const subtreeIds = new Set(flattenTree([active.item]).map((f) => f.id));
  const rest = flat.filter((f) => !subtreeIds.has(f.id));
  // Position in `rest` where the item would be inserted.
  let insertAt: number;
  if (subtreeIds.has(overId)) {
    // Over itself: it stays in place, only the sideways drag counts.
    insertAt = flat.slice(0, activeIdx).filter((f) => !subtreeIds.has(f.id)).length;
  } else {
    insertAt = rest.findIndex((f) => f.id === overId);
    if (overIdx > activeIdx) insertAt += 1;
  }
  const prev = rest[insertAt - 1];
  const next = rest[insertAt];
  const height = subtreeHeight(active.item);
  const maxDepth = Math.min(prev ? prev.depth + 1 : 0, MAX_MENU_DEPTH - height);
  const minDepth = next ? next.depth : 0;
  const wanted = active.depth + Math.round(offsetX / indent);
  const depth = Math.max(Math.min(wanted, maxDepth), Math.min(minDepth, maxDepth), 0);
  // Parent: nearest earlier row one level up.
  let parentId: string | null = null;
  if (depth > 0) {
    for (let i = insertAt - 1; i >= 0; i--) {
      if (rest[i].depth === depth - 1) { parentId = rest[i].id; break; }
    }
  }
  // Index among the new siblings.
  let index = 0;
  for (let i = insertAt - 1; i >= 0; i--) {
    if (rest[i].depth < depth) break;
    if (rest[i].depth === depth) index++;
  }
  return { depth, parentId, index };
}

// ── Footer / plain link lists ───────────────────────────────────────────

export type MenuLink = {
  id: string;
  label: string;
  url: string;
  target?: "_blank" | "_self";
  lang?: string;
  /** 0 = top level. */
  depth: number;
  badge?: string;
  icon?: string;
  device?: "all" | "desktop" | "mobile";
};

/**
 * A menu as a flat list of links, for footer columns and sidebars. `levels`
 * caps how deep it goes (1 = top-level items only). Mega/dropdown structure is
 * dropped; "#" parents with no page of their own are skipped, their children kept.
 */
export function menuToLinks(items: NavItem[], opts: { levels?: number } = {}): MenuLink[] {
  const levels = Math.max(1, Math.min(opts.levels ?? 1, MAX_MENU_DEPTH));
  const out: MenuLink[] = [];
  const walk = (list: NavItem[], depth: number) => {
    for (const i of list) {
      const pureParent = (!i.url || i.url === "#") && (i.children?.length ?? 0) > 0;
      if (!pureParent) {
        out.push({
          id: i.id, label: i.label, url: i.url, depth,
          ...(i.target ? { target: i.target } : {}),
          ...(i.lang ? { lang: i.lang } : {}),
          ...(i.badge ? { badge: i.badge } : {}),
          ...(i.icon && i.showIcon ? { icon: i.icon } : {}),
          ...(i.device && i.device !== "all" ? { device: i.device } : {}),
        });
      }
      if (depth + 1 < levels || pureParent) walk(i.children ?? [], pureParent ? depth : depth + 1);
    }
  };
  walk(items, 0);
  return out;
}

// ── Auto lists (mega menu columns filled from the site's own data) ──────

export type AutoRow = { id: string; label: string; slug?: string | null; link?: string | null; image?: string | null; description?: string | null };

/** Link for a record of an auto-list source. */
export function autoRowUrl(source: NavChildSource, row: AutoRow): string {
  switch (source) {
    case "products": return `/products/${row.slug ?? row.id}`;
    case "posts": return `/blog/${row.slug ?? row.id}`;
    case "services": return row.link || `/services#${row.id}`;
    case "service_groups": return `/services#${row.slug ?? row.id}`;
    case "product_categories": return `/shop?category=${row.slug ?? row.id}`;
    default: return `/${row.slug ?? ""}`;
  }
}

/**
 * Rows from the database to menu links. With hand-picked ids, keeps the
 * owner's order and skips ids that no longer exist; otherwise keeps the
 * query's order (newest first for products and posts). Capped at `limit`.
 */
export function autoRowsToItems(source: NavChildSource, rows: AutoRow[], opts: { childIds?: string[]; limit?: number } = {}): NavItem[] {
  const limit = Math.max(1, opts.limit ?? 12);
  let ordered = rows;
  if (opts.childIds?.length) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    ordered = opts.childIds.map((id) => byId.get(id)).filter((r): r is AutoRow => !!r);
  }
  return ordered.slice(0, limit).map((r) => ({
    id: `auto-${source}-${r.id}`,
    label: r.label,
    url: autoRowUrl(source, r),
    ...(r.description ? { description: r.description } : {}),
  }));
}
