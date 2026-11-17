/**
 * Site search, shared by the live suggestions (/api/search/suggest) and the
 * full results page (/search). One engine, so the dropdown and the page never
 * disagree about what matches.
 *
 * Content types follow the site's modules: products and categories only when
 * the Ecommerce module is on. Default order: stores show products,
 * categories, posts, pages; other sites show pages, then posts. A Search
 * block can choose its own types and order (data.types).
 */
export type SearchType = "product" | "category" | "post" | "page";
export const SEARCH_TYPES: SearchType[] = ["product", "category", "post", "page"];
export const SEARCH_TYPE_LABEL: Record<SearchType, string> = { product: "Product", category: "Category", post: "Post", page: "Page" };
/** Which module a type needs (none = always available). */
export const SEARCH_TYPE_MODULE: Partial<Record<SearchType, string>> = { product: "ecommerce", category: "ecommerce" };

export function defaultSearchTypes(ecommerce: boolean): SearchType[] {
  return ecommerce ? ["product", "category", "post", "page"] : ["page", "post"];
}

/** Keep only known types the site can use, in the given order; fall back to the default. */
export function effectiveSearchTypes(wanted: string[] | undefined | null, ecommerce: boolean): SearchType[] {
  const ok = (t: string): t is SearchType => (SEARCH_TYPES as string[]).includes(t) && (ecommerce || !SEARCH_TYPE_MODULE[t as SearchType]);
  const list = (wanted ?? []).filter(ok);
  return list.length ? Array.from(new Set(list)) : defaultSearchTypes(ecommerce);
}

export interface SearchHit {
  type: SearchType;
  id: string;
  title: string;
  url: string;
  image?: string | null;
  /** Price for products, short description for posts/pages. */
  meta?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

/** Characters that would break a PostgREST or() filter. */
export const safeTerm = (q: string) => q.replace(/[,()%*\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

/**
 * How well a name matches what was typed (lower is better): the name starts
 * with it, then a word in the name starts with it, then it is anywhere in the
 * name, then it only matched another field (SKU, brand).
 */
export function matchRank(name: string, term: string): number {
  const n = name.toLowerCase(), t = term.toLowerCase();
  if (n.startsWith(t)) return 0;
  const i = n.indexOf(t);
  if (i > 0 && !/[\p{L}\p{N}]/u.test(n[i - 1])) return 1;
  if (n.split(/[^\p{L}\p{N}]+/u).some((w) => w.startsWith(t))) return 1;
  return i >= 0 ? 2 : 3;
}

/** Best matches first; ties keep the database order (featured first). */
const byRank = <T>(rows: T[], name: (r: T) => string, term: string, limit: number) =>
  rows.map((r, i) => ({ r, i, k: matchRank(name(r) ?? "", term) }))
    .sort((a, b) => a.k - b.k || a.i - b.i).slice(0, limit).map((x) => x.r);

/** Rows fetched per type before ranking, so a name that starts with the term is never cut off. */
const POOL = 60;

/**
 * Up to `perType` hits for each requested type, grouped in the requested
 * order. Suggestions pass a small perType and take the first N overall.
 */
export async function searchSite(admin: Admin, tenantId: string, rawTerm: string, types: SearchType[], perType = 5, opts: { marketplace?: boolean } = {}): Promise<SearchHit[]> {
  const term = safeTerm(rawTerm);
  if (!term) return [];
  const want = new Set(types);
  const like = `%${term}%`;

  // A marketplace sells only approved listings from approved sellers; a
  // single store sells its own (vendor-less) products.
  const productQuery = () => {
    const base = opts.marketplace
      ? admin.from("products").select("id, name, slug, price, images, vendors!inner(status)").eq("vendors.status", "approved").eq("approval_status", "approved")
      : admin.from("products").select("id, name, slug, price, images").is("vendor_id", null);
    return base.eq("tenant_id", tenantId).eq("status", "active")
      .or(`name.ilike.${like},sku.ilike.${like},brand.ilike.${like}`).order("featured", { ascending: false }).limit(Math.max(POOL, perType));
  };

  const [products, categories, pages] = await Promise.all([
    want.has("product") ? productQuery() : { data: [] },
    want.has("category")
      ? admin.from("categories").select("id, name, slug, image_url").eq("tenant_id", tenantId).eq("type", "product").ilike("name", like).limit(Math.max(POOL, perType))
      : { data: [] },
    want.has("post") || want.has("page")
      ? admin.from("pages").select("id, slug, title, type, seo").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
          .in("type", [...(want.has("page") ? ["page", "landing"] : []), ...(want.has("post") ? ["post"] : [])])
          .ilike("title", like).limit(Math.max(POOL, perType * 2))
      : { data: [] },
  ]);

  const byType: Record<SearchType, SearchHit[]> = { product: [], category: [], post: [], page: [] };
  type ProductRow = { id: string; name: string; slug: string; price: number | null; images: string[] | null };
  for (const p of byRank((products.data ?? []) as ProductRow[], (x) => x.name, term, perType)) {
    byType.product.push({ type: "product", id: p.id, title: p.name, url: `/products/${p.slug}`, image: p.images?.[0] ?? null, meta: p.price != null ? String(p.price) : null });
  }
  type CategoryRow = { id: string; name: string; slug: string; image_url?: string | null };
  for (const c of byRank((categories.data ?? []) as CategoryRow[], (x) => x.name, term, perType)) {
    byType.category.push({ type: "category", id: c.id, title: c.name, url: opts.marketplace ? `/${c.slug}` : `/shop?category=${c.slug}`, image: c.image_url ?? null });
  }
  type PageRow = { id: string; slug: string; title: string; type: string; seo: { description?: string } | null };
  for (const p of byRank((pages.data ?? []) as PageRow[], (x) => x.title, term, POOL)) {
    if (p.slug.startsWith("product-template")) continue;
    const t: SearchType = p.type === "post" ? "post" : "page";
    if (byType[t].length >= perType) continue;
    byType[t].push({ type: t, id: p.id, title: p.title, url: p.slug === "home" ? "/" : `/${p.slug}`, meta: p.seo?.description ?? null });
  }
  return types.flatMap((t) => byType[t]);
}
