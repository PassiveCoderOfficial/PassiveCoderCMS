/**
 * Footer Studio model, presets, menu fallbacks and storage rules.
 * Run: npm run test:footer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BOTTOM_WIDGET_TYPES, COLUMN_WIDGET_TYPES, FOOTER_WIDGET_TYPES, MAX_COLUMNS, MAX_COLUMN_WIDGETS, MAX_LINKS, MAX_ZONE_WIDGETS,
  addColumn, addWidget, allWidgets, allowedInBottom, allowedInColumn, copyrightText, defaultFooterConfig, findWidget,
  footerConfigProblems, footerMenuRefs, gridTemplate, hoursLines, makeColumn, makeWidget, moveColumn, moveWidget,
  normalizeFooterConfig, removeColumn, removeWidget, safeUrl, updateColumn, updateWidget, usesHours,
  type FooterConfig,
} from "../model";
import { FOOTER_PRESETS, PRESET_IDS, buildFooterPreset, type FooterFacts } from "../presets";
import {
  HISTORY_LIMIT, emptyDoc, normalizeDoc, pickSiteFooter, publish, resolveEditorFooter, resolveLiveFooter,
  restoreVersion, saveDraft, switchToClassic, switchToStudio, discardDraft, hasUnpublishedChanges,
} from "../doc";
import { pickFooterMenu, pagesAsItems } from "../menus";
import { en } from "@/lib/i18n/locales/en";
import { bn } from "@/lib/i18n/locales/bn";

const FULL: FooterFacts = {
  phone: "+6591234567", whatsapp: "+6591234567", email: "hi@example.com", address: "1 Main St", socials: 3,
  hours: true, map: true, shop: true, booking: true, legal: [{ label: "Privacy", url: "/privacy" }, { label: "Terms", url: "/terms" }],
};
const BARE: FooterFacts = {};

// ── Presets -> valid configs ───────────────────────────────────────────

test("there are 10 presets with unique ids and en + bn names", () => {
  assert.equal(FOOTER_PRESETS.length, 10);
  assert.equal(new Set(PRESET_IDS).size, 10);
  for (const id of [...PRESET_IDS, "custom"]) {
    const keys = id === "custom" ? [`footerStudio.preset.${id}`] : [`footerStudio.preset.${id}`, `footerStudio.preset.${id}Desc`];
    for (const key of keys) {
      assert.ok((en as Record<string, string>)[key], `en ${key}`);
      assert.ok((bn as Record<string, string>)[key], `bn ${key}`);
    }
  }
});

test("every widget, zone, background and size has en + bn labels", () => {
  const keys = [
    ...FOOTER_WIDGET_TYPES.map((t) => `footerStudio.w.${t}`),
    ...["left", "center", "right"].map((z) => `footerStudio.zone.${z}`),
    ...["default", "muted", "primary", "secondary", "dark"].map((b) => `footerStudio.bg.${b}`),
    ...["sm", "md", "lg"].map((s) => `footerStudio.size.${s}`),
    ...["presets", "layout", "style", "history"].map((s) => `footerStudio.tab.${s}`),
    ...["phone", "whatsapp", "email", "address"].map((s) => `footerStudio.contact.${s}`),
  ];
  for (const key of keys) {
    assert.ok((en as Record<string, string>)[key], `en ${key}`);
    assert.ok((bn as Record<string, string>)[key], `bn ${key}`);
  }
});

for (const facts of [FULL, BARE]) {
  const label = facts === FULL ? "full profile" : "empty profile";
  for (const p of FOOTER_PRESETS) {
    test(`preset "${p.id}" (${label}) builds a valid footer config`, () => {
      const c = p.build(facts);
      assert.equal(c.preset, p.id);
      assert.deepEqual(footerConfigProblems(c), [], "no placement problems");
      assert.deepEqual(normalizeFooterConfig(JSON.parse(JSON.stringify(c))), c, "normalising is stable");
      assert.ok(c.columns.length <= MAX_COLUMNS);
      for (const col of c.columns) {
        assert.ok(col.widgets.length > 0, "no empty columns");
        assert.ok(col.widgets.length <= MAX_COLUMN_WIDGETS);
      }
      assert.ok(allWidgets(c).some((w) => w.type === "copyright"), "every preset has a copyright line (it carries the credit)");
    });
  }
}

test("presets drop widgets the site has nothing for", () => {
  const types = (c: FooterConfig) => allWidgets(c).map((w) => w.type);
  for (const p of FOOTER_PRESETS) {
    const bare = types(p.build(BARE));
    for (const t of ["hours", "map", "socials", "contact", "payments"] as const) assert.ok(!bare.includes(t), `${p.id}: no ${t} on an empty profile`);
  }
  assert.ok(types(buildFooterPreset("map", FULL)!).includes("map"));
  assert.ok(types(buildFooterPreset("corporate", FULL)!).includes("hours"));
  assert.ok(types(buildFooterPreset("shop", FULL)!).includes("payments"));
});

test("the 10 presets look different (no two with the same structure)", () => {
  const shape = (c: FooterConfig) => JSON.stringify({
    cols: c.columns.map((x) => [x.span, x.widgets.map((w) => w.type)]),
    bottom: Object.values(c.bottom.zones).map((z) => z.map((w) => w.type)),
    bg: c.style.background, align: c.style.align,
  });
  const shapes = FOOTER_PRESETS.map((p) => shape(p.build(FULL)));
  assert.equal(new Set(shapes).size, shapes.length);
});

// ── Widget / zone rules ────────────────────────────────────────────────

test("placement rules: big widgets only in columns, back-to-top only in the bottom bar", () => {
  for (const t of ["about", "contact", "hours", "newsletter", "map"]) {
    assert.ok(allowedInColumn(t));
    assert.ok(!allowedInBottom(t), `${t} not in bottom bar`);
  }
  assert.ok(allowedInBottom("backToTop") && !allowedInColumn("backToTop"));
  for (const t of ["copyright", "links", "menu", "socials", "payments", "text"]) assert.ok(allowedInColumn(t) && allowedInBottom(t));
  assert.ok(!allowedInColumn("hero") && !allowedInBottom("custom_html"));
  assert.equal(new Set([...COLUMN_WIDGET_TYPES, ...BOTTOM_WIDGET_TYPES]).size, FOOTER_WIDGET_TYPES.length);
});

test("normalize drops non-footer widgets and misplaced ones, caps columns and zones", () => {
  const raw = {
    columns: Array.from({ length: 7 }, () => ({ widgets: [
      { type: "hero" }, { type: "custom_html", html: "<script>x</script>" }, { type: "backToTop" },
      ...Array.from({ length: 6 }, () => ({ type: "text", text: "x" })),
    ] })),
    bottom: { zones: { left: [{ type: "map" }, { type: "copyright" }, ...Array.from({ length: 6 }, () => ({ type: "socials" }))] } },
  };
  const c = normalizeFooterConfig(raw);
  assert.equal(c.columns.length, MAX_COLUMNS);
  for (const col of c.columns) {
    assert.equal(col.widgets.length, MAX_COLUMN_WIDGETS);
    assert.ok(col.widgets.every((w) => w.type === "text"));
  }
  assert.equal(c.bottom.zones.left.length, MAX_ZONE_WIDGETS);
  assert.equal(c.bottom.zones.left[0].type, "copyright");
  const problems = footerConfigProblems(raw);
  assert.ok(problems.some((p) => p.includes('"hero"')));
  assert.ok(problems.some((p) => p.includes('"backToTop" cannot go in a footer column')));
  assert.ok(problems.some((p) => p.includes('"map" cannot go in the footer bottom bar')));
  assert.ok(problems.some((p) => p.includes("7 columns")));
});

test("normalize never throws and cleans values", () => {
  for (const junk of [null, undefined, 42, "x", [], { columns: "no" }, { bottom: { zones: { left: "x" } } }]) {
    assert.doesNotThrow(() => normalizeFooterConfig(junk));
  }
  const c = normalizeFooterConfig({
    columns: [{ id: "a", span: 3, widgets: [
      { id: "dup", type: "links", links: [{ label: "Ok", url: "/ok" }, { label: "Bad", url: "javascript:alert(1)" }, ...Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, url: "/x" }))] },
      { id: "dup", type: "about", height: 999, imageUrl: "javascript:x" },
    ] }],
    style: { background: "neon", size: "huge" },
  });
  assert.equal(c.columns[0].span, 1);
  const [links, about] = c.columns[0].widgets;
  assert.notEqual(links.id, about.id, "ids made unique");
  assert.equal(links.links!.length, MAX_LINKS);
  assert.ok(links.links!.every((l) => l.url !== "javascript:alert(1)"));
  assert.equal(about.height, 160);
  assert.equal(about.imageUrl, undefined);
  assert.equal(c.style.background, "secondary");
  assert.equal(c.style.size, "md");
  assert.equal(safeUrl("javascript:alert(1)"), undefined);
  assert.equal(safeUrl("tel:+65123"), "tel:+65123");
});

test("map widget keeps only https / own embed-route URLs", () => {
  const ok = normalizeFooterConfig({ columns: [{ widgets: [{ type: "map", mapEmbedUrl: "https://www.google.com/maps?q=x&output=embed", mapLocation: { lat: 1.3, lng: 103.8, zoom: 99 } }] }] });
  const w = ok.columns[0].widgets[0];
  assert.ok(w.mapEmbedUrl?.startsWith("https://"));
  assert.equal(w.mapLocation?.zoom, 21);
  const bad = normalizeFooterConfig({ columns: [{ widgets: [{ type: "map", mapEmbedUrl: "javascript:alert(1)" }] }] });
  assert.equal(bad.columns[0].widgets[0].mapEmbedUrl, undefined);
});

test("credit choice is cleaned (http(s) links only)", () => {
  const c = normalizeFooterConfig({ credit: { show: false, text: "  Made by Acme ", url: "javascript:x" } });
  assert.deepEqual(c.credit, { show: false, text: "Made by Acme" });
  assert.equal(normalizeFooterConfig({}).credit, undefined);
});

test("editing: add / move / update / remove widgets and columns", () => {
  let c: FooterConfig = defaultFooterConfig();
  c = addColumn(c, makeColumn([], { title: "One" }));
  c = addColumn(c, makeColumn());
  const about = makeWidget("about");
  c = addWidget(c, { where: "column", column: 0 }, about);
  assert.equal(findWidget(c, about.id)?.where, "column");
  assert.equal(addWidget(c, { where: "bottom", zone: "left" }, makeWidget("about")), c, "about refused in the bottom bar");
  assert.equal(addWidget(c, { where: "column", column: 0 }, makeWidget("backToTop")), c, "back-to-top refused in a column");
  const cp = makeWidget("copyright");
  c = addWidget(c, { where: "column", column: 1 }, cp);
  c = moveWidget(c, cp.id, { where: "bottom", zone: "right" });
  assert.deepEqual(findWidget(c, cp.id) && { where: findWidget(c, cp.id)!.where }, { where: "bottom" });
  assert.equal(moveWidget(c, about.id, { where: "bottom", zone: "left" }), c, "about cannot move to the bottom bar");
  c = updateWidget(c, about.id, { text: "Hello", hideLogo: false });
  assert.equal(findWidget(c, about.id)!.widget.text, "Hello");
  assert.ok(!("hideLogo" in findWidget(c, about.id)!.widget), "false values are dropped");
  c = updateColumn(c, 0, { span: 2, title: "" });
  assert.equal(c.columns[0].span, 2);
  assert.equal(c.columns[0].title, undefined);
  assert.equal(gridTemplate(c), "2fr 1fr");
  c = moveColumn(c, 0, 1);
  assert.equal(c.columns[1].widgets[0].id, about.id);
  c = removeWidget(c, about.id);
  assert.equal(findWidget(c, about.id), null);
  c = removeColumn(c, 0);
  assert.equal(c.columns.length, 1);
  for (let i = 0; i < 10; i++) c = addColumn(c);
  assert.equal(c.columns.length, MAX_COLUMNS);
});

test("menu refs, hours use, copyright text and hours lines", () => {
  const c = normalizeFooterConfig({
    columns: [{ widgets: [{ type: "menu" }, { type: "menu", menuId: "m2" }, { type: "hours" }] }],
    bottom: { zones: { center: [{ type: "menu" }] } },
  });
  assert.deepEqual(footerMenuRefs(c).sort(), ["", "m2"]);
  assert.ok(usesHours(c));
  assert.ok(!usesHours(normalizeFooterConfig({ columns: [{ widgets: [{ type: "hours", hours: "Mon 9-5" }] }] })), "own hours need no lookup");
  assert.equal(copyrightText(null, "Acme", 2026), "© 2026 Acme. All rights reserved.");
  assert.equal(copyrightText({ text: "Copyright {year} Acme Pte Ltd" }, "x", 2026), "Copyright 2026 Acme Pte Ltd");
  assert.deepEqual(hoursLines("Mon-Fri 9-6; Sat 10-2"), ["Mon-Fri 9-6", "Sat 10-2"]);
  assert.deepEqual(hoursLines("Sun closed\nMon 9-5"), ["Sun closed", "Mon 9-5"]);
  assert.deepEqual(hoursLines(null), []);
});

// ── Menu fallbacks ─────────────────────────────────────────────────────

test("a menu widget falls back: own menu, footer menu, header menu, classic links, any menu, pages", () => {
  const items = (label: string) => [{ id: label, label, url: `/${label}` }];
  const footer = { id: "f", location: "footer", items: items("footer") };
  const header = { id: "h", location: "header", items: items("header") };
  const other = { id: "o", location: null, items: items("other") };
  const classic = items("classic");
  const pages = pagesAsItems([{ slug: "about", title: "About" }, { slug: "home", title: "Home" }]);
  assert.equal(pages[0].url, "/", "home first");
  assert.equal(pickFooterMenu([footer, header, other], "o", classic, pages)[0].label, "other");
  assert.equal(pickFooterMenu([footer, header, other], "deleted", classic, pages)[0].label, "footer");
  assert.equal(pickFooterMenu([header, other], "", classic, pages)[0].label, "header");
  assert.equal(pickFooterMenu([other], "", classic, pages)[0].label, "classic");
  assert.equal(pickFooterMenu([other], "", null, pages)[0].label, "other");
  assert.equal(pickFooterMenu([], "", null, pages)[0].label, "Home");
});

// ── Storage document ───────────────────────────────────────────────────

test("no document / garbage => classic footer (resolveLiveFooter null)", () => {
  for (const raw of [null, undefined, {}, "x", { enabled: true }, { enabled: false, published: { columns: [] } }, { published: { columns: [] } }]) {
    assert.equal(resolveLiveFooter(raw), null);
  }
  assert.deepEqual(normalizeDoc(null), emptyDoc());
  assert.equal(pickSiteFooter({ marketplace: false, studio: null, legacyBlocks: 1 }), "legacy");
  assert.equal(pickSiteFooter({ marketplace: false, studio: null, legacyBlocks: 0 }), "none");
  assert.equal(pickSiteFooter({ marketplace: true, studio: defaultFooterConfig(), legacyBlocks: 1 }), "marketplace");
  assert.equal(pickSiteFooter({ marketplace: false, studio: defaultFooterConfig(), legacyBlocks: 1 }), "studio");
});

test("draft is private: saving a draft never turns the studio footer on", () => {
  const d = saveDraft(emptyDoc(), buildFooterPreset("corporate", FULL));
  assert.equal(d.enabled, false);
  assert.equal(resolveLiveFooter(d), null);
  assert.ok(hasUnpublishedChanges(d));
  assert.equal(resolveEditorFooter(d)?.preset, "corporate");
});

test("publish goes live, keeps history (max 10), restore and switch back", () => {
  let d = emptyDoc();
  for (let i = 0; i < 13; i++) {
    const c = buildFooterPreset(PRESET_IDS[i % PRESET_IDS.length], FULL)!;
    d = publish(d, c, new Date(Date.UTC(2026, 10, 1, 0, i)).toISOString(), "user-1");
  }
  assert.equal(d.enabled, true);
  assert.equal(d.history.length, HISTORY_LIMIT);
  assert.ok(resolveLiveFooter(d));
  assert.ok(!hasUnpublishedChanges(d));
  const before = d.history[0].config;
  const r = restoreVersion(d, 0);
  assert.deepEqual(r.draft, before);
  assert.notDeepEqual(r.published, before, "restore to draft does not go live");
  const live = restoreVersion(d, 0, { publishNow: true });
  assert.deepEqual(live.published, before);
  assert.equal(restoreVersion(d, 99), d);
  const classic = switchToClassic(d);
  assert.equal(resolveLiveFooter(classic), null, "classic switch: legacy footer path");
  assert.ok(classic.published, "studio data kept");
  assert.ok(resolveLiveFooter(switchToStudio(classic)));
  assert.equal(switchToStudio(emptyDoc()).enabled, false, "nothing published: cannot switch on");
  assert.equal(discardDraft(saveDraft(d, defaultFooterConfig())).draft, null);
  // Round trip through JSON (what the database stores).
  assert.deepEqual(normalizeDoc(JSON.parse(JSON.stringify(d))), d);
});
