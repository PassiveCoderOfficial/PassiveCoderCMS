/**
 * Classic header -> Header Studio draft (menus P5, "Switch to Studio"). Pure.
 *
 * Reads site_identity.global_header (a legacy "navigation" block, or a
 * "container" row of header sub-blocks) and builds the closest Studio
 * config: logo, the menu (by saved-menu id, see menu-match), the button(s),
 * contact items, top bar text and colours, sticky / transparent, colours,
 * phone layout. Everything the Studio cannot show the same way is listed as
 * a note, so owners and staff see exactly what changes before publishing.
 *
 * Shapes it refuses ("unsupported"): no header, a header with page sections
 * in it (hero, text...), or more than one header bar. Those sites keep the
 * classic header; nothing is guessed.
 */
import type { Block, ContainerBlockProps, NavigationBlockProps } from "@/types/cms";
import {
  defaultConfig, emptyRow, makeElement, normalizeHeaderConfig, MAX_ZONE_ELEMENTS, TEXT_ICONS,
  type HeaderConfig, type HeaderElement, type HeaderRow, type HeaderZone, type MobileBarType, type TextIcon,
} from "@/modules/header-studio/model";
import { safeColor } from "@/modules/navigation/menu-style";
import { menuShape, planMenu, planMenuId, type MenuPlan, type SavedMenu } from "./menu-match";

/** What a menu plan shows, comparable across plans (a saved menu by id, new links by content). */
const menuShapeOf = (p: MenuPlan): string => (p.kind === "saved" ? `id:${p.menuId}` : p.kind === "new" ? menuShape(p.items) : "default");
import { levelOf, type SwitchLevel, type SwitchNote, type NoteCode } from "./types";

export interface HeaderSwitchInput {
  globalHeader: unknown;
  menus: SavedMenu[];
  identityLogo?: string | null;
  identityLogoDark?: string | null;
  siteName?: string | null;
}

export interface HeaderConversion {
  /** What the classic header is. */
  source: "navigation" | "container" | "none" | "other";
  level: SwitchLevel;
  notes: SwitchNote[];
  /** The Studio draft (null when the shape cannot be converted). */
  config: HeaderConfig | null;
  /** The menu the draft's menu element shows. */
  menu: MenuPlan | null;
}

/** Same as lib/site/global-blocks toBlocks (kept here so this stays pure). */
export function asBlocks(v: unknown): Block[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((b) => b && typeof b === "object") as Block[];
  if (typeof v === "object" && (v as { type?: unknown }).type) return [v as Block];
  return [];
}

const HEADER_SUB_BLOCKS = new Set(["header_logo", "header_nav", "header_cta", "header_booking", "header_cart", "header_account", "search"]);

/** A container row used as a header (holds header sub-blocks). */
export function isContainerHeader(b: Block): boolean {
  if (b.type !== "container") return false;
  const cols = (b as ContainerBlockProps).data?.columns ?? [];
  return cols.some((c) => (c?.blocks ?? []).some((x) => x && HEADER_SUB_BLOCKS.has(x.type)));
}

class Notes {
  list: SwitchNote[] = [];
  minor(code: NoteCode, detail?: string) { if (!this.list.some((n) => n.code === code && n.detail === detail)) this.list.push({ level: "minor", code, ...(detail ? { detail } : {}) }); }
  stop(code: NoteCode, detail?: string) { this.list.push({ level: "unsupported", code, ...(detail ? { detail } : {}) }); }
}

const el = (type: HeaderElement["type"], extra: Partial<HeaderElement> = {}) => makeElement(type, extra);

/** Puts elements in a zone up to the zone limit; the rest is noted. */
function fill(row: HeaderRow, zone: HeaderZone, list: HeaderElement[], notes: Notes) {
  const room = MAX_ZONE_ELEMENTS - row.zones[zone].length;
  row.zones[zone].push(...list.slice(0, Math.max(0, room)));
  if (list.length > room) notes.minor("zoneFull", list.slice(room).map((e) => e.label || e.type).join(", "));
}

