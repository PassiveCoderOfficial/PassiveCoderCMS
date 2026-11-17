import { z } from "zod";
import { creditEditableFor } from "@/lib/site/footer-credit";
import { sanitizeCreditText, sanitizeCreditUrl } from "@/lib/site/footer-credit-shared";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";
import { saveGlobalLayoutUpsert } from "@/lib/site/global-layout";
import { toBlocks } from "@/lib/site/global-blocks";
import { LINK_RE } from "@/lib/mcp/layout-patch";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block, BlockType, NavItem } from "@/types/cms";
import { structureLostByFlatReplace } from "@/modules/navigation/menu-model";

/**
 * MCP tools for preparing a site without the dashboard: menus, the site
 * header, and trashing a page (2026-10-16). Same rules as tools.ts: every
 * query filters by ctx.tenantId, inputs are zod-validated, errors throw.
 *
 * Imports nothing that needs the Next.js runtime, so tests can run these
 * against a fake client (tests/mcp).
 */

function fail(msg: string): never {
  throw new Error(msg);
}

const AREAS = ["header", "footer", "prefooter"] as const;
type Area = (typeof AREAS)[number];
const AREA_COL = { header: "global_header", footer: "global_footer", prefooter: "global_prefooter" } as const;
export const LOCATIONS = ["header", "footer", "footer_secondary", "mobile", "sidebar", "legal"] as const;
const genId = () => Math.random().toString(36).slice(2, 11);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "menu";

export const menuItem = z.object({
  label: z.string().min(1).max(80),
  target: z.object({
    kind: z.enum(["home", "page", "url"]),
    pageId: z.string().uuid().optional(),
    url: z.string().max(500).optional(),
  }),
});
export type MenuItemIn = z.infer<typeof menuItem>;

