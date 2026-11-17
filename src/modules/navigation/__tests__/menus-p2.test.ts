/**
 * Menus P2 (placement): menus by id in menu blocks and classic footer
 * columns, the page Menu block, and pixel safety. Every block saved before
 * P2 must render byte for byte what v1.0.925 rendered (fixtures/*.v925.tsx
 * are those files), and must resolve exactly as before.
 *
 * Run: npm run test:nav
 */
import "../../../../tests/mcp/server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { Block, FooterBlockProps, HeaderNavBlockProps, NavItem } from "@/types/cms";
import { HeaderNavBlock } from "@/components/blocks/header-nav/header-nav-block";
import { HeaderNavBlock as HeaderNavV925 } from "./fixtures/header-nav-block.v925";
import { FooterBlock } from "@/components/blocks/footer/footer-block";
import { FooterBlock as FooterV925 } from "./fixtures/footer-block.v925";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import {
  collectFooterBlocks, findImportableNav, footerColumnMenuIds, hasMenusToResolve, isMenuPlacement, mapNavBlocks, menuIdsReadBy,
  nestedNeedsResolve, pickNavItems, pointNavBlocksAt,
} from "../nav-blocks";
import { menuReaders, menuUsage } from "../menu-usage";
import { isChromeBlock } from "@/lib/site/global-blocks";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";

const html = (el: React.ReactElement, path = "/about") =>
  renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: path }, el));

const MENU: NavItem[] = [
  { id: "a", label: "Home", url: "/" },
  { id: "b", label: "Services", url: "/services", children: [{ id: "b1", label: "Roofing", url: "/services/roofing", children: [{ id: "b1a", label: "Repairs", url: "/services/roofing/repairs" }] }] },
  { id: "c", label: "About", url: "/about" },
];

function nav(data: Partial<HeaderNavBlockProps["data"]>, id = "hn1"): HeaderNavBlockProps {
  return { id, type: "header_nav", order: 0, visible: true, data: { items: [], style: "default", ...data } } as unknown as HeaderNavBlockProps;
}

// ── Resolution ──────────────────────────────────────────────────────────

test("pickNavItems: a menu id wins over the location and the block's links; blocks without one resolve as before", () => {
  const byLoc = new Map([["header", [{ id: "h", label: "H", url: "/h" }]]]);
  const byId = new Map([["m1", MENU]]);
  const own = [{ id: "o", label: "Own", url: "/o" }];
  assert.equal(pickNavItems({ items: own, menuId: "m1", menuLocation: "header" }, byLoc, byId), MENU);
  assert.equal(pickNavItems({ items: own, menuId: "gone", menuLocation: "header" }, byLoc, byId), byLoc.get("header"));
  assert.equal(pickNavItems({ items: own, menuId: "gone" }, byLoc, byId), own);
  // Pre-P2 calls (no byId) and pre-P2 blocks (no menuId): unchanged.
  assert.equal(pickNavItems({ items: own, menuLocation: "header" }, byLoc), byLoc.get("header"));
  assert.equal(pickNavItems({ items: own }, byLoc, byId), own);
});

test("a nested block naming a menu by id is resolved; isMenuPlacement only for header_nav with a layout", () => {
  assert.equal(nestedNeedsResolve(nav({ menuId: "m1" }) as unknown as Block), true);
  assert.equal(nestedNeedsResolve(nav({ items: MENU }) as unknown as Block), false);
  assert.equal(isMenuPlacement(nav({ layout: "bar" })), true);
  assert.equal(isMenuPlacement(nav({})), false);
  assert.equal(isMenuPlacement({ type: "navigation", data: { layout: "bar" } }), false);
});

const footer = (cols: FooterBlockProps["data"]["columns"], extra: Partial<FooterBlockProps["data"]> = {}): FooterBlockProps =>
  ({ id: "ft", type: "footer", order: 0, visible: true, data: { columns: cols, logoText: "Acme", ...extra } }) as unknown as FooterBlockProps;

test("footer columns: only columns with a menu id ask for one; hasMenusToResolve covers page Menu blocks and menu columns", () => {
  const plain = footer([{ id: "c1", heading: "Links", links: [{ id: "l", label: "L", url: "/l" }] }]);
  const withMenu = footer([{ id: "c1", heading: "Links", links: [], menuId: "m1" }]);
  assert.deepEqual(footerColumnMenuIds(plain), []);
  assert.deepEqual(footerColumnMenuIds(withMenu), ["m1"]);
  assert.equal(hasMenusToResolve([plain as unknown as Block]), false);
  assert.equal(hasMenusToResolve([withMenu as unknown as Block]), true);
  assert.equal(hasMenusToResolve([nav({ layout: "vertical", menuId: "m1" }) as unknown as Block]), true);
  // A legacy root header_nav is handled by the header path (hasNav), not this one.
  assert.equal(hasMenusToResolve([nav({ items: MENU }) as unknown as Block]), false);
  const inSection = { id: "s", type: "container", data: { columns: [{ id: "c", blocks: [withMenu] }] } } as unknown as Block;
  assert.equal(collectFooterBlocks([inSection]).length, 1);
});

