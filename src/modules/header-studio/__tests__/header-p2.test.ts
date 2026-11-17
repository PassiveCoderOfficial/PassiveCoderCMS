/**
 * Menus P2 in the Header Studio: a menu element can carry its own look
 * (menuStyle), elements move by drag and drop (placeElement), and a header
 * whose menu elements have no look renders byte for byte what v1.0.925
 * rendered (fixtures/studio-header.v925.tsx).
 *
 * Run: npm run test:header
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import type { NavItem } from "@/types/cms";
import { StudioHeader } from "@/components/site/header-studio/studio-header";
import { StudioHeader as StudioHeaderV925 } from "@/modules/navigation/__tests__/fixtures/studio-header.v925";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { CartProvider } from "@/lib/cart/cart-context";
import { HEADER_PRESETS } from "../presets";
import { defaultConfig, findElement, makeElement, addElement, normalizeHeaderConfig, placeElement, MAX_ZONE_ELEMENTS, type HeaderConfig } from "../model";

const MENU: NavItem[] = [
  { id: "m1", label: "Home", url: "/" },
  { id: "m2", label: "Services", url: "/services", children: [{ id: "m2a", label: "Aircon repair", url: "/services/aircon" }] },
  { id: "m3", label: "About", url: "/about" },
];
const CONTACT = { phone: "+65 9123 4567", whatsapp: "+65 9123 4567", email: "hi@example.com", socials: [{ platform: "facebook" as const, url: "https://facebook.com/x" }] };
const FACTS = { phone: CONTACT.phone, whatsapp: CONTACT.whatsapp, email: CONTACT.email, socials: 1, shop: true, booking: true };

function render(H: typeof StudioHeader, config: HeaderConfig, preview: "desktop" | "tablet" | "mobile", pathname = "/about") {
  return renderToStaticMarkup(
    React.createElement(PathnameContext.Provider, { value: pathname },
      React.createElement(SiteContactProvider, {
        value: CONTACT,
        children: React.createElement(CartProvider, {
          children: React.createElement(H, { config, menus: { "": MENU }, logoUrl: null, siteName: "Your Business", preview, previewPath: pathname }),
        }),
      })),
  );
}

for (const p of HEADER_PRESETS) {
  test(`preset "${p.id}" without a menu look renders byte for byte as v1.0.925`, () => {
    for (const device of ["desktop", "tablet", "mobile"] as const) {
      const cfg = normalizeHeaderConfig(p.build(FACTS));
      assert.equal(render(StudioHeader, cfg, device), render(StudioHeaderV925, cfg, device), device);
    }
  });
}

test("a menu element with its own look renders through the menu renderer", () => {
  let cfg = defaultConfig();
  const el = makeElement("menu", { menuStyle: { preset: "pill", fontSize: 16 } });
  cfg = addElement(cfg, "main", "center", el);
  const out = render(StudioHeader, normalizeHeaderConfig(cfg), "desktop");
  assert.match(out, /class="pcm pcm-bar min-w-0"/);
  assert.match(out, /--pcm-fs:1rem/);
  assert.match(out, /data-pcm-active="pill"/);
});

test("normalize keeps a valid menu look on menu elements only, cleaned", () => {
  const cfg = normalizeHeaderConfig({
    rows: { main: { enabled: true, zones: {
      left: [{ id: "a", type: "menu", menuStyle: { preset: "caps", color: "red;}", fontSize: 99 } }],
      center: [{ id: "b", type: "button", label: "Go", menuStyle: { preset: "pill" } }],
      right: [{ id: "c", type: "menu", menuStyle: {} }],
    } } },
  });
  assert.deepEqual(findElement(cfg, "a")?.element.menuStyle, { preset: "caps", fontSize: 28 });
  assert.equal(findElement(cfg, "b")?.element.menuStyle, undefined);
  assert.equal(findElement(cfg, "c")?.element.menuStyle, undefined);
});

test("placeElement: drag within a zone and between zones, full zones refuse, no-ops return the same config", () => {
  let cfg = defaultConfig();
  const [a, b, c] = ["a", "b", "c"].map((id) => makeElement("text", { id, label: id }));
  cfg = addElement(addElement(addElement(cfg, "main", "left", a), "main", "left", b), "main", "left", c);
  const ids = (k: HeaderConfig, z: "left" | "center" | "right") => k.rows.main.zones[z].map((e) => e.id);
  // Down within the zone (dropped on c): a goes to c's place.
  assert.deepEqual(ids(placeElement(cfg, "a", { row: "main", zone: "left", index: 2 }), "left"), ["b", "c", "a"]);
  // Up (dropped on a).
  assert.deepEqual(ids(placeElement(cfg, "c", { row: "main", zone: "left", index: 0 }), "left"), ["c", "a", "b"]);
  // Same place: same object.
  assert.equal(placeElement(cfg, "b", { row: "main", zone: "left", index: 1 }), cfg);
  // To another zone and row, clamped index.
  const moved = placeElement(cfg, "b", { row: "top", zone: "right", index: 99 });
  assert.deepEqual(moved.rows.top.zones.right.map((e) => e.id), ["b"]);
  assert.deepEqual(ids(moved, "left"), ["a", "c"]);
  assert.deepEqual(ids(cfg, "left"), ["a", "b", "c"], "the original is not mutated");
  // A full zone refuses.
  let full = cfg;
  for (let i = 0; i < MAX_ZONE_ELEMENTS; i++) full = addElement(full, "main", "right", makeElement("divider"));
  assert.equal(placeElement(full, "a", { row: "main", zone: "right", index: 0 }), full);
  assert.equal(placeElement(cfg, "nope", { row: "main", zone: "right", index: 0 }), cfg);
});
