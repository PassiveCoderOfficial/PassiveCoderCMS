/**
 * Menu Studio data model: normalizing old menus, the 3-level limit, drag and
 * drop / keyboard tree moves, device visibility, footer link lists, and mega
 * menu auto lists (pure mapping and the Supabase expansion).
 *
 * Run: npm run test:nav
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem } from "@/types/cms";
import {
  MAX_MENU_DEPTH, normalizeMenu, usesStudio, isMegaItem, filterForDevice, prepareForSave, collectDeepIds,
  flattenTree, buildTree, moveItem, canPlace, indentItem, outdentItem, shiftItem, projectDrop, menuDepth,
  menuToLinks, autoRowsToItems, updateItem,
} from "../menu-model";
import { expandDynamicChildren } from "../dynamic-children";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";

const L = (id: string, children?: NavItem[]): NavItem => ({ id, label: id.toUpperCase(), url: `/${id}`, ...(children ? { children } : {}) });
const ids = (items: NavItem[]): unknown => items.map((i) => (i.children?.length ? { [i.id]: ids(i.children) } : i.id));

// ── normalize / migrate ─────────────────────────────────────────────────

test("normalize keeps valid legacy menus unchanged (deep equal)", () => {
  for (const [name, items] of Object.entries(LEGACY_MENUS)) {
    assert.deepEqual(normalizeMenu(structuredClone(items)), items, name);
  }
});

test("normalize repairs broken stored menus without inventing studio fields", () => {
  const out = normalizeMenu([null, 5, "x", { label: 7 }, { id: "a", label: "A", url: "/a", children: "nope", device: "tv", openOn: "smell", childIds: ["x", 3, ""], mega: [] }]);
  assert.equal(out.length, 2);
  assert.ok(out[0].id.startsWith("nav-"));
  assert.equal(out[0].label, "7");
  assert.equal(out[0].url, "#");
  assert.deepEqual(out[1], { id: "a", label: "A", url: "/a", childIds: ["x"] });
  assert.deepEqual(normalizeMenu(null), []);
  assert.deepEqual(normalizeMenu({ items: [] }), []);
});

test("normalize drops levels past 3 (no renderer ever drew them)", () => {
  const deep = [L("a", [L("b", [L("c", [L("d")])])])];
  const out = normalizeMenu(deep);
  assert.equal(menuDepth(out), MAX_MENU_DEPTH);
  assert.deepEqual(ids(out), [{ a: [{ b: ["c"] }] }]);
});

test("usesStudio: false for legacy data, true once any studio field appears anywhere in the subtree", () => {
  for (const items of Object.values(LEGACY_MENUS)) for (const i of items) assert.equal(usesStudio(i), false);
  const fields: Partial<NavItem>[] = [
    { description: "x" }, { badge: "New" }, { showIcon: true }, { device: "desktop" }, { device: "mobile" },
    { openOn: "click" }, { mega: {} }, { childIds: ["1"] }, { childSource: "products" }, { childSource: "posts" }, { studio: true },
  ];
  for (const f of fields) {
    assert.equal(usesStudio({ ...L("a"), ...f }), true, JSON.stringify(f));
    assert.equal(usesStudio(L("top", [L("mid", [{ ...L("leaf"), ...f }])])), true, `deep ${JSON.stringify(f)}`);
  }
  // Empty / default values do not switch renderer.
  assert.equal(usesStudio({ ...L("a"), description: "  ", badge: "", device: "all", childIds: [] }), false);
});

test("isMegaItem follows the legacy inference, plus `mega`", () => {
  assert.equal(isMegaItem(L("a", [L("b")])), false);
  assert.equal(isMegaItem(L("a", [L("b", [L("c")])])), true);
  assert.equal(isMegaItem({ ...L("a", [L("b", [L("c")])]), megaMenu: false }), false);
  assert.equal(isMegaItem({ ...L("a", [L("b")]), megaMenu: true }), true);
  assert.equal(isMegaItem({ ...L("a"), mega: { featured: { title: "x" } } }), true);
});

// ── 3-level nesting ─────────────────────────────────────────────────────

test("canPlace / moveItem enforce the 3-level limit, including the moved subtree's own depth", () => {
  const menu = [L("a", [L("b", [L("c")])]), L("x", [L("y")]), L("z")];
  assert.equal(canPlace(menu, "z", "b"), true); // z becomes level 3
  assert.equal(canPlace(menu, "x", "a"), true); // x (2 levels) under level 1 -> levels 2..3
  assert.equal(canPlace(menu, "x", "b"), false); // x's child would be level 4
  assert.equal(canPlace(menu, "a", "z"), false); // a has 3 levels already
  assert.equal(canPlace(menu, "a", "c"), false); // into its own subtree
  assert.equal(canPlace(menu, "c", null), true);
  assert.equal(moveItem(menu, "x", "b", 0), menu, "blocked move returns the same array");
  assert.deepEqual(ids(moveItem(menu, "z", "b", 0)), [{ a: [{ b: ["z", "c"] }] }, { x: ["y"] }]);
  assert.deepEqual(ids(moveItem(menu, "c", null, 1)), [{ a: ["b"] }, "c", { x: ["y"] }, "z"]);
  for (const m of [moveItem(menu, "z", "b", 0), moveItem(menu, "x", "a", 5)]) assert.ok(menuDepth(m) <= MAX_MENU_DEPTH);
});

test("indent / outdent / shift (button and keyboard equivalents of drag)", () => {
  const menu = [L("a", [L("b")]), L("c"), L("d")];
  assert.deepEqual(ids(indentItem(menu, "c")), [{ a: ["b", "c"] }, "d"]);
  assert.deepEqual(ids(indentItem(indentItem(menu, "c"), "c")), [{ a: [{ b: ["c"] }] }, "d"]);
  const three = indentItem(indentItem(menu, "c"), "c");
  assert.equal(indentItem(three, "c"), three, "no sibling above at level 3");
  assert.equal(indentItem(menu, "a"), menu, "first item cannot indent");
  assert.deepEqual(ids(outdentItem(menu, "b")), ["a", "b", "c", "d"].map((x) => x));
  assert.equal(outdentItem(menu, "a"), menu);
  assert.deepEqual(ids(shiftItem(menu, "d", -1)), [{ a: ["b"] }, "d", "c"]);
  assert.equal(shiftItem(menu, "a", -1), menu);
});

test("flattenTree / buildTree round-trip", () => {
  const menu = [L("a", [L("b", [L("c")]), L("d")]), L("e")];
  const flat = flattenTree(menu);
  assert.deepEqual(flat.map((f) => [f.id, f.depth, f.parentId]), [["a", 0, null], ["b", 1, "a"], ["c", 2, "b"], ["d", 1, "a"], ["e", 0, null]]);
  assert.deepEqual(buildTree(flat), menu);
});

test("projectDrop: dragging right nests, depth is clamped to the 3-level limit", () => {
  const menu = [L("a", [L("b")]), L("c"), L("d", [L("e")])];
  const flat = flattenTree(menu);
  // Drag c a little right while over itself: becomes a child of a (after b).
  assert.deepEqual(projectDrop(flat, "c", "c", 30, 28), { depth: 1, parentId: "a", index: 1 });
  // Way right: nests under b (level 3), never deeper.
  assert.deepEqual(projectDrop(flat, "c", "c", 400, 28), { depth: 2, parentId: "b", index: 0 });
  // d has a child: it can go at most to level 2.
  assert.equal(projectDrop(flat, "d", "d", 400, 28)!.depth, 1);
  // Drag left out of a.
  assert.deepEqual(projectDrop(flat, "b", "b", -40, 28), { depth: 0, parentId: null, index: 1 });
  // Applying a projection with moveItem keeps the tree valid.
  const p = projectDrop(flat, "c", "c", 400, 28)!;
  assert.deepEqual(ids(moveItem(menu, "c", p.parentId, p.index)), [{ a: [{ b: ["c"] }] }, { d: ["e"] }]);
});

test("prepareForSave marks a plain dropdown only when the owner adds a third level; untouched menus stay identical", () => {
  // Untouched legacy menus (including the hidden third level) save unchanged.
  for (const [name, items] of Object.entries(LEGACY_MENUS)) {
    assert.deepEqual(prepareForSave(structuredClone(items), collectDeepIds(items)), items, name);
  }
  const legacy = LEGACY_MENUS.hiddenThirdLevel;
  const added = updateItem(legacy, "h2", { children: [L("new")] });
  const saved = prepareForSave(added, collectDeepIds(legacy));
  assert.equal(saved[0].studio, true);
  assert.equal(usesStudio(saved[0]), true);
  // Removing the third level removes the marker again.
  const flatAgain = updateItem(saved, "h2", { children: [] });
  const again = prepareForSave(updateItem(flatAgain, "h1", { children: [] }), collectDeepIds(legacy));
  assert.equal(again[0].studio, undefined);
});

test("updateItem: undefined clears the field instead of storing it", () => {
  const out = updateItem([{ ...L("a"), device: "mobile" }], "a", { device: undefined });
  assert.equal("device" in out[0], false);
});

// ── device visibility ───────────────────────────────────────────────────

test("filterForDevice hides the other device's items at every level and returns the same array when nothing is hidden", () => {
  const menu: NavItem[] = [
    { ...L("a"), device: "desktop" },
    { ...L("b", [{ ...L("b1"), device: "mobile" }, L("b2", [{ ...L("b2x"), device: "desktop" }])]) },
    { ...L("c"), device: "all" },
  ];
  assert.deepEqual(ids(filterForDevice(menu, "desktop")), ["a", { b: [{ b2: ["b2x"] }] }, "c"]);
  assert.deepEqual(ids(filterForDevice(menu, "mobile")), [{ b: ["b1", "b2"] }, "c"]);
  const legacy = LEGACY_MENUS.inferredMega;
  assert.equal(filterForDevice(legacy, "desktop"), legacy);
  assert.equal(filterForDevice(legacy, "mobile"), legacy);
});

// ── footer link lists ───────────────────────────────────────────────────

test("menuToLinks flattens a menu for footer columns", () => {
  const menu = LEGACY_MENUS.dropdown;
  assert.deepEqual(menuToLinks(menu).map((l) => l.id), ["services", "p1"]); // "#" parent replaced by its links
  assert.deepEqual(menuToLinks(menu, { levels: 2 }).map((l) => [l.id, l.depth]), [["services", 0], ["s1", 1], ["s2", 1], ["p1", 0]]);
  const l = menuToLinks([{ ...L("x"), badge: "New", icon: "Star", showIcon: true, device: "mobile", target: "_blank" }])[0];
  assert.deepEqual(l, { id: "x", label: "X", url: "/x", depth: 0, target: "_blank", badge: "New", icon: "Star", device: "mobile" });
  // A legacy icon (mega heading only) is not drawn in link lists.
  assert.equal(menuToLinks([{ ...L("y"), icon: "Star" }])[0].icon, undefined);
});

// ── mega menu auto lists ────────────────────────────────────────────────

test("autoRowsToItems: latest keeps query order, selected keeps the owner's order, skips missing, caps at limit", () => {
  const rows = [
    { id: "1", label: "One", slug: "one" },
    { id: "2", label: "Two", slug: "two" },
    { id: "3", label: "Three", slug: "three" },
  ];
  assert.deepEqual(autoRowsToItems("products", rows, { limit: 2 }).map((i) => [i.label, i.url]), [["One", "/products/one"], ["Two", "/products/two"]]);
  assert.deepEqual(autoRowsToItems("posts", rows, { childIds: ["3", "gone", "1"] }).map((i) => [i.label, i.url]), [["Three", "/blog/three"], ["One", "/blog/one"]]);
  assert.equal(autoRowsToItems("services", [{ id: "s", label: "S", link: null }])[0].url, "/services#s");
  assert.equal(autoRowsToItems("services", [{ id: "s", label: "S", link: "/x" }])[0].url, "/x");
  assert.equal(autoRowsToItems("product_categories", [{ id: "c", label: "C", slug: "cat" }])[0].url, "/shop?category=cat");
  // Stable ids, so React keys do not change between renders.
  assert.equal(autoRowsToItems("products", rows)[0].id, "auto-products-1");
});

/** Minimal Supabase stand-in: records each query and answers from `tables`. */
function fakeSupabase(tables: Record<string, Record<string, unknown>[]>) {
  const log: { table: string; calls: [string, unknown[]][] }[] = [];
  const client = {
    from(table: string) {
      const entry = { table, calls: [] as [string, unknown[]][] };
      log.push(entry);
      let rows = [...(tables[table] ?? [])];
      const b: Record<string, unknown> = {};
      for (const m of ["select", "eq", "is", "order", "limit", "neq"]) {
        b[m] = (...args: unknown[]) => {
          entry.calls.push([m, args]);
          if (m === "limit") rows = rows.slice(0, args[0] as number);
          return b;
        };
      }
      b.in = (col: string, vals: string[]) => { entry.calls.push(["in", [col, vals]]); rows = rows.filter((r) => vals.includes(r[col] as string)); return b; };
      b.then = (res: (v: { data: unknown[] }) => unknown) => Promise.resolve({ data: rows }).then(res);
      return b;
    },
  };
  return { client: client as unknown as SupabaseClient, log };
}

