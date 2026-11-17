/**
 * Saves of the Site Identity screen (dashboard/templates/header-footer): the
 * Site Identity fields, the Global Footer form and the Pre-Footer form.
 *
 * The two footer forms edit a few fields of blocks stored in
 * site_identity.global_footer / global_prefooter, columns that also hold
 * blocks the forms never show (a WhatsApp button, a bottom bar, a newsletter
 * strip). A save used to write one block rebuilt from the form in place of
 * the whole column, so every other block and every field the form has no
 * control for (logo image, booking strip, credit, padding, the Retail layout,
 * a CTA's own background and button colours) was lost, and a footer stored
 * after another block was overwritten by an empty one. The Site Identity save
 * wrote back the whole row as loaded, reverting header/footer changes made
 * after the page opened.
 *
 * Now each form sends the values it shows plus the fields the user changed.
 * The server reads the column fresh and writes only the changed fields onto
 * the block the form edits (found by id, else by type); every other block and
 * field stays as stored. A block the site does not have yet is added, from
 * the full form values, once the user changes one of its fields. Pure, so the
 * form, /api/identity and tests/mcp/footer-merge.test.ts share it.
 */
import type { Block } from "@/types/cms";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const same = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const isStr = (v: unknown): boolean => typeof v === "string";
const isStrOrNull = (v: unknown): boolean => v === null || typeof v === "string";
function uid(): string {
  return Math.random().toString(36).slice(2, 8);
}
const spacing = (top: number, right: number, bottom: number, left: number) => ({ top, right, bottom, left });

/** Next free `order` after the blocks a column holds (0 when it is empty). */
function nextOrder(blocks: readonly Obj[]): number {
  let max = -1;
  for (const b of blocks) if (typeof b.order === "number" && b.order > max) max = b.order;
  return max + 1;
}

/** Copy of `data` with `keys` taken from `values`; null removes the field. */
function applyFields(data: unknown, values: Obj, keys: readonly string[]): Obj {
  const out: Obj = isObj(data) ? { ...data } : {};
  for (const k of keys) {
    const v = values[k];
    if (v === null || v === undefined) delete out[k];
    else out[k] = v;
  }
  return out;
}

/** Fields of `fields` whose value differs between two snapshots. */
function diff<F extends string>(fields: readonly F[], before: Record<F, unknown>, after: Record<F, unknown>): F[] {
  return fields.filter((k) => !same(before[k], after[k]));
}

/** Form values from a request body: every field present with the right type, else null. */
function parseValues<F extends string>(input: unknown, fields: readonly F[], checks: Record<F, (v: unknown) => boolean>): { values: Record<F, unknown>; changed: F[] } | null {
  if (!isObj(input) || !isObj(input.values) || !Array.isArray(input.changed)) return null;
  const raw = input.values;
  const values = {} as Record<F, unknown>;
  for (const k of fields) {
    if (!checks[k](raw[k])) return null;
    values[k] = raw[k];
  }
  const asked = input.changed;
  return { values, changed: fields.filter((k) => asked.includes(k)) };
}

/* ------------------------------------------------------------- identity */

/**
 * site_identity columns an "identity" save on /api/identity may write: the
 * Site Identity form and the app's site settings. The rest of the row
 * (global header / footer / pre-footer, template, colours) has its own
 * screens and is never written from here.
 */
export const IDENTITY_FIELDS = ["site_name", "tagline", "logo_url", "logo_dark_url", "logo_width", "logo_alt", "logo_type", "favicon_url"] as const;
export type IdentityField = (typeof IDENTITY_FIELDS)[number];
export type IdentityPatch = Partial<Record<IdentityField, unknown>>;

