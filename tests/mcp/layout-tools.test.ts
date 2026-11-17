/**
 * MCP site chrome and settings tools (2026-11-09): get/set_site_header with
 * stored objects and missing site_identity rows, update_site_header on both
 * header shapes, update_site_footer column/link ops, credit and pre-footer,
 * update_site_settings and update_site_identity validation, tenant isolation
 * and the layout lock. Run: npm run test:mcp
 */
import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeDb } from "./fake-supabase";
import { SETUP_TOOLS } from "../../src/lib/mcp/setup-tools";
import { SITE_CHROME_TOOLS } from "../../src/lib/mcp/layout-tools";
import { applyFooterPatch, applyHeaderPatch, applyPrefooterPatch, summarizeHeader } from "../../src/lib/mcp/layout-patch";
import { buildIdentityPatch, buildSettingsPatch } from "../../src/lib/mcp/settings-patch";
import type { McpTool } from "../../src/lib/mcp/tools";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";
const C = "cccccccc-0000-4000-8000-000000000003"; // no site_identity row
const PAGE_A = "aaaaaaaa-1111-4000-8000-000000000001";
const OWNER = "11111111-0000-4000-8000-000000000001";
const STAFF = "22222222-0000-4000-8000-000000000002";

type Row = Record<string, unknown>;
type B0 = { id: string; type: string; visible?: boolean; order?: number; data: Row };

const base = (id: string, type: string, data: Row): B0 => ({ id, type, order: 0, visible: true, data });

const navHeader = () => [base("nav1", "navigation", { logoText: "Site A", items: [{ id: "i1", label: "Home", url: "/" }], menuLocation: "header", sticky: true, transparent: false, style: "default", showCta: true, ctaLabel: "Call", ctaUrl: "tel:+6512345678" })];

const builderHeader = () => [base("cont1", "container", {
  direction: "row", gap: "md", align: "center", justify: "between", wrapOnMobile: true, sticky: true,
  columns: [
    { id: "c1", widthPct: 25, blocks: [base("logo1", "header_logo", { text: "Site B", height: 34 })] },
    { id: "c2", widthPct: 50, blocks: [base("nav2", "header_nav", { items: [{ id: "n1", label: "About", url: "/about" }], style: "split" })] },
    { id: "c3", widthPct: 25, blocks: [base("book1", "header_booking", { label: "Book now", url: "/book", variant: "gradient" }), base("cta1", "header_cta", { label: "Request a Quote", url: "/contact", variant: "gradient" })] },
  ],
})];

const footerBlock = () => base("foot1", "footer", {
  style: "dark", logoText: "Site A", tagline: "Old tagline",
  columns: [
    { id: "col1", heading: "Quick Links", links: [{ id: "l1", label: "Products", url: "#services" }, { id: "l2", label: "About", url: "/about" }] },
    { id: "col2", heading: "Contact", links: [{ id: "l3", label: "Call us", url: "tel:+880" }] },
  ],
  copyrightText: "© 2026 Site A", copyrightYear: true,
});

function seed() {
  return new FakeDb({
    tenants: [
      { id: A, name: "Site A", slug: "a", plan: "pro", layout_locked: false },
      { id: B, name: "Site B", slug: "b", plan: "pro", layout_locked: true },
      { id: C, name: "Site C", slug: "c", plan: "free", layout_locked: false },
    ],
    super_admins: [],
    pc_staff: [{ id: "s1", user_id: STAFF, status: "active" }],
    pages: [{ id: PAGE_A, tenant_id: A, slug: "about", deleted_at: null }],
    nav_menus: [{ id: "m1", tenant_id: A, name: "Main", slug: "main", location: "header", items: [{ id: "x", label: "Home", url: "/" }, { id: "y", label: "About", url: "/about" }] }],
    site_identity: [
      // Site A stores its footer as ONE block object (7 live sites do).
      { id: "si-a", tenant_id: A, site_name: "Site A", global_header: navHeader(), global_footer: footerBlock(), global_prefooter: [], color_overrides: { primary: "#111111" } },
      { id: "si-b", tenant_id: B, site_name: "Site B", global_header: builderHeader(), global_footer: [footerBlock()], global_prefooter: null },
    ],
    site_settings: [
      { id: "ss-a", tenant_id: A, site_name: "Site A", language: "en", site_languages: [], auto_translate_enabled: true, currency: "USD", currency_symbol: "$" },
      { id: "ss-c", tenant_id: C, site_name: "Site C settings name", language: "en", site_languages: ["ar"], auto_translate_enabled: false },
    ],
    admin_audit_log: [],
  });
}

