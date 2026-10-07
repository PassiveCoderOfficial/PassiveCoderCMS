import Link from "next/link";
import { ChevronLeft, ChevronRight, PackageSearch, Search, X } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/blocks/ecommerce/product-card";
import { PRODUCT_CARD_SELECT, toProductCardData } from "@/lib/ecommerce/product-card-data";
import { ShopSortSelect } from "./shop-sort-select";

export type SingleStoreShopParams = { q?: string; category?: string; sort?: string; page?: string };

const PAGE_SIZE = 24;

const SORTS = [
  { key: "", label: "Featured" },
  { key: "new", label: "Latest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

/**
 * Catalogue page for an ordinary single-store tenant. The marketplace
 * catalogue in (site)/shop/page.tsx inner-joins `vendors`, so a store whose
 * products have no vendor_id got "No products found" on /shop no matter how
 * many products it had. Uses the tenant's own theme tokens and currency
 * (ProductCard formats prices) instead of the marketplace's fixed brand.
 */
export async function SingleStoreShop({ tenantId, sp }: { tenantId: string; sp: SingleStoreShopParams }) {
  const admin = await createAdminClient();

  // Per-tenant look (site_identity.design_overrides): card style for the grid,
  // and "classic" = WooCommerce-style page (title, result count, sort menu,
  // no category sidebar) for stores migrating from WordPress.
  const { data: identity } = await admin.from("site_identity").select("design_overrides").eq("tenant_id", tenantId).maybeSingle();
  const design = (identity?.design_overrides ?? {}) as { productCardStyle?: string; shopLayout?: string };
  const cardStyle = (["default", "flat", "minimal", "shadow", "bordered", "boutique", "retail"].includes(design.productCardStyle ?? "") ? design.productCardStyle : "default") as "default";
  const classic = design.shopLayout === "classic";

  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("tenant_id", tenantId)
    .eq("type", "product")
    .order("order_index");
  const cats = categories ?? [];

  // Links carry the category slug (readable, survives re-seeding); an id is
  // accepted too so links written for the marketplace catalogue still work.
  const activeCat = sp.category ? cats.find((c) => c.slug === sp.category || c.id === sp.category) : undefined;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = admin
    .from("products")
    .select(PRODUCT_CARD_SELECT, { count: "exact" })
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .is("vendor_id", null);

  const term = sp.q?.trim();
  if (term) {
    // Commas and parentheses are PostgREST filter syntax inside .or().
    const safe = term.replace(/[,()%]/g, " ").trim();
    // A category whose name contains the search as a whole word ("men" ->
    // Men, not Women) also brings in every product filed under it.
    const escaped = safe.replace(/[.*+?^${}|[\]\\]/g, "\\$&");
    const word = new RegExp(`\\b${escaped}\\b`, "i");
    const catHits = cats.filter((c) => word.test(c.name)).map((c) => `category_ids.cs.["${c.id}"]`);
    if (safe) query = query.or([`name.ilike.%${safe}%`, `sku.ilike.%${safe}%`, `brand.ilike.%${safe}%`, ...catHits].join(","));
  }
  if (activeCat) query = query.contains("category_ids", JSON.stringify([activeCat.id]));

  query =
    sp.sort === "price_asc"
      ? query.order("price", { ascending: true })
      : sp.sort === "price_desc"
        ? query.order("price", { ascending: false })
        : sp.sort === "new"
          ? query.order("created_at", { ascending: false })
          : query.order("featured", { ascending: false }).order("created_at", { ascending: false });

  const { data: products, count } = await query.order("id").range(from, from + PAGE_SIZE - 1);

  const items = (products ?? []).map(toProductCardData);
  const total = count ?? items.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (patch: Partial<SingleStoreShopParams>) => {
    const merged: SingleStoreShopParams = { ...sp, page: undefined, ...patch };
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const heading = term ? `Results for “${term}”` : activeCat ? activeCat.name : "All products";

  if (classic) {
    const first = total === 0 ? 0 : from + 1;
    const last = Math.min(from + items.length, total);
    return (
      <div className="bg-background text-foreground min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <nav className="text-sm text-muted-foreground mb-5">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-1">/</span>
            {activeCat || term ? (
              <><Link href="/shop" className="hover:text-primary">Shop</Link><span className="mx-1">/</span><span>{heading}</span></>
            ) : <span>Shop</span>}
          </nav>
          <h1 className="text-3xl sm:text-4xl mb-3" style={{ fontFamily: "var(--heading-font, inherit)" }}>{activeCat || term ? heading : "Shop"}</h1>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-[0.95rem] text-muted-foreground">
              {total === 0 ? "No products found" : total <= PAGE_SIZE && page === 1 ? `Showing all ${total} results` : `Showing ${first}–${last} of ${total} results`}
            </p>
            <ShopSortSelect value={sp.sort ?? ""} options={SORTS} />
          </div>
          {items.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">No products were found matching your selection.</p>
          ) : (
            <div className="grid gap-5 sm:gap-7 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} showDescription={false} cardStyle={cardStyle} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <div className="flex items-center gap-2 mt-12">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link key={n} href={buildHref({ page: n > 1 ? String(n) : undefined })}
                  className={`min-w-9 h-9 px-2 inline-flex items-center justify-center border text-sm font-semibold ${n === page ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                  {n}
                </Link>
              ))}
              {page < pages && (
                <Link href={buildHref({ page: String(page + 1) })} aria-label="Next page" className="w-9 h-9 inline-flex items-center justify-center border border-border hover:bg-muted">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {activeCat || term ? (
            <>
              <Link href="/shop" className="hover:text-primary">Shop</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground">{heading}</span>
            </>
          ) : (
            <span className="text-foreground">Shop</span>
          )}
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{heading}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {total} product{total === 1 ? "" : "s"}
            </p>
          </div>
          <form action="/shop" className="flex w-full sm:w-80">
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Search products"
              className="flex-1 min-w-0 h-10 rounded-l-lg border border-r-0 border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              aria-label="Search"
              className="h-10 px-4 rounded-r-lg bg-primary text-primary-foreground inline-flex items-center justify-center hover:opacity-90"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* grid-cols-1 + min-w-0: without them the scrolling category pills
            stretch the single mobile column to their full width. */}
        <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 items-start">
          {cats.length > 0 && (
            <aside className="min-w-0 lg:sticky lg:top-28">
              <p className="hidden lg:block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                Categories
              </p>
              <ul className="flex lg:flex-col gap-2 lg:gap-0.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 [scrollbar-width:none]">
                <li className="shrink-0">
                  <Link
                    href={buildHref({ category: undefined })}
                    className={`block whitespace-nowrap lg:whitespace-normal rounded-full lg:rounded-lg border lg:border-0 px-3.5 py-2 text-sm ${
                      !activeCat
                        ? "bg-primary text-primary-foreground border-primary font-semibold"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    All products
                  </Link>
                </li>
                {cats.map((c) => (
                  <li key={c.id} className="shrink-0">
                    <Link
                      href={buildHref({ category: c.slug })}
                      className={`block whitespace-nowrap lg:whitespace-normal rounded-full lg:rounded-lg border lg:border-0 px-3.5 py-2 text-sm ${
                        activeCat?.id === c.id
                          ? "bg-primary text-primary-foreground border-primary font-semibold"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <div className={`min-w-0 ${cats.length === 0 ? "lg:col-span-2" : ""}`}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground mr-1">Sort</span>
              {SORTS.map((s) => {
                const on = (sp.sort ?? "") === s.key;
                return (
                  <Link
                    key={s.key}
                    href={buildHref({ sort: s.key || undefined })}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${
                      on ? "border-foreground bg-foreground text-background font-semibold" : "border-border hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
              {term && (
                <Link
                  href={buildHref({ q: undefined })}
                  className="ml-auto text-xs bg-muted rounded-full pl-3 pr-2 py-1.5 inline-flex items-center gap-1"
                >
                  “{term}” <X className="w-3 h-3" />
                </Link>
              )}
            </div>

            {items.length === 0 ? (
              <div className="border border-border rounded-xl p-12 text-center">
                <PackageSearch className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-semibold">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search or browse all products.</p>
                <Link
                  href="/shop"
                  className="inline-block mt-5 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  View all products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} showDescription={false} cardStyle={cardStyle} />
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8 text-sm">
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 > 1 ? String(page - 1) : undefined })}
                    className="inline-flex items-center gap-1 border border-border rounded-lg px-3 py-2 hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Link>
                ) : null}
                <span className="text-muted-foreground">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <Link
                    href={buildHref({ page: String(page + 1) })}
                    className="inline-flex items-center gap-1 border border-border rounded-lg px-3 py-2 hover:bg-muted"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
