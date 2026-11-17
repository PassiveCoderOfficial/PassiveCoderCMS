/**
 * Expands a menu item's dynamic children at render time.
 *
 * A menu item can either hold hand-picked children ("manual") or point at a
 * live collection — services, product categories, pages. Dynamic items are
 * resolved when the nav renders, so adding a service or a category shows up in
 * the menu without anyone remembering to edit it.
 *
 * Manual children are returned untouched, so existing menus keep working
 * exactly as before.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem, NavChildSource } from "@/types/cms";
import { autoRowsToItems, type AutoRow } from "./menu-model";

const DEFAULT_LIMIT = 12;

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fetchChildren(
  supabase: SupabaseClient,
  tenantId: string,
  source: NavChildSource,
  limit: number,
): Promise<NavItem[]> {
  switch (source) {
    case "service_groups": {
      const { data } = await supabase
        .from("service_groups")
        .select("id, name, slug")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true })
        .limit(limit);
      return (data ?? []).map((g) => ({
        id: makeId("nav"),
        label: g.name as string,
        // Service groups render as sections on the services page rather than
        // having routes of their own.
        url: `/services#${g.slug as string}`,
      }));
    }

    case "services": {
      // service_items have no slug and no route of their own — they're
      // rendered inside pages. Each row carries an optional `link` the author
      // set; items without one deep-link into the services page by id.
      const { data } = await supabase
        .from("service_items")
        .select("id, title, link")
        .eq("tenant_id", tenantId)
        .order("sort_order", { ascending: true })
        .limit(limit);
      return (data ?? []).map((s) => ({
        id: makeId("nav"),
        label: s.title as string,
        url: (s.link as string | null) || `/services#${s.id as string}`,
      }));
    }

    case "product_categories": {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("tenant_id", tenantId)
        .limit(limit);
      return (data ?? []).map((c) => ({
        id: makeId("nav"),
        label: c.name as string,
        url: `/shop?category=${c.slug as string}`,
      }));
    }

    case "pages": {
      const { data } = await supabase
        .from("pages")
        .select("id, title, slug")
        .eq("tenant_id", tenantId)
        .eq("status", "published")
        .is("deleted_at", null)
        .order("order_index", { ascending: true })
        .limit(limit);
      return (data ?? [])
        // The parent item is itself a page link; listing "home" underneath it
        // reads as a mistake.
        .filter((p) => (p.slug as string).toLowerCase() !== "home")
        .map((p) => ({
          id: makeId("nav"),
          label: p.title as string,
          url: `/${p.slug as string}`,
        }));
    }

    case "blog_categories": {
      const { data } = await supabase
        .from("pages")
        .select("id, title, slug")
        .eq("tenant_id", tenantId)
        .eq("type", "post")
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(limit);
      return (data ?? []).map((p) => ({
        id: makeId("nav"),
        label: p.title as string,
        url: `/${p.slug as string}`,
      }));
    }

    default:
      return [];
  }
}

/**
 * Menu Studio auto lists: the new "products" / "posts" sources, and any
 * source with hand-picked ids (childIds). Only items carrying those new
 * fields reach this, so the legacy sources above keep their exact output.
 */
async function fetchStudioChildren(
  supabase: SupabaseClient,
  tenantId: string,
  source: NavChildSource,
  limit: number,
  childIds: string[] | undefined,
): Promise<NavItem[]> {
  const picked = childIds?.length ? childIds.slice(0, 50) : undefined;
  let rows: AutoRow[] = [];
  switch (source) {
    case "products": {
      let q = supabase.from("products").select("id, name, slug").eq("tenant_id", tenantId).eq("status", "active");
      q = picked ? q.in("id", picked) : q.order("created_at", { ascending: false }).limit(limit);
      const { data } = await q;
      rows = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string, slug: r.slug as string }));
      break;
    }
    case "posts":
    case "blog_categories": {
      let q = supabase.from("pages").select("id, title, slug").eq("tenant_id", tenantId)
        .eq("type", "post").eq("status", "published").is("deleted_at", null);
      q = picked ? q.in("id", picked) : q.order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
      const { data } = await q;
      rows = (data ?? []).map((r) => ({ id: r.id as string, label: r.title as string, slug: r.slug as string }));
      // The legacy blog source linked /<slug>; studio lists use the real /blog/<slug>.
      return autoRowsToItems("posts", rows, { childIds: picked, limit });
    }
    case "services": {
      let q = supabase.from("service_items").select("id, title, link").eq("tenant_id", tenantId);
      q = picked ? q.in("id", picked) : q.order("sort_order", { ascending: true }).limit(limit);
      const { data } = await q;
      rows = (data ?? []).map((r) => ({ id: r.id as string, label: r.title as string, link: r.link as string | null }));
      break;
    }
    case "service_groups": {
      let q = supabase.from("service_groups").select("id, name, slug").eq("tenant_id", tenantId);
      q = picked ? q.in("id", picked) : q.order("sort_order", { ascending: true }).limit(limit);
      const { data } = await q;
      rows = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string, slug: r.slug as string }));
      break;
    }
    case "product_categories": {
      let q = supabase.from("categories").select("id, name, slug").eq("tenant_id", tenantId);
      q = picked ? q.in("id", picked) : q.limit(limit);
      const { data } = await q;
      rows = (data ?? []).map((r) => ({ id: r.id as string, label: r.name as string, slug: r.slug as string }));
      break;
    }
    case "pages": {
      let q = supabase.from("pages").select("id, title, slug").eq("tenant_id", tenantId)
        .eq("status", "published").is("deleted_at", null);
      q = picked ? q.in("id", picked) : q.order("order_index", { ascending: true }).limit(limit);
      const { data } = await q;
      rows = (data ?? []).filter((r) => (r.slug as string).toLowerCase() !== "home")
        .map((r) => ({ id: r.id as string, label: r.title as string, slug: r.slug as string }));
      break;
    }
    default:
      return [];
  }
  return autoRowsToItems(source, rows, { childIds: picked, limit });
}

/**
 * Resolves dynamic children across a whole menu tree.
 *
 * Failures are swallowed per item: a menu must still render if one collection
 * query fails, rather than taking the site's navigation down with it.
 */
export async function expandDynamicChildren(
  supabase: SupabaseClient,
  tenantId: string,
  items: NavItem[],
): Promise<NavItem[]> {
  return Promise.all(
    items.map(async (item) => {
      const source = item.childSource ?? "manual";

      if (source === "manual") {
        return item.children?.length
          ? { ...item, children: await expandDynamicChildren(supabase, tenantId, item.children) }
          : item;
      }

      try {
        const studio = source === "products" || source === "posts" || (item.childIds?.length ?? 0) > 0;
        const children = studio
          ? await fetchStudioChildren(supabase, tenantId, source, item.childLimit ?? DEFAULT_LIMIT, item.childIds)
          : await fetchChildren(supabase, tenantId, source, item.childLimit ?? DEFAULT_LIMIT);
        // Falling back to whatever was manually set means an empty collection
        // shows the author's own children rather than an empty dropdown.
        return { ...item, children: children.length ? children : (item.children ?? []) };
      } catch {
        return { ...item, children: item.children ?? [] };
      }
    }),
  );
}

/** Human labels for the picker in the nav manager. */
export const CHILD_SOURCE_LABELS: Record<NavChildSource, string> = {
  manual: "Hand-picked items",
  services: "All services",
  service_groups: "Service categories",
  product_categories: "Product categories",
  pages: "All published pages",
  blog_categories: "Blog posts",
  products: "Products",
  posts: "Blog posts (newest first)",
};