const ALL: McpTool[] = [...SETUP_TOOLS, ...SITE_CHROME_TOOLS];
const tool = (n: string) => ALL.find((t) => t.name === n) ?? assert.fail(`no tool ${n}`);

/** Run a tool the way the route does: zod parse, then run with this ctx. */
async function call(db: FakeDb, name: string, args: unknown, ctx: { tenantId: string; userId: string } = { tenantId: A, userId: OWNER }) {
  const t = tool(name);
  const parsed = t.schema.parse(args);
  return t.run(parsed as never, { ...ctx, supabase: db as unknown as SupabaseClient }) as Promise<Record<string, unknown>>;
}
const identity = (db: FakeDb, tenant: string) => db.rows("site_identity").find((r) => r.tenant_id === tenant);
const settings = (db: FakeDb, tenant: string) => db.rows("site_settings").find((r) => r.tenant_id === tenant);
const snapshot = (db: FakeDb, table: string, tenant: string) => JSON.stringify(db.rows(table).filter((r) => r.tenant_id === tenant));

// ── get/set_site_header: stored objects and missing rows ─────────────────

test("get_site_header always returns an array, also for a footer stored as one object", async () => {
  const db = seed();
  const r = await call(db, "get_site_header", { area: "footer" });
  assert.ok(Array.isArray(r.blocks));
  assert.equal((r.blocks as B0[]).length, 1);
  assert.equal((r.blocks as B0[])[0].id, "foot1");
  // ...and set_site_header takes it straight back.
  const saved = await call(db, "set_site_header", { area: "footer", blocks: r.blocks });
  assert.equal(saved.saved, true);
  assert.ok(Array.isArray(identity(db, A)!.global_footer));
});

test("set_site_header accepts a single block object (old get_site_header output)", async () => {
  const db = seed();
  const saved = await call(db, "set_site_header", { area: "footer", blocks: footerBlock() });
  assert.equal(saved.saved, true);
  const f = identity(db, A)!.global_footer as B0[];
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "footer");
});

test("set_site_header creates the site_identity row when the site has none, touching nothing else", async () => {
  const db = seed();
  const beforeA = snapshot(db, "site_identity", A);
  assert.equal(identity(db, C), undefined);
  const r = await call(db, "set_site_header", { preset: "nav_menu", brandText: "Site C" }, { tenantId: C, userId: OWNER });
  assert.equal(r.saved, true);
  const row = identity(db, C)!;
  assert.equal((row.global_header as B0[])[0].type, "navigation");
  // Only the saved column (no invented name): readers keep their fallbacks.
  assert.equal(row.site_name, undefined);
  assert.equal(snapshot(db, "site_identity", A), beforeA);
  const empty = await call(db, "get_site_header", { area: "prefooter" }, { tenantId: C, userId: OWNER });
  assert.deepEqual(empty.blocks, []);
});

// ── update_site_header ───────────────────────────────────────────────────

