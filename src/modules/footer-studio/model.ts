/**
 * Footer Studio data model (Header & Footer Studio phase 3, Nov 2026).
 *
 * A studio footer is a small JSON document, NOT page blocks: 0 to 5 widget
 * columns plus a bottom bar with Left / Centre / Right zones. The widget list
 * is closed (logo + about, menu, links, contact, hours, socials, newsletter,
 * map, payment badges, copyright, text, back to top) and each widget type
 * may only sit where it makes sense (no map in the bottom bar, no back-to-top
 * button in a column). normalizeFooterConfig() drops anything else, so
 * arbitrary blocks (hero, custom HTML) can never enter a footer.
 *
 * Contact values, opening hours, socials and the logo are NOT copied into
 * the config: a widget with no value of its own shows the site's live
 * details, so a preset is pre-filled and stays right when they change.
 *
 * Pure functions only (no React, no Supabase): tests, the dashboard editor,
 * the API and the site renderer share them.
 */
import type { MapLocation } from "@/lib/maps/location";
import { normalizeMenuStyle, safeColor, type MenuStyle } from "@/modules/navigation/menu-style";

export const FOOTER_WIDGET_TYPES = [
  "about", "menu", "links", "contact", "hours", "socials", "newsletter", "map",
  "payments", "copyright", "text", "backToTop",
] as const;
export type FooterWidgetType = (typeof FOOTER_WIDGET_TYPES)[number];

/** Widgets a column may hold. */
export const COLUMN_WIDGET_TYPES = [
  "about", "menu", "links", "contact", "hours", "socials", "newsletter", "map", "payments", "copyright", "text",
] as const satisfies readonly FooterWidgetType[];
/** Elements the bottom bar may hold (small, single-line things). */
export const BOTTOM_WIDGET_TYPES = [
  "copyright", "links", "menu", "socials", "payments", "text", "backToTop",
] as const satisfies readonly FooterWidgetType[];

export const BOTTOM_ZONES = ["left", "center", "right"] as const;
export type FooterZone = (typeof BOTTOM_ZONES)[number];

export const MAX_COLUMNS = 5;
export const MAX_COLUMN_WIDGETS = 4;
export const MAX_ZONE_WIDGETS = 4;
export const MAX_LINKS = 12;

export const CONTACT_FIELDS = ["phone", "whatsapp", "email", "address"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const PAYMENT_METHODS = [
  "visa", "mastercard", "amex", "paypal", "stripe", "applepay", "googlepay",
  "bkash", "nagad", "rocket", "cod", "bank",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  visa: "Visa", mastercard: "Mastercard", amex: "Amex", paypal: "PayPal", stripe: "Stripe",
  applepay: "Apple Pay", googlepay: "Google Pay", bkash: "bKash", nagad: "Nagad", rocket: "Rocket",
  cod: "Cash on delivery", bank: "Bank transfer",
};

export type FooterBackground = "default" | "muted" | "primary" | "secondary" | "dark";

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  newTab?: boolean;
}

export interface FooterWidget {
  id: string;
  type: FooterWidgetType;
  /** Small heading above the widget (inside a column). */
  title?: string;
  /** about: text under the logo. text: the text. copyright: own line ("{year}" = this year). */
  text?: string;
  /** about: show the logo (default on). */
  hideLogo?: boolean;
  /** about (menus P5): a text logo shown instead of a logo image (the classic footer's text logo). Unset = the logo image, else the site name. */
  name?: string;
  /** about: own logo image (unset = Site Identity logo). payments: own badges image. */
  imageUrl?: string;
  /** about: logo height in px. */
  height?: number;
  /** menu: nav_menus.id. Unset = the footer menu (location "footer"), then fallbacks. */
  menuId?: string;
  /** menu / links: how deep a menu goes (1 or 2). */
  levels?: number;
  /** menu / links: stacked list or one inline row; menu: also a 2-column list (menus P2). */
  layout?: "list" | "inline" | "columns";
  /** menu (menus P2): the menu's look here (preset + overrides, modules/navigation/menu-style).
   *  Unset = the footer's own link look, as before P2. */
  menuStyle?: MenuStyle;
  /** links: own links. */
  links?: FooterLink[];
  /** contact: which details to show (unset = all the site has). */
  fields?: ContactField[];
  /** contact: own values (unset = the site's contact details). */
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  /** hours: own opening hours (unset = Business Profile opening hours). */
  hours?: string;
  /** newsletter: button text, placeholder, thank-you line. */
  buttonLabel?: string;
  placeholder?: string;
  successText?: string;
  /** map: saved map (Map location control). Unset = the site's map / address. */
  mapEmbedUrl?: string;
  mapLocation?: MapLocation;
  mapHeight?: number;
  /** payments: badges shown. */
  methods?: PaymentMethod[];
  /** text: link the text. */
  url?: string;
  /** socials (menus P5): own social links, e.g. a converted classic footer's. Unset = the site's social links. */
  socials?: FooterSocialLink[];
}

