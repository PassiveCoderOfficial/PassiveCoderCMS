/**
 * Menus P1 pixel safety: the Menu Studio renderer (nav-menu-studio.tsx) got a
 * look context, audience filtering and better active matching, but only for
 * the new menu renderer. Outside it, every menu (legacy and studio) must
 * render byte for byte what v1.0.924 rendered (fixtures/*.v924.tsx are those
 * files). Also checks the new MenuRenderer layouts.
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
import * as V924 from "./fixtures/nav-menu-core.v924";
import * as V924Studio from "./fixtures/nav-menu-studio.v924";
import { MenuLinkList } from "@/components/blocks/navigation/menu-link-list";
import { MenuRenderer } from "@/components/blocks/navigation/menu-renderer";
import { MENU_LAYOUTS, MENU_PRESETS } from "../menu-style";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";

const html = (el: React.ReactElement, path = "/about") =>
  renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: path }, el));

/** Menus that use studio features (they render through nav-menu-studio). */
const STUDIO_MENUS: Record<string, NavItem[]> = {
  clickDropdown: [{
    id: "st", label: "Services", url: "#", openOn: "click", children: [
      { id: "st1", label: "Roofing", url: "/roofing", description: "Repairs and new roofs", badge: "New", icon: "Home", showIcon: true },
      { id: "st2", label: "Desktop only", url: "/d", device: "desktop" },
      { id: "st3", label: "Phone only", url: "/m", device: "mobile" },
      { id: "st4", label: "More", url: "#", children: [{ id: "st4a", label: "Deep", url: "/deep" }] },
    ],
  }],
  mega: [{
    id: "mg", label: "Shop", url: "/shop", megaMenu: true, megaColumns: 3, mega: { featured: { title: "Sale", text: "Up to 50%", url: "/sale", image: "/x.jpg" } }, children: [
      { id: "g1", label: "Men", url: "#", icon: "User", badge: "Hot", children: [{ id: "g1a", label: "Shirts", url: "/men/shirts", description: "Cotton" }] },
      { id: "g2", label: "Women", url: "/women", children: [{ id: "g2a", label: "Dresses", url: "/women/dresses", showIcon: true, icon: "Star" }] },
      { id: "s1", label: "All products", url: "/products" },
    ],
  }],
  linksColumn: [{
    id: "lc", label: "Explore", url: "#", megaLinksAs: "column", megaLinksTitle: "Quick", mega: {}, children: [
      { id: "lc1", label: "Group", url: "/g", children: [{ id: "lc1a", label: "A", url: "/a" }] },
      { id: "lc2", label: "Single", url: "/single", badge: "1" },
    ],
  }],
  topLevel: [
    { id: "t1", label: "About", url: "/about", badge: "New" },
    { id: "t2", label: "Phone", url: "tel:1", device: "mobile" },
    { id: "t3", label: "Pill", url: "/pill", highlight: "gold", showIcon: true, icon: "Star" },
  ],
};
const ALL = { ...LEGACY_MENUS, ...STUDIO_MENUS };

for (const [name, items] of Object.entries(ALL)) {
  test(`"${name}": desktop items, open panels and phone drawer render exactly as v1.0.924`, () => {
    for (const path of ["/", "/about", "/about-us", "/services/x"]) {
      for (const item of items) {
        const a = html(React.createElement("ul", null, React.createElement(Current.NavItemDesktop, { item, currentColor: "#123456" })), path);
        const b = html(React.createElement("ul", null, React.createElement(V924.NavItemDesktop, { item, currentColor: "#123456" })), path);
        assert.equal(a, b, `${item.id} at ${path}`);
      }
    }
    for (const item of items.filter((i) => i.children?.length)) {
      assert.equal(
        html(React.createElement(CurrentStudio.MegaPanel, { item, onNavigate: () => {} })),
        html(React.createElement(V924Studio.MegaPanel, { item, onNavigate: () => {} })), `mega ${item.id}`);
      assert.equal(
        html(React.createElement(CurrentStudio.DropdownPanel, { items: item.children!, onNavigate: () => {} })),
        html(React.createElement(V924Studio.DropdownPanel, { items: item.children!, onNavigate: () => {} })), `dropdown ${item.id}`);
      assert.equal(
        html(React.createElement(Current.DropdownMenu, { items: item.children!, forceMega: item.megaMenu, columns: item.megaColumns, linksAs: item.megaLinksAs, linksTitle: item.megaLinksTitle })),
        html(React.createElement(V924.DropdownMenu, { items: item.children!, forceMega: item.megaMenu, columns: item.megaColumns, linksAs: item.megaLinksAs, linksTitle: item.megaLinksTitle })), `legacy panel ${item.id}`);
    }
    for (const expanded of [null, ...items.map((i) => i.id)]) {
      assert.equal(
        html(React.createElement(Current.MobileNavList, { items, onNavigate: () => {}, defaultExpanded: expanded })),
        html(React.createElement(V924.MobileNavList, { items, onNavigate: () => {}, defaultExpanded: expanded })), `phone ${expanded}`);
    }
  });
}

