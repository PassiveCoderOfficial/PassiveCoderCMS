import Link from "next/link";
import {
  Store, Sparkles, Truck, Zap, BadgeCheck, Banknote, Tag, ShieldCheck, RotateCcw, ChevronRight,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { MARKETPLACE_TOKENS_CSS } from "@/lib/marketplace-ecom/brand-tokens";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/site/cart-drawer";
import type { CardProduct } from "./product-card";
import { HeroCarousel, FlashSale, JustForYou, type HeroSlide } from "./home-widgets";
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
    "id, name, slug, price, compare_price, images, stock_quantity, track_inventory, featured, rating_avg, rating_count, sold_count, created_at, vendors!inner(id, name, slug, status)";

  const live = () =>
    admin
      .from("products")
      .select(productCols, { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .eq("approval_status", "approved")
      .eq("vendors.status", "approved");

  const [{ data: categories }, { data: dealRows }, feedRes, { data: sellers }, { data: identity }, { data: contact }] =
    await Promise.all([
      admin
        .from("categories")
        .select("id, name, slug, image_url")
        .eq("tenant_id", tenantId)
        .eq("type", "product")
        .order("order_index"),
      live().not("compare_price", "is", null).limit(40),
      live()
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .range(0, 23),
      admin
        .from("vendors")
        .select("id, name, slug, logo, description")
        .eq("tenant_id", tenantId)
        .eq("status", "approved")
        .contains("capabilities", ["ecommerce"])
        .order("name")
        .limit(12),
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
  const shops = (sellers ?? []) as Seller[];
  const feed = (feedRes.data ?? []) as unknown as CardProduct[];
  const feedHasMore = (feedRes.count ?? 0) > feed.length;
  const discount = (p: CardProduct) =>
    p.compare_price && p.compare_price > p.price ? (p.compare_price - p.price) / p.compare_price : 0;
  const deals = ((dealRows ?? []) as unknown as CardProduct[])
    .filter((p) => discount(p) > 0 && !(p.track_inventory && p.stock_quantity <= 0))
    .sort((x, y) => discount(y) - discount(x))
    .slice(0, 12);

  const tones = [
    "from-[#FF5A1F] to-[#C2185B]",
    "from-[#1A1330] to-[#4A2A8A]",
    "from-[#0E7C66] to-[#14B8A6]",
    "from-[#E11D48] to-[#FF8A3D]",
  ];
  const catSlides: HeroSlide[] = cats
    .filter((c) => c.image_url)
    .slice(0, 3)
    .map((c, k) => ({
      title: `${c.name} deals`,
      subtitle: k === 0 ? "Mega sale this week" : "Top picks",
      cta: "Shop now",
      href: `/shop?category=${c.id}`,
      image: c.image_url,
      tone: tones[k % tones.length],
    }));
  const topDeal = deals[0];
  const slides: HeroSlide[] = [
    ...(topDeal
      ? [{
          title: topDeal.name,
          subtitle: `Save ${Math.round(discount(topDeal) * 100)}% today`,
          cta: `Now ${tk(topDeal.price)}`,
          href: `/products/${topDeal.slug}`,
          image: Array.isArray(topDeal.images) ? topDeal.images[0] ?? null : null,
          tone: tones[3],
        }]
      : []),
    ...catSlides,
    {
      title: `Start selling on ${siteName}`,
      subtitle: "No monthly fee",
      cta: "Open your shop",
      href: "/vendor",
      image: null,
      tone: tones[1],
    },
  ];

  const quick = [
    { label: "Flash Deals", href: "/shop?sort=discount", icon: Zap, bg: "bg-[#FF5A1F]" },
    { label: "New Arrivals", href: "/shop?sort=new", icon: Sparkles, bg: "bg-[#7C3AED]" },
    { label: "Top Shops", href: "#top-shops", icon: BadgeCheck, bg: "bg-[#0EA5E9]" },
    { label: "Cash on Delivery", href: "/shop", icon: Banknote, bg: "bg-[#16A34A]" },
    { label: "Under ৳500", href: "/shop?max=500", icon: Tag, bg: "bg-[#E11D48]" },
    { label: "Sell With Us", href: "/vendor", icon: Store, bg: "bg-[#1A1330]" },
  ];
  const trust = [
    { label: "Verified sellers", icon: ShieldCheck },
    { label: "Cash on delivery", icon: Banknote },
    { label: "7-day returns", icon: RotateCcw },
    { label: "Nationwide delivery", icon: Truck },
  ];

  const body = (
    <div className="bg-[#F5F5F7] pb-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-2 sm:pt-4 space-y-2 sm:space-y-4">
        {/* ── Banner carousel + side promos ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
          <div className="lg:col-span-2 min-w-0">
            <HeroCarousel slides={slides} />
          </div>
          <div className="hidden lg:grid grid-rows-2 gap-3 lg:h-[360px]">
            <Link href="/vendor" className="rounded-2xl bg-gradient-to-br from-[#1A1330] to-[#3B2470] p-5 text-white flex flex-col justify-center hover:opacity-95">
              <Store className="w-6 h-6 text-[#FF8A3D]" />
              <p className="mt-2 font-extrabold text-lg">Sell on {siteName}</p>
              <p className="text-white/70 text-sm">Commission only. Zero monthly fee.</p>
            </Link>
            <div className="rounded-2xl bg-gradient-to-br from-[#FF5A1F] to-[#FF8A3D] p-5 text-white flex flex-col justify-center">
              <Truck className="w-6 h-6" />
              <p className="mt-2 font-extrabold text-lg">Cash on delivery</p>
              <p className="text-white/85 text-sm">Nationwide. Pay when your parcel arrives.</p>
            </div>
          </div>
        </div>

        {/* ── Quick-action icons ───────────────────────────────────── */}
        <nav className="bg-white rounded-xl sm:rounded-2xl p-3 grid grid-cols-6 gap-1">
          {quick.map((q) => (
            <Link key={q.label} href={q.href} className="flex flex-col items-center gap-1.5 group text-center">
              <span className={`${q.bg} w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:-translate-y-0.5 transition-transform`}>
                <q.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </span>
              <span className="text-[10px] sm:text-xs leading-tight text-[#1A1330] line-clamp-2">{q.label}</span>
            </Link>
          ))}
        </nav>

        {/* ── Trust strip ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 text-[11px] sm:text-sm text-[#1A1330] bg-white rounded-xl sm:rounded-2xl px-3 py-2 overflow-x-auto [scrollbar-width:none]">
          {trust.map((t) => (
            <span key={t.label} className="flex items-center gap-1 whitespace-nowrap">
              <t.icon className="w-4 h-4 text-[#FF5A1F]" /> {t.label}
            </span>
          ))}
        </div>

        <FlashSale products={deals} />

        {/* ── Categories: Shopee-style two-row scrolling grid ──────── */}
        {cats.length > 0 && (
          <section className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5">
            <div className="flex items-center mb-3">
              <h2 className="text-base sm:text-lg font-bold text-[#1A1330] uppercase tracking-wide">Categories</h2>
              <Link href="/shop" className="ml-auto text-sm font-semibold text-[#FF5A1F] flex items-center">
                All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-flow-col grid-rows-2 auto-cols-[76px] sm:auto-cols-[104px] lg:grid-flow-row lg:grid-rows-none lg:grid-cols-8 gap-y-4 gap-x-1 overflow-x-auto pb-1 [scrollbar-width:none]">
              {cats.map((c) => (
                <Link key={c.id} href={`/shop?category=${c.id}`} className="group flex flex-col items-center gap-1.5 text-center">
                  <span className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#FFF1EB] ring-1 ring-[#EAECF0] group-hover:ring-[#FF5A1F] transition">
                    {c.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    )}
                  </span>
                  <span className="text-[11px] sm:text-xs leading-tight text-[#1A1330] line-clamp-2 group-hover:text-[#FF5A1F]">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Top shops (Shopee Mall / LazMall / DarazMall rail) ───── */}
        {shops.length > 0 && (
          <section id="top-shops" className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 scroll-mt-28">
            <div className="flex items-center mb-3 gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#1A1330] uppercase tracking-wide">Top Shops</h2>
              <span className="text-[10px] font-bold text-white bg-[#FF5A1F] rounded px-1.5 py-0.5 flex items-center gap-0.5">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <div className="flex lg:grid lg:grid-cols-6 gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
              {shops.map((s) => (
                <Link key={s.id} href={`/shop?vendor=${s.slug}`} className="group shrink-0 w-[108px] sm:w-[140px] lg:w-auto rounded-xl border border-[#EAECF0] p-3 text-center hover:border-[#FF5A1F] hover:shadow-md transition">
                  <span className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#FFF1EB] flex items-center justify-center">
                    {s.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-[#FF5A1F]" />
                    )}
                  </span>
                  <p className="mt-2 text-xs font-semibold text-[#1A1330] line-clamp-2 group-hover:text-[#FF5A1F]">{s.name}</p>
                  <p className="mt-1 text-[10px] font-bold text-[#FF5A1F]">Visit shop</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <JustForYou initial={feed} initialHasMore={feedHasMore} />
      </div>
    </div>
  );

  if (!standalone) return body;

  return (
    <CartProvider>
      <style precedence="pc-template" dangerouslySetInnerHTML={{ __html: MARKETPLACE_TOKENS_CSS }} />
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
