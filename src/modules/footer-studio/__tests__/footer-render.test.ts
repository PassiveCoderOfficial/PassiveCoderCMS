/**
 * Footer Studio renderer: every preset renders on desktop, tablet and phone
 * with the accessibility basics (contentinfo footer, labelled navs,
 * accordion buttons with aria-expanded / aria-controls), the credit follows
 * the plan rule, the newsletter posts to the spam-checked contact route, and
 * every site render path only takes the studio branch for a published
 * studio footer (classic path otherwise, classic renderers untouched).
 *
 * Run: npm run test:footer
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { NavItem } from "@/types/cms";
import { StudioFooter } from "@/components/site/footer-studio/studio-footer";
import { SiteContactProvider, type SiteContact } from "@/components/site/site-contact-context";
import { FOOTER_PRESETS, buildFooterPreset, type FooterFacts } from "../presets";
import { normalizeFooterConfig, type FooterConfig } from "../model";

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

function render(config: FooterConfig, preview?: "desktop" | "tablet" | "mobile", contact: SiteContact = CONTACT, siteName = "Acme Aircon") {
  return renderToStaticMarkup(
    React.createElement(PathnameContext.Provider, { value: "/" },
      // eslint-disable-next-line react/no-children-prop -- typed children prop for the provider
      React.createElement(SiteContactProvider, {
        value: contact,
        children: React.createElement(StudioFooter, { config, menus: { "": MENU }, hours: "Mon-Fri 9am-6pm; Sat 10am-2pm", siteMap: null, logoUrl: null, siteName, preview }),
      })),
  );
}

for (const p of FOOTER_PRESETS) {
  test(`preset "${p.id}" renders a contentinfo footer on every device`, () => {
    for (const device of ["desktop", "tablet", "mobile", undefined] as const) {
      const html = render(p.build(FACTS), device);
      assert.match(html, /<footer role="contentinfo"/);
      assert.match(html, /data-footer-studio="/);
      assert.match(html, /All rights reserved\./);
      assert.match(html, /Powered by/, "default credit on a locked plan");
    }
  });
}

test("menus render as labelled navs with the site's links", () => {
  const html = render(buildFooterPreset("corporate", FACTS)!, "desktop");
  assert.match(html, /<nav aria-label="Quick links"/);
  assert.match(html, />Services</);
});

test("contact, hours and socials come from the site's details", () => {
  const html = render(buildFooterPreset("contact", FACTS)!, "desktop");
  assert.match(html, /href="tel:\+6591234567"/);
  assert.match(html, /href="mailto:hi@example.com"/);
  assert.match(html, /href="https:\/\/wa.me\/6591234567"/);
  assert.match(html, /1 Main St, Singapore/);
  assert.match(html, /<li>Mon-Fri 9am-6pm<\/li><li>Sat 10am-2pm<\/li>/);
  assert.match(html, /href="https:\/\/facebook.com\/x"/);
});

test("map widget embeds the site address when it has no map of its own", () => {
  const html = render(buildFooterPreset("map", FACTS)!, "desktop");
  assert.match(html, /<iframe src="https:\/\/www.google.com\/maps\?q=1%20Main%20St%2C%20Singapore/);
  assert.match(html, /loading="lazy"/);
});

test("phone accordions: headed columns get a collapsed toggle with aria-expanded / aria-controls", () => {
  const c = buildFooterPreset("corporate", FACTS)!;
  const phone = render(c, "mobile");
  const m = phone.match(/<button type="button" aria-expanded="false" aria-controls="([^"]+)"/);
  assert.ok(m, "accordion button");
  assert.match(phone, new RegExp(`id="${m![1].replace(/[:]/g, "\\:")}" data-fs-panel="" class="[^"]*hidden`), "panel collapsed");
  const live = render(c);
  assert.match(live, /aria-expanded="false"[^>]*class="[^"]*sm:hidden/, "live: toggle only below sm");
  assert.match(live, /data-fs-panel="" class="[^"]*hidden sm:block/, "live: panel open from sm up");
  const desktop = render(c, "desktop");
  assert.doesNotMatch(desktop, /aria-expanded/, "no accordion in the desktop preview");
  const off = render({ ...c, mobile: { ...c.mobile, accordion: false } }, "mobile");
  assert.doesNotMatch(off, /aria-expanded/, "owner can turn accordions off");
});

test("credit: locked plan always shows it; an editable plan may hide or change it", () => {
  const c = normalizeFooterConfig({ ...buildFooterPreset("simple", FACTS)!, credit: { show: false } });
  assert.match(render(c, "desktop"), /Powered by/, "locked plan ignores the hide choice");
  assert.doesNotMatch(render(c, "desktop", { ...CONTACT, creditEditable: true }), /Powered by/);
  const custom = normalizeFooterConfig({ ...c, credit: { text: "Made by Acme Web", url: "https://acme.example" } });
  assert.match(render(custom, "desktop", { ...CONTACT, creditEditable: true }), /href="https:\/\/acme.example\/?"[^>]*>Made by Acme Web</);
  assert.doesNotMatch(render(buildFooterPreset("simple", FACTS)!, "desktop", CONTACT, "Passive Coder"), /Powered by/, "the platform does not credit itself");
});

test("a footer with no copyright line still shows the credit on its own line", () => {
  const c = normalizeFooterConfig({ columns: [{ widgets: [{ type: "about" }] }], bottom: { enabled: false } });
  const html = render(c, "desktop");
  assert.match(html, /data-fs-credit=""/);
  assert.match(html, /Powered by/);
});

test("newsletter: labelled field, trap field, posts to the spam-checked contact route", () => {
  const html = render(buildFooterPreset("newsletter", FACTS)!, "desktop");
  assert.match(html, /<form[^>]*data-fs-newsletter=""/);
  assert.match(html, /<label for="[^"]+" class="sr-only">/);
  assert.match(html, /name="website"/);
  const src = fs.readFileSync(path.join(process.cwd(), "src/components/site/footer-studio/footer-widgets.tsx"), "utf8");
  assert.ok(src.includes('fetch("/api/contact/submit"'), "posts to /api/contact/submit");
  assert.ok(src.includes('formName: "Newsletter"'));
  assert.ok(src.includes("website: trap") && src.includes("elapsedMs"), "trap and timing go to the spam checks");
  const route = fs.readFileSync(path.join(process.cwd(), "src/app/api/contact/submit/route.ts"), "utf8");
  assert.ok(/findBlock|isBlockedSender/.test(route) && route.includes("isBotSubmission"), "the route runs the spam checks");
});

test("interactive preview content is never inside a <button> (hydration #418)", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "src/app/(admin)/dashboard/header-builder/footer-studio/studio-client.tsx"), "utf8");
  const gallery = src.slice(src.indexOf("function PresetGallery"), src.indexOf("// ── Shared bits"));
  assert.ok(gallery.includes('role="button" tabIndex={0}'), "preset card is a div role=button");
  assert.ok(gallery.includes('e.key === "Enter" || e.key === " "'), "Enter / Space pick a preset");
  assert.ok(!/<button[^>]*>\s*<div className="cms-canvas-light/.test(gallery));
});

// ── Opt-in wiring (no studio data => classic footer on every path) ─────

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8").replace(/\r\n/g, "\n");

test("site layout: classic footer branch intact, studio branch only for a live studio footer", () => {
  const src = read("src/app/(site)/layout.tsx");
  assert.ok(src.includes(`      ) : globalFooter.length > 0 ? (
        <div data-site-chrome="footer" style={{ display: "contents" }}>
          <PageRenderer blocks={withSiteMedia(globalFooter)} />
        </div>
      ) : null}`), "classic branch unchanged");
  const studioAt = src.indexOf('footerKind === "studio" && studioFooter ?');
  const classicAt = src.indexOf(") : globalFooter.length > 0 ? (");
  const marketAt = src.indexOf("<MarketplaceFooter");
  assert.ok(marketAt > 0 && studioAt > marketAt && classicAt > studioAt, "marketplace, then guarded studio, then classic");
  assert.ok(src.includes("getStudioFooter(tenantId)"));
});

test("tenant homepage: classic footer unless a studio footer is live; per-page footer stripping unchanged without one", () => {
  const src = read("src/app/(marketing)/page.tsx");
  assert.ok(src.includes("{studioFooter ? <StudioSiteFooter tenantId={tenantId} data={studioFooter} /> : globalFooter.length > 0 && <PageRenderer blocks={withSiteMedia(globalFooter)} />}"));
  assert.ok(src.includes("const hasGlobalFooter = globalFooter.length > 0 || !!studioFooter;"));
});

test("site pages: per-page footer blocks stripped exactly as before when there is no studio footer", () => {
  const src = read("src/app/(site)/[...slug]/page.tsx");
  assert.ok(src.includes("const hasGlobalFooter = (footer.length > 0 || !!studioFooter) && !lang;"));
  assert.ok(src.includes("getStudioFooter(tenantId)"));
});

test("shop landing page: footer strip rule extends to a studio footer only", () => {
  const src = read("src/app/(site)/shop/page.tsx");
  assert.ok(src.includes('!((layout.footer.length || studioFooter) && isChromeBlock(b, "footer"))'));
});

test("contact / pricing / legal pages: classic footer unless a studio footer is live; own-language chrome wins", () => {
  const src = read("src/components/site/tenant-page-with-chrome.tsx");
  assert.ok(src.includes("const studioFoot = ownChrome ? null : studioFooter;"));
  assert.ok(src.includes("const hasGlobalFooter = (footer.length > 0 || !!studioFoot) && !ownChrome;"));
  assert.ok(src.includes("{studioFoot ? <StudioSiteFooter tenantId={tenantId} data={studioFoot} /> : hasGlobalFooter && <PageRenderer blocks={footer} />}"));
});

test("404 page: classic footer unless a studio footer is live", () => {
  // The 404 wraps its content in the shared site chrome (lib/site/site-chrome),
  // which picks the Studio footer exactly like normal pages: live = studio, else classic blocks.
  const page = read("src/app/not-found.tsx");
  assert.ok(page.includes("const chrome = await chromeFor(tenantId);"), "a client site's 404 loads that site's chrome");
  assert.match(page, /<Shell chrome=\{chrome\}>/);
  const chrome = read("src/lib/site/site-chrome.tsx");
  assert.ok(chrome.includes("getStudioFooter(tenantId)"), "loads the live Studio footer (null unless published and enabled)");
  assert.ok(chrome.includes("{chrome?.studioFooter ? <StudioSiteFooter tenantId={chrome.tenantId} data={chrome.studioFooter} /> : chrome && chrome.footer.length > 0 && <PageRenderer blocks={chrome.footer} />}"));
});

test("translated pages hide the studio footer exactly like the classic one", () => {
  const chrome = read("src/components/site/footer-studio/studio-footer-chrome.tsx");
  assert.ok(chrome.includes('data-site-chrome="footer"'), "same chrome marker HIDE_GLOBAL_CHROME_CSS targets");
  const shell = read("src/components/site/language-shell.tsx");
  assert.ok(shell.includes("HIDE_GLOBAL_CHROME_CSS"), "language shell still hides global chrome for a language version");
});

test("the loader is opt-in and fails closed to the classic footer", () => {
  const src = read("src/lib/site/footer-studio.ts");
  assert.ok(src.includes('select("footer_studio")'), "own query, so a missing column only means classic");
  assert.ok(/if \(error \|\| !data\) return null;/.test(src));
  assert.ok(/catch \{\n\s+return null;/.test(src));
  assert.ok(src.includes("resolveLiveFooter("));
});

test("classic footer renderers are untouched by the studio", () => {
  for (const f of ["src/components/blocks/footer/footer-block.tsx", "src/components/site/page-renderer.tsx"]) {
    assert.ok(!read(f).includes("footer-studio"), `${f} does not know about the studio`);
  }
});
