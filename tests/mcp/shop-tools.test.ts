/**
 * MCP shop tools: upsert_product with slug / featured / seo / categories and
 * options + variants saved like the dashboard editor, list/upsert_category,
 * upsert_redirect. Run: npm run test:mcp
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeDb } from "./fake-supabase";
import { SHOP_TOOLS } from "../../src/lib/mcp/shop-tools";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const CAT = "cccccccc-0000-4000-8000-000000000003";
const CAT_B = "cccccccc-0000-4000-8000-000000000004";
const tool = (n: string) => SHOP_TOOLS.find((t) => t.name === n)!;
const seed = () => new FakeDb({
  products: [{ id: "dddddddd-0000-4000-8000-000000000005", tenant_id: B, slug: "iphone-17", name: "Other site" }],
  product_variants: [],
  categories: [{ id: CAT, tenant_id: A, type: "product", name: "Apple", slug: "apple" }, { id: CAT_B, tenant_id: B, type: "product", name: "Apple", slug: "apple-b" }],
  page_redirects: [],
});
async function call(db: FakeDb, name: string, args: unknown) {
  const t = tool(name);
  return t.run(t.schema.parse(args) as never, { tenantId: A, userId: "u", supabase: db as unknown as SupabaseClient }) as Promise<Record<string, unknown>>;
}
const variants = [
  { attributes: { Color: "Black", Storage: "256GB" }, price: 4599, compare_price: 4699, sku: "IP-B-256", stock: 3, image: "https://x.test/b.webp" },
  { attributes: { Color: "Black", Storage: "512GB" }, price: 5499, sku: "IP-B-512", stock: 3, image: "https://x.test/b.webp" },
  { attributes: { color: "white", Storage: "256GB" }, price: 4599, sku: "IP-W-256", stock: "", image: "https://x.test/w.webp", default: true },
];
const options = [{ name: "Color", display: "swatches", values: [{ label: "Black", color: "#000" }, "White"] }, { name: "Storage", values: ["256GB", "512GB"] }];

test("creates a variable product with slug, featured, seo, categories and variants", async () => {
  const db = seed();
  const p = await call(db, "upsert_product", { name: "iPhone 17", slug: "iphone-17", featured: "true", status: "active", seo: { title: "T", description: "D" }, category_ids: [CAT], options, variants });
  assert.equal(p.slug, "iphone-17"); // same slug on another site is fine
  assert.equal(p.type, "variable");
  assert.equal(p.price, 4599);
  assert.equal(p.featured, true);
  assert.equal(p.variants, 3);
  const rows = db.rows("product_variants");
  assert.equal(rows.length, 3);
  assert.equal(rows[2].name, "White / 256GB");
  assert.equal(rows[2].stock_quantity, null); // blank stock = not tracked
  assert.deepEqual(rows[0].images, ["https://x.test/b.webp"]);
  const prod = db.rows("products").find((r) => r.id === p.id)!;
  const attrs = prod.attributes as { options: { name: string; display: string }[]; defaultVariantId: string };
  assert.equal(attrs.options[0].display, "swatches");
  assert.equal(attrs.defaultVariantId, rows[2].id);
});

test("accepts string-encoded JSON from clients with an old schema", async () => {
  const db = seed();
  const p = await call(db, "upsert_product", { name: "X", options: JSON.stringify(options), variants: JSON.stringify(variants), category_ids: JSON.stringify([CAT]), seo: '{"title":"S"}' });
  assert.equal(p.variants, 3);
});

test("re-saving keeps variant ids, removes dropped rows last, and variants: [] makes it simple", async () => {
  const db = seed();
  const p = await call(db, "upsert_product", { name: "Y", options, variants });
  const before = db.rows("product_variants").map((r) => r.id);
  await call(db, "upsert_product", { id: p.id, variants: variants.slice(0, 2).map((v) => ({ ...v, price: v.price - 100 })) });
  const after = db.rows("product_variants");
  assert.deepEqual(after.map((r) => r.id), before.slice(0, 2));
  assert.equal(after[0].price, 4499);
  const kinds = db.writes.filter((w) => w.table === "product_variants").map((w) => w.kind);
  assert.equal(kinds.at(-1), "delete");
  const s = await call(db, "upsert_product", { id: p.id, variants: [] });
  assert.equal(s.type, "simple");
  assert.equal(db.rows("product_variants").length, 0);
});

test("rejects bad slugs, taken slugs, foreign categories and unknown option values", async () => {
  const db = seed();
  await assert.rejects(call(db, "upsert_product", { name: "Z", slug: "Bad Slug" }));
  await call(db, "upsert_product", { name: "Z", slug: "z-phone" });
  await assert.rejects(call(db, "upsert_product", { name: "Z2", slug: "z-phone" }), /already uses/);
  await assert.rejects(call(db, "upsert_product", { name: "Z3", category_ids: [CAT_B] }), /Category not found/);
  await assert.rejects(call(db, "upsert_product", { name: "Z4", options, variants: [{ attributes: { Color: "Red", Storage: "256GB" }, price: 1 }] }), /must be one of/);
  await assert.rejects(call(db, "upsert_product", { name: "Z5", options, variants: [variants[0], variants[0]] }), /twice/);
});

test("categories are site-scoped and slugs derived", async () => {
  const db = seed();
  const c = await call(db, "upsert_category", { name: "Samsung" });
  assert.equal(c.slug, "samsung");
  const list = await call(db, "list_categories", {}) as unknown as { name: string }[];
  assert.deepEqual(list.map((x) => x.name).sort(), ["Apple", "Samsung"]);
});

test("upsert_redirect normalises paths, refuses system paths, replaces the same from_path", async () => {
  const db = seed();
  await call(db, "upsert_redirect", { from_path: "/products/old-one/", to_url: "/products/new" });
  await call(db, "upsert_redirect", { from_path: "products/old-one", to_url: "/products/newer" });
  const r = db.rows("page_redirects");
  assert.equal(r.length, 1);
  assert.equal(r[0].from_path, "products/old-one");
  assert.equal(r[0].to_url, "/products/newer");
  assert.equal(r[0].status_code, 301);
  await assert.rejects(call(db, "upsert_redirect", { from_path: "/dashboard", to_url: "/x" }), /system/);
});