const ICON_ALIASES: Record<string, TextIcon> = { mappin: "pin", map: "pin", location: "pin", pin: "pin", phone: "phone", call: "phone", clock: "clock", time: "clock", mail: "mail", email: "mail", info: "info", facebook: "facebook", instagram: "instagram" };
function textIcon(raw: unknown): TextIcon | undefined {
  if (typeof raw !== "string") return undefined;
  const k = raw.toLowerCase().replace(/[^a-z]/g, "");
  if ((TEXT_ICONS as readonly string[]).includes(k)) return k as TextIcon;
  return ICON_ALIASES[k];
}

/** The classic header button variant default ("gradient"), as NavigationBlock draws it. */
const ctaVariant = (v: unknown): HeaderElement["variant"] => (v === "solid" || v === "outline" ? v : "gradient");

// ── Legacy "navigation" block ───────────────────────────────────────────

function fromNavigation(block: NavigationBlockProps, input: HeaderSwitchInput, notes: Notes): { config: HeaderConfig; menu: MenuPlan } {
  const d = block.data ?? ({} as NavigationBlockProps["data"]);
  const c = defaultConfig();
  c.preset = "switched";
  const style = d.style ?? "default";
  const tokenMode = d.colorMode !== "legacy";
  const overlay = !!(d.scrollAware ?? d.transparent);

  // Bar colours: legacy mode paints its own colours (secondary / white by default), token mode the theme's.
  const barBg = tokenMode ? undefined : safeColor(d.backgroundColor) ?? "hsl(var(--secondary))";
  const barFg = tokenMode ? undefined : safeColor(d.textColor) ?? "#ffffff";
  if (!tokenMode && d.backgroundColor && !safeColor(d.backgroundColor)) notes.minor("headerBackground");
  if (d.backgroundGradientTo) notes.minor("gradientBar");
  if (d.glass) notes.minor("glass");
  const paint = (row: HeaderRow, bg?: string) => {
    const b = bg ? safeColor(bg) ?? barBg : barBg;
    if (b) row.bgColor = b;
    if (barFg) row.fgColor = barFg;
  };
  paint(c.rows.main, style === "logo-center" ? d.topRowBackground : undefined);

  // Logo: the classic block draws data.logo, else the identity logo (never the dark one).
  const logoImage = d.logo || null;
  // The classic logo shrinks to make room and the menu never wraps.
  const logo = el("logo", { height: d.logoHeight ?? 34, shrink: true });
  if (logoImage) logo.imageUrl = logoImage;
  else if (input.identityLogo && input.identityLogoDark && c.rows.main.bgColor) logo.imageUrl = input.identityLogo;
  if (!logoImage && !input.identityLogo && d.logoText && d.logoText !== input.siteName) logo.label = d.logoText;
  if (d.logoIconUrl && !logoImage && !input.identityLogo) notes.minor("logoIcon");
  if (d.logoCaption) notes.minor("logoCaption");

  // Menu: the saved menu the block reads, else its own links (as a saved menu).
  const menu = planMenu(d, input.menus);
  const menuEl = el("menu", { noWrap: true });
  const menuId = planMenuId(menu);
  if (menuId) menuEl.menuId = menuId;
  if (d.menuFontSize || d.menuFontWeight || d.menuGap !== undefined) notes.minor("menuFont");
  if (d.menuUppercase) c.style.uppercase = true;

  // Right cluster, in the classic order.
  const right: HeaderElement[] = [];
  const inlineSearch = !!d.showSearch && style !== "logo-center" && style !== "logo-center-inline";
  if (inlineSearch) right.push(el("search", { searchStyle: "box", ...(d.searchPlaceholder ? { label: d.searchPlaceholder } : {}) }));
  if (d.showSearch && (d.searchScope?.length || d.searchCategoryFilter)) notes.minor("searchOptions");
  if (d.secondaryCtaLabel && d.secondaryCtaUrl) {
    right.push(el("button", { label: d.secondaryCtaLabel, url: d.secondaryCtaUrl, variant: "ghost" }));
    notes.minor("secondLink");
  }
  const variant = ctaVariant(d.ctaVariant);
  const colours: Partial<HeaderElement> = {};
  const cc = safeColor(d.ctaColor);
  if (cc) colours.color = cc;
  const ct = safeColor(d.ctaTextColor);
  if (ct) colours.textColor = ct;
  const bookingUrl = d.bookingUrl || "/book";
  if (d.showCta && d.ctaLabel && d.ctaUrl && !(d.showBooking && d.ctaUrl === bookingUrl)) {
    right.push(el("button", { label: d.ctaLabel, url: d.ctaUrl, variant, ...colours }));
  }
  if (d.showBooking) right.push(el("booking", { label: d.bookingLabel || "Book now", url: bookingUrl, variant, ...colours }));
  if (d.ctaFontSize) notes.minor("ctaFont");
  if (d.hideCtaOnTablet) notes.minor("ctaTablet");
  if (d.languageSwitch) {
    right.push(el("language", { lang: d.languageSwitch, ...(d.languageSwitchMode === "native" ? { langMode: "native" as const } : {}), ...(d.languageSwitchUrl ? { url: d.languageSwitchUrl } : {}) }));
  }
  if (d.showAccount) right.push(el("account"));
  if (d.trackOrderUrl) notes.minor("trackOrder");
  if (d.showCart !== false) right.push(el("cart"));

  const main = c.rows.main;
  if (style === "logo-center") {
    if (d.showSearch) fill(main, "left", [el("search", { searchStyle: "box", ...(d.searchPlaceholder ? { label: d.searchPlaceholder } : {}) })], notes);
    fill(main, "center", [logo], notes);
    fill(main, "right", right, notes);
    c.rows.menu = { ...emptyRow(true), size: "sm" };
    paint(c.rows.menu, d.menuRowBackground);
    fill(c.rows.menu, "center", [menuEl], notes);
    if (d.sticky && d.stickyRows === "menu") notes.minor("stickyMenuRow");
  } else if (style === "logo-center-inline") {
    fill(main, "left", [menuEl], notes);
    fill(main, "center", [logo], notes);
    fill(main, "right", [el("socials"), ...right], notes);
  } else if (style === "centered") {
    fill(main, "left", [logo], notes);
    fill(main, "center", [menuEl], notes);
    fill(main, "right", right, notes);
  } else {
    // default (and the older "split" / "minimal" / "classic" values, drawn the same way): logo then menu on the left.
    fill(main, "left", [logo, menuEl], notes);
    fill(main, "right", right, notes);
  }
  if (d.borderBottom) main.border = true;
  if (d.shadow) c.style.shadow = true;
  if (d.floating) c.style.container = "floating";

  // Top bar.
  const tb = d.topBar;
  if (tb && tb.show !== false && !overlay) {
    const center = tb.align === "center";
    const top: HeaderRow = { ...emptyRow(true, "muted"), size: "sm" };
    const bg = safeColor(tb.background) ?? (center ? "hsl(var(--primary))" : "hsl(var(--foreground))");
    const fg = safeColor(tb.textColor) ?? (center ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.75)");
    top.bgColor = bg;
    top.fgColor = fg;
    const toEl = (it: { text?: string; icon?: string; url?: string }) => el("text", {
      label: it.text ?? "",
      ...(it.url ? { url: it.url } : {}),
      ...(textIcon(it.icon) ? { icon: textIcon(it.icon) } : {}),
    });
    const items = (tb.items ?? []).filter((it) => it && it.text);
    if (center) {
      fill(top, "center", items.map(toEl), notes);
      if (tb.rotate || tb.scroll) notes.minor("topBarMotion");
    } else {
      fill(top, "left", items.filter((it) => it.side !== "right").map(toEl), notes);
      const r: HeaderElement[] = [];
      if (tb.showSocials) {
        if (tb.socialsLabel) { r.push(el("text", { label: tb.socialsLabel })); notes.minor("topBarSocialsLabel"); }
        r.push(el("socials"));
      }
      r.push(...items.filter((it) => it.side === "right").map(toEl));
      if (tb.showPhone !== false) r.push(el("phone", { showLabel: true }));
      if (tb.showWhatsapp !== false) r.push(el("whatsapp", { showLabel: true, ...(tb.whatsappLabel ? { label: tb.whatsappLabel } : {}) }));
      fill(top, "right", r, notes);
      if (tb.languages?.length) {
        fill(top, "left", [el("language", { lang: tb.languages.find((l) => l !== "en") ?? tb.languages[0], langMode: "google" })], notes);
        notes.minor("topBarLanguages");
      }
    }
    if (tb.uppercase) notes.minor("topBarCase");
    // The classic top bar shows on phones unless hidden there, and scrolls away unless pinned.
    if (!tb.hideOnMobile) c.mobile.topBar = true;
    if (d.sticky && !d.stickyTopBar) c.behaviour.topScrolls = true;
    c.rows.top = top;
  }

  // Behaviour.
  c.behaviour.sticky = !!d.sticky;
  c.behaviour.transparent = overlay ? "all" : "off";

  // Phone bar: the classic header switches at 768px and opens its menu as a panel under the bar.
  c.mobile.breakpoint = "md";
  c.mobile.drawer = "dropdown";
  const ml = d.mobileLayout && d.mobileLayout !== "default" ? d.mobileLayout : null;
  // The two-row "logo-center" style keeps the logo centred on phones too.
  c.mobile.layout = ml === "centered-logo" || (!ml && style === "logo-center") ? "logo-center" : ml === "menu-left" ? "menu-left" : "logo-left";
  const hasCart = d.showCart !== false;
  const icons: MobileBarType[] = [];
  if (!ml) {
    if (hasCart) icons.push("cart");
    if (d.langSwitcherMobile === "beside-menu" && d.languageSwitch) icons.push("language");
  } else {
    const shop: MobileBarType[] = [...(d.showSearch ? ["search" as const] : []), ...(hasCart ? ["cart" as const] : [])];
    const contact: MobileBarType[] = ["phone", "whatsapp"];
    if (ml === "spaced") icons.push(...(d.showSearch ? ["search" as const] : []), ...(d.showAccount ? ["account" as const] : []), ...(hasCart ? ["cart" as const] : contact));
    else if (ml === "centered-logo") icons.push(...(hasCart ? [...shop, ...contact] : [...contact, ...shop]));
    else icons.push(...(hasCart ? [...shop, ...contact] : [...contact, ...shop]));
    icons.splice(2);
    notes.minor("phoneIcons");
  }
  c.mobile.icons = icons;
  return { config: normalizeHeaderConfig(c), menu };
}

