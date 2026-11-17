import { z } from "zod";
import { comboKey, comboName, type OptionDisplay, type ProductOption } from "@/lib/ecommerce/variations";
import { saveVariationsWith, type VariationRow } from "@/lib/ecommerce/save-variations";
import { clearRedirectCache, isReservedPath, normPath } from "@/lib/redirects";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";

/**
 * Shop tools over MCP: products with options and variations (saved through
 * the same saveVariationsWith as the dashboard editor: write first, delete
 * last, blank stock = not tracked), product categories and site redirects.
 * Every query filters by ctx.tenantId. Fields added after the first release
 * also accept JSON sent as a string, because clients holding an older copy of
 * the schema send unknown fields that way.
 */

function fail(msg: string): never {
  throw new Error(msg);
}
function parseJsonString(v: unknown) {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}
const json = <T extends z.ZodTypeAny>(s: T) => z.preprocess(parseJsonString, s);
const looseBool = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean());
const blankToNull = (v: unknown) => (v === "" || v === "null" ? null : v);
const num = z.coerce.number().min(0);
const uuid = z.string().uuid();
const limit = z.coerce.number().int().min(1).max(100).default(25);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugSchema = z.string().max(120).regex(SLUG, "slug: lowercase letters, numbers and single hyphens only, like iphone-17-pro");
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "item";
const newId = () => crypto.randomUUID();

const optionValue = z.union([
  z.string().min(1).max(80),
  z.object({ label: z.string().min(1).max(80), color: z.string().max(40).optional(), image: z.string().url().optional() }),
]);
const optionSchema = z.object({
  name: z.string().min(1).max(40),
  display: z.enum(["buttons", "swatches", "dropdown"]).optional(),
  values: z.array(optionValue).min(1).max(100),
});
const variantSchema = z.object({
  id: uuid.optional(),
  attributes: json(z.record(z.string(), z.string())),
  price: num,
  compare_price: z.preprocess(blankToNull, num.nullable()).optional(),
  sku: z.string().max(80).optional(),
  /** Omit, null or "" = not tracked (always available). */
  stock: z.preprocess(blankToNull, z.coerce.number().int().min(0).nullable()).optional(),
  image: z.string().url().optional(),
  images: z.array(z.string().url()).max(20).optional(),
  is_active: looseBool.optional(),
  default: looseBool.optional(),
});

type OptionIn = z.infer<typeof optionSchema>;
type VariantIn = z.infer<typeof variantSchema>;

/** Option definitions as the editor stores them (ids kept for values that already exist). */
export function buildOptions(input: OptionIn[], prev: ProductOption[] = []): ProductOption[] {
  if (input.length > 3) fail("At most 3 options (e.g. Color, Storage).");
  const names = new Set<string>();
  return input.map((o) => {
    const key = o.name.trim().toLowerCase();
    if (names.has(key)) fail(`Option "${o.name}" is listed twice.`);
    names.add(key);
    const old = prev.find((p) => p.name.trim().toLowerCase() === key);
    const seen = new Set<string>();
    const values = o.values.map((v) => {
      const val = typeof v === "string" ? { label: v } : v;
      const label = val.label.trim();
      if (seen.has(label.toLowerCase())) fail(`Option "${o.name}" lists "${label}" twice.`);
      seen.add(label.toLowerCase());
      const oldV = old?.values.find((x) => x.label.toLowerCase() === label.toLowerCase());
      return { id: oldV?.id ?? newId(), label, ...(val.color ? { color: val.color } : {}), ...(val.image ? { image: val.image } : {}) };
    });
    return { id: old?.id ?? newId(), name: o.name.trim(), display: (o.display ?? old?.display ?? "buttons") as OptionDisplay, values };
  });
}

