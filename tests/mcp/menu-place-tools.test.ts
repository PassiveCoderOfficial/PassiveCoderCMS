/**
 * MCP place_menu / list_menu_placements (menus P2): a saved menu placed by id
 * in a Studio header zone, a Studio footer column, a classic footer column
 * or a page Menu block, with its own look; tenant isolation; Studio drafts
 * stay drafts until publish. Run: npm run test:mcp
 */
import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeDb } from "./fake-supabase";
import { MENU_PLACE_TOOLS } from "../../src/lib/mcp/menu-place-tools";
import { MCP_TOOLS } from "../../src/lib/mcp/tools";
import { LAYOUT_TOOLS } from "../../src/lib/tenant/layout-lock";
import { buildPreset } from "../../src/modules/header-studio/presets";
import { buildFooterPreset } from "../../src/modules/footer-studio/presets";
import { allElements, findElement } from "../../src/modules/header-studio/model";
import { findWidget } from "../../src/modules/footer-studio/model";
import type { Block, FooterBlockProps, HeaderNavBlockProps } from "../../src/types/cms";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const MENU_A = "aaaaaaaa-2222-4000-8000-000000000001";
const MENU_B = "bbbbbbbb-2222-4000-8000-000000000002";
const PAGE_A = "aaaaaaaa-1111-4000-8000-000000000001";
const OWNER = "11111111-0000-4000-8000-000000000001";
const FACTS = { phone: "+65 1", whatsapp: "+65 1", email: "a@b.c", socials: 0, shop: false, booking: false };

const tool = (n: string) => MENU_PLACE_TOOLS.find((t) => t.name === n)!;

function seed(extra: Record<string, unknown> = {}) {
  const header = buildPreset("classic", FACTS)!;
  const footerCfg = buildFooterPreset("corporate", { ...FACTS, address: "", hours: false, map: false, legal: [] })!;
  const db = new FakeDb({
    nav_menus: [
      { id: MENU_A, tenant_id: A, name: "Main", location: "header", items: [{ id: "x", label: "Home", url: "/" }] },
      { id: MENU_B, tenant_id: B, name: "B menu", location: "header", items: [] },
    ],
    site_identity: [{
      tenant_id: A,
      global_header: [],
      global_footer: [{ id: "ft", type: "footer", order: 0, data: { columns: [
        { id: "c1", heading: "Company", links: [{ id: "l1", label: "About", url: "/about" }] },
        { id: "c2", heading: "Help", links: [] },
      ] } }],
      global_prefooter: [],
      header_studio: { enabled: false, draft: header, published: null, history: [] },
      footer_studio: { enabled: false, draft: footerCfg, published: null, history: [] },
      ...extra,
    }],
    pages: [{ id: PAGE_A, tenant_id: A, slug: "about", status: "published", deleted_at: null, blocks: [{ id: "hero1", type: "hero", data: {} }], draft_blocks: null, draft_rev: 3 }],
  });
  db.rpcs.save_page_blocks = (args) => {
    const page = db.tables.pages.find((p) => p.id === args.p_id)!;
    page.draft_blocks = args.p_blocks;
    return [{ rev: 4, has_draft: true }];
  };
  return db;
}

const ctx = (db: FakeDb, tenantId = A) => ({ tenantId, userId: OWNER, supabase: db as unknown as SupabaseClient });
const run = (db: FakeDb, name: string, args: Record<string, unknown>, tenantId = A) => tool(name).run(args as never, ctx(db, tenantId)) as Promise<Record<string, unknown>>;
const ident = (db: FakeDb) => db.tables.site_identity.find((r) => r.tenant_id === A)!;

test("place_menu is registered, layout-locked and labelled as a write tool", () => {
  assert.ok(MCP_TOOLS.some((t) => t.name === "place_menu" && t.write));
  assert.ok(MCP_TOOLS.some((t) => t.name === "list_menu_placements" && !t.write));
  assert.ok(LAYOUT_TOOLS.has("place_menu"));
});

test("another site's menu cannot be placed", async () => {
  const db = seed();
  await assert.rejects(run(db, "place_menu", { menuId: MENU_B, where: "page", pageId: PAGE_A }), /Menu not found on this site/);
  assert.equal(db.writes.length, 0);
});

