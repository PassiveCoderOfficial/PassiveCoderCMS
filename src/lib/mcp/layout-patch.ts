import type { Block, NavItem } from "@/types/cms";
import { createBlock } from "@/modules/page-builder/block-registry";
import { isChromeBlock, toBlocks } from "@/lib/site/global-blocks";
import { generateId } from "@/lib/utils";
import { sanitizeCreditText, sanitizeCreditUrl } from "@/lib/site/footer-credit-shared";

/**
 * Pure edits behind the MCP site-chrome tools (get_site_layout,
 * update_site_header, update_site_footer). No database and no Next.js
 * runtime, so tests/mcp check every rule directly; the tools load the stored
 * site_identity columns, call these and write the result back.
 *
 * Headers come in two shapes and both are edited in place:
 *  - "navigation": the Nav Menu block (logo, menu, button, top bar in one block);
 *  - "builder": a header builder layout, a `container` whose columns hold the
 *    Logo / Menu / Button / Booking / Cart / Account elements (header_*).
 * Stored values may be one block object or an array (7 footers and 6 headers
 * on live sites were objects); everything is read with toBlocks and written
 * back as an array, which every reader accepts.
 */

type Data = Record<string, unknown>;
/** Loose shape for editing: generic field edits on the Block union do not type-check. Cast at the edges. */
type AnyBlock = { id: string; type: string; order?: number; visible?: boolean; data: Data; [key: string]: unknown };
type BlockLike = { id: string; type: string };
type Column = { id: string; widthPct?: number; blocks: AnyBlock[] };

export type PatchResult = { blocks: Block[]; changes: string[]; notes: string[] };

function fail(msg: string): never {
  throw new Error(msg);
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v ?? null)) as T;

/** Link rule shared with upsert_menu: https://, /, #, mailto: or tel:. */
export const LINK_RE = /^(https?:\/\/|\/|#|mailto:|tel:)/i;

export function checkLink(v: string, what: string): string {
  const u = v.trim();
  if (!u) fail(`${what}: the link is empty.`);
  if (!LINK_RE.test(u)) fail(`${what}: links must start with https://, /, #, mailto: or tel: (got "${u.slice(0, 60)}").`);
  return u;
}

/** An image address: a full http(s) link (upload_media returns one) or a site path. */
export function checkImage(v: string, what: string): string {
  const u = v.trim();
  if (!/^(https?:\/\/\S+|\/[^\s/]\S*)$/i.test(u)) fail(`${what}: use a full image address starting with https:// (upload_media returns one).`);
  return u;
}

const COLOR_RE = /^(#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([\d\s.,%/+-]+\)|var\(--[\w-]+\)|[a-z]{3,20})$/i;

/** A CSS colour as the colour pickers store it: #hex, rgb()/hsl(), a theme var or a colour name. */
export function checkColor(v: string, what: string): string {
  const c = v.trim();
  if (!COLOR_RE.test(c)) fail(`${what}: use a colour like #1a2b3c.`);
  return c;
}

/**
 * undefined: leave the key alone; null or "": remove it (back to the block's
 * default); anything else: set it. Records the label of every change.
 */
function put(d: Data, key: string, v: unknown, label: string, changes: string[]) {
  if (v === undefined) return;
  if (v === null || v === "") {
    if (key in d) { delete d[key]; changes.push(`${label} cleared`); }
    return;
  }
  if (JSON.stringify(d[key]) === JSON.stringify(v)) return;
  d[key] = v;
  changes.push(label);
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const text = (v: string | null | undefined) => (v === undefined ? undefined : v === null ? null : v.trim());
const link = (v: string | null | undefined, what: string) => (v === undefined ? undefined : v === null || !v.trim() ? null : checkLink(v, what));
const image = (v: string | null | undefined, what: string) => (v === undefined ? undefined : v === null || !v.trim() ? null : checkImage(v, what));
const color = (v: string | null | undefined, what: string) => (v === undefined ? undefined : v === null || !v.trim() ? null : checkColor(v, what));

// ── Header ───────────────────────────────────────────────────────────────

export type MenuLocation = "header" | "footer" | "footer_secondary" | "mobile" | "sidebar" | "legal";
export type ButtonStyle = "solid" | "gradient" | "outline";
export type NavStyle = "default" | "centered" | "split" | "minimal" | "logo-center" | "logo-center-inline";

export type TopBarPatch = {
  show?: boolean;
  align?: "split" | "center";
  items?: { text: string; icon?: string; url?: string; side?: "left" | "right"; hideOnMobile?: boolean }[];
  showPhone?: boolean;
  showWhatsapp?: boolean;
  whatsappLabel?: string | null;
  showSocials?: boolean;
  socialsLabel?: string | null;
  socialsBrandColors?: boolean;
  socialsStyle?: "default" | "app";
  background?: string | null;
  textColor?: string | null;
  hideOnMobile?: boolean;
  uppercase?: boolean;
  rotate?: boolean;
  rotateSeconds?: number;
  scroll?: boolean;
  scrollSeconds?: number;
  /** Google Translate language menu in the bar, in this order (needs auto_translate_enabled). */
  languages?: string[];
  languagesIcon?: "default" | "google";
  sticky?: boolean;
};

export type HeaderPatch = {
  blockId?: string;
  logo?: { text?: string | null; imageUrl?: string | null; darkImageUrl?: string | null; height?: number | null; linkUrl?: string | null; showName?: boolean; textColor?: string | null; iconUrl?: string | null; caption?: string | null };
  menu?: { location?: MenuLocation | null; items?: NavItem[]; style?: "default" | "centered" | "split" | "minimal"; textColor?: string | null; activeColor?: string | null; uppercase?: boolean };
  cta?: { show?: boolean; label?: string; url?: string; style?: ButtonStyle; color?: string | null; textColor?: string | null; hideOnTablet?: boolean };
  booking?: { show?: boolean; label?: string; url?: string; style?: ButtonStyle };
  cart?: { show?: boolean; showLabel?: boolean };
  account?: { show?: boolean; showLabel?: boolean };
  sticky?: boolean;
  transparent?: boolean;
  solidOnScroll?: boolean;
  glass?: boolean;
  style?: NavStyle;
  mobileLayout?: "default" | "centered-logo" | "menu-left" | "spaced";
  colors?: { background?: string | null; gradientTo?: string | null; text?: string | null; active?: string | null };
  shadow?: boolean;
  borderBottom?: boolean;
  topBar?: TopBarPatch;
  data?: Record<string, unknown>;
};

export type HeaderModel = "navigation" | "builder";

const PART_TYPES = ["header_logo", "header_nav", "header_cta", "header_booking", "header_cart", "header_account"] as const;
type PartType = (typeof PART_TYPES)[number];
const PART_NAMES: Record<PartType, string> = {
  header_logo: "Logo", header_nav: "Menu", header_cta: "Button", header_booking: "Booking button", header_cart: "Cart", header_account: "Account",
};

/** Patch keys only one header shape has. */
const NAV_ONLY = new Set(["logo.iconUrl", "logo.caption", "menu.uppercase", "cta.color", "cta.textColor", "cta.hideOnTablet", "style", "mobileLayout", "colors", "shadow", "borderBottom", "topBar"]);
const BUILDER_ONLY = new Set(["logo.darkImageUrl", "logo.showName", "logo.textColor", "menu.style", "booking.style", "cart.showLabel", "account.showLabel"]);
const GROUPS = new Set(["logo", "menu", "cta", "booking", "cart", "account"]);

function requestedKeys(p: object): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || k === "blockId") continue;
    if (GROUPS.has(k) && v && typeof v === "object" && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v)) if (v2 !== undefined) out.push(`${k}.${k2}`);
    } else out.push(k);
  }
  return out;
}

