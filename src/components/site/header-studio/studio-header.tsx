"use client";

/**
 * Header Studio renderer (Header & Footer Studio phase 2, Nov 2026).
 *
 * Used ONLY when a site has published a studio header (site_identity
 * .header_studio, see modules/header-studio/doc.ts). Every other site keeps
 * the classic header path in (site)/layout.tsx untouched.
 *
 * Desktop: up to three rows (top bar, main, menu row) with Left / Centre /
 * Right zones. Phone (below the md or lg breakpoint): one bar with logo, up
 * to three icons and a menu button opening a side drawer, a full-screen
 * menu or a dropdown panel. Behaviour: sticky, shrink on scroll, hide on
 * scroll down, transparent over the hero (all pages, home, or chosen pages).
 *
 * Accessibility: skip link to the content, <header> banner landmark, labelled
 * <nav>s, the menu button carries aria-expanded / aria-controls, the drawer is
 * a modal dialog (side / full) with a focus trap, Esc closes it and focus goes
 * back to the button.
 *
 * `preview` (dashboard builder) forces one device layout and turns the
 * scroll behaviour off, so the preview can show phone and tablet widths
 * inside a desktop window.
 */
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/cms";
import { MobileNavList } from "@/components/blocks/navigation/nav-menu-core";
import {
  ROW_KEYS, ZONES, allElements, drawerMenuElement, firstOfType, transparentOn,
  type HeaderConfig, type HeaderElement, type HeaderRow, type HeaderRowKey,
} from "@/modules/header-studio/model";
import { HeaderElementView, SearchPanel, ICON_BTN, type ElementCtx } from "./header-elements";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

const BG: Record<HeaderRow["background"], { bg: string; fg: string; dark: boolean }> = {
  default: { bg: "hsl(var(--background))", fg: "hsl(var(--foreground))", dark: false },
  muted: { bg: "hsl(var(--muted))", fg: "hsl(var(--foreground))", dark: false },
  primary: { bg: "hsl(var(--primary))", fg: "hsl(var(--primary-foreground))", dark: true },
  dark: { bg: "#0f172a", fg: "#f8fafc", dark: true },
  transparent: { bg: "transparent", fg: "hsl(var(--foreground))", dark: false },
};

const SIZE: Record<HeaderRow["size"], string> = {
  sm: "min-h-9 py-1 text-[13px]",
  md: "min-h-16 py-2",
  lg: "min-h-20 py-3",
};

const BREAKPOINT = {
  md: { desktop: "hidden md:block", phone: "md:hidden" },
  lg: { desktop: "hidden lg:block", phone: "lg:hidden" },
} as const;

const SKIP: Record<string, { skip: string; menu: string; close: string }> = {
  en: { skip: "Skip to content", menu: "Open menu", close: "Close menu" },
  ar: { skip: "انتقل إلى المحتوى", menu: "افتح القائمة", close: "أغلق القائمة" },
  bn: { skip: "মূল অংশে যান", menu: "মেনু খুলুন", close: "মেনু বন্ধ করুন" },
};

