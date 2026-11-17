import { z } from "zod";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";
import { saveGlobalLayoutUpsert, upsertSiteIdentity } from "@/lib/site/global-layout";
import { toBlocks } from "@/lib/site/global-blocks";
import { findFooterBlock } from "@/lib/site/footer-merge";
import { createBlock } from "@/modules/page-builder/block-registry";
import type { Block, BlockType, FooterBlockProps, HeaderNavBlockProps } from "@/types/cms";
import {
  ACTIVE_STYLES, DROPDOWN_LOOKS, HOVER_STYLES, MENU_LAYOUTS, MENU_PRESETS, normalizeMenuStyle, type MenuLayout, type MenuStyle,
} from "@/modules/navigation/menu-style";
import { menuReaders, menuUsage } from "@/modules/navigation/menu-usage";
import { isNavBlock } from "@/modules/navigation/nav-blocks";
import * as HDoc from "@/modules/header-studio/doc";
import { ROW_KEYS, ZONES, addElement, allElements, findElement, makeElement, menuRefs, updateElement, type HeaderRowKey, type HeaderZone } from "@/modules/header-studio/model";
import * as FDoc from "@/modules/footer-studio/doc";
import { MAX_COLUMNS, addWidget, findWidget, footerMenuRefs, makeWidget, updateWidget, type FooterConfig } from "@/modules/footer-studio/model";

/**
 * MCP: placing a saved menu (menus P2, Nov 2026). A menu is shown by id in a
 * Header Studio zone, a Footer Studio column, a column of the classic footer
 * block, or a page "Menu" block, each with its own look (MenuStyle). Same
 * rules as the other MCP tools: every query filters by ctx.tenantId, input is
 * zod-validated, errors throw. Imports nothing that needs the Next.js
 * runtime, so tests run these against a fake client (tests/mcp).
 *
 * Studio headers and footers keep their draft / publish rule: a placement
 * edits the draft, and goes live only with publish: true.
 */

function fail(msg: string): never {
  throw new Error(msg);
}

const uuid = z.string().uuid();

export const menuStyleSchema = z.object({
  preset: z.enum(MENU_PRESETS).optional().describe("Starting look: plain, underline, pill, boxed, brand, caps, bold, soft."),
  fontSize: z.number().min(11).max(28).optional().describe("px"),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800)]).optional(),
  letterSpacing: z.number().min(-0.05).max(0.3).optional().describe("em"),
  uppercase: z.boolean().optional(),
  gap: z.number().min(0).max(64).optional().describe("Space between items, px"),
  padX: z.number().min(0).max(40).optional(),
  padY: z.number().min(0).max(24).optional(),
  radius: z.number().min(0).max(999).optional(),
  color: z.string().max(60).optional().describe("#hex, rgb(), hsl() or var(--x). Unset = the colour of where the menu sits."),
  hoverColor: z.string().max(60).optional(),
  hoverBg: z.string().max(60).optional(),
  activeColor: z.string().max(60).optional(),
  activeBg: z.string().max(60).optional(),
  hover: z.enum(HOVER_STYLES).optional(),
  active: z.enum(ACTIVE_STYLES).optional().describe("How the current page shows."),
  dropdown: z.object({
    look: z.enum(DROPDOWN_LOOKS).optional(), radius: z.number().min(0).max(32).optional(),
    shadow: z.enum(["none", "sm", "md", "lg"]).optional(), width: z.number().min(160).max(480).optional(),
    bg: z.string().max(60).optional(), fg: z.string().max(60).optional(), animation: z.enum(["fade", "slide", "none"]).optional(),
  }).optional(),
  phone: z.object({ drawer: z.enum(["side", "full", "dropdown"]).optional(), size: z.enum(["sm", "md", "lg"]).optional(), dividers: z.boolean().optional() }).optional(),
}).describe("The menu's look in this place (the menu itself is unchanged). Unset = the place's default look.");

const WHERE = ["header_studio", "footer_studio", "footer_block", "page"] as const;
type Where = (typeof WHERE)[number];

