/**
 * Menus P3: the default (automatic) menu, materialise-on-edit helpers, and
 * pixel safety. A menu block that shows links today must resolve exactly as
 * in v1.0.926; only a block with no saved menu and no typed links gets the
 * automatic menu.
 *
 * Run: npm run test:nav
 */
import "../../../../tests/mcp/server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block, NavItem } from "@/types/cms";
import {
  AUTO_ITEM_PREFIX, DEFAULT_MENU_MAX, defaultMenuItems, isDefaultMenu, isEmptyMenuData, isLegalSlug, toDefaultMenuPages,
  wantsDefaultMenu, type DefaultMenuPage,
} from "../default-menu";
import { hasMenusToResolve, mapNavBlocks, nestedNeedsResolve, pickNavItems } from "../nav-blocks";
import { findClickedItem } from "../canvas-edit";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";

const page = (id: string, slug: string, title: string | null, extra: Partial<DefaultMenuPage> = {}): DefaultMenuPage => ({ id, slug, title, type: "page", ...extra });

test("default menu: Home first, Contact last, the rest by title", () => {
  const items = defaultMenuItems([
    page("c", "contact", "Contact"),
    page("s", "services", "Services"),
    page("h", "home", "Home"),
    page("a", "about", "About us"),
  ]);
  assert.deepEqual(items.map((i) => i.label), ["Home", "About us", "Services", "Contact"]);
  assert.deepEqual(items.map((i) => i.url), ["/", "/about", "/services", "/contact"]);
  assert.deepEqual(items[0], { id: `${AUTO_ITEM_PREFIX}h`, label: "Home", url: "/", kind: "page", ref: "h" });
});

test("default menu: the pages' own order wins over titles when the site set one", () => {
  const items = defaultMenuItems([
    page("h", "home", "Home", { order_index: 0 }),
    page("z", "zebra", "Zebra", { order_index: 1 }),
    page("a", "apple", "Apple", { order_index: 2 }),
    page("c", "contact-us", "Contact us", { order_index: 3 }),
  ]);
  assert.deepEqual(items.map((i) => i.label), ["Home", "Zebra", "Apple", "Contact us"]);
});

test("default menu: only top-level, untranslated, ordinary pages", () => {
  const items = defaultMenuItems([
    page("h", "home", "Home"),
    page("child", "about", "About", { parent_id: "x" }),
    page("nested", "services/painting", "Painting"),
    page("ar", "about-ar", "About AR", { lang: "ar" }),
    page("post", "news", "News", { type: "post" }),
    page("land", "promo", "Promo", { type: "landing" }),
    page("ok", "team", "Team"),
  ]);
  assert.deepEqual(items.map((i) => i.label), ["Home", "Team"]);
});

test("default menu: legal pages only when nothing else exists", () => {
  assert.ok(isLegalSlug("privacy-policy") && isLegalSlug("terms") && isLegalSlug("refund-policy") && isLegalSlug("terms-and-conditions"));
  assert.ok(!isLegalSlug("services") && !isLegalSlug("contractors"));
  const withOthers = defaultMenuItems([page("h", "home", "Home"), page("p", "privacy-policy", "Privacy"), page("t", "terms", "Terms")]);
  assert.deepEqual(withOthers.map((i) => i.label), ["Home"]);
  const onlyLegal = defaultMenuItems([page("p", "privacy-policy", "Privacy"), page("t", "terms", "Terms")]);
  assert.deepEqual(onlyLegal.map((i) => i.label), ["Privacy", "Terms"]);
});

test("default menu: at most 8 links, Home and Contact kept; empty site = empty menu", () => {
  const many = [page("h", "home", "Home"), page("c", "contact", "Contact"), ...Array.from({ length: 20 }, (_, n) => page(`p${n}`, `page-${String(n).padStart(2, "0")}`, `Page ${String(n).padStart(2, "0")}`))];
  const items = defaultMenuItems(many);
  assert.equal(items.length, DEFAULT_MENU_MAX);
  assert.equal(items[0].label, "Home");
  assert.equal(items[items.length - 1].label, "Contact");
  assert.deepEqual(defaultMenuItems([]), []);
  assert.ok(isDefaultMenu(items));
  assert.ok(!isDefaultMenu(LEGACY_MENUS.plainLinks));
  assert.ok(!isDefaultMenu([]));
});

test("default menu: database rows (title missing, seo.lang)", () => {
  const rows = toDefaultMenuPages([
    { id: 1, slug: "home", title: null, type: "page", parent_id: null, order_index: null, seo: null },
    { id: 2, slug: "about", title: "About", type: "page", seo: { lang: "AR " } },
  ]);
  assert.equal(rows[1].lang, "ar");
  assert.deepEqual(defaultMenuItems(rows).map((i) => [i.label, i.url]), [["home", "/"]]);
});