test("mapNavBlocks: footers are filled only with a footer filler and only when a column names a menu; others keep identity", async () => {
  const plain = footer([{ id: "c1", heading: "Links", links: [] }]);
  const withMenu = footer([{ id: "c1", heading: "Links", links: [], menuId: "m1" }]);
  const blocks = [plain, withMenu] as unknown as Block[];
  const fill = async (b: Block) => b;
  // Without a footer filler (every caller before P2): same array back.
  assert.equal(await mapNavBlocks(blocks, fill), blocks);
  let filled = 0;
  const out = await mapNavBlocks(blocks, fill, 0, async (b) => { filled++; return { ...b, data: { ...b.data, touched: true } } as Block; });
  assert.equal(filled, 1);
  assert.equal(out[0], blocks[0]);
  assert.notEqual(out[1], blocks[1]);
});

test("menu ids read by placements, and the Navigation screen's 'Used in' counts them", () => {
  const page = [{ id: "s", type: "container", data: { columns: [{ id: "c", blocks: [nav({ layout: "vertical", menuId: "m2" })] }] } }];
  const ft = [footer([{ id: "c1", heading: "X", links: [], menuId: "m3" }])];
  assert.deepEqual([...menuIdsReadBy([page, ft])].sort(), ["m2", "m3"]);
  const readers = menuReaders({ classicHeader: [], classicFooter: ft, classicPrefooter: [], pages: [page], studioHeaderRefs: null, studioFooterRefs: null });
  const usage = menuUsage([{ id: "m2", location: null }, { id: "m3", location: "none" }, { id: "m4", location: null }], readers);
  assert.deepEqual(usage, { m2: ["pages"], m3: ["footer"], m4: [] });
});

test("import helpers leave blocks that show a menu by id alone", () => {
  const blocks = [nav({ items: MENU, menuId: "m1", layout: "bar" })] as unknown as Block[];
  assert.equal(findImportableNav(blocks, new Set()), null);
  assert.equal(pointNavBlocksAt(blocks, MENU, "header").count, 0);
});

test("a section holding a page Menu block is not a header; a container header with a classic header_nav still is", () => {
  const section = { id: "s", type: "container", data: { columns: [{ id: "c", blocks: [nav({ layout: "vertical", menuId: "m1" })] }] } } as unknown as Block;
  const header = { id: "h", type: "container", data: { columns: [{ id: "c", blocks: [nav({ items: MENU })] }] } } as unknown as Block;
  const mixed = { id: "x", type: "container", data: { columns: [{ id: "c", blocks: [{ id: "l", type: "header_logo", data: {} }, nav({ layout: "bar" })] }] } } as unknown as Block;
  assert.equal(isChromeBlock(section, "header"), false);
  assert.equal(isChromeBlock(header, "header"), true);
  assert.equal(isChromeBlock(mixed, "header"), true);
});

// ── Pixel safety: blocks saved before P2 ────────────────────────────────

const LEGACY_NAV_DATA: Partial<HeaderNavBlockProps["data"]>[] = [
  {}, { style: "centered" }, { textColor: "#ff0000" }, { menuUppercase: true },
  { menuFontSize: 15, menuFontWeight: 600, menuGap: 12 }, { menuGap: 0 }, { menuLocation: "header" },
];

for (const [name, items] of Object.entries(LEGACY_MENUS)) {
  test(`header_nav saved before P2 renders byte for byte as v1.0.925: ${name}`, () => {
    for (const extra of LEGACY_NAV_DATA) {
      for (const p of ["/", "/about", "/services/x"]) {
        const block = nav({ items, ...extra });
        assert.equal(html(React.createElement(HeaderNavBlock, { block }), p), html(React.createElement(HeaderNavV925, { block }), p), JSON.stringify(extra));
      }
    }
  });
}

const FOOTER_COLS: FooterBlockProps["data"]["columns"] = [
  { id: "c1", heading: "Company", links: [{ id: "l1", label: "About", url: "/about" }, { id: "l2", label: "বাংলা", url: "/bn", lang: "bn" }] },
  { id: "c2", heading: "Visit", text: "1 Main St\nSingapore", links: [] },
  { id: "c3", heading: "Help", links: [{ id: "l3", label: "Contact", url: "/contact" }] },
];
const FOOTER_VARIANTS: Partial<FooterBlockProps["data"]>[] = [
  {}, { style: "light" }, { style: "colored", backgroundColor: "#123456" }, { style: "retail", socials: [{ platform: "facebook", url: "https://fb.com/x" }] },
  { largeTapTargets: true }, { bottomLinks: [{ id: "b", label: "Privacy", url: "/privacy" }], showNewsletter: true, tagline: "Hi" },
];