test("update_site_header edits the Nav Menu block in place", async () => {
  const db = seed();
  const r = await call(db, "update_site_header", {
    logo: { text: "Site A Ltd", height: 48 },
    cta: { label: "Get a quote", url: "/quote", style: "outline" },
    booking: { show: true, label: "Book a visit" },
    mobileLayout: "centered-logo",
    topBar: { items: [{ text: "hello@a.com", icon: "mail", url: "mailto:hello@a.com" }], showPhone: true, showSocials: true },
  });
  assert.equal(r.saved, true);
  assert.equal(r.headerType, "Nav Menu block");
  const d = (identity(db, A)!.global_header as B0[])[0].data;
  assert.equal(d.logoText, "Site A Ltd");
  assert.equal(d.logoHeight, 48);
  assert.equal(d.ctaLabel, "Get a quote");
  assert.equal(d.ctaUrl, "/quote");
  assert.equal(d.ctaVariant, "outline");
  assert.equal(d.showBooking, true);
  assert.equal(d.bookingLabel, "Book a visit");
  assert.equal(d.mobileLayout, "centered-logo");
  const bar = d.topBar as { show: boolean; items: { text: string; url: string }[]; showSocials: boolean };
  assert.equal(bar.show, true);
  assert.equal(bar.items[0].url, "mailto:hello@a.com");
  assert.equal(bar.showSocials, true);
  // Untouched fields stay.
  assert.equal(d.menuLocation, "header");
  assert.equal(d.sticky, true);
  // "default" phone layout clears the key; null clears the logo height.
  await call(db, "update_site_header", { mobileLayout: "default", logo: { height: null } });
  const d2 = (identity(db, A)!.global_header as B0[])[0].data;
  assert.equal("mobileLayout" in d2, false);
  assert.equal("logoHeight" in d2, false);
});

test("update_site_header refuses bad links and saves nothing", async () => {
  const db = seed();
  const before = snapshot(db, "site_identity", A);
  await assert.rejects(call(db, "update_site_header", { logo: { text: "New" }, cta: { url: "javascript:alert(1)" } }), /links must start with/);
  await assert.rejects(call(db, "update_site_header", { topBar: { items: [{ text: "x", url: "ftp://x" }] } }), /links must start with/);
  assert.equal(snapshot(db, "site_identity", A), before);
});

test("update_site_header edits a header builder layout: hide, add and relabel elements", async () => {
  const db = seed();
  const r = await call(db, "update_site_header", {
    cta: { show: false },
    booking: { label: "Reserve" },
    cart: { show: true },
    logo: { imageUrl: "https://cdn.example.com/logo.png", showName: true },
    menu: { location: "header" },
    sticky: false,
  }, { tenantId: B, userId: STAFF });
  assert.equal(r.saved, true);
  assert.equal(r.headerType, "header builder layout");
  const c = (identity(db, B)!.global_header as B0[])[0];
  const cols = c.data.columns as { blocks: B0[] }[];
  const all = cols.flatMap((x) => x.blocks);
  assert.equal(all.find((b) => b.type === "header_cta")!.visible, false);
  assert.equal(all.find((b) => b.type === "header_booking")!.data.label, "Reserve");
  const cart = cols[2].blocks.at(-1)!;
  assert.equal(cart.type, "header_cart");
  assert.deepEqual(cols[2].blocks.map((b) => b.order), [0, 1, 2]);
  assert.equal(all.find((b) => b.type === "header_logo")!.data.imageUrl, "https://cdn.example.com/logo.png");
  assert.equal(all.find((b) => b.type === "header_logo")!.data.showName, true);
  assert.equal(all.find((b) => b.type === "header_nav")!.data.menuLocation, "header");
  assert.equal(c.data.sticky, false);
  // Showing the button again keeps its label.
  await call(db, "update_site_header", { cta: { show: true } }, { tenantId: B, userId: STAFF });
  const cta = ((identity(db, B)!.global_header as B0[])[0].data.columns as { blocks: B0[] }[]).flatMap((x) => x.blocks).find((b) => b.type === "header_cta")!;
  assert.equal(cta.visible, true);
  assert.equal(cta.data.label, "Request a Quote");
});

test("update_site_header refuses fields the header's type does not have", async () => {
  const db = seed();
  const before = snapshot(db, "site_identity", B);
  await assert.rejects(call(db, "update_site_header", { mobileLayout: "spaced", sticky: true }, { tenantId: B, userId: STAFF }), /only exist on the Nav Menu header/);
  await assert.rejects(call(db, "update_site_header", { logo: { showName: true } }), /only exist on header builder layouts/);
  await assert.rejects(call(db, "update_site_header", { data: { columns: [] } }, { tenantId: B, userId: STAFF }), /data.columns cannot be patched/);
  assert.equal(snapshot(db, "site_identity", B), before);
});