test("expandDynamicChildren: products (latest), posts (selected), and a mega column filled from site data", async () => {
  const { client, log } = fakeSupabase({
    products: [{ id: "p1", name: "Drill", slug: "drill" }, { id: "p2", name: "Saw", slug: "saw" }, { id: "p3", name: "Glue", slug: "glue" }],
    pages: [{ id: "b1", title: "Post one", slug: "one" }, { id: "b2", title: "Post two", slug: "two" }],
  });
  const menu: NavItem[] = [{
    id: "top", label: "Shop", url: "#", megaMenu: true, mega: {}, children: [
      { id: "col1", label: "New tools", url: "#", childSource: "products", childLimit: 2 },
      { id: "col2", label: "Reading", url: "/blog", childSource: "posts", childIds: ["b2", "b1"] },
    ],
  }];
  const out = await expandDynamicChildren(client, "tenant-1", menu);
  const [col1, col2] = out[0].children!;
  assert.deepEqual(col1.children!.map((c) => [c.label, c.url]), [["Drill", "/products/drill"], ["Saw", "/products/saw"]]);
  assert.deepEqual(col2.children!.map((c) => [c.label, c.url]), [["Post two", "/blog/two"], ["Post one", "/blog/one"]]);
  const prod = log.find((l) => l.table === "products")!;
  assert.deepEqual(prod.calls.find((c) => c[0] === "eq" && c[1][0] === "tenant_id")?.[1], ["tenant_id", "tenant-1"]);
  assert.ok(prod.calls.some((c) => c[0] === "eq" && c[1][0] === "status" && c[1][1] === "active"));
  assert.ok(prod.calls.some((c) => c[0] === "order" && c[1][0] === "created_at"));
  const posts = log.find((l) => l.table === "pages")!;
  assert.ok(posts.calls.some((c) => c[0] === "in"));
  assert.ok(posts.calls.some((c) => c[0] === "eq" && c[1][0] === "type" && c[1][1] === "post"));
});

test("expandDynamicChildren: legacy sources keep their old queries and output shape", async () => {
  const { client, log } = fakeSupabase({ service_items: [{ id: "s1", title: "Roofing", link: null }] });
  const out = await expandDynamicChildren(client, "t", [{ id: "a", label: "Services", url: "/services", childSource: "services" }]);
  assert.equal(out[0].children!.length, 1);
  assert.equal(out[0].children![0].url, "/services#s1");
  assert.ok(out[0].children![0].id.startsWith("nav-"), "legacy ids unchanged");
  assert.equal("description" in out[0].children![0], false);
  assert.ok(!log[0].calls.some((c) => c[0] === "in"));
});

test("expandDynamicChildren: an empty auto list falls back to the hand-added children", async () => {
  const { client } = fakeSupabase({});
  const out = await expandDynamicChildren(client, "t", [{ id: "a", label: "P", url: "#", childSource: "products", children: [L("manual")] }]);
  assert.deepEqual(ids(out), [{ a: ["manual"] }]);
});
