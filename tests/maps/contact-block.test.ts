/**
 * Contact block: the map (saved embed URLs render the same string, pasted
 * links show their place, the Map location control's value, map height) and
 * the built-in words (exact old text when a saved block has no field, the
 * new text when set). The baseline for "same markup" was checked against all
 * 804 live Contact blocks before this change (block-audit/text-contact.md).
 * Run: npx tsx --test tests/maps/contact-block.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBlock } from "@/components/blocks/contact/contact-block";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { BLOCK_FIELDS } from "@/modules/page-builder/block-fields";
import { uiTextDefs } from "@/modules/page-builder/ui-text";
import type { ContactBlockProps } from "@/types/cms";

const base = { order: 1, visible: true, width: "full", padding: { top: 0, right: 0, bottom: 0, left: 0 }, margin: { top: 0, right: 0, bottom: 0, left: 0 }, background: { type: "none" } };
const fields = [
  { id: "f1", label: "Name", type: "text", required: true },
  { id: "f2", label: "Service", type: "select", required: false, options: ["Repairs", "Painting"] },
  { id: "f3", label: "Drawings", type: "file", required: false },
  { id: "f4", label: "Message", type: "textarea", required: true },
];
const block = (data: Record<string, unknown>): ContactBlockProps => ({
  ...base, id: "c1", type: "contact",
  data: { title: "Get in Touch", layout: "split", showMap: true, showContactInfo: true, submitLabel: "Send Message", successMessage: "Thanks", fields, ...data },
} as unknown as ContactBlockProps);
const html = (data: Record<string, unknown>, site: Record<string, unknown> = { address: "12 Example Road, Singapore" }) =>
  renderToStaticMarkup(React.createElement(SiteContactProvider, { value: site as never, children: React.createElement(ContactBlock, { block: block(data) }) }));
const iframeSrc = (h: string) => h.match(/<iframe src="([^"]*)"/)?.[1]?.replace(/&amp;/g, "&");

test("saved embed URLs render exactly as before", () => {
  for (const url of [
    "https://www.google.com/maps?q=27.014443,49.6551893&z=16&output=embed",
    "https://maps.google.com/maps?q=Example%20Tour%20%26%20Travels&t=m&z=14&output=embed&iwloc=near",
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8!2d103.85!3d1.28!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2ssg!4v1",
  ]) assert.equal(iframeSrc(html({ mapEmbedUrl: url })), url);
  // Old frame classes untouched.
  assert.match(html({ mapEmbedUrl: "https://www.google.com/maps?q=1,2&output=embed" }), /<div class="rounded-xl overflow-hidden border mt-6 aspect-video"><iframe/);
});

test("no saved map: the address search, as before", () => {
  assert.equal(iframeSrc(html({ address: "5 Shop Street" })), "https://www.google.com/maps?q=5%20Shop%20Street&z=15&output=embed");
  assert.equal(iframeSrc(html({})), "https://www.google.com/maps?q=12%20Example%20Road%2C%20Singapore&z=15&output=embed");
  assert.equal(iframeSrc(html({ showMap: false })), undefined);
});

test("pasted links that used to be ignored now show their place", () => {
  assert.equal(iframeSrc(html({ mapEmbedUrl: "https://www.google.com/maps/place/Merlion+Park/@1.2868,103.8545,17z" })), "https://www.google.com/maps?q=1.2868,103.8545&z=17&output=embed");
  assert.equal(iframeSrc(html({ mapEmbedUrl: "https://maps.app.goo.gl/AbC123", address: "5 Shop Street" })), "/api/maps/embed?u=https%3A%2F%2Fmaps.app.goo.gl%2FAbC123&a=5+Shop+Street");
  assert.equal(iframeSrc(html({ mapEmbedUrl: `<iframe src="https://www.google.com/maps/embed?pb=!1m3!1d3988.8!2d103.85!3d1.28&amp;hl=en" width="600"></iframe>` })), "https://www.google.com/maps/embed?pb=!1m3!1d3988.8!2d103.85!3d1.28&hl=en");
});

test("Map location control value and map height", () => {
  assert.equal(iframeSrc(html({ mapLocation: { lat: 1.2836, lng: 103.8607, zoom: 18, label: "Marina Bay Sands" } })), "https://www.google.com/maps?q=1.2836,103.8607&z=18&output=embed");
  const tall = html({ mapEmbedUrl: "https://www.google.com/maps?q=1,2&output=embed", mapHeight: 400 });
  assert.match(tall, /<div class="rounded-xl overflow-hidden border mt-6" style="height:400px"><iframe/);
  const sideMap = html({ mapEmbedUrl: "https://www.google.com/maps?q=1,2&output=embed", showContactInfo: false, layout: "left", mapHeight: 320 });
  assert.match(sideMap, /<div class="rounded-xl overflow-hidden border w-full" style="height:320px">/);
  const detailsOnly = html({ mapEmbedUrl: "https://www.google.com/maps?q=1,2&output=embed", hideForm: true, mapHeight: 480 });
  assert.match(detailsOnly, /<div class="rounded-xl overflow-hidden border" style="height:480px">/);
});

test("built-in words: old text when missing, the block's text when set", () => {
  const details = { phone: "+65 1234 5678", email: "hi@example.com", address: "5 Shop Street", hours: "Mon-Fri 9-6", whatsapp: "+6512345678" };
  const old = html(details);
  for (const s of ["Call us", "Email us", "Visit us", "Opening hours", "> Chat on WhatsApp", "Select…", "Choose file (PDF, Word or image, max 10 MB)", "Send Message"]) assert.ok(old.includes(s), s);
  const mine = html({ ...details, callLabel: "اتصل بنا", emailLabel: "Mail", visitLabel: "Find us", hoursLabel: "Hours", whatsappLabel: "WhatsApp us", selectPlaceholder: "Pick one", filePlaceholder: "Attach a file" });
  for (const s of ["اتصل بنا", ">Mail<", "Find us", ">Hours<", "> WhatsApp us", "Pick one", "Attach a file"]) assert.ok(mine.includes(s), s);
  for (const s of ["Call us", "Email us", "Visit us", "Chat on WhatsApp", "Select…", "Choose file"]) assert.ok(!mine.includes(s), s);
  // Blank boxes fall back to the built-in text.
  assert.ok(html({ ...details, callLabel: "  " }).includes("Call us"));
});

test("mobile editor schema lists the map and wording fields", () => {
  const keys = new Set(BLOCK_FIELDS.contact.fields.map((f) => f.key));
  for (const k of ["mapEmbedUrl", "mapHeight", "mapLocation", ...uiTextDefs("contact").map((d) => d.key)]) assert.ok(keys.has(k), k);
  for (const d of uiTextDefs("contact")) assert.match(d.key, /(Label|Text|Title|Placeholder)$/, `${d.key} must be picked up by the page translator`);
});