export type PlaceMenuArgs = {
  menuId: string;
  where: Where;
  style?: MenuStyle | null;
  publish?: boolean;
  row?: HeaderRowKey;
  zone?: HeaderZone;
  elementId?: string;
  column?: number;
  widgetId?: string;
  layout?: MenuLayout | "list" | "inline" | "columns";
  levels?: number;
  title?: string;
  pageId?: string;
  blockId?: string;
  afterBlockId?: string;
  align?: "start" | "center" | "end";
};

async function menuOf(ctx: McpCtx, id: string) {
  const { data } = await ctx.supabase.from("nav_menus").select("id, name, items").eq("id", id).eq("tenant_id", ctx.tenantId).maybeSingle();
  return (data as { id: string; name: string; items: unknown } | null) ?? fail("Menu not found on this site (list_menus shows its menus).");
}

async function identity(ctx: McpCtx, col: string) {
  const { data, error } = await ctx.supabase.from("site_identity").select(col).eq("tenant_id", ctx.tenantId).maybeSingle();
  if (error) fail(/column|does not exist/i.test(error.message) ? "The Header & Footer Studio is not switched on for this platform yet." : error.message);
  return (data as Record<string, unknown> | null)?.[col];
}

/** A style as stored: cleaned, or undefined (null / {} = the place's default look). */
function cleanStyle(style: MenuStyle | null | undefined): MenuStyle | undefined {
  return style ? normalizeMenuStyle(style) ?? undefined : undefined;
}

async function placeHeader(ctx: McpCtx, a: PlaceMenuArgs) {
  const doc = HDoc.normalizeDoc(await identity(ctx, "header_studio"));
  const cfg = HDoc.resolveEditorHeader(doc) ?? fail("This site has no Studio header yet. Build one in Header Builder > Studio (or use where: \"page\" / the classic header's menu location).");
  const style = cleanStyle(a.style);
  let next = cfg;
  let elementId = a.elementId;
  if (elementId) {
    const at = findElement(cfg, elementId) ?? fail(`No element ${elementId} in the Studio header (list_menu_placements shows the menu elements).`);
    if (at.element.type !== "menu") fail(`Element ${elementId} is a ${at.element.type}, not a menu.`);
    next = updateElement(cfg, elementId, { menuId: a.menuId, ...(a.style !== undefined ? { menuStyle: style } : {}) });
  } else {
    const row = a.row ?? "main";
    const zone = a.zone ?? "center";
    const el = makeElement("menu", { menuId: a.menuId, ...(style ? { menuStyle: style } : {}) });
    next = addElement(cfg, row, zone, el);
    if (next === cfg) fail(`The ${row} row's ${zone} zone is full. Pick another zone or replace a menu element (elementId).`);
    if (!next.rows[row].enabled) next = { ...next, rows: { ...next.rows, [row]: { ...next.rows[row], enabled: true } } };
    elementId = el.id;
  }
  const saved = a.publish ? HDoc.publish(doc, next, undefined, ctx.userId) : HDoc.saveDraft(doc, next);
  const error = await upsertSiteIdentity(ctx.supabase, ctx.tenantId, { header_studio: saved });
  if (error) fail(error);
  return { placed: "header_studio", elementId, live: !!a.publish, note: a.publish ? "Published: the Studio header is live." : "Saved in the Studio header draft. Publish it (publish: true, or Header Builder > Studio) to make it live." };
}

