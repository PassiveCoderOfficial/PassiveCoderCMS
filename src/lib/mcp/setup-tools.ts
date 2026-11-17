import { z } from "zod";
import { creditEditableFor } from "@/lib/site/footer-credit";
import { sanitizeCreditText, sanitizeCreditUrl } from "@/lib/site/footer-credit-shared";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";
import { saveGlobalLayoutUpsert } from "@/lib/site/global-layout";
import { toBlocks } from "@/lib/site/global-blocks";
import { LINK_RE } from "@/lib/mcp/layout-patch";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block, BlockType, NavItem } from "@/types/cms";
import { findItem, newNavId, normalizeMenu, structureLostByReplace } from "@/modules/navigation/menu-model";
import { refUrlFor, type RefRow } from "@/modules/navigation/menu-refs";
import { listMenuVersions, recordNewMenu, restoreMenuVersion, saveMenuWithHistory, type MenuRow } from "@/modules/navigation/menu-versions";
import { countItems } from "@/modules/navigation/menu-history";

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

const TARGET_KINDS = ["home", "page", "post", "product", "service", "service_group", "category", "url"] as const;
type TargetKind = (typeof TARGET_KINDS)[number];

const target = z.object({
  kind: z.enum(TARGET_KINDS).describe("home; page / post (pageId); product, service, service_group, category (id); url (url). Pages, posts, products, services and categories are linked by id, so the menu follows later renames."),
  pageId: z.string().uuid().optional(),
  id: z.string().uuid().optional().describe("Record id for product, service, service_group or category (also accepted for page and post)."),
  url: z.string().max(500).optional(),
});

export type MenuItemIn = {
  id?: string;
  label: string;
  target: z.infer<typeof target>;
  newTab?: boolean;
  audience?: "everyone" | "guests" | "members";
  labels?: Record<string, string>;
  children?: MenuItemIn[];
};

const itemFields = {
  id: z.string().max(60).optional().describe("Existing item id (from list_menus) to keep that item and its settings (icon, badge, mega menu...). Omit for a new item."),
  label: z.string().min(1).max(80),
  target,
  newTab: z.boolean().optional(),
  audience: z.enum(["everyone", "guests", "members"]).optional().describe("Who sees the item: everyone (default), guests (not signed in) or members (signed-in customers)."),
  labels: z.record(z.string().regex(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/), z.string().min(1).max(80)).optional().describe("Label per language code, e.g. { \"bn\": \"...\" }, shown on pages in that language."),
};
const leaf = z.object(itemFields);
const level2 = z.object({ ...itemFields, children: z.array(leaf).max(40).optional() });
export const menuItem = z.object({ ...itemFields, children: z.array(level2).max(40).optional().describe("Sub-items (dropdown); sub-items can have their own children (3 levels in all).") });

const KIND_TABLE: Record<Exclude<TargetKind, "home" | "url">, { table: string; cols: string }> = {
  page: { table: "pages", cols: "id, slug, type, status, deleted_at" },
  post: { table: "pages", cols: "id, slug, type, status, deleted_at" },
  product: { table: "products", cols: "id, slug" },
  service: { table: "service_items", cols: "id, link" },
  service_group: { table: "service_groups", cols: "id, slug" },
  category: { table: "categories", cols: "id, slug" },
};

/**
 * Menu items in the shape the Navigation screen saves (NavItem). Pages,
 * posts, products, services and categories are stored by id (kind + ref, menus
 * P1) with today's address as url. An item sent with the id of an item the
 * menu already has keeps that item's other settings (icon, badge, mega menu,
 * audience...), so the AI can rename or move items without wiping them.
 */