test("update_site_header resolves page targets and can switch back to inline items", async () => {
  const db = seed();
  await call(db, "update_site_header", { menu: { location: null, items: [{ label: "About us", target: { kind: "page", pageId: PAGE_A } }, { label: "Shop", target: { kind: "url", url: "https://shop.example.com" }, highlight: "gold" }, { label: "বাংলা", target: { kind: "url", url: "/bn" }, lang: "bn" }] } });
  const d = (identity(db, A)!.global_header as B0[])[0].data;
  assert.equal("menuLocation" in d, false);
  const items = d.items as { label: string; url: string; target?: string; highlight?: string; lang?: string }[];
  assert.deepEqual(items.map((i) => i.url), ["/about", "https://shop.example.com", "/bn"]);
  assert.equal(items[1].target, "_blank");
  assert.equal(items[1].highlight, "gold");
  assert.equal(items[2].lang, "bn");
  // Top bar language menu, then removed with [].
  await call(db, "update_site_header", { topBar: { languages: ["en", "zh-CN"], scroll: true, scrollSeconds: 20 } });
  let bar = (identity(db, A)!.global_header as B0[])[0].data.topBar as Row;
  assert.deepEqual(bar.languages, ["en", "zh-CN"]);
  assert.equal(bar.scrollSeconds, 20);
  await call(db, "update_site_header", { topBar: { languages: [] } });
  bar = (identity(db, A)!.global_header as B0[])[0].data.topBar as Row;
  assert.equal("languages" in bar, false);
});

test("update_site_header on a site without a header points to set_site_header", async () => {
  const db = seed();
  await assert.rejects(call(db, "update_site_header", { sticky: true }, { tenantId: C, userId: OWNER }), /no header yet/);
});

// ── update_site_footer ───────────────────────────────────────────────────

test("update_site_footer: column and link operations by id, heading, label and position", async () => {
  const db = seed();
  const r = await call(db, "update_site_footer", {
    tagline: "New tagline",
    columns: [
      { op: "add", heading: "Services", links: [{ label: "Repairs", url: "/repairs" }], position: 2 },
      { op: "update", column: "quick links", heading: "Explore" },
      { op: "add_link", column: 1, label: "Blog", url: "/blog", position: 1 },
      { op: "update_link", column: "Explore", link: "About", label: "About us", url: "/about-us" },
      { op: "move_link", column: "col1", link: "Products", to: 1 },
      { op: "remove_link", column: "Contact", link: 1 },
      { op: "move", column: "Contact", to: 1 },
    ],
    bottomLinks: [{ op: "add", label: "Privacy", url: "/privacy" }, { op: "add", label: "Terms", url: "/terms" }, { op: "remove", link: "Terms" }],
    copyright: { text: "© {year} Site A Ltd" },
    socials: { useBusinessProfile: true },
  });
  assert.equal(r.saved, true);
  const f = identity(db, A)!.global_footer as B0[];
  assert.ok(Array.isArray(f), "stored as an array again");
  const d = f[0].data;
  const cols = d.columns as { id: string; heading: string; links: { label: string; url: string }[] }[];
  assert.deepEqual(cols.map((c) => c.heading), ["Contact", "Explore", "Services"]);
  assert.deepEqual(cols[1].links.map((l) => l.label), ["Products", "Blog", "About us"]);
  assert.equal(cols[1].links[2].url, "/about-us");
  assert.deepEqual(cols[0].links, []);
  assert.deepEqual((d.bottomLinks as { label: string }[]).map((l) => l.label), ["Privacy"]);
  assert.equal(d.tagline, "New tagline");
  assert.equal(d.copyrightText, "© {year} Site A Ltd");
  assert.equal(d.showSocials, true);
});

