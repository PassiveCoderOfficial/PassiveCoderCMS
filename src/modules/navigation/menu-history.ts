/**
 * Menu history rules (menus P1, Nov 2026), pure.
 *
 * Decision 2026-11-17: menu edits go live on save, with undo history. Every save
 * keeps a version (nav_menu_versions, migration 252); the Navigation screen
 * shows them per menu with "Restore" and a one-step "Undo last save". The
 * newest MENU_HISTORY_CAP versions per menu are kept.
 *
 * A version is the menu's content AFTER a save (name + items). The state
 * before the first recorded save is kept too (source "before"), so the very
 * first save of an existing menu can be undone; the same happens when the
 * menu was changed outside the app since the last version.
 */
import type { NavItem } from "@/types/cms";
import { normalizeMenu } from "./menu-model";

export const MENU_HISTORY_CAP = 50;

export type MenuVersionSource = "dashboard" | "mcp" | "restore" | "undo" | "import" | "before" | "app";

export interface MenuVersion {
  id: string;
  menu_id: string;
  tenant_id?: string;
  name: string;
  items: NavItem[] | unknown;
  saved_by: string | null;
  source: MenuVersionSource | string;
  created_at: string;
}

export interface MenuSnapshot { name: string; items: unknown }

/** Same visible content (name and items, after the same clean-up the renderer does)? */
export function sameSnapshot(a: MenuSnapshot, b: MenuSnapshot): boolean {
  return (a.name ?? "") === (b.name ?? "") && JSON.stringify(normalizeMenu(a.items)) === JSON.stringify(normalizeMenu(b.items));
}

/** Newest first; ties keep their order. */
export function newestFirst<T extends { created_at: string }>(versions: T[]): T[] {
  return versions.map((v, i) => [v, i] as const)
    .sort(([a, ai], [b, bi]) => (Date.parse(b.created_at) - Date.parse(a.created_at)) || (bi - ai))
    .map(([v]) => v);
}

/** Ids past the cap (oldest ones), to delete after a save. */
export function versionsToTrim<T extends { id: string; created_at: string }>(versions: T[], cap = MENU_HISTORY_CAP): string[] {
  return newestFirst(versions).slice(cap).map((v) => v.id);
}

/**
 * Should a "before" version be written ahead of this save? Yes when the menu
 * has no history yet, or when it no longer matches its newest version (it
 * was changed by something that keeps no history, e.g. a template apply).
 */
export function needsBeforeVersion(versions: MenuVersion[], current: MenuSnapshot): boolean {
  const latest = newestFirst(versions)[0];
  return !latest || !sameSnapshot(latest, current);
}

/**
 * When the "before" version happened: when the menu last changed
 * (updated_at), kept strictly between the newest version and this save so
 * the list stays in order.
 */
export function beforeVersionTime(versions: { created_at: string }[], updatedAt: string | null | undefined, now: number = Date.now()): string {
  const newest = newestFirst(versions)[0];
  const floor = newest ? Date.parse(newest.created_at) + 1 : -Infinity;
  let at = updatedAt ? Date.parse(updatedAt) : NaN;
  if (!Number.isFinite(at) || at >= now) at = now - 1;
  if (at < floor) at = floor;
  return new Date(at).toISOString();
}

/** Time for the version a save writes: now, but never before (or equal to) a version already there. */
export function nextVersionTime(versions: { created_at: string }[], now: number = Date.now()): string {
  const newest = newestFirst(versions)[0];
  return new Date(Math.max(now, newest ? Date.parse(newest.created_at) + 1 : now)).toISOString();
}

/**
 * "Undo last save": the newest version whose content differs from the menu
 * as it is now. Null when there is nothing to go back to.
 */
export function undoTarget(versions: MenuVersion[], current: MenuSnapshot): MenuVersion | null {
  return newestFirst(versions).find((v) => !sameSnapshot(v, current)) ?? null;
}

/** Short change summary between two versions, for the history list ("+2 items, renamed"). */
export function countItems(items: unknown): number {
  const walk = (list: NavItem[]): number => list.reduce((n, i) => n + 1 + walk(i.children ?? []), 0);
  return walk(normalizeMenu(items));
}
