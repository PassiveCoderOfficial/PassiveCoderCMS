"use client";

/**
 * The site's saved menus (Dashboard > Navigation) for the page builder,
 * fetched once per editor session and shared by the "Menu shown" picker and
 * the canvas preview.
 */
import { useEffect, useMemo, useState } from "react";
import type { Block, NavItem } from "@/types/cms";
import { pickNavItems } from "@/modules/navigation/nav-blocks";

export type SavedMenu = { id: string; name?: string; location?: string; items?: NavItem[] };

let menusPromise: Promise<SavedMenu[]> | null = null;

export function fetchSavedMenus(): Promise<SavedMenu[]> {
  menusPromise ??= fetch("/api/navigation")
    .then((r) => (r.ok ? r.json() : { menus: [] }))
    .then((j) => (Array.isArray(j?.menus) ? j.menus : []))
    .catch(() => []);
  return menusPromise;
}

/** Saved menus, or null while loading. `enabled` false skips the request. */
export function useSavedMenus(enabled = true): SavedMenu[] | null {
  const [menus, setMenus] = useState<SavedMenu[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetchSavedMenus().then((m) => live && setMenus(m));
    return () => { live = false; };
  }, [enabled]);
  return menus;
}

/**
 * Canvas preview: a menu block that names a saved menu shows that menu's
 * links, as the live site does (before P0 the canvas always showed the
 * block's own links). Auto lists are not expanded here; the live site fills
 * them. Blocks without a menu location come back unchanged.
 */
export function useSavedMenuPreview(block: Block): Block {
  const loc = (block.type === "navigation" || block.type === "header_nav")
    ? (block.data as { menuLocation?: string }).menuLocation
    : undefined;
  const menus = useSavedMenus(!!loc);
  return useMemo(() => {
    if (!loc || !menus) return block;
    const byLocation = new Map<string, NavItem[]>();
    for (const m of menus) if (m.location) byLocation.set(m.location, m.items ?? []);
    const items = pickNavItems(block.data as { items?: NavItem[]; menuLocation?: string }, byLocation);
    if (items === (block.data as { items?: NavItem[] }).items) return block;
    return { ...block, data: { ...block.data, items: items ?? [] } } as Block;
  }, [block, loc, menus]);
}
