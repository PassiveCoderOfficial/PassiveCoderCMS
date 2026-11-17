/**
 * Header Studio renderer: every preset renders on desktop, tablet and phone
 * with the accessibility basics (skip link, banner landmark, labelled menu,
 * menu button with aria-expanded / aria-controls), and the site layout only
 * takes the studio branch for a published studio header (legacy path
 * otherwise, legacy renderers untouched).
 *
 * Run: npm run test:header
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { NavItem } from "@/types/cms";
import { StudioHeader } from "@/components/site/header-studio/studio-header";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { CartProvider } from "@/lib/cart/cart-context";
import { HEADER_PRESETS, buildPreset } from "../presets";
import { normalizeHeaderConfig, type HeaderConfig } from "../model";

const MENU: NavItem[] = [
  { id: "m1", label: "Home", url: "/" },
  { id: "m2", label: "Services", url: "/services", children: [{ id: "m2a", label: "Aircon repair", url: "/services/aircon" }] },
  { id: "m3", label: "About", url: "/about" },
  { id: "m4", label: "Contact", url: "/contact" },
];
const CONTACT = { phone: "+65 9123 4567", whatsapp: "+65 9123 4567", email: "hi@example.com", socials: [{ platform: "facebook" as const, url: "https://facebook.com/x" }] };
const FACTS = { phone: CONTACT.phone, whatsapp: CONTACT.whatsapp, email: CONTACT.email, socials: 1, shop: true, booking: true };

function render(config: HeaderConfig, preview: "desktop" | "tablet" | "mobile", pathname = "/") {
  return renderToStaticMarkup(
    React.createElement(PathnameContext.Provider, { value: pathname },
      React.createElement(SiteContactProvider, {
        value: CONTACT,
        children: React.createElement(CartProvider, {
          children: React.createElement(StudioHeader, { config, menus: { "": MENU }, logoUrl: null, siteName: "Your Business", preview, previewPath: pathname }),
        }),
      })),
  );
}

for (const p of HEADER_PRESETS) {
  test(`preset "${p.id}" renders on desktop with landmarks and its menu`, () => {
    const html = render(p.build(FACTS), "desktop");
    assert.match(html, /<a href="#pc-main-content"[^>]*>Skip to content<\/a>/);
    assert.match(html, /<header[\s>]/);
    assert.match(html, /<nav aria-label="Main"/);
    assert.match(html, />Services</);
    assert.match(html, /id="pc-main-content"/);
    assert.ok(!html.includes("data-hs-phone-bar"), "no phone bar in the desktop preview");
  });

  test(`preset "${p.id}" renders a phone bar with an accessible menu button`, () => {
    const html = render(p.build(FACTS), "mobile");
    assert.match(html, /data-hs-phone-bar=/);
    assert.match(html, /<button[^>]*aria-expanded="false"[^>]*aria-controls="[^"]+"[^>]*aria-label="Open menu"/);
    assert.ok(!html.includes('data-hs-row="main"'), "no desktop rows in the phone preview");
  });
}

test("tablet follows the breakpoint: phone layout at lg, desktop rows at md", () => {
  const c = buildPreset("classic", FACTS)!;
  assert.match(render(c, "tablet"), /data-hs-phone-bar=/);
  assert.match(render({ ...c, mobile: { ...c.mobile, breakpoint: "md" } }, "tablet"), /data-hs-row="main"/);
});

test("contact elements use the site's contact details", () => {
  const html = render(buildPreset("topbar", FACTS)!, "desktop");
  assert.match(html, /href="tel:\+6591234567"/);
  assert.match(html, /href="mailto:hi@example.com"/);
  assert.match(html, /href="https:\/\/facebook.com\/x"/);
});

test("split menu shows each half once", () => {
  const html = render(buildPreset("split", FACTS)!, "desktop");
  assert.equal(html.split(">Services<").length - 1, 1);
  assert.equal(html.split(">Contact<").length - 1, 1);
});

test("transparent header is transparent on its pages only", () => {
  const c = buildPreset("transparent", FACTS)!;
  assert.match(render(c, "desktop", "/"), /data-transparent=""/);
  assert.doesNotMatch(render(c, "desktop", "/about"), /data-transparent=/);
});

test("elements hidden on a device are not drawn there", () => {
  const c = normalizeHeaderConfig({
    rows: { main: { enabled: true, zones: { left: [{ id: "l", type: "logo" }], right: [{ id: "t", type: "text", label: "DesktopOnlyText", hideOn: "mobile" }, { id: "m", type: "menu" }] } } },
  });
  assert.match(render(c, "desktop"), /DesktopOnlyText/);
  const hidden = normalizeHeaderConfig({ ...c, rows: { ...c.rows, main: { ...c.rows.main, zones: { ...c.rows.main.zones, right: [{ id: "t", type: "text", label: "PhoneOnlyText", hideOn: "desktop" }] } } } });
  assert.doesNotMatch(render(hidden, "desktop"), /PhoneOnlyText/);
});

// ── Opt-in wiring (no studio data => legacy header path) ───────────────

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8").replace(/\r\n/g, "\n");

test("site layout: legacy header branch intact, studio branch only for a live studio header", () => {
  const src = read("src/app/(site)/layout.tsx");
  assert.ok(src.includes("<SiteHeaderChrome blocks={withSiteMedia(globalHeader)} />"), "legacy branch unchanged");
  const studioAt = src.indexOf('headerKind === "studio" && studioHeader ?');
  const legacyAt = src.indexOf(") : globalHeader.length > 0 ? (");
  assert.ok(studioAt > 0 && legacyAt > studioAt, "studio branch sits before the legacy branch and is guarded");
  assert.ok(src.includes("getStudioHeader(tenantId)"));
});

test("page: per-page nav blocks are stripped exactly as before when there is no studio header", () => {
  const src = read("src/app/(site)/[...slug]/page.tsx");
  assert.ok(src.includes("const hasGlobalHeader = (header.length > 0 || !!studioHeader) && !lang;"));
  assert.ok(src.includes("chrome={studioHeader ? studioLangChrome(studioHeader.config) : header}"));
});
