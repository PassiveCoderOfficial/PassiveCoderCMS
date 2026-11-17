/**
 * How faithful a "Switch to Studio" draft is (menus P5). Pure.
 *
 * This does NOT trust the converter's own notes: it reads the visitor-facing
 * facts straight from the classic blocks (what the classic renderers show)
 * and straight from the Studio config (what the Studio renderers show), then
 * compares them: links in order (every level), logo, buttons, contact items
 * and top bar text, shop/search/account/language icons, sticky/transparent;
 * for footers the columns and their links, socials, copyright, legal links.
 *
 * Result: "exact" (same facts, no converter notes), "minor" (same links,
 * logo, buttons and contacts but with listed differences), "unsupported".
 * A content difference (a link, the logo, a button or contact item) is
 * always listed; the staff report shows every one.
 */
import type { Block, ContainerBlockProps, FooterBlockProps, NavigationBlockProps, NavItem } from "@/types/cms";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { ROW_KEYS, ZONES, colorIsDark, type HeaderConfig, type HeaderElement } from "@/modules/header-studio/model";
import type { FooterConfig, FooterWidget } from "@/modules/footer-studio/model";
import { asBlocks, isContainerHeader, type HeaderConversion } from "./header-convert";
import { classicCopyright, type FooterConversion } from "./footer-convert";
import type { SavedMenu } from "./menu-match";
import { noteText, type SwitchLevel } from "./types";

export interface SiteBits {
  menus: SavedMenu[];
  identityLogo?: string | null;
  identityLogoDark?: string | null;
  siteName?: string | null;
  /** The site's social links (Business Profile), urls. */
  siteSocials?: string[];
  /** The automatic menu (published pages), for headers that show it. */
  defaultItems?: NavItem[];
}

export interface FidelityResult {
  level: SwitchLevel;
  /** Content differences (links, logo, buttons, contacts...), found by comparing. */
  diffs: string[];
  /** Differences the converter knew about (notes), in English. */
  notes: string[];
}

const flat = (items: NavItem[], depth = 0): string[] =>
  items.flatMap((i) => [`${"  ".repeat(depth)}${(i.label ?? "").trim()} -> ${(i.url ?? "").trim()}`, ...flat(i.children ?? [], depth + 1)]);

function listDiff(name: string, a: string[], b: string[]): string[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const missing = a.filter((x) => !b.includes(x));
  const extra = b.filter((x) => !a.includes(x));
  const out: string[] = [];
  if (missing.length) out.push(`${name}: missing ${missing.map((x) => `"${x.trim()}"`).join(", ")}`);
  if (extra.length) out.push(`${name}: added ${extra.map((x) => `"${x.trim()}"`).join(", ")}`);
  if (!missing.length && !extra.length) out.push(`${name}: same items, different order`);
  return out;
}

// ── Header ──────────────────────────────────────────────────────────────

interface HeaderFacts {
  links: string[];
  logo: string;
  buttons: string[];
  contacts: string[];
  icons: string[];
  sticky: boolean;
  transparent: boolean;
}

/** The links a classic menu block shows today (same order of rules as the page renderer, plus the automatic menu). */
function classicMenuItems(data: { items?: unknown; menuId?: string; menuLocation?: string }, bits: SiteBits): NavItem[] {
  const byId = data.menuId ? bits.menus.find((m) => m.id === data.menuId) : undefined;
  if (byId) return normalizeMenu(byId.items);
  if (data.menuLocation) {
    const at = bits.menus.find((m) => m.location === data.menuLocation);
    if (at) return normalizeMenu(at.items);
  }
  const own = normalizeMenu(data.items);
  return own.length ? own : bits.defaultItems ?? [];
}

