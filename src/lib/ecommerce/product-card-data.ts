/**
 * One select + normaliser for every storefront list that renders product
 * cards (products block, single-store /shop). Variable products (sizes etc.)
 * carry their active variants so the card can show a price range and send the
 * shopper to the product page to pick an option, instead of adding the base
 * price to the cart.
 */
export const PRODUCT_CARD_SELECT =
  "id, name, slug, price, compare_price, images, short_description, track_inventory, stock_quantity, dietary_info, type, product_variants(name, price, compare_price, is_active, sort_order)";

type VariantRow = { name: string | null; price: number | string | null; compare_price: number | string | null; is_active: boolean | null; sort_order: number | null };

export interface VariantSummary {
  count: number;
  min: number;
  max: number;
  labels: string[];
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
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProductCardData(p: any) {
  const { product_variants, ...rest } = p;
  return {
    ...rest,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    inStock: !p.track_inventory || p.stock_quantity > 0,
    variants: p.type === "variable" ? summariseVariants(product_variants) : null,
  };
}