async function placeFooterStudio(ctx: McpCtx, a: PlaceMenuArgs) {
  const doc = FDoc.normalizeDoc(await identity(ctx, "footer_studio"));
  const cfg: FooterConfig = FDoc.resolveEditorFooter(doc) ?? fail("This site has no Studio footer yet. Build one in Header Builder > Footer Studio (or use where: \"footer_block\").");
  const style = cleanStyle(a.style);
  const layout = a.layout === "inline" || a.layout === "columns" ? a.layout : undefined;
  const levels = a.levels && a.levels > 1 ? 2 : undefined;
  let next = cfg;
  let widgetId = a.widgetId;
  if (widgetId) {
    const at = findWidget(cfg, widgetId) ?? fail(`No widget ${widgetId} in the Studio footer.`);
    if (at.widget.type !== "menu") fail(`Widget ${widgetId} is a ${at.widget.type}, not a menu.`);
    next = updateWidget(cfg, widgetId, {
      menuId: a.menuId, ...(a.style !== undefined ? { menuStyle: style } : {}), ...(a.layout ? { layout } : {}), ...(a.levels ? { levels } : {}), ...(a.title !== undefined ? { title: a.title } : {}),
    });
  } else {
    const column = a.column ?? 0;
    if (column < 0 || column >= Math.min(MAX_COLUMNS, cfg.columns.length)) fail(`The Studio footer has ${cfg.columns.length} columns (0 to ${cfg.columns.length - 1}).`);
    const w = makeWidget("menu", { menuId: a.menuId, ...(style ? { menuStyle: style } : {}), ...(layout ? { layout } : {}), ...(levels ? { levels } : {}), ...(a.title ? { title: a.title } : {}) });
    next = addWidget(cfg, { where: "column", column }, w);
    if (next === cfg) fail(`Column ${column} is full. Pick another column or replace a menu widget (widgetId).`);
    widgetId = w.id;
  }
  const saved = a.publish ? FDoc.publish(doc, next, undefined, ctx.userId) : FDoc.saveDraft(doc, next);
  const error = await upsertSiteIdentity(ctx.supabase, ctx.tenantId, { footer_studio: saved });
  if (error) fail(error);
  return { placed: "footer_studio", widgetId, live: !!a.publish, note: a.publish ? "Published: the Studio footer is live." : "Saved in the Studio footer draft. Publish it (publish: true, or Header Builder > Footer Studio) to make it live." };
}

async function placeFooterBlock(ctx: McpCtx, a: PlaceMenuArgs) {
  const blocks = toBlocks(await identity(ctx, "global_footer"));
  const footer = findFooterBlock(blocks) as FooterBlockProps | null ?? fail("This site's footer has no footer block (get_site_layout shows the footer).");
  const cols = [...(footer.data.columns ?? [])];
  const levels = a.levels && a.levels > 1 ? 2 : undefined;
  let index = a.column;
  if (index === undefined) {
    // A new column at the end, headed by the title (or the menu's name).
    const menu = await menuOf(ctx, a.menuId);
    cols.push({ id: `col-${Math.random().toString(36).slice(2, 9)}`, heading: a.title ?? menu.name, links: [], menuId: a.menuId, ...(levels ? { menuLevels: levels } : {}) });
    index = cols.length - 1;
  } else {
    if (index < 0 || index >= cols.length) fail(`The footer has ${cols.length} link columns (0 to ${cols.length - 1}); leave column out to add a new one.`);
    const c = { ...cols[index], menuId: a.menuId } as (typeof cols)[number];
    if (levels) c.menuLevels = levels; else delete c.menuLevels;
    if (a.title !== undefined) c.heading = a.title;
    cols[index] = c;
  }
  const next = blocks.map((b) => (b === (footer as unknown as Block) ? { ...footer, data: { ...footer.data, columns: cols } } as Block : b));
  const error = await saveGlobalLayoutUpsert(ctx.supabase, ctx.tenantId, { global_footer: next });
  if (error) fail(error);
  return { placed: "footer_block", column: index, live: true, note: "Live now: the footer column shows the menu's links (its typed links are kept and come back if the menu is removed)." };
}