function classicHeaderFacts(blocks: Block[], bits: SiteBits): HeaderFacts | null {
  const bar = blocks.find((b) => b.visible !== false && (b.type === "navigation" || isContainerHeader(b)));
  if (!bar) return null;
  const f: HeaderFacts = { links: [], logo: "", buttons: [], contacts: [], icons: [], sticky: false, transparent: false };
  if (bar.type === "navigation") {
    const d = (bar as NavigationBlockProps).data;
    f.links = flat(classicMenuItems(d, bits));
    f.logo = d.logo || bits.identityLogo || `text:${d.logoText ?? "Brand"}`;
    const bookingUrl = d.bookingUrl || "/book";
    if (d.secondaryCtaLabel && d.secondaryCtaUrl) f.buttons.push(`${d.secondaryCtaLabel} -> ${d.secondaryCtaUrl}`);
    if (d.showCta && d.ctaLabel && d.ctaUrl && !(d.showBooking && d.ctaUrl === bookingUrl)) f.buttons.push(`${d.ctaLabel} -> ${d.ctaUrl}`);
    if (d.showBooking) f.buttons.push(`${d.bookingLabel || "Book now"} -> ${bookingUrl}`);
    const overlay = !!(d.scrollAware ?? d.transparent);
    const tb = d.topBar;
    if (tb && tb.show !== false && !overlay) {
      for (const it of tb.items ?? []) if (it?.text) f.contacts.push(`text:${it.text}${it.url ? ` -> ${it.url}` : ""}`);
      if (tb.align !== "center") {
        if (tb.showPhone !== false) f.contacts.push("phone");
        if (tb.showWhatsapp !== false) f.contacts.push("whatsapp");
        if (tb.showSocials) f.icons.push("socials");
        // The top bar's Google Translate menu is a language control too.
        if (tb.languages?.length) f.icons.push(`language:${(tb.languages.find((l) => l !== "en") ?? tb.languages[0]).toLowerCase()}`);
      }
    }
    if (d.style === "logo-center-inline") f.icons.push("socials");
    if (d.showSearch) f.icons.push("search");
    if (d.showAccount) f.icons.push("account");
    if (d.showCart !== false) f.icons.push("cart");
    if (d.languageSwitch) f.icons.push(`language:${d.languageSwitch.toLowerCase()}`);
    f.sticky = !!d.sticky;
    f.transparent = overlay;
  } else {
    const d = (bar as ContainerBlockProps).data;
    let menuDone = false;
    for (const col of d.columns ?? []) for (const b of col?.blocks ?? []) {
      if (!b || b.visible === false) continue;
      const bd = (b.data ?? {}) as Record<string, unknown>;
      const phoneOnly = Array.isArray(b.hideOn) && b.hideOn.includes("desktop");
      if (b.type === "header_logo" && !phoneOnly && !f.logo) f.logo = (typeof bd.imageUrl === "string" && bd.imageUrl) || bits.identityLogo || `text:${(bd.text as string) || bits.siteName || ""}`;
      if (b.type === "header_nav" && !menuDone) { f.links = flat(classicMenuItems(bd, bits)); menuDone = true; }
      if (b.type === "header_cta" && bd.label) f.buttons.push(`${bd.label} -> ${(bd.url as string) || "/contact"}`);
      if (b.type === "header_booking") f.buttons.push(`${(bd.label as string) || "Book now"} -> ${(bd.url as string) || "/book"}`);
      if (b.type === "header_cart") f.icons.push("cart");
      if (b.type === "header_account") f.icons.push("account");
      if (b.type === "search") f.icons.push("search");
    }
    f.sticky = !!d.sticky;
    f.transparent = !!(d.scrollAware || d.transparent);
  }
  f.icons.sort();
  return f;
}

/** The links a Studio menu element shows (same rules as lib/site/header-studio loadHeaderMenus). */
function studioMenuItems(e: HeaderElement, bits: SiteBits, extra: Record<string, NavItem[]>, classicLinks: NavItem[] | null): NavItem[] {
  const id = e.menuId ?? "";
  if (id && extra[id]) return extra[id];
  const own = id ? bits.menus.find((m) => m.id === id) : undefined;
  const row = own ?? bits.menus.find((m) => m.location === "header");
  if (row) return normalizeMenu(row.items);
  if (classicLinks?.length) return classicLinks;
  if (bits.menus[0]) return normalizeMenu(bits.menus[0].items);
  return bits.defaultItems ?? [];
}