test("update_site_footer errors on ambiguous or missing refs and bad links, saving nothing", async () => {
  const db = seed();
  const before = snapshot(db, "site_identity", A);
  await assert.rejects(call(db, "update_site_footer", { columns: [{ op: "remove", column: "Nope" }] }), /No column "Nope"/);
  await assert.rejects(call(db, "update_site_footer", { columns: [{ op: "remove", column: 9 }] }), /column 9 does not exist/);
  await assert.rejects(call(db, "update_site_footer", { columns: [{ op: "add_link", column: 1, label: "x", url: "data:text/html,hi" }] }), /links must start with/);
  await assert.rejects(call(db, "update_site_footer", { socials: { links: [{ platform: "facebook", url: "facebook.com/x" }] } }), /https:\/\//);
  assert.equal(snapshot(db, "site_identity", A), before);
});

test("ambiguous column headings ask for the id", () => {
  const stored = [{ ...footerBlock(), data: { columns: [{ id: "a", heading: "Links", links: [] }, { id: "b", heading: "links", links: [] }] } }];
  assert.throws(() => applyFooterPatch(stored, { columns: [{ op: "remove", column: "Links" }] }, { creditEditable: false }), /2 columns are called "Links"/);
  const ok = applyFooterPatch(stored, { columns: [{ op: "remove", column: "b" }] }, { creditEditable: false });
  assert.deepEqual((ok.blocks[0].data as { columns: { id: string }[] }).columns.map((c) => c.id), ["a"]);
});

test("footer credit follows the plan rule", async () => {
  const db = seed();
  // The tool's plan check runs against the live database; in tests it falls
  // back to locked, which is the Basic/Free behaviour.
  await assert.rejects(call(db, "update_site_footer", { credit: { show: false } }), /only be hidden or changed on Pro, Biz and Custom/);
  const mixed = await call(db, "update_site_footer", { tagline: "T", credit: { show: false } });
  assert.equal(mixed.saved, true);
  assert.match(String((mixed.notes as string[])[0]), /locked on this plan/);
  assert.equal("credit" in (identity(db, A)!.global_footer as B0[])[0].data, false);
  // Editable plans: hide, then change text and link, then back to the default.
  let r = applyFooterPatch([footerBlock()], { credit: { show: false } }, { creditEditable: true });
  assert.deepEqual((r.blocks[0].data as Row).credit, { show: false });
  r = applyFooterPatch(r.blocks, { credit: { show: true, text: "Site by <b>Acme</b>", url: "https://acme.example" } }, { creditEditable: true });
  assert.deepEqual((r.blocks[0].data as Row).credit, { text: "Site by Acme", url: "https://acme.example/" });
  assert.throws(() => applyFooterPatch(r.blocks, { credit: { url: "javascript:x" } }, { creditEditable: true }), /http:\/\/ or https:\/\//);
  r = applyFooterPatch(r.blocks, { credit: { text: null, url: null } }, { creditEditable: true });
  assert.equal("credit" in r.blocks[0].data, false);
});

test("update_site_footer colours: set, then null back to the theme", () => {
  let r = applyFooterPatch([footerBlock()], { colors: { background: "#0f2418", accent: "#c9a84c" } }, { creditEditable: false });
  assert.equal((r.blocks[0].data as Row).backgroundColor, "#0f2418");
  assert.throws(() => applyFooterPatch(r.blocks, { colors: { text: "red; background:url(x)" } }, { creditEditable: false }), /use a colour/);
  r = applyFooterPatch(r.blocks, { colors: null }, { creditEditable: false });
  assert.equal("backgroundColor" in r.blocks[0].data, false);
  assert.equal("accentColor" in r.blocks[0].data, false);
});

test("pre-footer: create banner and form, hide and show", async () => {
  const db = seed();
  await assert.rejects(call(db, "update_site_footer", { prefooter: { cta: { title: "Hi" } } }), /give cta.title and cta.primaryButton/);
  await assert.rejects(call(db, "update_site_footer", { prefooter: { show: false } }), /no pre-footer to show or hide/);
  const r = await call(db, "update_site_footer", { prefooter: { cta: { title: "Ready?", primaryButton: { label: "Call us", url: "tel:+6512345678" } }, contact: { title: "Get in touch", email: "hi@a.com" } } });
  assert.equal(r.saved, true);
  let pre = identity(db, A)!.global_prefooter as B0[];
  assert.deepEqual(pre.map((b) => b.type), ["cta", "contact"]);
  assert.equal((pre[0].data.primaryButton as Row).url, "tel:+6512345678");
  assert.equal(pre[1].data.email, "hi@a.com");
  await call(db, "update_site_footer", { prefooter: { show: false } });
  pre = identity(db, A)!.global_prefooter as B0[];
  assert.ok(pre.every((b) => b.visible === false));
  // Footer untouched by pre-footer-only edits.
  assert.equal(((identity(db, A)!.global_footer as B0)).id, "foot1");
  const again = applyPrefooterPatch(pre, { show: true, contact: { recipientEmail: "" } });
  assert.ok(again.blocks.every((b) => b.visible === true));
  assert.equal((again.blocks[1].data as Row).recipientEmail, "hi@a.com");
});

// ── Settings and identity ────────────────────────────────────────────────

test("buildSettingsPatch: the dashboard's rules", () => {
  assert.throws(() => buildSettingsPatch({}, { timezone: "Mars/Olympus" }), /not a time zone/);
  assert.deepEqual(buildSettingsPatch({}, { timezone: " Asia/Singapore " }).patch, { timezone: "Asia/Singapore" });
  assert.throws(() => buildSettingsPatch({}, { language: "xx" }), /not supported/);
  assert.throws(() => buildSettingsPatch({ site_languages: ["ar"] }, { auto_translate_enabled: true }), /turn off your own languages first/);
  assert.deepEqual(buildSettingsPatch({ site_languages: ["ar"] }, { auto_translate_enabled: true, site_languages: [] }).patch, { site_languages: [], auto_translate_enabled: true });
  assert.throws(() => buildSettingsPatch({}, { site_languages: ["ar", "zz"] }), /zz is not supported/);
  // The main language is never an extra one; switching main to an extra drops it.
  assert.deepEqual(buildSettingsPatch({ language: "en" }, { site_languages: ["en", "ar-SA", "ar"] }).patch, { site_languages: ["ar"] });
  assert.deepEqual(buildSettingsPatch({ language: "en", site_languages: ["ar", "bn"] }, { language: "ar" }).patch, { language: "ar", site_languages: ["bn"] });
  // Extra languages switch the Google widget off, with a note.
  const w = buildSettingsPatch({ language: "en", auto_translate_enabled: true }, { site_languages: ["ar"] });
  assert.equal(w.patch.auto_translate_enabled, false);
  assert.match(w.notes[0], /switched off/);
  assert.deepEqual(buildSettingsPatch({}, { currency: "bdt" }).patch, { currency: "BDT", currency_symbol: "৳" });
  assert.throws(() => buildSettingsPatch({}, { currency: "ABC" }), /not a supported currency/);
  assert.equal(buildSettingsPatch({}, { google_site_verification: '<meta name="google-site-verification" content="abc123" />' }).patch.google_site_verification, "abc123");
  assert.equal(buildSettingsPatch({}, { bing_site_verification: "" }).patch.bing_site_verification, null);
  assert.equal(buildSettingsPatch({}, { gtm_container_id: "<script>(window,document,'script','dataLayer','gtm-ab12cd');</script>" }).patch.gtm_container_id, "GTM-AB12CD");
  assert.throws(() => buildSettingsPatch({}, { ga_measurement_id: "UA-1234" }), /GA4 Measurement ID/);
  assert.equal(buildSettingsPatch({}, { ga_measurement_id: null }).patch.ga_measurement_id, null);
  assert.equal(buildSettingsPatch({}, { meta_pixel_id: "fbq('init', '123456789012345');" }).patch.meta_pixel_id, "123456789012345");
  assert.throws(() => buildSettingsPatch({}, { meta_pixel_id: "12ab" }), /Meta Pixel ID/);
  assert.throws(() => buildSettingsPatch({}, { custom_js: "x();</script><script>y()" }), /without <script> tags/);
  assert.equal(buildSettingsPatch({}, { maintenance_title: "  " }).patch.maintenance_title, null);
});

test("update_site_settings saves only the fields passed and keeps the name in step with Site Identity", async () => {
  const db = seed();
  const beforeB = snapshot(db, "site_settings", B);
  const r = await call(db, "update_site_settings", { site_name: "Site A Ltd", timezone: "Asia/Dhaka", site_languages: ["ar"], currency: "SGD", maintenance_mode: false });
  assert.deepEqual(r.updated, ["site_name", "timezone", "site_languages", "auto_translate_enabled", "currency", "currency_symbol", "maintenance_mode"]);
  const s = settings(db, A)!;
  assert.equal(s.site_name, "Site A Ltd");
  assert.equal(s.timezone, "Asia/Dhaka");
  assert.deepEqual(s.site_languages, ["ar"]);
  assert.equal(s.auto_translate_enabled, false);
  assert.equal(s.currency_symbol, "S$");
  assert.equal(identity(db, A)!.site_name, "Site A Ltd");
  assert.equal(snapshot(db, "site_settings", B), beforeB);
  // get_site_settings reads them back.
  const g = await call(db, "get_site_settings", {});
  assert.equal(g.site_name, "Site A Ltd");
  assert.deepEqual(g.site_languages, ["ar"]);
  assert.ok((g.supported_languages as string[]).includes("bn"));
});

test("update_site_settings on a site without rows creates them; site_name creates the identity row", async () => {
  const db = seed();
  db.tables.site_settings = db.rows("site_settings").filter((r) => r.tenant_id !== C);
  const r = await call(db, "update_site_settings", { site_name: "Site C Co", meta_title: "Site C" }, { tenantId: C, userId: OWNER });
  assert.deepEqual(r.updated, ["site_name", "meta_title"]);
  assert.equal(identity(db, C)!.site_name, "Site C Co");
  assert.equal(settings(db, C)!.meta_title, "Site C");
  assert.equal(settings(db, C)!.site_name, "Site C Co");
});

test("buildIdentityPatch: hex colours merged over the current overrides, null resets", () => {
  const cur = { color_overrides: { primary: "#111111", accent: "#222222" } };
  const p = buildIdentityPatch(cur, { colors: { primary: "#1E3A5F", accent: null, secondary: "#c9a84c" } });
  assert.deepEqual(p.identity.color_overrides, { primary: "#1E3A5F", secondary: "#c9a84c" });
  assert.throws(() => buildIdentityPatch(cur, { colors: { primary: "navy" } }), /use a colour like/);
  assert.equal(buildIdentityPatch(cur, { colors: null }).identity.color_overrides, null);
  assert.equal(buildIdentityPatch(cur, { colors: { primary: null, accent: null } }).identity.color_overrides, null);
  assert.throws(() => buildIdentityPatch(cur, { logo_url: "not a link" }), /full image address/);
  const n = buildIdentityPatch(null, { site_name: " Acme ", logo_url: "https://cdn.example.com/a.png", favicon_url: null });
  assert.deepEqual(n.settings, { site_name: "Acme", logo_url: "https://cdn.example.com/a.png", favicon_url: null });
});

test("update_site_identity writes Site Identity and the Settings copies; set_site_branding creates a missing row", async () => {
  const db = seed();
  const r = await call(db, "update_site_identity", { tagline: "We fix things", logo_dark_url: "https://cdn.example.com/dark.png", colors: { secondary: "#c9a84c" } });
  assert.deepEqual(r.updated, ["tagline", "logo_dark_url", "colors"]);
  const row = identity(db, A)!;
  assert.equal(row.tagline, "We fix things");
  assert.deepEqual(row.color_overrides, { primary: "#111111", secondary: "#c9a84c" });
  assert.equal(row.logo_dark_url, "https://cdn.example.com/dark.png");
  // The logo is mirrored into Settings, so no reader falls back to an old copy.
  await call(db, "update_site_identity", { logo_url: "https://cdn.example.com/a.png" });
  assert.equal(settings(db, A)!.logo_url, "https://cdn.example.com/a.png");
  assert.equal(identity(db, A)!.logo_url, "https://cdn.example.com/a.png");
  // The set_site_branding alias on a site with no identity row (it used to update nothing there).
  const { findMcpTool } = await import("../../src/lib/mcp/tools");
  const branding = findMcpTool("set_site_branding")!;
  await branding.run(branding.schema.parse({ faviconUrl: "https://cdn.example.com/fav.png" }) as never, { tenantId: C, userId: OWNER, supabase: db as unknown as SupabaseClient });
  assert.equal(identity(db, C)!.favicon_url, "https://cdn.example.com/fav.png");
  assert.equal(settings(db, C)!.favicon_url, "https://cdn.example.com/fav.png");
});

// ── Isolation, lock and summaries ────────────────────────────────────────

test("writes on one site never touch another", async () => {
  const db = seed();
  const before = snapshot(db, "site_identity", B) + snapshot(db, "site_settings", B);
  await call(db, "update_site_header", { logo: { text: "A" } });
  await call(db, "update_site_footer", { tagline: "A", prefooter: { contact: { title: "Contact" } } });
  await call(db, "update_site_identity", { site_name: "A2" });
  await call(db, "update_site_settings", { meta_title: "A" });
  assert.equal(snapshot(db, "site_identity", B) + snapshot(db, "site_settings", B), before);
});

test("the layout lock blocks header, footer and identity for clients, not for staff; settings stay open", async () => {
  const db = seed();
  const owner = { tenantId: B, userId: OWNER };
  await assert.rejects(call(db, "update_site_header", { sticky: false }, owner), /managed by Passive Coder/);
  await assert.rejects(call(db, "update_site_footer", { tagline: "x" }, owner), /managed by Passive Coder/);
  await assert.rejects(call(db, "update_site_identity", { tagline: "x" }, owner), /managed by Passive Coder/);
  await assert.rejects(call(db, "update_site_settings", { site_name: "x" }, owner), /managed by Passive Coder/);
  const ok = await call(db, "update_site_settings", { meta_title: "B" }, owner);
  assert.deepEqual(ok.updated, ["meta_title"]);
  const staff = await call(db, "update_site_header", { sticky: false }, { tenantId: B, userId: STAFF });
  assert.equal(staff.saved, true);
});

test("get_site_layout summarises both header types, the footer and the pre-footer", async () => {
  const db = seed();
  const a = await call(db, "get_site_layout", {});
  const ha = a.header as Record<string, unknown>;
  assert.equal(ha.type, "Nav Menu block");
  assert.match(String(ha.summary), /the "Main" menu at location "header" \(2 items: Home, About/);
  assert.match(String(ha.summary), /Button: "Call" -> tel:\+6512345678/);
  assert.match(String((a.footer as Row).summary), /1\. "Quick Links" \[col1\] \(2 links\)/);
  assert.ok(Array.isArray((a.footer as Row).blocks));
  const b = await call(db, "get_site_layout", { blocks: false }, { tenantId: B, userId: STAFF });
  const hb = b.header as Record<string, unknown>;
  assert.equal(hb.type, "header builder layout");
  assert.match(String(hb.summary), /Logo \| Menu \| Booking button \+ Button/);
  assert.equal("blocks" in hb, false);
  const none = await call(db, "get_site_layout", {}, { tenantId: C, userId: OWNER });
  assert.match(String((none.header as Row).summary), /No site header saved/);
  assert.equal(none.identity, null);
});

test("patches keep the render order: stored `order` values and in-column element order", () => {
  // Two top-level blocks whose order fields disagree with the array order.
  const stored = [{ ...base("html1", "custom_html", { html: "" }), order: 1 }, { ...navHeader()[0], order: 0 }];
  const r = applyHeaderPatch(stored, { logo: { text: "X" } });
  assert.deepEqual(r.blocks.map((b) => [b.id, b.order]), [["html1", 1], ["nav1", 0]]);
  // A column whose elements render Button then Booking (order 0, 1) although stored the other way round.
  const h = builderHeader();
  const col = (h[0].data.columns as { blocks: B0[] }[])[2];
  col.blocks = [{ ...col.blocks[0], order: 1 }, { ...col.blocks[1], order: 0 }];
  const added = applyHeaderPatch(h, { account: { show: true } });
  const after = ((added.blocks[0].data as Row).columns as { blocks: B0[] }[])[2].blocks;
  assert.deepEqual(after.map((b) => b.type), ["header_cta", "header_booking", "header_account"]);
  assert.deepEqual(after.map((b) => b.order), [0, 1, 2]);
});

test("applyHeaderPatch leaves an untouched header identical and reports no changes", () => {
  const stored = navHeader();
  const r = applyHeaderPatch(stored, { sticky: true });
  assert.deepEqual(r.changes, []);
  assert.deepEqual(r.blocks, stored);
  assert.match(summarizeHeader(stored, {}).text, /no menu is assigned there yet/);
});
