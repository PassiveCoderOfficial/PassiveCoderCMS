/**
 * Classic footer -> Footer Studio draft (menus P5, "Switch to Studio"). Pure.
 *
 * Reads site_identity.global_footer (the classic "footer" block) and builds
 * the closest Studio config: the brand column (logo, tagline, social links),
 * one column per classic link column (its links as a links widget, its saved
 * menu as a menu widget, a column of more than 12 links as a saved menu), the
 * newsletter, the bottom bar (copyright, legal links, payment image) and the
 * colours. Differences are listed as notes.
 *
 * Refused ("unsupported"): no footer block, or other sections in the footer
 * area (a phone bottom bar, a contact or newsletter section) that the Studio
 * would drop.
 */
import type { FooterBlockProps } from "@/types/cms";
import {
  MAX_COLUMNS, MAX_COLUMN_WIDGETS, MAX_LINKS, defaultFooterConfig, makeColumn, makeLink, makeWidget, normalizeFooterConfig,
  type FooterColumn, type FooterConfig, type FooterSocialLink, type FooterWidget,
} from "@/modules/footer-studio/model";
import { safeColor } from "@/modules/navigation/menu-style";
import { normalizeMenu } from "@/modules/navigation/menu-model";
import { asBlocks } from "./header-convert";
import { findMatchingMenu, type SavedMenu } from "./menu-match";
import { levelOf, type NoteCode, type SwitchLevel, type SwitchNote } from "./types";

export interface FooterSwitchInput {
  globalFooter: unknown;
  menus: SavedMenu[];
  identityLogo?: string | null;
  siteName?: string | null;
}

/** A saved menu the switch must create for a long link column (location "none"). */
export interface NewFooterMenu { ref: string; name: string; items: ReturnType<typeof normalizeMenu> }

export interface FooterConversion {
  source: "footer" | "none" | "other";
  level: SwitchLevel;
  notes: SwitchNote[];
  config: FooterConfig | null;
  /** Menus to create before saving the draft (their refs sit in the draft's menu widgets). */
  newMenus: NewFooterMenu[];
}

class Notes {
  list: SwitchNote[] = [];
  minor(code: NoteCode, detail?: string) { if (!this.list.some((n) => n.code === code && n.detail === detail)) this.list.push({ level: "minor", code, ...(detail ? { detail } : {}) }); }
  stop(code: NoteCode, detail?: string) { this.list.push({ level: "unsupported", code, ...(detail ? { detail } : {}) }); }
}

/** The copyright line exactly as the classic footer writes it ("{year}" kept for the Studio). */
export function classicCopyright(d: FooterBlockProps["data"]): string {
  if (d.copyrightText) return d.copyrightText;
  const year = d.copyrightYear === false ? "" : "{year}";
  return `© ${year} ${d.logoText ?? ""}. All rights reserved.`;
}

export const FOOTER_MENU_REF = "__switch_footer_menu_";

