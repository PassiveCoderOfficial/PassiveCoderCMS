"use client";

/**
 * Footer Studio renderer (Header & Footer Studio phase 3, Nov 2026).
 *
 * Used ONLY when a site has published a studio footer (site_identity
 * .footer_studio, see modules/footer-studio/doc.ts). Every other site keeps
 * the classic footer path untouched.
 *
 * Desktop: up to five widget columns (one or two shares wide) and a bottom
 * bar with Left / Centre / Right zones. Tablet: two columns. Phone: one
 * column; columns with a heading collapse into accordions (owner option).
 *
 * Accessibility: <footer> contentinfo landmark, labelled <nav>s for menus and
 * link lists, accordion buttons with aria-expanded / aria-controls, the
 * newsletter field has a label.
 *
 * The "Powered by" credit follows the same plan rule as the classic footer
 * (resolveCredit with the server-decided SiteContact.creditEditable): it
 * rides on the first copyright line, or gets its own line when the footer
 * has none, so a locked plan always shows it.
 *
 * `preview` (dashboard builder) forces one device layout, so the preview can
 * show phone and tablet widths inside a desktop window.
 */
import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/cms";
import { useSiteContact } from "@/components/site/site-contact-context";
import { resolveCredit } from "@/lib/site/footer-credit-shared";
import {
  BOTTOM_ZONES, allWidgets, gridTemplate,
  type FooterBackground, type FooterColumn, type FooterConfig,
} from "@/modules/footer-studio/model";
import { colorIsDark } from "@/modules/header-studio/model";
import { FooterWidgetView, CreditLine, type FooterDevice, type WidgetCtx } from "./footer-widgets";

const BG: Record<FooterBackground, { bg: string; fg: string; muted: string; dark: boolean }> = {
  default: { bg: "hsl(var(--background))", fg: "hsl(var(--foreground))", muted: "hsl(var(--muted-foreground))", dark: false },
  muted: { bg: "hsl(var(--muted))", fg: "hsl(var(--foreground))", muted: "hsl(var(--muted-foreground))", dark: false },
  primary: { bg: "hsl(var(--primary))", fg: "hsl(var(--primary-foreground))", muted: "hsl(var(--primary-foreground) / 0.8)", dark: true },
  secondary: { bg: "hsl(var(--secondary))", fg: "hsl(var(--secondary-foreground))", muted: "hsl(var(--secondary-foreground) / 0.75)", dark: true },
  dark: { bg: "#0f172a", fg: "#f8fafc", muted: "rgba(248,250,252,0.72)", dark: true },
};

/** The footer's colours: its own (menus P5, e.g. a converted classic footer) over the background preset. */
function footerPalette(style: FooterConfig["style"]): { bg: string; fg: string; muted: string; dark: boolean } {
  const base = BG[style.background];
  if (!style.bgColor && !style.fgColor) return base;
  const fgDark = colorIsDark(style.fgColor);
  const dark = colorIsDark(style.bgColor) ?? (fgDark === null ? null : !fgDark) ?? base.dark;
  const fg = style.fgColor ?? (style.bgColor ? (dark ? "rgba(255,255,255,0.85)" : "hsl(var(--foreground))") : base.fg);
  // Same muted tone the classic footer derives from its own text colour.
  const muted = style.fgColor && /^#[0-9a-f]{6}$/i.test(style.fgColor) ? `${style.fgColor}cc` : style.fgColor ? fg : (dark ? "rgba(255,255,255,0.65)" : "hsl(var(--muted-foreground))");
  return { bg: style.bgColor ?? base.bg, fg, muted, dark };
}

/** The classic footer's theme gradients (menus P5). */
const GRADIENT = {
  dark: "linear-gradient(160deg, hsl(var(--secondary)) 0%, hsl(var(--primary) / 0.85) 100%)",
  light: "linear-gradient(160deg, hsl(var(--muted)) 0%, hsl(var(--card)) 55%, hsl(var(--primary) / 0.10) 100%)",
} as const;

const PAD: Record<FooterConfig["style"]["size"], string> = { sm: "py-8", md: "py-12", lg: "py-16" };