// ── Container header (builder row of header sub-blocks) ─────────────────

function fromContainer(block: ContainerBlockProps, input: HeaderSwitchInput, notes: Notes): { config: HeaderConfig; menu: MenuPlan } {
  const d = block.data ?? ({} as ContainerBlockProps["data"]);
  const c = defaultConfig();
  c.preset = "switched";
  const main = c.rows.main;
  const bg = block.background;
  if (bg?.type === "color" && safeColor(bg.color)) main.bgColor = safeColor(bg.color);
  else if (bg && bg.type !== "none" && bg.type !== "color") notes.minor("headerBackground");

  const cols = (d.columns ?? []).filter((col) => (col?.blocks ?? []).some((b) => b && b.visible !== false));
  const zoneOf = (i: number): HeaderZone => (cols.length >= 3 ? (i === 0 ? "left" : i === cols.length - 1 ? "right" : "center") : i === 0 ? "left" : "right");
  let menu: MenuPlan = { kind: "default" };
  let firstNav: unknown = null;
  let hasCart = false;
  for (const [i, col] of cols.entries()) {
    const out: HeaderElement[] = [];
    for (const b of col.blocks ?? []) {
      if (!b || b.visible === false) continue;
      const bd = (b.data ?? {}) as Record<string, unknown>;
      // A block hidden on desktop is a phone-only copy (desktop/phone pairs).
      const phoneOnly = Array.isArray(b.hideOn) && b.hideOn.includes("desktop");
      switch (b.type) {
        case "header_logo": {
          if (phoneOnly) break;
          const logo = el("logo", { height: typeof bd.height === "number" ? bd.height : 36 });
          if (typeof bd.imageUrl === "string" && bd.imageUrl) logo.imageUrl = bd.imageUrl;
          if (bd.showName === true) logo.showName = true;
          if (typeof bd.text === "string" && bd.text && bd.text !== input.siteName) logo.label = bd.text;
          if (!main.fgColor && safeColor(bd.textColor)) main.fgColor = safeColor(bd.textColor);
          out.push(logo);
          break;
        }
        case "header_nav": {
          const plan = planMenu(bd as { items?: unknown; menuId?: string; menuLocation?: string }, input.menus);
          if (firstNav === null) {
            firstNav = bd;
            menu = plan;
            const m = el("menu");
            const id = planMenuId(plan);
            if (id) m.menuId = id;
            if (safeColor(bd.textColor)) main.fgColor = safeColor(bd.textColor);
            if (bd.menuUppercase) c.style.uppercase = true;
            if (bd.menuFontSize || bd.menuFontWeight || bd.menuGap !== undefined) notes.minor("menuFont");
            out.push(m);
          } else if (!phoneOnly && menuShapeOf(plan) !== menuShapeOf(menu)) {
            // A phone-only copy, or the same links again, is the same menu.
            notes.minor("secondMenu");
          }
          break;
        }
        case "header_cta":
          if (typeof bd.label === "string" && bd.label) out.push(el("button", { label: bd.label, url: typeof bd.url === "string" && bd.url ? bd.url : "/contact", variant: ctaVariant(bd.variant) }));
          break;
        case "header_booking":
          out.push(el("booking", { label: typeof bd.label === "string" && bd.label ? bd.label : "Book now", url: typeof bd.url === "string" && bd.url ? bd.url : "/book", variant: ctaVariant(bd.variant) }));
          break;
        case "header_cart":
          hasCart = true;
          out.push(el("cart", bd.showLabel ? { showLabel: true } : {}));
          break;
        case "header_account":
          out.push(el("account", bd.showLabel ? { showLabel: true } : {}));
          break;
        case "search":
          out.push(el("search", { searchStyle: "box", ...(typeof bd.placeholder === "string" && bd.placeholder ? { label: bd.placeholder } : {}) }));
          break;
        default:
          notes.minor("containerBlock", b.type);
      }
    }
    fill(main, zoneOf(i), out, notes);
  }
  if (d.glass) notes.minor("glass");
  c.behaviour.sticky = !!d.sticky;
  c.behaviour.transparent = d.scrollAware || d.transparent ? "all" : "off";
  c.mobile.breakpoint = "md";
  c.mobile.drawer = "dropdown";
  c.mobile.icons = hasCart ? ["cart"] : [];
  return { config: normalizeHeaderConfig(c), menu };
}