/** The container's columns, each column's elements in the order they render (sorted by `order`, stable). */
function columnsOf(container: AnyBlock): Column[] {
  const cols = container.data.columns;
  if (!Array.isArray(cols)) return [];
  return (cols as Column[]).map((c) => {
    c.blocks = Array.isArray(c.blocks) ? [...c.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];
    return c;
  });
}

/** True for a header builder layout: a container holding header elements. */
const isBuilderHeader = (b: BlockLike) => b.type === "container" && isChromeBlock(b as Block, "header");

/** The header block a patch edits: by id, else the first Nav Menu block or header builder layout. */
export function findHeader(blocks: BlockLike[], blockId?: string): { index: number; model: HeaderModel } {
  if (blockId) {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index < 0) fail(`No block with id "${blockId}" in the site header. Call get_site_layout for the ids.`);
    const b = blocks[index];
    if (b.type === "navigation") return { index, model: "navigation" };
    if (isBuilderHeader(b)) return { index, model: "builder" };
    fail(`Block "${blockId}" is a ${b.type} block, not the header itself (a Nav Menu block or a header builder layout).`);
  }
  const index = blocks.findIndex((b) => b.type === "navigation" || isBuilderHeader(b));
  if (index < 0) {
    fail(blocks.length
      ? `The site header has no Nav Menu block or header builder layout (it holds: ${blocks.map((b) => b.type).join(", ")}). Replace it with set_site_header (preset "nav_menu" or blocks).`
      : "This site has no header yet. Create one with set_site_header (preset \"nav_menu\" with brandText, or blocks).");
  }
  return { index, model: blocks[index].type === "navigation" ? "navigation" : "builder" };
}

type Part = { col: Column; index: number; block: AnyBlock };

function findPart(cols: Column[], type: PartType): Part | null {
  for (const col of cols) {
    const index = col.blocks.findIndex((b) => b.type === type);
    if (index >= 0) return { col, index, block: col.blocks[index] };
  }
  return null;
}

/** Where a new element goes, matching the header builder and ensureBookingChrome. */
function addPart(cols: Column[], type: PartType, changes: string[], data?: Data): AnyBlock {
  const made = createBlock(type) as unknown as AnyBlock;
  if (data) made.data = { ...made.data, ...data };
  let col: Column;
  let at: number;
  if (type === "header_logo") { col = cols[0]; at = 0; }
  else if (type === "header_nav") {
    const logo = findPart(cols, "header_logo");
    const i = logo ? cols.indexOf(logo.col) : -1;
    col = cols[Math.min(i + 1, cols.length - 1)] ?? cols[0];
    at = col === logo?.col ? logo.index + 1 : 0;
  } else if (type === "header_booking") {
    // Next to the existing button, else at the end of the last column.
    const cta = findPart(cols, "header_cta");
    col = cta?.col ?? cols[cols.length - 1];
    at = cta ? cta.index : col.blocks.length;
  } else if (type === "header_cta") {
    const booking = findPart(cols, "header_booking");
    col = booking?.col ?? cols[cols.length - 1];
    at = booking ? booking.index + 1 : col.blocks.length;
  } else { col = cols[cols.length - 1]; at = col.blocks.length; }
  col.blocks.splice(at, 0, made);
  col.blocks.forEach((b, i) => { b.order = i; });
  changes.push(`${PART_NAMES[type]} element added`);
  return made;
}

function setVisible(b: AnyBlock, show: boolean, name: string, changes: string[]) {
  if ((b.visible !== false) === show) return;
  b.visible = show;
  changes.push(`${name} ${show ? "shown" : "hidden"}`);
}

/**
 * A toggled element (Button, Booking button, Cart, Account): show true adds
 * it when missing, false hides it (kept, so it can be shown again). Without
 * show, editing a missing element adds it when `addOnEdit`.
 */
function partFor(cols: Column[], type: PartType, show: boolean | undefined, editing: boolean, addOnEdit: boolean, changes: string[], data?: Data): AnyBlock | null {
  const found = findPart(cols, type)?.block ?? null;
  if (show === false) {
    if (found) setVisible(found, false, PART_NAMES[type], changes);
    return found;
  }
  if (found) {
    if (show === true) setVisible(found, true, PART_NAMES[type], changes);
    return found;
  }
  if (show === true || (editing && addOnEdit)) return addPart(cols, type, changes, data);
  if (editing) fail(`This header has no ${PART_NAMES[type]} element. Pass show: true to add one.`);
  return null;
}

