/**
 * Menu blocks inside block trees (P0 fix pack, 2026-11-17).
 * Run: npm run test:nav
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block, NavItem } from "@/types/cms";
import {
  collectNavBlocks, findImportableNav, hasNestedNavToResolve, locationsReadBy, mapNavBlocks,
  pickNavItems, pointNavBlocksAt,
} from "../nav-blocks";

const links: NavItem[] = [{ id: "a", label: "Home", url: "/" }, { id: "b", label: "About", url: "/about" }];
const saved: NavItem[] = [{ id: "s1", label: "Saved", url: "/saved" }];

const nav = (id: string, data: Record<string, unknown>, type: "navigation" | "header_nav" = "header_nav") =>
  ({ id, type, order: 0, visible: true, data: { items: links, ...data } }) as unknown as Block;
const container = (id: string, ...cols: Block[][]) =>
  ({ id, type: "container", order: 0, visible: true, data: { columns: cols.map((blocks, i) => ({ id: `${id}-c${i}`, widthPct: 50, blocks })), direction: "row", gap: "md", align: "center", justify: "between", wrapOnMobile: true } }) as unknown as Block;
const text = (id: string) => ({ id, type: "text", order: 0, visible: true, data: { content: "x" } }) as unknown as Block;

/** Same fill the page renderer uses, minus the database. */
const fillWith = (byLocation: Map<string, NavItem[]>) => async (b: Block) => {
  const d = b.data as { items?: NavItem[]; menuLocation?: string };
  return { ...b, data: { ...b.data, items: pickNavItems(d, byLocation) ?? [] } } as Block;
};

test("collects menu blocks at the top and inside containers (nested too)", () => {
  const tree = [nav("top", {}, "navigation"), container("c", [nav("in", {})], [container("c2", [nav("deep", {})])]), text("t")];
  assert.deepEqual(collectNavBlocks(tree).map((x) => [x.block.id, x.depth]), [["top", 0], ["in", 1], ["deep", 2]]);
});

test("flaw 1: a container header's chosen saved menu is used on the live site", async () => {
  const tree = [container("hdr", [text("logo")], [nav("menu", { menuLocation: "header" })])];
  assert.equal(hasNestedNavToResolve(tree), true);
  const out = await mapNavBlocks(tree, fillWith(new Map([["header", saved]])));
  const menu = (out[0] as unknown as { data: { columns: { blocks: Block[] }[] } }).data.columns[1].blocks[0];
  assert.deepEqual((menu.data as { items: NavItem[] }).items, saved);
});

test("flaw 1: a missing saved menu keeps the block's own links", async () => {
  const tree = [container("hdr", [nav("menu", { menuLocation: "header" })])];
  const out = await mapNavBlocks(tree, fillWith(new Map()));
  const menu = (out[0] as unknown as { data: { columns: { blocks: Block[] }[] } }).data.columns[0].blocks[0];
  assert.deepEqual((menu.data as { items: NavItem[] }).items, links);
});

test("pixel safety: nested menu blocks without a location or auto list are returned untouched (same object)", async () => {
  const inner = nav("menu", {});
  const tree = [container("hdr", [text("logo")], [inner])];
  assert.equal(hasNestedNavToResolve(tree), false);
  let calls = 0;
  const out = await mapNavBlocks(tree, async (b) => { calls++; return b; });
  assert.equal(calls, 0);
  assert.equal(out, tree, "whole tree is the same array");
});

test("top-level menu blocks are always filled, exactly as before P0", async () => {
  const top = nav("top", {}, "navigation");
  let calls = 0;
  const out = await mapNavBlocks([top, text("t")], async (b) => { calls++; return { ...b }; });
  assert.equal(calls, 1);
  assert.notEqual(out[0], top);
});

test("auto lists in a nested menu are expanded", async () => {
  const auto: NavItem[] = [{ id: "x", label: "Services", url: "/services", childSource: "services", children: [] }];
  const tree = [container("sec", [nav("m", { items: auto })])];
  assert.equal(hasNestedNavToResolve(tree), true);
  let calls = 0;
  await mapNavBlocks(tree, async (b) => { calls++; return b; });
  assert.equal(calls, 1);
});

test("containers past the depth cap are not walked", async () => {
  let tree: Block[] = [nav("deep", { menuLocation: "header" })];
  for (let i = 0; i < 6; i++) tree = [container(`c${i}`, tree)];
  assert.equal(collectNavBlocks(tree).length, 0);
});

test("locationsReadBy sees nested blocks", () => {
  const h = [container("hdr", [nav("m", { menuLocation: "header" })])];
  const f = [nav("f", { menuLocation: "footer" }, "navigation")];
  assert.deepEqual([...locationsReadBy([h, f, null, "junk"])].sort(), ["footer", "header"]);
});

test("import finds a container header's links, and links of a block pointing at a missing menu", () => {
  const h = [container("hdr", [text("logo")], [nav("m", {})])];
  assert.deepEqual(findImportableNav(h, new Set())?.items, links);
  const missing = [nav("n", { menuLocation: "header" }, "navigation")];
  assert.equal(findImportableNav(missing, new Set())?.pointsAt, "header");
  assert.equal(findImportableNav(missing, new Set(["header"])), null, "menu exists: nothing to import");
  assert.equal(findImportableNav([nav("e", { items: [] })], new Set()), null, "no links: nothing to import");
});

test("import repoints only the copies that show the same links (desktop/phone pairs)", () => {
  const phone: NavItem[] = [{ id: "p", label: "Call", url: "tel:1" }];
  const h = [container("hdr", [nav("desk", {})], [nav("phone", { items: phone })])];
  const { blocks, count } = pointNavBlocksAt(h, links, "header");
  assert.equal(count, 1);
  const cols = (blocks[0] as unknown as { data: { columns: { blocks: Block[] }[] } }).data.columns;
  assert.equal((cols[0].blocks[0].data as { menuLocation?: string }).menuLocation, "header");
  assert.equal((cols[1].blocks[0].data as { menuLocation?: string }).menuLocation, undefined);
});
