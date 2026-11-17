import type { SupabaseClient } from "@supabase/supabase-js";
import {
  UNLIMITED_STOCK_FALLBACK, comboName, isStockNotNullError, stockOrFallback,
  type ProductOption, type VariantRecord,
} from "@/lib/ecommerce/variations";

/**
 * Shared by the dashboard variations editor and the MCP upsert_product tool,
 * so both write product_variants the same way. Takes the Supabase client to
 * use (browser client in the dashboard, admin client over MCP).
 */
export type VariationRow = VariantRecord & { key: string; isNew?: boolean };
export type VariationsState = { options: ProductOption[]; rows: VariationRow[]; defaultKey: string | null };

/**
 * Save variations without throwing away row ids (carts, alerts and orders point
 * at them): update kept rows, insert new ones, then delete removed ones. Writes
 * go first and deletes last, so a failed save never leaves the product with
 * fewer variations than before. Returns the cheapest active price and the
 * default variant id.
 */
export async function saveVariationsWith(sb: SupabaseClient, productId: string, s: VariationsState): Promise<{ minPrice: number | null; defaultVariantId: string | null }> {
  const valid = s.rows.filter((r) => comboName(s.options, r.attributes) && !Number.isNaN(Number(r.price)));
  const { data: existing, error: exErr } = await sb.from("product_variants").select("id").eq("product_id", productId);
  if (exErr) throw exErr;
  const existingIds = new Set((existing ?? []).map((e) => e.id as string));
  const keep = new Set<string>();
  // Older databases still have stock_quantity NOT NULL (migration 166 lifts it):
  // there a blank stock is stored as a big number instead of failing the save.
  let stockNullable = true;
  const write = async (row: Record<string, unknown>, id: string | null) => {
    const run = (r: Record<string, unknown>) => id
      ? sb.from("product_variants").update(r).eq("id", id).select("id").single()
      : sb.from("product_variants").insert(r).select("id").single();
    let res = await run(stockNullable ? row : { ...row, stock_quantity: stockOrFallback(row.stock_quantity as number | null) });
    if (res.error && stockNullable && row.stock_quantity === null && isStockNotNullError(res.error)) {
      stockNullable = false;
      res = await run({ ...row, stock_quantity: UNLIMITED_STOCK_FALLBACK });
    }
    if (res.error) throw res.error;
    return res.data.id as string;
  };
  let defaultVariantId: string | null = null;
  for (let i = 0; i < valid.length; i++) {
    const r = valid[i];
    const stock = r.stock_quantity === null || r.stock_quantity === undefined || String(r.stock_quantity).trim() === "" || Number.isNaN(Number(r.stock_quantity))
      ? null : Math.max(0, Math.floor(Number(r.stock_quantity)));
    const row = {
      product_id: productId, name: comboName(s.options, r.attributes), attributes: r.attributes,
      price: Number(r.price), compare_price: r.compare_price === null || r.compare_price === undefined || String(r.compare_price).trim() === "" || Number.isNaN(Number(r.compare_price)) ? null : Number(r.compare_price),
      stock_quantity: stock,
      sku: r.sku || null, barcode: r.barcode || null, weight: r.weight === null || r.weight === undefined || String(r.weight).trim() === "" || Number.isNaN(Number(r.weight)) ? null : Number(r.weight),
      image: r.images[0] ?? r.image ?? null, images: r.images, is_active: r.is_active !== false, sort_order: i,
    };
    // A row whose id is gone (deleted elsewhere) is re-created instead of silently updating nothing.
    const id = await write(row, !r.isNew && r.id && existingIds.has(r.id) ? r.id : null);
    keep.add(id);
    if (r.key === s.defaultKey) defaultVariantId = id;
  }
  const remove = [...existingIds].filter((id) => !keep.has(id));
  if (remove.length) { const { error } = await sb.from("product_variants").delete().in("id", remove); if (error) throw error; }
  const prices = valid.filter((r) => r.is_active !== false).map((r) => Number(r.price));
  return { minPrice: prices.length ? Math.min(...prices) : null, defaultVariantId };
}
