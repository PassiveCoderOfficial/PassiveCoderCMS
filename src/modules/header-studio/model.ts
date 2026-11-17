/**
 * Header Studio data model (Header & Footer Studio phase 2, Nov 2026).
 *
 * A studio header is a small JSON document, NOT page blocks: up to three rows
 * (top bar, main, menu row), each with Left / Centre / Right zones holding
 * header-only elements (logo, menu, button, phone, ...). Arbitrary blocks
 * (hero, CTA sections, custom HTML) can never enter a header: the element
 * list is closed and normalizeHeaderConfig() drops anything else.
 *
 * Contact values (phone, WhatsApp, email, socials) and the logo are NOT
 * copied into the config: an element with no value of its own shows the
 * site's live contact details / Site Identity logo, so a preset is
 * pre-filled and stays right when the business profile changes.
 *
 * Pure functions only (no React, no Supabase): tests, the dashboard editor,
 * the API and the site renderer share them.
 */

export const HEADER_ELEMENT_TYPES = [
  "logo", "menu", "button", "phone", "whatsapp", "email", "search", "cart",
  "account", "booking", "language", "socials", "text", "divider",
] as const;
export type HeaderElementType = (typeof HEADER_ELEMENT_TYPES)[number];

export const ROW_KEYS = ["top", "main", "menu"] as const;
export type HeaderRowKey = (typeof ROW_KEYS)[number];
export const ZONES = ["left", "center", "right"] as const;
export type HeaderZone = (typeof ZONES)[number];

/** Elements that may sit in the phone bar (beside the logo and menu button). */
export const MOBILE_BAR_TYPES = ["phone", "whatsapp", "email", "search", "cart", "account", "booking", "button", "language"] as const;
export type MobileBarType = (typeof MOBILE_BAR_TYPES)[number];
export const MAX_MOBILE_ICONS = 3;
/** Per zone. Keeps a header a header, and the JSON small. */
export const MAX_ZONE_ELEMENTS = 6;

export type ButtonVariant = "solid" | "outline" | "gradient" | "ghost";
export type RowBackground = "default" | "muted" | "primary" | "dark" | "transparent";

export interface HeaderElement {
  id: string;
  type: HeaderElementType;
  /** Hide this element on one device class. Unset = both. */
  hideOn?: "desktop" | "mobile";
  /** button / booking / text / search placeholder / account label. */
  label?: string;
  /** button / text link. */
  url?: string;
  newTab?: boolean;
  variant?: ButtonVariant;
  /** menu: nav_menus.id. Unset = the menu at location "header" (else the first menu). */
  menuId?: string;
  /** menu: show only one half of the top-level items (split-menu headers). */
  menuPart?: "first" | "second";
  /** phone / whatsapp / email: own value. Unset = the site's contact details. */
  value?: string;
  /** phone / whatsapp / email / account / cart: show the text next to the icon. */
  showLabel?: boolean;
  /** logo: own image (unset = Site Identity logo). */
  imageUrl?: string;
  /** logo: image height in px. */
  height?: number;
  /** logo: show the site name next to the image. */
  showName?: boolean;
  /** search: "icon" (opens a search bar) or "box" (inline field). */
  searchStyle?: "icon" | "box";
  /** language: the other language's code (e.g. "ar", "bn"). */
  lang?: string;
  /** language: "google" (translate widget) or "native" (link to the translated page). */
  langMode?: "google" | "native";
}

export interface HeaderRow {
  enabled: boolean;
  background: RowBackground;
  /** Vertical size. */
  size: "sm" | "md" | "lg";
  /** Thin line under the row. */
  border: boolean;
  zones: Record<HeaderZone, HeaderElement[]>;
}

export interface HeaderMobile {
  /** Where the logo sits in the phone bar. */
  layout: "logo-left" | "logo-center" | "menu-left";
  drawer: "side" | "full" | "dropdown";
  /** Element types shown as icons in the phone bar (max 3). */
  icons: MobileBarType[];
  /** Below this width the phone layout is used. */
  breakpoint: "md" | "lg";
  /** Id of the menu element whose menu fills the phone drawer. Unset = the
   *  first menu in the main bar, then the menu row, then the top bar (P0:
   *  before, a top-bar utility menu could replace the main menu). */
  drawerMenu?: string;
}

