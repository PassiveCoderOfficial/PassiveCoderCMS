/**
 * Menus P1 (menu engine, 2026-11-17): links by id, per-language labels,
 * audience, MenuStyle, history. Run: npm run test:nav
 */
import "../../../../tests/mcp/server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NavItem } from "@/types/cms";
import { FakeDb } from "../../../../tests/mcp/fake-supabase";
import {
  applyRefUrls, attachRefs, collectRefs, filterForAudience, hasAudience, localizeMenu, normalizeMenu,
  structureLostByReplace, usesStudio,
} from "../menu-model";
import { loadRefUrls, refUrlFor, resolveMenuRefs } from "../menu-refs";
import { isActivePath, menuStyleVars, normalizeMenuStyle, resolveMenuStyle, MENU_PRESETS, PRESET_STYLES } from "../menu-style";
import { MENU_HISTORY_CAP, needsBeforeVersion, newestFirst, undoTarget, versionsToTrim, type MenuVersion } from "../menu-history";
import { listMenuVersions, restoreMenuVersion, saveMenuWithHistory } from "../menu-versions";
import { LEGACY_MENUS } from "./fixtures/legacy-menus";

const T = "aaaaaaaa-0000-4000-8000-000000000001";
const OTHER = "bbbbbbbb-0000-4000-8000-000000000002";
const PAGE = "aaaaaaaa-1111-4000-8000-000000000001";
const POST = "aaaaaaaa-1111-4000-8000-000000000002";
const HOME = "aaaaaaaa-1111-4000-8000-000000000003";
const PROD = "aaaaaaaa-3333-4000-8000-000000000001";
const MENU = "aaaaaaaa-2222-4000-8000-000000000001";
const USER = "11111111-0000-4000-8000-000000000001";
const db = (seed: Record<string, Record<string, unknown>[]>) => new FakeDb(seed);
const client = (d: FakeDb) => d as unknown as SupabaseClient;

// ── Data shape: old menus untouched ──────────────────────────────────────

test("normalize keeps every legacy menu deep-equal (no P1 field added)", () => {
  for (const [name, items] of Object.entries(LEGACY_MENUS)) assert.deepEqual(normalizeMenu(items), items, name);
});

test("normalize keeps valid P1 fields and drops broken ones", () => {
  const [ok] = normalizeMenu([{ id: "a", label: "About", url: "/about", kind: "page", ref: PAGE, audience: "members", labels: { bn: "আমাদের সম্পর্কে", AR: "من نحن" } }]);
  assert.equal(ok.kind, "page");
  assert.equal(ok.ref, PAGE);
  assert.equal(ok.audience, "members");
  assert.deepEqual(ok.labels, { bn: "আমাদের সম্পর্কে", ar: "من نحن" });
  const [bad] = normalizeMenu([{ id: "b", label: "B", url: "/b", kind: "planet", ref: "x", audience: "admins", labels: { "not a code": "x", bn: "  " } }]);
  assert.equal(bad.kind, undefined);
  assert.equal(bad.ref, undefined);
  assert.equal(bad.audience, undefined);
  assert.equal(bad.labels, undefined);
  const [custom] = normalizeMenu([{ id: "c", label: "C", url: "https://x.com", kind: "custom", ref: "zzz" }]);
  assert.equal(custom.kind, "custom");
  assert.equal(custom.ref, undefined, "a custom link has no record id");
});

test("kind/ref and labels do not switch an item to the studio renderer; audience does", () => {
  assert.equal(usesStudio({ id: "a", label: "A", url: "/a", kind: "page", ref: PAGE, labels: { bn: "এ" } }), false);
  assert.equal(usesStudio({ id: "a", label: "A", url: "/a", audience: "guests" }), true);
  assert.equal(usesStudio({ id: "p", label: "P", url: "#", children: [{ id: "a", label: "A", url: "/a", audience: "members" }] }), true);
});

// ── Links by id ──────────────────────────────────────────────────────────

