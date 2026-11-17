"use client";

/**
 * The site's saved menus (Dashboard > Navigation) for the page builder,
 * fetched once per editor session and shared by the menu pickers and the
 * canvas preview. Menus P2: refetched when the editor tab gets focus again
 * (an owner who edited a menu in the Navigation tab sees it here at once),
 * and after a menu is created from a picker.
 */
import { useEffect, useMemo, useState } from "react";
import type { Block, FooterBlockProps, NavItem } from "@/types/cms";
import { pickNavItems } from "@/modules/navigation/nav-blocks";
import { wantsDefaultMenu } from "@/modules/navigation/default-menu";

export type SavedMenu = { id: string; name?: string; location?: string; items?: NavItem[] };

let menusPromise: Promise<SavedMenu[]> | null = null;
let defaultPromise: Promise<NavItem[]> | null = null;
const listeners = new Set<() => void>();

export function fetchSavedMenus(): Promise<SavedMenu[]> {
  menusPromise ??= fetch("/api/navigation")
    .then((r) => (r.ok ? r.json() : { menus: [] }))
    .then((j) => (Array.isArray(j?.menus) ? j.menus : []))
    .catch(() => []);
  return menusPromise;
}

/** The site's automatic menu (its published pages, menus P3), as the live site shows it on an empty header. */
export function fetchDefaultMenu(): Promise<NavItem[]> {
  defaultPromise ??= fetch("/api/navigation/default")
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((j) => (Array.isArray(j?.items) ? j.items : []))
    .catch(() => []);
  return defaultPromise;
}

/** Drops the cached list and tells every picker and preview to reload it. */
export function refreshSavedMenus() {
  menusPromise = null;
  defaultPromise = null;
  for (const l of listeners) l();
}

let focusHooked = false;
function hookFocus() {
  if (focusHooked || typeof window === "undefined") return;
  focusHooked = true;
  // Only refetch when something on screen uses menus.
  window.addEventListener("focus", () => { if (listeners.size) refreshSavedMenus(); });
}

/** Saved menus, or null while loading. `enabled` false skips the request. */
export function useSavedMenus(enabled = true): SavedMenu[] | null {
  const [menus, setMenus] = useState<SavedMenu[] | null>(null);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    hookFocus();
    const bump = () => setRev((r) => r + 1);
    listeners.add(bump);
    return () => { listeners.delete(bump); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetchSavedMenus().then((m) => live && setMenus(m));
    return () => { live = false; };
  }, [enabled, rev]);
  return menus;
}

/** The automatic menu, or null while loading. `enabled` false skips the request. */
export function useDefaultMenu(enabled = true): NavItem[] | null {
  const [items, setItems] = useState<NavItem[] | null>(null);
  const [rev, setRev] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    hookFocus();
    const bump = () => setRev((r) => r + 1);
    listeners.add(bump);
    return () => { listeners.delete(bump); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetchDefaultMenu().then((m) => live && setItems(m));
    return () => { live = false; };
  }, [enabled, rev]);
  return items;
}

export type MenuSource =
  /** A saved menu (by id or location): edits save to it, live, with history. */
  | { kind: "menu"; menu: SavedMenu; items: NavItem[] }
  /** The site's automatic menu: the first edit saves it as a real menu. */
  | { kind: "auto"; items: NavItem[] }
  /** The block's own typed links: the first edit saves them as a real menu. */
  | { kind: "inline"; items: NavItem[] };

/** What a menu block shows on the canvas and where an edit to it is saved (menus P3). Null while loading. */
export function pickMenuSource(data: { items?: NavItem[]; menuLocation?: string; menuId?: string }, menus: SavedMenu[], defaults: NavItem[] | null): MenuSource | null {
  const byId = data.menuId ? menus.find((m) => m.id === data.menuId) : undefined;
  if (byId) return { kind: "menu", menu: byId, items: byId.items ?? [] };
  const byLoc = data.menuLocation ? menus.find((m) => m.location === data.menuLocation) : undefined;
  if (byLoc) return { kind: "menu", menu: byLoc, items: byLoc.items ?? [] };
  if (Array.isArray(data.items) && data.items.length) return { kind: "inline", items: data.items };
  if (!defaults) return null;
  return { kind: "auto", items: defaults };
}

/**
 * Canvas preview: a menu block that names a saved menu (by id since P2, or
 * by location) shows that menu's links, as the live site does, and a
 * classic footer column that shows a saved menu lists its links. Auto lists
 * are not expanded here; the live site fills them. Other blocks come back
 * unchanged.
 */
export function useSavedMenuPreview(block: Block): Block {
  const isNav = block.type === "navigation" || block.type === "header_nav";
  const d = (isNav ? block.data : {}) as { menuLocation?: string; menuId?: string };
  const footerIds = block.type === "footer" ? ((block as FooterBlockProps).data.columns ?? []).some((c) => !!c?.menuId) : false;
  // No typed links: the block may show the automatic menu (menus P3).
  const noOwn = isNav && !((block.data as { items?: NavItem[] }).items?.length);
  const wants = !!d.menuLocation || !!d.menuId || footerIds || noOwn;
  const menus = useSavedMenus(wants);
  const defaults = useDefaultMenu(noOwn);
  return useMemo(() => {
    if (!wants || !menus) return block;
    const byLocation = new Map<string, NavItem[]>();
    const byId = new Map<string, NavItem[]>();
    for (const m of menus) {
      if (m.location) byLocation.set(m.location, m.items ?? []);
      byId.set(m.id, m.items ?? []);
    }
    if (block.type === "footer") {
      const f = block as FooterBlockProps;
      const columns = (f.data.columns ?? []).map((c) => (c?.menuId && byId.has(c.menuId) ? { ...c, menuItems: byId.get(c.menuId) } : c));
      return { ...f, data: { ...f.data, columns } } as Block;
    }
    // Same rule as the live site: no saved menu and no typed links = the automatic menu.
    if (noOwn && wantsDefaultMenu(block.data as { items?: NavItem[]; menuLocation?: string; menuId?: string }, byLocation, byId)) {
      if (!defaults) return block;
      return { ...block, data: { ...block.data, items: defaults } } as Block;
    }
    const items = pickNavItems(block.data as { items?: NavItem[]; menuLocation?: string; menuId?: string }, byLocation, byId);
    if (items === (block.data as { items?: NavItem[] }).items) return block;
    return { ...block, data: { ...block.data, items: items ?? [] } } as Block;
  }, [block, wants, menus, noOwn, defaults]);
}