function applyBuilder(c: AnyBlock, p: HeaderPatch, changes: string[], notes: string[]) {
  const cols = columnsOf(c);
  if (!cols.length) fail("This header layout has no columns. Rebuild it in the header builder or replace it with set_site_header.");
  c.data.columns = cols;

  if (p.logo) {
    const l = p.logo;
    const logo = findPart(cols, "header_logo")?.block ?? addPart(cols, "header_logo", changes);
    put(logo.data, "text", text(l.text), "logo text", changes);
    put(logo.data, "imageUrl", image(l.imageUrl, "logo.imageUrl"), "logo image", changes);
    put(logo.data, "imageDarkUrl", image(l.darkImageUrl, "logo.darkImageUrl"), "logo image for dark backgrounds", changes);
    put(logo.data, "height", l.height, "logo height", changes);
    put(logo.data, "linkUrl", link(l.linkUrl, "logo.linkUrl"), "logo link", changes);
    if (l.showName !== undefined) put(logo.data, "showName", l.showName, "business name beside logo", changes);
    put(logo.data, "textColor", color(l.textColor, "logo.textColor"), "logo text colour", changes);
    if (l.text && !l.showName && !logo.data.showName) notes.push("The logo text shows when there is no logo image; set logo.showName true to show it beside the image.");
  }

  if (p.menu) {
    const m = p.menu;
    const nav = findPart(cols, "header_nav")?.block ?? addPart(cols, "header_nav", changes, { items: [] });
    if (m.location !== undefined) put(nav.data, "menuLocation", m.location, "menu location", changes);
    if (m.items !== undefined) put(nav.data, "items", m.items, "menu items", changes);
    put(nav.data, "style", m.style, "menu style", changes);
    put(nav.data, "textColor", color(m.textColor, "menu.textColor"), "menu text colour", changes);
    put(nav.data, "activeColor", color(m.activeColor, "menu.activeColor"), "menu active colour", changes);
  }

  if (p.cta) {
    const { show, ...edit } = p.cta;
    const editing = Object.values(edit).some((v) => v !== undefined);
    const b = partFor(cols, "header_cta", show, editing, true, changes);
    if (b) {
      if (edit.label !== undefined) put(b.data, "label", edit.label.trim(), "button label", changes);
      if (edit.url !== undefined) put(b.data, "url", checkLink(edit.url, "cta.url"), "button link", changes);
      put(b.data, "variant", edit.style, "button style", changes);
    } else if (show === false) notes.push("There was no header button to hide.");
  }

  if (p.booking) {
    const { show, ...edit } = p.booking;
    const editing = Object.values(edit).some((v) => v !== undefined);
    const had = !!findPart(cols, "header_booking");
    const b = partFor(cols, "header_booking", show, editing, true, changes);
    if (b) {
      // Marked like ensureBookingChrome does, so it never adds a second one.
      if (!had) c.data.bookingButtonAdded = true;
      if (edit.label !== undefined) put(b.data, "label", edit.label.trim(), "booking button label", changes);
      if (edit.url !== undefined) put(b.data, "url", checkLink(edit.url, "booking.url"), "booking button link", changes);
      put(b.data, "variant", edit.style, "booking button style", changes);
    } else if (show === false) notes.push("There was no booking button to hide.");
  }

  for (const [key, type] of [["cart", "header_cart"], ["account", "header_account"]] as const) {
    const t = p[key];
    if (!t) continue;
    const b = partFor(cols, type, t.show, t.showLabel !== undefined, false, changes);
    if (b && t.showLabel !== undefined) put(b.data, "showLabel", t.showLabel, `${PART_NAMES[type]} label`, changes);
  }

  if (p.sticky !== undefined) put(c.data, "sticky", p.sticky, "sticky", changes);
  if (p.transparent !== undefined) put(c.data, "transparent", p.transparent, "transparent over the hero", changes);
  if (p.solidOnScroll !== undefined) put(c.data, "scrollAware", p.solidOnScroll, "solid on scroll", changes);
  if (p.glass !== undefined) put(c.data, "glass", p.glass, "frosted glass", changes);

  if (p.data) {
    if ("columns" in p.data) fail("data.columns cannot be patched: the elements are edited through logo, menu, cta, booking, cart and account. To restructure the layout, send the whole header with set_site_header.");
    mergeData(c.data, p.data, "header", changes);
  }
}

function applyTopBar(d: Data, t: TopBarPatch, changes: string[]) {
  const had = !!d.topBar && typeof d.topBar === "object";
  const bar = (had ? d.topBar : { show: true, items: [] }) as Data;
  if (!Array.isArray(bar.items)) bar.items = [];
  if (!had) changes.push("top bar added");
  for (const k of ["show", "showPhone", "showWhatsapp", "showSocials", "socialsBrandColors", "hideOnMobile", "uppercase", "rotate", "scroll"] as const) {
    if (t[k] !== undefined) put(bar, k, t[k], `top bar ${k}`, changes);
  }
  if (t.scroll === true) delete bar.rotate; // the header builder turns rotation off with the ticker
  put(bar, "rotateSeconds", t.rotateSeconds, "top bar rotation speed", changes);
  put(bar, "scrollSeconds", t.scrollSeconds, "top bar ticker speed", changes);
  if (t.languages !== undefined) put(bar, "languages", t.languages.length ? t.languages : null, "top bar language menu", changes);
  put(bar, "languagesIcon", t.languagesIcon, "top bar language icon", changes);
  put(bar, "align", t.align, "top bar layout", changes);
  put(bar, "socialsStyle", t.socialsStyle, "top bar social icon style", changes);
  put(bar, "whatsappLabel", text(t.whatsappLabel), "top bar WhatsApp text", changes);
  put(bar, "socialsLabel", text(t.socialsLabel), "top bar social label", changes);
  put(bar, "background", color(t.background, "topBar.background"), "top bar background", changes);
  put(bar, "textColor", color(t.textColor, "topBar.textColor"), "top bar text colour", changes);
  if (t.items) {
    bar.items = t.items.map((it, i) => ({
      id: generateId(),
      text: it.text.trim() || fail(`topBar.items[${i}]: text is empty`),
      ...(it.icon ? { icon: it.icon } : {}),
      ...(it.url ? { url: checkLink(it.url, `topBar.items[${i}].url`) } : {}),
      side: it.side ?? "left",
      ...(it.hideOnMobile ? { hideOnMobile: true } : {}),
    }));
    changes.push("top bar items");
  }
  if (t.sticky !== undefined) put(d, "stickyTopBar", t.sticky, "top bar stays visible", changes);
  d.topBar = bar;
}