test("refUrlFor mirrors the site's routes", () => {
  assert.equal(refUrlFor("page", { id: "1", slug: "about", type: "page" }), "/about");
  assert.equal(refUrlFor("page", { id: "1", slug: "home", type: "page" }), "/");
  assert.equal(refUrlFor("page", { id: "1", slug: "news", type: "post" }), "/blog/news");
  assert.equal(refUrlFor("post", { id: "1", slug: "news", type: "post" }), "/blog/news");
  assert.equal(refUrlFor("product", { id: "1", slug: "chair" }), "/products/chair");
  assert.equal(refUrlFor("product", { id: "p1", slug: null }), "/products/p1");
  assert.equal(refUrlFor("service", { id: "s1", link: "/roofing" }), "/roofing");
  assert.equal(refUrlFor("service", { id: "s1", link: null }), "/services#s1");
  assert.equal(refUrlFor("service_group", { id: "g", slug: "repairs" }), "/services#repairs");
  assert.equal(refUrlFor("category", { id: "c", slug: "chairs" }), "/shop?category=chairs");
  assert.equal(refUrlFor("page", { id: "1", slug: null }), null);
});

test("menus without id links: no query, same array back", async () => {
  const d = db({ pages: [] });
  let queried = false;
  const spy = { from: (t: string) => { queried = true; return d.from(t); } } as unknown as SupabaseClient;
  for (const items of Object.values(LEGACY_MENUS)) {
    assert.equal(collectRefs(items).size, 0);
    assert.equal(await resolveMenuRefs(spy, T, items), items);
  }
  assert.equal(queried, false);
});

test("a renamed page keeps the menu working: url follows the slug; gone pages keep the last url", async () => {
  const d = db({
    pages: [
      { id: PAGE, tenant_id: T, slug: "about-us", type: "page", status: "published", deleted_at: null },
      { id: POST, tenant_id: T, slug: "launch", type: "post", status: "draft", deleted_at: null },
      { id: HOME, tenant_id: T, slug: "home", type: "page", status: "published", deleted_at: null },
    ],
    products: [{ id: PROD, tenant_id: OTHER, slug: "not-yours", status: "active" }],
  });
  const items: NavItem[] = [
    { id: "h", label: "Home", url: "/", kind: "page", ref: HOME },
    { id: "a", label: "About", url: "/about", kind: "page", ref: PAGE, children: [
      { id: "p", label: "Launch", url: "/blog/launch", kind: "post", ref: POST },
      { id: "x", label: "Chair", url: "/products/chair", kind: "product", ref: PROD },
    ] },
    { id: "e", label: "Docs", url: "https://docs.example.com" },
  ];
  const out = await resolveMenuRefs(client(d), T, items);
  assert.equal(out[0], items[0], "unchanged item keeps its object");
  assert.equal(out[1].url, "/about-us", "renamed page: live address");
  assert.equal(out[1].children![0].url, "/blog/launch", "unpublished post: last known url");
  assert.equal(out[1].children![1].url, "/products/chair", "another site's product is never read");
  assert.equal(out[2], items[2]);
  const urls = await loadRefUrls(client(d), T, collectRefs(items));
  assert.deepEqual([...urls.keys()].sort(), [`page:${PAGE}`, `page:${HOME}`]);
});

test("applyRefUrls: same array when every url is already live", () => {
  const items: NavItem[] = [{ id: "a", label: "A", url: "/a", kind: "page", ref: "1" }];
  assert.equal(applyRefUrls(items, new Map([["page:1", "/a"]])), items);
  assert.notEqual(applyRefUrls(items, new Map([["page:1", "/b"]])), items);
});

test("attachRefs links exact page matches by id without changing the url", () => {
  const targets = [
    { url: "/about", kind: "page" as const, ref: PAGE },
    { url: "/", kind: "page" as const, ref: HOME },
    { url: "/dup", kind: "page" as const, ref: "1" },
    { url: "/dup", kind: "page" as const, ref: "2" },
    { url: "/shop", group: "Shop" },
  ];
  const items: NavItem[] = [
    { id: "h", label: "Home", url: "/" },
    { id: "a", label: "About", url: "/about", children: [{ id: "d", label: "Dup", url: "/dup" }] },
    { id: "s", label: "Shop", url: "/shop" },
    { id: "l", label: "বাংলা", url: "/", lang: "bn" },
  ];
  const out = attachRefs(items, targets);
  assert.deepEqual([out[0].kind, out[0].ref, out[0].url], ["page", HOME, "/"]);
  assert.deepEqual([out[1].kind, out[1].ref, out[1].url], ["page", PAGE, "/about"]);
  assert.equal(out[1].children![0].ref, undefined, "ambiguous url left alone");
  assert.equal(out[2], items[2], "no id target: untouched");
  assert.equal(out[3], items[3], "language switch link untouched");
  assert.equal(attachRefs(out, targets), out, "second pass changes nothing");
});

