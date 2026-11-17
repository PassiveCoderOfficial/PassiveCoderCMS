/**
 * Pixel safety for the Menu Studio: every menu saved before it must render
 * the exact same HTML as on origin/main (fixtures/nav-menu-core.origin-main.tsx
 * is that file, plus two markup-neutral test hooks). Desktop items closed,
 * every dropdown / mega panel open, and the phone drawer with each item
 * expanded are compared byte for byte.
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
import * as Legacy from "./fixtures/nav-menu-core.origin-main";
import { MenuLinkList } from "@/components/blocks/navigation/menu-link-list";
import { MegaPanel, DropdownPanel } from "@/components/blocks/navigation/nav-menu-studio";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";
import { usesStudio } from "../menu-model";

const html = (el: React.ReactElement, path = "/about") =>
  renderToStaticMarkup(React.createElement(PathnameContext.Provider, { value: path }, el));

const desktop = (M: typeof Current | typeof Legacy, item: NavItem) =>
  html(React.createElement("ul", null, React.createElement(M.NavItemDesktop, { item, currentColor: "#123456" })));

const dropdown = (M: typeof Current | typeof Legacy, item: NavItem) =>
  html(React.createElement(M.DropdownMenu, {
    items: item.children!, forceMega: item.megaMenu, columns: item.megaColumns,
    linksAs: item.megaLinksAs, linksTitle: item.megaLinksTitle,
  }));

const mobile = (M: typeof Current | typeof Legacy, items: NavItem[], expanded: string | null) =>
  html(React.createElement(M.MobileNavList, { items, onNavigate: () => {}, defaultExpanded: expanded }));

for (const [name, items] of Object.entries(LEGACY_MENUS)) {
  test(`legacy menu "${name}" uses no studio field`, () => {
    for (const item of items) assert.equal(usesStudio(item), false, item.id);
  });

  test(`legacy menu "${name}": desktop items render identical HTML to origin/main`, () => {
    for (const path of ["/", "/about", "/services/x"]) {
      for (const item of items) {
        const a = html(React.createElement("ul", null, React.createElement(Current.NavItemDesktop, { item, currentColor: "#123456" })), path);
        const b = html(React.createElement("ul", null, React.createElement(Legacy.NavItemDesktop, { item, currentColor: "#123456" })), path);
        assert.equal(a, b, `${item.id} at ${path}`);
        assert.ok(a.length > 20);
      }
    }
  });

  test(`legacy menu "${name}": open dropdown / mega panels render identical HTML`, () => {
    for (const item of items.filter((i) => i.children?.length)) {
      assert.equal(dropdown(Current, item), dropdown(Legacy, item), item.id);
    }
  });

  test(`legacy menu "${name}": phone drawer renders identical HTML (closed and each item expanded)`, () => {
    for (const expanded of [null, ...items.map((i) => i.id)]) {
      assert.equal(mobile(Current, items, expanded), mobile(Legacy, items, expanded), String(expanded));
    }
  });
}

test("all legacy menus side by side in one bar render identical HTML", () => {
  const all = Object.values(LEGACY_MENUS).flat();
  assert.equal(
    html(React.createElement("ul", null, all.map((item) => React.createElement(Current.NavItemDesktop, { key: item.id, item, currentColor: "red" })))),
    html(React.createElement("ul", null, all.map((item) => React.createElement(Legacy.NavItemDesktop, { key: item.id, item, currentColor: "red" })))),
  );
});

// ── Studio items take the new path, and only they do ─────────────────────

const studioDropdown: NavItem = {
  id: "st", label: "Services", url: "#", openOn: "click", children: [
    { id: "st1", label: "Roofing", url: "/roofing", description: "Repairs and new roofs", badge: "New", icon: "Home", showIcon: true },
    { id: "st2", label: "Desktop only", url: "/d", device: "desktop" },
    { id: "st3", label: "Phone only", url: "/m", device: "mobile" },
  ],
};

test("a studio item renders through the studio renderer (button trigger, aria-expanded, aria-controls)", () => {
  const out = desktop(Current, studioDropdown);
  assert.notEqual(out, desktop(Legacy, studioDropdown));
  assert.match(out, /data-nav-top/);
  assert.match(out, /<button[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"/);
  assert.match(out, /role="group"/);
});

test("device visibility: phone-only items are left out of the desktop bar, desktop-only out of the drawer", () => {
  assert.equal(desktop(Current, { id: "m", label: "Call us", url: "tel:1", device: "mobile" }), "<ul></ul>");
  const drawer = mobile(Current, [{ id: "d", label: "Desktop thing", url: "/d", device: "desktop" }, { id: "k", label: "Kept", url: "/k" }], null);
  assert.doesNotMatch(drawer, /Desktop thing/);
  assert.match(drawer, /Kept/);
  const open = mobile(Current, [studioDropdown], "st");
  assert.match(open, /Phone only/);
  assert.doesNotMatch(open, /Desktop only/);
  assert.match(open, /Repairs and new roofs/);
  assert.match(open, />New</);
});

test("mixing: a studio item does not change the legacy items next to it", () => {
  const legacy = LEGACY_MENUS.dropdown;
  const mixed = [...legacy, studioDropdown];
  const cur = mobile(Current, mixed, null);
  const old = mobile(Legacy, legacy, null);
  // The legacy items' markup is a prefix of the mixed list's markup.
  const legacyPart = old.replace(/<\/ul>$/, "");
  assert.ok(cur.startsWith(legacyPart));
});

test("MenuLinkList renders a menu as plain footer links", () => {
  const out = html(React.createElement(MenuLinkList, { items: [...LEGACY_MENUS.dropdown, { id: "m", label: "Call", url: "tel:1", device: "mobile" }], levels: 2 }));
  assert.match(out, /href="\/services"/);
  assert.match(out, /href="\/painting"/);
  assert.match(out, /href="\/faq"/); // child of a "#" parent
  assert.doesNotMatch(out, /href="#"/);
  assert.match(out, /class="md:hidden"/);
});

test("studio mega panel: columns with headings and links, descriptions, badges, featured card", () => {
  const item: NavItem = {
    id: "m", label: "Shop", url: "#", megaMenu: true, megaColumns: 3,
    mega: { featured: { title: "Winter sale", text: "Up to 30% off", image: "https://img.example/x.jpg", url: "/sale", ctaLabel: "Shop the sale" } },
    children: [
      { id: "c1", label: "Tools", url: "#", children: [{ id: "t1", label: "Drill", url: "/products/drill", description: "Cordless", badge: "Hot" }] },
      { id: "c2", label: "Guides", url: "/blog", icon: "BookOpen", children: [{ id: "g1", label: "How to paint", url: "/blog/paint" }] },
      { id: "single", label: "All products", url: "/shop" },
    ],
  };
  const out = html(React.createElement(MegaPanel, { item, onNavigate: () => {} }));
  assert.match(out, /Tools/);
  assert.match(out, /href="\/products\/drill"/);
  assert.match(out, /Cordless/);
  assert.match(out, />Hot</);
  assert.match(out, /Winter sale/);
  assert.match(out, /Shop the sale/);
  assert.match(out, /src="https:\/\/img.example\/x.jpg"/);
  assert.match(out, /href="\/shop"/);
  assert.match(out, /data-menu-focus/);
});

test("studio dropdown: third level renders as a hidden side flyout with aria wiring", () => {
  const out = html(React.createElement(DropdownPanel, {
    items: [{ id: "a", label: "Company", url: "/company", children: [{ id: "a1", label: "Team", url: "/team" }] }, { id: "b", label: "Jobs", url: "/jobs" }],
    onNavigate: () => {},
  }));
  assert.match(out, /aria-expanded="false"/);
  assert.match(out, /aria-controls="[^"]+"/);
  assert.match(out, /role="group"[^>]*hidden=""|hidden=""[^>]*role="group"/);
  assert.match(out, /href="\/team"/);
});
