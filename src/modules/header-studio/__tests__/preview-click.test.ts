/**
 * Menus P4 carry-over: click a menu item in the Header Studio preview to
 * edit it. locatePreviewClick finds the menu element and item a click stands
 * for, from the header's own row / zone attributes and the link's text and
 * address (the header markup gets no editor attributes).
 *
 * Run: npm run test:header
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { NavItem } from "@/types/cms";
import { addElement, defaultConfig, makeElement } from "../model";
import { locatePreviewClick } from "../preview-click";

const MAIN: NavItem[] = [
  { id: "h", label: "Home", url: "/" },
  { id: "s", label: "Services", url: "#", children: [{ id: "s1", label: "Aircon repair", url: "/aircon", badge: "New" }] },
  { id: "a", label: "About", url: "/about" },
  { id: "c", label: "Contact", url: "/contact" },
];
const UTIL: NavItem[] = [{ id: "u1", label: "About", url: "/company" }, { id: "u2", label: "Careers", url: "/careers" }];
const MENUS = { "": MAIN, util: UTIL };

function config() {
  let cfg = defaultConfig();
  cfg = { ...cfg, rows: { ...cfg.rows, top: { ...cfg.rows.top, enabled: true } } };
  cfg = addElement(cfg, "main", "left", makeElement("logo", { id: "logo" }));
  cfg = addElement(cfg, "main", "center", makeElement("menu", { id: "first", menuPart: "first" }));
  cfg = addElement(cfg, "main", "right", makeElement("menu", { id: "second", menuPart: "second" }));
  cfg = addElement(cfg, "top", "right", makeElement("menu", { id: "top", menuId: "util" }));
  return cfg;
}

test("a link in a zone maps to that zone's menu element and item (split halves)", () => {
  const cfg = config();
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "main", zone: "center", inNav: true, text: "Home", href: "/" })?.element.id, "first");
  const hit = locatePreviewClick(cfg, MENUS, { row: "main", zone: "right", inNav: true, text: "Contact", href: "/contact" });
  assert.equal(hit?.element.id, "second");
  assert.equal(hit?.item.id, "c");
  assert.equal(hit?.items.length, 4, "the whole menu, so a save keeps both halves");
});

test("same label in two menus: the clicked zone decides", () => {
  const cfg = config();
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "top", zone: "right", inNav: true, text: "About", href: "/company" })?.item.id, "u1");
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "main", zone: "right", inNav: true, text: "About", href: "/about" })?.item.id, "a");
});

test("dropdown links and badges; drawer clicks use the drawer menu; misses are null", () => {
  const cfg = config();
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "main", zone: "center", inNav: true, text: "Aircon repairNew", href: "/aircon" })?.item.id, "s1");
  assert.equal(locatePreviewClick(cfg, MENUS, { inDrawer: true, inNav: true, text: "Contact", href: "/contact" })?.element.id, "first", "drawer shows the whole menu of its element");
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "main", zone: "left", text: "Acme Ltd", href: "/" }), null, "the logo (not in a nav) is not a menu item");
  assert.equal(locatePreviewClick(cfg, MENUS, { row: "main", zone: "center", inNav: true, text: "Call us", href: "tel:1" }), null);
  assert.equal(locatePreviewClick(cfg, MENUS, { text: "", href: "" }), null);
});
