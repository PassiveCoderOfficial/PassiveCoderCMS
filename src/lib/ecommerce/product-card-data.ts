/**
 * One select + normaliser for every storefront list that renders product
 * cards (products block, single-store /shop). Variable products (sizes etc.)
 * carry their active variants so the card can show a price range and send the
 * shopper to the product page to pick an option, instead of adding the base
 * price to the cart.
 */
export const PRODUCT_CARD_SELECT =
  "id, name, slug, price, compare_price, images, short_description, track_inventory, stock_quantity, dietary_info, type, featured, noPrice:attributes->noPrice, translations, product_variants(id, name, attributes, price, compare_price, stock_quantity, is_active, sort_order)";

type VariantRow = { id?: string; name: string | null; attributes?: Record<string, string> | null; price: number | string | null; compare_price: number | string | null; stock_quantity?: number | null; is_active: boolean | null; sort_order: number | null };

export type CardVariant = { id: string; name: string; price: number; compare_price: number | null; inStock: boolean };

export interface VariantSummary {
  count: number;
  min: number;
  max: number;
  labels: string[];
  /** One option type -> sizes can be picked right on the card. */
  quickPick: boolean;
  list: CardVariant[];
}

export function summariseVariants(rows: VariantRow[] | null | undefined): VariantSummary | null {
  const active = (rows ?? []).filter((v) => v.is_active !== false && v.price !== null);
  if (!active.length) return null;
  const sorted = [...active].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const prices = sorted.map((v) => Number(v.price));
  return {
    count: sorted.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    labels: sorted.map((v) => v.name ?? "").filter(Boolean),
    quickPick: sorted.every((v) => Object.keys(v.attributes ?? {}).length <= 1) && sorted.every((v) => !!v.id),
    list: sorted.map((v) => ({ id: v.id ?? "", name: v.name ?? "", price: Number(v.price), compare_price: v.compare_price === null ? null : Number(v.compare_price), inStock: v.stock_quantity === null || v.stock_quantity === undefined || Number(v.stock_quantity) > 0 })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProductCardData(p: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { product_variants, translations, ...rest } = p;
  const variants = p.type === "variable" ? summariseVariants(product_variants) : null;
  return {
    ...rest,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    // With variations, availability is theirs (any one in stock), not the product-level count.
    inStock: variants ? variants.list.some((v) => v.inStock) : !p.track_inventory || p.stock_quantity > 0,
    variants,
  };
}

/**
 * Sold-out products last, keeping the chosen order otherwise (Array.sort is
 * stable): shoppers see what they can buy first.
 */
export function inStockFirst<T extends { inStock?: boolean }>(list: T[]): T[] {
  return [...list].sort((a, b) => Number(a.inStock === false) - Number(b.inStock === false));
}

/**
 * Card normaliser for a language version of the site (/ar pages, /ar/shop):
 * a product with that translation shows its translated name and links to
 * /<lang>/products/<slug>; one without keeps the main-language card.
 */
export function cardMapper(lang: string | null | undefined) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (p: any) => {
    const card = toProductCardData(p);
    const tx = lang ? (p.translations as Record<string, { name?: string; short_description?: string }> | null)?.[lang] : null;
    if (!lang || !tx) return card;
    return { ...card, name: tx.name?.trim() || card.name, short_description: tx.short_description?.trim() || card.short_description, href: `/${lang}/products/${card.slug}` };
  };
}

/** Sample product a template shows in previews (block data `previewProducts`). */
export type PreviewProduct = { name: string; price: number; compare_price?: number | null; image?: string | null };

/**
 * Cards for a page rendered with no site (template previews). Never real
 * stores' products: a preview used to query every site's catalogue. Uses the
 * template's own samples, else neutral placeholders.
 */
export function previewProductCards(samples: PreviewProduct[] | undefined, count: number) {
  const list: PreviewProduct[] = samples?.length
    ? samples
    : Array.from({ length: count }, (_, i) => ({ name: `Product name ${i + 1}`, price: 49 + i * 10, image: null }));
  return list.slice(0, Math.max(count, 1)).map((p, i) => ({
    id: `preview-${i}`, name: p.name, slug: "", price: p.price, compare_price: p.compare_price ?? null,
    images: p.image ? [p.image] : [], short_description: null, track_inventory: false, stock_quantity: null,
    dietary_info: null, type: "simple", featured: false, inStock: true, variants: null,
  }));
}
