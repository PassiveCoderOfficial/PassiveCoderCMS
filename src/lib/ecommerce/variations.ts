/**
 * Product variations (v2). A product defines up to three option types in
 * products.attributes.options (Size, Colour, Pack...). Each sellable
 * combination is a product_variants row whose `attributes` maps option name
 * -> value and whose `name` is the values joined with " / ".
 *
 * Products made before v2 have variant rows but no option definition; they
 * are read as one option ("Size") whose values are the row names.
 */

export type OptionDisplay = "buttons" | "swatches" | "dropdown";

export type OptionValue = {
  id: string;
  label: string;
  /** Swatch colour (hex) or image for "swatches" display. */
  color?: string;
  image?: string;
  /** Price rule: added to the base price when generating prices. */
  priceDelta?: number;
};

export type ProductOption = { id: string; name: string; display: OptionDisplay; values: OptionValue[] };

export type VariantRecord = {
  id: string;
  name: string;
  attributes: Record<string, string>;
  price: number;
  compare_price: number | null;
  /** null = not tracked (always available). */
  stock_quantity: number | null;
  sku: string | null;
  barcode: string | null;
  weight: number | null;
  image: string | null;
  images: string[];
  is_active: boolean;
  sort_order: number;
};

export const MAX_OPTIONS = 3;

const slugId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "x";

/** Option definitions for a product: stored ones, else derived from legacy rows. */
export function resolveOptions(stored: ProductOption[] | undefined | null, variants: Pick<VariantRecord, "name" | "attributes">[]): ProductOption[] {
  if (stored?.length) return stored;
  if (!variants.length) return [];
  const name = "Size";
  const seen = new Set<string>();
  const values: OptionValue[] = [];
  for (const v of variants) {
    const label = v.name?.trim();
    if (label && !seen.has(label)) { seen.add(label); values.push({ id: slugId(label), label }); }
  }
  return [{ id: "size", name, display: "buttons", values }];
}

/** Attribute map of a variant, filling legacy rows (name only) for the single derived option. */
export function variantAttrs(v: Pick<VariantRecord, "name" | "attributes">, options: ProductOption[]): Record<string, string> {
  const a = v.attributes ?? {};
  if (options.every((o) => typeof a[o.name] === "string")) return a;
  if (options.length === 1) return { [options[0].name]: v.name };
  return a;
}

/** Every combination of the option values (cartesian product), in option order. */
export function combinations(options: ProductOption[]): Record<string, string>[] {
  const opts = options.filter((o) => o.values.length);
  if (!opts.length) return [];
  let acc: Record<string, string>[] = [{}];
  for (const o of opts) {
    const next: Record<string, string>[] = [];
    for (const partial of acc) for (const val of o.values) next.push({ ...partial, [o.name]: val.label });
    acc = next;
  }
  return acc;
}

export const comboName = (options: ProductOption[], attrs: Record<string, string>) =>
  options.map((o) => attrs[o.name]).filter(Boolean).join(" / ");

export const comboKey = (options: ProductOption[], attrs: Record<string, string>) =>
  options.map((o) => `${o.name}=${attrs[o.name] ?? ""}`).join("|");

/** Price from the base price plus each chosen value's price rule. */
export function rulePrice(base: number, options: ProductOption[], attrs: Record<string, string>): number {
  let p = base;
  for (const o of options) p += o.values.find((v) => v.label === attrs[o.name])?.priceDelta ?? 0;
  return Math.max(0, Math.round(p * 100) / 100);
}

/**
 * "Always available" stand-in for databases where product_variants.stock_quantity
 * is still NOT NULL (migration 166 not applied yet). A blank stock box is saved
 * as this number there, and anything at or above UNLIMITED_STOCK_FLOOR reads
 * back as blank (unlimited) in the editor. With migration 166 a blank is saved
 * as a real null and this is never used.
 */
export const UNLIMITED_STOCK_FALLBACK = 1_000_000;
export const UNLIMITED_STOCK_FLOOR = 900_000;

/** Postgres not_null_violation on product_variants.stock_quantity. */
export const isStockNotNullError = (e: { code?: string; message?: string } | null | undefined) =>
  !!e && (e.code === "23502" || /null value/i.test(e.message ?? "")) && /stock_quantity/.test(e.message ?? "");

/** Write-side helper: a blank (null) stock becomes the fallback number. */
export const stockOrFallback = (s: number | null) => (s === null ? UNLIMITED_STOCK_FALLBACK : s);

/** Read-side helper: the fallback number (and above) reads as blank / unlimited. */
export const stockForEditor = (s: number | string | null | undefined): number | null =>
  s === null || s === undefined || s === "" ? null : Number(s) >= UNLIMITED_STOCK_FLOOR ? null : Number(s);

export const variantInStock = (v: Pick<VariantRecord, "stock_quantity" | "is_active">) =>
  v.is_active !== false && (v.stock_quantity === null || v.stock_quantity === undefined || Number(v.stock_quantity) > 0);

/** CSV of the variations (one row per combination) for spreadsheet editing. */
export function variantsToCsv(options: ProductOption[], rows: VariantRecord[]): string {
  const head = [...options.map((o) => o.name), "price", "compare_price", "stock", "sku", "barcode", "weight", "active"];
  const esc = (s: unknown) => { const t = s === null || s === undefined ? "" : String(s); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const lines = rows.map((r) => [...options.map((o) => r.attributes[o.name] ?? ""), r.price, r.compare_price ?? "", r.stock_quantity ?? "", r.sku ?? "", r.barcode ?? "", r.weight ?? "", r.is_active ? "yes" : "no"].map(esc).join(","));
  return [head.join(","), ...lines].join("\n");
}

/** Parses that CSV back into partial rows keyed by combination. Unknown columns are ignored. */
export function csvToVariantPatches(options: ProductOption[], csv: string): Map<string, Partial<VariantRecord>> {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", q = false;
  for (let i = 0; i < csv.length; i++) {
    const c = csv[i];
    if (q) { if (c === '"' && csv[i + 1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; continue; }
    if (c === '"') q = true; else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && csv[i + 1] === "\n") i++; cur.push(field); rows.push(cur); cur = []; field = ""; }
    else field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return new Map();
  const idx = (n: string) => head.findIndex((h) => h.trim().toLowerCase() === n.toLowerCase());
  const num = (s: string | undefined) => (s === undefined || s.trim() === "" ? null : Number(s));
  const out = new Map<string, Partial<VariantRecord>>();
  for (const r of body) {
    const attrs: Record<string, string> = {};
    for (const o of options) { const k = idx(o.name); if (k >= 0) attrs[o.name] = (r[k] ?? "").trim(); }
    const patch: Partial<VariantRecord> = {};
    const g = (n: string) => { const k = idx(n); return k >= 0 ? r[k] : undefined; };
    if (g("price") !== undefined && g("price")!.trim() !== "") patch.price = Number(g("price"));
    if (g("compare_price") !== undefined) patch.compare_price = num(g("compare_price"));
    if (g("stock") !== undefined) patch.stock_quantity = num(g("stock"));
    if (g("sku") !== undefined) patch.sku = g("sku")!.trim() || null;
    if (g("barcode") !== undefined) patch.barcode = g("barcode")!.trim() || null;
    if (g("weight") !== undefined) patch.weight = num(g("weight"));
    if (g("active") !== undefined) patch.is_active = !/^(no|false|0)$/i.test(g("active")!.trim());
    out.set(comboKey(options, attrs), patch);
  }
  return out;
}