function applyNav(b: AnyBlock, p: HeaderPatch, changes: string[], notes: string[]) {
  const d = b.data;
  if (p.logo) {
    const l = p.logo;
    put(d, "logoText", text(l.text), "logo text", changes);
    put(d, "logo", image(l.imageUrl, "logo.imageUrl"), "logo image", changes);
    put(d, "logoHeight", l.height, "logo height", changes);
    put(d, "logoUrl", link(l.linkUrl, "logo.linkUrl"), "logo link", changes);
    put(d, "logoIconUrl", image(l.iconUrl, "logo.iconUrl"), "logo icon", changes);
    put(d, "logoCaption", text(l.caption), "logo caption", changes);
  }
  if (p.menu) {
    const m = p.menu;
    if (m.location !== undefined) put(d, "menuLocation", m.location, "menu location", changes);
    if (m.items !== undefined) put(d, "items", m.items, "menu items", changes);
    if (m.uppercase !== undefined) put(d, "menuUppercase", m.uppercase || null, "upper-case menu", changes);
    put(d, "textColor", color(m.textColor, "menu.textColor"), "text colour", changes);
    put(d, "activeColor", color(m.activeColor, "menu.activeColor"), "active link colour", changes);
  }
  if (p.cta) {
    const c = p.cta;
    if (c.show !== undefined) put(d, "showCta", c.show, "header button", changes);
    if (c.label !== undefined) put(d, "ctaLabel", c.label.trim(), "button label", changes);
    if (c.url !== undefined) put(d, "ctaUrl", checkLink(c.url, "cta.url"), "button link", changes);
    // ctaVariant is what the Nav Menu renders (default gradient).
    put(d, "ctaVariant", c.style, "button style", changes);
    put(d, "ctaColor", color(c.color, "cta.color"), "button colour", changes);
    put(d, "ctaTextColor", color(c.textColor, "cta.textColor"), "button text colour", changes);
    if (c.hideOnTablet !== undefined) put(d, "hideCtaOnTablet", c.hideOnTablet || null, "hide button on tablets", changes);
    if (d.showCta && !(str(d.ctaLabel) && str(d.ctaUrl))) fail("The header button needs cta.label and cta.url to show.");
  }
  if (p.booking) {
    const k = p.booking;
    if (k.show !== undefined) put(d, "showBooking", k.show, "booking button", changes);
    if (k.label !== undefined) put(d, "bookingLabel", k.label.trim(), "booking button label", changes);
    if (k.url !== undefined) put(d, "bookingUrl", checkLink(k.url, "booking.url"), "booking button link", changes);
  }
  if (p.cart?.show !== undefined) put(d, "showCart", p.cart.show, "cart icon", changes);
  if (p.account?.show !== undefined) {
    put(d, "showAccount", p.account.show, "account icon", changes);
    if (p.account.show && d.style !== "logo-center" && !d.mobileLayout) notes.push("The Nav Menu shows the account icon in the \"logo-center\" style and in the phone layouts (mobileLayout).");
  }
  if (p.sticky !== undefined) put(d, "sticky", p.sticky, "sticky", changes);
  if (p.transparent !== undefined) put(d, "transparent", p.transparent, "transparent over the hero", changes);
  if (p.solidOnScroll !== undefined) put(d, "scrollAware", p.solidOnScroll, "solid on scroll", changes);
  if (p.glass !== undefined) put(d, "glass", p.glass, "frosted glass", changes);
  put(d, "style", p.style, "header style", changes);
  if (p.mobileLayout !== undefined) put(d, "mobileLayout", p.mobileLayout === "default" ? null : p.mobileLayout, "phone header layout", changes);
  if (p.colors) {
    put(d, "backgroundColor", color(p.colors.background, "colors.background"), "background colour", changes);
    put(d, "backgroundGradientTo", color(p.colors.gradientTo, "colors.gradientTo"), "background gradient", changes);
    put(d, "textColor", color(p.colors.text, "colors.text"), "text colour", changes);
    put(d, "activeColor", color(p.colors.active, "colors.active"), "active link colour", changes);
  }
  if (p.shadow !== undefined) put(d, "shadow", p.shadow, "shadow", changes);
  if (p.borderBottom !== undefined) put(d, "borderBottom", p.borderBottom, "bottom border", changes);
  if (p.topBar) applyTopBar(d, p.topBar, changes);
  if (p.data) mergeData(d, p.data, "header", changes);
  if (!Array.isArray(d.items)) d.items = [];
}

/** Shallow merge of extra fields: null removes a key. Block identity keys stay. */
function mergeData(d: Data, extra: Record<string, unknown>, what: string, changes: string[]) {
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined) continue;
    if (v === null) { if (k in d) { delete d[k]; changes.push(`${what} data.${k} cleared`); } continue; }
    if (JSON.stringify(d[k]) === JSON.stringify(v)) continue;
    d[k] = v;
    changes.push(`${what} data.${k}`);
  }
}

/** Apply a PATCH to the stored site header (either shape). Throws on anything it cannot apply, so nothing half-done is saved. */
export function applyHeaderPatch(stored: unknown, p: HeaderPatch): PatchResult & { model: HeaderModel; blockId: string } {
  const blocks = clone(toBlocks(stored)) as unknown as AnyBlock[];
  const { index, model } = findHeader(blocks, p.blockId);
  const asked = requestedKeys(p);
  if (!asked.length) fail("Nothing to change. Pass at least one field (see the tool description).");
  const wrongShape = asked.filter((k) => (model === "builder" ? NAV_ONLY : BUILDER_ONLY).has(k));
  if (wrongShape.length) {
    fail(model === "builder"
      ? `Not saved: ${wrongShape.join(", ")} only exist on the Nav Menu header. This site's header is a header builder layout (Logo, Menu, Button elements), which supports logo (text, imageUrl, darkImageUrl, height, linkUrl, showName, textColor), menu (location, items, style, textColor, activeColor), cta, booking, cart, account, sticky, transparent, solidOnScroll, glass and data.`
      : `Not saved: ${wrongShape.join(", ")} only exist on header builder layouts. This site's header is the Nav Menu block, which supports logo (text, imageUrl, height, linkUrl, iconUrl, caption), menu (location, items, uppercase, textColor, activeColor), cta (show, label, url, style, color, textColor, hideOnTablet), booking (show, label, url), cart.show, account.show, sticky, transparent, solidOnScroll, glass, style, mobileLayout, colors, shadow, borderBottom, topBar and data.`);
  }
  const changes: string[] = [];
  const notes: string[] = [];
  const block = blocks[index];
  if (!block.data || typeof block.data !== "object") block.data = {};
  if (model === "builder") applyBuilder(block, p, changes, notes);
  else applyNav(block, p, changes, notes);
  // Top-level `order` values are kept: the renderer sorts by them.
  return { blocks: blocks as unknown as Block[], changes, notes, model, blockId: block.id };
}

// ── Footer ───────────────────────────────────────────────────────────────

export type LinkIn = { label: string; url: string; lang?: string };
/** A column or link: its id, its heading/label (case-insensitive), or its 1-based position. */
export type Ref = string | number;

export type ColumnOp =
  | { op: "add"; heading: string; text?: string; links?: LinkIn[]; position?: number }
  | { op: "update"; column: Ref; heading?: string; text?: string | null }
  | { op: "remove"; column: Ref }
  | { op: "move"; column: Ref; to: number }
  | { op: "add_link"; column: Ref; label: string; url: string; lang?: string; position?: number }
  | { op: "update_link"; column: Ref; link: Ref; label?: string; url?: string; lang?: string | null }
  | { op: "remove_link"; column: Ref; link: Ref }
  | { op: "move_link"; column: Ref; link: Ref; to: number };

export type LinkOp =
  | { op: "add"; label: string; url: string; lang?: string; position?: number }
  | { op: "update"; link: Ref; label?: string; url?: string; lang?: string | null }
  | { op: "remove"; link: Ref }
  | { op: "move"; link: Ref; to: number };

export type SocialPlatform = "facebook" | "instagram" | "twitter" | "linkedin" | "youtube" | "tiktok" | "whatsapp" | "snapchat";