// ── Per-language labels ──────────────────────────────────────────────────

test("localizeMenu uses the page language's label and falls back to label", () => {
  const items: NavItem[] = [
    { id: "a", label: "About", url: "/about", labels: { bn: "আমাদের সম্পর্কে" } },
    { id: "c", label: "Contact", url: "/contact", children: [{ id: "q", label: "Quote", url: "/q", labels: { ar: "عرض سعر" } }] },
  ];
  assert.equal(localizeMenu(items, null), items);
  assert.equal(localizeMenu(items, "fr"), items, "no label in that language: same menu");
  const bn = localizeMenu(items, "bn");
  assert.equal(bn[0].label, "আমাদের সম্পর্কে");
  assert.equal(bn[1], items[1]);
  assert.equal(localizeMenu(items, "ar-SA")[1].children![0].label, "عرض سعر", "region falls back to the base language");
});

// ── Audience ─────────────────────────────────────────────────────────────

test("filterForAudience: guests see guest items while unknown; members only when signed in", () => {
  const items: NavItem[] = [
    { id: "all", label: "Home", url: "/" },
    { id: "in", label: "Log in", url: "/account/login", audience: "guests" },
    { id: "acc", label: "My account", url: "/account", audience: "members" },
    { id: "p", label: "Shop", url: "#", children: [{ id: "o", label: "Orders", url: "/account/orders", audience: "members" }] },
  ];
  assert.equal(hasAudience(items), true);
  assert.equal(hasAudience(LEGACY_MENUS.plainLinks), false);
  const ids = (l: NavItem[]) => l.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)]);
  assert.deepEqual(ids(filterForAudience(items, null)), ["all", "in", "p"]);
  assert.deepEqual(ids(filterForAudience(items, false)), ["all", "in", "p"]);
  assert.deepEqual(ids(filterForAudience(items, true)), ["all", "acc", "p", "o"]);
  assert.equal(filterForAudience(LEGACY_MENUS.dropdown, null), LEGACY_MENUS.dropdown);
});

// ── MCP guard ────────────────────────────────────────────────────────────

test("structureLostByReplace: kept ids keep their structure; dropped ones are reported", () => {
  const existing: NavItem[] = [
    { id: "s", label: "Services", url: "#", megaMenu: true, mega: { featured: { title: "Hi" } }, children: [{ id: "c", label: "C", url: "/c" }] },
    { id: "a", label: "About", url: "/about", labels: { bn: "সম্পর্কে" } },
  ];
  assert.deepEqual(structureLostByReplace(existing, existing), []);
  assert.deepEqual(structureLostByReplace(existing, [{ ...existing[0], label: "What we do" }, existing[1]]), []);
  const lost = structureLostByReplace(existing, [{ id: "x", label: "Home", url: "/" }]);
  assert.ok(lost.includes("sub-menus") && lost.includes("labels in other languages") && lost.some((l) => l.startsWith("menu settings")));
  assert.deepEqual(structureLostByReplace([{ id: "a", label: "A", url: "/" }], []), [], "plain items can go");
});

// ── MenuStyle ────────────────────────────────────────────────────────────