/** A social link of the widget's own list. Any short network name: known ones get their icon, others their first letter (as the classic footer). */
export type FooterSocialLink = { platform: string; url: string };

export interface FooterColumn {
  id: string;
  /** Column heading (also the accordion button on phones). */
  title?: string;
  /** Width on desktop: 1 or 2 shares. */
  span: 1 | 2;
  widgets: FooterWidget[];
}

export interface FooterBottom {
  enabled: boolean;
  /** Thin line above the bar. */
  border: boolean;
  zones: Record<FooterZone, FooterWidget[]>;
}

export interface FooterStyle {
  background: FooterBackground;
  /** Vertical padding. */
  size: "sm" | "md" | "lg";
  /** Column content alignment. */
  align: "start" | "center";
  /** Column headings in capitals. */
  uppercase: boolean;
  /** Thin line above the footer. */
  topBorder: boolean;
  /** Own background colour (menus P5, e.g. a classic footer's colour). Wins over `background`. */
  bgColor?: string;
  /** Own text colour (menus P5). */
  fgColor?: string;
  /** Column heading colour (menus P5, the classic footer's accent colour). Unset = the text colour. */
  accentColor?: string;
  /** Theme gradient over the background (menus P5, the classic footer's look): "dark" secondary to primary, "light" muted to card. */
  gradient?: "dark" | "light";
}

export interface FooterMobile {
  /** Columns with a heading collapse into accordions on phones. */
  accordion: boolean;
  /** Centre everything on phones. */
  center: boolean;
}

/** "Powered by" credit choice; honoured only when the site's plan allows (resolveCredit). */
export interface FooterCreditChoice {
  show?: boolean;
  text?: string;
  url?: string;
}

