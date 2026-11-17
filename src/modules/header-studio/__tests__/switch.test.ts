/**
 * Switch to Studio, header side (menus P5): the classic header -> Studio
 * draft converter, the menu plan (saved menu by id, reuse, new at location
 * "none"), the faithfulness check, the prepared document (draft only,
 * nothing live), and the renderer's new options (own row colours, button
 * colours, text icons, phone top bar, top bar that scrolls away), which
 * leave every config without them unchanged.
 * Run: npm run test:header
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { Block, NavItem } from "../../../types/cms";
import { convertClassicHeader } from "../../studio-switch/header-convert";
import { headerFidelity } from "../../studio-switch/fidelity";
import { planMenu, findMatchingMenu, menuShape, NEW_MENU_REF } from "../../studio-switch/menu-match";
import { prepareDocs, publishSwitchedHeader } from "../../studio-switch/prepare";
import { normalizeOrigin } from "../../studio-switch/types";
import { allElements, colorIsDark, normalizeHeaderConfig, findElement } from "../model";
import { discardDraft, emptyDoc, normalizeDoc, resolveLiveHeader } from "../doc";
import { emptyDoc as emptyFooterDoc } from "../../footer-studio/doc";
import { buildPreset } from "../presets";
import { StudioHeader } from "../../../components/site/header-studio/studio-header";
import { SiteContactProvider } from "../../../components/site/site-contact-context";
import { CartProvider } from "../../../lib/cart/cart-context";

const LINKS: NavItem[] = [
  { id: "n1", label: "Home", url: "/" },
  { id: "n2", label: "Services", url: "/services", children: [{ id: "n3", label: "Roofing", url: "/services/roofing" }] },
  { id: "n4", label: "Contact", url: "/contact" },
];

function nav(data: Record<string, unknown>): Block {
  return {
    id: "nav", type: "navigation", order: 0, visible: true,
    data: { items: LINKS, style: "default", sticky: true, transparent: false, colorMode: "legacy", backgroundColor: "#0b3d2e", textColor: "#ffffff", logo: "https://x.test/logo.png", logoHeight: 52, showCta: true, ctaLabel: "Get a quote", ctaUrl: "/quote", showCart: false, ...data },
  } as unknown as Block;
}

const BITS = { menus: [], identityLogo: "https://x.test/logo.png", siteName: "Acme" };
const input = (header: unknown, menus: { id: string; location: string | null; items: unknown; name?: string }[] = []) =>
  ({ globalHeader: header, menus, identityLogo: "https://x.test/logo.png", siteName: "Acme" });

test("legacy default header: logo + menu left, button right, own colours, sticky, md breakpoint, dropdown drawer", () => {
  const c = convertClassicHeader(input([nav({})]));
  assert.equal(c.source, "navigation");
  assert.equal(c.level, "exact");
  const cfg = c.config!;
  assert.deepEqual(cfg.rows.main.zones.left.map((e) => e.type), ["logo", "menu"]);
  assert.deepEqual(cfg.rows.main.zones.right.map((e) => e.type), ["button"]);
  assert.equal(cfg.rows.main.bgColor, "#0b3d2e");
  assert.equal(cfg.rows.main.fgColor, "#ffffff");
  const logo = cfg.rows.main.zones.left[0];
  assert.equal(logo.imageUrl, "https://x.test/logo.png");
  assert.equal(logo.height, 52);
  const btn = cfg.rows.main.zones.right[0];
  assert.deepEqual([btn.label, btn.url, btn.variant], ["Get a quote", "/quote", "gradient"]);
  assert.equal(cfg.behaviour.sticky, true);
  assert.equal(cfg.mobile.breakpoint, "md");
  assert.equal(cfg.mobile.drawer, "dropdown");
  assert.equal(cfg.rows.top.enabled, false);
  // Own links, no saved menu: a new "Main menu" with exactly those links.
  assert.equal(c.menu?.kind, "new");
  assert.equal(cfg.rows.main.zones.left[1].menuId, NEW_MENU_REF);
  assert.equal(menuShape((c.menu as { items: NavItem[] }).items), menuShape(LINKS));
});

test("token colour mode keeps the theme's row colours; cart default on", () => {
  const c = convertClassicHeader(input([nav({ colorMode: "token", showCart: undefined })]));
  assert.equal(c.config!.rows.main.bgColor, undefined);
  assert.ok(allElements(c.config!).some((e) => e.type === "cart"));
  assert.deepEqual(c.config!.mobile.icons, ["cart"]);
});

test("logo-center: logo in the centre, menu on its own row with its colours, search box left", () => {
  const c = convertClassicHeader(input([nav({ style: "logo-center", showSearch: true, menuRowBackground: "#111111", topRowBackground: "#ffffff" })]));
  const cfg = c.config!;
  assert.deepEqual(cfg.rows.main.zones.center.map((e) => e.type), ["logo"]);
  assert.deepEqual(cfg.rows.main.zones.left.map((e) => e.type), ["search"]);
  assert.equal(cfg.rows.menu.enabled, true);
  assert.deepEqual(cfg.rows.menu.zones.center.map((e) => e.type), ["menu"]);
  assert.equal(cfg.rows.menu.bgColor, "#111111");
  assert.equal(cfg.rows.main.bgColor, "#ffffff");
});

test("top bar: items with icons and links, phone and WhatsApp from contact details, colours, phones, scrolls away", () => {
  const c = convertClassicHeader(input([nav({
    topBar: { show: true, align: "split", background: "#2EA3F2", textColor: "#ffffff", items: [
      { id: "t1", text: "+65 8697 3181", icon: "Phone", url: "tel:+6586973181", side: "left" },
      { id: "t2", text: "Mon-Sat 9-6", icon: "clock", side: "right" },
    ] },
  })]));
  const top = c.config!.rows.top;
  assert.equal(top.enabled, true);
  assert.equal(top.bgColor, "#2EA3F2");
  const t1 = top.zones.left[0];
  assert.deepEqual([t1.type, t1.label, t1.url, t1.icon], ["text", "+65 8697 3181", "tel:+6586973181", "phone"]);
  assert.deepEqual(top.zones.right.map((e) => e.type), ["text", "phone", "whatsapp"]);
  assert.equal(top.zones.right[0].icon, "clock");
  assert.equal(c.config!.mobile.topBar, true);
  assert.equal(c.config!.behaviour.topScrolls, true);
  assert.equal(c.level, "exact");
});

test("a header that reads a saved menu keeps that menu by id; matching links reuse a saved menu", () => {
  const menus = [{ id: "m-head", location: "header", items: [{ id: "a", label: "Only", url: "/" }] }];
  const reads = convertClassicHeader(input([nav({ menuLocation: "header" })], menus));
  assert.deepEqual(reads.menu, { kind: "saved", menuId: "m-head", why: "reads" });
  const same = [{ id: "m-dup", location: "none", items: JSON.parse(JSON.stringify(LINKS)).map((i: NavItem) => ({ ...i, id: `x${i.id}` })) }];
  const reuse = convertClassicHeader(input([nav({})], same));
  assert.deepEqual(reuse.menu, { kind: "saved", menuId: "m-dup", why: "match" });
  // A dead saved "header" menu with other links is not used for the header's own links.
  const dead = [{ id: "m-dead", location: "header", items: [{ id: "z", label: "Old", url: "/old" }] }];
  assert.equal(convertClassicHeader(input([nav({})], dead)).menu?.kind, "new");
});

test("planMenu: empty block = default menu; by id wins over location", () => {
  assert.deepEqual(planMenu({ items: [] }, []), { kind: "default" });
  const menus = [{ id: "a", location: "header", items: [] }, { id: "b", location: "none", items: [] }];
  assert.deepEqual(planMenu({ menuId: "b", menuLocation: "header" }, menus), { kind: "saved", menuId: "b", why: "reads" });
  assert.equal(findMatchingMenu(menus, []), null);
});

test("container header: logo / menu / buttons by column, colours, cart, phone-only copy ignored", () => {
  const header = [{
    id: "c", type: "container", order: 0, visible: true, background: { type: "color", color: "#222222" },
    data: { sticky: true, columns: [
      { id: "1", blocks: [{ id: "l", type: "header_logo", visible: true, data: { text: "Omor Toys", height: 34 } }] },
      { id: "2", blocks: [
        { id: "n", type: "header_nav", visible: true, data: { items: LINKS, style: "default", textColor: "#ffffff" } },
        { id: "n2", type: "header_nav", visible: true, hideOn: ["desktop"], data: { items: [{ id: "q", label: "Phone only", url: "/" }], style: "default" } },
      ] },
      { id: "3", blocks: [
        { id: "b", type: "header_booking", visible: true, data: { label: "Book now", url: "/book", variant: "gradient" } },
        { id: "q", type: "header_cta", visible: true, data: { label: "Request a Quote", url: "/contact", variant: "gradient" } },
        { id: "k", type: "header_cart", visible: true, data: {} },
      ] },
    ] },
  }];
  const c = convertClassicHeader(input(header));
  assert.equal(c.source, "container");
  const cfg = c.config!;
  assert.deepEqual(cfg.rows.main.zones.left.map((e) => e.type), ["logo"]);
  assert.equal(cfg.rows.main.zones.left[0].label, "Omor Toys");
  assert.deepEqual(cfg.rows.main.zones.center.map((e) => e.type), ["menu"]);
  assert.deepEqual(cfg.rows.main.zones.right.map((e) => e.type), ["booking", "button", "cart"]);
  assert.equal(cfg.rows.main.bgColor, "#222222");
  assert.equal(cfg.rows.main.fgColor, "#ffffff");
  assert.equal(c.level, "exact");
  assert.equal(headerFidelity(header, c, BITS).diffs.length, 0);
});

test("shapes that cannot convert: empty, page sections inside, several header bars", () => {
  assert.equal(convertClassicHeader(input([])).level, "unsupported");
  assert.equal(convertClassicHeader(input([])).notes[0].code, "empty");
  const withHero = convertClassicHeader(input([nav({}), { id: "h", type: "hero", visible: true, data: {} }]));
  assert.equal(withHero.level, "unsupported");
  assert.equal(withHero.notes[0].code, "extraBlocks");
  assert.equal(withHero.config, null);
  const two = convertClassicHeader(input([nav({}), { ...nav({}), id: "nav2" }]));
  assert.ok(two.notes.some((n) => n.code === "multipleHeaders"));
  // A hidden block is ignored.
  assert.equal(convertClassicHeader(input([nav({}), { id: "h", type: "hero", visible: false, data: {} }])).level, "exact");
});

test("fidelity compares facts on both sides, independent of the converter", () => {
  const header = [nav({ showBooking: true, bookingLabel: "Book", languageSwitch: "bn" })];
  const c = convertClassicHeader(input(header));
  assert.deepEqual(headerFidelity(header, c, BITS).diffs, []);
  // Break the draft: drop the button and a link; the check must see it.
  const broken = JSON.parse(JSON.stringify(c));
  broken.config.rows.main.zones.right = broken.config.rows.main.zones.right.filter((e: { type: string }) => e.type !== "button");
  broken.menu.items = broken.menu.items.slice(0, 2);
  const f = headerFidelity(header, broken, BITS);
  assert.equal(f.level, "minor");
  assert.ok(f.diffs.some((d) => d.startsWith("buttons: missing")));
  assert.ok(f.diffs.some((d) => d.startsWith("menu links: missing")));
});

test("prepare writes only the draft and `switched`; live stays classic; publish turns it on; discard undoes the switch", () => {
  const c = convertClassicHeader(input([nav({})]));
  const out = prepareDocs({
    header: c, headerDoc: emptyDoc(), footer: null, footerDoc: emptyFooterDoc(),
    menuIds: () => "11111111-1111-4111-8111-111111111111",
    origin: { at: "2026-11-17T10:00:00.000Z", by: "u1", via: "owner" },
  });
  const doc = out.headerDoc!;
  assert.equal(doc.enabled, false);
  assert.equal(doc.published, null);
  assert.equal(resolveLiveHeader(doc), null);
  assert.equal(findElement(doc.draft!, doc.draft!.rows.main.zones.left[1].id)!.element.menuId, "11111111-1111-4111-8111-111111111111");
  assert.deepEqual(doc.switched?.createdMenus, ["11111111-1111-4111-8111-111111111111"]);
  // Stored and read back: the record survives normalization.
  const stored = normalizeDoc(JSON.parse(JSON.stringify(doc)));
  assert.equal(stored.switched?.via, "owner");
  assert.equal(stored.switched?.level, "exact");
  const pub = publishSwitchedHeader(stored, "u2", "2026-11-17T11:00:00.000Z")!;
  assert.ok(resolveLiveHeader(pub));
  assert.equal(discardDraft(stored).switched, undefined);
  assert.equal(normalizeOrigin({ at: "nope" }), null);
  // A document without the record is unchanged by P5's normalizer (no new keys).
  assert.deepEqual(Object.keys(normalizeDoc({ enabled: false, draft: null, published: null, history: [] })).sort(),
    ["draft", "draftSavedAt", "enabled", "history", "published", "publishedAt", "publishedBy"]);
});

test("new options are optional: a config without them normalizes exactly as before", () => {
  const preset = buildPreset("topbar", { phone: "+65 1", email: "a@b.c", socials: 1 })!;
  const again = normalizeHeaderConfig(JSON.parse(JSON.stringify(preset)));
  assert.deepEqual(again, preset);
  assert.equal("bgColor" in again.rows.main, false);
  assert.equal("topBar" in again.mobile, false);
  assert.equal("topScrolls" in again.behaviour, false);
  // Unsafe colours are dropped.
  const bad = normalizeHeaderConfig({ ...preset, rows: { ...preset.rows, main: { ...preset.rows.main, bgColor: "red;background:url(x)" } } });
  assert.equal(bad.rows.main.bgColor, undefined);
});

test("colorIsDark", () => {
  assert.equal(colorIsDark("#0b3d2e"), true);
  assert.equal(colorIsDark("#ffffff"), false);
  assert.equal(colorIsDark("rgba(255,255,255,0.75)"), false);
  assert.equal(colorIsDark("hsl(var(--primary))"), null);
});

const render = (cfg: ReturnType<typeof normalizeHeaderConfig>, preview: "desktop" | "mobile") => renderToStaticMarkup(
  React.createElement(PathnameContext.Provider, { value: "/" },
    React.createElement(SiteContactProvider as React.FC<{ value: unknown; children?: React.ReactNode }>, { value: { phone: "+65 1" } },
      React.createElement(CartProvider, null,
        React.createElement(StudioHeader, { config: cfg, menus: { "": LINKS }, siteName: "Acme", preview })))));

test("renderer: own row colours, button colour, text icon, phone top bar", () => {
  const c = convertClassicHeader(input([nav({
    ctaColor: "#ff6600",
    topBar: { show: true, items: [{ id: "t", text: "Open daily", icon: "clock" }] },
  })]));
  const cfg = c.config!;
  for (const e of allElements(cfg)) if (e.type === "menu") delete e.menuId;
  const desk = render(cfg, "desktop");
  assert.match(desk, /background:#0b3d2e/);
  assert.match(desk, /background:#ff6600/);
  assert.match(desk, /Open daily/);
  assert.match(desk, /<svg[^>]*lucide-clock/);
  const phone = render(cfg, "mobile");
  assert.match(phone, /data-hs-phone-top=""/);
  assert.match(phone, /Open daily/);
  // Without the option the phone shows no top bar (as before P5).
  delete cfg.mobile.topBar;
  assert.doesNotMatch(render(cfg, "mobile"), /data-hs-phone-top/);
});