const visibleOn = (e: HeaderElement, device: "desktop" | "mobile") => e.hideOn !== device;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function StudioHeader({ config, menus, logoUrl, logoDarkUrl, siteName, preview, previewPath = "/" }: {
  config: HeaderConfig;
  menus: Record<string, NavItem[]>;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName: string;
  preview?: PreviewDevice;
  previewPath?: string;
}) {
  const routePath = usePathname() ?? "/";
  const pathname = preview ? previewPath : routePath;
  const b = config.behaviour;
  const overlay = transparentOn(config, pathname);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();
  const searchPanelId = useId();
  const words = SKIP[lang] ?? SKIP.en;

  // Labels follow the language the header sits in (the site's lang wrapper).
  useEffect(() => {
    const code = rootRef.current?.closest("[lang]")?.getAttribute("lang")?.split("-")[0].toLowerCase();
    if (code) setLang(code);
  }, [pathname]);

  // Close the drawer and search on navigation (adjusted during render, no effect).
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    setDrawerOpen(false);
    setSearchOpen(false);
  }

  // Scroll: solid after the hero edge, shrink, hide while scrolling down.
  useEffect(() => {
    if (preview) return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (b.hideOnScroll) {
        if (y > last + 4 && y > 120) setHidden(true);
        else if (y < last - 4 || y < 120) setHidden(false);
      }
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview, b.hideOnScroll]);

  const closeDrawer = useCallback((restoreFocus = true) => {
    setDrawerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  // Drawer: focus trap, Esc, page scroll lock (side / full).
  const modal = config.mobile.drawer !== "dropdown";
  useEffect(() => {
    if (!drawerOpen) return;
    const panel = drawerRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") { ev.preventDefault(); closeDrawer(); return; }
      if (ev.key !== "Tab" || !modal || !panel) return;
      const list = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const firstEl = list[0], lastEl = list[list.length - 1];
      if (ev.shiftKey && document.activeElement === firstEl) { ev.preventDefault(); lastEl.focus(); }
      else if (!ev.shiftKey && document.activeElement === lastEl) { ev.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (modal && !preview) document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [drawerOpen, modal, preview, closeDrawer]);

  // Esc also closes the search bar.
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (ev: KeyboardEvent) => { if (ev.key === "Escape") setSearchOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const clear = overlay && !scrolled && !drawerOpen && !searchOpen;
  const shrunk = b.shrink && scrolled && !preview;
  const isHidden = b.hideOnScroll && hidden && !drawerOpen && !searchOpen;

  const ctxFor = useCallback((row: HeaderRow): ElementCtx => {
    const pal = clear ? { bg: "transparent", fg: "#ffffff", dark: true } : BG[row.background];
    return {
      fg: pal.fg, onDark: pal.dark, logoUrl, logoDarkUrl, siteName, menus,
      uppercase: config.style.uppercase, logoScale: shrunk ? 0.8 : 1,
      searchOpen, toggleSearch: () => { setDrawerOpen(false); setSearchOpen((o) => !o); }, searchPanelId,
    };
  }, [clear, logoUrl, logoDarkUrl, siteName, menus, config.style.uppercase, shrunk, searchOpen, searchPanelId]);

  const container = config.style.container;
  const inner = container === "full" ? "mx-auto w-full max-w-7xl px-4 sm:px-6" : "w-full px-4 sm:px-5";

  const rowView = (key: HeaderRowKey) => {
    const row = config.rows[key];
    if (!row.enabled) return null;
    const zones = Object.fromEntries(ZONES.map((z) => [z, row.zones[z].filter((e) => visibleOn(e, "desktop"))])) as Record<(typeof ZONES)[number], HeaderElement[]>;
    if (!zones.left.length && !zones.center.length && !zones.right.length) return null;
    const pal = clear ? { bg: "transparent", fg: "#ffffff", dark: true } : BG[row.background];
    const ctx = ctxFor(row);
    const hasCenter = zones.center.length > 0;
    const size = key === "main" && shrunk ? "min-h-14 py-1.5" : SIZE[row.size];
    return (
      <div key={key} data-hs-row={key} className={cn("transition-[padding,min-height,background-color] duration-200", row.border && !clear && "border-b border-border")}
        style={{ background: pal.bg, color: pal.fg }}>
        <div className={cn(inner, size, "items-center gap-3",
          hasCenter ? "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]" : "flex justify-between")}>
          {ZONES.map((z) => (
            (hasCenter || zones[z].length > 0 || z !== "center") && (
              <div key={z} data-hs-zone={z} className={cn("flex min-w-0 items-center gap-2",
                z === "left" ? "justify-start" : z === "center" ? "justify-center" : "justify-end",
                !hasCenter && z === "center" && "hidden")}>
                {zones[z].map((e) => <HeaderElementView key={e.id} e={e} ctx={ctx} />)}
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  // ── Phone bar ─────────────────────────────────────────────────────────
  const main = config.rows.main;
  const phoneCtx = ctxFor(main);
  const phonePal = clear ? { bg: "transparent", fg: "#ffffff" } : BG[main.background];
  const logoEl = firstOfType(config, "logo");
  const menuEl = drawerMenuElement(config, (e) => visibleOn(e, "mobile"));
  const drawerItems = menuEl ? menus[menuEl.menuId ?? ""] ?? menus[""] ?? [] : [];
  const iconEls = config.mobile.icons
    .map((t) => firstOfType(config, t) ?? ({ id: `m-${t}`, type: t } as HeaderElement))
    .filter((e) => visibleOn(e, "mobile"));
  const toggle = (
    <button ref={toggleRef} type="button" className={ICON_BTN} aria-expanded={drawerOpen} aria-controls={drawerId}
      aria-label={drawerOpen ? words.close : words.menu} onClick={() => { setSearchOpen(false); setDrawerOpen((o) => !o); }}>
      {drawerOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
    </button>
  );
  const logo = <HeaderElementView e={logoEl ?? { id: "m-logo", type: "logo" }} ctx={{ ...phoneCtx, logoScale: Math.min(1, 40 / (logoEl?.height ?? 36)) }} />;
  const icons = <div className="flex items-center justify-end gap-0.5">{iconEls.map((e) => <HeaderElementView key={e.id} e={e} ctx={phoneCtx} compact />)}</div>;
  const layout = config.mobile.layout;
  const phoneBar = (
    <div data-hs-phone-bar={layout} style={{ background: phonePal.bg, color: phonePal.fg }}
      className={cn("h-16 px-2 items-center gap-1", layout === "logo-left" ? "flex" : "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]", main.border && !clear && "border-b border-border")}>
      {layout === "logo-left" && <><div className="flex min-w-0 flex-1 items-center ps-2">{logo}</div>{icons}{toggle}</>}
      {layout === "logo-center" && <><div className="flex items-center">{toggle}</div><div className="flex min-w-0 justify-center">{logo}</div>{icons}</>}
      {layout === "menu-left" && <><div className="flex items-center gap-1 min-w-0">{toggle}{logo}</div><div />{icons}</>}
    </div>
  );

  // Drawer extras: actions, contact, language, socials from the header's own elements.
  const extras = allElements(config, { enabledOnly: true }).filter((e) => visibleOn(e, "mobile"));
  const actions = extras.filter((e) => e.type === "button" || e.type === "booking");
  const contactEls = (["phone", "whatsapp", "email"] as const).map((t) => extras.find((e) => e.type === t)).filter((e): e is HeaderElement => !!e);
  const langEl = extras.find((e) => e.type === "language");
  const socialsEl = extras.find((e) => e.type === "socials");
  const drawerCtx: ElementCtx = { ...phoneCtx, fg: "hsl(var(--foreground))", onDark: false };
  const drawerBody = (
    <>
      {drawerItems.length > 0 && (
        <nav aria-label={menuEl?.label || "Main"} className={cn(config.style.uppercase && "uppercase tracking-wide")}>
          <MobileNavList items={drawerItems} onNavigate={() => closeDrawer(false)} />
        </nav>
      )}
      {(actions.length > 0 || contactEls.length > 0 || langEl || socialsEl) && (
        <div className="space-y-4 border-t border-border px-5 py-5">
          {actions.length > 0 && (
            <div className="flex flex-col gap-2 [&>a]:w-full [&>a]:py-3">
              {actions.map((e) => <HeaderElementView key={e.id} e={e} ctx={drawerCtx} />)}
            </div>
          )}
          {contactEls.length > 0 && (
            <div className="flex flex-col gap-3 text-foreground">
              {contactEls.map((e) => <HeaderElementView key={e.id} e={{ ...e, showLabel: true }} ctx={drawerCtx} />)}
            </div>
          )}
          {(langEl || socialsEl) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-foreground">
              {langEl && <HeaderElementView e={langEl} ctx={drawerCtx} />}
              {socialsEl && <HeaderElementView e={socialsEl} ctx={drawerCtx} />}
            </div>
          )}
        </div>
      )}
    </>
  );

  const drawerStyle = config.mobile.drawer;
  const drawer = drawerOpen && (
    drawerStyle === "dropdown" ? (
      <div ref={drawerRef} id={drawerId} className="border-t border-border bg-background text-foreground shadow-lg max-h-[75vh] overflow-y-auto">
        {drawerBody}
      </div>
    ) : (
      <div className={cn(preview ? "absolute" : "fixed", "inset-0 z-[60]")} data-hs-drawer={drawerStyle}>
        {drawerStyle === "side" && <div className="absolute inset-0 bg-black/50" aria-hidden onClick={() => closeDrawer()} />}
        <div ref={drawerRef} id={drawerId} role="dialog" aria-modal="true" aria-label={menuEl?.label || words.menu}
          className={cn("absolute inset-y-0 flex flex-col bg-background text-foreground shadow-2xl",
            drawerStyle === "side" ? "start-0 w-[85%] max-w-sm" : "inset-x-0 w-full")}>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-3">
            <div className="ps-2 min-w-0"><HeaderElementView e={logoEl ?? { id: "d-logo", type: "logo" }} ctx={{ ...drawerCtx, logoScale: Math.min(1, 36 / (logoEl?.height ?? 36)) }} /></div>
            <button type="button" className={ICON_BTN} aria-label={words.close} onClick={() => closeDrawer()}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{drawerBody}</div>
        </div>
      </div>
    )
  );

  const searchEl = firstOfType(config, "search");
  const bp = BREAKPOINT[config.mobile.breakpoint];
  const showDesktop = preview ? preview === "desktop" || (preview === "tablet" && config.mobile.breakpoint === "md") : true;
  const showPhone = preview ? !showDesktop : true;

  const floating = container === "floating";
  const boxed = container === "boxed";
  const position = preview ? "relative" : overlay ? "fixed inset-x-0 top-0" : b.sticky ? "sticky top-0" : "relative";
  const frame = cn(
    floating && "mx-auto max-w-6xl overflow-hidden rounded-2xl",
    boxed && "mx-auto max-w-7xl overflow-hidden rounded-b-2xl",
    (config.style.shadow || floating) && !clear && "shadow-lg",
    floating && !clear && "border border-border/60",
  );

  return (
    <div ref={rootRef} data-header-studio={config.preset} style={{ display: "contents" }}>
      <a href="#pc-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary">
        {words.skip}
      </a>
      <header
        className={cn(position, "z-50 w-full transition-transform duration-300", floating && "px-3 pt-3", isHidden && "-translate-y-full")}
        data-transparent={clear ? "" : undefined}>
        {showDesktop && (
          <div className={cn(!preview && bp.desktop)}>
            <div className={frame}>{ROW_KEYS.map(rowView)}</div>
          </div>
        )}
        {showPhone && (
          <div className={cn(!preview && bp.phone)}>
            <div className={cn(floating && "overflow-hidden rounded-2xl", (config.style.shadow || floating) && !clear && "shadow-lg")}>{phoneBar}</div>
            {drawer}
          </div>
        )}
        {searchEl !== undefined || config.mobile.icons.includes("search")
          ? <SearchPanel id={searchPanelId} open={searchOpen} placeholder={searchEl?.label} />
          : null}
      </header>
      <div id="pc-main-content" tabIndex={-1} className="outline-none" />
    </div>
  );
}
