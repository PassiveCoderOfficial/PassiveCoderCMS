import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parent and child pages. A child's address is /parent-path/own-slug. All
 * slug, descendant and redirect work happens in the database function
 * set_page_parent (migration 215), so every caller (create dialog, page
 * settings, pages list bulk action, MCP create_page) gets the same rules.
 */

export type ParentOption = { id: string; title: string; slug: string; parent_id: string | null };
export type SlugChange = { id: string; old_slug: string; new_slug: string };

/** Page types that can be parents or children (blog posts can't). */
export const HIERARCHY_TYPES = ["page", "landing", "portfolio"] as const;

export async function setPageParent(
  supabase: SupabaseClient,
  pageIds: string[],
  parentId: string | null,
  ownSlug?: string | null,
): Promise<{ changed: SlugChange[]; error: string | null }> {
  const { data, error } = await supabase.rpc("set_page_parent", {
    p_page_ids: pageIds,
    p_parent_id: parentId,
    p_own_slug: ownSlug ?? null,
  });
  return { changed: (data as SlugChange[] | null) ?? [], error: error?.message ?? null };
}

/** Ids of a page and everything below it (these can't become its parent). */
export function selfAndDescendants(ids: Iterable<string>, all: { id: string; parent_id: string | null }[]): Set<string> {
  const out = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of all) {
      if (p.parent_id && out.has(p.parent_id) && !out.has(p.id)) { out.add(p.id); grew = true; }
    }
  }
  return out;
}

/**
 * Orders rows so children follow their parent, keeping the incoming order
 * among siblings. Rows whose parent isn't in the list stay at the top level.
 */
export function orderAsTree<T extends { id: string; parent_id?: string | null }>(rows: T[]): (T & { depth: number })[] {
  const ids = new Set(rows.map((r) => r.id));
  const kids = new Map<string, T[]>();
  const roots: T[] = [];
  for (const r of rows) {
    if (r.parent_id && ids.has(r.parent_id) && r.parent_id !== r.id) {
      const list = kids.get(r.parent_id) ?? [];
      list.push(r);
      kids.set(r.parent_id, list);
    } else roots.push(r);
  }
  const out: (T & { depth: number })[] = [];
  const seen = new Set<string>();
  const walk = (r: T, depth: number) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    out.push({ ...r, depth });
    for (const c of kids.get(r.id) ?? []) walk(c, depth + 1);
  };
  for (const r of roots) walk(r, 0);
  // Anything left (a broken cycle in old data) goes at the end, flat.
  for (const r of rows) if (!seen.has(r.id)) walk(r, 0);
  return out;
}
