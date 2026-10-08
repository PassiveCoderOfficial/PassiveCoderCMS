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
import { resolveExtended, type ProductExtended } from "@/lib/ecommerce/product-extended";
import { ReviewForm } from "./review-form";
import { ProductGallery } from "./product-gallery";
import * as LucideIcons from "lucide-react";
import React from "react";

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
  const relStyle = (["boutique", "retail"].includes(design.productCardStyle ?? "") ? design.productCardStyle : "default") as "default";

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

  const attrs = (product.attributes ?? {}) as { highlights?: { label: string; value: string }[]; highlightsTitle?: string };
  const highlights = (attrs.highlights ?? []).filter((h) => h.label || h.value);
  const highlightsTitle = attrs.highlightsTitle ?? "";
  const shortHtml = productHtml(product.short_description);
  const descHtml = productHtml(product.description);
  // Optional sections: the product's own, else the store default.
  const { data: settingsRow } = tenantId
    ? await supabase.from("site_settings").select("product_defaults").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  const ext = resolveExtended((product.attributes as { extended?: ProductExtended } | null)?.extended, (settingsRow?.product_defaults ?? {}) as ProductExtended);
  const descText = ext.description?.text?.trim() || (descHtml && !descHtml.isHtml ? descHtml.html : "");
  const accordions = [
    ...(ext.description || descText ? [{ key: "d", title: ext.description?.title || "Description", body: <p className="whitespace-pre-line m-0">{descText}</p>, open: false }] : []),
    ...(ext.details ? [{ key: "n", title: ext.details.title || "Details", open: true, body: (
      <dl className="m-0 space-y-3">{(ext.details.rows ?? []).filter((r) => r.label || r.value).map((r, i) => (
        <div key={i}><dt className="font-semibold">{r.label}</dt><dd className="m-0 mt-1">{r.value}</dd></div>))}</dl>
    ) }] : []),
    ...(ext.video?.url ? [{ key: "v", title: ext.video.title || "Video", open: true, body: <ProductVideo url={ext.video.url} title={product.name} /> }] : []),
    ...(ext.shipping ? [{ key: "s", title: ext.shipping.title || "Shipping and Delivery", body: <p className="whitespace-pre-line m-0">{ext.shipping.text}</p>, open: false }] : []),
  ];
  // Reviews: the last accordion on single-store products. Approved ones only.
  const { data: reviewRows } = await supabase.from("product_reviews")
    .select("id, reviewer_name, rating, body, images, verified, created_at")
    .eq("product_id", product.id).eq("status", "published").is("vendor_id", null)
    .order("created_at", { ascending: false }).limit(20);
  const reviewsList = reviewRows ?? [];
  const avg = reviewsList.length ? reviewsList.reduce((n, r) => n + Number(r.rating), 0) / reviewsList.length : 0;
  accordions.push({ key: "r", title: reviewsList.length ? `Reviews (${reviewsList.length})` : "Reviews", open: false, body: (
    <div className="space-y-5">
      {reviewsList.length > 0 ? (
        <>
          <p className="m-0 flex items-center gap-2"><StarRow value={Math.round(avg)} /> <span className="text-sm text-muted-foreground">{avg.toFixed(1)} out of 5</span></p>
          <ul className="space-y-5 list-none p-0 m-0">
            {reviewsList.map((r) => (
              <li key={r.id} className="border-b pb-4">
                <div className="flex items-center gap-2 flex-wrap"><StarRow value={Number(r.rating)} /><span className="font-semibold text-sm">{r.reviewer_name}</span>{r.verified && <span className="text-[11px] text-green-700">Verified buyer</span>}</div>
                {r.body && <p className="mt-2 mb-0 text-[15px] whitespace-pre-line">{r.body}</p>}
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(r.images as string[]).map((u) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="" className="w-16 h-16 object-cover rounded border" loading="lazy" /></a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : <p className="m-0 text-sm text-muted-foreground">No reviews yet. Be the first to share yours.</p>}
      <ReviewForm productId={product.id} />
    </div>
  ) });
  const useAccordions = accordions.length > 0;
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
              <ProductGallery images={images} name={product.name} />
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

            {highlights.length > 0 && (
              <div>
                {highlightsTitle && <h3 className="text-xl mb-3" style={{ fontFamily: "var(--heading-font, inherit)" }}>{highlightsTitle}</h3>}
                <div className="pd-grid">
                  {highlights.map((h, i) => <div key={i}><h4>{h.label}</h4><p>{h.value}</p></div>)}
                </div>
              </div>
            )}

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

            {useAccordions && (
              <div className="border-t-2 border-foreground">
                {accordions.map((a) => (
                  <details key={a.key} open={a.open} className="group border-b-2 border-foreground">
                    <summary className="flex items-center justify-between py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden uppercase text-[15px] tracking-wide">
                      {a.title}
                      <span className="text-xl leading-none group-open:hidden">+</span><span className="text-xl leading-none hidden group-open:inline">−</span>
                    </summary>
                    <div className="pb-6 text-[15px] leading-relaxed">{a.body}</div>
                  </details>
                ))}
              </div>
            )}

            {ext.trust?.items?.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pt-2">
                {ext.trust.items.map((t, i) => {
                  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[t.icon] ?? LucideIcons.Check;
                  return (
                    <div key={i} className="flex flex-col items-center text-center gap-1.5">
                      <Icon className="w-8 h-8" strokeWidth={1.2} />
                      <span className="text-[11px] leading-tight">{t.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {!useAccordions && descHtml && (descHtml.isHtml && /pd-(box|acc|grid)/.test(descHtml.html) && !/pd-(split|wide)/.test(descHtml.html)
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

        {ext.story && (
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center mt-16">
            {ext.story.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ext.story.imageUrl} alt={ext.story.title || product.name} className="w-full rounded" loading="lazy" />
            )}
            <div>
              {ext.story.title && <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--heading-font, inherit)" }}>{ext.story.title}</h2>}
              {ext.story.text && <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{ext.story.text}</p>}
            </div>
          </div>
        )}

        {ext.banner?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ext.banner.imageUrl} alt={ext.banner.alt || ""} className="w-full mt-12 rounded" loading="lazy" />
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

/** Product video: an uploaded file plays inline; YouTube / Vimeo links embed. */
function ProductVideo({ url, title }: { url: string; title: string }) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  const embed = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vimeo ? `https://player.vimeo.com/video/${vimeo[1]}` : null;
  if (embed) {
    return <div className="aspect-video w-full"><iframe src={embed} title={title} className="w-full h-full rounded" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" /></div>;
  }
  return <video src={url} controls playsInline preload="metadata" className="w-full rounded bg-black" />;
}

function StarRow({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => <LucideIcons.Star key={n} className="w-4 h-4" style={{ color: "#D4A72C", fill: n <= value ? "#D4A72C" : "transparent" }} />)}
    </span>
  );
}