/** Variation rows for saveVariationsWith; existing rows are matched by id or by combination so their ids survive. */
export function buildRows(options: ProductOption[], input: VariantIn[], existing: { id: string; attributes: Record<string, string> | null }[]): { rows: VariationRow[]; defaultKey: string | null } {
  if (!options.length) fail("Variants need options: pass options [{ name: \"Color\", values: [...] }, ...].");
  const byKey = new Map(existing.map((e) => [comboKey(options, e.attributes ?? {}), e.id]));
  const ids = new Set(existing.map((e) => e.id));
  const seen = new Set<string>();
  let defaultKey: string | null = null;
  const rows = input.map((v, i) => {
    const attrs: Record<string, string> = {};
    for (const o of options) {
      const raw = Object.entries(v.attributes).find(([k]) => k.trim().toLowerCase() === o.name.toLowerCase())?.[1];
      const hit = raw === undefined ? undefined : o.values.find((x) => x.label.toLowerCase() === raw.trim().toLowerCase());
      if (!hit) fail(`Variant ${i + 1}: "${o.name}" must be one of ${o.values.map((x) => x.label).join(", ")}.`);
      attrs[o.name] = hit.label;
    }
    const extra = Object.keys(v.attributes).filter((k) => !options.some((o) => o.name.toLowerCase() === k.trim().toLowerCase()));
    if (extra.length) fail(`Variant ${i + 1}: unknown option ${extra.join(", ")}.`);
    const key = comboKey(options, attrs);
    if (seen.has(key)) fail(`Variant ${i + 1} (${comboName(options, attrs)}) is listed twice.`);
    seen.add(key);
    const id = v.id && ids.has(v.id) ? v.id : byKey.get(key) ?? "";
    const rowKey = id || newId();
    if (v.default) defaultKey = rowKey;
    const images = v.images ?? (v.image ? [v.image] : []);
    return {
      key: rowKey, id, isNew: !id, name: comboName(options, attrs), attributes: attrs,
      price: v.price, compare_price: v.compare_price ?? null, stock_quantity: v.stock ?? null,
      sku: v.sku?.trim() || null, barcode: null, weight: null, image: images[0] ?? null, images,
      is_active: v.is_active !== false, sort_order: i,
    } satisfies VariationRow;
  });
  return { rows, defaultKey: defaultKey ?? rows[0]?.key ?? null };
}

async function slugTaken(ctx: McpCtx, table: "products" | "categories", slug: string, exceptId?: string) {
  let q = ctx.supabase.from(table).select("id").eq("tenant_id", ctx.tenantId).eq("slug", slug);
  if (table === "categories") q = q.eq("type", "product");
  const { data } = await q.limit(2);
  return ((data ?? []) as { id: string }[]).some((r) => r.id !== exceptId);
}
async function freeSlug(ctx: McpCtx, table: "products" | "categories", base: string) {
  for (let n = 1; n <= 50; n++) {
    const s = n === 1 ? base : `${base}-${n}`;
    if (!(await slugTaken(ctx, table, s))) return s;
  }
  fail("Couldn't find a free slug; pass one.");
}

async function checkCategories(ctx: McpCtx, ids: string[]) {
  if (!ids.length) return;
  const { data } = await ctx.supabase.from("categories").select("id").eq("tenant_id", ctx.tenantId).eq("type", "product").in("id", ids);
  const found = new Set(((data ?? []) as { id: string }[]).map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) fail(`Category not found on this site: ${missing.join(", ")}. Use list_categories.`);
}

const productSchema = z.object({
  id: uuid.optional(),
  name: z.string().min(1).max(200).optional(),
  slug: slugSchema.optional(),
  type: z.enum(["simple", "variable"]).optional(),
  description: z.string().max(20000).optional(),
  short_description: z.string().max(500).optional(),
  price: num.optional(),
  compare_price: z.preprocess(blankToNull, num.nullable()).optional(),
  sku: z.string().max(80).optional(),
  stock_quantity: z.coerce.number().int().optional(),
  track_inventory: looseBool.optional(),
  featured: looseBool.optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  images: json(z.array(z.string().url())).optional(),
  seo: json(z.object({ title: z.string().max(200).nullable().optional(), description: z.string().max(500).nullable().optional() })).optional(),
  category_ids: json(z.array(uuid).max(20)).optional(),
  options: json(z.array(optionSchema).max(3)).optional(),
  variants: json(z.array(variantSchema).max(300)).optional(),
  translations: json(z.record(z.string().regex(/^[a-z]{2}(-[a-z]{2})?$/i), z.object({
    name: z.string().max(200).optional(),
    short_description: z.string().max(1000).optional(),
    description: z.string().max(20000).optional(),
    seo_title: z.string().max(200).optional(),
    seo_description: z.string().max(500).optional(),
  }).nullable())).optional(),
});
type ProductArgs = z.infer<typeof productSchema>;