export type FooterPatch = {
  blockId?: string;
  logoText?: string | null;
  logoImage?: string | null;
  logoIcon?: string | null;
  logoLink?: string | null;
  caption?: string | null;
  tagline?: string | null;
  autoLightLogo?: boolean;
  logoPlate?: boolean;
  wordmark?: boolean;
  largeTapTargets?: boolean;
  style?: "dark" | "light" | "colored" | "retail";
  /** null: back to the theme's colours. */
  colors?: { background?: string | null; text?: string | null; accent?: string | null } | null;
  copyright?: { text?: string | null; showYear?: boolean };
  newsletter?: { show?: boolean; label?: string | null; placeholder?: string | null };
  booking?: { show?: boolean; title?: string | null; text?: string | null; label?: string | null; url?: string | null };
  socials?: { useBusinessProfile?: boolean; links?: { platform: SocialPlatform; url: string }[]; heading?: string | null; brandColors?: boolean };
  columns?: ColumnOp[];
  bottomLinks?: LinkOp[];
  credit?: { show?: boolean; text?: string | null; url?: string | null };
  paymentImage?: string | null;
  bottomNote?: string | null;
  data?: Record<string, unknown>;
};

type FLink = { id: string; label: string; url: string; lang?: string };
type FColumn = { id: string; heading: string; links: FLink[]; text?: string };

export function findFooter(blocks: BlockLike[], blockId?: string): number {
  if (blockId) {
    const i = blocks.findIndex((b) => b.id === blockId);
    if (i < 0) fail(`No block with id "${blockId}" in the site footer. Call get_site_layout for the ids.`);
    if (blocks[i].type !== "footer") fail(`Block "${blockId}" is a ${blocks[i].type} block, not the Footer Columns block.`);
    return i;
  }
  const i = blocks.findIndex((b) => b.type === "footer");
  if (i < 0) {
    fail(blocks.length
      ? `The site footer has no Footer Columns block (it holds: ${blocks.map((b) => b.type).join(", ")}). Add one with set_site_header area "footer" (start from get_block_template type "footer").`
      : "This site has no footer yet. Create one with set_site_header area \"footer\" (start from get_block_template type \"footer\").");
  }
  return i;
}

function pick<T extends { id: string }>(list: T[], ref: Ref, name: (x: T) => string, what: string): number {
  if (typeof ref === "number") {
    if (!Number.isInteger(ref) || ref < 1 || ref > list.length) fail(`${what} ${ref} does not exist (there are ${list.length}).`);
    return ref - 1;
  }
  const byId = list.findIndex((x) => x.id === ref);
  if (byId >= 0) return byId;
  const key = ref.trim().toLowerCase();
  const hits = list.map((x, i) => (name(x).trim().toLowerCase() === key ? i : -1)).filter((i) => i >= 0);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) fail(`${hits.length} ${what}s are called "${ref}". Use the id from get_site_layout.`);
  return fail(`No ${what} "${ref}". Current: ${list.map((x, i) => `${i + 1}. ${name(x) || "(no name)"} [${x.id}]`).join("; ") || "none"}.`);
}

function moveTo<T>(list: T[], from: number, to: number, what: string) {
  if (!Number.isInteger(to) || to < 1 || to > list.length) fail(`${what}: "to" must be a position from 1 to ${list.length}.`);
  const [x] = list.splice(from, 1);
  list.splice(to - 1, 0, x);
}

function insertAt<T>(list: T[], item: T, position: number | undefined) {
  if (position === undefined) { list.push(item); return; }
  if (!Number.isInteger(position) || position < 1 || position > list.length + 1) fail(`position must be from 1 to ${list.length + 1}.`);
  list.splice(position - 1, 0, item);
}

const newLink = (l: LinkIn, what: string): FLink => ({
  id: generateId(),
  label: l.label.trim() || fail(`${what}: the label is empty.`),
  url: checkLink(l.url, what),
  ...(str(l.lang) ? { lang: str(l.lang)! } : {}),
});

function editLink(l: FLink, e: { label?: string; url?: string; lang?: string | null }, what: string) {
  if (e.label !== undefined) l.label = e.label.trim() || fail(`${what}: the label is empty.`);
  if (e.url !== undefined) l.url = checkLink(e.url, what);
  if (e.lang !== undefined) { if (str(e.lang)) l.lang = str(e.lang)!; else delete l.lang; }
}

function applyColumnOps(d: Data, ops: ColumnOp[], changes: string[]) {
  const cols = (Array.isArray(d.columns) ? d.columns : []) as FColumn[];
  for (const c of cols) if (!Array.isArray(c.links)) c.links = [];
  const colName = (c: FColumn) => c.heading ?? "";
  const linkName = (l: FLink) => l.label ?? "";
  ops.forEach((o, n) => {
    const what = `columns[${n}] (${o.op})`;
    if (o.op === "add") {
      const col: FColumn = { id: generateId(), heading: o.heading.trim() || fail(`${what}: the heading is empty.`), links: (o.links ?? []).map((l, i) => newLink(l, `${what} links[${i}]`)), ...(str(o.text) ? { text: o.text!.trim() } : {}) };
      insertAt(cols, col, o.position);
      changes.push(`column "${col.heading}" added`);
      return;
    }
    const ci = pick(cols, o.column, colName, "column");
    const col = cols[ci];
    switch (o.op) {
      case "update":
        if (o.heading !== undefined) col.heading = o.heading.trim() || fail(`${what}: the heading is empty.`);
        if (o.text !== undefined) { if (str(o.text)) col.text = o.text!.trim(); else delete col.text; }
        changes.push(`column "${col.heading}" updated`);
        break;
      case "remove":
        cols.splice(ci, 1);
        changes.push(`column "${col.heading}" removed`);
        break;
      case "move":
        moveTo(cols, ci, o.to, what);
        changes.push(`column "${col.heading}" moved to ${o.to}`);
        break;
      case "add_link": {
        const l = newLink(o, what);
        insertAt(col.links, l, o.position);
        changes.push(`link "${l.label}" added to "${col.heading}"`);
        break;
      }
      case "update_link": {
        const l = col.links[pick(col.links, o.link, linkName, `link in "${col.heading}"`)];
        editLink(l, o, what);
        changes.push(`link "${l.label}" in "${col.heading}" updated`);
        break;
      }
      case "remove_link": {
        const li = pick(col.links, o.link, linkName, `link in "${col.heading}"`);
        const [l] = col.links.splice(li, 1);
        changes.push(`link "${l.label}" removed from "${col.heading}"`);
        break;
      }
      case "move_link": {
        const li = pick(col.links, o.link, linkName, `link in "${col.heading}"`);
        const l = col.links[li];
        moveTo(col.links, li, o.to, what);
        changes.push(`link "${l.label}" in "${col.heading}" moved to ${o.to}`);
        break;
      }
    }
  });
  d.columns = cols;
}

