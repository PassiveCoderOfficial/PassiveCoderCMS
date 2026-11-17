import { test } from "node:test";
import assert from "node:assert/strict";
import { classicHeaderItems } from "../classic-links";

test("classic links: legacy navigation block items", () => {
  const items = classicHeaderItems([{ id: "n", type: "navigation", data: { items: [{ id: "a", label: "Home", url: "/" }, { id: "b", label: "About", url: "/about" }] } }]);
  assert.deepEqual(items?.map((i) => i.label), ["Home", "About"]);
});

test("classic links: header_nav inside a container row", () => {
  const items = classicHeaderItems([{ id: "c", type: "container", data: { columns: [
    { id: "1", blocks: [{ id: "l", type: "header_logo", data: { text: "X" } }] },
    { id: "2", blocks: [{ id: "m", type: "header_nav", data: { items: [{ id: "p", label: "Products", url: "#services", children: [{ id: "q", label: "Shirts", url: "/shirts" }] }] } }] },
  ] } }]);
  assert.equal(items?.[0].label, "Products");
  assert.equal(items?.[0].children?.[0].label, "Shirts");
});

test("classic links: hidden or empty nav blocks are skipped, nothing found = null", () => {
  assert.equal(classicHeaderItems([{ id: "n", type: "navigation", visible: false, data: { items: [{ id: "a", label: "Home", url: "/" }] } }]), null);
  assert.equal(classicHeaderItems([{ id: "n", type: "navigation", data: { items: [] } }]), null);
  assert.equal(classicHeaderItems(null), null);
  assert.equal(classicHeaderItems({}), null);
});