async function upsertProduct(a: ProductArgs, ctx: McpCtx) {
  const { id, translations, options, variants, seo, slug, type, ...rest } = a;
  const fields: Record<string, unknown> = { ...rest };
  const { data: cur } = id
    ? await ctx.supabase.from("products").select("id, attributes, translations, seo, type").eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle()
    : { data: null };
  if (id && !cur) fail("Product not found on this site");
  const curRow = (cur ?? {}) as { attributes?: Record<string, unknown> | null; translations?: Record<string, unknown> | null; seo?: Record<string, unknown> | null };

  if (translations) {
    if (!id) fail("Create the product first, then add translations with its id.");
    const next = { ...(curRow.translations ?? {}) };
    for (const [lang, t] of Object.entries(translations)) {
      const code = lang.toLowerCase().split("-")[0];
      const clean = t ? Object.fromEntries(Object.entries(t).map(([k, v]) => [k, String(v ?? "").trim()]).filter(([, v]) => v)) : null;
      if (clean && Object.keys(clean).length) next[code] = clean; else delete next[code];
    }
    fields.translations = next;
  }
  if (seo) fields.seo = { ...(curRow.seo ?? {}), ...Object.fromEntries(Object.entries(seo).map(([k, v]) => [k, v?.trim() || null])) };
  if (a.category_ids) await checkCategories(ctx, a.category_ids);
  if (slug) {
    if (await slugTaken(ctx, "products", slug, id)) fail(`Another product on this site already uses the slug "${slug}".`);
    fields.slug = slug;
  }
  if (options && !variants) fail("Pass variants together with options (one row per combination).");
  if (type === "variable" && !variants && !id) fail("A variable product needs options and variants.");
  if (type && !variants) fields.type = type;
  if (variants && type === "simple" && variants.length) fail("type simple can't have variants; pass variants: [] to remove them.");

  let productId = id;
  if (id) {
    const { error } = await ctx.supabase.from("products").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id).eq("tenant_id", ctx.tenantId);
    if (error) fail(error.code === "23505" ? "That slug is already used." : error.message);
  } else {
    if (!fields.name) fail("name is required to create a product");
    if (!fields.slug) fields.slug = await freeSlug(ctx, "products", slugify(String(fields.name)));
    const { data, error } = await ctx.supabase.from("products")
      .insert({ status: "draft", type: "simple", price: 0, ...fields, tenant_id: ctx.tenantId }).select("id").single();
    if (error) fail(error.code === "23505" ? "That slug is already used." : error.message);
    productId = (data as { id: string }).id;
  }

  let variantCount: number | undefined;
  if (variants) {
    const prevOpts = ((curRow.attributes?.options as ProductOption[] | undefined) ?? []);
    const opts = variants.length ? (options ? buildOptions(options, prevOpts) : prevOpts) : [];
    const { data: existing, error: exErr } = await ctx.supabase.from("product_variants").select("id, attributes").eq("product_id", productId!);
    if (exErr) fail(exErr.message);
    const built = variants.length ? buildRows(opts, variants, (existing ?? []) as { id: string; attributes: Record<string, string> | null }[]) : { rows: [], defaultKey: null };
    const { minPrice, defaultVariantId } = await saveVariationsWith(ctx.supabase, productId!, { options: opts, rows: built.rows, defaultKey: built.defaultKey });
    const attributes = { ...(curRow.attributes ?? {}), options: built.rows.length ? opts : [], defaultVariantId };
    const { error } = await ctx.supabase.from("products").update({
      ...(minPrice !== null ? { price: minPrice } : {}), attributes, type: built.rows.length ? "variable" : "simple", updated_at: new Date().toISOString(),
    }).eq("id", productId!).eq("tenant_id", ctx.tenantId);
    if (error) fail(error.message);
    variantCount = built.rows.length;
  }

  const { data: out } = await ctx.supabase.from("products").select("id, name, slug, status, type, price, compare_price, stock_quantity, featured, category_ids")
    .eq("id", productId!).eq("tenant_id", ctx.tenantId).maybeSingle();
  return { ...(out as object), ...(variantCount !== undefined ? { variants: variantCount } : {}) };
}

