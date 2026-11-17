import { z } from "zod";
import { invalidateSiteCache } from "@/lib/supabase/public-cache";
import { publishDueForSite } from "@/lib/posts/scheduled";
import { publicUrl, adminUrl } from "@/lib/tenant/site-urls";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AGENT_TOOLS } from "@/lib/ai-agent/tools";
import { blockRegistry, createBlock } from "@/modules/page-builder/block-registry";
import { getVariantsForBlock } from "@/modules/page-builder/block-variants";
import { uiTextDoc } from "@/modules/page-builder/ui-text";
import type { Block, BlockType } from "@/types/cms";
import { SITE_TOOLS } from "@/lib/ai-agent/site-tools";
import { SETUP_TOOLS } from "@/lib/mcp/setup-tools";
import { MENU_PLACE_TOOLS } from "@/lib/mcp/menu-place-tools";
import { STUDIO_SWITCH_TOOLS } from "@/lib/mcp/studio-switch-tools";
import { SUPERADMIN_TOOLS } from "@/lib/mcp/superadmin-tools";
import { ADMIN_TOOLS } from "@/lib/mcp/admin-tools";
import { SHOP_TOOLS } from "@/lib/mcp/shop-tools";
import { SITE_CHROME_TOOLS, writeIdentity } from "@/lib/mcp/layout-tools";
import { withSiteArg } from "@/lib/mcp/admin-scope";
import { callableIn, visibleIn } from "@/lib/mcp/visibility";
import { setPageParent } from "@/lib/pages/page-parent";

/**
 * Tools exposed over MCP. Every tool runs for one site (ctx.tenantId) with
 * the admin client, so every query MUST filter by tenant_id itself — same
 * convention as lib/ai-agent/tools.ts, whose tools are reused here.
 * `write: true` tools are refused for read-scoped tokens. Moving a page to
 * the trash (trash_page, restorable) is allowed; nothing here deletes data
 * permanently, that stays in the dashboard on purpose.
 * `superAdmin: true` tools (superadmin-tools.ts) are hidden from and refused
 * for anyone not in super_admins, and re-check that on every call.
 * Super admins may also point any site tool at another tenant with an
 * optional `site` argument; the route resolves it into ctx.tenantId
 * (admin-scope.ts), so site tools never see it.
 */

export type McpCtx = { tenantId: string; userId: string; supabase: SupabaseClient; via?: "mcp" | "app" };
export type McpTool = {
  name: string;
  title: string;
  description: string;
  schema: z.ZodTypeAny;
  write: boolean;
  /** Only for Passive Coder super admins; works across sites. */
  superAdmin?: boolean;
  run: (args: never, ctx: McpCtx) => Promise<unknown>;
};

/** publish_at for posts: "now" or an ISO time (a time without a zone is read as UTC). */
function parsePublishAt(v: string): { iso: string; now: boolean } {
  if (v.trim().toLowerCase() === "now") return { iso: new Date().toISOString(), now: true };
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) fail(`publish_at "${v}" is not a valid ISO 8601 time (e.g. 2026-11-02T09:00:00+06:00) or "now"`);
  // Schedule slots are quarter hours (the publish check runs every 15 min): round up.
  const q = 15 * 60_000;
  const slot = new Date(Math.ceil(d.getTime() / q) * q);
  // A time already passed (or within a minute) means publish now.
  return { iso: slot.toISOString(), now: d.getTime() <= Date.now() + 60_000 };
}

/** Turns Google Drive / Dropbox share pages into direct file downloads. */
function shareLinkToDirect(raw: string): string {
  const drive = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{10,})/);
  if (drive) return `https://drive.google.com/uc?export=download&id=${drive[1]}`;
  if (/^https?:\/\/(www\.)?dropbox\.com\//.test(raw)) {
    const u = new URL(raw);
    u.searchParams.set("dl", "1");
    return u.toString();
  }
  return raw;
}

function fail(msg: string): never {
  throw new Error(msg);
}

