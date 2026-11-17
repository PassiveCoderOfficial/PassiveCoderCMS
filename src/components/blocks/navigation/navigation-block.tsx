"use client";
import { NavTopBar } from "./nav-top-bar";
import { LanguageSwitch } from "@/components/site/language-switch";

import { SearchSuggestions } from "@/components/site/search-suggestions";
import React, { useState, useEffect, useRef } from "react";
import type { NavigationBlockProps } from "@/types/cms";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { Menu, X, ShoppingCart, Search, User, Truck, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSiteContact, waLink, telLink } from "@/components/site/site-contact-context";
import { WaIcon } from "@/components/blocks/_primitives/showcase";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart/cart-context";
import { BrandLogo } from "@/components/site/brand-logo";
import { NavItemDesktop, MobileNavList } from "./nav-menu-core";
import { SocialIcon } from "@/components/blocks/_primitives/social-icons";
import { uiText } from "@/modules/page-builder/ui-text";
import { AccountMenu } from "@/components/site/account-menu";

// Dropdown/mega-menu, desktop item, and mobile-drawer rendering moved to
// ./nav-menu-core.tsx (2026-09-06) — shared with the new independent
// header_nav sub-block so there's one implementation of menu rendering, not
// two that quietly drift apart. This file still owns logo/CTA/cart, which
// header_nav deliberately does NOT (those are now separate header
// sub-blocks) — see project_block_editor_bugs memory.

/** Phone-row labels; the page's language comes from its path (/ar/...). */
const MH_LABELS: Record<string, { search: string; call: string; account: string; track: string }> = {
  en: { search: "Search", call: "Call us", account: "My account", track: "Track your order" },
  ar: { search: "بحث", call: "اتصل بنا", account: "حسابي", track: "تتبّع طلبك" },
};
/** One phone-row icon button: a 44px square hit area. */
const MH_BTN = "relative inline-flex items-center justify-center h-11 w-11 shrink-0 rounded-lg hover:bg-current/10 transition-colors";