export async function toNavItems(ctx: McpCtx, items: MenuItemIn[], existing: NavItem[] = []): Promise<NavItem[]> {
  // Ids per kind across the whole tree, one query per kind.
  const want = new Map<string, Set<string>>();
  const walk = (list: MenuItemIn[]) => {
    for (const i of list) {
      const k = i.target.kind;
      if (k !== "home" && k !== "url") {
        const id = (k === "page" || k === "post" ? i.target.pageId ?? i.target.id : i.target.id) ?? fail(`"${i.label}": target.${k === "page" || k === "post" ? "pageId" : "id"} is required for kind "${k}"`);
        const table = KIND_TABLE[k].table;
        (want.get(table) ?? want.set(table, new Set()).get(table)!).add(id);
      }
      if (i.children) walk(i.children);
    }
  };
  walk(items);
  const rows = new Map<string, RefRow & { deleted_at?: string | null }>();
  for (const [table, ids] of want) {
    const cols = Object.values(KIND_TABLE).find((x) => x.table === table)!.cols;
    let q = ctx.supabase.from(table).select(cols).eq("tenant_id", ctx.tenantId).in("id", [...ids]);
    if (table === "pages") q = q.is("deleted_at", null);
    const { data } = await q;
    for (const r of (data ?? []) as unknown as (RefRow & { deleted_at?: string | null })[]) rows.set(`${table}:${r.id}`, r);
  }

  const build = (list: MenuItemIn[]): NavItem[] => list.map((i) => {
    const k = i.target.kind;
    let url = "/";
    let link: Pick<NavItem, "kind" | "ref"> = {};
    if (k === "url") {
      url = (i.target.url ?? "").trim() || fail(`"${i.label}": target.url is required for kind "url"`);
      if (!LINK_RE.test(url)) fail(`"${i.label}": url must start with https://, /, #, mailto: or tel:`);
    } else if (k !== "home") {
      const id = (k === "page" || k === "post" ? i.target.pageId ?? i.target.id : i.target.id)!;
      const row = rows.get(`${KIND_TABLE[k].table}:${id}`) ?? fail(`"${i.label}": ${k === "page" || k === "post" ? "page" : k.replace("_", " ")} ${id} not found on this site`);
      const kind = k === "page" || k === "post" ? (row.type === "post" ? "post" : "page") : k;
      url = refUrlFor(kind, row) ?? fail(`"${i.label}": ${k} ${id} has no address`);
      link = { kind, ref: id };
    }
    // Same item id as one already in the menu: keep its other settings.
    const prev = i.id ? findItem(existing, i.id) : null;
    const base: NavItem = prev ? { ...prev } : { id: i.id || genId(), label: i.label, url };
    if (prev) delete (base as Partial<NavItem>).children;
    const next: NavItem & Record<string, unknown> = { ...base, id: base.id || newNavId(), label: i.label, url };
    if (link.kind) { next.kind = link.kind; next.ref = link.ref; } else { delete next.kind; delete next.ref; }
    const external = /^https?:\/\//i.test(url);
    if (i.newTab === true || (i.newTab === undefined && !prev && external)) next.target = "_blank";
    else if (i.newTab === false) delete next.target;
    if (i.audience === "guests" || i.audience === "members") next.audience = i.audience;
    else if (i.audience === "everyone") delete next.audience;
    if (i.labels) next.labels = i.labels;
    // children omitted on a kept item: its sub-menu stays as it is. [] removes it.
    if (i.children !== undefined) next.children = build(i.children);
    else if (prev?.children) next.children = prev.children;
    return next;
  });
  return normalizeMenu(build(items));
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
    description: "List the site's navigation menus with their location (header, footer, footer_secondary, mobile, sidebar, legal, or none) and items (a tree up to 3 levels). An item with kind + ref links to that page, post, product, service or category by id (url = its address when last saved; the live site always uses the current one). audience: guests / members; labels: label per language. Mega menus: a top-level item with megaMenu, megaColumns (2-6) and mega { cards: up to 2 featured cards, width: container | full }; its second-level items are the columns (megaColumn, megaSpan 2 = double width, megaImage) and their children the links. Send item ids to upsert_menu to keep all of these.",
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
    description: "Create a menu (omit id) or replace an existing one's name, location and items. Items can nest 3 levels (children), and link to the home page, a page or blog post (pageId), a product, service, service category or product category (id), or a URL; links to records are stored by id so renames never break them. Send an item's existing id (from list_menus) to keep its other settings (icon, badge, mega menu, auto list...). A replace that would drop sub-menus, auto lists, mega-menu settings or per-language labels the menu has is refused unless replace: true. Every save is kept in the menu's history (list_menu_versions, restore_menu_version undoes it). A location holds one menu: assigning one that is taken unassigns the menu that had it. location null = not placed. A header or block shows the menu at a location only when it is set to read that location (get_site_layout shows this). Goes live immediately.",
    schema: z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(80),
      location: z.enum(LOCATIONS).nullable(),
      items: z.array(menuItem).max(50),
      replace: z.boolean().optional().describe("Confirm a replace that drops sub-menus, auto lists, mega-menu settings or per-language labels (they are lost; restore_menu_version can bring them back)."),
    }),
    write: true,
    run: async (a: { id?: string; name: string; location: (typeof LOCATIONS)[number] | null; items: MenuItemIn[]; replace?: boolean }, ctx) => {
      const location = a.location ?? "none";
      let existing: NavItem[] = [];
      if (a.id) {
        const { data } = await ctx.supabase.from("nav_menus").select("id, items").eq("id", a.id).eq("tenant_id", ctx.tenantId).maybeSingle();
        if (!data) fail("Menu not found on this site");
        existing = normalizeMenu((data as { items?: unknown }).items);
      }
      const items = await toNavItems(ctx, a.items, existing);
      if (a.id) {
        // Never wipe structure by accident (dropdowns, auto lists, mega menus, translations).
        const lost = structureLostByReplace(existing, items);
        if (lost.length && a.replace !== true) {
          fail(`This menu has ${lost.join(", ")}, which these items would delete. Send the existing items with their ids and children (list_menus), edit it on the Navigation screen, or send replace: true to replace it anyway.`);
        }
      }
      const now = new Date().toISOString();
      // One menu per location, as on the Navigation screen: free the slot.
      if (location !== "none") {
        let q = ctx.supabase.from("nav_menus").update({ location: "none", updated_at: now }).eq("tenant_id", ctx.tenantId).eq("location", location);
        if (a.id) q = q.neq("id", a.id);
        await q;
      }
      const source = ctx.via === "app" ? "app" : "mcp";
      const row = { name: a.name.trim(), slug: slugify(a.name), location, items };
      if (a.id) {
        const res = await saveMenuWithHistory(ctx.supabase, { tenantId: ctx.tenantId, menuId: a.id, patch: row, userId: ctx.userId, source });
        if (!res.menu) fail(res.error ?? "Menu not found on this site");
        const m = res.menu;
        return { id: m.id, name: m.name, location: m.location, items: m.items };
      }
      const { data, error } = await ctx.supabase.from("nav_menus").insert({ ...row, updated_at: now, tenant_id: ctx.tenantId, template_id: null }).select("id, tenant_id, name, location, items").single();
      if (error) fail(error.message);
      await recordNewMenu(ctx.supabase, data as MenuRow, ctx.userId, source);
      const m = data as MenuRow;
      return { id: m.id, name: m.name, location: m.location, items: m.items };
    },
  },
  {
    name: "list_menu_versions",
    title: "List menu history",
    description: "Earlier versions of one menu, newest first (every save from the dashboard, MCP or a restore is kept; the newest 50 per menu). The first entry is what the site shows now. Use restore_menu_version to put one back.",
    schema: z.object({ menuId: z.string().uuid() }),
    write: false,
    run: async (a: { menuId: string }, ctx) => {
      const { data: menu } = await ctx.supabase.from("nav_menus").select("id").eq("id", a.menuId).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (!menu) fail("Menu not found on this site");
      const versions = await listMenuVersions(ctx.supabase, ctx.tenantId, a.menuId);
      if (versions === null) return { enabled: false, note: "Menu history is not switched on for this platform yet.", versions: [] };
      return { enabled: true, versions: versions.map((v) => ({ id: v.id, savedAt: v.created_at, source: v.source, savedBy: v.saved_by, name: v.name, items: countItems(v.items) })) };
    },
  },
  {
    name: "restore_menu_version",
    title: "Restore a menu version",
    description: "Put an earlier version of a menu back (versionId from list_menu_versions), or undo: true to go one step back (the newest version that differs from the menu now). The restore is itself a saved version, so it can be undone. Goes live immediately.",
    schema: z.object({ menuId: z.string().uuid(), versionId: z.string().uuid().optional(), undo: z.boolean().optional() }),
    write: true,
    run: async (a: { menuId: string; versionId?: string; undo?: boolean }, ctx) => {
      if (!a.undo === !a.versionId) fail("Pass either versionId or undo: true.");
      const res = await restoreMenuVersion(ctx.supabase, { tenantId: ctx.tenantId, menuId: a.menuId, versionId: a.undo ? "undo" : a.versionId!, userId: ctx.userId });
      if (!res.menu) fail(res.error ?? "Could not restore this version");
      return { restored: res.restored?.id, savedAt: res.restored?.created_at, id: res.menu.id, name: res.menu.name, items: res.menu.items };
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