export interface HeaderBehaviour {
  sticky: boolean;
  /** Smaller main row once scrolled. */
  shrink: boolean;
  /** Slides away while scrolling down, back on scroll up. */
  hideOnScroll: boolean;
  /** Transparent over the page's hero until scrolled. */
  transparent: "off" | "home" | "all" | "selected";
  /** transparent "selected": page paths ("/", "/about"). */
  transparentPages: string[];
}

export interface HeaderStyle {
  /** full: edge to edge bar; boxed: content width with rounded bar; floating: detached pill with shadow. */
  container: "full" | "boxed" | "floating";
  shadow: boolean;
  /** Menu text in capitals. */
  uppercase: boolean;
}

export interface HeaderConfig {
  v: 1;
  /** Preset it started from (informational). */
  preset: string;
  rows: Record<HeaderRowKey, HeaderRow>;
  mobile: HeaderMobile;
  behaviour: HeaderBehaviour;
  style: HeaderStyle;
}

// ── Helpers ─────────────────────────────────────────────────────────────

const ELEMENT_SET = new Set<string>(HEADER_ELEMENT_TYPES);
const MOBILE_SET = new Set<string>(MOBILE_BAR_TYPES);

export function isHeaderElementType(t: unknown): t is HeaderElementType {
  return typeof t === "string" && ELEMENT_SET.has(t);
}

export function newElementId(): string {
  return `he-${Math.random().toString(36).slice(2, 9)}`;
}

export function makeElement(type: HeaderElementType, extra: Partial<HeaderElement> = {}): HeaderElement {
  return { id: newElementId(), type, ...extra };
}

export function emptyRow(enabled = false, background: RowBackground = "default"): HeaderRow {
  return { enabled, background, size: "md", border: false, zones: { left: [], center: [], right: [] } };
}

export function defaultConfig(): HeaderConfig {
  return {
    v: 1,
    preset: "custom",
    rows: { top: emptyRow(false, "muted"), main: emptyRow(true), menu: emptyRow(false) },
    mobile: { layout: "logo-left", drawer: "side", icons: [], breakpoint: "lg" },
    behaviour: { sticky: true, shrink: false, hideOnScroll: false, transparent: "off", transparentPages: [] },
    style: { container: "full", shadow: false, uppercase: false },
  };
}

const str = (v: unknown, max = 300): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const optOneOf = <T extends string>(v: unknown, list: readonly T[]): T | undefined => (list.includes(v as T) ? (v as T) : undefined);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Links a header may carry: site paths, anchors, http(s), mailto, tel. */
export function safeUrl(v: unknown): string | undefined {
  const s = str(v, 500);
  if (!s) return undefined;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(s)) return s;
  return undefined;
}

/** One element, cleaned. Null when it is not a header element. */
export function normalizeElement(raw: unknown): HeaderElement | null {
  if (!isObj(raw) || !isHeaderElementType(raw.type)) return null;
  const e: HeaderElement = { id: str(raw.id, 40) ?? newElementId(), type: raw.type };
  const hideOn = optOneOf(raw.hideOn, ["desktop", "mobile"] as const);
  if (hideOn) e.hideOn = hideOn;
  const label = str(raw.label, 120);
  if (label) e.label = label;
  const url = safeUrl(raw.url);
  if (url) e.url = url;
  if (raw.newTab === true) e.newTab = true;
  const variant = optOneOf(raw.variant, ["solid", "outline", "gradient", "ghost"] as const);
  if (variant) e.variant = variant;
  const menuId = str(raw.menuId, 60);
  if (menuId) e.menuId = menuId;
  const menuPart = optOneOf(raw.menuPart, ["first", "second"] as const);
  if (menuPart) e.menuPart = menuPart;
  const value = str(raw.value, 160);
  if (value) e.value = value;
  if (raw.showLabel === true) e.showLabel = true;
  const imageUrl = safeUrl(raw.imageUrl);
  if (imageUrl) e.imageUrl = imageUrl;
  if (typeof raw.height === "number" && Number.isFinite(raw.height)) e.height = Math.min(120, Math.max(16, Math.round(raw.height)));
  if (raw.showName === true) e.showName = true;
  const searchStyle = optOneOf(raw.searchStyle, ["icon", "box"] as const);
  if (searchStyle) e.searchStyle = searchStyle;
  const lang = typeof raw.lang === "string" && /^[a-z]{2,3}(-[a-z]{2,4})?$/i.test(raw.lang) ? raw.lang.toLowerCase() : undefined;
  if (lang) e.lang = lang;
  const langMode = optOneOf(raw.langMode, ["google", "native"] as const);
  if (langMode) e.langMode = langMode;
  return e;
}