const uuid = z.string().uuid();
// Clients holding an older copy of a tool's schema send fields it doesn't
// list as strings ("true", '{"ar":{...}}'); newer optional fields accept both.
const looseBool = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean());
function parseJsonString(v: unknown) {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}
const limit = z.number().int().min(1).max(100).default(25);

/** Adds the post's address (/blog/<slug>): `url` on the live site, and for a
 *  post that is not live yet `preview_url` on the site's own address, where
 *  a signed-in member sees it with a preview banner (anonymous visitors 404). */
async function withPostUrls<T extends { slug?: string; status?: string }>(ctx: McpCtx, rows: T[]): Promise<(T & { url?: string; preview_url?: string })[]> {
  const { data: site } = await ctx.supabase.from("tenants").select("slug, custom_domain").eq("id", ctx.tenantId).maybeSingle();
  if (!site) return rows;
  return rows.map((r) => {
    if (!r.slug) return r;
    const path = `/blog/${r.slug}`;
    return { ...r, url: publicUrl(site, path), ...(r.status !== "published" ? { preview_url: adminUrl(site, path) } : {}) };
  });
}

async function pageOf(ctx: McpCtx, pageId: string) {
  const { data } = await ctx.supabase.from("pages")
    .select("id, title, slug, type, status, blocks, draft_blocks, draft_rev, seo")
    .eq("id", pageId).eq("tenant_id", ctx.tenantId).is("deleted_at", null).maybeSingle();
  return data ?? fail("Page not found on this site");
}

/** Optional `data` fields per block type that the default template leaves
 *  out (all off/unset by default, so existing pages are unchanged). Listed so
 *  an agent can find them without reading the source. */
