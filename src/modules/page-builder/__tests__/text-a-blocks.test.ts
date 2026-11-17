/**
 * Blocks audit Nov 2026 (TEXT-A: hero, scroll story, slider, CTA, countdown,
 * stats, marquee, newsletter, social links, bottom bar, text, spacer, divider,
 * video, embed, option preview, columns, container).
 *
 * New text fields render the exact old text when a saved block does not have
 * them (pixel-identical), the new text when set, and the builder gets
 * click-to-type labels while the public markup stays the same.
 * Run: npm run test:builder
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { InlineEditContext } from "@/components/blocks/inline-text";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { HeroBlock } from "@/components/blocks/hero/hero-block";
import { ScrollStoryBlock } from "@/components/blocks/scroll-story/scroll-story-block";
import { CTABlock } from "@/components/blocks/cta/cta-block";
import { CountdownBlock } from "@/components/blocks/countdown/countdown-block";
import { StatsBlock, statAffixes } from "@/components/blocks/stats/stats-block";
import { DividerBlock } from "@/components/blocks/divider/divider-block";
import { bottomBarText } from "@/components/blocks/bottom-bar/bottom-bar-block";
import { plainTextToHtml } from "@/components/admin/page-builder/settings-panel/rich-text-field";
import { BLOCK_FIELDS, type Field } from "../block-fields";
import { blockRegistry } from "../block-registry";
import type { Block, BottomBarBlockProps } from "@/types/cms";

const base = { order: 1, visible: true, width: "full", padding: { top: 0, right: 0, bottom: 0, left: 0 }, margin: { top: 0, right: 0, bottom: 0, left: 0 }, background: { type: "none" } };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blk = (type: string, data: Record<string, unknown>, templateVariant?: string): any => ({ ...base, id: `t-${type}`, type, templateVariant, data });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const html = (el: React.ReactElement, opts: { path?: string; editor?: boolean; contact?: Record<string, unknown> } = {}): string => {
  let node: React.ReactElement = el;
  if (opts.contact) node = React.createElement(SiteContactProvider as React.ComponentType<{ value: unknown; children?: React.ReactNode }>, { value: opts.contact }, node);
  if (opts.editor) node = React.createElement(InlineEditContext.Provider, { value: { updateField: () => {} } }, node);
  if (opts.path) node = React.createElement(PathnameContext.Provider, { value: opts.path }, node);
  return renderToStaticMarkup(node);
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const h = (C: React.ComponentType<any>, block: unknown) => React.createElement(C, { block });

const keysOf = (fields: Field[]) => new Set(fields.map((f) => f.key));

test("block-fields lists the new text fields (en + bn labels)", () => {
  const want: Record<string, string[]> = {
    hero: ["homeLabel", "tertiaryButton", "compact", "topLine", "bullets", "countriesLabel"],
    cta: ["whatsappText", "tertiaryButton", "showBooking", "bookingLabel", "address", "hours", "logoUrl"],
    scroll_story: ["scrollLabel", "portraitAlt"],
    bottom_bar: ["searchTitle", "allProductsLabel", "categoriesTitle", "searchPlaceholder"],
    social_links: ["showLabels"],
    marquee: ["color", "accentColor"],
    container: ["sticky", "transparent", "scrollAware", "glass"],
    video: ["videos", "poster", "maxWidth"],
  };
  for (const [type, keys] of Object.entries(want)) {
    const schema = BLOCK_FIELDS[type as keyof typeof BLOCK_FIELDS];
    const have = keysOf(schema.fields);
    for (const k of keys) {
      assert.ok(have.has(k), `${type}.${k} missing from block-fields`);
      const f = schema.fields.find((x) => x.key === k)!;
      if (f.type !== "hidden") assert.ok(f.label?.en && f.label?.bn, `${type}.${k} needs en + bn label`);
    }
  }
  // Keys that pointed at nothing are gone: video.posterUrl (renderer reads poster), cta.textColor (never read).
  assert.ok(!keysOf(BLOCK_FIELDS.video.fields).has("posterUrl"));
  assert.ok(!keysOf(BLOCK_FIELDS.cta.fields).has("textColor"));
  // Options the renderers never drew are not offered.
  const layout = BLOCK_FIELDS.countdown.fields.find((f) => f.key === "layout")!;
  assert.deepEqual(layout.options?.map((o) => o.value), ["boxes", "minimal"]);
  const action = BLOCK_FIELDS.bottom_bar.fields.find((f) => f.key === "items")!.item!.find((f) => f.key === "action")!;
  assert.equal(action.type, "select");
});

test("registry defaults stay covered and unchanged in shape for TEXT-A blocks", () => {
  for (const type of ["hero", "cta", "stats", "countdown", "scroll_story", "bottom_bar", "text", "columns"]) {
    const def = blockRegistry.find((d) => d.type === type);
    assert.ok(def, type);
    const data = (def!.create() as { data: Record<string, unknown> }).data;
    // New text fields are optional: never written into new blocks (empty = built-in text).
    for (const k of ["homeLabel", "whatsappText", "scrollLabel", "searchTitle", "allProductsLabel"]) assert.ok(!(k in data), `${type} default should not carry ${k}`);
  }
});

test("scroll story: hint text is 'Scroll' when unset, the block's text when set", () => {
  const scenes = [{ title: "Hello" }];
  for (const mode of ["scroll", "autoplay"]) {
    const old = html(h(ScrollStoryBlock, blk("scroll_story", { mode, scenes })));
    assert.match(old, />\s*Scroll\s*</, `${mode}: old block keeps Scroll`);
    const custom = html(h(ScrollStoryBlock, blk("scroll_story", { mode, scenes, scrollLabel: "Défiler" })));
    assert.ok(custom.includes("Défiler") && !/>\s*Scroll\s*</.test(custom), `${mode}: custom hint`);
  }
});

test("hero page banner: breadcrumb home text follows the page language unless set", () => {
  const data = { layout: "centered", title: "About us", typography: { titleSize: "5xl" } };
  const en = html(h(HeroBlock, blk("hero", data, "page-banner")), { path: "/about-us" });
  assert.ok(en.includes(">Home</a>"));
  const ar = html(h(HeroBlock, blk("hero", data, "page-banner")), { path: "/ar/about-us" });
  assert.ok(ar.includes(">الرئيسية</a>"), "Arabic page keeps its translated default");
  const custom = html(h(HeroBlock, blk("hero", { ...data, homeLabel: "Start" }, "page-banner")), { path: "/ar/about-us" });
  assert.ok(custom.includes(">Start</a>") && !custom.includes("الرئيسية"));
});

test("hero + CTA button labels: bare text on the site, click-to-type in the builder", () => {
  const hero = blk("hero", { layout: "left", title: "T", typography: { titleSize: "5xl" }, primaryButton: { label: "Get a quote", url: "/q", variant: "primary" }, secondaryButton: { label: "Call", url: "tel:1", variant: "outline" } }, "split-image-right");
  const pub = html(h(HeroBlock, hero));
  assert.ok(pub.includes(">Get a quote</a>") && pub.includes(">Call</a>"), "public: label is the link's only text");
  const ed = html(h(HeroBlock, hero), { editor: true });
  assert.match(ed, /<a[^>]*><span[^>]*contenteditable="true"[^>]*>Get a quote<\/span><\/a>/i);

  const cta = blk("cta", { title: "Ready?", layout: "centered", primaryButton: { label: "Start", url: "/s" }, showBooking: true, bookingLabel: "" }, "gradient-banner");
  const ctaPub = html(h(CTABlock, cta));
  assert.ok(ctaPub.includes(">Start</a>") && ctaPub.includes(">Book now</a>"));
  const ctaEd = html(h(CTABlock, cta), { editor: true });
  assert.match(ctaEd, /contenteditable="true"[^>]*>Book now<\/span>/i);
});

test("CTA visit + map: WhatsApp message is the built-in one unless set", () => {
  const contact = { whatsapp: "6512345678", address: "1 Main St" };
  const data = { title: "Visit us", layout: "centered", primaryButton: { label: "Chat", url: "" } };
  const old = html(h(CTABlock, blk("cta", data, "visit-map")), { contact });
  assert.ok(old.includes(encodeURIComponent("Hi, I would like to know more.")));
  const custom = html(h(CTABlock, blk("cta", { ...data, whatsappText: "Salam, I need a quote" }, "visit-map")), { contact });
  assert.ok(custom.includes(encodeURIComponent("Salam, I need a quote")) && !custom.includes(encodeURIComponent("Hi, I would like")));
});

test("bottom bar sheet words: built-in English when unset, the block's text when set", () => {
  const d = { items: [], display: "mobile", style: "flat", showLabels: true } as unknown as BottomBarBlockProps["data"];
  assert.deepEqual(bottomBarText(d), { searchTitle: "Search", categoriesTitle: "Shop by category", allProducts: "All products", searchPlaceholder: "Search products" });
  const t = bottomBarText({ ...d, searchTitle: "Find", allProductsLabel: "Everything", categoriesTitle: "Aisles" });
  assert.equal(t.searchTitle, "Find");
  assert.equal(t.allProducts, "Everything");
  assert.equal(t.categoriesTitle, "Aisles");
});

test("countdown: title is drawn above the clock; no title = the old markup", () => {
  const data = { targetDate: "2000-01-01T00:00:00Z", layout: "boxes", showSeconds: true, labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" } };
  const noTitle = html(h(CountdownBlock, blk("countdown", data)));
  assert.ok(noTitle.startsWith('<div class="flex items-center justify-center gap-4 flex-wrap">'), "no wrapper or heading added");
  const withTitle = html(h(CountdownBlock, blk("countdown", { ...data, title: "Sale ends in", showAllText: true })));
  assert.ok(withTitle.startsWith("<h2") && withTitle.includes("Sale ends in"));
  // Saved before Nov 2026 (no showAllText): title stays hidden, markup identical.
  const oldTitled = html(h(CountdownBlock, blk("countdown", { ...data, title: "Sale ends in" })));
  assert.equal(oldTitled, noTitle);
  // A block saved without the labels object no longer crashes.
  const noLabels = html(h(CountdownBlock, blk("countdown", { targetDate: data.targetDate, layout: "minimal", showSeconds: false })));
  assert.ok(noLabels.includes("Days") && noLabels.includes("Minutes"));
});

test("stats: prefix and suffix fields are shown; a value that already has them is not doubled", () => {
  assert.deepEqual(statAffixes({ value: "5000", suffix: "+" }), { pre: "", suf: "+" });
  assert.deepEqual(statAffixes({ value: "500+", suffix: "+" }), { pre: "", suf: "" });
  assert.deepEqual(statAffixes({ value: "$20", prefix: "$" }), { pre: "", suf: "" });
  assert.deepEqual(statAffixes({ value: "20", prefix: "$", suffix: "k" }), { pre: "$", suf: "k" });
  const data = { layout: "row", columns: 4, style: "plain", animate: false, items: [{ id: "1", value: "5000", label: "Jobs", suffix: "+" }, { id: "2", value: "4.9", label: "Rating", suffix: "★" }] };
  const out = html(h(StatsBlock, blk("stats", { ...data, showAllText: true }, "navy-row")));
  assert.ok(out.includes(">5000+<") && out.includes(">4.9★<"));
  // Saved before Nov 2026: suffix field ignored exactly as before.
  const old = html(h(StatsBlock, blk("stats", data, "navy-row")));
  assert.ok(old.includes(">5000<") && old.includes(">4.9<"));
});

test("stats designs show the section title; without one the markup is unchanged", () => {
  const items = [{ id: "1", value: "10", label: "Years" }];
  for (const v of ["colored-row", "plain-dark", "navy-row", "gradient-numbers", "bold-dark-row", "warm-row", "dark-band"]) {
    const plain = html(h(StatsBlock, blk("stats", { layout: "row", columns: 4, style: "plain", animate: false, items }, v)));
    assert.ok(!plain.includes("<h2"), `${v}: no heading without a title`);
    const titled = html(h(StatsBlock, blk("stats", { layout: "row", columns: 4, style: "plain", animate: false, items, title: "Our numbers", subtitle: "Since 2009", showAllText: true }, v)));
    assert.ok(titled.includes(">Our numbers</h2>") && titled.includes("Since 2009"), `${v}: heading drawn`);
    const oldTitled = html(h(StatsBlock, blk("stats", { layout: "row", columns: 4, style: "plain", animate: false, items, title: "Our numbers", subtitle: "Since 2009" }, v)));
    assert.equal(oldTitled, plain, `${v}: saved block without the flag unchanged`);
  }
});

test("divider: zigzag draws a zigzag line (was a plain solid rule)", () => {
  const out = html(h(DividerBlock, blk("divider", { style: "zigzag", color: "#e5e7eb", thickness: 2, width: "full" })));
  assert.ok(out.includes("<polyline") && !out.includes("<hr"));
  const solid = html(h(DividerBlock, blk("divider", { style: "solid", color: "#e5e7eb", thickness: 1, width: "full" })));
  assert.ok(solid.includes("<hr"));
});

test("rich text field: pasted plain text becomes escaped paragraphs", () => {
  assert.equal(plainTextToHtml("Line one\nline two\n\nNext <b>para</b>"), "<p>Line one<br>line two</p><p>Next &lt;b&gt;para&lt;/b&gt;</p>");
  assert.equal(plainTextToHtml("\n\n"), "");
});

// Keep the type import used (Block is the union the renderers take).
export type _Unused = Block;
