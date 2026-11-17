/**
 * Menu links stored by id (menus P1, Nov 2026).
 *
 * A menu item can point at a page, blog post, product, service, service
 * category or product category by its id (`kind` + `ref` on NavItem). The
 * address is looked up here, at render time, so renaming a page or changing
 * a slug never breaks a menu. `url` on the item stays as the last known
 * address: it is what renders when the record is gone or unpublished, and
 * what older code reads.
 *
 * One query per kind, only for kinds the menu uses. A menu without id links
 * (every menu saved before P1) costs no query and comes back as the same array.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem, NavLinkKind } from "@/types/cms";
import { applyRefUrls, collectRefs, refKey } from "./menu-model";

export type RefRow = { id: string; slug?: string | null; type?: string | null; link?: string | null };

/** Live address of a record. Mirrors the site's routes (posts at /blog/<slug>, home at /). */
export function refUrlFor(kind: NavLinkKind, row: RefRow): string | null {
  switch (kind) {
    case "page":
    case "post": {
      if (!row.slug) return null;
      if (row.type === "post") return `/blog/${row.slug}`;
      return row.slug.toLowerCase() === "home" ? "/" : `/${row.slug}`;
    }
    case "product": return `/products/${row.slug || row.id}`;
    case "service": return row.link || `/services#${row.id}`;
    case "service_group": return row.slug ? `/services#${row.slug}` : null;
    case "category": return row.slug ? `/shop?category=${row.slug}` : null;
    default: return null;
  }
}

/** Live addresses for the given ids, as "kind:id" -> url. Records that are gone or not public are left out. */
export async function loadRefUrls(supabase: SupabaseClient, tenantId: string, refs: Map<NavLinkKind, Set<string>>): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const pageIds = new Set<string>([...(refs.get("page") ?? []), ...(refs.get("post") ?? [])]);
  const jobs: Promise<void>[] = [];
  const add = (kinds: NavLinkKind[], rows: RefRow[] | null) => {
    for (const r of rows ?? []) for (const k of kinds) {
      if (!refs.get(k)?.has(r.id)) continue;
      const url = refUrlFor(k, r);
      if (url) out.set(refKey(k, r.id), url);
    }
  };
  const ids = (s: Set<string>) => [...s].slice(0, 200);
  if (pageIds.size) jobs.push((async () => {
    const { data } = await supabase.from("pages").select("id, slug, type")
      .eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null).in("id", ids(pageIds));
    add(["page", "post"], data as RefRow[] | null);
  })());
  if (refs.get("product")?.size) jobs.push((async () => {
    const { data } = await supabase.from("products").select("id, slug")
      .eq("tenant_id", tenantId).eq("status", "active").in("id", ids(refs.get("product")!));
    add(["product"], data as RefRow[] | null);
  })());
  if (refs.get("service")?.size) jobs.push((async () => {
    const { data } = await supabase.from("service_items").select("id, link")
      .eq("tenant_id", tenantId).in("id", ids(refs.get("service")!));
    add(["service"], data as RefRow[] | null);
  })());
  if (refs.get("service_group")?.size) jobs.push((async () => {
    const { data } = await supabase.from("service_groups").select("id, slug")
      .eq("tenant_id", tenantId).in("id", ids(refs.get("service_group")!));
    add(["service_group"], data as RefRow[] | null);
  })());
  if (refs.get("category")?.size) jobs.push((async () => {
    const { data } = await supabase.from("categories").select("id, slug")
      .eq("tenant_id", tenantId).in("id", ids(refs.get("category")!));
    add(["category"], data as RefRow[] | null);
  })());
  // A failed lookup only means "keep the stored url" for those items.
  await Promise.all(jobs.map((j) => j.catch(() => undefined)));
  return out;
}

/** The menu with every id link pointing at its live address. Same array back when it has none. */
export async function resolveMenuRefs(supabase: SupabaseClient, tenantId: string, items: NavItem[]): Promise<NavItem[]> {
  const refs = collectRefs(items);
  if (!refs.size) return items;
  return applyRefUrls(items, await loadRefUrls(supabase, tenantId, refs));
}
