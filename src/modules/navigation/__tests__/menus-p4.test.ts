/**
 * Menus P4 (mega menu builder): pixel safety and the new mega features.
 *
 * Every menu shape that can exist before P4 (legacy menus, Menu Studio
 * dropdowns and mega menus with one featured card, single links as a strip
 * or a column, 2 to 5 columns, icons, badges, descriptions, auto-list
 * columns, hand-picked lists...) must render byte for byte what v1.0.927
 * rendered (fixtures/*.v927.tsx are those files): desktop items at four
 * paths, every open panel, the phone drawer with each item expanded, and
 * the menu renderer in every layout. Then the new fields: up to 2 cards,
 * full width, 6 columns, column span / image / empty column, and the phone
 * accordion of columns.
 *
 * Run: npm run test:nav
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { NavItem } from "@/types/cms";
import * as Current from "@/components/blocks/navigation/nav-menu-core";
import * as CurrentStudio from "@/components/blocks/navigation/nav-menu-studio";
import { MenuRenderer } from "@/components/blocks/navigation/menu-renderer";
import * as V927 from "./fixtures/nav-menu-core.v927";
import * as V927Studio from "./fixtures/nav-menu-studio.v927";
import { MenuRenderer as MenuRendererV927 } from "./fixtures/menu-renderer.v927";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";
import { MENU_LAYOUTS } from "../menu-style";
import { normalizeMenu, structureLostByReplace, usesStudio } from "../menu-model";
import { cardsPatch, megaCards, megaCardsRaw, moveEntry, newMegaColumn, splitMega, usesMegaBuilder, columnsPatch } from "../mega";

const html = (el: React.ReactElement, path = "/about") =>
  renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: path }, el));

const links = (p: string, n = 3): NavItem[] => Array.from({ length: n }, (_, i) => ({ id: `${p}${i}`, label: `${p} link ${i}`, url: `/${p}/${i}` }));

/** Every mega / dropdown shape the Navigation screen could save before P4. */
const PRE_P4: Record<string, NavItem[]> = {
  featuredFull: [{
    id: "f", label: "Shop", url: "/shop", megaMenu: true, megaColumns: 3,
    mega: { featured: { title: "Sale", text: "Up to 50%", url: "/sale", image: "/x.jpg", ctaLabel: "Shop now" } },
    children: [
      { id: "g1", label: "Men", url: "#", icon: "User", badge: "Hot", children: links("men") },
      { id: "g2", label: "Women", url: "/women", description: "All of it", children: [{ id: "w", label: "Dresses", url: "/d", showIcon: true, icon: "Star", description: "Silk" }] },
      { id: "s1", label: "All products", url: "/products", badge: "New" },
    ],
  }],
  featuredImageOnly: [{ id: "fi", label: "Brands", url: "#", mega: { featured: { image: "/b.jpg" } }, children: [{ id: "c", label: "Col", url: "#", children: links("c", 2) }] }],
  featuredTitleNoLink: [{ id: "ft", label: "Info", url: "#", mega: { featured: { title: "Hello", text: "No link" } }, children: [{ id: "c", label: "Col", url: "#", children: links("i", 2) }] }],
  featuredEmpty: [{ id: "fe", label: "Empty card", url: "#", mega: { featured: {} }, children: [{ id: "c", label: "Col", url: "#", children: links("e", 2) }] }],
  megaEmptyConfig: [{ id: "me", label: "Explore", url: "#", mega: {}, children: [{ id: "c", label: "Col", url: "#", children: links("x") }, { id: "one", label: "Single", url: "/one" }] }],
  linksColumn: [{ id: "lc", label: "Explore", url: "#", megaLinksAs: "column", megaLinksTitle: "Quick", mega: { featured: { title: "T", url: "/t" } }, children: [
    { id: "lc1", label: "Group", url: "/g", children: links("g") },
    { id: "lc2", label: "Single", url: "/single", badge: "1", showIcon: true, icon: "Star" },
  ] }],
  linksColumnNoTitle: [{ id: "ln", label: "More", url: "/more", megaLinksAs: "column", openOn: "click", children: [
    { id: "a", label: "A", url: "#", children: links("a") }, { id: "b", label: "B", url: "/b" },
  ] }],
  ...Object.fromEntries([2, 3, 4, 5].map((n) => [`columns${n}`, [{
    id: `c${n}`, label: `Cols ${n}`, url: "#", megaMenu: true, megaColumns: n as 2 | 3 | 4 | 5, openOn: "click" as const,
    children: Array.from({ length: n }, (_, i) => ({ id: `c${n}-${i}`, label: `Col ${i}`, url: i % 2 ? `/col${i}` : "#", icon: i ? "Home" : undefined, children: links(`c${n}${i}`, 2) })),
  }]])),
  studioMegaNoColumnsSet: [{ id: "nc", label: "Services", url: "/services", badge: "Hot", children: [
    { id: "n1", label: "Roofing", url: "#", children: links("r") },
    { id: "n2", label: "Painting", url: "#", children: links("p") },
  ] }],
  autoListColumns: [{ id: "al", label: "Products", url: "/shop", mega: {}, children: [
    // As expandDynamicChildren leaves them: an auto list filled, one that came back empty.
    { id: "al1", label: "Latest", url: "#", childSource: "products", childIds: ["p1"], children: [{ id: "auto-products-p1", label: "Kettle", url: "/products/kettle" }] },
    { id: "al2", label: "Empty list", url: "#", childSource: "posts", children: [] },
  ] }],
  dropdownFlyouts: [{ id: "dd", label: "Company", url: "#", megaMenu: false, studio: true, children: [
    { id: "d1", label: "About", url: "/about", description: "Who we are" },
    { id: "d2", label: "Team", url: "#", children: links("t", 2) },
  ] }],
  deviceAndAudience: [
    { id: "da", label: "Desk", url: "/desk", device: "desktop" },
    { id: "dm", label: "Phone", url: "tel:1", device: "mobile" },
    { id: "dg", label: "Log in", url: "/account/login", audience: "guests" },
    { id: "dh", label: "Pill", url: "/pill", highlight: "brand", showIcon: true, icon: "Star", children: [{ id: "dh1", label: "Sub", url: "#", children: links("s", 1) }], mega: {} },
  ],
};
const ALL: Record<string, NavItem[]> = { ...LEGACY_MENUS, ...PRE_P4 };

