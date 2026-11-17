/**
 * Switch to Studio, footer side (menus P5): classic footer block -> Footer
 * Studio draft (brand column, link columns, saved-menu columns, long columns
 * as saved menus, newsletter, bottom bar, colours, credit), the cases that
 * cannot convert, faithfulness, and the new optional fields (own colours,
 * heading colour, own social links, longer link labels).
 * Run: npm run test:footer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Block } from "../../../types/cms";
import { convertClassicFooter, FOOTER_MENU_REF } from "../../studio-switch/footer-convert";
import { footerFidelity } from "../../studio-switch/fidelity";
import { prepareDocs } from "../../studio-switch/prepare";
import { allWidgets, normalizeFooterConfig } from "../model";
import { emptyDoc, resolveLiveFooter } from "../doc";
import { emptyDoc as emptyHeaderDoc } from "../../header-studio/doc";
import { buildFooterPreset } from "../presets";
import { StudioFooter } from "../../../components/site/footer-studio/studio-footer";
import { SiteContactProvider } from "../../../components/site/site-contact-context";

const ADDRESS = "Building 30, Zone 06, Street 810, Old Al Ghanim (Al Ghanim Al Oteeq), near Gold Souq, Doha, Qatar - Office 01";

function footer(data: Record<string, unknown>): Block {
  return {
    id: "ft", type: "footer", order: 0, visible: true,
    data: {
      style: "dark", logo: "https://x.test/logo.png", logoText: "Acme", tagline: "We build things.",
      backgroundColor: "#0b1f3a", textColor: "#e5e7eb", accentColor: "#f59e0b",
      columns: [
        { id: "c1", heading: "Company", links: [{ id: "l1", label: "About", url: "/about" }, { id: "l2", label: "Careers", url: "/careers" }] },
        { id: "c2", heading: "Contact", links: [{ id: "l3", label: ADDRESS, url: "https://maps.google.com/?q=x" }] },
      ],
      socials: [{ platform: "facebook", url: "https://facebook.com/acme" }, { platform: "telegram", url: "https://t.me/acme" }],
      copyrightText: "Copyright © {year} Acme. All Rights Reserved.", copyrightYear: true,
      bottomLinks: [{ id: "b1", label: "Privacy", url: "/privacy" }],
      followTitle: "Follow us",
      ...data,
    },
  } as unknown as Block;
}

const input = (blocks: unknown, menus: { id: string; location: string | null; items: unknown }[] = []) =>
  ({ globalFooter: blocks, menus, identityLogo: "https://x.test/logo.png", siteName: "Acme" });
const BITS = { menus: [], identityLogo: "https://x.test/logo.png", siteName: "Acme", siteSocials: ["https://instagram.com/site"] };

test("classic footer -> brand column, link columns, bottom bar, own colours, exact", () => {
  const blocks = [footer({})];
  const c = convertClassicFooter(input(blocks));
  assert.equal(c.level, "exact");
  const cfg = c.config!;
  assert.equal(cfg.columns.length, 3);
  const [brand, company, contact] = cfg.columns;
  assert.deepEqual(brand.widgets.map((w) => w.type), ["about", "socials"]);
  assert.equal(brand.widgets[0].text, "We build things.");
  assert.equal(brand.widgets[0].imageUrl, "https://x.test/logo.png");
  assert.equal(brand.widgets[1].title, "Follow us");
  // Own social links kept, unknown networks too (shown with their first letter, as the classic footer).
  assert.deepEqual(brand.widgets[1].socials?.map((s) => s.platform), ["facebook", "telegram"]);
  assert.equal(company.title, "Company");
  assert.deepEqual(company.widgets[0].links?.map((l) => l.label), ["About", "Careers"]);
  // Long labels (addresses) are kept whole.
  assert.equal(contact.widgets[0].links?.[0].label, ADDRESS);
  assert.equal(cfg.style.bgColor, "#0b1f3a");
  assert.equal(cfg.style.fgColor, "#e5e7eb");
  assert.equal(cfg.style.accentColor, "#f59e0b");
  assert.equal(cfg.style.uppercase, true);
  assert.equal(cfg.mobile.accordion, false);
  assert.equal(cfg.bottom.zones.left[0].text, "Copyright © {year} Acme. All Rights Reserved.");
  assert.deepEqual(cfg.bottom.zones.right[0].links?.map((l) => l.url), ["/privacy"]);
  assert.deepEqual(footerFidelity(blocks, c, BITS).diffs, []);
});

test("site social links when the block says so; default copyright line; theme gradient kept", () => {
  const blocks = [footer({ showSocials: true, copyrightText: undefined, copyrightYear: false, backgroundColor: undefined, textColor: undefined, accentColor: undefined })];
  const c = convertClassicFooter(input(blocks));
  const socials = allWidgets(c.config!).find((w) => w.type === "socials")!;
  assert.equal(socials.socials, undefined);
  assert.equal(c.config!.bottom.zones.left[0].text, "©  Acme. All rights reserved.");
  assert.equal(c.config!.style.background, "secondary");
  assert.equal(c.config!.style.gradient, "dark");
  assert.equal(c.level, "exact");
  assert.deepEqual(footerFidelity(blocks, c, BITS).diffs, []);
});

test("a column showing a saved menu becomes a menu widget; more than 12 links becomes a new saved menu", () => {
  const many = Array.from({ length: 14 }, (_, i) => ({ id: `m${i}`, label: `Link ${i}`, url: `/l${i}` }));
  const blocks = [footer({ columns: [
    { id: "c1", heading: "Shop", links: [], menuId: "menu-1", menuLevels: 2 },
    { id: "c2", heading: "All", links: many },
  ] })];
  const menus = [{ id: "menu-1", location: "footer", items: [{ id: "a", label: "Shoes", url: "/shoes" }] }];
  const c = convertClassicFooter(input(blocks, menus));
  const [, shop, all] = c.config!.columns;
  assert.deepEqual([shop.widgets[0].type, shop.widgets[0].menuId, shop.widgets[0].levels], ["menu", "menu-1", 2]);
  assert.equal(all.widgets[0].menuId, `${FOOTER_MENU_REF}1`);
  assert.equal(c.newMenus.length, 1);
  assert.equal(c.newMenus[0].items.length, 14);
  assert.deepEqual(footerFidelity(blocks, c, { ...BITS, menus }).diffs, []);
  // Prepared: the placeholder becomes the created menu's id.
  const out = prepareDocs({ footer: c, footerDoc: emptyDoc(), header: null, headerDoc: emptyHeaderDoc(), menuIds: () => "22222222-2222-4222-8222-222222222222", origin: { at: "2026-11-17T10:00:00.000Z", by: null, via: "staff" } });
  assert.equal(out.footerDoc!.draft!.columns[2].widgets[0].menuId, "22222222-2222-4222-8222-222222222222");
  assert.equal(resolveLiveFooter(out.footerDoc), null);
  assert.equal(out.footerDoc!.switched?.via, "staff");
});

test("more than five columns share the fifth; newsletter gets a column", () => {
  const cols = Array.from({ length: 5 }, (_, i) => ({ id: `c${i}`, heading: `H${i}`, links: [{ id: `l${i}`, label: `L${i}`, url: `/${i}` }] }));
  const blocks = [footer({ columns: cols, showNewsletter: true })];
  const c = convertClassicFooter(input(blocks));
  assert.equal(c.config!.columns.length, 5);
  assert.ok(c.notes.some((n) => n.code === "footerColumnsMerged"));
  assert.ok(allWidgets(c.config!).some((w) => w.type === "newsletter"));
  assert.deepEqual(footerFidelity(blocks, c, BITS).diffs, []);
});

test("cannot convert: no footer block, extra sections (phone bottom bar), empty", () => {
  assert.equal(convertClassicFooter(input([])).notes[0].code, "empty");
  const extra = convertClassicFooter(input([footer({}), { id: "bb", type: "bottom_bar", visible: true, data: {} }]));
  assert.equal(extra.level, "unsupported");
  assert.equal(extra.notes[0].code, "extraBlocks");
  assert.equal(extra.notes[0].detail, "bottom_bar");
  assert.equal(convertClassicFooter(input([{ id: "x", type: "text", visible: true, data: {} }])).notes[0].code, "noFooterBlock");
});

test("new options are optional: a preset normalizes exactly as before", () => {
  const preset = buildFooterPreset("corporate", { phone: "+65 1", email: "a@b.c", socials: 1, address: "", hours: false, map: false, legal: [] })!;
  const again = normalizeFooterConfig(JSON.parse(JSON.stringify(preset)));
  assert.deepEqual(again, preset);
  assert.equal("bgColor" in again.style, false);
});

test("renderer: own colours and heading colour, own social links", () => {
  const c = convertClassicFooter(input([footer({})]));
  const html = renderToStaticMarkup(React.createElement(SiteContactProvider as React.FC<{ value: unknown; children?: React.ReactNode }>, { value: { socials: [{ platform: "instagram", url: "https://instagram.com/site" }] } },
    React.createElement(StudioFooter, { config: c.config!, menus: {}, siteName: "Acme", preview: "desktop" })));
  assert.match(html, /background:#0b1f3a/);
  assert.match(html, /color:#f59e0b/);
  assert.match(html, /https:\/\/t\.me\/acme/);
  assert.doesNotMatch(html, /instagram\.com\/site/);
});