function applyLinkOps(d: Data, ops: LinkOp[], changes: string[]) {
  const links = (Array.isArray(d.bottomLinks) ? d.bottomLinks : []) as FLink[];
  const name = (l: FLink) => l.label ?? "";
  ops.forEach((o, n) => {
    const what = `bottomLinks[${n}] (${o.op})`;
    if (o.op === "add") {
      const l = newLink(o, what);
      insertAt(links, l, o.position);
      changes.push(`bottom link "${l.label}" added`);
      return;
    }
    const i = pick(links, o.link, name, "bottom link");
    const l = links[i];
    if (o.op === "update") { editLink(l, o, what); changes.push(`bottom link "${l.label}" updated`); }
    else if (o.op === "remove") { links.splice(i, 1); changes.push(`bottom link "${l.label}" removed`); }
    else { moveTo(links, i, o.to, what); changes.push(`bottom link "${l.label}" moved to ${o.to}`); }
  });
  d.bottomLinks = links;
}

const SOCIAL_URL = /^https?:\/\//i;

/**
 * Apply a PATCH to the stored site footer's Footer Columns block. The credit
 * ("Powered by") follows set_site_header's plan rule: changed only when
 * `creditEditable` (Pro, Biz, Custom, white-label), otherwise left as it is
 * with a note.
 */
export function applyFooterPatch(stored: unknown, p: FooterPatch, opts: { creditEditable: boolean }): PatchResult & { blockId: string } {
  const blocks = clone(toBlocks(stored)) as unknown as AnyBlock[];
  const index = findFooter(blocks, p.blockId);
  const asked = requestedKeys(p);
  if (!asked.length) fail("Nothing to change. Pass at least one field (see the tool description).");
  const b = blocks[index];
  if (!b.data || typeof b.data !== "object") b.data = { columns: [] };
  const d = b.data;
  const changes: string[] = [];
  const notes: string[] = [];

  put(d, "logoText", text(p.logoText), "logo text", changes);
  put(d, "logo", image(p.logoImage, "logoImage"), "logo image", changes);
  put(d, "logoIconUrl", image(p.logoIcon, "logoIcon"), "logo icon", changes);
  put(d, "logoUrl", link(p.logoLink, "logoLink"), "logo link", changes);
  put(d, "logoCaption", text(p.caption), "logo caption", changes);
  put(d, "tagline", text(p.tagline), "tagline", changes);
  for (const k of ["autoLightLogo", "logoPlate", "wordmark", "largeTapTargets"] as const) {
    if (p[k] !== undefined) put(d, k, p[k] || null, k, changes);
  }
  put(d, "style", p.style, "footer style", changes);
  if (p.colors === null) {
    for (const k of ["backgroundColor", "textColor", "accentColor"]) if (k in d) { delete d[k]; changes.push(`${k} cleared (theme colours)`); }
  } else if (p.colors) {
    put(d, "backgroundColor", color(p.colors.background, "colors.background"), "background colour", changes);
    put(d, "textColor", color(p.colors.text, "colors.text"), "text colour", changes);
    put(d, "accentColor", color(p.colors.accent, "colors.accent"), "accent / heading colour", changes);
  }
  if (p.copyright) {
    put(d, "copyrightText", text(p.copyright.text), "copyright text", changes);
    if (p.copyright.showYear !== undefined) put(d, "copyrightYear", p.copyright.showYear, "automatic year", changes);
  }
  if (p.newsletter) {
    if (p.newsletter.show !== undefined) put(d, "showNewsletter", p.newsletter.show, "newsletter signup", changes);
    put(d, "newsletterLabel", text(p.newsletter.label), "newsletter label", changes);
    put(d, "newsletterPlaceholder", text(p.newsletter.placeholder), "newsletter placeholder", changes);
  }
  if (p.booking) {
    if (p.booking.show !== undefined) put(d, "showBooking", p.booking.show, "booking section", changes);
    put(d, "bookingTitle", text(p.booking.title), "booking title", changes);
    put(d, "bookingText", text(p.booking.text), "booking text", changes);
    put(d, "bookingLabel", text(p.booking.label), "booking button label", changes);
    put(d, "bookingUrl", link(p.booking.url, "booking.url"), "booking page", changes);
  }
  if (p.socials) {
    const s = p.socials;
    if (s.useBusinessProfile !== undefined) put(d, "showSocials", s.useBusinessProfile, "social icons from the business profile", changes);
    if (s.links) {
      d.socials = s.links.map((l, i) => {
        const url = l.url.trim();
        if (url && !SOCIAL_URL.test(url)) fail(`socials.links[${i}]: links must start with https://`);
        return { platform: l.platform, url };
      });
      changes.push("social links");
    }
    put(d, "followTitle", text(s.heading), "social heading", changes);
    if (s.brandColors !== undefined) put(d, "socialBrandColors", s.brandColors, "social brand colours", changes);
  }
  if (p.columns?.length) applyColumnOps(d, p.columns, changes);
  if (p.bottomLinks?.length) applyLinkOps(d, p.bottomLinks, changes);
  put(d, "paymentImage", image(p.paymentImage, "paymentImage"), "payment logos image", changes);
  put(d, "bottomNote", text(p.bottomNote), "bottom note", changes);

  if (p.credit) {
    if (!opts.creditEditable) {
      if (asked.every((k) => k.startsWith("credit"))) fail("Not changed: the footer credit can only be hidden or changed on Pro, Biz and Custom plans (or by the site's web partner). Upgrade the site to change it.");
      notes.push("The footer credit is locked on this plan (Basic/trial): credit was left as it is. Upgrade to Pro to hide or change it.");
    } else {
      const c = p.credit;
      const cur = { ...((d.credit as Data | undefined) ?? {}) };
      if (c.show === false) cur.show = false;
      else if (c.show === true) delete cur.show;
      if (c.text !== undefined) { const t = sanitizeCreditText(c.text); if (t) cur.text = t; else delete cur.text; }
      if (c.url !== undefined) {
        if (c.url === null || !c.url.trim()) delete cur.url;
        else cur.url = sanitizeCreditUrl(c.url) || fail("credit.url must be an http:// or https:// link.");
      }
      if (Object.keys(cur).length) d.credit = cur; else delete d.credit;
      changes.push("footer credit");
    }
  }
  if (p.data) mergeData(d, p.data, "footer", changes);
  if (!Array.isArray(d.columns)) d.columns = [];
  return { blocks: blocks as unknown as Block[], changes, notes, blockId: b.id };
}

// ── Pre-footer ───────────────────────────────────────────────────────────

export type ButtonIn = { label?: string; url?: string };
export type PrefooterPatch = {
  /** Hide or show the whole pre-footer (kept, so it can be shown again). */
  show?: boolean;
  cta?: { title?: string; description?: string | null; primaryButton?: ButtonIn; secondaryButton?: ButtonIn | null };
  contact?: { title?: string; subtitle?: string | null; phone?: string | null; email?: string | null; address?: string | null; recipientEmail?: string | null; showMap?: boolean; hideForm?: boolean };
};