function studioHeaderFacts(cfg: HeaderConfig, bits: SiteBits, extra: Record<string, NavItem[]>, classicLinks: NavItem[] | null): HeaderFacts {
  const f: HeaderFacts = { links: [], logo: "", buttons: [], contacts: [], icons: [], sticky: cfg.behaviour.sticky, transparent: cfg.behaviour.transparent !== "off" };
  let menuDone = false;
  for (const k of ROW_KEYS) {
    const row = cfg.rows[k];
    if (!row.enabled) continue;
    const dark = colorIsDark(row.bgColor) ?? (row.background === "dark" || row.background === "primary");
    for (const z of ZONES) for (const e of row.zones[z]) {
      if (e.hideOn === "desktop") continue;
      switch (e.type) {
        case "logo":
          if (!f.logo) f.logo = e.imageUrl || (dark && bits.identityLogoDark) || bits.identityLogo || `text:${e.label || bits.siteName || ""}`;
          break;
        case "menu":
          if (!menuDone) { f.links = flat(studioMenuItems(e, bits, extra, classicLinks)); menuDone = true; }
          break;
        case "button": if (e.label) f.buttons.push(`${e.label} -> ${e.url || "/contact"}`); break;
        case "booking": f.buttons.push(`${e.label || "Book now"} -> ${e.url || "/book"}`); break;
        case "text": if (e.label) f.contacts.push(`text:${e.label}${e.url ? ` -> ${e.url}` : ""}`); break;
        case "phone": case "whatsapp": case "email": f.contacts.push(e.type); break;
        case "language": f.icons.push(`language:${e.lang ?? ""}`); break;
        case "socials": case "search": case "account": case "cart": f.icons.push(e.type); break;
      }
    }
  }
  f.icons.sort();
  return f;
}

/** Text items a converted top bar shows besides real contacts (the label before the socials). */
const isSocialsLabel = (s: string, blocks: Block[]) => {
  const nav = blocks.find((b) => b.type === "navigation") as NavigationBlockProps | undefined;
  return !!nav?.data.topBar?.socialsLabel && s === `text:${nav.data.topBar.socialsLabel}`;
};

export function headerFidelity(globalHeader: unknown, conv: HeaderConversion, bits: SiteBits): FidelityResult {
  const notes = conv.notes.map(noteText);
  if (conv.level === "unsupported" || !conv.config) return { level: "unsupported", diffs: [], notes };
  const blocks = asBlocks(globalHeader);
  const before = classicHeaderFacts(blocks, bits);
  if (!before) return { level: "unsupported", diffs: ["no header bar found"], notes };
  const extra: Record<string, NavItem[]> = conv.menu?.kind === "new" ? { [conv.menu.ref]: conv.menu.items } : {};
  // The Studio's own fallback for an element with no menu: the classic header's links (classicHeaderItems).
  const nav = blocks.find((b) => b.type === "navigation" || b.type === "header_nav") as { data?: { items?: unknown } } | undefined;
  const classicLinks = nav ? normalizeMenu(nav.data?.items) : null;
  const after = studioHeaderFacts(conv.config, bits, extra, classicLinks);
  const diffs = [
    ...listDiff("menu links", before.links, after.links),
    ...(before.logo !== after.logo ? [`logo: "${before.logo}" became "${after.logo}"`] : []),
    ...listDiff("buttons", before.buttons, after.buttons),
    ...listDiff("contact and top bar items", before.contacts, after.contacts.filter((c) => !isSocialsLabel(c, blocks))),
    ...listDiff("icons", before.icons, after.icons),
    ...(before.sticky !== after.sticky ? [`sticky: ${before.sticky} became ${after.sticky}`] : []),
    ...(before.transparent !== after.transparent ? [`transparent: ${before.transparent} became ${after.transparent}`] : []),
  ];
  const level: SwitchLevel = diffs.length || notes.length ? "minor" : "exact";
  return { level, diffs, notes };
}

// ── Footer ──────────────────────────────────────────────────────────────

interface FooterFacts {
  columns: string[];
  socials: string[];
  copyright: string;
  bottom: string[];
  tagline: string;
  newsletter: boolean;
}

function classicFooterFacts(block: FooterBlockProps, bits: SiteBits): FooterFacts {
  const d = block.data;
  const columns: string[] = [];
  for (const col of d.columns ?? []) {
    if (!col) continue;
    const saved = col.menuId ? bits.menus.find((m) => m.id === col.menuId) : undefined;
    const links = saved
      ? normalizeMenu(saved.items).flatMap((i) => [i, ...((col.menuLevels ?? 1) > 1 ? i.children ?? [] : [])]).map((i) => `${i.label} -> ${i.url}`)
      : (col.links ?? []).filter((l) => l?.label && l.url).map((l) => `${l.label} -> ${l.url}`);
    columns.push(`[${col.heading ?? ""}]${col.text ? ` ${col.text}` : ""} ${links.join(" | ")}`.trim());
  }
  const own = (d.socials ?? []).map((s) => s.url).filter(Boolean);
  const socials = d.showSocials && bits.siteSocials?.length ? bits.siteSocials : own;
  return {
    columns,
    socials,
    copyright: classicCopyright(d),
    bottom: (d.bottomLinks ?? []).filter((l) => l?.label && l.url).map((l) => `${l.label} -> ${l.url}`),
    tagline: [d.tagline, d.logoCaption].filter(Boolean).join("\n"),
    newsletter: !!d.showNewsletter,
  };
}