/** Menu items in the shape the Navigation screen saves (NavItem: id, label, url). */
export async function toNavItems(ctx: McpCtx, items: MenuItemIn[]): Promise<NavItem[]> {
  const pageIds = items.filter((i) => i.target.kind === "page").map((i) => i.target.pageId ?? fail(`"${i.label}": target.pageId is required for kind "page"`));
  const slugs = new Map<string, string>();
  if (pageIds.length) {
    const { data } = await ctx.supabase.from("pages").select("id, slug").eq("tenant_id", ctx.tenantId).is("deleted_at", null).in("id", pageIds);
    for (const p of (data ?? []) as { id: string; slug: string }[]) slugs.set(p.id, p.slug);
  }
  return items.map((i) => {
    let url = "/";
    if (i.target.kind === "page") {
      const slug = slugs.get(i.target.pageId!) ?? fail(`"${i.label}": page ${i.target.pageId} not found on this site`);
      url = slug === "home" ? "/" : `/${slug}`;
    } else if (i.target.kind === "url") {
      url = (i.target.url ?? "").trim() || fail(`"${i.label}": target.url is required for kind "url"`);
      if (!LINK_RE.test(url)) fail(`"${i.label}": url must start with https://, /, #, mailto: or tel:`);
    }
    return { id: genId(), label: i.label, url, ...(/^https?:\/\//i.test(url) ? { target: "_blank" as const } : {}) };
  });
}

/** The standard header: the Menu Bar block reading the site's header menu. */
export function navMenuHeader(brandText: string): Block[] {
  const nav = createBlock("navigation" as BlockType) as Block & { data: Record<string, unknown> };
  nav.data = { ...nav.data, logoText: brandText, menuLocation: "header", items: [], showCta: false };
  return [{ ...nav, order: 0 } as Block];
}

export const SETUP_TOOLS: McpTool[] = [
  // ── Menus ──────────────────────────────────────────────────────────────
  {
    name: "list_menus",
    title: "List menus",
    description: "List the site's navigation menus with their location (header, footer, footer_secondary, mobile, sidebar, legal, or none) and items.",
    schema: z.object({}),
    write: false,
    run: async (_a: never, ctx) => {
      const { data } = await ctx.supabase.from("nav_menus").select("id, name, slug, location, items, updated_at")
        .eq("tenant_id", ctx.tenantId).order("location");
      return data ?? [];
    },
  },
  {
    name: "upsert_menu",
    title: "Create or update menu",
    description: "Create a menu (omit id) or replace an existing one's name, location and items. Items are a flat list (no dropdowns): each links to the home page, a page of this site (pageId) or a URL. Replacing a menu that has dropdowns, auto lists or mega-menu settings is refused unless replace: true (they would be lost; edit those on the Navigation screen). A location holds one menu: assigning one that is taken unassigns the menu that had it. location null = not placed. A header or block shows the menu at a location only when it is set to read that location (get_site_layout shows this).",
    schema: z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(80),
      location: z.enum(LOCATIONS).nullable(),
      items: z.array(menuItem).max(50),
      replace: z.boolean().optional().describe("Confirm replacing a menu that has dropdowns, auto lists or mega-menu settings with this flat list (they are lost)."),
    }),
    write: true,
    run: async (a: { id?: string; name: string; location: (typeof LOCATIONS)[number] | null; items: MenuItemIn[]; replace?: boolean }, ctx) => {
      const location = a.location ?? "none";
      const items = await toNavItems(ctx, a.items);
      const now = new Date().toISOString();
      if (a.id) {
        const { data: existing } = await ctx.supabase.from("nav_menus").select("id, items").eq("id", a.id).eq("tenant_id", ctx.tenantId).maybeSingle();
        if (!existing) fail("Menu not found on this site");
        // Flat items would silently wipe dropdowns and studio settings.
        const lost = structureLostByFlatReplace((existing as { items?: unknown }).items);
        if (lost.length && a.replace !== true) {
          fail(`This menu has ${lost.join(", ")}, which a flat list of items would delete. Edit it on the Navigation screen, or send replace: true to replace it anyway.`);
        }
      }
      // One menu per location, as on the Navigation screen: free the slot.
      if (location !== "none") {
        let q = ctx.supabase.from("nav_menus").update({ location: "none", updated_at: now }).eq("tenant_id", ctx.tenantId).eq("location", location);
        if (a.id) q = q.neq("id", a.id);
        await q;
      }
      const row = { name: a.name.trim(), slug: slugify(a.name), location, items, updated_at: now };
      const { data, error } = a.id
        ? await ctx.supabase.from("nav_menus").update(row).eq("id", a.id).eq("tenant_id", ctx.tenantId).select("id, name, location, items").maybeSingle()
        : await ctx.supabase.from("nav_menus").insert({ ...row, tenant_id: ctx.tenantId, template_id: null }).select("id, name, location, items").single();
      if (error) fail(error.message);
      return data ?? fail("Menu not found on this site");
    },
  },

  // ── Site header ────────────────────────────────────────────────────────
  {
    name: "get_site_header",
    title: "Get site header or footer",
    description: "Get the blocks of the site-wide header (shown on every page) as an array, ready to edit and send back to set_site_header. Pass area: \"footer\" (or \"prefooter\") for the site-wide footer instead. For small changes use update_site_header / update_site_footer; get_site_layout adds a plain summary.",
    schema: z.object({ area: z.enum(AREAS).optional() }),
    write: false,
    run: async (a: { area?: Area }, ctx) => {
      const col = AREA_COL[a.area ?? "header"];
      const { data } = await ctx.supabase.from("site_identity").select(col).eq("tenant_id", ctx.tenantId).maybeSingle();
      // Some sites store a single block object rather than an array: always hand back an array.
      const blocks = toBlocks((data as Record<string, unknown> | null)?.[col]);
      return { area: a.area ?? "header", blocks, ...(blocks.length ? {} : { note: `This site has no site-wide ${a.area ?? "header"} saved yet.` }) };
    },
  },
  {
    name: "set_site_header",
    title: "Set site header",
    description: "Replace the whole site-wide header (to change a few fields, update_site_header is simpler). Either pass `blocks` (an array of header builder block JSON, e.g. from get_site_header; a single block object is accepted too), or `preset: \"nav_menu\"` with `brandText` for the standard header: the site's logo (or brandText) and the menu assigned to the header location (set it with upsert_menu). Phone header row: set data.mobileLayout on the navigation block to \"centered-logo\" (menu left, logo centred, search + cart or call/WhatsApp right), \"menu-left\" (menu + logo left, call + WhatsApp right), \"spaced\" (logo left, even 44px icons, menu last) or \"default\"; desktop is unaffected. Pass area: \"footer\" (or \"prefooter\") with `blocks` to replace the site-wide footer instead (read it first with get_site_header area \"footer\"; update_site_footer edits it in place). Footer credit: set data.credit on the footer block to { show: false } to hide \"Powered by Passive Coder\", or { text, url } (plain text up to 80 chars, http/https link) to change it; Pro, Biz and Custom plans only (Basic always shows the default). Goes live immediately.",
    schema: z.object({
      blocks: z.union([z.array(z.record(z.string(), z.unknown())).max(40), z.record(z.string(), z.unknown())]).optional(),
      preset: z.literal("nav_menu").optional(),
      brandText: z.string().min(1).max(80).optional(),
      area: z.enum(AREAS).optional(),
    }),
    write: true,
    run: async (a: { blocks?: Block[] | Block; preset?: "nav_menu"; brandText?: string; area?: Area }, ctx) => {
      if (!!a.blocks === !!a.preset) fail("Pass either blocks or preset, not both.");
      const area = a.area ?? "header";
      if (area !== "header" && a.preset) fail("preset is for the header only; pass blocks for the footer.");
      let blocks: Block[];
      if (a.preset) blocks = navMenuHeader(a.brandText ?? fail("brandText is required with preset \"nav_menu\""));
      else {
        // get_site_header used to return a stored single object as-is; take it back in either shape.
        blocks = Array.isArray(a.blocks) ? a.blocks : [a.blocks as Block];
        for (const b of blocks) if (!b.id || !b.type) fail("Every block needs an id and a type (start from get_block_template).");
        blocks = blocks.map((b, i) => ({ ...b, order: i }));
      }
      let creditNote: string | undefined;
      if (area === "footer") {
        const editable = await creditEditableFor(ctx.tenantId);
        blocks = blocks.map((b) => {
          const d = b.data as Record<string, unknown> | undefined;
          if (b.type !== "footer" || !d || d.credit === undefined) return b;
          if (!editable) {
            creditNote = "Footer credit is locked on this plan (Basic/trial): data.credit was ignored. Upgrade to Pro to hide or change it.";
            const { credit: _c, ...rest } = d; void _c;
            return { ...b, data: rest } as Block;
          }
          const c = (d.credit ?? {}) as { show?: unknown; text?: unknown; url?: unknown };
          if (c.url !== undefined && c.url !== "" && !sanitizeCreditUrl(c.url)) fail("credit.url must be an http:// or https:// link.");
          const credit = { ...(c.show === false ? { show: false } : {}), ...(sanitizeCreditText(c.text) ? { text: sanitizeCreditText(c.text) } : {}), ...(sanitizeCreditUrl(c.url) ? { url: sanitizeCreditUrl(c.url) } : {}) };
          return { ...b, data: { ...d, credit } } as Block;
        });
      }
      // Creates the site_identity row when the site has none (19 live sites had
      // no row, and this failed with "Open Site Identity in the dashboard once").
      const err = await saveGlobalLayoutUpsert(ctx.supabase, ctx.tenantId, { [AREA_COL[area]]: blocks });
      if (err) fail(err);
      return { saved: true, area, blocks: blocks.length, ...(creditNote ? { creditNote } : {}), ...(a.preset ? { note: "Header shows the menu at location \"header\"." } : {}) };
    },
  },

  // ── Pages ──────────────────────────────────────────────────────────────
  {
    name: "trash_page",
    title: "Move page to trash",
    description: "Move a page or post to the trash (same as Move to trash in the dashboard). It disappears from the site and can be restored from Pages > Trash. There is no permanent delete over MCP.",
    schema: z.object({ pageId: z.string().uuid() }),
    write: true,
    run: async ({ pageId }: { pageId: string }, ctx) => {
      const { data: page } = await ctx.supabase.from("pages").select("id, slug").eq("id", pageId).eq("tenant_id", ctx.tenantId).is("deleted_at", null).maybeSingle();
      if (!page) fail("Page not found on this site");
      if (page.slug === "home") fail("The home page cannot be trashed. Set another page as home first.");
      const { error } = await ctx.supabase.from("pages").update({ deleted_at: new Date().toISOString() }).eq("id", pageId).eq("tenant_id", ctx.tenantId);
      if (error) fail(error.message);
      return { trashed: true, pageId, slug: page.slug };
    },
  },
];