const BLOCK_OPTIONS: Record<string, string> = {
  hero: "tertiaryButton {label,url,variant,bgColor,textColor} (third button); primary/secondary/tertiaryButton.bgColor/textColor = per-button colour (e.g. #25D366 WhatsApp); bgSlides: string[] (2+ photos cross-fade; fullscreen-overlay, dark-gradient-left, corporate) + slideInterval (s); overlayStyle: \"left-fade\" (fullscreen-overlay); overlayFullBleed: true (fullscreen-overlay tint covers the section padding too, no darker box). Split layout keeps line breaks in description. compact: true (shorter fullscreen-overlay / split-image-right). page-banner: homeLabel = first breadcrumb text (empty = Home in the page language).",
  cta: "tone: \"light\"|\"dark\" text colour (gradient/navy/orange banners and the default design; default design picks dark text on pale background colours by itself); tertiaryButton {label,url}; primary/secondary/tertiaryButton.bgColor/textColor per-button colour. visit-map: whatsappText = WhatsApp message of a first button with no url (empty = \"Hi, I would like to know more.\"); mapQuery = words for Google to find or any Google Maps link / keyless embed URL (empty = the address).",
  contact: "hideForm: true (details + map only); showMap with empty mapEmbedUrl maps the address; mapEmbedUrl takes any Google Maps link (maps.app.goo.gl share link, place page URL, ?q=lat,lng, embed URL or the whole <iframe> code), best a keyless embed https://www.google.com/maps?q=<lat>,<lng>&z=<zoom>&output=embed; mapLocation {lat,lng,label,zoom} (optional, editor memory; mapEmbedUrl is what renders); mapHeight px (map height, unset = layout default); map also shows when showContactInfo is off; field type \"date\" = date picker. Text fields (empty = built-in): callLabel \"Call us\", emailLabel \"Email us\", visitLabel \"Visit us\", hoursLabel \"Opening hours\", whatsappLabel \"Chat on WhatsApp\", sendingLabel \"Sending…\", selectPlaceholder \"Select…\", filePlaceholder, quotePrefillText \"I would like a quote for:\", whatsappContinueLabel \"Continue on WhatsApp\".",
  ecommerce_products: "wideCols: 3 (wide-cards layout, 3 columns on desktop); categoryNames {categoryId: name} (tile names on this block, e.g. a translated page).",
  icon_grid: "columns 2-6; showDescriptions: true (bordered-matrix, minimal-inline); items[].tileColor (colored-tiles tile background, items[].color = icon badge); imageSize: px (bigger item images/logos, e.g. 80). Item keys: label, description (line breaks kept; grouped-list = one name per line), imageUrl (logo instead of icon), url, thumbUrl (outlined-cards photo).",
  features: "imageRightFirst: true (alternating rows start with the image on the right); items[].buttonLabel + buttonUrl (per-item button); image-stats: imageFocus (photo focal point), badgePosition overlay/bottom-edge. description = section text (dark, icon-list-cards, bento-grid, overview-quote, image-stats, text-tiles; numbered-grid when no subtitle). Item photo key: imageUrl.",
  services: "intro: paragraph under the title (subtitle stays the small line above); itemAlign: \"center\" + linkStyle: \"solid\" (default design, image-cards-dark; solid also icon-cards-grid); noImageFade: true and captionTone: \"dark\" (image-cards-dark). items[].linkLabel = link text (empty = \"Learn More\"; site-showcase \"Visit\"; bento \"Explore\"); items[].kicker (default grid, site-showcase, bento, photo-cards); whatsappButton {number,label,message,color} (default design; message {title} = card title); showFilter + filterAllLabel (first tab, empty = \"All\"); allLink {label,url}.",
  testimonials: "ratingSummary {enabled, value, count, url, label, position: \"top\"|\"bottom\", countLabel (\"{count}\" = count; empty = \"Based on {count} reviews\")} = Google rating card; use the business's real Google figures only. emptyText (default design, empty = \"No testimonials added yet.\"). reviewForm wording (empty = built-in): promptText, namePlaceholder, placePlaceholder, textPlaceholder, photosText, thanksText, pendingText, countLabel (\"{count}\" = number). quote-cards: subtitle = small line above the title (unset = \"What people say\").",
  table: "hideHeader: true (no header row). Tool wording (empty = built-in): searchPlaceholder \"Search…\", ofLabel \"of\", csvLabel \"CSV\", printLabel \"Print / PDF\", prevLabel \"Previous\", nextLabel \"Next\".",
  faq: "sideImage (+ sideImageAlt): photo under the heading in split-heading.",
  item_box: "linkLabel (link text on cards, empty = \"Learn More\"); emptyText (empty = \"No items to show yet.\").",
  blog: "readMoreLabel (empty = \"Read More\"); viewAllLabel (empty = \"View All\"); emptyText (empty = \"No posts published yet.\"). Only layout grid and list are drawn.",
  gallery: "emptyText (empty = \"No images added yet\"); showFilter + filterAllLabel (first tab, empty = \"All\"); link {label,url} = button under the photos; limit + loadMoreLabel; document-cards: images[].category (chip) + note (line under the title).",
  steps: "stepLabel = word before the number in dark-cards and split-media (empty = \"Step\").",
  country_grid: "linkLabel (card link, empty = \"View details\"); otherRegionLabel (heading for countries without a region, empty = \"Other\").",
  pricing: "plans[].description (all designs except dark); spec-cards: oldPrice, tag, spec, excludedFeatures, currencyPrefix, whatsappCta + whatsappText ({plan}, {price}), footnote.",
  pricing_catalog: "Wording overrides (empty = built-in text of the language): popularLabel, oneTimeLabel, perMonthLabel, monthlyLabel, yearlyLabel, billedMonthlyText, infoCards [{title,text}] x3, careTitle, careText, compareLabel, bdTitle, bdText, bdButtonLabel.",
  header_nav: "The Menu block: menuId = a saved menu by id (list_menus; place_menu does this for you); layout bar|vertical|inline|accordion|drawer (unset = the classic header links with their own items); menuStyle {preset plain|underline|pill|boxed|brand|caps|bold|soft, fontSize, fontWeight, gap, color, hover, active, dropdown{look}...}; align start|center|end; phoneLayout \"same\" keeps the bar on phones (default: a menu button); levels 1-3 (lists); buttonLabel; label (name for screen readers).",
  footer: "columns[].menuId: the column shows that saved menu's links instead of its typed links (columns[].menuLevels 2 = with sub-links); columns[].text: plain text under a column heading (address, phone, hours); autoLightLogo: true (dark footer shows the site's logo for dark backgrounds); logoCaption: small line under the tagline; copyrightText replaces the whole copyright line ({year} = current year).",
  navigation: "style \"logo-center-inline\": one row, menu left, logo centre, site social icons right; logoCaption: small text beside the logo; secondaryCtaLabel + secondaryCtaUrl: plain text link beside the button; ctaVariant: gradient|solid|outline (button look); colorMode \"legacy\" = use backgroundColor/textColor instead of theme colours.",
  stats: "items[].prefix / suffix are shown before / after the number (not doubled when the value already has them); every design shows title/subtitle when set.",
  countdown: "title is shown above the clock; layout boxes|minimal.",
  scroll_story: "scrollLabel = the small hint on the first screen (empty = \"Scroll\").",
  bottom_bar: "searchTitle (empty = \"Search\"), allProductsLabel (last categories tile, empty = \"All products\"), categoriesTitle, searchPlaceholder.",
};

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
      // Built-in words a block can replace (ui-text.ts) ride along with the options line.
      ...(BLOCK_OPTIONS[b.type] || uiTextDoc(b.type) ? { options: [BLOCK_OPTIONS[b.type], uiTextDoc(b.type)].filter(Boolean).join(" ") } : {}),
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
    description: "Replace a page's blocks. On a published page this saves an unpublished DRAFT (the live site does not change until publish_page). Pass expectedRev = draftRev from get_page_blocks to avoid overwriting someone else's edits. To change a few fields without resending large blocks, send an existing block as { id, _merge: true, ...fields } (data is shallow-merged into the block's current data; { id, _merge: true } alone keeps it unchanged). The list still sets the page's blocks and their order, so include EVERY block that should stay (as { id, _merge: true } if unchanged). Leaving existing blocks out is refused unless removeOmitted is true.",
    schema: z.object({ pageId: uuid, blocks: z.array(z.record(z.string(), z.unknown())), expectedRev: z.number().int().nullish(), removeOmitted: z.boolean().nullish() }),
    write: true,
    run: async ({ pageId, blocks: input, expectedRev, removeOmitted }: { pageId: string; blocks: (Block & { _merge?: boolean })[]; expectedRev?: number | null; removeOmitted?: boolean | null }, ctx) => {
      const page = await pageOf(ctx, pageId);
      const existing = (page.draft_blocks ?? page.blocks ?? []) as Block[];
      const current = new Map(existing.map((b) => [b.id, b]));
      // An agent editing one section tends to send just that section; because
      // the list replaces the page, that silently deleted every other section.
      // Removal must be explicit.
      const sent = new Set(input.map((b) => b.id));
      const dropped = existing.filter((b) => !sent.has(b.id));
      if (dropped.length && !removeOmitted) {
        fail(`This would remove ${dropped.length} of ${existing.length} sections (${dropped.slice(0, 6).map((b) => b.type).join(", ")}${dropped.length > 6 ? ", …" : ""}). Send every block that should stay — unchanged ones as { id, _merge: true } — or set removeOmitted: true if removing them is intended.`);
      }
      const blocks = input.map((b) => {
        if (!b._merge) return b;
        const { _merge: _m, ...rest } = b;
        void _m;
        const cur = current.get(b.id) ?? fail(`Block ${b.id} is not on this page, so it cannot be merged. Send the full block instead.`);
        return { ...cur, ...rest, data: { ...(cur.data as Record<string, unknown>), ...((rest.data as Record<string, unknown> | undefined) ?? {}) } } as Block;
      });
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
      // publish_page is an RPC, which the write-scope cache hook skips, so the
      // live site kept serving the old copy for up to an hour. Expire it here.
      invalidateSiteCache(ctx.tenantId);
      return { published: true, pageId, slug: p.slug };
    },
  },
  {
    name: "create_page",
    title: "Create page",
    description: "Create a new page as a draft (not visible until published). Plan page limits apply. Optional parentId (a page id on this site from list_pages) makes it a sub-page: its address becomes /<parent slug>/<slug>.",
    schema: z.object({ title: z.string().min(1).max(120), slug: z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/).optional(), parentId: uuid.optional() }),
    write: true,
    run: async ({ title, slug, parentId }: { title: string; slug?: string; parentId?: string }, ctx) => {
      const s = slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let full = s;
      if (parentId) {
        const parent = await pageOf(ctx, parentId);
        full = `${parent.slug}/${s}`;
      }
      const { data, error } = await ctx.supabase.from("pages")
        .insert({ tenant_id: ctx.tenantId, title, slug: full, parent_id: parentId ?? null, type: "page", status: "draft", blocks: [], created_by: ctx.userId })
        .select("id, title, slug, status, parent_id").single();
      if (error) fail(error.message.includes("duplicate") ? `A page at /${full} already exists.` : error.message);
      if (parentId) {
        // Same rules as the dashboard (set_page_parent, migration 215).
        const res = await setPageParent(ctx.supabase, [data!.id], parentId);
        if (res.error) {
          await ctx.supabase.from("pages").delete().eq("id", data!.id).eq("tenant_id", ctx.tenantId);
          fail(res.error);
        }
      }
      return data;
    },
  },

  // ── Blog posts ─────────────────────────────────────────────────────────
  {
    name: "list_posts",
    title: "List blog posts",
    description: "List this site's blog posts, newest first. Each has status (draft | published | scheduled | archived) and url (posts live at /blog/<slug>; unpublished ones also carry preview_url, viewable when signed in); scheduled posts carry scheduled_at (UTC ISO) — the time they go live automatically. Pass status: \"scheduled\" to see only the publishing queue.",
    schema: z.object({ limit, status: z.enum(["draft", "published", "scheduled", "archived"]).optional() }),
    write: false,
    run: async ({ limit: n, status }: { limit: number; status?: string }, ctx) => {
      await publishDueForSite(ctx.tenantId);
      let q = ctx.supabase.from("pages").select("id, title, slug, status, excerpt, published_at, scheduled_at, updated_at")
        .eq("tenant_id", ctx.tenantId).eq("type", "post").is("deleted_at", null);
      q = status === "scheduled" ? q.eq("status", "scheduled").order("scheduled_at", { ascending: true }) : (status ? q.eq("status", status) : q).order("created_at", { ascending: false });
      const { data } = await q.limit(n);
      return withPostUrls(ctx, data ?? []);
    },
  },
  {
    name: "create_post",
    title: "Create blog post",
    description: "Create a blog post. `html` is the article body (h2/h3/p/ul/ol/a/strong/em). By default it is a DRAFT. SCHEDULING IS SUPPORTED: pass publish_at (ISO 8601 with timezone, e.g. 2026-11-02T09:00:00+06:00) to schedule it — it goes live automatically at that time, no manual publish needed. publish_at: \"now\" publishes immediately. Use schedule_post to reschedule or unschedule later.",
    schema: z.object({ title: z.string().min(1).max(160), excerpt: z.string().max(300).optional(), html: z.string().min(1).max(60000), featuredImage: z.string().url().optional(), publish_at: z.string().optional() }),
    write: true,
    run: async (a: { title: string; excerpt?: string; html: string; featuredImage?: string; publish_at?: string }, ctx) => {
      const when = a.publish_at ? parsePublishAt(a.publish_at) : null;
      const block = createBlock("text" as BlockType) as Block & { data: { content: string } };
      block.data.content = a.html;
      const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
      const timing = !when ? { status: "draft" } : when.now ? { status: "published", published_at: when.iso } : { status: "scheduled", scheduled_at: when.iso };
      const { data, error } = await ctx.supabase.from("pages").insert({
        tenant_id: ctx.tenantId, title: a.title, slug, type: "post", ...timing,
        excerpt: a.excerpt ?? null, featured_image: a.featuredImage ?? null, blocks: [block], created_by: ctx.userId,
      }).select("id, title, slug, status, scheduled_at, published_at").single();
      if (error) fail(error.message);
      if (when) invalidateSiteCache(ctx.tenantId);
      return (await withPostUrls(ctx, [data!]))[0];
    },
  },
  {
    name: "schedule_post",
    title: "Schedule, reschedule or unschedule a blog post",
    description: "Set when an existing blog post goes live (times are rounded up to the next quarter hour: :00, :15, :30, :45). publish_at: ISO 8601 time with timezone (e.g. 2026-11-02T09:00:00+06:00) schedules or reschedules it — it publishes automatically then; \"now\" publishes immediately; null unschedules it back to a draft. Works on draft and scheduled posts (to change a live post's text use the dashboard). List the queue with list_posts status: \"scheduled\".",
    schema: z.object({ postId: uuid, publish_at: z.string().nullable() }),
    write: true,
    run: async ({ postId, publish_at }: { postId: string; publish_at: string | null }, ctx) => {
      const { data: post } = await ctx.supabase.from("pages").select("id, status, published_at").eq("id", postId)
        .eq("tenant_id", ctx.tenantId).in("type", ["post", "page"]).is("deleted_at", null).maybeSingle();
      if (!post) fail("Post not found on this site");
      const when = publish_at ? parsePublishAt(publish_at) : null;
      if (post!.status === "published" && !when?.now) fail("This post is already live; scheduling only applies to posts that are not live yet.");
      const patch = !when ? { status: "draft", scheduled_at: null }
        : when.now ? { status: "published", published_at: post!.published_at ?? when.iso, scheduled_at: null }
        : { status: "scheduled", scheduled_at: when.iso };
      const { data, error } = await ctx.supabase.from("pages").update(patch).eq("id", postId).eq("tenant_id", ctx.tenantId)
        .select("id, title, slug, status, scheduled_at, published_at").maybeSingle();
      if (error) fail(error.message);
      invalidateSiteCache(ctx.tenantId);
      return data ? (await withPostUrls(ctx, [data]))[0] : data;
    },
  },

  // ── Shop ───────────────────────────────────────────────────────────────
  {
    name: "list_products",
    title: "List products",
    description: "List products (optionally search by name or SKU). includeText: true adds short_description, description, seo, translations, type and category_ids (for writing translations with upsert_product). offset pages through long lists.",
    schema: z.object({ search: z.string().optional(), status: z.enum(["active", "draft", "archived"]).optional(), limit, includeText: looseBool.optional(), offset: z.coerce.number().int().min(0).optional() }),
    write: false,
    run: async ({ search, status, limit: n, includeText, offset = 0 }: { search?: string; status?: string; limit: number; includeText?: boolean; offset?: number }, ctx) => {
      const cols = "id, name, slug, status, price, compare_price, sku, stock_quantity, track_inventory, featured" + (includeText ? ", short_description, description, seo, translations, type, category_ids" : "");
      let q = ctx.supabase.from("products").select(cols)
        .eq("tenant_id", ctx.tenantId).order("updated_at", { ascending: false }).order("id").range(offset, offset + n - 1);
      if (status) q = q.eq("status", status);
      if (search) q = q.or(`name.ilike.%${search.replace(/[%,()]/g, "")}%,sku.ilike.%${search.replace(/[%,()]/g, "")}%`);
      return (await q).data ?? [];
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
      if (!data) return fail("Booking not found on this site");
      // Experts review link, as when the dashboard completes a booking. Never throws.
      if (patch.status === "completed") {
        const [{ inviteAfterBooking }, { createAdminClient }] = await Promise.all([import("@/lib/experts/reviews"), import("@/lib/supabase/server")]);
        await inviteAfterBooking(await createAdminClient(), ctx.tenantId, data.id as string);
      }
      return data;
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
        .eq("tenant_id", ctx.tenantId).or("folder.is.null,folder.neq./site-chat").order("created_at", { ascending: false }).limit(n);
      if (search) q = q.ilike("name", `%${search.replace(/[%]/g, "")}%`);
      return (await q).data ?? [];
    },
  },
  {
    name: "upload_media",
    title: "Upload media",
    description: "Add an image to the site's media library and get its public URL (for blocks, the header logo or set_site_branding). Give EITHER url (a public image link; Google Drive and Dropbox share links work; max 20 MB) OR base64 + mimeType (only for small files such as an SVG logo you wrote; max 5 MB). For photos the user has on their computer or attached in chat, do not convert them to base64: call get_upload_link instead.",
    schema: z.object({
      filename: z.string().min(1).max(120),
      url: z.string().url().optional(),
      base64: z.string().min(16).max(7_000_000).optional(),
      mimeType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon"]).optional(),
      alt: z.string().max(200).optional(),
    }).refine((v) => v.url || (v.base64 && v.mimeType), "Give url, or base64 with mimeType"),
    write: true,
    run: async ({ filename, url, base64, mimeType, alt }: { filename: string; url?: string; base64?: string; mimeType?: string; alt?: string }, ctx) => {
      if (url) {
        const { safeFetch } = await import("@/lib/import/server");
        const { storeMediaFile } = await import("@/lib/media/upload");
        let res: Response, buf: Buffer;
        try { ({ res, buf } = await safeFetch(shareLinkToDirect(url), { maxBytes: 20 * 1024 * 1024, accept: "image/*" })); }
        catch (e) { fail(`Could not download the image: ${(e as Error).message}`); }
        if (!res!.ok) fail(`Could not download the image (HTTP ${res!.status}). Use a public link, or call get_upload_link.`);
        const type = (res!.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
        if (!type.startsWith("image/")) fail(`That link is not an image (it returned ${type || "unknown content"}). For Google Drive, set sharing to "Anyone with the link".`);
        const stored = await storeMediaFile(ctx.supabase, ctx.tenantId, new File([new Uint8Array(buf!)], filename, { type }));
        if ("error" in stored) fail(stored.error);
        if (alt && stored.id) await ctx.supabase.from("media").update({ alt }).eq("id", stored.id);
        return { uploaded: true, url: stored.url, size: stored.size, width: stored.width, height: stored.height };
      }
      const buf = Buffer.from(base64!.replace(/^data:[^;]+;base64,/, ""), "base64");
      if (!buf.length || buf.length > 5 * 1024 * 1024) fail("File must be between 1 byte and 5 MB.");
      const { data: t } = await ctx.supabase.from("tenants").select("slug").eq("id", ctx.tenantId).maybeSingle();
      const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `uploads/${t?.slug ?? ctx.tenantId}/${Date.now()}_${safe}`;
      const { error: upErr } = await ctx.supabase.storage.from("media").upload(path, buf, { contentType: mimeType, upsert: false });
      if (upErr) fail(upErr.message);
      const publicUrl = ctx.supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      const { error: dbErr } = await ctx.supabase.from("media").insert({
        name: safe, original_name: filename, url: publicUrl, mime_type: mimeType, size: buf.length,
        storage_path: path, tenant_id: ctx.tenantId, ...(alt ? { alt } : {}),
      });
      if (dbErr) fail(dbErr.message);
      return { uploaded: true, url: publicUrl, size: buf.length };
    },
  },
  {
    name: "get_upload_link",
    title: "Get image upload link",
    description: "Get a private web page (valid 24 hours, up to 100 images) that drops images straight into this site's media library. Use it whenever the user has photos on their computer or attached in chat: give them the link, ask them to upload and tell you when done, then call list_media to get the new URLs. If you can run shell commands (Claude Code), upload local files yourself instead: curl -F \"file=@photo.jpg\" <uploadEndpoint>, one file per request.",
    schema: z.object({}),
    write: true,
    run: async (_: Record<string, never>, ctx) => {
      const { createUploadLink } = await import("@/lib/media/upload-links");
      const link = await createUploadLink(ctx.supabase, ctx.tenantId, ctx.userId ?? null);
      return { ...link, uploadEndpoint: link.url.replace("/drop/", "/api/drop/"), note: "Open url in a browser to drag and drop images. For scripts: POST multipart field \"file\" to uploadEndpoint, one image per request. Then call list_media." };
    },
  },
  {
    name: "set_site_branding",
    title: "Set logo & favicon",
    description: "Set the site's logo and/or favicon (browser tab and search icon) by URL, e.g. from upload_media. Goes live immediately. The header's own logo field, if set, still overrides the logo in the header. Same as update_site_identity logo_url / favicon_url, which also sets the dark-background logo, name, tagline and brand colours.",
    schema: z.object({ logoUrl: z.string().url().optional(), faviconUrl: z.string().url().optional() })
      .refine((v) => v.logoUrl || v.faviconUrl, "Give logoUrl and/or faviconUrl"),
    write: true,
    run: async ({ logoUrl, faviconUrl }: { logoUrl?: string; faviconUrl?: string }, ctx) => {
      // One writer with update_site_identity: both site_identity (created when
      // the site has none; it used to update nothing then) and site_settings.
      const { layoutLockedFor, LAYOUT_LOCK_MESSAGE } = await import("@/lib/tenant/layout-lock");
      if (await layoutLockedFor(ctx.supabase, ctx.userId, ctx.tenantId)) fail(LAYOUT_LOCK_MESSAGE);
      await writeIdentity(ctx, { ...(logoUrl ? { logo_url: logoUrl } : {}), ...(faviconUrl ? { favicon_url: faviconUrl } : {}) });
      return { updated: true, logoUrl: logoUrl ?? null, faviconUrl: faviconUrl ?? null };
    },
  },
  {
    name: "get_custom_css",
    title: "Get custom CSS",
    description: "Read the site's Custom CSS (Settings > Appearance > Custom CSS). Read it before set_custom_css so you change only what you mean to.",
    schema: z.object({}),
    write: false,
    run: async (_: Record<string, never>, ctx) => {
      const { data } = await ctx.supabase.from("site_settings").select("custom_css").eq("tenant_id", ctx.tenantId).maybeSingle();
      const css = (data?.custom_css as string | null) ?? "";
      return { css, length: css.length };
    },
  },
  {
    name: "set_custom_css",
    title: "Set custom CSS",
    description: "Replace the site's whole Custom CSS (Settings > Appearance > Custom CSS) and publish it. Call get_custom_css first and send back the full edited text: anything you leave out is removed. Prefer block settings over CSS where a block option exists. Plain CSS only, max 100 KB; an empty string clears it.",
    schema: z.object({ css: z.string().max(100_000) }),
    write: true,
    run: async ({ css }: { css: string }, ctx) => {
      // The CSS is rendered inside a <style> tag: refuse anything that could close it and inject markup.
      if (/<\/?\s*(style|script)|<!--|<\s*\/|<[a-z!]/i.test(css)) fail("CSS cannot contain HTML tags such as </style> or <script>.");
      const { error } = await ctx.supabase.from("site_settings")
        .upsert({ tenant_id: ctx.tenantId, custom_css: css.trim() || null, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
      if (error) fail(error.message);
      invalidateSiteCache(ctx.tenantId);
      return { updated: true, length: css.trim().length };
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

export const MCP_TOOLS: McpTool[] = [...REUSED, ...NEW_TOOLS, ...SHOP_TOOLS, ...SITE_TOOLS, ...SETUP_TOOLS, ...MENU_PLACE_TOOLS, ...STUDIO_SWITCH_TOOLS, ...SITE_CHROME_TOOLS, ...SUPERADMIN_TOOLS, ...ADMIN_TOOLS];

export function findMcpTool(name: string): McpTool | undefined {
  return MCP_TOOLS.find((t) => t.name === name);
}


export function visibleTools(scope: "read" | "write", superAdmin: boolean): McpTool[] {
  return visibleIn(MCP_TOOLS, scope, superAdmin);
}
export function callableTool(name: string, superAdmin: boolean): McpTool | undefined {
  return callableIn(MCP_TOOLS, name, superAdmin);
}

/** Input schema for tools/list. `boundSite` (super admins only) adds the optional `site` argument to site tools. */
export function toolJsonSchema(t: McpTool, boundSite?: string | null): Record<string, unknown> {
  const s = z.toJSONSchema(t.schema, { io: "input" }) as Record<string, unknown>;
  delete s.$schema;
  return boundSite && !t.superAdmin ? withSiteArg(s, boundSite) : s;
}
