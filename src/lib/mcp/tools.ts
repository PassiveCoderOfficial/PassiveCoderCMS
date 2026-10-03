import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENT_TOOLS } from "@/lib/ai-agent/tools";
import { blockRegistry, createBlock } from "@/modules/page-builder/block-registry";
import { getVariantsForBlock } from "@/modules/page-builder/block-variants";
import type { Block, BlockType } from "@/types/cms";

/**
 * Tools exposed over MCP. Every tool runs for one site (ctx.tenantId) with
 * the admin client, so every query MUST filter by tenant_id itself — same
 * convention as lib/ai-agent/tools.ts, whose tools are reused here.
 * `write: true` tools are refused for read-scoped tokens. Nothing here
 * deletes data; deletes stay in the dashboard on purpose.
 */

export type McpCtx = { tenantId: string; userId: string; supabase: SupabaseClient };
export type McpTool = {
  name: string;
  title: string;
  description: string;
  schema: z.ZodTypeAny;
  write: boolean;
  run: (args: never, ctx: McpCtx) => Promise<unknown>;
};

function fail(msg: string): never {
  throw new Error(msg);
}

const uuid = z.string().uuid();
const limit = z.number().int().min(1).max(100).default(25);

async function pageOf(ctx: McpCtx, pageId: string) {
  const { data } = await ctx.supabase.from("pages")
    .select("id, title, slug, type, status, blocks, draft_blocks, draft_rev, seo")
    .eq("id", pageId).eq("tenant_id", ctx.tenantId).is("deleted_at", null).maybeSingle();
  return data ?? fail("Page not found on this site");
}