/** Only the identity columns of a request body; every other key is dropped. */
export function pickIdentityFields(body: unknown): IdentityPatch {
  const out: IdentityPatch = {};
  if (!isObj(body)) return out;
  for (const k of IDENTITY_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

/** Identity fields the user changed since `baseline`; empty text and null count as the same. */
export function changedIdentityFields(baseline: IdentityPatch, current: IdentityPatch): IdentityPatch {
  const norm = (v: unknown) => (v === undefined || v === "" ? null : v);
  const out: IdentityPatch = {};
  for (const k of IDENTITY_FIELDS) {
    if (k in current && norm(current[k]) !== norm(baseline[k])) out[k] = current[k];
  }
  return out;
}

/* --------------------------------------------------------------- footer */

export type FooterStyleChoice = "dark" | "light" | "custom";
export interface FooterFormLink { id: string; label: string; url: string; [key: string]: unknown }
export interface FooterFormColumn { id: string; heading: string; links: FooterFormLink[]; [key: string]: unknown }
export interface FooterFormSocial { platform: string; url: string; [key: string]: unknown }

/** What the Global Footer form shows. Columns and links keep their other fields (text, lang). */
export interface FooterFormState {
  logoText: string;
  tagline: string;
  copyright: string;
  /** Dark / Light: colours from the theme. Custom: the background and accent pickers. */
  footerStyle: FooterStyleChoice;
  bg: string;
  accent: string;
  newsletter: boolean;
  columns: FooterFormColumn[];
  socials: FooterFormSocial[];
  bottomLinks: FooterFormLink[];
}

/** The footer block's data fields the form writes. A save never touches any other field. */
export const FOOTER_FORM_FIELDS = [
  "logoText", "tagline", "copyrightText", "style", "backgroundColor", "accentColor", "textColor",
  "showNewsletter", "columns", "socials", "bottomLinks",
] as const;
export type FooterFormField = (typeof FOOTER_FORM_FIELDS)[number];
/** Written together whenever the Footer Style choice changes. */
const FOOTER_LOOK_FIELDS: readonly FooterFormField[] = ["style", "backgroundColor", "accentColor", "textColor"];

/** Data values as the form writes them; null removes the field (theme colours). */
export type FooterFormValues = Record<FooterFormField, unknown>;
export interface FooterFormSave {
  /** Every field as the form shows it: used whole only to create a missing footer block. */
  values: FooterFormValues;
  /** Fields the user changed: the only ones written onto an existing footer block. */
  changed: FooterFormField[];
}

export const FOOTER_DEFAULT_BG = "#0f2418";
export const FOOTER_DEFAULT_ACCENT = "#c9a84c";
/** Text colour the Custom colors choice pins (light text on the custom background). */
const FOOTER_CUSTOM_TEXT = "#e5e7eb";

/** The site's footer block: the first block of type "footer", wherever it sits in global_footer. */
export function findFooterBlock<T>(blocks: readonly T[]): T | null {
  return blocks.find((b) => isObj(b) && b.type === "footer") ?? null;
}

/**
 * Form state for a stored footer block (null: the site has none, the form
 * starts empty). Columns without an id or a links list get one, so the
 * editor can address them; nothing else is changed.
 */
export function footerFormState(block: unknown, makeId: () => string = uid): FooterFormState {
  const fd: Obj = isObj(block) && isObj(block.data) ? block.data : {};
  const links = (v: unknown): FooterFormLink[] =>
    Array.isArray(v) ? v.filter(isObj).map((l) => ({ ...l, id: str(l.id) || makeId(), label: str(l.label), url: str(l.url) })) : [];
  const columns: FooterFormColumn[] = Array.isArray(fd.columns)
    ? fd.columns.filter(isObj).map((c) => ({ ...c, id: str(c.id) || makeId(), heading: str(c.heading), links: links(c.links) }))
    : [];
  const socials: FooterFormSocial[] = Array.isArray(fd.socials)
    ? fd.socials.filter(isObj).map((s) => ({ ...s, platform: str(s.platform), url: str(s.url) }))
    : [];
  return {
    logoText: str(fd.logoText),
    tagline: str(fd.tagline),
    copyright: str(fd.copyrightText),
    footerStyle: fd.backgroundColor ? "custom" : fd.style === "light" ? "light" : "dark",
    bg: str(fd.backgroundColor) || FOOTER_DEFAULT_BG,
    accent: str(fd.accentColor) || FOOTER_DEFAULT_ACCENT,
    newsletter: fd.showNewsletter === true,
    columns,
    socials,
    bottomLinks: links(fd.bottomLinks),
  };
}

/**
 * The data fields the form writes for what it shows. Dark / Light hand the
 * colours back to the theme; Custom pins them and renders as Dark, except a
 * Retail footer (`storedStyle`, the block's style when the form loaded),
 * which keeps its own layout under custom colours.
 */
export function footerFormValues(s: FooterFormState, storedStyle?: unknown): FooterFormValues {
  const look = s.footerStyle === "custom"
    ? { style: storedStyle === "retail" ? "retail" : "dark", backgroundColor: s.bg, accentColor: s.accent, textColor: FOOTER_CUSTOM_TEXT }
    : { style: s.footerStyle, backgroundColor: null, accentColor: null, textColor: null };
  return {
    logoText: s.logoText,
    tagline: s.tagline,
    copyrightText: s.copyright,
    ...look,
    showNewsletter: s.newsletter,
    columns: s.columns,
    socials: s.socials,
    bottomLinks: s.bottomLinks,
  };
}

/**
 * The save for the form: `baseline` is what it showed when it loaded (or at
 * the last save). Untouched fields are left out, so a footer edited
 * elsewhere meanwhile keeps those edits, and the style (Retail included)
 * only changes when the user picks another one.
 */
export function buildFooterSave(baseline: FooterFormState, current: FooterFormState, storedStyle?: unknown): FooterFormSave {
  const before = footerFormValues(baseline, storedStyle);
  const values = footerFormValues(current, storedStyle);
  const styleChanged = baseline.footerStyle !== current.footerStyle;
  const changed = FOOTER_FORM_FIELDS.filter((k) => !same(before[k], values[k]) || (styleChanged && FOOTER_LOOK_FIELDS.includes(k)));
  return { values, changed };
}

const isLinkList = (v: unknown) => Array.isArray(v) && v.every(isObj);
const FOOTER_CHECKS: Record<FooterFormField, (v: unknown) => boolean> = {
  logoText: isStr,
  tagline: isStr,
  copyrightText: isStr,
  style: (v) => v === "dark" || v === "light" || v === "retail" || v === "colored",
  backgroundColor: isStrOrNull,
  accentColor: isStrOrNull,
  textColor: isStrOrNull,
  showNewsletter: (v) => typeof v === "boolean",
  // The renderer maps every column's links: never store a column without them.
  columns: (v) => Array.isArray(v) && v.every((c) => isObj(c) && isLinkList(c.links)),
  socials: isLinkList,
  bottomLinks: isLinkList,
};

/** A footer save from a request body, or null when it is malformed. */
export function parseFooterFormSave(input: unknown): FooterFormSave | null {
  return parseValues(input, FOOTER_FORM_FIELDS, FOOTER_CHECKS);
}

/**
 * global_footer after a footer form save. The footer block keeps its id,
 * place, block settings (padding, background, hideOn, variant) and every data
 * field the user did not change; the column's other blocks stay as they are.
 * A site without a footer block gets one after its other blocks, once the
 * user changed something to put in it.
 */
export function mergeFooterForm(blocks: readonly Block[], save: FooterFormSave, newId: string): Block[] {
  const list = blocks as unknown as Obj[];
  const i = list.findIndex((b) => isObj(b) && b.type === "footer");
  if (i >= 0) {
    if (!save.changed.length) return [...blocks];
    return list.map((b, j) => (j === i ? { ...b, data: applyFields(b.data, save.values, save.changed) } : b)) as unknown as Block[];
  }
  if (!save.changed.length) return [...blocks];
  const created = {
    id: newId,
    type: "footer",
    order: nextOrder(list),
    visible: true,
    width: "full",
    padding: spacing(0, 0, 0, 0),
    margin: spacing(0, 0, 0, 0),
    background: { type: "none" },
    data: { copyrightYear: true, ...applyFields({}, save.values, FOOTER_FORM_FIELDS) },
  };
  return [...list, created] as unknown as Block[];
}

/* ----------------------------------------------------------- pre-footer */

/** What the Pre-Footer form shows: the CTA banner and the contact form. */
export interface PrefooterFormState {
  ctaTitle: string;
  ctaDesc: string;
  ctaPrimaryLabel: string;
  ctaPrimaryUrl: string;
  ctaSecondaryLabel: string;
  ctaSecondaryUrl: string;
  title: string;
  subtitle: string;
  phone: string;
  email: string;
  address: string;
  recipientEmail: string;
}

export const CTA_FORM_FIELDS = ["title", "description", "primaryButton", "secondaryButton"] as const;
export type CtaFormField = (typeof CTA_FORM_FIELDS)[number];
export const CONTACT_FORM_FIELDS = ["title", "subtitle", "phone", "email", "address", "recipientEmail"] as const;
export type ContactFormField = (typeof CONTACT_FORM_FIELDS)[number];

export interface PrefooterPartSave<F extends string> {
  /** Id of the block the form loaded (null: the site had none). */
  id: string | null;
  values: Record<F, unknown>;
  changed: F[];
}
export interface PrefooterFormSave {
  cta: PrefooterPartSave<CtaFormField>;
  contact: PrefooterPartSave<ContactFormField>;
}

/**
 * Form state for the stored CTA and contact blocks. The starter text only
 * fills a block the site does not have yet; an existing block shows what it
 * holds (a banner without a second button shows none).
 */
export function prefooterFormState(cta: unknown, contact: unknown): PrefooterFormState {
  const cd = isObj(cta) ? (isObj(cta.data) ? cta.data : {}) : null;
  const cc = isObj(contact) ? (isObj(contact.data) ? contact.data : {}) : null;
  const pb: Obj = cd && isObj(cd.primaryButton) ? cd.primaryButton : {};
  const sb: Obj = cd && isObj(cd.secondaryButton) ? cd.secondaryButton : {};
  return {
    ctaTitle: cd ? str(cd.title) : "Ready to Start Your Journey?",
    ctaDesc: cd ? str(cd.description) : "",
    ctaPrimaryLabel: cd ? str(pb.label) : "Free Consultation",
    ctaPrimaryUrl: cd ? str(pb.url) : "/contact",
    ctaSecondaryLabel: cd ? str(sb.label) : "WhatsApp Now",
    ctaSecondaryUrl: cd ? str(sb.url) : "",
    title: cc ? str(cc.title) : "Get In Touch",
    subtitle: cc ? str(cc.subtitle) : "",
    phone: cc ? str(cc.phone) : "",
    email: cc ? str(cc.email) : "",
    address: cc ? str(cc.address) : "",
    recipientEmail: cc ? str(cc.recipientEmail) : "",
  };
}

export function ctaFormValues(s: PrefooterFormState): Record<CtaFormField, unknown> {
  return {
    title: s.ctaTitle,
    description: s.ctaDesc,
    primaryButton: { label: s.ctaPrimaryLabel, url: s.ctaPrimaryUrl },
    // An empty label removes the second button.
    secondaryButton: s.ctaSecondaryLabel ? { label: s.ctaSecondaryLabel, url: s.ctaSecondaryUrl } : null,
  };
}

export function contactFormValues(s: PrefooterFormState): Record<ContactFormField, unknown> {
  return {
    title: s.title,
    subtitle: s.subtitle,
    phone: s.phone,
    email: s.email,
    address: s.address,
    // Submissions go to the shown email unless another address is set.
    recipientEmail: s.recipientEmail || s.email,
  };
}

/** The save for the Pre-Footer form; `baseline` as in buildFooterSave. */
export function buildPrefooterSave(baseline: PrefooterFormState, current: PrefooterFormState, ids: { cta: string | null; contact: string | null }): PrefooterFormSave {
  const cta = ctaFormValues(current);
  const contact = contactFormValues(current);
  return {
    cta: { id: ids.cta, values: cta, changed: diff(CTA_FORM_FIELDS, ctaFormValues(baseline), cta) },
    contact: { id: ids.contact, values: contact, changed: diff(CONTACT_FORM_FIELDS, contactFormValues(baseline), contact) },
  };
}

const isButton = (v: unknown) => isObj(v) && typeof v.label === "string" && typeof v.url === "string";
const CTA_CHECKS: Record<CtaFormField, (v: unknown) => boolean> = {
  title: isStr,
  description: isStr,
  primaryButton: isButton,
  secondaryButton: (v) => v === null || isButton(v),
};
const CONTACT_CHECKS: Record<ContactFormField, (v: unknown) => boolean> = {
  title: isStr, subtitle: isStr, phone: isStr, email: isStr, address: isStr, recipientEmail: isStr,
};

/** A pre-footer save from a request body, or null when it is malformed. */
export function parsePrefooterFormSave(input: unknown): PrefooterFormSave | null {
  if (!isObj(input) || !isObj(input.cta) || !isObj(input.contact)) return null;
  const idOf = (v: Obj) => (typeof v.id === "string" && v.id ? v.id : null);
  const cta = parseValues(input.cta, CTA_FORM_FIELDS, CTA_CHECKS);
  const contact = parseValues(input.contact, CONTACT_FORM_FIELDS, CONTACT_CHECKS);
  if (!cta || !contact) return null;
  return { cta: { id: idOf(input.cta), ...cta }, contact: { id: idOf(input.contact), ...contact } };
}

/** The form's block: by the id it loaded, else the first block of that type. */
function findPart(list: readonly Obj[], id: string | null, type: string): number {
  const byId = id ? list.findIndex((b) => b.type === type && b.id === id) : -1;
  return byId >= 0 ? byId : list.findIndex((b) => b.type === type);
}

/** CTA data with the changed fields; a button keeps its own colours, only label and link change. */
function applyCta(data: unknown, part: PrefooterPartSave<CtaFormField>): Obj {
  const out = applyFields(data, part.values, part.changed.filter((k) => k !== "primaryButton" && k !== "secondaryButton"));
  for (const k of ["primaryButton", "secondaryButton"] as const) {
    if (!part.changed.includes(k)) continue;
    const v = part.values[k];
    if (isObj(v)) out[k] = { ...(isObj(out[k]) ? out[k] : {}), label: v.label, url: v.url };
    else delete out[k];
  }
  return out;
}

const DEFAULT_CONTACT_FIELDS = [
  { id: "f-name", label: "Full Name", type: "text", required: true },
  { id: "f-email", label: "Email Address", type: "email", required: false },
  { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
  { id: "f-msg", label: "Message", type: "textarea", required: true },
];

/**
 * global_prefooter after a Pre-Footer form save. The CTA and contact blocks
 * keep their id, place, background, variant, padding and every field the
 * user did not change; other blocks stay as they are. A missing banner or
 * contact form is added (the banner above the contact form, with the navy
 * gradient the screen has always used) once the user changes one of its
 * fields.
 */
export function mergePrefooterForm(blocks: readonly Block[], save: PrefooterFormSave, newId: (type: "cta" | "contact") => string): Block[] {
  const list = [...(blocks as unknown as Obj[])];

  const ci = findPart(list, save.cta.id, "cta");
  if (ci >= 0) {
    if (save.cta.changed.length) list[ci] = { ...list[ci], data: applyCta(list[ci].data, save.cta) };
  } else if (save.cta.changed.length) {
    const v = save.cta.values;
    const banner = {
      id: newId("cta"),
      type: "cta",
      order: nextOrder(list),
      visible: true,
      width: "full",
      padding: spacing(0, 0, 0, 0),
      margin: spacing(0, 0, 0, 0),
      background: { type: "gradient", gradient: "linear-gradient(135deg, #1e3a8a, #0b1f4d)" },
      templateVariant: "gradient-banner",
      data: applyCta({ layout: "centered" }, { id: null, values: v, changed: [...CTA_FORM_FIELDS] }),
    };
    const at = list.findIndex((b) => b.type === "contact");
    if (at >= 0) list.splice(at, 0, banner);
    else list.push(banner);
  }

  const ki = findPart(list, save.contact.id, "contact");
  if (ki >= 0) {
    if (save.contact.changed.length) list[ki] = { ...list[ki], data: applyFields(list[ki].data, save.contact.values, save.contact.changed) };
  } else if (save.contact.changed.length) {
    list.push({
      id: newId("contact"),
      type: "contact",
      order: nextOrder(list),
      visible: true,
      width: "full",
      padding: spacing(80, 0, 80, 0),
      margin: spacing(0, 0, 0, 0),
      background: { type: "none" },
      data: {
        ...applyFields({ layout: "split", showMap: false, showContactInfo: true }, save.contact.values, CONTACT_FORM_FIELDS),
        fields: DEFAULT_CONTACT_FIELDS.map((f) => ({ ...f })),
        submitLabel: "Send Message",
        successMessage: "Thank you! We'll contact you within 24 hours.",
      },
    });
  }
  return list as unknown as Block[];
}
