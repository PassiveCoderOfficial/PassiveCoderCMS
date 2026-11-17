/**
 * Menus P0 fix pack (2026-11-17): multi-menu save, "where is this menu
 * shown", reorder in the Menu Bar block's own editor, Nest wording, the MCP
 * flat-replace guard, and source checks for the editor fixes.
 * Run: npm run test:nav
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Block, NavItem } from "@/types/cms";
import { indentItem, isFirstAmongSiblings, moveInList, structureLostByFlatReplace } from "../menu-model";
import { mergeAfterSave, saveOrder } from "../menu-save";
import { menuReaders, menuUsage } from "../menu-usage";

const read = (p: string) => readFileSync(path.join(process.cwd(), p), "utf8");

// ── Flaw 2: switching menus no longer loses edits ─────────────────────────

test("save order: the open menu first, then the list order; unknown ids dropped", () => {
  const menus = [{ id: "a", location: "header" }, { id: "b", location: "none" }, { id: "c", location: "footer" }];
  assert.deepEqual(saveOrder(new Set(["c", "a", "zz", "b"]), menus, "b"), ["b", "a", "c"]);
});

test("after a save, failed menus keep their local edits; saved ones take the server copy", () => {
  const local = [{ id: "a", location: "header", name: "A edited" }, { id: "b", location: "none", name: "B edited" }];
  const server = [{ id: "a", location: "header", name: "A saved" }, { id: "b", location: "none", name: "B old" }, { id: "n", location: "none", name: "new" }];
  const out = mergeAfterSave(local, server, new Set(["b"]));
  assert.deepEqual(out.map((m) => m.name), ["A saved", "B edited", "new"]);
});

test("navigation screen tracks unsaved edits per menu and guards leaving", () => {
  const src = read("src/app/(admin)/dashboard/navigation/navigation-client.tsx");
  assert.ok(src.includes("dirtyIds"), "per-menu dirty set");
  assert.ok(!/setMenus\(listData\.menus\)/.test(src), "refetch no longer replaces local edits wholesale");
  assert.ok(src.includes("useUnsavedGuard(dirty"), "unsaved-changes guard");
});

// ── Flaw 3: truthful "where is this menu shown" ───────────────────────────

const nav = (loc?: string, type = "navigation") => ({ id: `n-${loc}`, type, order: 0, data: { items: [], ...(loc ? { menuLocation: loc } : {}) } }) as unknown as Block;
const inContainer = (b: Block) => ({ id: "c", type: "container", order: 0, data: { columns: [{ id: "c1", widthPct: 100, blocks: [b] }] } }) as unknown as Block;
const menus = [
  { id: "H", location: "header" }, { id: "F", location: "footer" }, { id: "M", location: "mobile" },
  { id: "L", location: "legal" }, { id: "N", location: "none" },
];

test("a header menu is shown only when a header block reads it", () => {
  const r = menuReaders({ classicHeader: [nav("header")], classicFooter: [], classicPrefooter: [], pages: [], studioHeaderRefs: null, studioFooterRefs: null });
  const u = menuUsage(menus, r);
  assert.deepEqual(u.H, ["header"]);
  for (const id of ["F", "M", "L", "N"]) assert.deepEqual(u[id], [], `${id} is not shown anywhere`);
});

test("a header with its own links (no location) shows no saved menu", () => {
  const r = menuReaders({ classicHeader: [nav(undefined)], classicFooter: [], classicPrefooter: [], pages: [], studioHeaderRefs: null, studioFooterRefs: null });
  assert.deepEqual(menuUsage(menus, r).H, []);
});

test("container headers and page sections count (nested blocks)", () => {
  const r = menuReaders({ classicHeader: [inContainer(nav("header", "header_nav"))], classicFooter: [], classicPrefooter: [], pages: [[inContainer(nav("legal", "header_nav"))]], studioHeaderRefs: null, studioFooterRefs: null });
  const u = menuUsage(menus, r);
  assert.deepEqual(u.H, ["header"]);
  assert.deepEqual(u.L, ["pages"]);
});

test("a live Studio header hides the classic header's reads and shows its own menus", () => {
  const r = menuReaders({ classicHeader: [nav("header")], classicFooter: [], classicPrefooter: [], pages: [], studioHeaderRefs: ["", "L"], studioFooterRefs: [""] });
  const u = menuUsage(menus, r);
  assert.deepEqual(u.H, ["studioHeader"], "default element reads the header menu; classic header not counted");
  assert.deepEqual(u.L, ["studioHeader"]);
  assert.deepEqual(u.F, ["studioFooter"]);
});

test("usage follows unsaved location changes", () => {
  const r = menuReaders({ classicHeader: [nav("header")], classicFooter: [], classicPrefooter: [], pages: [], studioHeaderRefs: null, studioFooterRefs: null });
  const moved = menus.map((m) => (m.id === "H" ? { ...m, location: "none" } : m.id === "N" ? { ...m, location: "header" } : m));
  const u = menuUsage(moved, r);
  assert.deepEqual(u.H, []);
  assert.deepEqual(u.N, ["header"]);
});

test("location hints no longer promise what no renderer does", () => {
  const en = read("src/lib/i18n/locales/en.ts");
  assert.ok(!en.includes("Overrides the header menu on small screens"));
  assert.ok(!en.includes('"navPage.locFooterHint": "Primary footer links."'));
  const bn = read("src/lib/i18n/locales/bn.ts");
  for (const k of ["navPage.notShownTitle", "navPage.notShownBody", "navPage.cannotNestFirst", "navPage.removeWithChildren", "navPage.unsavedLeave", "navPage.missingMenuTitle"]) {
    assert.ok(en.includes(`"${k}"`) && bn.includes(`"${k}"`), `${k} in EN and BN`);
  }
});

// ── Flaw 4: the Menu Bar block's own editor can reorder ──────────────────

test("moveInList swaps neighbours and keeps every entry object (data shape unchanged)", () => {
  const a = { id: "a", label: "A", url: "/a", highlight: "gold" } as NavItem;
  const b = { id: "b", label: "B", url: "/b", children: [{ id: "b1", label: "B1", url: "/b1" }] } as NavItem;
  const c = { id: "c", label: "C", url: "/c" } as NavItem;
  const list = [a, b, c];
  const up = moveInList(list, 1, -1);
  assert.deepEqual(up.map((x) => x.id), ["b", "a", "c"]);
  assert.equal(up[0], b, "same object, children and all");
  assert.equal(moveInList(list, 0, -1), list, "no move past the top");
  assert.equal(moveInList(list, 2, 1), list, "no move past the bottom");
  assert.equal(JSON.stringify([...up].sort((x, y) => x.id.localeCompare(y.id))), JSON.stringify(list), "nothing but the order changed");
});

test("legacy items editor has up/down buttons and asks before deleting a dropdown", () => {
  const src = read("src/components/admin/page-builder/settings-panel/nav-items-editor.tsx");
  assert.ok(src.includes("moveInList(items, index, dir)"));
  assert.ok(src.includes('t("navPage.moveUp")') && src.includes('t("navPage.moveDown")'));
  assert.ok(src.includes("navPage.removeWithChildren"));
});

// ── Flaw 7: Nest wording, delete confirm, custom URL ──────────────────────

test("first item: nothing to nest under (not the 3-level message)", () => {
  const items: NavItem[] = [{ id: "a", label: "A", url: "/" }, { id: "b", label: "B", url: "/b" }];
  assert.equal(isFirstAmongSiblings(items, "a"), true);
  assert.equal(isFirstAmongSiblings(items, "b"), false);
  assert.equal(indentItem(items, "a"), items, "indent is still a no-op");
  const src = read("src/app/(admin)/dashboard/navigation/menu-tree-editor.tsx");
  assert.ok(src.includes('isFirstAmongSiblings(items, f.id)) { toast.error(t("navPage.cannotNestFirst"))'));
});

test("tree editor confirms before removing an item with a sub-menu", () => {
  const src = read("src/app/(admin)/dashboard/navigation/menu-tree-editor.tsx");
  assert.ok(/under > 0 && !window\.confirm\(t\("navPage\.removeWithChildren"/.test(src));
});

test("link picker: Custom URL opens the text box even when the link matches a page", () => {
  const src = read("src/app/(admin)/dashboard/navigation/menu-tree-editor.tsx");
  // P1: choosing Custom URL also drops the by-id link, so the typed URL is what shows.
  assert.ok(src.includes('if (e.target.value === "__custom__") { setCustomOpen(true); onChange(value, null); return; }'));
  assert.ok(src.includes("const current = customOpen ? undefined"));
});

// ── MCP: a flat list never silently wipes a structured menu ──────────────

test("structureLostByFlatReplace", () => {
  assert.deepEqual(structureLostByFlatReplace([{ id: "a", label: "A", url: "/" }]), []);
  assert.deepEqual(structureLostByFlatReplace(null), []);
  assert.ok(structureLostByFlatReplace([{ id: "a", label: "A", url: "#", children: [{ id: "b", label: "B", url: "/b" }] }]).includes("sub-menus"));
  assert.ok(structureLostByFlatReplace([{ id: "a", label: "A", url: "/s", childSource: "services" }]).includes("auto lists"));
  assert.equal(structureLostByFlatReplace([{ id: "a", label: "A", url: "/", badge: "New" }]).length, 1);
});

// ── Flaw 6 / guards / dead code ───────────────────────────────────────────

test("Studio 'Edit menus' opens a new tab and both studios guard unsaved work", () => {
  for (const f of ["src/app/(admin)/dashboard/header-builder/studio/studio-client.tsx", "src/app/(admin)/dashboard/header-builder/footer-studio/studio-client.tsx"]) {
    const src = read(f);
    // P2: "Edit this menu" / "Create a menu" live in the shared saved-menu picker.
    assert.ok(src.includes("<SavedMenuSelect"), `${f}: saved-menu picker`);
    assert.ok(!/<Link href="\/dashboard\/navigation/.test(src), `${f}: no same-tab link`);
    assert.ok(src.includes("useUnsavedGuard(dirty"), `${f}: guard`);
  }
  const picker = read("src/components/admin/menus/saved-menu-select.tsx");
  assert.ok(/href=\{editMenuHref\(chosen\?\.id\)\} target="_blank"/.test(picker), "picker: new tab");
  assert.ok(picker.includes('window.open(editMenuHref(menu.id), "_blank"'), "picker: a created menu opens in a new tab");
});

test("classic header builder warns when a Studio header/footer is live", () => {
  const page = read("src/app/(admin)/dashboard/header-builder/page.tsx");
  assert.ok(page.includes("studioLive={studioLive}"));
  const client = read("src/app/(admin)/dashboard/header-builder/header-builder-client.tsx");
  assert.ok(client.includes("headerBuilder.studioLiveHeader"));
});

test("the unreachable identity-screen nav editors are gone", () => {
  const src = read("src/app/(admin)/dashboard/templates/header-footer/identity-client.tsx");
  assert.ok(!src.includes("GlobalNavEditor"));
  assert.ok(!src.includes("function MenuCard"));
});

test("Menu Bar block settings offer the saved-menu picker", () => {
  const src = read("src/components/admin/page-builder/settings-panel/navigation-settings.tsx");
  assert.ok(src.includes('<MenuLocationPicker value={block.data.menuLocation}'));
});
