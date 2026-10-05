import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PageRenderer } from "@/components/site/page-renderer";
import type { Block } from "@/types/cms";
import type { Metadata } from "next";
import { AddToCartSection } from "./add-to-cart-section";
import { WishlistButton } from "./wishlist-button";
import { MarketplaceProduct, type MarketplaceProductRow } from "@/components/marketplace-ecom/product/marketplace-product";
import { getCurrencyConfig, formatWithConfig } from "@/lib/ecommerce/currency-server";
import Link from "next/link";
import { ProductCard } from "@/components/blocks/ecommerce/product-card";
import { PRODUCT_CARD_SELECT, toProductCardData } from "@/lib/ecommerce/product-card-data";
import { productHtml, PRODUCT_HTML_CSS } from "@/lib/ecommerce/product-html";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ review?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let q = supabase.from("products").select("name, short_description, images, seo").eq("slug", slug).eq("status", "active");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data } = await q.maybeSingle();

  if (!data) return { title: "Product Not Found" };

  // Product links are the ones customers actually paste into chat, so the
  // preview should be the product — its own name, blurb and first photo —
  // rather than inheriting the site-wide title and logo from the layout.
  const image = Array.isArray(data.images) ? (data.images as string[])[0] : undefined;
  const description =
    typeof data.short_description === "string" && data.short_description.trim().length > 0
      ? data.short_description.trim()
      : undefined;

  // Omitted rather than set to undefined — Next treats an explicit undefined
  // as a value and it would wipe the tenant defaults from (site)/layout.tsx.
  const seo = (data.seo ?? {}) as { title?: string | null; description?: string | null };
  const title = seo.title?.trim() || data.name;
  const metaDescription = seo.description?.trim() || description;
  const og: NonNullable<Metadata["openGraph"]> = { title };
  if (description) og.description = description;
  if (image) og.images = [{ url: image }];

  if (metaDescription) og.description = metaDescription;
  return {
    title,
    ...(metaDescription ? { description: metaDescription } : {}),
    openGraph: og,
    ...(image
      ? { twitter: { card: "summary_large_image" as const, title, ...(metaDescription ? { description: metaDescription } : {}), images: [image] } }
      : {}),
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const reqHeaders = await headers();
  const tenantId = reqHeaders.get("x-tenant-id");

  const supabase = await createClient();
  let q = supabase.from("products").select("*").eq("slug", slug).eq("status", "active");
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data: product } = await q.maybeSingle();

  if (!product) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let wishlisted = false;
  if (user) {
    // RLS (wishlist_items_own_select, migration 084) scopes this to the
    // signed-in customer's own rows regardless of the .eq below.
    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("tenant_id", tenantId)
      .eq("customer_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    wishlisted = !!existing;
  }

  // Marketplace listings get the full Shopee/Daraz-style page (seller card,
  // chat, reviews); single-store products keep the simple layout below.
  if (product.vendor_id) {
    const sp = (await searchParams) ?? {};
    return (
      <MarketplaceProduct
        product={product as MarketplaceProductRow}
        wishlisted={wishlisted}
        signedIn={!!user}
        openReview={sp.review === "1"}
      />
    );
  }

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const currencyCfg = await getCurrencyConfig(tenantId);
  const price = formatWithConfig(product.price, currencyCfg);
  const comparePrice = product.compare_price
    ? formatWithConfig(product.compare_price, currencyCfg)
    : null;

  // Google product rich results (price, availability, image).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(images.length ? { image: images.slice(0, 5) } : {}),
    ...(product.short_description || product.description ? { description: String(product.short_description || product.description).slice(0, 500) } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    offers: {
      "@type": "Offer",
      price: Number(product.price ?? 0),
      priceCurrency: currencyCfg.currency,
      availability: product.track_inventory && Number(product.stock_quantity) <= 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
    ...(Number(product.rating_count) > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(product.rating_avg), reviewCount: Number(product.rating_count) } } : {}),
  };

  // Variants (sizes etc.) and the bits of page chrome around the product.
  const [{ data: variantRows }, { data: catRows }] = await Promise.all([
    supabase.from("product_variants").select("id, name, price, compare_price, stock_quantity, image, sort_order, is_active")
      .eq("product_id", product.id).order("sort_order"),
    tenantId
      ? supabase.from("categories").select("id, name, slug").eq("tenant_id", tenantId).eq("type", "product")
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ]);
  const variants = (variantRows ?? []).filter((v) => v.is_active !== false).map((v) => ({
    id: v.id as string, name: (v.name as string) ?? "", price: Number(v.price), compare_price: v.compare_price === null ? null : Number(v.compare_price),
    inStock: !product.track_inventory || v.stock_quantity === null || Number(v.stock_quantity) > 0, image: (v.image as string | null) ?? null,
  }));
  const categoryIds: string[] = Array.isArray(product.category_ids) ? product.category_ids : [];
  const crumbCat = (catRows ?? []).find((c) => c.id === categoryIds[0]);

  let relQ = supabase.from("products").select(PRODUCT_CARD_SELECT).eq("status", "active").neq("id", product.id).is("vendor_id", null).limit(4);
  if (tenantId) relQ = relQ.eq("tenant_id", tenantId);
  if (categoryIds.length) relQ = relQ.or(categoryIds.map((id) => `category_ids.cs.["${id}"]`).join(","));
  const { data: relRows } = await relQ;
  const related = (relRows ?? []).map(toProductCardData);

  const { data: identity } = tenantId
    ? await supabase.from("site_identity").select("design_overrides").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  const design = (identity?.design_overrides ?? {}) as { productCardStyle?: string; featuredBadge?: string };
  const relStyle = (design.productCardStyle === "boutique" ? "boutique" : "default") as "default";

  // Shared section under every product (size guide, brand story, video...):
  // the tenant's page with slug "product-template", edited in the page
  // builder like any page. Kept as a draft so it is never served on its own URL.
  let templateBlocks: Block[] = [];
  if (tenantId) {
    const admin = await createAdminClient();
    const { data: tpl } = await admin.from("pages").select("blocks").eq("tenant_id", tenantId)
      .eq("slug", "product-template").is("deleted_at", null).maybeSingle();
    if (Array.isArray(tpl?.blocks)) templateBlocks = (tpl.blocks as Block[]).filter((b) => b.visible !== false);
  }

  const shortHtml = productHtml(product.short_description);
  const descHtml = productHtml(product.description);
  const inStock = !product.track_inventory || product.stock_quantity > 0;

  return (
    <div className="bg-background text-foreground">
      <style dangerouslySetInnerHTML={{ __html: PRODUCT_HTML_CSS }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <nav className="text-xs sm:text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          {crumbCat && (<><Link href={`/shop?category=${crumbCat.slug}`} className="hover:text-primary">{crumbCat.name}</Link><span className="mx-1.5">/</span></>)}
          <span className="text-foreground/80">{product.name}</span>
        </nav>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-3">
            {product.featured && design.featuredBadge && (
              <span className="inline-block text-sm px-3 py-1.5 rounded-full bg-muted text-muted-foreground">{design.featuredBadge}</span>
            )}
            {images.length > 0 ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[0]} alt={product.name} className="w-full aspect-square object-contain" />
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1).map((img: string, i: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={img} alt={`${product.name} ${i + 2}`} className="aspect-square object-cover rounded border" />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full aspect-square bg-muted rounded-xl border flex items-center justify-center text-muted-foreground text-sm">No image</div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-3xl sm:text-5xl leading-tight" style={{ fontFamily: "var(--heading-font, inherit)" }}>{product.name}</h1>
              <WishlistButton productId={product.id} initiallySaved={wishlisted} isSignedIn={!!user} />
            </div>

            {shortHtml && (shortHtml.isHtml
              ? <div className="pd-html text-[0.95rem] text-muted-foreground" dangerouslySetInnerHTML={{ __html: shortHtml.html }} />
              : <p className="text-muted-foreground whitespace-pre-line">{shortHtml.html}</p>)}

            <AddToCartSection
              product={{ id: product.id, name: product.name, slug: product.slug, price: Number(product.price), image: images[0] ?? null, inStock }}
              comparePrice={product.compare_price ? Number(product.compare_price) : null}
              priceLabel={price}
              comparePriceLabel={comparePrice}
              variants={variants}
            />

            {descHtml && (descHtml.isHtml && /pd-(box|acc|grid)/.test(descHtml.html) && !/pd-(split|wide)/.test(descHtml.html)
              ? <div className="pd-html text-[0.95rem]" dangerouslySetInnerHTML={{ __html: descHtml.html }} />
              : !descHtml.isHtml ? (
                <div>
                  <h2 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Description</h2>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{descHtml.html}</div>
                </div>
              ) : null)}

            {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
          </div>
        </div>

        {/* Long-form HTML description (images, video, story sections) runs full width under the fold */}
        {descHtml?.isHtml && !(/pd-(box|acc|grid)/.test(descHtml.html) && !/pd-(split|wide)/.test(descHtml.html)) && (
          <div className="pd-html mt-14 max-w-6xl mx-auto" dangerouslySetInnerHTML={{ __html: descHtml.html }} />
        )}

        {templateBlocks.length > 0 && (
          <div className="mt-10 -mx-4 sm:-mx-6 lg:-mx-8"><PageRenderer blocks={templateBlocks} /></div>
        )}

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl sm:text-3xl mb-8" style={{ fontFamily: "var(--heading-font, inherit)" }}>Related products</h2>
            <div className="grid gap-5 sm:gap-7 grid-cols-2 lg:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} showDescription={false} cardStyle={relStyle} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