test("no menu saved before P4 uses a mega builder field", () => {
  for (const [name, items] of Object.entries(ALL)) for (const i of items) assert.equal(usesMegaBuilder(i), false, `${name} ${i.id}`);
});

for (const [name, items] of Object.entries(ALL)) {
  test(`"${name}": renders byte for byte as v1.0.927 (bar, panels, phone drawer, menu renderer)`, () => {
    for (const path of ["/", "/about", "/about-us", "/services/x"]) {
      const a = html(React.createElement("ul", null, items.map((item) => React.createElement(Current.NavItemDesktop, { key: item.id, item, currentColor: "#123456" }))), path);
      const b = html(React.createElement("ul", null, items.map((item) => React.createElement(V927.NavItemDesktop, { key: item.id, item, currentColor: "#123456" }))), path);
      assert.equal(a, b, `bar at ${path}`);
    }
    for (const item of items.filter((i) => i.children?.length)) {
      assert.equal(
        html(React.createElement(CurrentStudio.MegaPanel, { item, onNavigate: () => {} })),
        html(React.createElement(V927Studio.MegaPanel, { item, onNavigate: () => {} })), `mega ${item.id}`);
      assert.equal(
        html(React.createElement(CurrentStudio.DropdownPanel, { items: item.children!, onNavigate: () => {} })),
        html(React.createElement(V927Studio.DropdownPanel, { items: item.children!, onNavigate: () => {} })), `dropdown ${item.id}`);
      assert.equal(
        html(React.createElement(Current.DropdownMenu, { items: item.children!, forceMega: item.megaMenu, columns: item.megaColumns, linksAs: item.megaLinksAs, linksTitle: item.megaLinksTitle })),
        html(React.createElement(V927.DropdownMenu, { items: item.children!, forceMega: item.megaMenu, columns: item.megaColumns, linksAs: item.megaLinksAs, linksTitle: item.megaLinksTitle })), `legacy panel ${item.id}`);
    }
    for (const expanded of [null, ...items.map((i) => i.id)]) {
      assert.equal(
        html(React.createElement(Current.MobileNavList, { items, onNavigate: () => {}, defaultExpanded: expanded })),
        html(React.createElement(V927.MobileNavList, { items, onNavigate: () => {}, defaultExpanded: expanded })), `phone ${expanded}`);
      for (const item of items) {
        const props = { item, expanded: expanded === item.id, onToggle: () => {}, onNavigate: () => {} };
        assert.equal(html(React.createElement(CurrentStudio.StudioMobileItem, props)), html(React.createElement(V927Studio.StudioMobileItem, props)), `studio phone ${item.id}`);
      }
    }
    for (const layout of MENU_LAYOUTS) {
      for (const style of [null, { preset: "pill" as const }, { preset: "brand" as const, dropdown: { look: "dark" as const } }]) {
        assert.equal(
          html(React.createElement(MenuRenderer, { items, layout, style, label: "Main" })),
          html(React.createElement(MenuRendererV927, { items, layout, style, label: "Main" })), `${layout} ${JSON.stringify(style)}`);
      }
    }
  });
}

