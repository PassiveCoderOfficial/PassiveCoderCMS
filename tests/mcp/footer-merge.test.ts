/**
 * Site Identity screen saves (dashboard/templates/header-footer): the
 * identity, Global Footer and Pre-Footer forms send only what changed and
 * /api/identity merges it into the blocks stored now (src/lib/site/footer-merge.ts).
 * Data-loss bugs covered: stale identity save overwriting the header/footer,
 * footer form replacing the whole footer area (or a footer stored after
 * another block), pre-footer save replacing banner colours / form fields /
 * other blocks. Run: npm run test:mcp
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block } from "../../src/types/cms";
import {
  buildFooterSave, buildPrefooterSave, changedIdentityFields, findFooterBlock, footerFormState,
  mergeFooterForm, mergePrefooterForm, parseFooterFormSave, parsePrefooterFormSave, pickIdentityFields,
  prefooterFormState, CTA_FORM_FIELDS, CONTACT_FORM_FIELDS,
} from "../../src/lib/site/footer-merge";

type Obj = Record<string, unknown>;
const blk = (id: string, type: string, data: Obj, extra: Obj = {}) => ({ id, type, order: 0, visible: true, data, ...extra }) as unknown as Block;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const dataOf = (b: Block | undefined) => (b as unknown as { data: Obj }).data;

test("identity save: only identity columns, only the changed ones", () => {
  const body = { _type: "identity", site_name: "A", logo_url: "x", global_header: [], global_footer: {}, template_id: "t", color_overrides: {} };
  assert.deepEqual(pickIdentityFields(body), { site_name: "A", logo_url: "x" });
  const loaded = { site_name: "Old", tagline: null, logo_url: "https://a/logo.png", logo_width: 160 };
  assert.deepEqual(changedIdentityFields(loaded, { ...loaded }), {}, "untouched form sends nothing");
  assert.deepEqual(changedIdentityFields(loaded, { ...loaded, tagline: "" }), {}, "empty text equals null");
  assert.deepEqual(changedIdentityFields(loaded, { ...loaded, site_name: "New", logo_url: null }), { site_name: "New", logo_url: null });
});

const storedFooterArea = () => [
  blk("wa-1", "whatsapp_button", { number: "+6512345678" }),
  blk("ft-1", "footer", {
    logoText: "Acme", logo: "https://a/logo.png", tagline: "Since 1990", copyrightText: "© Acme", copyrightYear: true,
    style: "retail", backgroundColor: "#111111", accentColor: "#ff0000", textColor: "#eeeeee",
    showNewsletter: false, showBooking: true, bookingTitle: "Book now",
    credit: { show: false },
    columns: [{ id: "c1", heading: "Company", text: "12 Road", links: [{ id: "l1", label: "About", url: "/about", lang: "ar" }] }],
    socials: [{ platform: "facebook", url: "https://fb.com/acme" }],
    bottomLinks: [{ id: "b1", label: "Privacy", url: "/privacy" }],
  }, { padding: { top: 40, right: 0, bottom: 40, left: 0 }, order: 1 }),
  blk("bb-1", "bottom_bar", { items: [] }, { order: 2 }),
];

test("footer form: finds the footer after other blocks and keeps every other block and field", () => {
  const stored = storedFooterArea();
  const footer = findFooterBlock(stored);
  assert.equal((footer as unknown as Obj).id, "ft-1");
  const base = footerFormState(footer);
  assert.equal(base.footerStyle, "custom");
  const save = buildFooterSave(base, { ...base, tagline: "Since 1991" }, "retail");
  assert.deepEqual(save.changed, ["tagline"]);
  const parsed = parseFooterFormSave(clone(save));
  assert.ok(parsed);
  const next = mergeFooterForm(stored, parsed!, "new-id");
  assert.equal(next.length, 3);
  assert.deepEqual(next[0], stored[0]);
  assert.deepEqual(next[2], stored[2]);
  const d = dataOf(next[1]);
  assert.equal(d.tagline, "Since 1991");
  // Fields the form has no control for survive.
  assert.equal(d.logo, "https://a/logo.png");
  assert.equal(d.showBooking, true);
  assert.deepEqual(d.credit, { show: false });
  assert.equal(d.style, "retail");
  assert.equal((d.columns as Obj[])[0].text, "12 Road");
  assert.equal(((d.columns as Obj[])[0].links as Obj[])[0].lang, "ar");
  assert.deepEqual((next[1] as unknown as Obj).padding, { top: 40, right: 0, bottom: 40, left: 0 });
});

test("footer form: an untouched save changes nothing; edits made elsewhere since loading survive", () => {
  const stored = storedFooterArea();
  const base = footerFormState(findFooterBlock(stored));
  const none = buildFooterSave(base, base, "retail");
  assert.deepEqual(none.changed, []);
  assert.deepEqual(mergeFooterForm(stored, none, "x"), stored);
  // Someone renamed the logo text in the builder after the form loaded.
  const now = clone(stored);
  (now[1] as unknown as { data: Obj }).data.logoText = "Acme Ltd";
  const next = mergeFooterForm(now, buildFooterSave(base, { ...base, copyright: "© 2026 Acme" }, "retail"), "x");
  assert.equal(dataOf(next[1]).logoText, "Acme Ltd");
  assert.equal(dataOf(next[1]).copyrightText, "© 2026 Acme");
});

test("footer form: style switch writes the look fields; Dark hands colours back to the theme; Retail kept under Custom", () => {
  const stored = storedFooterArea();
  const base = footerFormState(findFooterBlock(stored));
  const dark = mergeFooterForm(stored, buildFooterSave(base, { ...base, footerStyle: "dark" }, "retail"), "x");
  const d = dataOf(dark[1]);
  assert.equal(d.style, "dark");
  assert.ok(!("backgroundColor" in d) && !("accentColor" in d) && !("textColor" in d));
  const recol = mergeFooterForm(stored, buildFooterSave(base, { ...base, bg: "#222222" }, "retail"), "x");
  assert.equal(dataOf(recol[1]).style, "retail");
  assert.equal(dataOf(recol[1]).backgroundColor, "#222222");
});

test("footer form: no footer block yet adds one after the other blocks only once something changed", () => {
  const stored = [blk("wa-1", "whatsapp_button", {})];
  const base = footerFormState(null);
  assert.deepEqual(mergeFooterForm(stored, buildFooterSave(base, base), "new"), stored);
  const next = mergeFooterForm(stored, buildFooterSave(base, { ...base, logoText: "Acme" }), "new");
  assert.equal(next.length, 2);
  assert.equal((next[1] as unknown as Obj).id, "new");
  assert.equal((next[1] as unknown as Obj).type, "footer");
  assert.equal((next[1] as unknown as Obj).order, 1);
  assert.equal(dataOf(next[1]).logoText, "Acme");
  assert.deepEqual(dataOf(next[1]).columns, []);
});

test("footer form: malformed saves are refused (a column without links would crash the footer)", () => {
  const base = footerFormState(null);
  const ok = buildFooterSave(base, { ...base, logoText: "A" });
  assert.ok(parseFooterFormSave(clone(ok)));
  const bad = clone(ok) as unknown as { values: Obj };
  bad.values.columns = [{ id: "c", heading: "H" }];
  assert.equal(parseFooterFormSave(bad), null);
  assert.equal(parseFooterFormSave({ values: { ...ok.values, style: "neon" }, changed: ["style"] }), null);
  assert.equal(parseFooterFormSave(null), null);
});

const storedPrefooter = () => [
  blk("cta-1", "cta", {
    title: "Talk to us", description: "Free quote", layout: "centered",
    primaryButton: { label: "Call", url: "tel:+65123", bgColor: "#25D366", textColor: "#ffffff" },
    secondaryButton: { label: "Mail", url: "mailto:a@b.c" },
  }, { background: { type: "color", color: "#123456" }, templateVariant: "split-image" }),
  blk("map-1", "embed", { url: "https://www.google.com/maps/embed?pb=1" }, { order: 1 }),
  blk("ct-1", "contact", {
    title: "Get in touch", email: "a@b.c", recipientEmail: "sales@b.c", showMap: true,
    fields: [{ id: "f1", label: "Name", type: "text" }, { id: "f2", label: "Budget", type: "select", options: ["S", "M"] }],
    submitLabel: "Send it",
  }, { order: 2 }),
];

test("pre-footer form: keeps banner colours, variant, form fields and other blocks", () => {
  const stored = storedPrefooter();
  const base = prefooterFormState(stored[0], stored[2]);
  assert.equal(base.recipientEmail, "sales@b.c");
  const save = buildPrefooterSave(base, { ...base, ctaTitle: "Talk to us today", ctaPrimaryLabel: "Call now", phone: "+65 1234" }, { cta: "cta-1", contact: "ct-1" });
  assert.deepEqual(save.cta.changed, ["title", "primaryButton"]);
  assert.deepEqual(save.contact.changed, ["phone"]);
  const parsed = parsePrefooterFormSave(clone(save));
  assert.ok(parsed);
  const next = mergePrefooterForm(stored, parsed!, (t) => `${t}-new`);
  assert.equal(next.length, 3);
  assert.deepEqual(next[1], stored[1], "other pre-footer block kept");
  const cta = next[0] as unknown as Obj;
  assert.equal(cta.templateVariant, "split-image");
  assert.deepEqual(cta.background, { type: "color", color: "#123456" });
  const cd = cta.data as Obj;
  assert.equal(cd.title, "Talk to us today");
  assert.deepEqual(cd.primaryButton, { label: "Call now", url: "tel:+65123", bgColor: "#25D366", textColor: "#ffffff" });
  assert.deepEqual(cd.secondaryButton, { label: "Mail", url: "mailto:a@b.c" });
  const kd = dataOf(next[2]);
  assert.equal(kd.phone, "+65 1234");
  assert.equal(kd.submitLabel, "Send it");
  assert.equal(kd.showMap, true);
  assert.equal((kd.fields as Obj[]).length, 2);
});

test("pre-footer form: an empty second label removes only that button; untouched save is a no-op", () => {
  const stored = storedPrefooter();
  const base = prefooterFormState(stored[0], stored[2]);
  assert.deepEqual(mergePrefooterForm(stored, buildPrefooterSave(base, base, { cta: "cta-1", contact: "ct-1" }), () => "x"), stored);
  const next = mergePrefooterForm(stored, buildPrefooterSave(base, { ...base, ctaSecondaryLabel: "" }, { cta: "cta-1", contact: "ct-1" }), () => "x");
  assert.ok(!("secondaryButton" in dataOf(next[0])));
  assert.equal(dataOf(next[0]).title, "Talk to us");
});

test("pre-footer form: a removed banner is not brought back unless edited; empty pre-footer gets both blocks", () => {
  const onlyContact = [storedPrefooter()[2]];
  const base = prefooterFormState(null, onlyContact[0]);
  const next = mergePrefooterForm(onlyContact, buildPrefooterSave(base, { ...base, title: "Hello" }, { cta: null, contact: "ct-1" }), (t) => `${t}-new`);
  assert.equal(next.length, 1);
  assert.equal(dataOf(next[0]).title, "Hello");
  // The screen's first save on a site with no pre-footer marks every field changed (identity-client.tsx).
  const empty = prefooterFormState(null, null);
  const save = buildPrefooterSave(empty, { ...empty, phone: "+65 1" }, { cta: null, contact: null });
  save.cta.changed = [...CTA_FORM_FIELDS];
  save.contact.changed = [...CONTACT_FORM_FIELDS];
  const created = mergePrefooterForm([], save, (t) => `${t}-new`);
  assert.deepEqual(created.map((b) => (b as unknown as Obj).type), ["cta", "contact"]);
  assert.equal(dataOf(created[0]).title, "Ready to Start Your Journey?");
  assert.deepEqual(dataOf(created[0]).secondaryButton, { label: "WhatsApp Now", url: "" });
  assert.equal(dataOf(created[1]).phone, "+65 1");
  assert.equal((dataOf(created[1]).fields as Obj[]).length, 4);
  // A banner added later goes above the contact form.
  const withBanner = mergePrefooterForm(onlyContact, buildPrefooterSave(base, { ...base, ctaTitle: "New banner" }, { cta: null, contact: "ct-1" }), (t) => `${t}-new`);
  assert.deepEqual(withBanner.map((b) => (b as unknown as Obj).id), ["cta-new", "ct-1"]);
});
