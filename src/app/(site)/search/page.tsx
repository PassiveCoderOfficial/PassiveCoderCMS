import Link from "next/link";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/blocks/ecommerce/product-card";
import { PRODUCT_CARD_SELECT, toProductCardData } from "@/lib/ecommerce/product-card-data";

export const metadata = { title: "Search" };
export const dynamic = "force-dynamic";

type SP = { q?: string; in?: string; category?: string };
const SCOPES = ["products", "categories", "pages", "posts"] as const;

/**
 * Site-wide search. The header search box chooses what to look in (`in`,
 * comma list); with no `in` it searches everything this site has. Works on
 * sites without a shop: product and category sections only show when the
 * store has products.
 */
export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tenantId = (await headers()).get("x-tenant-id");
  const term = (sp.q ?? "").trim().slice(0, 80);
  const scope = new Set((sp.in ? sp.in.split(",") : SCOPES).filter((s): s is (typeof SCOPES)[number] => (SCOPES as readonly string[]).includes(s)));
  const admin = await createAdminClient();
  const safe = term.replace(/[,()%]/g, " ").trim();

  let products: ReturnType<typeof toProductCardData>[] = [];
  let categories: { id: string; name: string; slug: string }[] = [];
  let pages: { slug: string; title: string; type: string; seo: { description?: string } | null }[] = [];
  let cardStyle = "default";

  if (tenantId && safe) {
    const { data: allCats } = await admin.from("categories").select("id, name, slug").eq("tenant_id", tenantId).eq("type", "product");
    const escaped = safe.replace(/[.*+?^${}|[\]\\]/g, "\\$&");
    const word = new RegExp(`\\b${escaped}\\b`, "i");
    const catHits = (allCats ?? []).filter((c) => word.test(c.name) || c.name.toLowerCase().includes(safe.toLowerCase()));
    if (scope.has("categories")) categories = catHits;
    if (scope.has("products")) {
      const filterCat = sp.category ? (allCats ?? []).find((c) => c.slug === sp.category) : undefined;
      let q = admin.from("products").select(PRODUCT_CARD_SELECT).eq("tenant_id", tenantId).eq("status", "active").is("vendor_id", null);
      const ors = [`name.ilike.%${safe}%`, `sku.ilike.%${safe}%`, `brand.ilike.%${safe}%`, ...(allCats ?? []).filter((c) => word.test(c.name)).map((c) => `category_ids.cs.["${c.id}"]`)];
      q = q.or(ors.join(","));
      if (filterCat) q = q.contains("category_ids", JSON.stringify([filterCat.id]));
      const { data } = await q.order("featured", { ascending: false }).limit(40);
      products = (data ?? []).map(toProductCardData);
      const { data: ident } = await admin.from("site_identity").select("design_overrides").eq("tenant_id", tenantId).maybeSingle();
      cardStyle = ((ident?.design_overrides ?? {}) as { productCardStyle?: string }).productCardStyle ?? "default";
    }
    const types = [...(scope.has("pages") ? ["page", "landing"] : []), ...(scope.has("posts") ? ["post"] : [])];
    if (types.length) {
      const { data } = await admin.from("pages").select("slug, title, type, seo").eq("tenant_id", tenantId).eq("status", "published")
        .is("deleted_at", null).in("type", types).ilike("title", `%${safe}%`).limit(30);
      pages = ((data ?? []) as typeof pages).filter((p) => !p.slug.startsWith("product-template"));
    }
  }

  const total = products.length + categories.length + pages.length;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <form action="/search" className="flex gap-2 max-w-xl mb-8">
        {sp.in && <input type="hidden" name="in" value={sp.in} />}
        <input name="q" defaultValue={term} placeholder="Search" aria-label="Search" className="flex-1 border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        <button className="rounded-full px-6 text-sm font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>Search</button>
      </form>
      <h1 className="text-2xl sm:text-3xl mb-2">{term ? <>Results for &ldquo;{term}&rdquo;</> : "Search"}</h1>
      {term && <p className="text-sm text-muted-foreground mb-8">{total === 0 ? "Nothing found. Try another word." : `${total} result${total === 1 ? "" : "s"}`}</p>}

      {categories.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => <Link key={c.id} href={`/shop?category=${c.slug}`} className="border rounded-full px-4 py-1.5 text-sm hover:border-primary hover:text-primary">{c.name}</Link>)}
          </div>
        </section>
      )}
      {products.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Products</h2>
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} showDescription={false} cardStyle={cardStyle as "default"} />)}
          </div>
        </section>
      )}
      {pages.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Pages and articles</h2>
          <ul className="divide-y border rounded-lg">
            {pages.map((p) => (
              <li key={p.slug}>
                <Link href={p.slug === "home" ? "/" : `/${p.slug}`} className="block px-4 py-3 hover:bg-muted">
                  <span className="font-medium">{p.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{p.type === "post" ? "Article" : "Page"}</span>
                  {p.seo?.description && <span className="block text-sm text-muted-foreground mt-0.5 line-clamp-1">{p.seo.description}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