async function placePage(ctx: McpCtx, a: PlaceMenuArgs) {
  if (!a.pageId) fail("pageId is required for where: \"page\".");
  const { data: page } = await ctx.supabase.from("pages").select("id, blocks, draft_blocks, draft_rev")
    .eq("id", a.pageId).eq("tenant_id", ctx.tenantId).is("deleted_at", null).maybeSingle();
  if (!page) fail("Page not found on this site");
  const p = page as { blocks?: Block[] | null; draft_blocks?: Block[] | null; draft_rev?: number | null };
  const blocks = [...((p.draft_blocks ?? p.blocks ?? []) as Block[])];
  const layout: MenuLayout = MENU_LAYOUTS.includes(a.layout as MenuLayout) ? (a.layout as MenuLayout) : "bar";
  const style = cleanStyle(a.style);
  const fields: Partial<HeaderNavBlockProps["data"]> = {
    menuId: a.menuId, layout,
    ...(style ? { menuStyle: style } : {}),
    ...(a.align && a.align !== "start" ? { align: a.align } : {}),
    ...(a.levels ? { levels: Math.min(3, Math.max(1, a.levels)) } : {}),
    ...(a.title ? { label: a.title } : {}),
  };
  let blockId = a.blockId;
  if (blockId) {
    const i = blocks.findIndex((b) => b.id === blockId);
    if (i < 0) fail(`Block ${blockId} is not a top-level block of this page.`);
    if (!isNavBlock(blocks[i]) || blocks[i].type !== "header_nav") fail(`Block ${blockId} is a ${blocks[i].type}, not a Menu block.`);
    const cur = blocks[i] as HeaderNavBlockProps;
    const data = { ...cur.data, ...fields } as Record<string, unknown>;
    if (a.style === null) delete data.menuStyle;
    blocks[i] = { ...cur, data } as Block;
  } else {
    const b = createBlock("header_nav" as BlockType) as HeaderNavBlockProps;
    b.data = { ...b.data, ...fields } as HeaderNavBlockProps["data"];
    const at = a.afterBlockId ? blocks.findIndex((x) => x.id === a.afterBlockId) : blocks.length - 1;
    if (a.afterBlockId && at < 0) fail(`Block ${a.afterBlockId} is not on this page.`);
    blocks.splice(at + 1, 0, b as Block);
    blockId = b.id;
  }
  const { data, error } = await ctx.supabase.rpc("save_page_blocks", { p_id: a.pageId, p_blocks: blocks.map((b, i) => ({ ...b, order: i })), p_expected_rev: p.draft_rev ?? null });
  if (error) fail(error.message.includes("page_conflict") ? "Someone else edited this page since it was read. Try again." : error.message);
  const row = (Array.isArray(data) ? data[0] : data) as { rev: number; has_draft: boolean } | null;
  return { placed: "page", blockId, draftRev: row?.rev, isDraft: !!row?.has_draft, note: row?.has_draft ? "Saved as draft. Call publish_page to make it live." : "Saved." };
}