test("page: adds a Menu block by id after a block, saved as a draft, with a cleaned look", async () => {
  const db = seed();
  const res = await run(db, "place_menu", { menuId: MENU_A, where: "page", pageId: PAGE_A, afterBlockId: "hero1", layout: "vertical", style: { preset: "pill", color: "red;}" }, title: "Services menu" });
  assert.equal(res.isDraft, true);
  const blocks = db.tables.pages[0].draft_blocks as Block[];
  assert.equal(blocks[0].id, "hero1");
  const m = blocks[1] as HeaderNavBlockProps;
  assert.equal(m.type, "header_nav");
  assert.equal(m.data.menuId, MENU_A);
  assert.equal(m.data.layout, "vertical");
  assert.deepEqual(m.data.menuStyle, { preset: "pill" });
  assert.equal(m.data.label, "Services menu");
  // Change the same block: new layout, look reset.
  await run(db, "place_menu", { menuId: MENU_A, where: "page", pageId: PAGE_A, blockId: m.id, layout: "inline", style: null });
  const again = (db.tables.pages[0].draft_blocks as Block[])[1] as HeaderNavBlockProps;
  assert.equal(again.data.layout, "inline");
  assert.equal(again.data.menuStyle, undefined);
  await assert.rejects(run(db, "place_menu", { menuId: MENU_A, where: "page", pageId: PAGE_A, blockId: "hero1" }), /not a Menu block/);
});

test("footer_block: a column shows the menu (typed links kept); no column = a new column named after the menu", async () => {
  const db = seed();
  await run(db, "place_menu", { menuId: MENU_A, where: "footer_block", column: 0, levels: 2 });
  let f = (ident(db).global_footer as Block[])[0] as FooterBlockProps;
  assert.equal(f.data.columns[0].menuId, MENU_A);
  assert.equal(f.data.columns[0].menuLevels, 2);
  assert.equal(f.data.columns[0].links.length, 1, "typed links kept as the fallback");
  await run(db, "place_menu", { menuId: MENU_A, where: "footer_block" });
  f = (ident(db).global_footer as Block[])[0] as FooterBlockProps;
  assert.equal(f.data.columns.length, 3);
  assert.equal(f.data.columns[2].heading, "Main");
  assert.equal(f.data.columns[2].menuId, MENU_A);
  await assert.rejects(run(db, "place_menu", { menuId: MENU_A, where: "footer_block", column: 9 }), /link columns/);
});

test("header_studio: adds a styled menu element to the draft; publish makes it live; elementId edits one", async () => {
  const db = seed();
  const res = await run(db, "place_menu", { menuId: MENU_A, where: "header_studio", row: "top", zone: "right", style: { preset: "caps" } });
  const doc = ident(db).header_studio as { enabled: boolean; draft: Parameters<typeof findElement>[0]; published: unknown };
  assert.equal(doc.enabled, false, "still a draft");
  const at = findElement(doc.draft, res.elementId as string)!;
  assert.equal(at.row, "top");
  assert.equal(doc.draft.rows.top.enabled, true, "the row is switched on");
  assert.equal(at.element.menuId, MENU_A);
  assert.deepEqual(at.element.menuStyle, { preset: "caps" });
  const existing = allElements(doc.draft).find((e) => e.type === "menu" && e.id !== res.elementId)!;
  await run(db, "place_menu", { menuId: MENU_A, where: "header_studio", elementId: existing.id, publish: true });
  const live = ident(db).header_studio as { enabled: boolean; published: Parameters<typeof findElement>[0] };
  assert.equal(live.enabled, true);
  assert.equal(findElement(live.published, existing.id)!.element.menuId, MENU_A);
  await assert.rejects(run(db, "place_menu", { menuId: MENU_A, where: "header_studio", elementId: "nope" }), /No element/);
});

test("header_studio / footer_studio without a Studio document say so", async () => {
  const db = seed({ header_studio: null, footer_studio: null });
  await assert.rejects(run(db, "place_menu", { menuId: MENU_A, where: "header_studio" }), /no Studio header yet/);
  await assert.rejects(run(db, "place_menu", { menuId: MENU_A, where: "footer_studio" }), /no Studio footer yet/);
});

test("footer_studio: adds a menu widget to a column of the draft, two columns, styled", async () => {
  const db = seed();
  const res = await run(db, "place_menu", { menuId: MENU_A, where: "footer_studio", column: 0, layout: "columns", style: { preset: "underline" }, title: "Explore" });
  const doc = ident(db).footer_studio as { draft: Parameters<typeof findWidget>[0] };
  const w = findWidget(doc.draft, res.widgetId as string)!.widget;
  assert.deepEqual({ type: w.type, menuId: w.menuId, layout: w.layout, title: w.title, style: w.menuStyle }, { type: "menu", menuId: MENU_A, layout: "columns", title: "Explore", style: { preset: "underline" } });
});

test("list_menu_placements: shown places by id and the Studio menu elements", async () => {
  const db = seed();
  await run(db, "place_menu", { menuId: MENU_A, where: "footer_block", column: 1 });
  const out = await tool("list_menu_placements").run({} as never, ctx(db)) as {
    menus: { id: string; shownIn: string[] }[]; studioHeader: { live: boolean; draft: { menuId: string | null }[] };
  };
  assert.deepEqual(out.menus.map((m) => m.id), [MENU_A], "only this site's menus");
  assert.deepEqual(out.menus[0].shownIn, ["footer"]);
  assert.equal(out.studioHeader.live, false);
  assert.ok(out.studioHeader.draft.length >= 1);
});