test("normalizeMenuStyle keeps safe values in range and drops the rest", () => {
  assert.equal(normalizeMenuStyle(null), null);
  assert.equal(normalizeMenuStyle({ nonsense: 1 }), null);
  const s = normalizeMenuStyle({
    preset: "pill", fontSize: 99, fontWeight: 650, letterSpacing: 1, gap: -4, color: "#123abc", hoverBg: "red; background:url(x)",
    activeColor: "hsl(var(--primary))", active: "dot", hover: "glow", dropdown: { look: "dark", width: 50, bg: "rgb(1, 2, 3)" }, phone: { drawer: "full", dividers: true },
  })!;
  assert.equal(s.preset, "pill");
  assert.equal(s.fontSize, 28);
  assert.equal(s.fontWeight, 700);
  assert.equal(s.letterSpacing, 0.3);
  assert.equal(s.gap, 0);
  assert.equal(s.color, "#123abc");
  assert.equal(s.hoverBg, undefined, "CSS injection refused");
  assert.equal(s.activeColor, "hsl(var(--primary))");
  assert.equal(s.active, "dot");
  assert.equal(s.hover, undefined);
  assert.deepEqual(s.dropdown, { look: "dark", width: 160, bg: "rgb(1, 2, 3)" });
  assert.deepEqual(s.phone, { drawer: "full", dividers: true });
});

test("every preset resolves; overrides beat the preset", () => {
  for (const p of MENU_PRESETS) {
    const r = resolveMenuStyle({ preset: p });
    assert.equal(r.preset, p);
    assert.ok(r.fontSize > 0 && r.dropdown.look && r.phone.drawer);
  }
  assert.equal(resolveMenuStyle({ preset: "pill" }).radius, PRESET_STYLES.pill.radius);
  assert.equal(resolveMenuStyle({ preset: "pill", radius: 4 }).radius, 4);
  assert.equal(resolveMenuStyle({ preset: "soft", dropdown: { width: 300 } }).dropdown.look, "flat", "nested preset values kept");
});

test("menuStyleVars writes CSS variables and data attributes, colours only when set", () => {
  const plain = menuStyleVars(null);
  assert.equal(plain.style["--pcm-fs"], "0.9rem");
  assert.equal(plain.style["--pcm-color"], undefined);
  assert.equal(plain.attrs["data-pcm-hover"], "background");
  const caps = menuStyleVars({ preset: "caps", color: "#fff", dropdown: { fg: "#000" } });
  assert.equal(caps.style["--pcm-tt"], "uppercase");
  assert.equal(caps.style["--pcm-color"], "#fff");
  assert.equal(caps.attrs["data-pcm-active"], "dot");
  assert.equal(caps.attrs["data-pcm-dd-custom"], "");
});

test("isActivePath: exact or sub-path, never a prefix of another slug", () => {
  assert.equal(isActivePath("/about", "/about"), true);
  assert.equal(isActivePath("/about", "/about/"), true);
  assert.equal(isActivePath("/about", "/about-us"), false);
  assert.equal(isActivePath("/services", "/services/roofing"), true);
  assert.equal(isActivePath("/", "/"), true);
  assert.equal(isActivePath("/", "/about"), false);
  assert.equal(isActivePath("#", "/"), false);
  assert.equal(isActivePath("https://x.com/about", "/about"), false);
  assert.equal(isActivePath("/shop?category=a", "/shop"), true);
});

// ── History ──────────────────────────────────────────────────────────────

const v = (id: string, at: string, items: NavItem[], name = "Main"): MenuVersion => ({ id, menu_id: MENU, name, items, saved_by: null, source: "dashboard", created_at: at });

test("history rules: newest first, trim past the cap, undo target, before-version", () => {
  const A: NavItem[] = [{ id: "a", label: "A", url: "/a" }];
  const B: NavItem[] = [{ id: "b", label: "B", url: "/b" }];
  const list = [v("1", "2026-11-01T10:00:00Z", A), v("2", "2026-11-02T10:00:00Z", B)];
  assert.deepEqual(newestFirst(list).map((x) => x.id), ["2", "1"]);
  assert.equal(undoTarget(list, { name: "Main", items: B })?.id, "1");
  assert.equal(undoTarget(list, { name: "Main", items: A })?.id, "2", "changed outside since: back to the newest saved");
  assert.equal(undoTarget([v("1", "2026-11-01T10:00:00Z", A)], { name: "Main", items: A }), null);
  assert.equal(needsBeforeVersion([], { name: "Main", items: A }), true);
  assert.equal(needsBeforeVersion(list, { name: "Main", items: B }), false);
  assert.equal(needsBeforeVersion(list, { name: "Main", items: A }), true);
  const many = Array.from({ length: MENU_HISTORY_CAP + 3 }, (_, i) => v(String(i), new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(), A));
  assert.deepEqual(versionsToTrim(many).sort(), ["0", "1", "2"]);
});