export function NavigationBlock({ block, identityLogo }: {
  block: NavigationBlockProps;
  identityLogo?: string | null;
  identityLogoDark?: string | null;
}) {
  const { data } = block;
  const {
    logoText, logoUrl, items, sticky, transparent, style,
    backgroundColor, textColor, activeColor,
    logoHeight, showCta, ctaLabel, ctaUrl, showBooking, bookingLabel, bookingUrl,
    colorMode, scrollAware, glass, ctaVariant, secondaryCtaLabel, secondaryCtaUrl,
    floating, showCart, logoCaption,
    showSearch, searchPlaceholder, searchButtonLabel, showAccount, trackOrderUrl, topRowBackground, menuUppercase,
    searchStyle, menuRowBackground, searchScope, searchCategoryFilter, searchSuggestLimit,
  } = data;
  const logo = data.logo || identityLogo || null;
  const nativeLang = data.languageSwitchMode === "native" ? data.languageSwitch : undefined;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [tabletSearchOpen, setTabletSearchOpen] = useState(false);
  const mobileLayout = data.mobileLayout && data.mobileLayout !== "default" ? data.mobileLayout : null;
  const pathname = usePathname() ?? "/";
  // Phone-row labels follow the language the header sits in (the page's
  // lang wrapper), so an Arabic-first site's "/" gets Arabic labels and its
  // /en pages English ones; the first path segment is the pre-mount guess.
  const [chromeLang, setChromeLang] = useState<string | null>(null);
  const mhT = MH_LABELS[chromeLang ?? ""] ?? MH_LABELS[pathname.split("/")[1] ?? ""] ?? MH_LABELS.en;
  const mhLang = MH_LABELS[chromeLang ?? ""] ? chromeLang! : MH_LABELS[pathname.split("/")[1] ?? ""] ? pathname.split("/")[1] : "en";
  // Cart icon: the side cart (default) or straight to the /cart page.
  const cartPage = data.cartOpens === "page";
  // Own words from the settings panel; empty keeps the built-in (page-language) wording.
  const t = uiText("navigation", data);
  const contact = useSiteContact();
  const [scrolled, setScrolled] = useState(false);
  // "Menu row only" sticky: pin the header at minus the logo row's height,
  // so the logo row scrolls away and the menu row stays on screen.
  const topRowRef = useRef<HTMLDivElement>(null);
  const [topRowH, setTopRowH] = useState(0);
  useEffect(() => {
    const el = topRowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setTopRowH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { itemCount, openCart } = useCart();
  // The drawer's dim overlay starts at the nav's bottom edge, measured live:
  // a top bar (or a part-scrolled sticky header) moves that edge, and a fixed
  // offset left the overlay covering the lower header and its close button.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const code = navRef.current?.closest("[lang]")?.getAttribute("lang")?.split("-")[0].toLowerCase();
    setChromeLang(code || null);
  }, [pathname]);
  const [overlayTop, setOverlayTop] = useState<number | null>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const measure = () => {
      const el = navRef.current;
      if (el) setOverlayTop(Math.max(0, Math.round(el.getBoundingClientRect().bottom)));
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { window.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [mobileOpen]);

  const tokenMode = colorMode !== "legacy"; // default to modern token mode
  const overlayHero = scrollAware ?? transparent; // scroll-aware implies transparent-at-top

  useEffect(() => {
    if (!overlayHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayHero]);

  // Solid = not in transparent-over-hero state.
  const solid = !overlayHero || scrolled;
  // Search target: only products -> the shop page; anything else (or unset) -> /search.
  const searchAction = searchScope?.length === 1 && searchScope[0] === "products" ? "/shop" : "/search";
  // Live suggestions: the chosen scope, or (unset) everything the site's modules allow.
  const suggestTypes = searchScope?.length ? searchScope.map((x) => x.replace(/s$/, "").replace(/ie$/, "y")) : undefined;
  const suggestions = <SearchSuggestions types={suggestTypes} limit={searchSuggestLimit ?? 5} />;
  const [searchCats, setSearchCats] = useState<{ slug: string; name: string }[]>([]);
  useEffect(() => {
    if (!showSearch || !searchCategoryFilter) return;
    import("@/lib/supabase/client").then(({ createClient }) => import("@/lib/tenant/client").then(({ getClientTenantId }) =>
      getClientTenantId().then((tid) => {
        if (!tid) return;
        createClient().from("categories").select("slug, name").eq("tenant_id", tid).eq("type", "product").is("parent_id", null).order("order_index")
          .then(({ data }) => setSearchCats(data ?? []));
      })));
  }, [showSearch, searchCategoryFilter]);
  const searchExtras = (
    <>
      {searchAction === "/search" && !!searchScope?.length && <input type="hidden" name="in" value={searchScope.join(",")} />}
      {searchCategoryFilter && searchCats.length > 0 && (
        <select name="category" aria-label="Category" defaultValue="" className="max-w-[8.5rem] bg-transparent text-[0.8rem] outline-none border-l border-current/20 pl-2 opacity-80" style={{ color: "inherit" }}>
          <option value="">{t("searchAllLabel")}</option>
          {searchCats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      )}
    </>
  );
  // Logo-left styles had no desktop search box at all; draw one in the main row.
  const inlineSearch = !!showSearch && style !== "logo-center" && style !== "logo-center-inline";
  const logoH = logoHeight ?? 34;
  // The logo lockup, shared by the desktop row and the phone row (smaller there).
  const renderLogo = (h: number, imgPos = "object-left") => (
    <>
    {logo ? (
      <Image src={logo} alt={logoText ?? "Logo"} width={h * 3.4} height={h} style={{ height: h, maxWidth: "100%" }} className={cn("w-auto min-w-0 object-contain", imgPos)} />
    ) : data.useBrandMark ? (
      <BrandLogo
        size={h}
        text={logoText ?? "Brand"}
        textColor={fg}
        // SVG fills need a literal color — hsl(var(--x)) doesn't
        // resolve reliably as an SVG attribute. Use the block's
        // explicit activeColor when set, else BrandLogo's default.
        {...(activeColor ? { color: activeColor } : {})}
      />
    ) : (
      <>
      {data.logoIconUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.logoIconUrl} alt="" style={{ height: h, width: "auto" }} className="shrink-0 object-contain" />
      )}
      <span className="text-[1.15rem] font-extrabold tracking-tight" style={{ color: fg, fontFamily: "var(--heading-font, inherit)" }}>
        {logoText ?? "Brand"}
      </span>
      </>
    )}
    {logoCaption && (
      <span className="hidden sm:inline text-[0.68rem] leading-tight opacity-60 border-l pl-2 ml-0.5" style={{ color: fg, borderColor: fg }}>
        {logoCaption}
      </span>
    )}
    </>
  );
  // "logo-center": logo sits in the middle of the top row, menu on its own
  // centered row underneath (desktop). Mobile keeps logo centered + toggle right.
  const logoCenter = style === "logo-center";
  // "logo-center-inline": a single row, menu left, logo centre, socials right.
  const logoInline = style === "logo-center-inline";

  // Colors are token-driven so each tenant's own template palette /
  // color_overrides drive the nav — never hardcode a brand hex here, it
  // would leak one client's brand onto every other tenant's site.
  // activeColor/backgroundColor block props still override the tokens.
  const BRAND_PRIMARY = "hsl(var(--primary))";
  const barBg = !solid
    ? "transparent"
    : tokenMode
      ? (glass ? "hsl(var(--background) / 0.88)" : "hsl(var(--background))")
      : (backgroundColor ?? "hsl(var(--secondary))");
  const fg = !solid
    ? "#ffffff"
    : tokenMode ? "hsl(var(--foreground))" : (textColor ?? "#ffffff");
  const accent = activeColor ?? (tokenMode ? BRAND_PRIMARY : fg);
  // Built after `fg` exists — referencing it earlier is a TDZ crash that
  // takes down every site header (happened in v1.0.442).
  const desktopItems = items.map((item) => (
    <NavItemDesktop key={item.id} item={item} currentColor={fg} />
  ));

  const ctaV = ctaVariant ?? "gradient";
  // No display class here — each call site sets its own responsive display
  // (e.g. "hidden md:inline-flex"). Including `inline-flex` made tailwind-merge
  // drop the `hidden`, so the desktop CTA rendered on mobile and overflowed
  // the header.
  const ctaClasses = "items-center px-5 py-2.5 text-[length:var(--nav-cta-fs,0.9rem)] font-semibold rounded-full transition-all hover:-translate-y-0.5";
  const ctaShadow = "0 8px 20px -6px hsl(var(--primary) / 0.45)";
  const ctaStyleObj: React.CSSProperties =
    ctaV === "outline"
      ? { background: "transparent", color: solid ? accent : "#fff", border: `1.5px solid ${solid ? BRAND_PRIMARY : "rgba(255,255,255,0.6)"}` }
      : ctaV === "solid"
        ? { background: BRAND_PRIMARY, color: "hsl(var(--primary-foreground))", boxShadow: ctaShadow }
        : { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: ctaShadow };
  // Per-site button colour: a filled button in that colour (outline keeps
  // its border in it). Unset = the variant's brand colours, as before.
  if (data.ctaColor) {
    if (ctaV === "outline") Object.assign(ctaStyleObj, { borderColor: data.ctaColor, color: data.ctaTextColor || data.ctaColor });
    else Object.assign(ctaStyleObj, { background: data.ctaColor, backgroundImage: "none", color: data.ctaTextColor || "#ffffff", boxShadow: `0 8px 20px -6px color-mix(in srgb, ${data.ctaColor} 55%, transparent)` });
  } else if (data.ctaTextColor) ctaStyleObj.color = data.ctaTextColor;

  // Overlay mode (scrollAware): the bar is FIXED across the top so it floats
  // over the hero instead of consuming layout height above it (which caused an
  // ugly white strip). It stays fixed and just swaps transparent → solid/glass
  // on scroll — no layout jump. Pages using this must open with a full-height
  // hero (content flows under the fixed bar), which every marketplace page does.
  // Non-overlay navs stay plain sticky in flow.
  const showTopBar = !!block.data.topBar && block.data.topBar.show !== false && !overlayHero;
  const menuRowOnly = sticky && block.data.stickyRows === "menu" && style === "logo-center";
  // Keeping the top bar pinned: the wrapper below is the sticky element instead of the nav.
  const pinTopBar = sticky && showTopBar && !!block.data.stickyTopBar && !overlayHero;
  const navSticky = sticky && !pinTopBar && !overlayHero;
  // ── Phone header row (mobileLayout) ──────────────────────────────────
  // Rendered only below md and only when a layout is chosen; the desktop row
  // above is then hidden on phones but otherwise untouched.
  const hasCart = showCart !== false;
  const phoneHref = telLink(contact.phone);
  const waHref = waLink(contact.whatsapp || contact.phone, block.data.topBar?.whatsappText || undefined);
  const toggleMenu = () => { setMobileSearchOpen(false); setMobileOpen((o) => !o); };
  type MhKey = "search" | "cart" | "account" | "call" | "whatsapp" | "cta";
  const mhIcons: MhKey[] = (() => {
    if (!mobileLayout) return [];
    const shop: MhKey[] = [...(showSearch ? ["search" as const] : []), ...(hasCart ? ["cart" as const] : [])];
    const contactIcons: MhKey[] = [...(phoneHref ? ["call" as const] : []), ...(waHref ? ["whatsapp" as const] : [])];
    if (mobileLayout === "spaced") {
      return [...(showSearch ? ["search" as const] : []), ...(showAccount ? ["account" as const] : []), ...(hasCart ? ["cart" as const] : contactIcons)];
    }
    const cta: MhKey[] = showCta && ctaLabel && ctaUrl ? ["cta"] : [];
    // Shops lead with search + cart; service sites with call + WhatsApp.
    const order = mobileLayout === "centered-logo"
      ? (hasCart ? [...shop, ...contactIcons] : [...contactIcons, ...shop])
      : (hasCart ? [...shop, ...contactIcons] : [...contactIcons, ...shop, ...cta]);
    return order.slice(0, 2);
  })();
  const mhIcon = (k: MhKey) => {
    switch (k) {
      case "search":
        return (
          <button key={k} type="button" className={MH_BTN} aria-label={mhT.search} aria-expanded={mobileSearchOpen}
            onClick={() => { setMobileOpen(false); setMobileSearchOpen((o) => !o); }}>
            <Search className="h-5 w-5" />
          </button>
        );
      case "cart":
        return (
          <button key={k} type="button" onClick={cartPage ? () => { window.location.href = "/cart"; } : openCart} className={MH_BTN} aria-label="Open cart">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: BRAND_PRIMARY }}>
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        );
      case "account":
        return <Link key={k} href="/account" aria-label={mhT.account} className={MH_BTN}><User className="h-5 w-5" /></Link>;
      case "call":
        return <a key={k} href={phoneHref!} aria-label={mhT.call} className={MH_BTN}><Phone className="h-5 w-5" /></a>;
      case "whatsapp":
        return (
          <a key={k} href={waHref!} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={MH_BTN}>
            <WaIcon className="h-[22px] w-[22px] text-[#25D366]" />
          </a>
        );
      case "cta":
        return (
          <Link key={k} href={ctaUrl!} className="inline-flex items-center h-9 px-3 rounded-full text-xs font-semibold whitespace-nowrap shrink-0" style={ctaStyleObj}>
            {ctaLabel}
          </Link>
        );
    }
  };
  // Phones: language button beside the menu button (langSwitcherMobile "beside-menu"),
  // instead of inside the drawer. Default keeps the old placement.
  const langBeside = block.data.langSwitcherMobile === "beside-menu" && !!block.data.languageSwitch;
  const mhLangPill = langBeside && (
    <LanguageSwitch other={block.data.languageSwitch!} mode={block.data.languageSwitchMode} url={block.data.languageSwitchUrl} short
      className="inline-flex items-center gap-1 h-8 px-2.5 shrink-0 rounded-full text-xs font-semibold border border-current/30 hover:bg-current/10 whitespace-nowrap" style={{ color: fg }} />
  );
  const mhMenuBtn = (
    <button type="button" className={MH_BTN} onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={mobileOpen}>
      {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
  // Phone logo: never taller than the row, and shrinks (keeping its shape) to fit.
  const mhLogoH = Math.min(logoH, 56);
  const mhSide = langBeside ? `max(${Math.max(1, mhIcons.length) * 2.75}rem, 7rem)` : `${Math.max(1, mhIcons.length) * 2.75}rem`;
  const mobileRow = mobileLayout && (
    <div data-mobile-header={mobileLayout}
      className={cn(
        "md:hidden h-[4.5rem] items-center",
        // Side padding: the 44px buttons carry their own inner space, so the
        // row sits slightly wider than the content column.
        floating || !(logoCenter && topRowBackground) ? "-mx-2" : "px-2",
        mobileLayout === "centered-logo" ? "grid gap-1" : mobileLayout === "menu-left" ? "grid grid-cols-[auto_minmax(0,1fr)_auto] gap-1" : "flex gap-1",
        floating && solid && "rounded-2xl px-2 mx-0 border border-border/60 h-16 backdrop-blur-xl",
      )}
      style={{
        ...(mobileLayout === "centered-logo" ? { gridTemplateColumns: `${mhSide} minmax(0,1fr) ${mhSide}` } : {}),
        ...(floating && solid
          ? { background: glass ? "hsl(var(--card) / 0.8)" : "hsl(var(--card))", boxShadow: "var(--shadow-md)" }
          : logoCenter && topRowBackground ? { background: topRowBackground } : {}),
      }}
    >
      {mobileLayout !== "spaced" && <div className="flex items-center gap-0.5">{mhMenuBtn}{mhLangPill}</div>}
      <Link href={logoUrl ?? "/"} data-mh-logo=""
        className={cn("flex items-center gap-2 min-w-0 overflow-hidden",
          mobileLayout === "centered-logo" ? "justify-self-center justify-center max-w-full" : "flex-1 justify-start ps-1")}>
        {renderLogo(mhLogoH, mobileLayout === "centered-logo" ? "object-center" : "object-left rtl:object-right")}
      </Link>
      <div className={cn("flex items-center justify-end gap-0", mobileLayout === "spaced" && "gap-1")}>
        {mhIcons.map(mhIcon)}
        {mobileLayout === "spaced" && mhLangPill}
        {mobileLayout === "spaced" && mhMenuBtn}
      </div>
    </div>
  );
  const mobileSearchPanel = mobileLayout && showSearch && mobileSearchOpen && (
    <div className="md:hidden absolute left-0 right-0 top-full z-50 border-t border-border shadow-xl p-3" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}>
      <form action={searchAction} role="search" className="relative flex items-center gap-2 rounded-full border border-border px-4 py-2.5">
        <Search className="h-4 w-4 shrink-0 opacity-60" />
        <input name="q" autoFocus placeholder={searchPlaceholder || mhT.search} aria-label={mhT.search} className="flex-1 min-w-0 bg-transparent text-base outline-none" />
        {searchExtras}
        {suggestions}
      </form>
    </div>
  );
  // What the phone row leaves out goes to the bottom of the drawer.
  const drawerAccount = !!mobileLayout && showAccount && !mhIcons.includes("account");
  const drawerTrack = !!mobileLayout && !!trackOrderUrl;
  const drawerGoogleLang = !!mobileLayout && !!block.data.languageSwitch && !nativeLang && !langBeside;
  const drawerNativeLang = langBeside ? undefined : nativeLang;
  const drawerLinkCls = "flex items-center justify-center gap-2 px-4 py-3 rounded-full text-[0.95rem] font-medium border border-border text-foreground";

  const content = (
    <>
    {showTopBar && <NavTopBar bar={block.data.topBar!} />}
    <nav
      ref={navRef}
      className={cn(
        "relative w-full z-50 transition-all duration-300",
        block.data.menuFontSize && "pc-nav-fs", block.data.menuFontWeight && "pc-nav-fw", block.data.ctaFontSize && "pc-nav-cta",
        overlayHero ? "fixed top-0 left-0 right-0" : navSticky && "sticky",
        solid && !floating && "border-b border-border/60",
        solid && glass && "backdrop-blur-xl",
      )}
      style={{
        ...(navSticky ? { top: menuRowOnly ? -topRowH : 0 } : {}),
        ...(block.data.menuFontSize ? { ["--nav-fs" as string]: `${block.data.menuFontSize}px` } : {}),
        ...(block.data.menuFontWeight ? { ["--nav-fw" as string]: block.data.menuFontWeight } : {}),
        ...(block.data.menuGap !== undefined ? { ["--nav-gap" as string]: `${block.data.menuGap}px` } : {}),
        ...(block.data.ctaFontSize ? { ["--nav-cta-fs" as string]: `${block.data.ctaFontSize}px` } : {}),
        background: floating || !solid ? "transparent" : barBg,
        color: fg,
        boxShadow: solid && !floating ? "var(--shadow-sm)" : undefined,
      }}
    >
      <div className={cn("mx-auto", floating ? "max-w-6xl pt-3 px-4 sm:px-6" : logoCenter && topRowBackground ? "" : "max-w-7xl px-4 sm:px-6")}>
        {mobileRow}
        <div ref={topRowRef}
          className={cn(
            mobileLayout && "max-md:hidden",
            logoCenter || logoInline
              ? "grid grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 sm:gap-4 py-3 min-h-[4.5rem] transition-all"
              : "flex items-center h-[4.5rem] gap-2 sm:gap-4 min-w-0 transition-all",
            floating && solid && "rounded-2xl px-5 border border-border/60 h-16 backdrop-blur-xl",
            style === "centered" && "justify-between",
          )}
          style={floating && solid
            ? { background: glass ? "hsl(var(--card) / 0.8)" : "hsl(var(--card))", boxShadow: "var(--shadow-md)" }
            : logoCenter && topRowBackground
              // Full-bleed band; the padding keeps content on the same 80rem column as the menu row.
              ? { background: topRowBackground, paddingInline: "max(1rem, calc((100% - 80rem) / 2 + 1.5rem))" }
              : undefined}
        >
          {logoCenter && (showSearch ? searchStyle === "plain" ? (
            // Plain: magnifier + borderless field, no button (Enter searches).
            <form action={searchAction} role="search" className="relative hidden md:flex items-center max-w-[24rem] w-full gap-3" style={{ color: fg }}>
              <button type="submit" aria-label={mhT.search} className="shrink-0 -m-1 p-1 rounded-full cursor-pointer hover:bg-current/10 transition-colors">
                <Search className="h-6 w-6" />
              </button>
              <input name="q" placeholder={searchPlaceholder || "Search"} aria-label="Search"
                className="flex-1 min-w-0 bg-transparent text-[0.95rem] outline-none placeholder:opacity-80" />
              {searchExtras}
              {suggestions}
            </form>
          ) : (
            <form action={searchAction} role="search" className="relative hidden md:flex items-center max-w-[26rem] w-full rounded-full bg-white border border-black/10 pl-4 pr-1 py-1 shadow-sm text-neutral-800">
              <button type="submit" aria-label={mhT.search} className="shrink-0 cursor-pointer text-neutral-500 hover:text-neutral-800 transition-colors">
                <Search className="h-4 w-4" />
              </button>
              <input name="q" placeholder={searchPlaceholder || "Search"} aria-label="Search"
                className="flex-1 min-w-0 bg-transparent px-2.5 text-[0.9rem] text-neutral-800 placeholder:text-neutral-500 outline-none" />
              {searchExtras}
              {suggestions}
              <button className="rounded-full px-5 py-2 text-[0.78rem] font-semibold uppercase tracking-wide" style={{ background: BRAND_PRIMARY, color: "hsl(var(--primary-foreground))" }}>
                {searchButtonLabel || "Search"}
              </button>
            </form>
          ) : <div aria-hidden />)}
          {logoCenter && showSearch && <div aria-hidden className="md:hidden" />}
          {logoInline && (
            <>
              <ul className="hidden md:flex flex-wrap items-center gap-[var(--nav-gap,2px)] justify-self-start min-w-0">{desktopItems}</ul>
              <div aria-hidden className="md:hidden" />
            </>
          )}
          {/* Logo */}
          {/* The logo may shrink (keeping its shape) so a wide lockup never pushes
              the cart / menu button off a phone screen; it stays full size once
              there is room. */}
          <Link href={logoUrl ?? "/"} className={cn("flex items-center gap-2 min-w-0 shrink", (logoCenter || logoInline) && "justify-self-center max-w-full")}>
            {renderLogo(logoH)}
          </Link>

          {/* Desktop nav */}
          {!logoCenter && !logoInline && (
            <ul className={cn(
              "hidden md:flex items-center gap-[var(--nav-gap,2px)]",
              style === "centered" ? "mx-auto" : "ml-4 flex-1",
              inlineSearch && style !== "centered" && "lg:flex-none",
            )}>
              {desktopItems}
            </ul>
          )}

          {/* Search for the logo-left styles: a field in the free space on
              desktop, an icon that opens a panel under the header on tablets. */}
          {inlineSearch && (
            <>
              <form action={searchAction} role="search"
                className="relative hidden lg:flex items-center flex-1 min-w-[11rem] max-w-[22rem] ml-auto gap-2 rounded-full border border-current/20 px-4 py-2 transition-colors focus-within:border-current/50"
                style={{ color: fg }}>
                <Search className="h-4 w-4 shrink-0 opacity-60" />
                <input name="q" placeholder={searchPlaceholder || mhT.search} aria-label={mhT.search}
                  className="flex-1 min-w-0 bg-transparent text-[0.9rem] outline-none placeholder:opacity-60" />
                {searchExtras}
                {suggestions}
              </form>
              <button type="button" aria-label={mhT.search} aria-expanded={tabletSearchOpen}
                onClick={() => { setMobileOpen(false); setTabletSearchOpen((o) => !o); }}
                className="hidden md:inline-flex lg:hidden p-2 rounded-lg hover:bg-current/10 transition-colors shrink-0 ml-auto" style={{ color: fg }}>
                <Search className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Right cluster */}
          <div className={cn("flex items-center gap-2 shrink-0", logoCenter || logoInline ? "justify-self-end" : "ml-auto")}>
            {logoInline && (contact.socials?.length ?? 0) > 0 && (
              <div className="hidden md:flex items-center gap-1">
                {contact.socials!.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-current/10 transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px]" style={{ color: fg }}>
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>
            )}
            {secondaryCtaLabel && secondaryCtaUrl && (
              <Link href={secondaryCtaUrl} className="hidden lg:inline-flex items-center px-3.5 py-2 text-[0.9rem] font-medium rounded-lg transition-colors hover:bg-current/5" style={{ color: fg, opacity: 0.85 }}>
                {secondaryCtaLabel}
              </Link>
            )}
            {showCta && ctaLabel && ctaUrl && !(showBooking && ctaUrl === (bookingUrl || "/book")) && (
              <Link href={ctaUrl} className={cn(data.hideCtaOnTablet ? "hidden lg:inline-flex" : "hidden md:inline-flex", ctaClasses)} style={ctaStyleObj}>
                {ctaLabel}
              </Link>
            )}
            {showBooking && (
              <Link href={bookingUrl || "/book"} className={cn("hidden md:inline-flex", ctaClasses)} style={ctaStyleObj}>
                {bookingLabel || "Book now"}
              </Link>
            )}

            {block.data.languageSwitch && (
              <LanguageSwitch other={block.data.languageSwitch} mode={block.data.languageSwitchMode} url={block.data.languageSwitchUrl} className={cn(langBeside ? "hidden md:inline-flex" : "hidden sm:inline-flex", "items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border border-current/30 hover:bg-current/10")} style={{ color: fg }} />
            )}
            {showAccount && <AccountMenu lang={mhLang} color={fg} />}
            {trackOrderUrl && (
              <Link href={trackOrderUrl} aria-label="Track your order" className="hidden sm:inline-flex p-2 rounded-lg hover:bg-current/10 transition-colors" style={{ color: fg }}>
                <Truck className="h-5 w-5" />
              </Link>
            )}
            {showCart !== false && (
              <button
                onClick={cartPage ? () => { window.location.href = "/cart"; } : openCart}
                className="relative p-2 rounded-lg hover:bg-current/10 transition-colors shrink-0"
                style={{ color: fg }}
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none" style={{ background: BRAND_PRIMARY }}>
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            )}

            {langBeside && !mobileLayout && <span className="md:hidden inline-flex">{mhLangPill}</span>}
            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-current/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: fg }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {logoCenter && (
          <div className={cn(menuRowBackground ? "hidden md:block border-t border-black/80" : "contents")} style={menuRowBackground ? { background: menuRowBackground } : undefined}>
            <ul className={cn("hidden md:flex flex-wrap items-center justify-center py-1.5", !menuRowBackground && "border-t border-border/60", menuUppercase ? "gap-[var(--nav-gap,4px)] xl:gap-[var(--nav-gap,12px)] uppercase tracking-[0.02em] [&_a]:whitespace-nowrap [&_button]:whitespace-nowrap [--nav-fs-d:14px]" : "gap-[var(--nav-gap,2px)]", topRowBackground && "max-w-7xl mx-auto px-4 sm:px-6")}>
              {desktopItems}
            </ul>
          </div>
        )}
      </div>
      {mobileSearchPanel}
      {inlineSearch && tabletSearchOpen && (
        <div className="hidden md:block lg:hidden absolute left-0 right-0 top-full z-50 border-t border-border shadow-xl p-3" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}>
          <form action={searchAction} role="search" className="relative max-w-xl mx-auto flex items-center gap-2 rounded-full border border-border px-4 py-2.5">
            <Search className="h-4 w-4 shrink-0 opacity-60" />
            <input name="q" autoFocus placeholder={searchPlaceholder || mhT.search} aria-label={mhT.search} className="flex-1 min-w-0 bg-transparent text-base outline-none" />
            {searchExtras}
            {suggestions}
          </form>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 top-[4.5rem] bg-black/40 z-40 animate-in fade-in" style={overlayTop !== null ? { top: overlayTop } : undefined} onClick={() => setMobileOpen(false)} />
          <div className="md:hidden absolute left-0 right-0 top-full z-50 border-t border-border shadow-2xl animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}>
            {showSearch && (
              <form action={searchAction} role="search" className="relative mx-4 mt-4 flex items-center gap-2 rounded-full border border-border px-4 py-2">
                <Search className="h-4 w-4 shrink-0 opacity-60" />
                <input name="q" placeholder={searchPlaceholder || "Search"} aria-label="Search" className="flex-1 min-w-0 bg-transparent text-sm outline-none" />
                {searchExtras}
              {suggestions}
              </form>
            )}
            <MobileNavList
              items={items}
              onNavigate={() => setMobileOpen(false)}
              extraFooter={
                (showCta && ctaLabel && ctaUrl) || (secondaryCtaLabel && secondaryCtaUrl) || showBooking || drawerNativeLang || drawerAccount || drawerTrack || drawerGoogleLang ? (
                  <>
                    {drawerGoogleLang && (
                      <LanguageSwitch other={block.data.languageSwitch!} mode={block.data.languageSwitchMode} url={block.data.languageSwitchUrl} className={drawerLinkCls} />
                    )}
                    {/* The header pill is hidden on phones; a native language link lives in the drawer. */}
                    {drawerNativeLang && (
                      <LanguageSwitch other={drawerNativeLang} mode="native" url={block.data.languageSwitchUrl} onNavigate={() => setMobileOpen(false)}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-full text-[0.95rem] font-semibold border border-border text-foreground" />
                    )}
                    {showBooking && (
                      <Link href={bookingUrl || "/book"} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-semibold" style={{ backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: "0 8px 20px -6px hsl(var(--primary) / 0.45)" }} onClick={() => setMobileOpen(false)}>
                        {bookingLabel || "Book now"}
                      </Link>
                    )}
                    {showCta && ctaLabel && ctaUrl && (
                      <Link href={ctaUrl} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-semibold" style={data.ctaColor ? { background: data.ctaColor, color: data.ctaTextColor || "#ffffff" } : { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))", boxShadow: "0 8px 20px -6px hsl(var(--primary) / 0.45)" }} onClick={() => setMobileOpen(false)}>
                        {ctaLabel}
                      </Link>
                    )}
                    {secondaryCtaLabel && secondaryCtaUrl && (
                      <Link href={secondaryCtaUrl} className="flex items-center justify-center px-4 py-3 rounded-full text-[0.95rem] font-medium border border-border text-foreground" onClick={() => setMobileOpen(false)}>
                        {secondaryCtaLabel}
                      </Link>
                    )}
                    {(drawerAccount || drawerTrack) && (
                      <div className={cn("grid gap-2", drawerAccount && drawerTrack && "grid-cols-2")}>
                        {drawerAccount && <Link href="/account" className={drawerLinkCls} onClick={() => setMobileOpen(false)}><User className="h-4 w-4" />{t.own("accountLabel") ?? mhT.account}</Link>}
                        {drawerTrack && <Link href={trackOrderUrl!} className={drawerLinkCls} onClick={() => setMobileOpen(false)}><Truck className="h-4 w-4" />{t.own("trackOrderLabel") ?? mhT.track}</Link>}
                      </div>
                    )}
                  </>
                ) : undefined
              }
            />
          </div>
        </>
      )}
    </nav>
    </>
  );
  return pinTopBar ? <div className="sticky top-0 z-50">{content}</div> : content;
}