test("normalizeMenu: legacy and pre-P4 menus come back deep-equal", () => {
  for (const [name, items] of Object.entries(ALL)) {
    const copy = JSON.parse(JSON.stringify(items));
    assert.deepEqual(normalizeMenu(copy), JSON.parse(JSON.stringify(items)), name);
  }
});

test("normalizeMenu: mega builder fields are checked, other keys kept", () => {
  const out = normalizeMenu([{
    id: "m", label: "M", url: "#",
    mega: { featured: { title: "old" }, cards: [{ title: "A", junk: 1, image: "" }, "x", { image: "/b.jpg" }, { title: "C" }], width: "huge" },
    children: [
      { id: "c1", label: "C1", url: "#", megaColumn: true, megaSpan: 2, megaImage: "/i.jpg" },
      { id: "c2", label: "C2", url: "#", megaColumn: "yes", megaSpan: 3, megaImage: "  " },
    ],
  }]);
  assert.deepEqual(out[0].mega, { featured: { title: "old" }, cards: [{ title: "A" }, { image: "/b.jpg" }] });
  assert.deepEqual(out[0].children![0], { id: "c1", label: "C1", url: "#", megaColumn: true, megaSpan: 2, megaImage: "/i.jpg" });
  assert.deepEqual(out[0].children![1], { id: "c2", label: "C2", url: "#" });
  const bad = normalizeMenu([{ id: "b", label: "B", url: "#", mega: { cards: "nope", width: "full" } }]);
  assert.deepEqual(bad[0].mega, { width: "full" });
});

test("column fields make the item use the studio renderer; dropping them is a loss MCP refuses", () => {
  for (const f of [{ megaColumn: true as const }, { megaSpan: 2 as const }, { megaImage: "/a.jpg" }]) {
    const item: NavItem = { id: "t", label: "T", url: "#", children: [{ id: "c", label: "C", url: "#", ...f }] };
    assert.equal(usesStudio(item), true, JSON.stringify(f));
    assert.equal(usesMegaBuilder(item), true);
    const stripped: NavItem = { id: "t", label: "T", url: "#", children: [{ id: "c", label: "C", url: "#" }] };
    assert.ok(structureLostByReplace([item], [stripped]).some((x) => x.startsWith("menu settings")), JSON.stringify(f));
  }
  // 6 columns: only the studio renderer draws them (legacy stops at 5), so the live site matches the builder's preview.
  const six: NavItem = { id: "t", label: "T", url: "#", megaColumns: 6, children: [{ id: "c", label: "C", url: "#", children: links("s") }] };
  assert.equal(usesStudio(six), true);
  assert.equal(usesStudio({ ...six, megaColumns: 5 }), false);
  const withCards: NavItem = { id: "t", label: "T", url: "#", mega: { cards: [{ title: "x" }] }, children: links("q") };
  assert.ok(structureLostByReplace([withCards], [{ ...withCards, mega: undefined }]).length > 0);
});

test("cards: the old single card is read; editing cards moves it into cards[] without losing it", () => {
  const old: NavItem = { id: "o", label: "O", url: "#", mega: { featured: { title: "Old", url: "/o" } }, children: [] };
  assert.deepEqual(megaCards(old), [{ title: "Old", url: "/o" }]);
  const p = cardsPatch(old, [...megaCardsRaw(old), { title: "New" }, { title: "Too many" }]);
  assert.deepEqual(p.mega, { cards: [{ title: "Old", url: "/o" }, { title: "New" }] });
  assert.equal(p.megaMenu, true);
  assert.deepEqual(megaCards({ ...old, mega: { featured: { title: "ignored" }, cards: [] } }), [], "cards: [] hides the old card");
});