export const SHOP_TOOLS: McpTool[] = [
  {
    name: "upsert_product",
    title: "Create or update product",
    description: "Create a product (omit id; created as draft unless status given) or update fields of an existing one. Prices are in the site's currency units (e.g. 49.99). slug: lowercase-hyphen, unique on the site (omit on create to derive from name). featured, seo {title, description}, category_ids (from list_categories). Variations, like the dashboard editor: options [{name:\"Color\", display:\"swatches\"|\"buttons\"|\"dropdown\", values:[\"Black\" or {label, color:\"#hex\", image}]}] (max 3) plus variants [{attributes:{Color:\"Black\", Storage:\"256GB\"}, price, compare_price, sku, stock (omit = not tracked), image, images, default:true}], one per combination; this sets type variable and the product price to the cheapest variant. Passing variants replaces the list (rows matched by combination keep their ids); variants: [] makes it simple again. translations: { <lang>: { name?, short_description?, description?, seo_title?, seo_description? } } sets that language's text; other languages are kept, null removes one.",
    schema: productSchema,
    write: true,
    run: (a: ProductArgs, ctx) => upsertProduct(a, ctx),
  },
  {
    name: "get_product_variants",
    title: "Get product variants",
    description: "A product's options and variation rows (id, attributes, price, compare_price, sku, stock, images, active), and its default variant.",
    schema: z.object({ id: uuid }),
    write: false,
    run: async ({ id }: { id: string }, ctx) => {
      const { data: p } = await ctx.supabase.from("products").select("id, name, slug, type, attributes, category_ids").eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (!p) fail("Product not found on this site");
      const { data: v } = await ctx.supabase.from("product_variants").select("id, name, attributes, price, compare_price, stock_quantity, sku, image, images, is_active, sort_order").eq("product_id", id).order("sort_order");
      const attrs = ((p as { attributes?: Record<string, unknown> }).attributes ?? {});
      return { id, name: (p as { name: string }).name, slug: (p as { slug: string }).slug, type: (p as { type: string }).type, options: attrs.options ?? [], defaultVariantId: attrs.defaultVariantId ?? null, variants: v ?? [] };
    },
  },
  {
    name: "list_categories",
    title: "List product categories",
    description: "List the site's product categories (id, name, slug, parent_id, image_url, order_index). Use the ids in upsert_product category_ids.",
    schema: z.object({ search: z.string().optional(), limit: limit.default(100) }),
    write: false,
    run: async ({ search, limit: n }: { search?: string; limit: number }, ctx) => {
      let q = ctx.supabase.from("categories").select("id, name, slug, description, parent_id, image_url, order_index")
        .eq("tenant_id", ctx.tenantId).eq("type", "product").order("order_index").limit(n);
      if (search) q = q.ilike("name", `%${search.replace(/[%,()]/g, "")}%`);
      return (await q).data ?? [];
    },
  },
  {
    name: "upsert_category",
    title: "Create or update product category",
    description: "Create a product category (omit id; slug derived from name if omitted) or update one. parent_id makes it a subcategory.",
    schema: z.object({
      id: uuid.optional(),
      name: z.string().min(1).max(120).optional(),
      slug: slugSchema.optional(),
      description: z.string().max(2000).optional(),
      parent_id: z.preprocess(blankToNull, uuid.nullable()).optional(),
      image_url: z.preprocess(blankToNull, z.string().url().nullable()).optional(),
      order_index: z.coerce.number().int().optional(),
    }),
    write: true,
    run: async ({ id, ...f }: { id?: string; name?: string; slug?: string; parent_id?: string | null } & Record<string, unknown>, ctx) => {
      if (f.parent_id) {
        if (f.parent_id === id) fail("A category can't be its own parent.");
        const { data } = await ctx.supabase.from("categories").select("id").eq("id", f.parent_id).eq("tenant_id", ctx.tenantId).eq("type", "product").maybeSingle();
        if (!data) fail("Parent category not found on this site");
      }
      if (f.slug && (await slugTaken(ctx, "categories", f.slug, id))) fail(`Another category already uses the slug "${f.slug}".`);
      if (id) {
        const { data, error } = await ctx.supabase.from("categories").update(f).eq("id", id).eq("tenant_id", ctx.tenantId).eq("type", "product").select("id, name, slug, parent_id").maybeSingle();
        if (error) fail(error.code === "23505" ? "That slug is already used." : error.message);
        return data ?? fail("Category not found on this site");
      }
      if (!f.name) fail("name is required to create a category");
      const slug = f.slug ?? (await freeSlug(ctx, "categories", slugify(f.name)));
      const { data, error } = await ctx.supabase.from("categories").insert({ ...f, slug, type: "product", tenant_id: ctx.tenantId }).select("id, name, slug, parent_id").single();
      if (error) fail(error.code === "23505" ? `The slug "${slug}" is already used; pass another slug.` : error.message);
      return data;
    },
  },
  {
    name: "list_redirects",
    title: "List redirects",
    description: "List the site's redirects (Settings > Redirects): from_path, destination (to_url or page), status code, hits.",
    schema: z.object({ limit: limit.default(100) }),
    write: false,
    run: async ({ limit: n }: { limit: number }, ctx) => {
      const { data } = await ctx.supabase.from("page_redirects").select("id, from_path, to_path, to_url, status_code, page_id, hits, note")
        .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(n);
      return data ?? [];
    },
  },
  {
    name: "upsert_redirect",
    title: "Create or update redirect",
    description: "Redirect an old address on this site to a new one, same as Settings > Redirects. from_path like \"products/old-slug\"; to_url like \"/products/new-slug\" or a full URL. 301 (permanent, default) or 302. An existing rule for the same from_path is replaced.",
    schema: z.object({
      from_path: z.string().min(1).max(300),
      to_url: z.string().min(1).max(1000),
      status_code: z.coerce.number().int().refine((n) => n === 301 || n === 302, "301 or 302").optional(),
      note: z.string().max(300).optional(),
    }),
    write: true,
    run: async (b: { from_path: string; to_url: string; status_code?: number; note?: string }, ctx) => {
      const from = normPath(b.from_path);
      if (!from || !/^[a-z0-9ঀ-৿؀-ۿ._~\-/]+$/i.test(from)) fail("Use letters, numbers, - and / only in from_path.");
      if (isReservedPath(from)) fail(`/${from} is used by the system and can't be redirected.`);
      let to = b.to_url.trim();
      if (!/^https?:\/\//i.test(to) && !to.startsWith("/")) to = `https://${to}`;
      try { new URL(to, "https://x.test"); } catch { fail("That destination URL isn't valid."); }
      if (to.startsWith("/") && normPath(to) === from) fail("A redirect can't point to itself.");
      // page_redirects.to_path is NOT NULL in production (migration 119; 137 never
      // relaxed it), so URL targets also fill to_path: the internal path for "/x",
      // "" for external URLs. The proxy prefers to_url either way.
      const toPath = to.startsWith("/") ? (normPath(to) || "home") : "";
      const row = { tenant_id: ctx.tenantId, from_path: from, to_path: toPath, to_url: to, page_id: null, status_code: b.status_code === 302 ? 302 : 301, note: b.note?.trim() || null };
      const { data: ex } = await ctx.supabase.from("page_redirects").select("id").eq("tenant_id", ctx.tenantId).eq("from_path", from).maybeSingle();
      const { data, error } = ex
        ? await ctx.supabase.from("page_redirects").update(row).eq("id", (ex as { id: string }).id).eq("tenant_id", ctx.tenantId).select("id, from_path, to_url, status_code").maybeSingle()
        : await ctx.supabase.from("page_redirects").insert(row).select("id, from_path, to_url, status_code").single();
      if (error) fail(error.message);
      clearRedirectCache(ctx.tenantId);
      return data;
    },
  },
];