test("footer blocks saved before P2 render byte for byte as v1.0.925 (every style)", () => {
  for (const extra of FOOTER_VARIANTS) {
    const block = footer(FOOTER_COLS, extra);
    const a = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterBlock, { block }) }));
    const b = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterV925, { block }) }));
    assert.equal(a, b, JSON.stringify(extra));
  }
});

// ── New placements ──────────────────────────────────────────────────────

test("page Menu block: bar with a phone menu button, vertical, inline, folding list, drawer; empty renders nothing", () => {
  const bar = html(React.createElement(HeaderNavBlock, { block: nav({ layout: "bar", items: MENU, menuStyle: { preset: "pill" } }) }));
  assert.match(bar, /data-pc-menu="bar"/);
  assert.match(bar, /class="pcm pcm-bar"/);
  assert.match(bar, /class="pcm pcm-drawer"/);
  assert.match(bar, /aria-expanded="false"/);
  const same = html(React.createElement(HeaderNavBlock, { block: nav({ layout: "bar", items: MENU, phoneLayout: "same" }) }));
  assert.ok(!same.includes("pcm-drawer"));
  const vertical = html(React.createElement(HeaderNavBlock, { block: nav({ layout: "vertical", items: MENU, levels: 2 }) }));
  assert.match(vertical, /pcm-vertical/);
  assert.match(vertical, />Roofing</);
  assert.ok(!vertical.includes(">Repairs<"), "levels 2 hides the third level");
  const inline = html(React.createElement(HeaderNavBlock, { block: nav({ layout: "inline", items: MENU, align: "center", label: "Quick links" }) }));
  assert.match(inline, /data-align="center"/);
  assert.match(inline, /aria-label="Quick links"/);
  assert.ok(!inline.includes(">Roofing<"));
  assert.match(html(React.createElement(HeaderNavBlock, { block: nav({ layout: "accordion", items: MENU }) })), /pcm-acc/);
  assert.match(html(React.createElement(HeaderNavBlock, { block: nav({ layout: "drawer", items: MENU, buttonLabel: "Browse" }) })), />Browse</);
  assert.equal(html(React.createElement(HeaderNavBlock, { block: nav({ layout: "vertical", menuId: "m1" }) })), "");
});

test("footer column with a saved menu lists its links in the column's own style; other columns unchanged", () => {
  const items: NavItem[] = [
    { id: "x1", label: "Shop", url: "/shop", children: [{ id: "x1a", label: "Shoes", url: "/shop/shoes" }] },
    { id: "x2", label: "Blog", url: "https://blog.example.com", target: "_blank" },
    { id: "x3", label: "Desk only", url: "/d", device: "desktop" },
    { id: "x4", label: "Members", url: "/m", audience: "members" },
  ];
  const cols = [{ ...FOOTER_COLS[0], menuId: "m1", menuItems: items }, FOOTER_COLS[2]];
  const out = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterBlock, { block: footer(cols) }) }));
  assert.match(out, />Shop</);
  assert.ok(!out.includes(">About<"), "the typed links are replaced");
  assert.ok(!out.includes(">Shoes<"), "one level by default");
  assert.match(out, /target="_blank" rel="noopener noreferrer"[^>]*>Blog</);
  assert.match(out, /class="hidden md:list-item"><a[^>]*>Desk only</);
  assert.ok(!out.includes(">Members<"), "audience items wait for the browser session");
  assert.match(out, />Contact</);
  const two = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterBlock, { block: footer([{ ...cols[0], menuLevels: 2 }]) }) }));
  assert.match(two, /class="ps-3"><a[^>]*>Shoes</);
  const retail = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterBlock, { block: footer(cols, { style: "retail" }) }) }));
  assert.match(retail, /opacity-80 hover:opacity-100 hover:underline" href="\/shop">Shop</);
  // A column whose menu was deleted (menuId but no menuItems) keeps its typed links.
  const gone = html(React.createElement(SiteContactProvider, { value: {}, children: React.createElement(FooterBlock, { block: footer([{ ...FOOTER_COLS[0], menuId: "gone" }]) }) }));
  assert.match(gone, />About</);
});

test("t() fills every occurrence of a placeholder (the import toast uses {location} twice)", async () => {
  const fs = await import("node:fs");
  const src = fs.readFileSync("src/lib/i18n/language-provider.tsx", "utf8");
  assert.ok(src.includes("str = str.split(`{${k}}`).join(String(v));"), "all occurrences, not String.replace's first one");
  const fill = (str: string, vars: Record<string, string>) => { for (const [k, v] of Object.entries(vars)) str = str.split(`{${k}}`).join(v); return str; };
  const { en } = await import("@/lib/i18n/locales/en");
  const { bn } = await import("@/lib/i18n/locales/bn");
  for (const dict of [en, bn]) assert.ok(!fill(dict["navPage.importedMenu"], { location: "x" }).includes("{location}"));
});