function button(cur: unknown, b: ButtonIn, what: string): { label: string; url: string } {
  const c = (cur && typeof cur === "object" ? cur : {}) as { label?: string; url?: string };
  const label = (b.label ?? c.label ?? "").trim();
  const url = b.url !== undefined ? b.url : c.url ?? "";
  if (!label) fail(`${what}: give a label.`);
  return { label, url: checkLink(url, what) };
}

/**
 * Pre-footer (site_identity.global_prefooter, shown above the footer on every
 * page without its own contact form): edit its Action Banner and Contact
 * Form, or hide/show it. Missing blocks are created the way the Pre-Footer
 * screen creates them.
 */
export function applyPrefooterPatch(stored: unknown, p: PrefooterPatch): PatchResult {
  const blocks = clone(toBlocks(stored)) as unknown as AnyBlock[];
  const changes: string[] = [];
  const notes: string[] = [];
  if (p.show === undefined && !p.cta && !p.contact) fail("Nothing to change in the pre-footer.");

  if (p.cta) {
    let b = blocks.find((x) => x.type === "cta");
    if (!b) {
      if (!p.cta.title?.trim() || !p.cta.primaryButton) fail("This site has no pre-footer banner yet: give cta.title and cta.primaryButton { label, url } to add one.");
      // Same banner the Pre-Footer screen saves.
      b = {
        ...(createBlock("cta") as unknown as AnyBlock),
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        background: { type: "gradient", gradient: "linear-gradient(135deg, #1e3a8a, #0b1f4d)" },
        templateVariant: "gradient-banner",
        data: { title: "", description: "", layout: "centered" },
      } as AnyBlock;
      blocks.unshift(b);
      changes.push("pre-footer banner added");
    }
    const d = b.data;
    if (p.cta.title !== undefined) d.title = p.cta.title.trim() || fail("cta.title is empty.");
    if (p.cta.description !== undefined) d.description = p.cta.description?.trim() ?? "";
    if (p.cta.primaryButton) d.primaryButton = button(d.primaryButton, p.cta.primaryButton, "cta.primaryButton");
    if (p.cta.secondaryButton === null) delete d.secondaryButton;
    else if (p.cta.secondaryButton) d.secondaryButton = button(d.secondaryButton, p.cta.secondaryButton, "cta.secondaryButton");
    changes.push("pre-footer banner");
  }

  if (p.contact) {
    let b = blocks.find((x) => x.type === "contact");
    if (!b) {
      if (!p.contact.title?.trim()) fail("This site has no pre-footer contact form yet: give contact.title to add one.");
      // Same form the Pre-Footer screen saves.
      b = {
        ...(createBlock("contact") as unknown as AnyBlock),
        padding: { top: 80, right: 0, bottom: 80, left: 0 },
        background: { type: "none" },
        data: {
          title: "", subtitle: "", layout: "split", showMap: false, showContactInfo: true,
          fields: [
            { id: "f-name", label: "Full Name", type: "text", required: true },
            { id: "f-email", label: "Email Address", type: "email", required: false },
            { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
            { id: "f-msg", label: "Message", type: "textarea", required: true },
          ],
          submitLabel: "Send Message",
          successMessage: "Thank you! We'll contact you within 24 hours.",
        },
      } as AnyBlock;
      blocks.push(b);
      changes.push("pre-footer contact form added");
    }
    const d = b.data;
    const c = p.contact;
    if (c.title !== undefined) d.title = c.title.trim() || fail("contact.title is empty.");
    for (const k of ["subtitle", "phone", "address"] as const) if (c[k] !== undefined) d[k] = c[k]?.trim() ?? "";
    if (c.email !== undefined) {
      const e = c.email?.trim() ?? "";
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail("contact.email is not an email address.");
      d.email = e;
    }
    if (c.recipientEmail !== undefined) {
      const e = c.recipientEmail?.trim() ?? "";
      if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail("contact.recipientEmail is not an email address.");
      d.recipientEmail = e || (d.email as string) || "";
    }
    if (c.showMap !== undefined) d.showMap = c.showMap;
    if (c.hideForm !== undefined) { if (c.hideForm) d.hideForm = true; else delete d.hideForm; }
    changes.push("pre-footer contact form");
  }

  if (p.show !== undefined) {
    if (!blocks.length) fail("This site has no pre-footer to show or hide. Give cta or contact fields to create one.");
    for (const b of blocks) b.visible = p.show;
    changes.push(p.show ? "pre-footer shown" : "pre-footer hidden");
  }
  return { blocks: blocks.map((x, i) => ({ ...x, order: i })) as unknown as Block[], changes, notes };
}

// ── Summaries (get_site_layout) ──────────────────────────────────────────

export type MenuInfo = { name: string; items: { label: string; url: string; children?: unknown[] }[] };

const btn = (label: unknown, url: unknown) => `"${String(label ?? "")}" -> ${String(url ?? "")}`;
const yes = (v: unknown) => (v ? "on" : "off");

function menuText(location: unknown, items: unknown, menus: Record<string, MenuInfo>): string {
  if (typeof location === "string" && location) {
    const m = menus[location];
    return m
      ? `the "${m.name}" menu at location "${location}" (${m.items.length} items: ${m.items.map((i) => i.label).slice(0, 8).join(", ")}${m.items.length > 8 ? ", ..." : ""}; edit it with upsert_menu)`
      : `the menu at location "${location}" (no menu is assigned there yet, so the ${Array.isArray(items) ? items.length : 0} inline items show)`;
  }
  const list = Array.isArray(items) ? (items as NavItem[]) : [];
  return `${list.length} inline items (${list.map((i) => i.label).slice(0, 8).join(", ")}${list.length > 8 ? ", ..." : ""})`;
}

export function summarizeHeader(stored: unknown, menus: Record<string, MenuInfo>): { model: HeaderModel | null; blockId: string | null; text: string } {
  const blocks = toBlocks(stored);
  if (!blocks.length) return { model: null, blockId: null, text: "No site header saved (pages show their own header, if any)." };
  let found: { index: number; model: HeaderModel };
  try { found = findHeader(blocks); } catch (e) { return { model: null, blockId: null, text: (e as Error).message }; }
  const b = blocks[found.index] as unknown as AnyBlock;
  const d = b.data ?? {};
  const others = blocks.filter((_, i) => i !== found.index).map((x) => x.type);
  const extra = others.length ? ` Other blocks in the header area: ${others.join(", ")}.` : "";
  if (found.model === "navigation") {
    const lines = [
      `Nav Menu header (block ${b.id}, style "${String(d.style ?? "default")}"${d.mobileLayout ? `, phone layout "${String(d.mobileLayout)}"` : ""}).`,
      `Logo: ${d.logo ? `image ${String(d.logo)}` : "the site logo from Site Identity (else the logo text)"}; logo text "${String(d.logoText ?? "")}"${d.logoHeight ? `, height ${String(d.logoHeight)}px` : ""}.`,
      `Menu: ${menuText(d.menuLocation, d.items, menus)}.`,
      `Button: ${d.showCta ? btn(d.ctaLabel, d.ctaUrl) : "off"}. Booking button: ${d.showBooking ? btn(d.bookingLabel || "Book now", d.bookingUrl || "/book") : "off"}. Cart icon: ${d.showCart === false ? "off" : "on"}. Account icon: ${yes(d.showAccount)}.`,
      `Sticky: ${yes(d.sticky)}; transparent over the hero: ${yes(d.transparent)}; solid on scroll: ${yes(d.scrollAware)}.`,
    ];
    const bar = d.topBar as Data | undefined;
    if (bar && bar.show !== false) lines.push(`Top bar: on (${Array.isArray(bar.items) ? bar.items.length : 0} items; phone ${bar.showPhone === false ? "off" : "on"}, WhatsApp ${bar.showWhatsapp === false ? "off" : "on"}, social icons ${yes(bar.showSocials)}).`);
    else lines.push("Top bar: off.");
    return { model: "navigation", blockId: b.id, text: lines.join(" ") + extra };
  }
  const cols = columnsOf(clone(b));
  const part = (t: PartType) => findPart(cols, t)?.block;
  const shown = (x?: AnyBlock) => !!x && x.visible !== false;
  const logo = part("header_logo"), nav = part("header_nav"), cta = part("header_cta"), booking = part("header_booking"), cart = part("header_cart"), account = part("header_account");
  const lines = [
    `Header builder layout (container ${b.id}) with ${cols.length} columns: ${cols.map((c) => c.blocks.map((x) => `${PART_NAMES[x.type as PartType] ?? x.type}${x.visible === false ? " (hidden)" : ""}`).join(" + ") || "(empty)").join(" | ")}.`,
    `Logo: ${logo ? `${logo.data.imageUrl ? `image ${String(logo.data.imageUrl)}` : "the site logo from Site Identity"}${logo.data.text ? `; text "${String(logo.data.text)}"` : ""}${logo.data.showName ? " (shown beside the logo)" : ""}` : "none"}.`,
    `Menu: ${nav ? menuText(nav.data.menuLocation, nav.data.items, menus) : "none"}.`,
    `Button: ${shown(cta) ? btn(cta!.data.label, cta!.data.url) : cta ? "hidden" : "none"}. Booking button: ${shown(booking) ? btn(booking!.data.label, booking!.data.url) : booking ? "hidden" : "none"}. Cart: ${shown(cart) ? "on" : "off"}. Account: ${shown(account) ? "on" : "off"}.`,
    `Sticky: ${yes(d.sticky)}; transparent over the hero: ${yes(d.transparent)}; solid on scroll: ${yes(d.scrollAware)}.`,
  ];
  return { model: "builder", blockId: b.id, text: lines.join(" ") + extra };
}

export function summarizeFooter(stored: unknown, credit: { editable: boolean; text: string }): { blockId: string | null; text: string } {
  const blocks = toBlocks(stored);
  if (!blocks.length) return { blockId: null, text: "No site footer saved (pages show their own footer, if any)." };
  const i = blocks.findIndex((b) => b.type === "footer");
  const others = blocks.filter((b, j) => j !== i).map((b) => b.type);
  const extra = others.length ? ` Other blocks in the footer area: ${others.join(", ")}.` : "";
  if (i < 0) return { blockId: null, text: `No Footer Columns block; the footer area holds: ${blocks.map((b) => b.type).join(", ")}.` };
  const b = blocks[i] as unknown as AnyBlock;
  const d = b.data ?? {};
  const cols = (Array.isArray(d.columns) ? d.columns : []) as FColumn[];
  const socials = (Array.isArray(d.socials) ? d.socials : []) as { platform: string }[];
  const saved = (d.credit ?? null) as { show?: boolean; text?: string; url?: string } | null;
  const creditText = !credit.editable
    ? `"${credit.text}" (locked on this plan)`
    : saved?.show === false ? "hidden" : saved?.text || saved?.url ? `"${saved.text ?? credit.text}"${saved.url ? ` -> ${saved.url}` : ""}` : `"${credit.text}" (default)`;
  const lines = [
    `Footer Columns block (${b.id}, style "${String(d.style ?? "dark")}", ${d.backgroundColor || d.textColor || d.accentColor ? `custom colours: ${[["background", d.backgroundColor], ["text", d.textColor], ["accent", d.accentColor]].filter(([, v]) => v).map(([k, v]) => `${k} ${String(v)}`).join(", ")}` : "theme colours"}).`,
    `Logo text "${String(d.logoText ?? "")}"${d.logo ? `, logo image ${String(d.logo)}` : ""}; tagline "${String(d.tagline ?? "")}".`,
    `Columns: ${cols.length ? cols.map((c, n) => `${n + 1}. "${c.heading}" [${c.id}] (${c.links.length} links${c.text ? ", text" : ""})`).join("; ") : "none"}.`,
    `Social icons: ${d.showSocials ? "from the business profile" : `${socials.length} set on the footer`}. Newsletter: ${yes(d.showNewsletter)}. Booking section: ${yes(d.showBooking)}.`,
    `Copyright: ${d.copyrightText ? `"${String(d.copyrightText)}"` : `default ("© <year> ${String(d.logoText ?? "")}. All rights reserved.")`}. Bottom links: ${Array.isArray(d.bottomLinks) && d.bottomLinks.length ? (d.bottomLinks as FLink[]).map((l) => l.label).join(", ") : "none"}. Credit: ${creditText}.`,
  ];
  return { blockId: b.id, text: lines.join(" ") + extra };
}

export function summarizePrefooter(stored: unknown): string {
  const blocks = toBlocks(stored);
  if (!blocks.length) return "No pre-footer.";
  const hidden = blocks.every((b) => b.visible === false);
  const parts = blocks.map((b) => {
    const d = (b.data ?? {}) as Data;
    if (b.type === "cta") return `banner "${String(d.title ?? "")}"${d.primaryButton ? ` with ${btn((d.primaryButton as Data).label, (d.primaryButton as Data).url)}` : ""}`;
    if (b.type === "contact") return `contact form "${String(d.title ?? "")}"${d.email ? ` (${String(d.email)})` : ""}`;
    return b.type;
  });
  return `Pre-footer${hidden ? " (hidden)" : ""}: ${parts.join(" + ")}. Shown above the footer on pages without their own contact form.`;
}