test("splitMega / newMegaColumn / moveEntry / columnsPatch", () => {
  const col = newMegaColumn("Heading");
  assert.equal(col.megaColumn, true);
  assert.equal(col.url, "#");
  const item: NavItem = { id: "t", label: "T", url: "#", children: [{ id: "s", label: "S", url: "/s" }, col, { id: "g", label: "G", url: "#", children: links("g", 1) }] };
  const { columns, singles } = splitMega(item);
  assert.deepEqual(columns.map((c) => c.id), [col.id, "g"]);
  assert.deepEqual(singles.map((c) => c.id), ["s"]);
  assert.deepEqual(moveEntry(columns, "g", -1).map((c) => c.id), ["g", col.id]);
  assert.equal(moveEntry(columns, "g", 1), columns);
  assert.deepEqual(columnsPatch(columns, singles).children!.map((c) => c.id), [col.id, "g", "s"]);
});

// ── New features render ─────────────────────────────────────────────────

const BUILT: NavItem = {
  id: "b", label: "Shop", url: "/shop", megaMenu: true, megaColumns: 6,
  mega: { width: "full", cards: [{ title: "Card one", url: "/one", image: "/1.jpg" }, { title: "Card two", text: "No link" }] },
  children: [
    { id: "w", label: "Wide", url: "#", megaColumn: true, megaSpan: 2, megaImage: "/wide.jpg", children: links("w", 2) },
    { id: "e", label: "Only a heading", url: "#", megaColumn: true, children: [] },
    { id: "l", label: "Linked", url: "/linked", children: links("l", 2) },
    { id: "s", label: "Single", url: "/single" },
  ],
};

test("mega builder panel: 6 columns, wide column with image, empty column, two cards, full width", () => {
  const out = html(React.createElement(CurrentStudio.MegaPanel, { item: BUILT, onNavigate: () => {} }));
  assert.match(out, /lg:grid-cols-6/);
  assert.match(out, /class="min-w-0 col-span-2"><img src="\/wide.jpg" alt="" loading="lazy" class="mb-3 h-28 w-full rounded-xl object-cover"/);
  assert.match(out, /Only a heading/);
  assert.doesNotMatch(out, /<ul class="space-y-1.5"><\/ul>/, "no empty list for a heading-only column");
  assert.equal((out.match(/rounded-2xl bg-muted\/60/g) ?? []).length, 2);
  assert.match(out, /Card two/);
  assert.match(out, /w-screen max-w-\[100vw\]/);
  assert.match(out, /rounded-none border-y/);
  assert.match(out, /Single/, "single links strip");
  const inline = html(React.createElement(CurrentStudio.MegaPanel, { item: BUILT, onNavigate: () => {}, inline: true }));
  assert.match(inline, /^<div class="relative w-full">/, "the editor preview draws it in the flow, no animation");
});

test("mega builder phone drawer: columns fold open one by one with aria-expanded; cards follow", () => {
  const out = html(React.createElement(CurrentStudio.StudioMobileItem, { item: BUILT, expanded: true, onToggle: () => {}, onNavigate: () => {} }));
  assert.match(out, /class="ms-4 mt-1 border-s-2 border-border ps-3 space-y-3 pb-2"/);
  // Wide (pure heading, has links): one fold-open button (one tab stop); Linked (heading is a link): link + chevron button.
  assert.equal((out.match(/aria-expanded="false"/g) ?? []).length, 2, "one button for Wide, one chevron for Linked");
  assert.match(out, /<p class="flex items-center gap-2 px-2 py-2 text-\[13px\][^"]*flex-1">.*Only a heading/);
  assert.match(out, /href="\/linked"/);
  assert.doesNotMatch(out, /w link 0/, "links of a closed column are not rendered");
  assert.match(out, /Card one/);
  assert.match(out, /Card two/);
  assert.match(out, /href="\/single"/);
});

test("mega builder item in the bar: keyboard wiring stays (button, aria-controls, hidden panel)", () => {
  const out = html(React.createElement("ul", null, React.createElement(CurrentStudio.StudioNavItemDesktop, { item: BUILT, currentColor: "red" })));
  assert.match(out, /aria-expanded="false" aria-controls="[^"]+" aria-haspopup="true"/);
  assert.match(out, /role="group" aria-label="Shop" hidden=""/);
});