test("wantsDefaultMenu: only a block with no saved menu and no typed links", () => {
  const byLoc = new Map<string, NavItem[]>([["header", []]]);
  const byId = new Map<string, NavItem[]>([["m1", []]]);
  assert.equal(wantsDefaultMenu({ items: [] }, new Map()), true);
  assert.equal(wantsDefaultMenu({}, new Map()), true);
  assert.equal(wantsDefaultMenu({ items: LEGACY_MENUS.plainLinks }, new Map()), false);
  // A saved menu that exists is respected, even an empty one.
  assert.equal(wantsDefaultMenu({ items: [], menuLocation: "header" }, byLoc), false);
  assert.equal(wantsDefaultMenu({ items: [], menuId: "m1" }, new Map(), byId), false);
  // A named menu that is gone, and no typed links: automatic menu.
  assert.equal(wantsDefaultMenu({ items: [], menuLocation: "footer" }, byLoc), true);
  assert.equal(wantsDefaultMenu({ items: [], menuId: "gone" }, new Map(), byId), true);
  // ...but typed links still win, as before.
  assert.equal(wantsDefaultMenu({ items: LEGACY_MENUS.dropdown, menuId: "gone" }, new Map(), byId), false);
  assert.equal(isEmptyMenuData({ items: [] }), true);
  assert.equal(isEmptyMenuData({ items: [], menuLocation: "header" }), false);
});

test("pixel safety: every block with links resolves exactly as in v1.0.926", () => {
  const byLoc = new Map<string, NavItem[]>([["header", LEGACY_MENUS.dropdown]]);
  const byId = new Map<string, NavItem[]>([["m1", LEGACY_MENUS.plainLinks]]);
  const cases: { items?: NavItem[]; menuLocation?: string; menuId?: string }[] = [];
  for (const items of Object.values(LEGACY_MENUS)) {
    cases.push({ items }, { items, menuLocation: "header" }, { items, menuLocation: "footer" }, { items, menuId: "m1" }, { items, menuId: "gone" });
  }
  cases.push({ items: [], menuLocation: "header" }, { items: [], menuId: "m1" });
  for (const d of cases) {
    // P3 changes the result only when wantsDefaultMenu; none of these do.
    assert.equal(wantsDefaultMenu(d, byLoc, byId), false, JSON.stringify(d).slice(0, 80));
    assert.ok(pickNavItems(d as never, byLoc, byId) !== undefined);
  }
});

test("nested empty menu blocks are now resolved (automatic menu); others exactly as before", async () => {
  const nav = (id: string, data: Record<string, unknown>): Block => ({ id, type: "header_nav", order: 0, visible: true, data: { style: "default", ...data } } as unknown as Block);
  const container = (blocks: Block[]): Block => ({ id: "c", type: "container", order: 0, visible: true, data: { columns: [{ blocks }] } } as unknown as Block);
  const own = nav("own", { items: LEGACY_MENUS.plainLinks });
  const empty = nav("empty", { items: [] });
  assert.equal(nestedNeedsResolve(own), false);
  assert.equal(nestedNeedsResolve(empty), true);
  assert.equal(hasMenusToResolve([container([own])]), false);
  assert.equal(hasMenusToResolve([container([empty])]), true);
  // The block with links keeps object identity: its HTML cannot change.
  const tree = [container([own, empty])];
  const out = await mapNavBlocks(tree, async (b) => ({ ...b, data: { ...b.data, items: [{ id: "auto-1", label: "Home", url: "/" }] } } as Block));
  const cols = (out[0].data as { columns: { blocks: Block[] }[] }).columns[0].blocks;
  assert.equal(cols[0], own);
  assert.equal((cols[1].data as { items: NavItem[] }).items[0].label, "Home");
});

test("canvas: a clicked link finds its menu item", () => {
  const items: NavItem[] = [
    { id: "a", label: "About", url: "/about" },
    { id: "s", label: "Services", url: "/services", children: [{ id: "s1", label: "Painting", url: "/painting" }] },
    { id: "a2", label: "About", url: "/about-team" },
  ];
  assert.equal(findClickedItem(items, "Painting", "/painting")?.id, "s1");
  assert.equal(findClickedItem(items, "  services ", "/services")?.id, "s");
  assert.equal(findClickedItem(items, "About", "https://site.test/about-team/")?.id, "a2");
  assert.equal(findClickedItem(items, "ServicesNew", "/services")?.id, "s"); // label + badge text
  assert.equal(findClickedItem(items, "Latest product", "/products/x"), null);
});