export const MENU_PLACE_TOOLS: McpTool[] = [
  {
    name: "place_menu",
    title: "Place a menu",
    description: "Show a saved menu (menuId from list_menus) somewhere, by id, with its own look. where: \"header_studio\" = a menu element in a Studio header zone (row top/main/menu, zone left/center/right; or elementId to change an existing menu element) - saved to the Studio draft, live with publish: true; \"footer_studio\" = a menu widget in a Studio footer column (column 0-based, or widgetId; layout list/inline/columns; levels 1-2) - draft, live with publish: true; \"footer_block\" = a link column of the classic footer block shows the menu instead of its typed links (column 0-based, or leave it out to add a new column headed by title) - live at once; \"page\" = a Menu block on a page (pageId; afterBlockId to insert after a block, or blockId to change an existing Menu block; layout bar/vertical/inline/accordion/drawer; align; levels) - a draft on published pages, then publish_page. style = the look in that place (preset plus overrides); null resets it to the default look. The menu's own links are edited with upsert_menu, never here. list_menu_placements shows where each menu is shown.",
    schema: z.object({
      menuId: uuid,
      where: z.enum(WHERE),
      style: menuStyleSchema.nullable().optional(),
      publish: z.boolean().optional().describe("Studio header / footer only: publish the Studio draft now."),
      row: z.enum(ROW_KEYS).optional(),
      zone: z.enum(ZONES).optional(),
      elementId: z.string().max(40).optional(),
      column: z.number().int().min(0).max(20).optional(),
      widgetId: z.string().max(40).optional(),
      layout: z.enum([...MENU_LAYOUTS, "list", "columns"] as [string, ...string[]]).optional(),
      levels: z.number().int().min(1).max(3).optional(),
      title: z.string().max(80).optional().describe("Footer column / widget heading, or the page Menu block's name for screen readers."),
      pageId: uuid.optional(),
      blockId: z.string().max(80).optional(),
      afterBlockId: z.string().max(80).optional(),
      align: z.enum(["start", "center", "end"]).optional(),
    }),
    write: true,
    run: async (a: PlaceMenuArgs, ctx) => {
      await menuOf(ctx, a.menuId);
      switch (a.where) {
        case "header_studio": return placeHeader(ctx, a);
        case "footer_studio": return placeFooterStudio(ctx, a);
        case "footer_block": return placeFooterBlock(ctx, a);
        case "page": return placePage(ctx, a);
        default: return fail("Unknown place");
      }
    },
  },
  {
    name: "list_menu_placements",
    title: "Where menus are shown",
    description: "For each saved menu (by id): where the live site shows it (classic header, footer, pre-footer, pages, Studio header, Studio footer; empty = not shown anywhere), plus the menu elements of the Studio header and the menu widgets of the Studio footer (draft and live) with their ids, for place_menu.",
    schema: z.object({}),
    write: false,
    run: async (_a: never, ctx) => {
      const [{ data: menus }, { data: ident }, { data: pages }] = await Promise.all([
        ctx.supabase.from("nav_menus").select("id, name, location").eq("tenant_id", ctx.tenantId),
        ctx.supabase.from("site_identity").select("global_header, global_footer, global_prefooter").eq("tenant_id", ctx.tenantId).maybeSingle(),
        ctx.supabase.from("pages").select("blocks").eq("tenant_id", ctx.tenantId).eq("status", "published").is("deleted_at", null).limit(400),
      ]);
      // Own query: the studio columns may be missing (migrations 240/241), which only means "classic".
      const { data: studios } = await ctx.supabase.from("site_identity").select("header_studio, footer_studio").eq("tenant_id", ctx.tenantId).maybeSingle()
        .then((r) => r, () => ({ data: null }));
      const st = (studios ?? {}) as { header_studio?: unknown; footer_studio?: unknown };
      const liveHeader = HDoc.resolveLiveHeader(st.header_studio);
      const liveFooter = FDoc.resolveLiveFooter(st.footer_studio);
      const id = (ident ?? {}) as { global_header?: unknown; global_footer?: unknown; global_prefooter?: unknown };
      const readers = menuReaders({
        classicHeader: id.global_header, classicFooter: id.global_footer, classicPrefooter: id.global_prefooter,
        pages: ((pages ?? []) as { blocks?: unknown }[]).map((p) => p.blocks),
        studioHeaderRefs: liveHeader ? menuRefs(liveHeader) : null,
        studioFooterRefs: liveFooter ? footerMenuRefs(liveFooter) : null,
      });
      const list = (menus ?? []) as { id: string; name: string; location: string | null }[];
      const usage = menuUsage(list, readers);
      const hDoc = HDoc.normalizeDoc(st.header_studio);
      const fDoc = FDoc.normalizeDoc(st.footer_studio);
      const headerEls = (cfg: ReturnType<typeof HDoc.resolveEditorHeader>) => (cfg ? allElements(cfg).filter((e) => e.type === "menu").map((e) => {
        const at = findElement(cfg, e.id)!;
        return { elementId: e.id, row: at.row, zone: at.zone, menuId: e.menuId ?? null, styled: !!e.menuStyle };
      }) : []);
      const footerWidgets = (cfg: FooterConfig | null) => (cfg ? cfg.columns.flatMap((c, column) => c.widgets.filter((w) => w.type === "menu")
        .map((w) => ({ widgetId: w.id, column, menuId: w.menuId ?? null, layout: w.layout ?? "list", styled: !!w.menuStyle }))) : []);
      return {
        menus: list.map((m) => ({ id: m.id, name: m.name, location: m.location, shownIn: usage[m.id] ?? [] })),
        studioHeader: { live: !!liveHeader, draft: headerEls(HDoc.resolveEditorHeader(hDoc)), published: headerEls(hDoc.published) },
        studioFooter: { live: !!liveFooter, draft: footerWidgets(FDoc.resolveEditorFooter(fDoc)), published: footerWidgets(fDoc.published) },
        note: "A menu element or widget with menuId null shows the default menu (the one at location header / footer).",
      };
    },
  },
];
