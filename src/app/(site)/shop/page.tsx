import Link from "next/link";
import { headers } from "next/headers";
import { BadgeCheck, ChevronRight, Filter, PackageSearch, Star, Store, X } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import type { CardProduct } from "@/components/marketplace-ecom/product-card";
import { FeedCard } from "@/components/marketplace-ecom/feed-card";
import { ChatNowButton } from "@/components/marketplace-ecom/chat/chat-now-button";
import { Stars } from "@/components/marketplace-ecom/stars";
import { SingleStoreShop } from "@/components/site/single-store-shop";

export const metadata = { title: "Shop all products" };

type SP = { q?: string; category?: string; vendor?: string; sort?: string; min?: string; max?: string; rating?: string; page?: string };
interface Props {
  searchParams: Promise<SP>;
}

const SORTS = [
  { key: "", label: "Relevance" },
  { key: "new", label: "Latest" },
  { key: "sales", label: "Top sales" },
  { key: "discount", label: "Deals" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
];

const PRICE_BANDS: [string | undefined, string | undefined, string][] = [
  [undefined, "500", "Under ৳500"],
  ["500", "2000", "৳500 – ৳2,000"],
  ["2000", "10000", "৳2,000 – ৳10,000"],
  ["10000", undefined, "Over ৳10,000"],
];

/**
 * Marketplace search / catalogue — Shopee-style: filter sidebar (drawer on
 * phones), sort tabs, dense product grid. With `?vendor=` it becomes that
 * seller's shop page, headed by a shop banner with chat.
 */
export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;

  const admin = await createAdminClient();

  // An ordinary single-store tenant has no sellers, and every query below
  // inner-joins `vendors` — its own catalogue would always come back empty.
  // Same "approved ecommerce sellers exist" test checkout/page.tsx routes on.
  const { count: sellerCount } = await admin
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .contains("capabilities", ["ecommerce"]);
  if ((sellerCount ?? 0) === 0) return <SingleStoreShop tenantId={tenantId} sp={sp} />;

  let query = admin
    .from("products")
    .select(
      "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, rating_avg, rating_count, sold_count, vendor_id, vendors!inner(id, name, slug, status)",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .eq("approval_status", "approved")
    .eq("vendors.status", "approved")
    .limit(60);

  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.vendor) query = query.eq("vendors.slug", sp.vendor);
  if (sp.category) query = query.contains("category_ids", JSON.stringify([sp.category]));
  if (sp.min && Number(sp.min) > 0) query = query.gte("price", Number(sp.min));
  if (sp.max && Number(sp.max) > 0) query = query.lte("price", Number(sp.max));
  if (sp.rating && Number(sp.rating) > 0) query = query.gte("rating_avg", Number(sp.rating));

  query =
    sp.sort === "price_asc"
      ? query.order("price", { ascending: true })
      : sp.sort === "price_desc"
        ? query.order("price", { ascending: false })
        : sp.sort === "discount"
          ? query.not("compare_price", "is", null).order("compare_price", { ascending: false })
          : sp.sort === "sales"
            ? query.order("sold_count", { ascending: false })
            : sp.sort === "new"
              ? query.order("created_at", { ascending: false })
              : query.order("featured", { ascending: false }).order("sold_count", { ascending: false }).order("created_at", { ascending: false });

  const [{ data: products }, { data: categories }, { data: sellers }] = await Promise.all([
    query,
    admin.from("categories").select("id, name, slug, image_url").eq("tenant_id", tenantId).eq("type", "product").order("order_index"),
    admin
      .from("vendor_public_profiles")
      .select("id, name, slug, logo, banner, description, rating, rating_count, pickup_area, created_at")
      .eq("tenant_id", tenantId)
      .order("name"),
  ]);

  const items = (products ?? []) as unknown as CardProduct[];
  const cats = categories ?? [];
  const shops = sellers ?? [];
  const activeCat = cats.find((c) => c.id === sp.category);
  const activeShop = shops.find((s) => s.slug === sp.vendor);

  const buildHref = (patch: Partial<SP>) => {
    const next = new URLSearchParams();
    const merged: SP = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };

  const heading = sp.q ? `Results for “${sp.q}”` : activeCat ? activeCat.name : activeShop ? "All products" : "All products";

  const chips: { label: string; href: string }[] = [];
  if (sp.q) chips.push({ label: `“${sp.q}”`, href: buildHref({ q: undefined }) });
  if (activeCat) chips.push({ label: activeCat.name, href: buildHref({ category: undefined }) });
  if (sp.min || sp.max)
    chips.push({ label: `৳${sp.min ?? 0} – ${sp.max ? `৳${sp.max}` : "any"}`, href: buildHref({ min: undefined, max: undefined }) });
  if (sp.rating) chips.push({ label: `${sp.rating}★ & up`, href: buildHref({ rating: undefined }) });
  if (activeShop && !sp.vendor) chips.push({ label: activeShop.name, href: buildHref({ vendor: undefined }) });

  const filters = (
    <div className="space-y-6 text-sm">
      <div>
        <p className="font-bold text-[#1A1330] mb-2 uppercase text-xs tracking-wide">Category</p>
        <ul className="space-y-1">
          <li>
            <Link href={buildHref({ category: undefined })} className={`block py-1 ${!sp.category ? "text-[#FF5A1F] font-semibold" : "text-[#344054] hover:text-[#FF5A1F]"}`}>
              All categories
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link href={buildHref({ category: c.id })} className={`block py-1 ${sp.category === c.id ? "text-[#FF5A1F] font-semibold" : "text-[#344054] hover:text-[#FF5A1F]"}`}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-bold text-[#1A1330] mb-2 uppercase text-xs tracking-wide">Price range</p>
        <form action="/shop" className="flex items-center gap-2">
          {Object.entries(sp).filter(([k, v]) => v && k !== "min" && k !== "max").map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <input name="min" defaultValue={sp.min} placeholder="Min" inputMode="numeric" className="w-full h-9 rounded-lg border border-[#D0D5DD] px-2" />
          <span className="text-[#98A2B3]">–</span>
          <input name="max" defaultValue={sp.max} placeholder="Max" inputMode="numeric" className="w-full h-9 rounded-lg border border-[#D0D5DD] px-2" />
          <button className="h-9 px-3 rounded-lg bg-[#FF5A1F] text-white font-semibold">Go</button>
        </form>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRICE_BANDS.map(([mn, mx, label]) => (
            <Link key={label} href={buildHref({ min: mn, max: mx })} className={`text-xs px-2.5 py-1 rounded-full border ${sp.min === mn && sp.max === mx ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FFF1EB]" : "border-[#EAECF0] text-[#344054]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="font-bold text-[#1A1330] mb-2 uppercase text-xs tracking-wide">Rating</p>
        {[4, 3].map((r) => (
          <Link key={r} href={buildHref({ rating: sp.rating === String(r) ? undefined : String(r) })} className={`flex items-center gap-2 py-1 ${sp.rating === String(r) ? "text-[#FF5A1F] font-semibold" : "text-[#344054]"}`}>
            <Stars value={r} /> & up
          </Link>
        ))}
      </div>
      {!activeShop && shops.length > 0 && (
        <div>
          <p className="font-bold text-[#1A1330] mb-2 uppercase text-xs tracking-wide">Shops</p>
          <ul className="space-y-1">
            {shops.map((s) => (
              <li key={s.id}>
                <Link href={buildHref({ vendor: s.slug ?? undefined })} className="flex items-center gap-2 py-1 text-[#344054] hover:text-[#FF5A1F]">
                  <Store className="w-3.5 h-3.5" /> {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#F5F5F7] min-h-[60vh] pb-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-3 sm:pt-4 space-y-3">
        <nav className="hidden sm:flex items-center gap-1 text-sm text-[#667085]">
          <Link href="/" className="hover:text-[#FF5A1F]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {activeShop ? <span className="text-[#1A1330]">{activeShop.name}</span> : <span className="text-[#1A1330]">{heading}</span>}
        </nav>

        {/* Shop banner (seller storefront) */}
        {activeShop && (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1A1330] to-[#3B2470] text-white">
            {activeShop.banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeShop.banner} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="relative p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white ring-4 ring-white/20 flex items-center justify-center shrink-0">
                  {activeShop.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={activeShop.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-[#FF5A1F]" />
                  )}
                </span>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 truncate">
                    {activeShop.name} <BadgeCheck className="w-5 h-5 text-[#38BDF8] shrink-0" />
                  </h1>
                  {activeShop.description && <p className="text-sm text-white/70 line-clamp-1">{activeShop.description}</p>}
                  <div className="mt-2 flex gap-2">
                    <ChatNowButton
                      vendorId={activeShop.id}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#FF5A1F] text-white rounded-lg px-3 py-1.5 hover:bg-[#E64A0F]"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:ml-auto text-center">
                <div>
                  <p className="text-lg font-extrabold">{activeShop.rating_count ? Number(activeShop.rating).toFixed(1) : "New"}</p>
                  <p className="text-xs text-white/70 flex items-center justify-center gap-1"><Star className="w-3 h-3 fill-current" /> Rating</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold">{items.length}</p>
                  <p className="text-xs text-white/70">Products</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold">{activeShop.pickup_area ?? "BD"}</p>
                  <p className="text-xs text-white/70">Ships from</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category quick rail when browsing everything */}
        {!activeShop && !sp.category && cats.length > 0 && (
          <div className="bg-white rounded-xl p-3 flex gap-3 overflow-x-auto [scrollbar-width:none]">
            {cats.map((c) => (
              <Link key={c.id} href={buildHref({ category: c.id })} className="shrink-0 w-[72px] flex flex-col items-center gap-1 text-center group">
                <span className="w-12 h-12 rounded-full overflow-hidden bg-[#FFF1EB]">
                  {c.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </span>
                <span className="text-[11px] leading-tight text-[#1A1330] line-clamp-2 group-hover:text-[#FF5A1F]">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[220px_1fr] gap-4 items-start">
          <aside className="hidden lg:block bg-white rounded-xl p-4 sticky top-28">
            <p className="flex items-center gap-2 font-bold text-[#1A1330] mb-4"><Filter className="w-4 h-4" /> Filters</p>
            {filters}
          </aside>

          <div className="min-w-0 space-y-3">
            {/* Sort tabs + mobile filter drawer */}
            <div className="bg-white rounded-xl px-2 sm:px-3 py-2 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
              <span className="hidden sm:inline text-sm text-[#667085] mr-2 shrink-0">Sort by</span>
              {SORTS.map((s) => {
                const on = (sp.sort ?? "") === s.key;
                return (
                  <Link
                    key={s.key}
                    href={buildHref({ sort: s.key || undefined })}
                    className={`shrink-0 text-sm px-3 py-1.5 rounded-lg ${on ? "bg-[#FF5A1F] text-white font-semibold" : "text-[#344054] hover:bg-[#FFF1EB]"}`}
                  >
                    {s.label}
                  </Link>
                );
              })}
              <details className="lg:hidden ml-auto shrink-0 [&_summary::-webkit-details-marker]:hidden">
                <summary className="list-none cursor-pointer text-sm px-3 py-1.5 rounded-lg border border-[#EAECF0] flex items-center gap-1">
                  <Filter className="w-4 h-4" /> Filter
                </summary>
                <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
                  <div className="w-[85%] max-w-sm h-full bg-white p-4 overflow-y-auto">
                    <p className="font-bold text-[#1A1330] mb-4">Filters</p>
                    {filters}
                    <Link href="/shop" className="block mt-6 text-center text-sm text-[#667085] underline">Reset all</Link>
                  </div>
                </div>
              </details>
            </div>

            <div className="flex items-baseline gap-2 flex-wrap px-1">
              {!activeShop && <h1 className="text-lg font-bold text-[#1A1330]">{heading}</h1>}
              <span className="text-sm text-[#667085]">{items.length} item{items.length === 1 ? "" : "s"}</span>
              {chips.map((c) => (
                <Link key={c.label} href={c.href} className="text-xs bg-[#FFF1EB] text-[#FF5A1F] rounded-full pl-2.5 pr-1.5 py-1 flex items-center gap-1">
                  {c.label} <X className="w-3 h-3" />
                </Link>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <PackageSearch className="w-10 h-10 text-[#D0D5DD] mx-auto mb-3" />
                <p className="font-semibold text-[#1A1330]">No products found</p>
                <p className="text-sm text-[#667085] mt-1">Try a different search or clear your filters.</p>
                <Link href={activeShop ? `/shop?vendor=${activeShop.slug}` : "/shop"} className="inline-block mt-5 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-5 py-2.5 rounded-full text-sm font-semibold">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                {items.map((p) => (
                  <FeedCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