function studioFooterFacts(cfg: FooterConfig, bits: SiteBits, extra: Record<string, NavItem[]>): FooterFacts {
  const f: FooterFacts = { columns: [], socials: [], copyright: "", bottom: [], tagline: "", newsletter: false };
  const linksOf = (w: FooterWidget): string[] => {
    if (w.type === "links") return (w.links ?? []).map((l) => `${l.label} -> ${l.url}`);
    if (w.type === "menu") {
      const items = (w.menuId && extra[w.menuId]) || normalizeMenu(bits.menus.find((m) => m.id === w.menuId)?.items);
      return items.flatMap((i) => [i, ...((w.levels ?? 1) > 1 ? i.children ?? [] : [])]).map((i) => `${i.label} -> ${i.url}`);
    }
    return [];
  };
  for (const [ci, col] of cfg.columns.entries()) {
    // The brand column (about + socials) is not a link column.
    if (ci === 0 && col.widgets.some((w) => w.type === "about")) {
      for (const w of col.widgets) {
        if (w.type === "about") f.tagline = w.text ?? "";
        if (w.type === "socials") f.socials = w.socials?.length ? w.socials.map((s) => s.url) : bits.siteSocials ?? [];
      }
      continue;
    }
    // A merged column holds several titled groups; each counts as a classic column.
    let current: { title: string; text: string; links: string[] } | null = col.widgets.some((w) => w.type === "links" || w.type === "menu" || w.type === "text") ? { title: col.title ?? "", text: "", links: [] } : null;
    const flush = () => { if (current) f.columns.push(`[${current.title}]${current.text ? ` ${current.text}` : ""} ${current.links.join(" | ")}`.trim()); };
    for (const w of col.widgets) {
      if (w.type === "newsletter") { f.newsletter = true; continue; }
      if (w.title && current && (current.links.length || current.text)) { flush(); current = { title: w.title, text: "", links: [] }; }
      else if (w.title && current) current.title = w.title;
      if (w.type === "text" && current) current.text = current.text ? `${current.text} ${w.text}` : w.text ?? "";
      if ((w.type === "links" || w.type === "menu") && current) current.links.push(...linksOf(w));
    }
    flush();
  }
  for (const w of [...cfg.bottom.zones.left, ...cfg.bottom.zones.center, ...cfg.bottom.zones.right]) {
    if (w.type === "copyright" && !f.copyright) f.copyright = w.text ?? "";
    if (w.type === "links") f.bottom.push(...linksOf(w));
  }
  return f;
}

export function footerFidelity(globalFooter: unknown, conv: FooterConversion, bits: SiteBits): FidelityResult {
  const notes = conv.notes.map(noteText);
  if (conv.level === "unsupported" || !conv.config) return { level: "unsupported", diffs: [], notes };
  const block = asBlocks(globalFooter).find((b) => b.type === "footer" && b.visible !== false) as FooterBlockProps | undefined;
  if (!block) return { level: "unsupported", diffs: ["no footer block found"], notes };
  const extra = Object.fromEntries(conv.newMenus.map((m) => [m.ref, m.items]));
  const before = classicFooterFacts(block, bits);
  const after = studioFooterFacts(conv.config, bits, extra);
  // A booking text link added to the brand column is a noted change, not a link column.
  const diffs = [
    ...listDiff("footer columns", before.columns, after.columns),
    ...listDiff("social links", before.socials, after.socials),
    ...(before.copyright !== after.copyright ? [`copyright: "${before.copyright}" became "${after.copyright}"`] : []),
    ...listDiff("bottom links", before.bottom, after.bottom),
    ...(before.tagline !== after.tagline ? [`tagline: "${before.tagline}" became "${after.tagline}"`] : []),
    ...(before.newsletter !== after.newsletter ? [`newsletter: ${before.newsletter} became ${after.newsletter}`] : []),
  ];
  const level: SwitchLevel = diffs.length || notes.length ? "minor" : "exact";
  return { level, diffs, notes };
}