/**
 * Converts a site's classic header. Never throws: a shape it cannot map
 * comes back as level "unsupported" with the reason.
 */
export function convertClassicHeader(input: HeaderSwitchInput): HeaderConversion {
  const notes = new Notes();
  const visible = asBlocks(input.globalHeader).filter((b) => b.visible !== false);
  if (!visible.length) {
    notes.stop("empty");
    return { source: "none", level: "unsupported", notes: notes.list, config: null, menu: null };
  }
  const bars = visible.filter((b) => b.type === "navigation" || isContainerHeader(b));
  const others = visible.filter((b) => !bars.includes(b));
  if (others.length) notes.stop("extraBlocks", [...new Set(others.map((b) => b.type))].join(", "));
  if (bars.length > 1) notes.stop("multipleHeaders", String(bars.length));
  if (!bars.length) notes.stop("unknownShape", [...new Set(visible.map((b) => b.type))].join(", "));
  if (notes.list.some((n) => n.level === "unsupported")) {
    return { source: bars.length ? (bars[0].type === "navigation" ? "navigation" : "container") : "other", level: "unsupported", notes: notes.list, config: null, menu: null };
  }
  const bar = bars[0];
  const out = bar.type === "navigation"
    ? fromNavigation(bar as NavigationBlockProps, input, notes)
    : fromContainer(bar as ContainerBlockProps, input, notes);
  return { source: bar.type === "navigation" ? "navigation" : "container", level: levelOf(notes.list), notes: notes.list, config: out.config, menu: out.menu };
}

/** The draft with the new menu's real id in place of the placeholder. */
export function withMenuId(config: HeaderConfig, ref: string, menuId: string): HeaderConfig {
  const next = JSON.parse(JSON.stringify(config)) as HeaderConfig;
  for (const row of Object.values(next.rows)) for (const zone of Object.values(row.zones)) for (const e of zone) {
    if (e.menuId === ref) e.menuId = menuId;
  }
  return next;
}