test("items with by-id links and per-language labels render like plain links (legacy markup)", () => {
  const plain: NavItem[] = [{ id: "a", label: "About", url: "/about" }];
  const linked: NavItem[] = [{ id: "a", label: "About", url: "/about", kind: "page", ref: "p1", labels: { bn: "সম্পর্কে" } }];
  assert.equal(
    html(React.createElement("ul", null, React.createElement(Current.NavItemDesktop, { item: linked[0], currentColor: "red" }))),
    html(React.createElement("ul", null, React.createElement(V924.NavItemDesktop, { item: plain[0], currentColor: "red" }))));
});

test("audience: customer-only items are not in the server HTML; guest-only items are", () => {
  const items: NavItem[] = [
    { id: "in", label: "Log in", url: "/account/login", audience: "guests" },
    { id: "acc", label: "My account", url: "/account", audience: "members" },
  ];
  const bar = html(React.createElement("ul", null, items.map((item) => React.createElement(Current.NavItemDesktop, { key: item.id, item, currentColor: "red" }))));
  assert.match(bar, /Log in/);
  assert.doesNotMatch(bar, /My account/);
  const phone = html(React.createElement(Current.MobileNavList, { items, onNavigate: () => {} }));
  assert.match(phone, /Log in/);
  assert.doesNotMatch(phone, /My account/);
  const footer = html(React.createElement(MenuLinkList, { items }));
  assert.match(footer, /Log in/);
  assert.doesNotMatch(footer, /My account/);
});

// ── The new renderer ────────────────────────────────────────────────────

const SAMPLE: NavItem[] = [
  { id: "h", label: "Home", url: "/" },
  { id: "a", label: "About", url: "/about" },
  { id: "s", label: "Services", url: "/services", children: [
    { id: "s1", label: "Roofing", url: "/services/roofing", children: [{ id: "s1a", label: "Repairs", url: "/services/roofing/repairs" }] },
    { id: "s2", label: "Painting", url: "/services/painting" },
  ] },
  { id: "d", label: "Desktop", url: "/desk", device: "desktop" },
  { id: "m", label: "Members", url: "/account", audience: "members" },
];

test("MenuRenderer: every layout and preset renders, scoped by .pcm with CSS variables", () => {
  for (const layout of MENU_LAYOUTS) {
    for (const preset of MENU_PRESETS) {
      const out = html(React.createElement(MenuRenderer, { items: SAMPLE, layout, style: { preset }, label: "Main menu" }), "/about-us");
      assert.match(out, new RegExp(`<nav aria-label="Main menu" class="pcm pcm-${layout}" style="--pcm-fs:`), `${layout}/${preset}`);
      assert.match(out, /data-pcm-hover="/);
      assert.doesNotMatch(out, /Members/, "customer-only item hidden until the session is known");
    }
  }
});

test("MenuRenderer bar: var-styled cells, exact active match, desktop-only items kept", () => {
  const out = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "bar" }), "/about");
  assert.match(out, /class="pcm-cell group gap-1.5"[^>]*>|data-active="" class="pcm-cell/);
  assert.match(out, /aria-current="page"[^>]*data-active=""/);
  assert.doesNotMatch(out, /style="color:inherit/);
  assert.match(out, /Desktop/);
  const notActive = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "bar" }), "/about-us");
  assert.doesNotMatch(notActive, /aria-current="page"/, "/about is not active on /about-us");
});

test("MenuRenderer vertical: three levels as nested lists; levels caps the depth; inline is one row", () => {
  const v = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "vertical" }), "/services/painting");
  assert.equal((v.match(/<ul class="pcm-vsub">/g) ?? []).length, 2);
  assert.match(v, /Repairs/);
  assert.match(v, /aria-current="page" data-active="" href="\/services\/painting"/);
  const v1 = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "vertical", levels: 1 }));
  assert.doesNotMatch(v1, /Roofing/);
  const inline = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "inline" }));
  assert.doesNotMatch(inline, /Roofing/);
  assert.match(inline, /class="hidden md:list-item"/, "device-only links hide by CSS");
});

test("MenuRenderer drawer: a closed menu button with aria wiring; accordion drops desktop-only items", () => {
  const d = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "drawer", label: "Menu", buttonLabel: "Menu" }));
  assert.match(d, /<button type="button" class="pcm-cell pcm-toggle" aria-expanded="false" aria-controls="[^"]+"/);
  assert.match(d, /hidden="" data-drawer="side"/);
  const acc = html(React.createElement(MenuRenderer, { items: SAMPLE, layout: "accordion" }));
  assert.doesNotMatch(acc, /Desktop/);
  assert.match(acc, /class="flex-1 flex items-center gap-2 pcm-mcell"/);
});