export function convertClassicFooter(input: FooterSwitchInput): FooterConversion {
  const notes = new Notes();
  const visible = asBlocks(input.globalFooter).filter((b) => b.visible !== false);
  const empty = (source: FooterConversion["source"]): FooterConversion => ({ source, level: "unsupported", notes: notes.list, config: null, newMenus: [] });
  if (!visible.length) { notes.stop("empty"); return empty("none"); }
  const footers = visible.filter((b) => b.type === "footer");
  const others = visible.filter((b) => b.type !== "footer");
  if (!footers.length) { notes.stop("noFooterBlock", [...new Set(visible.map((b) => b.type))].join(", ")); return empty("other"); }
  if (footers.length > 1) notes.stop("multipleFooters", String(footers.length));
  if (others.length) notes.stop("extraBlocks", [...new Set(others.map((b) => b.type))].join(", "));
  if (notes.list.length) return empty("footer");

  const block = footers[0] as FooterBlockProps;
  const d = block.data ?? ({ columns: [] } as unknown as FooterBlockProps["data"]);
  const c = defaultFooterConfig();
  c.preset = "switched";
  c.style.uppercase = true;
  c.mobile.accordion = false;
  const newMenus: NewFooterMenu[] = [];

  // Colours, as the classic footer resolves them.
  const style = d.style ?? "dark";
  const isDark = style === "dark" || (!d.backgroundColor && style !== "light");
  const builderColor = block.background?.type === "color" ? safeColor(block.background.color) : undefined;
  const bg = safeColor(d.backgroundColor) ?? builderColor;
  if (bg) c.style.bgColor = bg;
  else {
    // No own colour: the classic footer paints the theme gradient.
    c.style.background = isDark ? "secondary" : "muted";
    c.style.gradient = isDark ? "dark" : "light";
  }
  if (block.background?.type === "gradient") notes.minor("footerGradient");
  const fg = safeColor(d.textColor);
  if (fg) c.style.fgColor = fg;
  else if (bg) c.style.fgColor = isDark ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground))";
  // Classic headings use the accent colour (else the text colour on dark footers, the primary on light ones).
  const accent = safeColor(d.accentColor) ?? (isDark ? undefined : "hsl(var(--primary))");
  if (accent) c.style.accentColor = accent;
  if (style === "retail") notes.minor("footerRetail");

  // Brand column: logo, tagline, social links.
  const about = makeWidget("about", { height: d.logoHeight ?? 80 });
  const autoLight = !!d.autoLightLogo && isDark && (!d.logo || d.logo === input.identityLogo);
  if (d.logo && !autoLight) about.imageUrl = d.logo;
  // No logo image on the classic footer: it shows its text logo (never the identity logo).
  if (!d.logo && !autoLight) about.name = d.logoText ?? "Brand";
  if (!d.logo && d.logoIconUrl) notes.minor("logoIcon");
  if (d.tagline) about.text = d.tagline;
  if (d.logoCaption) about.text = about.text ? `${about.text}\n${d.logoCaption}` : d.logoCaption;
  if (d.logoPlate) notes.minor("footerLogoPlate");
  const brand: FooterWidget[] = [about];
  const own = (d.socials ?? []).filter((s) => s && typeof s.platform === "string" && /^https?:\/\//i.test(s.url ?? "")) as FooterSocialLink[];
  if (d.showSocials || own.length) {
    const w = makeWidget("socials", d.followTitle ? { title: d.followTitle } : {});
    // Classic: the block's own list unless "use the site's social links" is on.
    if (!d.showSocials && own.length) w.socials = own.slice(0, 12);
    brand.push(w);
  }
  const cols: FooterColumn[] = [makeColumn(brand)];

  // Link columns.
  for (const [i, col] of (d.columns ?? []).entries()) {
    if (!col) continue;
    const widgets: FooterWidget[] = [];
    if (col.text) widgets.push(makeWidget("text", { text: col.text }));
    const saved = col.menuId ? input.menus.find((m) => m.id === col.menuId) : undefined;
    if (saved) {
      widgets.push(makeWidget("menu", { menuId: saved.id, ...(col.menuLevels && col.menuLevels > 1 ? { levels: 2 } : {}) }));
    } else {
      const links = (col.links ?? []).filter((l) => l && l.label && l.url);
      if (links.length > MAX_LINKS) {
        const items = normalizeMenu(links.map((l) => ({ id: l.id, label: l.label, url: l.url })));
        const match = findMatchingMenu(input.menus, items, "footer");
        const ref = `${FOOTER_MENU_REF}${i}`;
        if (match) widgets.push(makeWidget("menu", { menuId: match.id }));
        else {
          newMenus.push({ ref, name: `Footer: ${col.heading || `column ${i + 1}`}`.slice(0, 80), items });
          widgets.push(makeWidget("menu", { menuId: ref }));
        }
        notes.minor("footerLinksCut", col.heading || String(i + 1));
      } else if (links.length) {
        widgets.push(makeWidget("links", { links: links.map((l) => makeLink(l.label, l.url)) }));
      }
    }
    cols.push(makeColumn(widgets, col.heading ? { title: col.heading } : {}));
  }

  // Newsletter: the classic strip becomes a widget in its own column (or the last one).
  if (d.showNewsletter) {
    const w = makeWidget("newsletter", { ...(d.newsletterLabel ? { title: d.newsletterLabel } : {}), ...(d.newsletterPlaceholder ? { placeholder: d.newsletterPlaceholder } : {}) });
    if (cols.length < MAX_COLUMNS) cols.push(makeColumn([w]));
    else cols[cols.length - 1].widgets.push(w);
    notes.minor("footerNewsletter");
  }
  if (d.showBooking) {
    cols[0].widgets.push(makeWidget("text", { text: d.bookingLabel || "Book now", url: d.bookingUrl || "/book" }));
    notes.minor("footerBooking");
  }

  // Five columns at most: the extra ones go into the fifth (4 widgets each).
  if (cols.length > MAX_COLUMNS) {
    const keep = cols.slice(0, MAX_COLUMNS);
    const last = keep[MAX_COLUMNS - 1];
    for (const extra of cols.slice(MAX_COLUMNS)) {
      for (const w of extra.widgets) {
        if (extra.title && !w.title) w.title = extra.title;
        last.widgets.push(w);
      }
    }
    if (last.widgets.length > MAX_COLUMN_WIDGETS) notes.minor("zoneFull", last.widgets.slice(MAX_COLUMN_WIDGETS).map((w) => w.title || w.type).join(", "));
    last.widgets = last.widgets.slice(0, MAX_COLUMN_WIDGETS);
    notes.minor("footerColumnsMerged", String(cols.length));
    cols.splice(0, cols.length, ...keep);
  }
  c.columns = cols;

  // Bottom bar: copyright left; legal links, payment image, note right.
  c.bottom.zones.left = [makeWidget("copyright", { text: classicCopyright(d) })];
  const right: FooterWidget[] = [];
  const bottomLinks = (d.bottomLinks ?? []).filter((l) => l && l.label && l.url);
  if (bottomLinks.length) right.push(makeWidget("links", { layout: "inline", links: bottomLinks.slice(0, MAX_LINKS).map((l) => makeLink(l.label, l.url)) }));
  if (d.paymentImage) right.push(makeWidget("payments", { imageUrl: d.paymentImage }));
  if (d.bottomNote) { right.push(makeWidget("text", { text: d.bottomNote })); notes.minor("footerBottomNote"); }
  c.bottom.zones.right = right;
  if (d.credit) c.credit = { ...(d.credit.show === false ? { show: false } : {}), ...(d.credit.text ? { text: d.credit.text } : {}), ...(d.credit.url ? { url: d.credit.url } : {}) };

  if (d.wordmark) notes.minor("footerWordmark");
  if (d.expertsBadge) notes.minor("footerExperts");
  if (d.largeTapTargets) notes.minor("footerTapTargets");

  return { source: "footer", level: levelOf(notes.list), notes: notes.list, config: normalizeFooterConfig(c), newMenus };
}

/** The draft with real menu ids in place of the placeholders. */
export function withFooterMenuIds(config: FooterConfig, ids: Record<string, string>): FooterConfig {
  const next = JSON.parse(JSON.stringify(config)) as FooterConfig;
  const fix = (w: FooterWidget) => { if (w.menuId && ids[w.menuId]) w.menuId = ids[w.menuId]; };
  for (const col of next.columns) col.widgets.forEach(fix);
  for (const z of Object.values(next.bottom.zones)) z.forEach(fix);
  return next;
}
