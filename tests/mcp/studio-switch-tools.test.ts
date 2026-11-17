/**
 * MCP switch_to_studio (menus P5): preview writes nothing; prepare saves
 * Studio drafts only (live site unchanged), creates "Main menu" at location
 * "none" with a history version, never touches global_header/global_footer;
 * publish only when asked; refuses to overwrite an owner's own draft unless
 * replace; switch_back; tenant isolation; registered and layout-locked.
 * Run: npm run test:mcp
 */
import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeDb } from "./fake-supabase";
import { STUDIO_SWITCH_TOOLS } from "../../src/lib/mcp/studio-switch-tools";
import { MCP_TOOLS } from "../../src/lib/mcp/tools";
import { LAYOUT_TOOLS } from "../../src/lib/tenant/layout-lock";
import { resolveLiveHeader, normalizeDoc } from "../../src/modules/header-studio/doc";
import { resolveLiveFooter } from "../../src/modules/footer-studio/doc";
import { buildPreset } from "../../src/modules/header-studio/presets";
import { allElements } from "../../src/modules/header-studio/model";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const OWNER = "11111111-0000-4000-8000-000000000001";
const tool = STUDIO_SWITCH_TOOLS[0];

const HEADER = [{ id: "nav", type: "navigation", order: 0, visible: true, data: {
  items: [{ id: "n1", label: "Home", url: "/" }, { id: "n2", label: "About", url: "/about" }],
  style: "default", sticky: true, transparent: false, colorMode: "legacy", backgroundColor: "#123456", textColor: "#ffffff",
  showCta: true, ctaLabel: "Call", ctaUrl: "/contact", showCart: false, logoText: "Site A",
} }];
const FOOTER = [{ id: "ft", type: "footer", order: 0, visible: true, data: {
  columns: [{ id: "c1", heading: "Company", links: [{ id: "l1", label: "About", url: "/about" }] }],
  copyrightText: "© {year} A", backgroundColor: "#000000",
} }];

function seed(extra: Record<string, unknown> = {}) {
  return new FakeDb({
    nav_menus: [{ id: "menu-b", tenant_id: B, name: "B", location: "header", items: [{ id: "x", label: "Home", url: "/" }, { id: "y", label: "About", url: "/about" }] }],
    nav_menu_versions: [],
    site_identity: [
      { tenant_id: A, site_name: "Site A", logo_url: null, logo_dark_url: null, global_header: HEADER, global_footer: FOOTER, header_studio: null, footer_studio: null, ...extra },
      { tenant_id: B, site_name: "Site B", global_header: [], global_footer: [], header_studio: null, footer_studio: null },
    ],
    pages: [], tenant_business_profiles: [], site_settings: [],
  });
}
const ctx = (db: FakeDb, tenantId = A) => ({ tenantId, userId: OWNER, supabase: db as unknown as SupabaseClient });
const run = (db: FakeDb, args: Record<string, unknown>, tenantId = A) => tool.run(args as never, ctx(db, tenantId)) as Promise<Record<string, any>>;
const identity = (db: FakeDb, t = A) => db.tables.site_identity.find((r) => r.tenant_id === t)!;

test("registered, a write tool, and blocked by the layout lock", () => {
  assert.ok(MCP_TOOLS.some((t) => t.name === "switch_to_studio"));
  assert.equal(tool.write, true);
  assert.ok(LAYOUT_TOOLS.has("switch_to_studio"));
});

test("preview reports faithfulness and writes nothing", async () => {
  const db = seed();
  const r = await run(db, { action: "preview" });
  assert.equal(r.written, false);
  assert.equal(r.header.faithfulness, "exact");
  assert.equal(r.footer.faithfulness, "exact");
  assert.match(r.header.menu, /new saved menu "Main menu"/);
  assert.equal(db.writes.length, 0);
});

test("prepare: drafts only, a new Main menu at location none with a version, classic blocks untouched", async () => {
  const db = seed();
  const r = await run(db, {});
  assert.deepEqual(r.prepared, { header: true, footer: true });
  assert.deepEqual(r.published, []);
  const row = identity(db);
  assert.equal(resolveLiveHeader(row.header_studio), null);
  assert.equal(resolveLiveFooter(row.footer_studio), null);
  assert.deepEqual(row.global_header, HEADER);
  assert.deepEqual(row.global_footer, FOOTER);
  const created = db.tables.nav_menus.filter((m) => m.tenant_id === A);
  assert.equal(created.length, 1);
  assert.equal(created[0].location, "none");
  assert.equal(created[0].name, "Main menu");
  assert.equal(db.tables.nav_menu_versions.filter((v) => v.menu_id === created[0].id).length, 1);
  const doc = normalizeDoc(row.header_studio);
  assert.equal(doc.switched?.via, "mcp");
  assert.equal(allElements(doc.draft!).find((e) => e.type === "menu")?.menuId, created[0].id);
  // Again: the same links are found in the menu it made, so no second menu.
  await run(db, { area: "header" });
  assert.equal(db.tables.nav_menus.filter((m) => m.tenant_id === A).length, 1);
  // Other tenants untouched.
  assert.equal(identity(db, B).header_studio, null);
});

test("publish: true makes the drafts live; switch_back returns to classic and keeps the Studio", async () => {
  const db = seed();
  const r = await run(db, { area: "header", publish: true });
  assert.deepEqual(r.published, ["header"]);
  assert.ok(resolveLiveHeader(identity(db).header_studio));
  assert.equal(resolveLiveFooter(identity(db).footer_studio), null);
  const back = await run(db, { action: "switch_back", area: "header" });
  assert.equal(back.switchedBack.header, "classic");
  assert.equal(resolveLiveHeader(identity(db).header_studio), null);
  assert.ok(normalizeDoc(identity(db).header_studio).published);
});

test("switch_back on a prepared draft drops it", async () => {
  const db = seed();
  await run(db, { area: "footer" });
  const back = await run(db, { action: "switch_back", area: "footer" });
  assert.equal(back.switchedBack.footer, "discarded");
  assert.equal(normalizeDoc(identity(db).footer_studio).draft, null);
});

test("an owner's own Studio draft is kept unless replace: true", async () => {
  const own = { enabled: false, draft: buildPreset("classic", {}), published: null, history: [] };
  const db = seed({ header_studio: own });
  const r = await run(db, { area: "header" });
  assert.equal(r.prepared.header, "own_draft");
  assert.deepEqual(identity(db).header_studio, own);
  const r2 = await run(db, { area: "header", replace: true });
  assert.equal(r2.prepared.header, true);
});

test("a site with nothing to convert reports why and writes nothing", async () => {
  const db = seed();
  const r = await run(db, {}, B);
  assert.equal(r.prepared.header, "cannot_convert");
  assert.ok(r.header.cannotConvertBecause[0].startsWith("The site has no site-wide header"));
  assert.equal(identity(db, B).header_studio, null);
  assert.equal(db.tables.nav_menus.filter((m) => m.tenant_id === B).length, 1);
});
