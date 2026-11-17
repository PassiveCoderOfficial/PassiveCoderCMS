/**
 * Header Studio model, presets and storage rules.
 * Run: npm run test:header
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HEADER_ELEMENT_TYPES, MOBILE_BAR_TYPES, MAX_MOBILE_ICONS, MAX_ZONE_ELEMENTS, ROW_KEYS, ZONES,
  addElement, allElements, defaultConfig, headerConfigProblems, makeElement, moveElement, normalizeHeaderConfig,
  removeElement, safeUrl, splitItems, transparentOn, updateElement, findElement, menuRefs,
  type HeaderConfig,
} from "../model";
import { HEADER_PRESETS, PRESET_IDS, buildPreset, type SiteFacts } from "../presets";
import {
  HISTORY_LIMIT, emptyDoc, normalizeDoc, pickSiteHeader, publish, resolveEditorHeader, resolveLiveHeader,
  restoreVersion, saveDraft, switchToClassic, switchToStudio, discardDraft, hasUnpublishedChanges,
} from "../doc";
import { en } from "@/lib/i18n/locales/en";
import { bn } from "@/lib/i18n/locales/bn";

const FULL: SiteFacts = { phone: "+6591234567", whatsapp: "+6591234567", email: "hi@example.com", socials: 3, shop: true, booking: true };
const BARE: SiteFacts = {};

// ── Presets -> valid configs ───────────────────────────────────────────

test("there are 12 presets with unique ids and en + bn names", () => {
  assert.equal(HEADER_PRESETS.length, 12);
  assert.equal(new Set(PRESET_IDS).size, 12);
  for (const id of PRESET_IDS) {
    for (const key of [`headerStudio.preset.${id}`, `headerStudio.preset.${id}Desc`]) {
      assert.ok((en as Record<string, string>)[key], `en ${key}`);
      assert.ok((bn as Record<string, string>)[key], `bn ${key}`);
    }
  }
});

for (const facts of [FULL, BARE]) {
  const label = facts === FULL ? "full profile" : "empty profile";
  for (const p of HEADER_PRESETS) {
    test(`preset "${p.id}" (${label}) builds a valid header config`, () => {
      const c = p.build(facts);
      // Already normal: normalizing again changes nothing.
      assert.deepEqual(normalizeHeaderConfig(JSON.parse(JSON.stringify(c))), c);
      assert.deepEqual(headerConfigProblems(c), []);
      assert.equal(c.preset, p.id);
      assert.equal(c.rows.main.enabled, true);
      const els = allElements(c, { enabledOnly: true });
      assert.ok(els.some((e) => e.type === "logo"), "has a logo");
      assert.ok(els.some((e) => e.type === "menu"), "has a menu");
      for (const e of allElements(c)) assert.ok((HEADER_ELEMENT_TYPES as readonly string[]).includes(e.type), e.type);
      const ids = allElements(c).map((e) => e.id);
      assert.equal(new Set(ids).size, ids.length, "unique ids");
      for (const k of ROW_KEYS) for (const z of ZONES) assert.ok(c.rows[k].zones[z].length <= MAX_ZONE_ELEMENTS);
      assert.ok(c.mobile.icons.length <= MAX_MOBILE_ICONS);
      for (const i of c.mobile.icons) assert.ok((MOBILE_BAR_TYPES as readonly string[]).includes(i));
    });
  }
}

test("presets are pre-filled from the site: only elements the site has data for", () => {
  for (const id of PRESET_IDS) {
    const bare = allElements(buildPreset(id, BARE)!).map((e) => e.type);
    for (const t of ["phone", "whatsapp", "email", "socials", "booking"] as const) assert.ok(!bare.includes(t), `${id} has ${t} without data`);
    if (id !== "shop") assert.ok(!bare.includes("cart"), `${id} has a cart on a non-shop`);
  }
  const topbar = allElements(buildPreset("topbar", FULL)!).map((e) => e.type);
  assert.ok(topbar.includes("phone") && topbar.includes("email") && topbar.includes("socials") && topbar.includes("booking") && topbar.includes("cart"));
  // Contact values are not copied in: the live site details are used.
  for (const e of allElements(buildPreset("topbar", FULL)!)) assert.equal(e.value, undefined);
  // No booking module: a contact button instead.
  const classic = allElements(buildPreset("classic", { ...FULL, booking: false })!);
  assert.ok(classic.some((e) => e.type === "button" && e.url === "/contact"));
});

test("buildPreset: unknown id -> null", () => {
  assert.equal(buildPreset("hero-section", FULL), null);
});

// ── Zone / element rules ───────────────────────────────────────────────

test("non-header elements never enter a header (normalize drops, problems report)", () => {
  const input = {
    rows: {
      main: { enabled: true, zones: { left: [{ id: "a", type: "logo" }, { id: "b", type: "hero" }, { id: "c", type: "custom_html", data: { html: "<script>" } }],
        center: [{ id: "d", type: "cta" }, { id: "e", type: "navigation" }, { id: "f", type: "container" }], right: [{ id: "g", type: "menu" }, "x", null] } },
    },
  };
  const c = normalizeHeaderConfig(input);
  assert.deepEqual(allElements(c).map((e) => e.type), ["logo", "menu"]);
  const problems = headerConfigProblems(input);
  assert.equal(problems.length, 7);
  assert.match(problems[0], /"hero" cannot go in a header/);
});

test("zones are capped and addElement refuses full zones and foreign types", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ id: `t${i}`, type: "text", label: "x" }));
  const c = normalizeHeaderConfig({ rows: { main: { enabled: true, zones: { left: many } } } });
  assert.equal(c.rows.main.zones.left.length, MAX_ZONE_ELEMENTS);
  assert.ok(headerConfigProblems({ rows: { main: { zones: { left: many } } } }).some((p) => /max/.test(p)));
  assert.equal(addElement(c, "main", "left", makeElement("divider")), c);
  const d = defaultConfig();
  assert.equal(addElement(d, "main", "left", { id: "z", type: "hero" as never }), d);
  const added = addElement(d, "main", "left", makeElement("logo"));
  assert.equal(added.rows.main.zones.left.length, 1);
  assert.equal(d.rows.main.zones.left.length, 0, "original untouched");
});

test("normalize: main row always on, enums fall back, unsafe links dropped, ids made unique", () => {
  const c = normalizeHeaderConfig({
    rows: { main: { enabled: false, background: "neon", zones: { left: [{ id: "x", type: "button", label: "Go", url: "javascript:alert(1)" }, { id: "x", type: "logo", height: 999 }] } } },
    mobile: { drawer: "popup", icons: ["cart", "cart", "hero", "phone", "email", "search"] },
    behaviour: { transparent: "sometimes", transparentPages: ["/about/", "about", "/"] },
  });
  assert.equal(c.rows.main.enabled, true);
  assert.equal(c.rows.main.background, "default");
  assert.equal(c.rows.main.zones.left[0].url, undefined);
  assert.equal(c.rows.main.zones.left[1].height, 120);
  assert.notEqual(c.rows.main.zones.left[0].id, c.rows.main.zones.left[1].id);
  assert.equal(c.mobile.drawer, "side");
  assert.deepEqual(c.mobile.icons, ["cart", "phone", "email"]);
  assert.equal(c.behaviour.transparent, "off");
  assert.deepEqual(c.behaviour.transparentPages, ["/about", "/"]);
  assert.equal(safeUrl("tel:+65123"), "tel:+65123");
  assert.equal(safeUrl("/book"), "/book");
  assert.equal(safeUrl("data:text/html,x"), undefined);
  assert.deepEqual(normalizeHeaderConfig("garbage"), defaultConfig());
});

test("move / update / remove elements", () => {
  let c: HeaderConfig = buildPreset("classic", FULL)!;
  const [menu, cart] = c.rows.main.zones.right;
  c = moveElement(c, cart.id, -1);
  assert.equal(c.rows.main.zones.right[0].id, cart.id);
  c = moveElement(c, menu.id, { row: "menu", zone: "center" });
  assert.equal(c.rows.menu.zones.center[0].id, menu.id);
  assert.ok(!c.rows.main.zones.right.some((e) => e.id === menu.id));
  c = updateElement(c, menu.id, { label: "Primary", type: "hero" as never, menuPart: "first" });
  const found = findElement(c, menu.id)!;
  assert.equal(found.element.type, "menu", "type cannot change");
  assert.equal(found.element.label, "Primary");
  c = updateElement(c, menu.id, { label: "", menuPart: undefined });
  assert.equal(findElement(c, menu.id)!.element.label, undefined);
  assert.equal("menuPart" in findElement(c, menu.id)!.element, false);
  c = removeElement(c, menu.id);
  assert.equal(findElement(c, menu.id), null);
});

test("transparent over hero: off / home / all / chosen pages", () => {
  const c = defaultConfig();
  assert.equal(transparentOn(c, "/"), false);
  c.behaviour.transparent = "home";
  assert.equal(transparentOn(c, "/"), true);
  assert.equal(transparentOn(c, "/about"), false);
  c.behaviour.transparent = "all";
  assert.equal(transparentOn(c, "/x/y"), true);
  c.behaviour.transparent = "selected";
  c.behaviour.transparentPages = ["/services", "/"];
  assert.equal(transparentOn(c, "/services/"), true);
  assert.equal(transparentOn(c, "/services?x=1"), true);
  assert.equal(transparentOn(c, "/about"), false);
});

test("split menu halves and menu refs", () => {
  assert.deepEqual(splitItems([1, 2, 3, 4, 5], "first"), [1, 2, 3]);
  assert.deepEqual(splitItems([1, 2, 3, 4, 5], "second"), [4, 5]);
  assert.deepEqual(splitItems([1, 2], undefined), [1, 2]);
  assert.deepEqual(menuRefs(buildPreset("split", FULL)!), [""]);
});

// ── Storage: opt-in, draft vs published, history, restore ──────────────

test("opt-in: no studio data => legacy header path", () => {
  for (const raw of [null, undefined, {}, "x", [], { enabled: true }, { draft: buildPreset("classic", FULL) }, { enabled: false, published: buildPreset("classic", FULL) }]) {
    assert.equal(resolveLiveHeader(raw), null, JSON.stringify(raw)?.slice(0, 60));
    assert.equal(pickSiteHeader({ blood: false, marketplace: false, studio: resolveLiveHeader(raw), legacyBlocks: 1 }), "legacy");
    assert.equal(pickSiteHeader({ blood: false, marketplace: false, studio: resolveLiveHeader(raw), legacyBlocks: 0 }), "none");
  }
});

test("pickSiteHeader: special sites first, then a live studio header", () => {
  const live = buildPreset("classic", FULL)!;
  assert.equal(pickSiteHeader({ blood: true, marketplace: true, studio: live, legacyBlocks: 1 }), "blood");
  assert.equal(pickSiteHeader({ blood: false, marketplace: true, studio: live, legacyBlocks: 1 }), "marketplace");
  assert.equal(pickSiteHeader({ blood: false, marketplace: false, studio: live, legacyBlocks: 1 }), "studio");
  assert.equal(pickSiteHeader({ blood: false, marketplace: false, studio: live, legacyBlocks: 0 }), "studio");
});

test("draft vs published: drafts never reach the live site", () => {
  const a = buildPreset("classic", FULL)!;
  const b = buildPreset("centered", FULL)!;
  let doc = saveDraft(emptyDoc(), a, "2026-11-12T10:00:00.000Z");
  assert.equal(resolveLiveHeader(doc), null);
  assert.deepEqual(resolveEditorHeader(doc), a);
  assert.equal(hasUnpublishedChanges(doc), true);
  doc = publish(doc, undefined, "2026-11-12T11:00:00.000Z", "user-1");
  assert.deepEqual(resolveLiveHeader(doc), a);
  assert.equal(doc.publishedBy, "user-1");
  assert.equal(hasUnpublishedChanges(doc), false);
  doc = saveDraft(doc, b);
  assert.deepEqual(resolveLiveHeader(doc), a, "live stays the published one");
  assert.deepEqual(resolveEditorHeader(doc), b);
  doc = discardDraft(doc);
  assert.deepEqual(resolveEditorHeader(doc), a);
  // Survives a JSON round trip (what the database stores).
  assert.deepEqual(resolveLiveHeader(JSON.parse(JSON.stringify(doc))), a);
});

test("publishing keeps the last versions; restore goes to draft, or live on request", () => {
  let doc = emptyDoc();
  const configs = PRESET_IDS.map((id) => buildPreset(id, FULL)!);
  configs.forEach((c, i) => { doc = publish(doc, c, `2026-11-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`); });
  assert.equal(doc.history.length, HISTORY_LIMIT);
  assert.deepEqual(doc.published, configs[11]);
  assert.deepEqual(doc.history[0].config, configs[10], "newest first");
  assert.equal(doc.history[0].publishedAt, "2026-11-11T00:00:00.000Z");

  const restored = restoreVersion(doc, 2);
  assert.deepEqual(restored.draft, configs[8]);
  assert.deepEqual(resolveLiveHeader(restored), configs[11], "restore to draft does not go live");

  const live = restoreVersion(doc, 2, { publishNow: true, now: "2026-12-01T00:00:00.000Z" });
  assert.deepEqual(resolveLiveHeader(live), configs[8]);
  assert.deepEqual(live.history[0].config, configs[11], "the replaced live version is kept");
  assert.equal(live.history.length, HISTORY_LIMIT);
  assert.equal(restoreVersion(doc, 99), doc);
});

test("switch back to classic keeps everything; switch on again", () => {
  const a = buildPreset("minimal", FULL)!;
  let doc = publish(emptyDoc(), a);
  doc = switchToClassic(doc);
  assert.equal(resolveLiveHeader(doc), null);
  assert.deepEqual(doc.published, a);
  doc = switchToStudio(doc);
  assert.deepEqual(resolveLiveHeader(doc), a);
  assert.equal(switchToStudio(emptyDoc()).enabled, false, "nothing published -> stays classic");
});

test("normalizeDoc repairs stored garbage without enabling anything", () => {
  assert.deepEqual(normalizeDoc(null), emptyDoc());
  const d = normalizeDoc({ enabled: true, published: null, history: [{ config: null }, { config: {}, publishedAt: "nope" }, 5] });
  assert.equal(d.enabled, false);
  assert.equal(d.history.length, 1);
  assert.deepEqual(d.history[0].config, defaultConfig());
});
