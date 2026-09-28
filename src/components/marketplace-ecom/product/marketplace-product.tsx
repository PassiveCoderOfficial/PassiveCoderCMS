import Link from "next/link";
import {
  BadgeCheck, Banknote, ChevronRight, MapPin, RotateCcw, ShieldCheck, Store, Truck,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { WishlistButton } from "@/app/(site)/products/[slug]/wishlist-button";
import { ProductGallery } from "./gallery";
import { BuyBox, type VariantOpt } from "./buy-box";
import { activeFlashPrices, listPublicVouchers } from "@/lib/marketplace-ecom/pricing";
import { FlashCountdown } from "./flash-countdown";
import { VoucherChips } from "./voucher-chips";
import { ProductReviews } from "./product-reviews";
import { ChatNowButton } from "../chat/chat-now-button";
import { FeedCard } from "../feed-card";
import { Stars } from "../stars";
import type { CardProduct } from "../product-card";

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export interface MarketplaceProductRow {
  id: string;
  tenant_id: string;
  vendor_id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  images: string[] | null;
  description: string | null;
  short_description: string | null;
  sku: string | null;
  brand: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  category_ids: string[] | null;
  rating_avg: number;
  rating_count: number;
  sold_count: number;
}

/**
 * Marketplace product page — Shopee / Lazada / Daraz layout: gallery, price
 * panel, delivery + guarantees, buy box, seller card with chat, reviews,
 * more from this shop and similar items. Chat and reviews are always shown;
 * sign-in is asked for only when a shopper actually uses them.
 */
export async function MarketplaceProduct({
  product: p,
  wishlisted,
  signedIn,
  openReview,
}: {
  product: MarketplaceProductRow;
  wishlisted: boolean;
  signedIn: boolean;
  openReview: boolean;
}) {
  const admin = await createAdminClient();
  const cols =
    "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, rating_avg, rating_count, sold_count, category_ids, vendors!inner(id, name, slug, status)";
  const live = () =>
    admin
      .from("products")
      .select(cols)
      .eq("tenant_id", p.tenant_id)
      .eq("status", "active")
      .eq("approval_status", "approved")
      .eq("vendors.status", "approved")
      .neq("id", p.id);
  const firstCat = p.category_ids?.[0];

  const [{ data: vendor }, { count: shopCount }, { data: fromShop }, { data: similar }, { data: rates }, { data: cats }] =
    await Promise.all([
      admin
        .from("vendor_public_profiles")
        .select("id, name, slug, logo, rating, rating_count, pickup_area, created_at")
        .eq("id", p.vendor_id)
        .maybeSingle(),
      admin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", p.vendor_id)
        .eq("status", "active")
        .eq("approval_status", "approved"),
      live().eq("vendor_id", p.vendor_id).order("created_at", { ascending: false }).limit(6),
      live().neq("vendor_id", p.vendor_id).order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(24),
      admin.from("shipping_rates").select("name, rate, free_above, eta_days, is_default").eq("tenant_id", p.tenant_id).order("sort_order"),
      firstCat ? admin.from("categories").select("id, name").eq("id", firstCat).maybeSingle() : Promise.resolve({ data: null }),
    ]);

  // Same-category items first, then the rest of the catalogue, so a thin
  // category never leaves the rail near-empty.
  type Cat = CardProduct & { category_ids?: string[] | null };
  const others = (similar ?? []) as unknown as Cat[];
  const recs = [
    ...others.filter((x) => firstCat && x.category_ids?.includes(firstCat)),
    ...others.filter((x) => !(firstCat && x.category_ids?.includes(firstCat))),
  ].slice(0, 12);

  const [{ data: variantRows }, flashMap, vouchers] = await Promise.all([
    admin
      .from("product_variants")
      .select("id, name, price, stock_quantity, image")
      .eq("product_id", p.id)
      .neq("is_active", false)
      .order("sort_order"),
    activeFlashPrices(admin, p.tenant_id, [p.id]),
    listPublicVouchers(admin, p.tenant_id, [p.vendor_id]),
  ]);
  const variants = (variantRows ?? []) as VariantOpt[];
  const flash = variants.length ? undefined : flashMap.get(p.id);
  const vPrices = variants.map((v) => Number(v.price ?? p.price));
  const minP = vPrices.length ? Math.min(...vPrices) : Number(p.price);
  const maxP = vPrices.length ? Math.max(...vPrices) : Number(p.price);

  const images = Array.isArray(p.images) ? p.images : [];
  const off = p.compare_price && p.compare_price > p.price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0;
  const stock = p.track_inventory ? p.stock_quantity : null;
  const cat = cats as { id: string; name: string } | null;
  const shopYears = vendor?.created_at ? Math.max(0, new Date().getFullYear() - new Date(vendor.created_at).getFullYear()) : 0;
  const shipping = (rates ?? []) as { name: string; rate: number; free_above: number | null; eta_days: string | null }[];

  return (
    <div className="bg-[#F5F5F7] pb-24 md:pb-10">
      <div className="max-w-7xl mx-auto sm:px-4 sm:pt-4 space-y-2 sm:space-y-4">
        <nav className="hidden sm:flex items-center gap-1 text-sm text-[#667085]">
          <Link href="/" className="hover:text-[#FF5A1F]">Home</Link>
          <ChevronRight className="w-4 h-4" />
          {cat ? (
            <Link href={`/shop?category=${cat.id}`} className="hover:text-[#FF5A1F]">{cat.name}</Link>
          ) : (
            <Link href="/shop" className="hover:text-[#FF5A1F]">Shop</Link>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1330] truncate max-w-[50ch]">{p.name}</span>
        </nav>

        {/* ── Main panel ─────────────────────────────────────────────── */}
        <div className="bg-white sm:rounded-2xl grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 md:gap-8 md:p-6">
          <ProductGallery images={images} name={p.name} badge={off ? `-${off}%` : null} />

          <div className="px-4 pb-4 md:p-0 space-y-4 min-w-0">
            <div className="flex items-start gap-3">
              <h1 className="text-lg sm:text-2xl font-semibold text-[#1A1330] leading-snug flex-1">
                {p.brand && <span className="mr-1.5 align-middle text-[11px] font-bold text-white bg-[#1A1330] rounded px-1.5 py-0.5">{p.brand}</span>}
                {p.name}
              </h1>
              <WishlistButton productId={p.id} initiallySaved={wishlisted} isSignedIn={signedIn} />
            </div>

            <div className="flex items-center gap-3 text-sm flex-wrap">
              <a href="#reviews" className="flex items-center gap-1.5 hover:opacity-80">
                {p.rating_count > 0 ? (
                  <>
                    <span className="font-bold text-[#FF5A1F] underline underline-offset-2">{Number(p.rating_avg).toFixed(1)}</span>
                    <Stars value={Number(p.rating_avg)} />
                    <span className="text-[#667085] border-l border-[#EAECF0] pl-3">{p.rating_count} Ratings</span>
                  </>
                ) : (
                  <span className="text-[#667085]">No ratings yet</span>
                )}
              </a>
              <span className="text-[#667085] border-l border-[#EAECF0] pl-3">{compact(p.sold_count)} Sold</span>
            </div>

            {flash && (
              <div className="rounded-t-xl -mb-4 bg-gradient-to-r from-[#FF5A1F] to-[#FF8A3D] text-white px-4 py-2 flex items-center gap-2">
                <span className="font-extrabold italic uppercase tracking-wide">Flash Sale</span>
                <span className="ml-auto text-xs uppercase">Ends in</span>
                <FlashCountdown endsAt={flash.ends_at} />
              </div>
            )}
            <div className={`${flash ? "rounded-b-xl" : "rounded-xl"} bg-gradient-to-r from-[#FFF1EB] to-[#FFF8F4] px-4 py-3 flex items-baseline gap-3 flex-wrap`}>
              {flash ? (
                <>
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#FF5A1F]">{tk(flash.sale_price)}</span>
                  <span className="text-base text-[#98A2B3] line-through">{tk(Math.max(Number(p.price), Number(p.compare_price ?? 0)))}</span>
                  <span className="text-xs font-bold text-white bg-[#FF5A1F] rounded px-1.5 py-0.5">
                    -{Math.round((1 - flash.sale_price / Math.max(Number(p.price), Number(p.compare_price ?? 0))) * 100)}%
                  </span>
                  {flash.quantity_limit != null && (
                    <span className="w-full text-xs text-[#FF5A1F] font-semibold">
                      {flash.quantity_limit - flash.sold} left at this price
                    </span>
                  )}
                </>
              ) : (
              <>
              <span className="text-3xl sm:text-4xl font-extrabold text-[#FF5A1F]">
                {minP !== maxP ? `${tk(minP)} – ${tk(maxP)}` : tk(minP)}
              </span>
              {off > 0 && (
                <>
                  <span className="text-base text-[#98A2B3] line-through">{tk(p.compare_price!)}</span>
                  <span className="text-xs font-bold text-white bg-[#FF5A1F] rounded px-1.5 py-0.5">-{off}%</span>
                </>
              )}
              </>
              )}
            </div>

            {vouchers.length > 0 && <VoucherChips vouchers={vouchers as never} />}

            {p.short_description && <p className="text-sm text-[#475467]">{p.short_description}</p>}

            <dl className="text-sm space-y-3">
              <div className="flex gap-4">
                <dt className="w-20 shrink-0 text-[#667085]">Delivery</dt>
                <dd className="space-y-1">
                  {shipping.length ? (
                    shipping.map((r) => (
                      <p key={r.name} className="text-[#1A1330] leading-relaxed">
                        <Truck className="inline w-4 h-4 mr-1.5 -mt-0.5 text-[#16A34A]" />
                        {r.name}: <b>{tk(r.rate)}</b>
                        {r.eta_days && <span className="text-[#667085]">· {/day/i.test(r.eta_days) ? r.eta_days : `${r.eta_days} days`}</span>}
                        {r.free_above ? <span className="text-[#16A34A]">· Free over {tk(r.free_above)}</span> : null}
                      </p>
                    ))
                  ) : (
                    <p className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#16A34A]" /> Nationwide delivery</p>
                  )}
                  {vendor?.pickup_area && (
                    <p className="flex items-center gap-1.5 text-[#667085]"><MapPin className="w-4 h-4" /> Ships from {vendor.pickup_area}</p>
                  )}
                </dd>
              </div>
              <div className="flex gap-4">
                <dt className="w-20 shrink-0 text-[#667085]">Guarantee</dt>
                <dd className="flex flex-wrap gap-x-4 gap-y-1 text-[#1A1330]">
                  <span className="flex items-center gap-1"><Banknote className="w-4 h-4 text-[#FF5A1F]" /> Cash on delivery</span>
                  <span className="flex items-center gap-1"><RotateCcw className="w-4 h-4 text-[#FF5A1F]" /> 7-day returns</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-[#FF5A1F]" /> Verified seller</span>
                </dd>
              </div>
            </dl>

            <BuyBox
              product={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: flash ? flash.sale_price : Number(p.price),
                image: images[0] ?? null,
                stock,
                vendorId: p.vendor_id,
              }}
              variants={variants}
            />
          </div>
        </div>

        {/* ── Seller card ─────────────────────────────────────────────── */}
        {vendor && (
          <div className="bg-white sm:rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-16 h-16 rounded-full overflow-hidden bg-[#FFF1EB] flex items-center justify-center shrink-0 ring-2 ring-[#FFE4D6]">
                {vendor.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-7 h-7 text-[#FF5A1F]" />
                )}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-[#1A1330] truncate flex items-center gap-1.5">
                  {vendor.name}
                  <BadgeCheck className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                </p>
                <p className="text-xs text-[#667085]">{vendor.pickup_area ? `${vendor.pickup_area} · ` : ""}Verified seller</p>
                <div className="flex gap-2 mt-2">
                  <ChatNowButton
                    vendorId={p.vendor_id}
                    productId={p.id}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#FF5A1F] text-white rounded-lg px-3 py-1.5 hover:bg-[#E64A0F]"
                  />
                  <Link href={`/shop?vendor=${vendor.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold border border-[#D0D5DD] text-[#344054] rounded-lg px-3 py-1.5 hover:border-[#FF5A1F] hover:text-[#FF5A1F]">
                    <Store className="w-4 h-4" /> View shop
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:ml-auto sm:border-l border-[#EAECF0] sm:pl-6 gap-4 text-center sm:text-left">
              <div>
                <p className="text-xs text-[#667085]">Rating</p>
                <p className="font-bold text-[#FF5A1F]">{vendor.rating_count ? `${Number(vendor.rating).toFixed(1)} (${vendor.rating_count})` : "New"}</p>
              </div>
              <div>
                <p className="text-xs text-[#667085]">Products</p>
                <p className="font-bold text-[#FF5A1F]">{shopCount ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#667085]">Joined</p>
                <p className="font-bold text-[#FF5A1F]">{shopYears ? `${shopYears}y ago` : "This year"}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Details ─────────────────────────────────────────────────── */}
        <div className="bg-white sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[#1A1330] mb-3">Product details</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
            {cat && (<><dt className="text-[#667085]">Category</dt><dd>{cat.name}</dd></>)}
            {p.brand && (<><dt className="text-[#667085]">Brand</dt><dd>{p.brand}</dd></>)}
            {stock !== null && (<><dt className="text-[#667085]">Stock</dt><dd>{stock}</dd></>)}
            {p.sku && (<><dt className="text-[#667085]">SKU</dt><dd>{p.sku}</dd></>)}
          </dl>
          {p.description ? (
            <div className="text-sm leading-relaxed text-[#344054] whitespace-pre-wrap">{p.description}</div>
          ) : (
            <p className="text-sm text-[#98A2B3]">The seller hasn&apos;t added a description yet. Use Chat to ask them anything.</p>
          )}
        </div>

        <ProductReviews productId={p.id} openForm={openReview} />

        {(fromShop ?? []).length > 0 && (
          <section className="bg-white sm:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center mb-3">
              <h2 className="text-lg font-bold text-[#1A1330]">More from this shop</h2>
              <Link href={`/shop?vendor=${vendor?.slug}`} className="ml-auto text-sm font-semibold text-[#FF5A1F] flex items-center">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {(fromShop as unknown as CardProduct[]).map((x) => <FeedCard key={x.id} product={x} />)}
            </div>
          </section>
        )}

        {recs.length > 0 && (
          <section className="px-2 sm:px-0">
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-[#FF5A1F] border-b-2 border-[#FF5A1F] w-fit mx-auto px-4 pb-1 mb-3">
              You may also like
            </h2>
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {recs.map((x) => <FeedCard key={x.id} product={x} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