function normalizeRow(raw: unknown, fallback: HeaderRow): HeaderRow {
  if (!isObj(raw)) return fallback;
  const zonesIn = isObj(raw.zones) ? raw.zones : {};
  const zones = { left: [], center: [], right: [] } as Record<HeaderZone, HeaderElement[]>;
  for (const z of ZONES) {
    const list = Array.isArray(zonesIn[z]) ? (zonesIn[z] as unknown[]) : [];
    zones[z] = list.map(normalizeElement).filter((x): x is HeaderElement => !!x).slice(0, MAX_ZONE_ELEMENTS);
  }
  return {
    enabled: raw.enabled === true,
    background: oneOf(raw.background, ["default", "muted", "primary", "dark", "transparent"] as const, fallback.background),
    size: oneOf(raw.size, ["sm", "md", "lg"] as const, "md"),
    border: raw.border === true,
    zones,
  };
}

/**
 * A stored or submitted header config, cleaned into a valid one. Unknown
 * element types (anything that is not a header element) are dropped, zones
 * are capped, enums fall back to defaults, ids are unique. Never throws.
 */
export function normalizeHeaderConfig(input: unknown): HeaderConfig {
  const d = defaultConfig();
  if (!isObj(input)) return d;
  const rowsIn = isObj(input.rows) ? input.rows : {};
  const rows = {
    top: normalizeRow(rowsIn.top, d.rows.top),
    main: normalizeRow(rowsIn.main, d.rows.main),
    menu: normalizeRow(rowsIn.menu, d.rows.menu),
  };
  // The main row always shows: a header with no main row is not a header.
  rows.main.enabled = true;
  // Unique element ids (duplicates confuse the editor and React keys).
  const seen = new Set<string>();
  for (const k of ROW_KEYS) for (const z of ZONES) for (const e of rows[k].zones[z]) {
    if (seen.has(e.id)) e.id = newElementId();
    seen.add(e.id);
  }
  const m = isObj(input.mobile) ? input.mobile : {};
  const icons = (Array.isArray(m.icons) ? m.icons : []).filter((x): x is MobileBarType => typeof x === "string" && MOBILE_SET.has(x));
  const b = isObj(input.behaviour) ? input.behaviour : {};
  const pages = (Array.isArray(b.transparentPages) ? b.transparentPages : [])
    .filter((x): x is string => typeof x === "string" && x.startsWith("/"))
    .map((x) => normalizePath(x)).slice(0, 100);
  const s = isObj(input.style) ? input.style : {};
  return {
    v: 1,
    preset: str(input.preset, 40) ?? "custom",
    rows,
    mobile: {
      layout: oneOf(m.layout, ["logo-left", "logo-center", "menu-left"] as const, "logo-left"),
      drawer: oneOf(m.drawer, ["side", "full", "dropdown"] as const, "side"),
      icons: [...new Set(icons)].slice(0, MAX_MOBILE_ICONS),
      breakpoint: oneOf(m.breakpoint, ["md", "lg"] as const, "lg"),
      ...(typeof m.drawerMenu === "string" && seen.has(m.drawerMenu) ? { drawerMenu: m.drawerMenu } : {}),
    },
    behaviour: {
      sticky: b.sticky !== false,
      shrink: b.shrink === true,
      hideOnScroll: b.hideOnScroll === true,
      transparent: oneOf(b.transparent, ["off", "home", "all", "selected"] as const, "off"),
      transparentPages: [...new Set(pages)],
    },
    style: {
      container: oneOf(s.container, ["full", "boxed", "floating"] as const, "full"),
      shadow: s.shadow === true,
      uppercase: s.uppercase === true,
    },
  };
}