function menuDb(items: NavItem[]) {
  return db({
    nav_menus: [{ id: MENU, tenant_id: T, name: "Main", slug: "main", location: "header", items, updated_at: "2026-11-01T00:00:00Z" }],
    nav_menu_versions: [],
  });
}

test("saveMenuWithHistory: first save keeps the old menu too; undo and restore are saves", async () => {
  const A: NavItem[] = [{ id: "a", label: "A", url: "/a" }];
  const B: NavItem[] = [{ id: "b", label: "B", url: "/b" }];
  const C: NavItem[] = [{ id: "c", label: "C", url: "/c" }];
  const d = menuDb(A);
  const r1 = await saveMenuWithHistory(client(d), { tenantId: T, menuId: MENU, patch: { items: B }, userId: USER, source: "dashboard" });
  assert.equal(r1.history, true);
  let vs = (await listMenuVersions(client(d), T, MENU))!;
  assert.deepEqual(vs.map((x) => [x.source, (x.items as NavItem[])[0].id]), [["dashboard", "b"], ["before", "a"]]);
  assert.equal(vs[0].saved_by, USER);

  await saveMenuWithHistory(client(d), { tenantId: T, menuId: MENU, patch: { items: C }, userId: USER, source: "mcp" });
  // Location-only change: no version.
  await saveMenuWithHistory(client(d), { tenantId: T, menuId: MENU, patch: { location: "footer" }, userId: USER, source: "dashboard" });
  assert.equal((await listMenuVersions(client(d), T, MENU))!.length, 3);

  const undo = await restoreMenuVersion(client(d), { tenantId: T, menuId: MENU, versionId: "undo", userId: USER });
  assert.equal((undo.menu!.items as NavItem[])[0].id, "b", "one step back");
  vs = (await listMenuVersions(client(d), T, MENU))!;
  assert.equal(vs[0].source, "undo");
  const first = vs.find((x) => x.source === "before")!;
  const back = await restoreMenuVersion(client(d), { tenantId: T, menuId: MENU, versionId: first.id, userId: USER });
  assert.equal((back.menu!.items as NavItem[])[0].id, "a");
  assert.equal(d.rows("nav_menus")[0].location, "footer", "restore never moves the menu");
});

test("history is capped per menu and never crosses sites", async () => {
  const d = menuDb([]);
  for (let i = 0; i < MENU_HISTORY_CAP + 5; i++) {
    await saveMenuWithHistory(client(d), { tenantId: T, menuId: MENU, patch: { items: [{ id: `i${i}`, label: String(i), url: "/" }] }, userId: USER, source: "dashboard" });
  }
  assert.equal(d.rows("nav_menu_versions").length, MENU_HISTORY_CAP);
  const other = await saveMenuWithHistory(client(d), { tenantId: OTHER, menuId: MENU, patch: { items: [] }, userId: USER, source: "dashboard" });
  assert.equal(other.menu, null);
  assert.equal(await listMenuVersions(client(d), OTHER, MENU).then((x) => x!.length), 0);
});

test("without the history table (migration 252 not applied) saves still work", async () => {
  const d = menuDb([{ id: "a", label: "A", url: "/a" }]);
  const broken = {
    from: (t: string) => (t === "nav_menu_versions"
      ? { select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: null, error: { message: "relation does not exist" } }) }) }) }) }), insert: async () => ({ error: { message: "relation does not exist" } }) }
      : d.from(t)),
  } as unknown as SupabaseClient;
  const r = await saveMenuWithHistory(broken, { tenantId: T, menuId: MENU, patch: { items: [{ id: "b", label: "B", url: "/b" }] }, userId: USER, source: "dashboard" });
  assert.equal(r.history, false);
  assert.equal((d.rows("nav_menus")[0].items as NavItem[])[0].id, "b");
  const u = await restoreMenuVersion(broken, { tenantId: T, menuId: MENU, versionId: "undo", userId: USER });
  assert.match(u.error!, /not switched on/);
});
