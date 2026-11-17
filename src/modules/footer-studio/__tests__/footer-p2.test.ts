/**
 * Menus P2 in the Footer Studio: a menu widget can carry its own look
 * (menuStyle) and a two-column layout, a links widget can become a saved
 * menu ("Save as menu"), and a footer whose menu widgets have none of this
 * renders byte for byte what v1.0.925 rendered (fixtures/studio-footer.v925.tsx).
 *
 * Run: npm run test:footer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { NavItem } from "@/types/cms";
import { StudioFooter } from "@/components/site/footer-studio/studio-footer";
import { StudioFooter as StudioFooterV925 } from "@/modules/navigation/__tests__/fixtures/studio-footer.v925";
import { SiteContactProvider, type SiteContact } from "@/components/site/site-contact-context";
import { FOOTER_PRESETS, type FooterFacts } from "../presets";
import {
  addWidget, defaultFooterConfig, findWidget, linksAsMenuItems, linksToMenuWidget, makeColumn, makeWidget, normalizeFooterConfig, type FooterConfig,
} from "../model";

const MENU: NavItem[] = [
  { id: "m1", label: "Home", url: "/" },
  { id: "m2", label: "Services", url: "/services", children: [{ id: "m2a", label: "Aircon repair", url: "/services/aircon" }] },
  { id: "m3", label: "About", url: "/about" },
];
const CONTACT: SiteContact = {
  phone: "+65 9123 4567", whatsapp: "+65 9123 4567", email: "hi@example.com", address: "1 Main St, Singapore",
  socials: [{ platform: "facebook", url: "https://facebook.com/x" }],
};
const FACTS: FooterFacts = { phone: CONTACT.phone, whatsapp: CONTACT.whatsapp, email: CONTACT.email, address: CONTACT.address, socials: 1, hours: true, map: true, shop: true, booking: true, legal: [{ label: "Privacy", url: "/privacy" }] };

function render(F: typeof StudioFooter, config: FooterConfig, preview?: "desktop" | "tablet" | "mobile") {
  return renderToStaticMarkup(
    React.createElement(PathnameContext.Provider, { value: "/about" },
      // eslint-disable-next-line react/no-children-prop -- typed children prop for the provider
      React.createElement(SiteContactProvider, {
        value: CONTACT,
        children: React.createElement(F, { config, menus: { "": MENU }, hours: "Mon-Fri 9am-6pm", siteMap: null, logoUrl: null, siteName: "Acme", preview }),
      })),
  );
}

for (const p of FOOTER_PRESETS) {
  test(`preset "${p.id}" without a menu look renders byte for byte as v1.0.925`, () => {
    for (const device of ["desktop", "tablet", "mobile", undefined] as const) {
      const cfg = normalizeFooterConfig(p.build(FACTS));
      assert.equal(render(StudioFooter, cfg, device), render(StudioFooterV925, cfg, device), String(device));
    }
  });
}

function withMenuWidget(extra: Parameters<typeof makeWidget>[1]): FooterConfig {
  const cfg = { ...defaultFooterConfig(), columns: [makeColumn([])] };
  return normalizeFooterConfig(addWidget(cfg, { where: "column", column: 0 }, makeWidget("menu", { title: "Explore", ...extra })));
}

test("a menu widget with its own look renders through the menu renderer (list, inline row, two columns)", () => {
  const list = render(StudioFooter, withMenuWidget({ menuStyle: { preset: "underline" } }), "desktop");
  assert.match(list, /class="pcm pcm-vertical"/);
  assert.match(list, /aria-label="Explore"/);
  assert.match(render(StudioFooter, withMenuWidget({ menuStyle: { preset: "plain" }, layout: "inline" }), "desktop"), /pcm pcm-inline pcm-justify/);
  assert.match(render(StudioFooter, withMenuWidget({ menuStyle: { preset: "plain" }, layout: "columns" }), "desktop"), /pcm pcm-vertical pcm-cols/);
  // Two columns without a look: the footer's own links in CSS columns.
  assert.match(render(StudioFooter, withMenuWidget({ layout: "columns" }), "desktop"), /columns-2/);
});

test("normalize: menu look and two columns only on menu widgets", () => {
  const cfg = normalizeFooterConfig({ columns: [{ id: "c", widgets: [
    { id: "a", type: "menu", layout: "columns", menuStyle: { preset: "pill", gap: 500 } },
    { id: "b", type: "links", layout: "columns", menuStyle: { preset: "pill" }, links: [] },
    { id: "d", type: "menu", menuStyle: {} },
  ] }] });
  assert.equal(findWidget(cfg, "a")?.widget.layout, "columns");
  assert.deepEqual(findWidget(cfg, "a")?.widget.menuStyle, { preset: "pill", gap: 64 });
  assert.equal(findWidget(cfg, "b")?.widget.layout, undefined);
  assert.equal(findWidget(cfg, "b")?.widget.menuStyle, undefined);
  assert.equal(findWidget(cfg, "d")?.widget.menuStyle, undefined);
});

test("Save as menu: a links widget becomes a menu widget in place (same id, heading, layout)", () => {
  const links = makeWidget("links", { id: "lw", title: "Legal", layout: "inline", links: [
    { id: "l1", label: "Privacy", url: "/privacy" }, { id: "l2", label: "Terms", url: "/terms", newTab: true }, { id: "l3", label: "", url: "/x" },
  ] });
  const cfg = addWidget({ ...defaultFooterConfig(), columns: [makeColumn([])] }, { where: "column", column: 0 }, links);
  assert.deepEqual(linksAsMenuItems(links), [{ id: "l1", label: "Privacy", url: "/privacy" }, { id: "l2", label: "Terms", url: "/terms", target: "_blank" }]);
  const next = linksToMenuWidget(cfg, "lw", "menu-1");
  assert.deepEqual(findWidget(next, "lw")?.widget, { id: "lw", type: "menu", menuId: "menu-1", title: "Legal", layout: "inline" });
  assert.equal(linksToMenuWidget(next, "lw", "menu-2"), next, "only links widgets convert");
  assert.equal(findWidget(cfg, "lw")?.widget.type, "links", "the original is not mutated");
});
