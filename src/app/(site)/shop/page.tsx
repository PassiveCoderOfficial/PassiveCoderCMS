import Link from "next/link";
import { headers } from "next/headers";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { ProductCard, type CardProduct } from "@/components/marketplace-ecom/product-card";

export const metadata = { title: "Shop all products" };

interface Props {
  searchParams: Promise<{ q?: string; category?: string; vendor?: string; sort?: string }>;
}

const SORTS = [
  { key: "", label: "Newest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;

  const admin = await createAdminClient();

  let query = admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, vendor_id, vendors!inner(id, name, slug, status)",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("vendors.status", "approved")
    .limit(48);

  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.vendor) query = query.eq("vendors.slug", sp.vendor);
  if (sp.category) query = query.contains("category_ids", JSON.stringify([sp.category]));
  query =
    sp.sort === "price_asc"
      ? query.order("price", { ascending: true })
      : sp.sort === "price_desc"
        ? query.order("price", { ascending: false })
        : query.order("created_at", { ascending: false });

  const [{ data: products }, { data: categories }, { data: sellers }] = await Promise.all([
    query,
    admin
      .from("categories")
      .select("id, name, slug")
      .eq("tenant_id", tenantId)
      .eq("type", "product")
      .order("order_index"),
    admin
      .from("vendors")
      .select("id, name, slug")
      .eq("tenant_id", tenantId)
      .eq("status", "approved")
      .contains("capabilities", ["ecommerce"])
      .order("name"),
  ]);

  const items = (products ?? []) as unknown as CardProduct[];
  const cats = categories ?? [];
  const shops = sellers ?? [];

  const activeCat = cats.find((c) => c.id === sp.category);
  const activeShop = shops.find((s) => s.slug === sp.vendor);

  const heading = sp.q
    ? `Results for “${sp.q}”`
    : activeCat
      ? activeCat.name
      : activeShop
        ? activeShop.name
        : "All products";

  // Preserve the other active filters when building each chip's URL, so
  // picking a sort doesn't silently drop the category the shopper chose.
  const buildHref = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { q: sp.q, category: sp.category, vendor: sp.vendor, sort: sp.sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div>
          <nav className="text-sm text-[#667085] mb-2">
            <Link href="/" className="hover:text-[#FF5A1F]">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-[#1A1330]">Shop</span>
          </nav>
          <h1 className="text-3xl font-bold text-[#1A1330]">{heading}</h1>
          <p className="text-[#667085] mt-1">
            {items.length} product{items.length === 1 ? "" : "s"}
            {shops.length > 0 && !activeShop ? ` from ${shops.length} sellers` : ""}
          </p>
        </div>

        <form action="/shop" className="flex flex-wrap gap-2 items-center">
          {sp.category && <input type="hidden" name="category" value={sp.category} />}
          {sp.vendor && <input type="hidden" name="vendor" value={sp.vendor} />}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
            <input
              name="q"
              defaultValue={sp.q}
              placeholder="Search products"
              className="w-full h-11 pl-10 pr-4 rounded-full border border-[#EAECF0] bg-[#F9FAFB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F] focus:bg-white transition-all"
            />
          </div>
          <select
            name="sort"
            defaultValue={sp.sort ?? ""}
            className="h-11 px-4 rounded-full border border-[#EAECF0] bg-white text-sm text-[#1A1330] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <button className="h-11 px-5 rounded-full bg-[#1A1330] text-white text-sm font-semibold hover:bg-[#2A2145] transition-colors inline-flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Apply
          </button>
        </form>

        {cats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <Link
              href={buildHref({ category: undefined })}
              className={`shrink-0 text-sm px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                !sp.category
                  ? "bg-[#FF5A1F] text-white border-[#FF5A1F]"
                  : "border-[#EAECF0] text-[#1A1330] hover:border-[#FF5A1F] hover:text-[#FF5A1F]"
              }`}
            >
              All categories
            </Link>
            {cats.map((c) => (
              <Link
                key={c.id}
                href={buildHref({ category: c.id })}
                className={`shrink-0 text-sm px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                  sp.category === c.id
                    ? "bg-[#FF5A1F] text-white border-[#FF5A1F]"
                    : "border-[#EAECF0] text-[#1A1330] hover:border-[#FF5A1F] hover:text-[#FF5A1F]"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {shops.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <Link
              href={buildHref({ vendor: undefined })}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                !sp.vendor
                  ? "bg-[#1A1330] text-white border-[#1A1330]"
                  : "border-[#EAECF0] text-[#667085] hover:text-[#1A1330]"
              }`}
            >
              All sellers
            </Link>
            {shops.map((s) => (
              <Link
                key={s.id}
                href={buildHref({ vendor: s.slug ?? undefined })}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  sp.vendor === s.slug
                    ? "bg-[#1A1330] text-white border-[#1A1330]"
                    : "border-[#EAECF0] text-[#667085] hover:text-[#1A1330]"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="border border-[#EAECF0] rounded-2xl p-16 text-center">
            <PackageSearch className="w-10 h-10 text-[#D0D5DD] mx-auto mb-3" />
            <p className="font-semibold text-[#1A1330]">No products found</p>
            <p className="text-sm text-[#667085] mt-1">
              Try a different search or clear your filters.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-5 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