export interface FooterConfig {
  v: 1;
  /** Preset it started from (informational). */
  preset: string;
  columns: FooterColumn[];
  bottom: FooterBottom;
  style: FooterStyle;
  mobile: FooterMobile;
  credit?: FooterCreditChoice;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const WIDGET_SET = new Set<string>(FOOTER_WIDGET_TYPES);
const COLUMN_SET = new Set<string>(COLUMN_WIDGET_TYPES);
const BOTTOM_SET = new Set<string>(BOTTOM_WIDGET_TYPES);
const PAYMENT_SET = new Set<string>(PAYMENT_METHODS);

export function isFooterWidgetType(t: unknown): t is FooterWidgetType {
  return typeof t === "string" && WIDGET_SET.has(t);
}
export function allowedInColumn(t: unknown): boolean {
  return typeof t === "string" && COLUMN_SET.has(t);
}
export function allowedInBottom(t: unknown): boolean {
  return typeof t === "string" && BOTTOM_SET.has(t);
}

export function newId(prefix = "fw"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeWidget(type: FooterWidgetType, extra: Partial<FooterWidget> = {}): FooterWidget {
  return { id: newId(), type, ...extra };
}

export function makeColumn(widgets: FooterWidget[] = [], extra: Partial<Omit<FooterColumn, "widgets">> = {}): FooterColumn {
  return { id: newId("fc"), span: 1, ...extra, widgets };
}

export function makeLink(label: string, url: string): FooterLink {
  return { id: newId("fl"), label, url };
}

export function defaultFooterConfig(): FooterConfig {
  return {
    v: 1,
    preset: "custom",
    columns: [],
    bottom: { enabled: true, border: true, zones: { left: [], center: [], right: [] } },
    style: { background: "secondary", size: "md", align: "start", uppercase: false, topBorder: false },
    mobile: { accordion: true, center: false },
  };
}

const str = (v: unknown, max = 300): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
/** Multi-line text: keeps line breaks, trims each end. */
const text = (v: unknown, max = 600): string | undefined => (typeof v === "string" && v.trim() ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const optOneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (list.includes(v as T) ? (v as T) : undefined);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : undefined;

/** Links a footer may carry: site paths, anchors, http(s), mailto, tel. */
export function safeUrl(v: unknown): string | undefined {
  const s = str(v, 500);
  if (!s) return undefined;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(s)) return s;
  return undefined;
}

function normalizeLink(raw: unknown): FooterLink | null {
  if (!isObj(raw)) return null;
  // 240: classic footer columns hold address lines as links (menus P5 keeps them whole).
  const label = str(raw.label, 240);
  const url = safeUrl(raw.url);
  if (!label || !url) return null;
  const l: FooterLink = { id: str(raw.id, 40) ?? newId("fl"), label, url };
  if (raw.newTab === true) l.newTab = true;
  return l;
}

function normalizeLocation(raw: unknown): MapLocation | undefined {
  if (!isObj(raw)) return undefined;
  const out: MapLocation = {};
  if (typeof raw.lat === "number" && Number.isFinite(raw.lat) && Math.abs(raw.lat) <= 90) out.lat = raw.lat;
  if (typeof raw.lng === "number" && Number.isFinite(raw.lng) && Math.abs(raw.lng) <= 180) out.lng = raw.lng;
  const label = str(raw.label, 200);
  if (label) out.label = label;
  const zoom = num(raw.zoom, 3, 21);
  if (zoom !== undefined) out.zoom = zoom;
  if (typeof raw.cid === "string" && /^\d{1,20}$/.test(raw.cid)) out.cid = raw.cid;
  const source = optOneOf(raw.source, ["search", "link", "address", "pin", "coords"] as const);
  if (source) out.source = source;
  return Object.keys(out).length ? out : undefined;
}

/** One widget, cleaned. Null when it is not a footer widget. */
export function normalizeWidget(raw: unknown): FooterWidget | null {
  if (!isObj(raw) || !isFooterWidgetType(raw.type)) return null;
  const w: FooterWidget = { id: str(raw.id, 40) ?? newId(), type: raw.type };
  const title = str(raw.title, 80);
  if (title) w.title = title;
  const body = text(raw.text, 600);
  if (body) w.text = body;
  if (raw.hideLogo === true) w.hideLogo = true;
  if (raw.type === "about") {
    const name = str(raw.name, 80);
    if (name) w.name = name;
  }
  const imageUrl = safeUrl(raw.imageUrl);
  if (imageUrl) w.imageUrl = imageUrl;
  const height = num(raw.height, 16, 160);
  if (height !== undefined) w.height = height;
  const menuId = str(raw.menuId, 60);
  if (menuId) w.menuId = menuId;
  const levels = num(raw.levels, 1, 2);
  if (levels !== undefined && levels > 1) w.levels = levels;
  const layout = optOneOf(raw.layout, ["list", "inline", "columns"] as const);
  if (layout === "inline" || (layout === "columns" && raw.type === "menu")) w.layout = layout;
  if (raw.type === "menu") {
    const menuStyle = normalizeMenuStyle(raw.menuStyle);
    if (menuStyle) w.menuStyle = menuStyle;
  }
  if (Array.isArray(raw.links)) {
    const links = raw.links.map(normalizeLink).filter((x): x is FooterLink => !!x).slice(0, MAX_LINKS);
    if (links.length || raw.type === "links") w.links = links;
  }
  if (Array.isArray(raw.fields)) {
    const fields = [...new Set(raw.fields.filter((f): f is ContactField => (CONTACT_FIELDS as readonly string[]).includes(f as string)))];
    w.fields = CONTACT_FIELDS.filter((f) => fields.includes(f));
  }
  for (const k of ["phone", "whatsapp", "email"] as const) {
    const v = str(raw[k], 160);
    if (v) w[k] = v;
  }
  const address = text(raw.address, 300);
  if (address) w.address = address;
  const hours = text(raw.hours, 400);
  if (hours) w.hours = hours;
  const buttonLabel = str(raw.buttonLabel, 40);
  if (buttonLabel) w.buttonLabel = buttonLabel;
  const placeholder = str(raw.placeholder, 60);
  if (placeholder) w.placeholder = placeholder;
  const successText = str(raw.successText, 160);
  if (successText) w.successText = successText;
  const mapEmbedUrl = typeof raw.mapEmbedUrl === "string" && /^(https:\/\/|\/api\/maps\/embed\?)/.test(raw.mapEmbedUrl.trim()) ? raw.mapEmbedUrl.trim().slice(0, 2000) : undefined;
  if (mapEmbedUrl) w.mapEmbedUrl = mapEmbedUrl;
  const mapLocation = normalizeLocation(raw.mapLocation);
  if (mapLocation) w.mapLocation = mapLocation;
  const mapHeight = num(raw.mapHeight, 120, 480);
  if (mapHeight !== undefined) w.mapHeight = mapHeight;
  if (Array.isArray(raw.methods)) {
    w.methods = [...new Set(raw.methods.filter((m): m is PaymentMethod => typeof m === "string" && PAYMENT_SET.has(m)))];
  }
  const url = safeUrl(raw.url);
  if (url) w.url = url;
  if (raw.type === "socials" && Array.isArray(raw.socials)) {
    const list = raw.socials.filter(isObj)
      .map((x) => ({ platform: typeof x.platform === "string" && /^[a-z][a-z0-9-]{0,19}$/.test(x.platform) ? x.platform : undefined, url: safeUrl(x.url) }))
      .filter((x): x is FooterSocialLink => !!x.platform && !!x.url && /^https?:\/\//i.test(x.url))
      .slice(0, 12);
    if (list.length) w.socials = list;
  }
  return w;
}

function normalizeColumn(raw: unknown): FooterColumn | null {
  if (!isObj(raw)) return null;
  const list = Array.isArray(raw.widgets) ? raw.widgets : [];
  const widgets = list.map(normalizeWidget)
    .filter((w): w is FooterWidget => !!w && allowedInColumn(w.type))
    .slice(0, MAX_COLUMN_WIDGETS);
  const col: FooterColumn = { id: str(raw.id, 40) ?? newId("fc"), span: raw.span === 2 ? 2 : 1, widgets };
  const title = str(raw.title, 80);
  if (title) col.title = title;
  return col;
}

/**
 * A stored or submitted footer config, cleaned into a valid one. Widgets
 * that are not footer widgets, or sit where their type may not go, are
 * dropped; columns and zones are capped; enums fall back to defaults; ids
 * are unique. Never throws.
 */
export function normalizeFooterConfig(input: unknown): FooterConfig {
  const d = defaultFooterConfig();
  if (!isObj(input)) return d;
  const columns = (Array.isArray(input.columns) ? input.columns : [])
    .map(normalizeColumn).filter((c): c is FooterColumn => !!c).slice(0, MAX_COLUMNS);
  const b = isObj(input.bottom) ? input.bottom : {};
  const zonesIn = isObj(b.zones) ? b.zones : {};
  const zones = { left: [], center: [], right: [] } as Record<FooterZone, FooterWidget[]>;
  for (const z of BOTTOM_ZONES) {
    const list = Array.isArray(zonesIn[z]) ? (zonesIn[z] as unknown[]) : [];
    zones[z] = list.map(normalizeWidget).filter((w): w is FooterWidget => !!w && allowedInBottom(w.type)).slice(0, MAX_ZONE_WIDGETS);
  }
  // Unique ids (duplicates confuse the editor and React keys).
  const seen = new Set<string>();
  const uniq = (o: { id: string }, prefix: string) => { if (seen.has(o.id)) o.id = newId(prefix); seen.add(o.id); };
  for (const c of columns) { uniq(c, "fc"); for (const w of c.widgets) { uniq(w, "fw"); for (const l of w.links ?? []) uniq(l, "fl"); } }
  for (const z of BOTTOM_ZONES) for (const w of zones[z]) { uniq(w, "fw"); for (const l of w.links ?? []) uniq(l, "fl"); }

  const s = isObj(input.style) ? input.style : {};
  const m = isObj(input.mobile) ? input.mobile : {};
  const out: FooterConfig = {
    v: 1,
    preset: str(input.preset, 40) ?? "custom",
    columns,
    bottom: { enabled: b.enabled !== false, border: b.border !== false, zones },
    style: {
      background: oneOf(s.background, ["default", "muted", "primary", "secondary", "dark"] as const, d.style.background),
      size: oneOf(s.size, ["sm", "md", "lg"] as const, "md"),
      align: oneOf(s.align, ["start", "center"] as const, "start"),
      uppercase: s.uppercase === true,
      topBorder: s.topBorder === true,
    },
    mobile: { accordion: m.accordion !== false, center: m.center === true },
  };
  // Own colours only when set, so footers saved before P5 come back unchanged.
  const bgColor = safeColor(s.bgColor);
  if (bgColor) out.style.bgColor = bgColor;
  const fgColor = safeColor(s.fgColor);
  if (fgColor) out.style.fgColor = fgColor;
  const accentColor = safeColor(s.accentColor);
  if (accentColor) out.style.accentColor = accentColor;
  const gradient = optOneOf(s.gradient, ["dark", "light"] as const);
  if (gradient) out.style.gradient = gradient;
  if (isObj(input.credit)) {
    const c: FooterCreditChoice = {};
    if (input.credit.show === false) c.show = false;
    const ct = str(input.credit.text, 80);
    if (ct) c.text = ct;
    const cu = typeof input.credit.url === "string" && /^https?:\/\//i.test(input.credit.url.trim()) ? input.credit.url.trim().slice(0, 300) : undefined;
    if (cu) c.url = cu;
    if (Object.keys(c).length) out.credit = c;
  }
  return out;
}

/**
 * Problems that make a submitted config unacceptable as sent (the API
 * refuses these instead of silently dropping): a non-footer widget, a widget
 * where its type may not go, too many columns / widgets. Empty array = fine.
 */
export function footerConfigProblems(input: unknown): string[] {
  const out: string[] = [];
  if (!isObj(input)) return ["Footer config must be an object."];
  if (input.columns !== undefined) {
    if (!Array.isArray(input.columns)) out.push("columns must be a list.");
    else {
      if (input.columns.length > MAX_COLUMNS) out.push(`The footer has ${input.columns.length} columns (max ${MAX_COLUMNS}).`);
      input.columns.forEach((c, i) => {
        const list = isObj(c) ? c.widgets : undefined;
        if (list === undefined) return;
        if (!Array.isArray(list)) { out.push(`Column ${i + 1}: widgets must be a list.`); return; }
        if (list.length > MAX_COLUMN_WIDGETS) out.push(`Column ${i + 1} holds ${list.length} widgets (max ${MAX_COLUMN_WIDGETS}).`);
        for (const w of list) {
          const t = isObj(w) ? w.type : undefined;
          if (!allowedInColumn(t)) out.push(`"${String(t)}" cannot go in a footer column. Column widgets: ${COLUMN_WIDGET_TYPES.join(", ")}.`);
        }
      });
    }
  }
  const b = isObj(input.bottom) ? input.bottom : null;
  const zones = b && isObj(b.zones) ? b.zones : null;
  if (zones) {
    for (const z of BOTTOM_ZONES) {
      const list = zones[z];
      if (list === undefined) continue;
      if (!Array.isArray(list)) { out.push(`bottom.${z} must be a list.`); continue; }
      if (list.length > MAX_ZONE_WIDGETS) out.push(`bottom.${z} holds ${list.length} items (max ${MAX_ZONE_WIDGETS}).`);
      for (const w of list) {
        const t = isObj(w) ? w.type : undefined;
        if (!allowedInBottom(t)) out.push(`"${String(t)}" cannot go in the footer bottom bar (${z}). Bottom bar items: ${BOTTOM_WIDGET_TYPES.join(", ")}.`);
      }
    }
  }
  return out;
}

/** Every widget of the footer: columns first, then the bottom bar (when on). */
export function allWidgets(cfg: FooterConfig): FooterWidget[] {
  const out: FooterWidget[] = [];
  for (const c of cfg.columns) out.push(...c.widgets);
  if (cfg.bottom.enabled) for (const z of BOTTOM_ZONES) out.push(...cfg.bottom.zones[z]);
  return out;
}

/** The menu ids a footer uses ("" = the default footer menu). */
export function footerMenuRefs(cfg: FooterConfig): string[] {
  return [...new Set(allWidgets(cfg).filter((w) => w.type === "menu").map((w) => w.menuId ?? ""))];
}

/** Does the footer need the site's opening hours? */
export function usesHours(cfg: FooterConfig): boolean {
  return allWidgets(cfg).some((w) => w.type === "hours" && !w.hours);
}

/** Does the footer show a copyright line (which carries the credit)? */
export function hasCopyright(cfg: FooterConfig): boolean {
  return allWidgets(cfg).some((w) => w.type === "copyright");
}

/** The copyright line: own text with {year}, else "© <year> <site>. All rights reserved." */
export function copyrightText(w: Pick<FooterWidget, "text"> | null | undefined, siteName: string, year: number): string {
  if (w?.text) return w.text.replace(/\{year\}/g, String(year));
  return `© ${year} ${siteName || "Your Business"}. All rights reserved.`;
}

/** Desktop grid template: one share per column, two for wide ones. */
export function gridTemplate(cfg: FooterConfig): string {
  return cfg.columns.map((c) => `${c.span}fr`).join(" ") || "1fr";
}

/** Opening hours as lines: newlines, else ";" / " | " separated parts. */
export function hoursLines(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const s = raw.trim();
  if (!s) return [];
  const parts = s.includes("\n") ? s.split("\n") : s.split(/\s*[;|]\s*/);
  return parts.map((p) => p.trim()).filter(Boolean).slice(0, 10);
}

// ── Editing operations (dashboard) ──────────────────────────────────────

export type WidgetPos = { where: "column"; column: number; index: number } | { where: "bottom"; zone: FooterZone; index: number };

export function findWidget(cfg: FooterConfig, id: string): (WidgetPos & { widget: FooterWidget }) | null {
  for (let column = 0; column < cfg.columns.length; column++) {
    const index = cfg.columns[column].widgets.findIndex((w) => w.id === id);
    if (index >= 0) return { where: "column", column, index, widget: cfg.columns[column].widgets[index] };
  }
  for (const zone of BOTTOM_ZONES) {
    const index = cfg.bottom.zones[zone].findIndex((w) => w.id === id);
    if (index >= 0) return { where: "bottom", zone, index, widget: cfg.bottom.zones[zone][index] };
  }
  return null;
}

function clone(cfg: FooterConfig): FooterConfig {
  return {
    ...cfg,
    columns: cfg.columns.map((c) => ({ ...c, widgets: [...c.widgets] })),
    bottom: { ...cfg.bottom, zones: { left: [...cfg.bottom.zones.left], center: [...cfg.bottom.zones.center], right: [...cfg.bottom.zones.right] } },
  };
}

function listAt(cfg: FooterConfig, pos: { where: "column"; column: number } | { where: "bottom"; zone: FooterZone }): FooterWidget[] | null {
  if (pos.where === "column") return cfg.columns[pos.column]?.widgets ?? null;
  return cfg.bottom.zones[pos.zone] ?? null;
}

export type Target = { where: "column"; column: number } | { where: "bottom"; zone: FooterZone };

/** Adds a widget. Same config back when the place is full or the type may not go there. */
export function addWidget(cfg: FooterConfig, to: Target, w: FooterWidget): FooterConfig {
  const ok = to.where === "column" ? allowedInColumn(w.type) : allowedInBottom(w.type);
  const max = to.where === "column" ? MAX_COLUMN_WIDGETS : MAX_ZONE_WIDGETS;
  const cur = listAt(cfg, to);
  if (!ok || !cur || cur.length >= max) return cfg;
  const next = clone(cfg);
  listAt(next, to)!.push(w);
  return next;
}

export function removeWidget(cfg: FooterConfig, id: string): FooterConfig {
  const at = findWidget(cfg, id);
  if (!at) return cfg;
  const next = clone(cfg);
  listAt(next, at)!.splice(at.index, 1);
  return next;
}

export function updateWidget(cfg: FooterConfig, id: string, patch: Partial<FooterWidget>): FooterConfig {
  const at = findWidget(cfg, id);
  if (!at) return cfg;
  const next = clone(cfg);
  const merged = { ...at.widget, ...patch, id: at.widget.id, type: at.widget.type } as FooterWidget & Record<string, unknown>;
  for (const k of Object.keys(merged)) if (merged[k] === undefined || merged[k] === "" || merged[k] === false) delete merged[k];
  listAt(next, at)![at.index] = merged;
  return next;
}

/**
 * "Save as menu" (menus P2): a links widget becomes a menu widget showing the
 * saved menu `menuId` (made from its links), in the same place, with the same
 * id, heading, depth and layout. Same config back for any other widget.
 */
export function linksToMenuWidget(cfg: FooterConfig, id: string, menuId: string): FooterConfig {
  const at = findWidget(cfg, id);
  if (!at || at.widget.type !== "links" || !menuId) return cfg;
  const next = clone(cfg);
  const w = at.widget;
  const menu: FooterWidget = { id: w.id, type: "menu", menuId: menuId.slice(0, 60) };
  if (w.title) menu.title = w.title;
  if (w.levels) menu.levels = w.levels;
  if (w.layout === "inline") menu.layout = "inline";
  listAt(next, at)![at.index] = menu;
  return next;
}

/** The links of a links widget as menu items (for "Save as menu"). */
export function linksAsMenuItems(w: FooterWidget): { id: string; label: string; url: string; target?: "_blank" }[] {
  return (w.links ?? []).filter((l) => l.label && l.url).map((l) => ({ id: l.id, label: l.label, url: l.url, ...(l.newTab ? { target: "_blank" as const } : {}) }));
}

/** Moves a widget within its place (dir -1/1) or to another column / zone (appended). */
export function moveWidget(cfg: FooterConfig, id: string, to: Target | -1 | 1): FooterConfig {
  const at = findWidget(cfg, id);
  if (!at) return cfg;
  const next = clone(cfg);
  const list = listAt(next, at)!;
  if (to === -1 || to === 1) {
    const j = at.index + to;
    if (j < 0 || j >= list.length) return cfg;
    [list[at.index], list[j]] = [list[j], list[at.index]];
    return next;
  }
  const same = to.where === at.where && (to.where === "column" ? at.where === "column" && to.column === at.column : at.where === "bottom" && to.zone === at.zone);
  if (same) return cfg;
  const ok = to.where === "column" ? allowedInColumn(at.widget.type) : allowedInBottom(at.widget.type);
  const max = to.where === "column" ? MAX_COLUMN_WIDGETS : MAX_ZONE_WIDGETS;
  const dest = listAt(next, to);
  if (!ok || !dest || dest.length >= max) return cfg;
  list.splice(at.index, 1);
  dest.push(at.widget);
  return next;
}

export function addColumn(cfg: FooterConfig, col: FooterColumn = makeColumn()): FooterConfig {
  if (cfg.columns.length >= MAX_COLUMNS) return cfg;
  const next = clone(cfg);
  next.columns.push(col);
  return next;
}

export function removeColumn(cfg: FooterConfig, index: number): FooterConfig {
  if (!cfg.columns[index]) return cfg;
  const next = clone(cfg);
  next.columns.splice(index, 1);
  return next;
}

export function updateColumn(cfg: FooterConfig, index: number, patch: Partial<Pick<FooterColumn, "title" | "span">>): FooterConfig {
  if (!cfg.columns[index]) return cfg;
  const next = clone(cfg);
  const col = { ...next.columns[index], ...patch };
  if (!col.title) delete col.title;
  next.columns[index] = col;
  return next;
}

export function moveColumn(cfg: FooterConfig, index: number, dir: -1 | 1): FooterConfig {
  const j = index + dir;
  if (!cfg.columns[index] || j < 0 || j >= cfg.columns.length) return cfg;
  const next = clone(cfg);
  [next.columns[index], next.columns[j]] = [next.columns[j], next.columns[index]];
  return next;
}
