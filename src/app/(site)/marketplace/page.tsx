import Link from "next/link";
import { headers } from "next/headers";
import { Store, Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import AddToCartButton from "@/components/marketplace-ecom/add-to-cart-button";

export const metadata = { title: "Shop all sellers" };

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

interface Props {
  searchParams: Promise<{ q?: string; category?: string; vendor?: string; sort?: string }>;
}

export default async function MarketplacePage({ searchParams }: Props) {
  const sp = await searchParams;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;

  const admin = await createAdminClient();

  let query = admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, vendor_id, vendors!inner(id, name, slug, status)",
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
    admin.from("categories").select("id, name, slug").eq("tenant_id", tenantId).order("order_index"),
    admin
      .from("vendors")
      .select("id, name, slug")
      .eq("tenant_id", tenantId)
      .eq("status", "approved")
      .contains("capabilities", ["ecommerce"])
      .order("name"),
  ]);

  const items = (products ?? []) as unknown as {
    id: string; name: string; slug: string; price: number; compare_price: number | null;
    images: string[]; stock_quantity: number; track_inventory: boolean;
    vendors: { name: string; slug: string | null } | null;
  }[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shop everything</h1>
        <p className="text-muted-foreground mt-1">
          {items.length} product{items.length === 1 ? "" : "s"} from {sellers?.length ?? 0} sellers
          across Bangladesh
        </p>
      </div>

      <form className="flex flex-wrap gap-2" action="/marketplace">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Search products"
            className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm bg-background"
          />
        </div>
        <select name="category" defaultValue={sp.category ?? ""}
          className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">All categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""}
          className="border rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
          Filter
        </button>
      </form>

      {sellers && sellers.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/marketplace"
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full border ${
              !sp.vendor ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            All sellers
          </Link>
          {sellers.map((s) => (
            <Link
              key={s.id}
              href={`/marketplace?vendor=${s.slug}`}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full border whitespace-nowrap ${
                sp.vendor === s.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground">
          No products match. Try a different search.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => {
            const img = Array.isArray(p.images) ? p.images[0] : undefined;
            const out = p.track_inventory && p.stock_quantity <= 0;
            const off =
              p.compare_price && p.compare_price > p.price
                ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100)
                : 0;
            return (
              <div key={p.id} className="border rounded-xl overflow-hidden flex flex-col group">
                <Link href={`/products/${p.slug}`} className="block relative aspect-square bg-muted">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                  {off > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                      −{off}%
                    </span>
                  )}
                </Link>

                <div className="p-3 flex flex-col flex-1 gap-1">
                  <Link href={`/products/${p.slug}`} className="font-medium text-sm line-clamp-2 hover:underline">
                    {p.name}
                  </Link>
                  {p.vendors && (
                    <Link
                      href={`/marketplace?vendor=${p.vendors.slug}`}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                    >
                      <Store className="w-3 h-3" /> {p.vendors.name}
                    </Link>
                  )}
                  <div className="mt-auto pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold">{tk(p.price)}</span>
                      {off > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {tk(p.compare_price!)}
                        </span>
                      )}
                    </div>
                    <AddToCartButton
                      product={{
                        id: p.id,
                        product_id: p.id,
                        name: p.name,
                        slug: p.slug,
                        price: Number(p.price),
                        image: img,
                      }}
                      disabled={out}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
