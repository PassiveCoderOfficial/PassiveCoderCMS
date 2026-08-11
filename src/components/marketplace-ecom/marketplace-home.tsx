import Link from "next/link";
import { ArrowRight, Store, Flame, Sparkles, Truck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/site/cart-drawer";
import { ProductCard, type CardProduct } from "./product-card";
import { MarketplaceHeader } from "./marketplace-header";
import { MarketplaceFooter } from "./marketplace-footer";

const tk = (n: number) => `৳${Number(n).toLocaleString()}`;

interface Category { id: string; name: string; slug: string; image_url: string | null }
interface Seller { id: string; name: string; slug: string | null; logo: string | null; description: string | null }

/**
 * Storefront home for a multi-vendor marketplace tenant.
 *
 * Rendered instead of the "your site is ready" placeholder when a marketplace
 * tenant has no hand-built home page — a live marketplace should never show an
 * empty CMS shell to shoppers.
 *
 * `standalone` mounts the header, footer and cart provider itself. Tenant "/"
 * is served by the (marketing) route group, which has none of the (site)
 * layout's chrome, so the page has to bring its own or it renders bare.
 */
export async function MarketplaceHome({
  tenantId,
  siteName,
  standalone = false,
}: {
  tenantId: string;
  siteName: string;
  standalone?: boolean;
}) {
  const admin = await createAdminClient();

  const productCols =
    "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, created_at, vendors!inner(id, name, slug, status)";

  const [{ data: categories }, { data: featuredRows }, { data: newRows }, { data: sellers }, { data: identity }, { data: contact }] =
    await Promise.all([
      admin
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("tenant_id", tenantId)
        .eq("type", "product")
        .order("order_index"),
      admin
        .from("products")
        .select(productCols)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .eq("approval_status", "approved")
        .eq("vendors.status", "approved")
        .eq("featured", true)
        .limit(8),
      admin
        .from("products")
        .select(productCols)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .eq("approval_status", "approved")
        .eq("vendors.status", "approved")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("vendors")
        .select("id, name, slug, logo, description")
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .contains("capabilities", ["ecommerce"])
        .order("name")
        .limit(6),
      admin
        .from("site_identity")
        .select("logo_url, logo_dark_url")
        .eq("tenant_id", tenantId)
        .maybeSingle(),
      admin
        .from("contact_details")
        .select("phone, email, address")
        .eq("tenant_id", tenantId)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .limit(1)
        .maybeSingle(),
    ]);

  const cats = (categories ?? []) as Category[];
  const featured = (featuredRows ?? []) as unknown as CardProduct[];
  const latest = (newRows ?? []) as unknown as CardProduct[];
  const shops = (sellers ?? []) as Seller[];
  const heroProduct = featured[0] ?? latest[0];

  const body = (
    <div className="bg-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1A1330]">
        <div
          aria-hidden
          className="absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full bg-[#FF5A1F]/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full bg-[#FF5A1F]/10 blur-3xl"
        />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9A6C]" />
              {shops.length} verified sellers · nationwide delivery
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Everything you need,
              <br />
              <span className="text-[#FF7A45]">from sellers you trust</span>
            </h1>
            <p className="mt-5 text-white/70 text-lg max-w-lg leading-relaxed">
              Thousands of products from shops across Bangladesh. Cash on delivery
              everywhere, easy returns, and one basket for every seller.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
              >
                Start shopping <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/vendor"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3.5 rounded-full font-semibold backdrop-blur transition-colors"
              >
                <Store className="w-4 h-4" /> Sell on {siteName}
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-white/60">
              <Truck className="w-4 h-4" />
              Delivery from ৳60 inside Dhaka · ৳120 outside
            </div>
          </div>

          {heroProduct && (
            <div className="hidden lg:block">
              <div className="relative ml-auto max-w-md rounded-3xl bg-white p-5 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <Link href={`/products/${heroProduct.slug}`} className="block">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-[#F9FAFB]">
                    {Array.isArray(heroProduct.images) && heroProduct.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={heroProduct.images[0]}
                        alt={heroProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-[#FF5A1F] uppercase tracking-wide">
                      Featured
                    </p>
                    <p className="mt-1 font-semibold text-[#1A1330] line-clamp-1">
                      {heroProduct.name}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#1A1330]">
                      {tk(heroProduct.price)}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────── */}
      {cats.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1330]">Shop by category</h2>
              <p className="text-[#667085] mt-1">Find what you need, faster</p>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-[#FF5A1F] hover:text-[#E64A0F] whitespace-nowrap inline-flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {cats.map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.id}`}
                className="group rounded-2xl border border-[#EAECF0] p-3 text-center hover:border-[#FF5A1F] hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-[#FFF6F2] mb-2.5">
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : null}
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#1A1330] group-hover:text-[#FF5A1F] leading-tight line-clamp-2">
                  {c.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured ─────────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-[#FFF6F2] border-y border-[#FFE4D6]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1A1330] flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#FF5A1F]" /> Trending now
                </h2>
                <p className="text-[#667085] mt-1">Handpicked by our sellers</p>
              </div>
              <Link
                href="/shop"
                className="text-sm font-semibold text-[#FF5A1F] hover:text-[#E64A0F] whitespace-nowrap inline-flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New arrivals ─────────────────────────────────────────────── */}
      {latest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1330]">New arrivals</h2>
              <p className="text-[#667085] mt-1">Just added to the marketplace</p>
            </div>
            <Link
              href="/shop"
              className="text-sm font-semibold text-[#FF5A1F] hover:text-[#E64A0F] whitespace-nowrap inline-flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Sellers ──────────────────────────────────────────────────── */}
      {shops.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#1A1330]">Meet our sellers</h2>
            <p className="text-[#667085] mt-1">
              Every shop is verified before it can sell here
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((s) => (
              <Link
                key={s.id}
                href={`/shop?vendor=${s.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-[#EAECF0] p-4 hover:border-[#FF5A1F] hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#FFF6F2] shrink-0 flex items-center justify-center">
                  {s.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-[#FF5A1F]" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[#1A1330] group-hover:text-[#FF5A1F] truncate">
                    {s.name}
                  </p>
                  {s.description && (
                    <p className="text-sm text-[#667085] mt-0.5 line-clamp-2">{s.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Seller CTA ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="rounded-3xl bg-[#1A1330] px-6 sm:px-12 py-12 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#FF5A1F]/20 blur-3xl"
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Have something to sell?
            </h2>
            <p className="text-white/70 mt-3 max-w-xl mx-auto">
              Open your shop on {siteName} and reach buyers across Bangladesh. No monthly
              fee — you only pay commission on what you sell.
            </p>
            <Link
              href="/vendor"
              className="inline-flex items-center gap-2 mt-7 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-7 py-3.5 rounded-full font-semibold transition-colors"
            >
              <Store className="w-4 h-4" /> Become a seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );

  if (!standalone) return body;

  return (
    <CartProvider>
      <MarketplaceHeader
        logoUrl={identity?.logo_url ?? null}
        siteName={siteName}
        categories={cats}
        supportPhone={contact?.phone}
      />
      {body}
      <MarketplaceFooter
        logoUrl={identity?.logo_dark_url ?? identity?.logo_url ?? null}
        siteName={siteName}
        categories={cats}
        contact={contact ?? null}
      />
      <CartDrawer />
    </CartProvider>
  );
}
