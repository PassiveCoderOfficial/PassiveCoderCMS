/**
 * Saving several menus from the Navigation screen (pure).
 *
 * Before P0 (2026-11-17) Save sent only the open menu and then replaced the
 * whole list with the server's copy, so edits made to another menu were
 * silently lost. Now every menu with edits is saved, and after the refetch
 * only menus that failed to save keep their local copy.
 */
export type SavableMenu = { id: string; location: string };

/** The open menu first, then the others in list order. */
export function saveOrder<T extends SavableMenu>(dirtyIds: Iterable<string>, menus: T[], activeId: string | null): string[] {
  const pos = (id: string) => (id === activeId ? -1 : menus.findIndex((m) => m.id === id));
  return [...dirtyIds].filter((id) => menus.some((m) => m.id === id)).sort((a, b) => pos(a) - pos(b));
}

/**
 * The server list wins for menus that were saved (a location move can
 * unassign another menu server-side); menus still holding unsaved edits
 * (their save failed) keep the local copy.
 */
export function mergeAfterSave<T extends SavableMenu>(local: T[], server: T[], stillDirty: Set<string>): T[] {
  return server.map((srv) => (stillDirty.has(srv.id) ? local.find((m) => m.id === srv.id) ?? srv : srv));
}