export function StudioFooter({ config, menus, hours = null, siteMap = null, logoUrl, logoDarkUrl, siteName, preview, thumb }: {
  config: FooterConfig;
  menus: Record<string, NavItem[]>;
  hours?: string | null;
  siteMap?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName: string;
  preview?: FooterDevice;
  thumb?: boolean;
}) {
  const site = useSiteContact();
  const pal = footerPalette(config.style);
  const center = config.style.align === "center";
  const credit = resolveCredit(config.credit ?? null, !!site.creditEditable, site.creditBase);
  // Same rule as the classic footer: the platform's own site does not credit itself.
  const showCredit = credit.show && !/passive\s?coder/i.test(siteName);
  const firstCopyright = allWidgets(config).find((w) => w.type === "copyright")?.id ?? null;
  const ctx: WidgetCtx = {
    fg: pal.fg, muted: pal.muted, onDark: pal.dark, siteName, logoUrl, logoDarkUrl, menus, hours, siteMap,
    center, mobileCenter: config.mobile.center, preview, thumb,
    credit: { ...credit, show: showCredit }, creditOn: firstCopyright, year: new Date().getFullYear(),
  };

  const cols = config.columns;
  const phone = preview === "mobile";
  const textAlign = center ? "text-center" : config.mobile.center ? (preview ? (phone ? "text-center" : "") : "max-sm:text-center") : "";
  const grid = preview
    ? cn("grid gap-8", preview === "desktop" ? "" : preview === "tablet" && cols.length > 1 ? "grid-cols-2" : "grid-cols-1")
    : cn("grid gap-8 grid-cols-1", cols.length > 1 && "sm:grid-cols-2 lg:[grid-template-columns:var(--fs-cols)]");
  const gridStyle: React.CSSProperties = preview === "desktop"
    ? { gridTemplateColumns: gridTemplate(config) }
    : preview ? {} : ({ ["--fs-cols" as string]: gridTemplate(config) } as React.CSSProperties);

  const zones = Object.fromEntries(BOTTOM_ZONES.map((z) => [z, config.bottom.enabled ? config.bottom.zones[z] : []])) as Record<(typeof BOTTOM_ZONES)[number], FooterConfig["bottom"]["zones"]["left"]>;
  const hasBottom = BOTTOM_ZONES.some((z) => zones[z].length > 0);
  const hasCenter = zones.center.length > 0;
  const creditAlone = showCredit && !firstCopyright;
  const inner = "mx-auto w-full max-w-7xl px-4 sm:px-6";
  const stacked = preview ? preview === "mobile" : false;

  return (
    <footer role="contentinfo" data-footer-studio={config.preset} className="w-full" style={{ background: pal.bg, ...(config.style.gradient ? { backgroundImage: GRADIENT[config.style.gradient] } : {}), color: pal.fg, borderTop: config.style.topBorder ? "1px solid hsl(var(--border))" : undefined }}>
      {cols.length > 0 && (
        <div className={cn(inner, PAD[config.style.size])}>
          <div className={grid} style={gridStyle} data-fs-columns={cols.length}>
            {cols.map((c, i) => (
              <ColumnView key={c.id} c={c} index={i} ctx={ctx} accordion={config.mobile.accordion} uppercase={config.style.uppercase} headingColor={config.style.accentColor}
                className={cn(textAlign, c.span === 2 && cols.length > 1 && (preview ? preview === "tablet" && "col-span-2" : "sm:col-span-2 lg:col-span-1"))} />
            ))}
          </div>
        </div>
      )}
      {(hasBottom || creditAlone) && (
        <div style={{ borderTop: config.bottom.border && cols.length > 0 ? `1px solid ${pal.dark ? "rgba(255,255,255,0.14)" : "hsl(var(--border))"}` : undefined }}>
          <div className={cn(inner, "py-5 text-xs")} data-fs-bottom="">
            {hasBottom && (
              <div className={cn("items-center gap-3",
                stacked ? "flex flex-col text-center"
                  : preview ? (hasCenter ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : "flex justify-between")
                    : cn("flex flex-col text-center sm:text-start", hasCenter ? "sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : "sm:flex-row sm:justify-between"))}>
                {BOTTOM_ZONES.map((z) => (
                  (hasCenter || z !== "center") && (
                    <div key={z} data-fs-zone={z} className={cn("flex min-w-0 flex-wrap items-center gap-3",
                      stacked ? "justify-center" : preview ? (z === "left" ? "justify-start" : z === "center" ? "justify-center" : "justify-end")
                        : cn("justify-center", z === "left" ? "sm:justify-start" : z === "center" ? "sm:justify-center" : "sm:justify-end"))}>
                      {zones[z].map((w) => <FooterWidgetView key={w.id} w={w} ctx={{ ...ctx, center: false, mobileCenter: false }} small label="Footer links" />)}
                    </div>
                  )
                ))}
              </div>
            )}
            {creditAlone && (
              <p className={cn("text-center", hasBottom && "mt-3")} style={{ color: pal.muted }} data-fs-credit=""><CreditLine ctx={ctx} /></p>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}

function ColumnView({ c, index, ctx, accordion, uppercase, className, headingColor }: {
  c: FooterColumn; index: number; ctx: WidgetCtx; accordion: boolean; uppercase: boolean; className?: string;
  /** Own heading colour (menus P5); unset = the footer's text colour, as before. */
  headingColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const collapsible = accordion && !!c.title;
  // Preview forces one device; the live site decides by width (below sm = phone).
  const phone = ctx.preview === "mobile";
  const live = !ctx.preview;
  const headingCls = cn("text-sm font-semibold", uppercase && "uppercase tracking-wider");
  const body = (
    <div className={cn("space-y-5", ctx.center && "[&_ul]:justify-center")}>
      {c.widgets.map((w) => <FooterWidgetView key={w.id} w={w} ctx={ctx} label={c.title} />)}
    </div>
  );
  if (!collapsible) {
    return (
      <div className={className} data-fs-column={index}>
        {c.title && <h2 style={headingColor ? { color: headingColor } : undefined} className={cn(headingCls, "mb-4")}>{c.title}</h2>}
        {body}
      </div>
    );
  }
  const toggle = (
    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}
      className={cn("flex w-full items-center justify-between gap-2 py-3 text-start", headingCls, live && "sm:hidden")}>
      <span>{c.title}</span>
      <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );
  return (
    <div className={cn(className, (live || phone) && "max-sm:border-b max-sm:border-current/15", phone && "border-b border-current/15")} data-fs-column={index}>
      <h2 style={headingColor ? { color: headingColor } : undefined} className={cn(!live && !phone && cn(headingCls, "mb-4"), live && cn("sm:mb-4", headingCls))}>
        {(live || phone) && toggle}
        {live && <span className="hidden sm:inline">{c.title}</span>}
        {!live && !phone && c.title}
      </h2>
      <div id={panelId} data-fs-panel="" className={cn(live && !open && "hidden sm:block", phone && !open && "hidden", (live || phone) && "max-sm:pb-4", phone && "pb-4")}>
        {body}
      </div>
    </div>
  );
}