/**
 * Problems that make a submitted config unacceptable as sent (the API
 * refuses these instead of silently dropping): a non-header element, a zone
 * over the limit. Empty array = fine.
 */
export function headerConfigProblems(input: unknown): string[] {
  const out: string[] = [];
  if (!isObj(input)) return ["Header config must be an object."];
  const rowsIn = isObj(input.rows) ? input.rows : {};
  for (const k of ROW_KEYS) {
    const row = rowsIn[k];
    if (!isObj(row) || !isObj(row.zones)) continue;
    for (const z of ZONES) {
      const list = row.zones[z];
      if (list === undefined) continue;
      if (!Array.isArray(list)) { out.push(`${k}.${z} must be a list.`); continue; }
      if (list.length > MAX_ZONE_ELEMENTS) out.push(`${k}.${z} holds ${list.length} elements (max ${MAX_ZONE_ELEMENTS}).`);
      for (const e of list) {
        const t = isObj(e) ? e.type : undefined;
        if (!isHeaderElementType(t)) out.push(`"${String(t)}" cannot go in a header (${k}.${z}). Header elements: ${HEADER_ELEMENT_TYPES.join(", ")}.`);
      }
    }
  }
  return out;
}

export function normalizePath(p: string): string {
  const clean = p.split(/[?#]/)[0].replace(/\/+$/, "");
  return clean || "/";
}

/** Is the header transparent over the hero on this path? */
export function transparentOn(cfg: HeaderConfig, pathname: string): boolean {
  const b = cfg.behaviour;
  const path = normalizePath(pathname || "/");
  switch (b.transparent) {
    case "all": return true;
    case "home": return path === "/" || path === "/home";
    case "selected": return b.transparentPages.includes(path);
    default: return false;
  }
}

/** Every element of the header, row by row, zone by zone. */
export function allElements(cfg: HeaderConfig, opts: { enabledOnly?: boolean } = {}): HeaderElement[] {
  const out: HeaderElement[] = [];
  for (const k of ROW_KEYS) {
    const row = cfg.rows[k];
    if (opts.enabledOnly && !row.enabled) continue;
    for (const z of ZONES) out.push(...row.zones[z]);
  }
  return out;
}

/** First element of a type (its settings drive the phone bar icon of that type). */
export function firstOfType(cfg: HeaderConfig, type: HeaderElementType): HeaderElement | undefined {
  return allElements(cfg, { enabledOnly: true }).find((e) => e.type === type);
}

/** Rows in the order the phone drawer looks for its menu: the main bar first, the top bar last. */
const DRAWER_ROW_ORDER: HeaderRowKey[] = ["main", "menu", "top"];

/**
 * The menu element whose menu fills the phone drawer: the one picked in the
 * Phone tab, else the first menu shown on phones in the main bar, the menu
 * row, then the top bar.
 */
export function drawerMenuElement(cfg: HeaderConfig, shownOnPhone: (e: HeaderElement) => boolean = () => true): HeaderElement | undefined {
  const menus = DRAWER_ROW_ORDER.flatMap((k) => (cfg.rows[k].enabled ? ZONES.flatMap((z) => cfg.rows[k].zones[z]) : []))
    .filter((e) => e.type === "menu" && shownOnPhone(e));
  return (cfg.mobile.drawerMenu ? menus.find((e) => e.id === cfg.mobile.drawerMenu) : undefined) ?? menus[0];
}

/** The menu ids a header uses ("" = the default header menu). */
export function menuRefs(cfg: HeaderConfig): string[] {
  return [...new Set(allElements(cfg, { enabledOnly: true }).filter((e) => e.type === "menu").map((e) => e.menuId ?? ""))];
}

/** Half of a menu's top-level items, for split-menu headers (first half gets the extra one). */
export function splitItems<T>(items: T[], part?: "first" | "second"): T[] {
  if (!part) return items;
  const cut = Math.ceil(items.length / 2);
  return part === "first" ? items.slice(0, cut) : items.slice(cut);
}

// ── Editing operations (dashboard) ──────────────────────────────────────

export type ElementPos = { row: HeaderRowKey; zone: HeaderZone; index: number };

export function findElement(cfg: HeaderConfig, id: string): (ElementPos & { element: HeaderElement }) | null {
  for (const row of ROW_KEYS) for (const zone of ZONES) {
    const index = cfg.rows[row].zones[zone].findIndex((e) => e.id === id);
    if (index >= 0) return { row, zone, index, element: cfg.rows[row].zones[zone][index] };
  }
  return null;
}

function cloneRows(cfg: HeaderConfig): HeaderConfig {
  const rows = {} as HeaderConfig["rows"];
  for (const k of ROW_KEYS) rows[k] = { ...cfg.rows[k], zones: { left: [...cfg.rows[k].zones.left], center: [...cfg.rows[k].zones.center], right: [...cfg.rows[k].zones.right] } };
  return { ...cfg, rows };
}

/** Adds an element to a zone. Returns the same config when the zone is full or the type is not a header element. */
export function addElement(cfg: HeaderConfig, row: HeaderRowKey, zone: HeaderZone, el: HeaderElement): HeaderConfig {
  if (!isHeaderElementType(el.type) || cfg.rows[row].zones[zone].length >= MAX_ZONE_ELEMENTS) return cfg;
  const next = cloneRows(cfg);
  next.rows[row].zones[zone].push(el);
  return next;
}

export function removeElement(cfg: HeaderConfig, id: string): HeaderConfig {
  const at = findElement(cfg, id);
  if (!at) return cfg;
  const next = cloneRows(cfg);
  next.rows[at.row].zones[at.zone].splice(at.index, 1);
  return next;
}

export function updateElement(cfg: HeaderConfig, id: string, patch: Partial<HeaderElement>): HeaderConfig {
  const at = findElement(cfg, id);
  if (!at) return cfg;
  const next = cloneRows(cfg);
  const merged = { ...at.element, ...patch, id: at.element.id, type: at.element.type } as HeaderElement & Record<string, unknown>;
  for (const k of Object.keys(merged)) if (merged[k] === undefined || merged[k] === "" || merged[k] === false) delete merged[k];
  next.rows[at.row].zones[at.zone][at.index] = merged;
  return next;
}

/** Moves an element to another zone (appended) or within its zone (dir -1/1). */
export function moveElement(cfg: HeaderConfig, id: string, to: { row: HeaderRowKey; zone: HeaderZone } | -1 | 1): HeaderConfig {
  const at = findElement(cfg, id);
  if (!at) return cfg;
  const next = cloneRows(cfg);
  const list = next.rows[at.row].zones[at.zone];
  if (to === -1 || to === 1) {
    const j = at.index + to;
    if (j < 0 || j >= list.length) return cfg;
    [list[at.index], list[j]] = [list[j], list[at.index]];
    return next;
  }
  if (to.row === at.row && to.zone === at.zone) return cfg;
  const dest = next.rows[to.row].zones[to.zone];
  if (dest.length >= MAX_ZONE_ELEMENTS) return cfg;
  list.splice(at.index, 1);
  dest.push(at.element);
  return next;
}

/** LanguageSwitcher "chrome" for a studio header: native mode when its language element asks for it. */
export function studioLangChrome(config: HeaderConfig): { languageSwitchMode: "native" } | null {
  const native = allElements(config, { enabledOnly: true }).some((e) => e.type === "language" && e.langMode === "native");
  return native ? { languageSwitchMode: "native" } : null;
}