const NEW_TOOLS: McpTool[] = [
  // ── Building blocks ────────────────────────────────────────────────────
  {
    name: "list_block_types",
    title: "List block types",
    description: "List every section/block type the page builder supports, with its layout variants. Use before building or editing a page.",
    schema: z.object({}),
    write: false,
    run: async () => blockRegistry.map((b) => ({
      type: b.type,
      label: b.label,
      description: b.description,
      variants: getVariantsForBlock(b.type as BlockType).map((v) => ({ key: v.key, label: v.label, description: v.description })),
    })),
  },
  {
    name: "get_block_template",
    title: "Get a block template",
    description: "Get a ready-to-edit default JSON for one block type (with a fresh id). Edit its `data` and pass it inside `blocks` to save_page_blocks. Set `templateVariant` to one of the type's variant keys to change its layout.",
    schema: z.object({ type: z.string() }),
    write: false,
    run: async ({ type }: { type: string }) => createBlock(type as BlockType) ?? fail(`Unknown block type "${type}". Call list_block_types.`),
  },

  // ── Pages ──────────────────────────────────────────────────────────────
  {
    name: "get_page_blocks",
    title: "Get page blocks",
    description: "Get the editable blocks of a page (the unpublished draft if one exists, otherwise the live content) plus draftRev, needed by save_page_blocks.",
    schema: z.object({ pageId: uuid }),
    write: false,
    run: async ({ pageId }: { pageId: string }, ctx) => {
      const p = await pageOf(ctx, pageId);
      return { pageId: p.id, title: p.title, slug: p.slug, status: p.status, hasDraft: !!p.draft_blocks, draftRev: p.draft_rev, blocks: p.draft_blocks ?? p.blocks ?? [] };
    },
  },
  {
    name: "save_page_blocks",
    title: "Save page blocks",
    description: "Replace a page's blocks. On a published page this saves an unpublished DRAFT (the live site does not change until publish_page). Pass expectedRev = draftRev from get_page_blocks to avoid overwriting someone else's edits.",
    schema: z.object({ pageId: uuid, blocks: z.array(z.record(z.string(), z.unknown())), expectedRev: z.number().int().nullish() }),
    write: true,
    run: async ({ pageId, blocks, expectedRev }: { pageId: string; blocks: Block[]; expectedRev?: number | null }, ctx) => {
      await pageOf(ctx, pageId);
      for (const b of blocks) if (!b.type || !b.id) fail("Every block needs an id and a type (start from get_block_template).");
      const { data, error } = await ctx.supabase.rpc("save_page_blocks", { p_id: pageId, p_blocks: blocks.map((b, i) => ({ ...b, order: i })), p_expected_rev: expectedRev ?? null });
      if (error) fail(error.message.includes("page_conflict") ? "Someone else edited this page since you read it. Call get_page_blocks again." : error.message);
      const row = (Array.isArray(data) ? data[0] : data) as { rev: number; has_draft: boolean };
      return { saved: true, draftRev: row.rev, isDraft: row.has_draft, note: row.has_draft ? "Saved as draft. Call publish_page to make it live." : "Saved." };
    },
  },
  {
    name: "publish_page",
    title: "Publish page",
    description: "Make a page's current draft live on the website (and mark the page published). The previous live version is kept in page history.",
    schema: z.object({ pageId: uuid }),
    write: true,
    run: async ({ pageId }: { pageId: string }, ctx) => {
      const p = await pageOf(ctx, pageId);
      const { error } = await ctx.supabase.rpc("publish_page", { p_id: pageId, p_blocks: p.draft_blocks ?? p.blocks ?? [], p_expected_rev: p.draft_rev });
      if (error) fail(error.message);
      return { published: true, pageId, slug: p.slug };
    },
  },
  {
    name: "create_page",
    title: "Create page",
    description: "Create a new page as a draft (not visible until published). Plan page limits apply.",
    schema: z.object({ title: z.string().min(1).max(120), slug: z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/).optional() }),
    write: true,
    run: async ({ title, slug }: { title: string; slug?: string }, ctx) => {
      const s = slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await ctx.supabase.from("pages")
        .insert({ tenant_id: ctx.tenantId, title, slug: s, type: "page", status: "draft", blocks: [], created_by: ctx.userId })
        .select("id, title, slug, status").single();
      if (error) fail(error.message);
      return data;
    },
  },

  // ── Blog posts ─────────────────────────────────────────────────────────
  {
    name: "list_posts",
    title: "List blog posts",
    description: "List this site's blog posts, newest first.",
    schema: z.object({ limit }),
    write: false,
    run: async ({ limit: n }: { limit: number }, ctx) => {
      const { data } = await ctx.supabase.from("pages").select("id, title, slug, status, excerpt, published_at, updated_at")
        .eq("tenant_id", ctx.tenantId).eq("type", "post").is("deleted_at", null).order("created_at", { ascending: false }).limit(n);
      return data ?? [];
    },
  },
  {
    name: "create_post",
    title: "Create blog post",
    description: "Create a blog post as a DRAFT. `html` is the article body (h2/h3/p/ul/ol/a/strong/em). Review it in the dashboard, or publish with publish_page.",
    schema: z.object({ title: z.string().min(1).max(160), excerpt: z.string().max(300).optional(), html: z.string().min(1).max(60000), featuredImage: z.string().url().optional() }),
    write: true,
    run: async (a: { title: string; excerpt?: string; html: string; featuredImage?: string }, ctx) => {
      const block = createBlock("text" as BlockType) as Block & { data: { content: string } };
      block.data.content = a.html;
      const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      const { data, error } = await ctx.supabase.from("pages").insert({
        tenant_id: ctx.tenantId, title: a.title, slug, type: "post", status: "draft",
        excerpt: a.excerpt ?? null, featured_image: a.featuredImage ?? null, blocks: [block], created_by: ctx.userId,
      }).select("id, title, slug, status").single();
      if (error) fail(error.message);
      return data;
    },
  },

  // ── Shop ───────────────────────────────────────────────────────────────
  {
    name: "list_products",
    title: "List products",
    description: "List products (optionally search by name or SKU).",
    schema: z.object({ search: z.string().optional(), status: z.enum(["active", "draft", "archived"]).optional(), limit }),
    write: false,
    run: async ({ search, status, limit: n }: { search?: string; status?: string; limit: number }, ctx) => {
      let q = ctx.supabase.from("products").select("id, name, slug, status, price, compare_price, sku, stock_quantity, track_inventory, featured")
        .eq("tenant_id", ctx.tenantId).order("updated_at", { ascending: false }).limit(n);
      if (status) q = q.eq("status", status);
      if (search) q = q.or(`name.ilike.%${search.replace(/[%,()]/g, "")}%,sku.ilike.%${search.replace(/[%,()]/g, "")}%`);
      return (await q).data ?? [];
    },
  },
  {
    name: "upsert_product",
    title: "Create or update product",
    description: "Create a product (omit id; created as draft unless status given) or update fields of an existing one. Prices are in the site's currency units (e.g. 49.99).",
    schema: z.object({
      id: uuid.optional(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(20000).optional(),
      short_description: z.string().max(500).optional(),
      price: z.number().min(0).optional(),
      compare_price: z.number().min(0).nullable().optional(),
      sku: z.string().max(80).optional(),
      stock_quantity: z.number().int().optional(),
      track_inventory: z.boolean().optional(),
      status: z.enum(["active", "draft", "archived"]).optional(),
      images: z.array(z.string().url()).optional(),
    }),
    write: true,
    run: async ({ id, ...fields }: { id?: string; name?: string } & Record<string, unknown>, ctx) => {
      if (id) {
        const { data, error } = await ctx.supabase.from("products").update({ ...fields, updated_at: new Date().toISOString() })
          .eq("id", id).eq("tenant_id", ctx.tenantId).select("id, name, status, price, stock_quantity").maybeSingle();
        if (error) fail(error.message);
        return data ?? fail("Product not found on this site");
      }
      if (!fields.name) fail("name is required to create a product");
      const slug = String(fields.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
      const { data, error } = await ctx.supabase.from("products")
        .insert({ status: "draft", type: "simple", price: 0, ...fields, slug, tenant_id: ctx.tenantId })
        .select("id, name, status, price").single();
      if (error) fail(error.message);
      return data;
    },
  },
  {
    name: "list_orders",
    title: "List orders",
    description: "List recent shop orders (optionally by status).",
    schema: z.object({ status: z.enum(["pending", "processing", "on_hold", "completed", "cancelled", "refunded", "failed"]).optional(), limit }),
    write: false,
    run: async ({ status, limit: n }: { status?: string; limit: number }, ctx) => {
      let q = ctx.supabase.from("orders").select("id, order_number, customer_name, customer_email, status, payment_status, payment_method, total, created_at")
        .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(n);
      if (status) q = q.eq("status", status);
      return (await q).data ?? [];
    },
  },
  {
    name: "get_order",
    title: "Get order",
    description: "Get one order with its items and addresses.",
    schema: z.object({ orderId: uuid }),
    write: false,
    run: async ({ orderId }: { orderId: string }, ctx) => {
      const { data } = await ctx.supabase.from("orders").select("*").eq("id", orderId).eq("tenant_id", ctx.tenantId).maybeSingle();
      return data ?? fail("Order not found on this site");
    },
  },
  {
    name: "update_order_status",
    title: "Update order status",
    description: "Change an order's status and/or payment status.",
    schema: z.object({
      orderId: uuid,
      status: z.enum(["pending", "processing", "on_hold", "completed", "cancelled", "refunded", "failed"]).optional(),
      payment_status: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
    }),
    write: true,
    run: async ({ orderId, ...patch }: { orderId: string; status?: string; payment_status?: string }, ctx) => {
      if (!patch.status && !patch.payment_status) fail("Nothing to change");
      const { data, error } = await ctx.supabase.from("orders").update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", orderId).eq("tenant_id", ctx.tenantId).select("id, order_number, status, payment_status").maybeSingle();
      if (error) fail(error.message);
      return data ?? fail("Order not found on this site");
    },
  },

  // ── Bookings ───────────────────────────────────────────────────────────
  {
    name: "list_bookings",
    title: "List bookings",
    description: "List appointment bookings from a date (YYYY-MM-DD, default today), optionally by status.",
    schema: z.object({ from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(), limit }),
    write: false,
    run: async ({ from, status, limit: n }: { from?: string; status?: string; limit: number }, ctx) => {
      let q = ctx.supabase.from("booking_appointments").select("id, date, start_time, end_time, customer_name, customer_email, customer_phone, message, status, admin_note")
        .eq("tenant_id", ctx.tenantId).gte("date", from ?? new Date().toISOString().slice(0, 10)).order("date").order("start_time").limit(n);
      if (status) q = q.eq("status", status);
      return (await q).data ?? [];
    },
  },
  {
    name: "update_booking",
    title: "Update booking",
    description: "Confirm, cancel, complete or mark a booking as no-show, and/or set an internal note.",
    schema: z.object({ bookingId: uuid, status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(), admin_note: z.string().max(2000).optional() }),
    write: true,
    run: async ({ bookingId, ...patch }: { bookingId: string; status?: string; admin_note?: string }, ctx) => {
      const { data, error } = await ctx.supabase.from("booking_appointments").update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", bookingId).eq("tenant_id", ctx.tenantId).select("id, date, start_time, status").maybeSingle();
      if (error) fail(error.message);
      return data ?? fail("Booking not found on this site");
    },
  },

  // ── Media & content ────────────────────────────────────────────────────
  {
    name: "list_media",
    title: "List media",
    description: "List images/files in the site's media library (URLs usable in blocks and products).",
    schema: z.object({ search: z.string().optional(), limit }),
    write: false,
    run: async ({ search, limit: n }: { search?: string; limit: number }, ctx) => {
      let q = ctx.supabase.from("media").select("id, name, url, mime_type, width, height, alt, created_at")
        .eq("tenant_id", ctx.tenantId).order("created_at", { ascending: false }).limit(n);
      if (search) q = q.ilike("name", `%${search.replace(/[%]/g, "")}%`);
      return (await q).data ?? [];
    },
  },
  {
    name: "list_testimonials",
    title: "List testimonials",
    description: "List the site's customer testimonials.",
    schema: z.object({ limit }),
    write: false,
    run: async ({ limit: n }: { limit: number }, ctx) => {
      const { data } = await ctx.supabase.from("testimonials").select("id, name, role, company, content, rating, published")
        .eq("tenant_id", ctx.tenantId).order("sort_order").limit(n);
      return data ?? [];
    },
  },
];

// The in-dashboard assistant's tools, reused as-is. Over MCP the write ones
// run directly (the person granted a write token) instead of via the
// assistant's confirm card.
const REUSED: McpTool[] = AGENT_TOOLS.map((t) => ({
  name: t.name,
  title: t.name.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "),
  description: t.description.replace(/\s*Requires confirmation\.?/i, "").replace(/^Propose /, ""),
  schema: t.argsSchema,
  write: !t.readOnly,
  run: (args: never, ctx: McpCtx) => t.run(args, ctx),
}));

export const MCP_TOOLS: McpTool[] = [...REUSED, ...NEW_TOOLS];

export function findMcpTool(name: string): McpTool | undefined {
  return MCP_TOOLS.find((t) => t.name === name);
}

export function toolJsonSchema(t: McpTool): Record<string, unknown> {
  const s = z.toJSONSchema(t.schema, { io: "input" }) as Record<string, unknown>;
  delete s.$schema;
  return s;
}
