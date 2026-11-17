"use client";

/**
 * Header Studio elements (Header & Footer Studio phase 2). One component per
 * header-only element. Contact elements fall back to the site's contact
 * details (SiteContactProvider), the logo to Site Identity, menus render
 * through the phase-1 menu renderer (NavItemDesktop: legacy items keep the
 * legacy markup, studio items get dropdowns / mega menus / keyboard).
 */
import React from "react";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { CalendarCheck, Mail, Phone, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/cms";
import { useCart } from "@/lib/cart/cart-context";
import { useSiteContact, waLink, telLink } from "@/components/site/site-contact-context";
import { WaIcon } from "@/components/blocks/_primitives/showcase";
import { SocialIcon, SOCIAL_LABELS } from "@/components/blocks/_primitives/social-icons";
import { LanguageSwitch } from "@/components/site/language-switch";
import { SearchSuggestions } from "@/components/site/search-suggestions";
import { NavItemDesktop } from "@/components/blocks/navigation/nav-menu-core";
import { splitItems, type ButtonVariant, type HeaderElement } from "@/modules/header-studio/model";

export const ICON_BTN = "relative inline-flex items-center justify-center h-10 w-10 shrink-0 rounded-lg hover:bg-current/10 transition-colors";

export type ElementCtx = {
  /** Text colour of the row (menus need it for their current-page underline). */
  fg: string;
  /** The row paints a dark surface (dark/primary background or transparent over a hero). */
  onDark: boolean;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  siteName: string;
  menus: Record<string, NavItem[]>;
  uppercase: boolean;
  /** Logo scale while the header is shrunk. */
  logoScale: number;
  searchOpen: boolean;
  toggleSearch: () => void;
  searchPanelId: string;
};

export function buttonStyle(variant: ButtonVariant | undefined, onDark: boolean): { className: string; style?: React.CSSProperties } {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all hover:-translate-y-px shrink-0";
  switch (variant) {
    case "outline":
      return { className: cn(base, "border-[1.5px]"), style: onDark ? { borderColor: "currentColor", color: "inherit" } : { borderColor: "hsl(var(--primary))", color: "hsl(var(--primary))" } };
    case "ghost":
      return { className: cn(base, "hover:bg-current/10"), style: { color: "inherit" } };
    case "gradient":
      return { className: base, style: { backgroundImage: "var(--brand-gradient, linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%))", color: "hsl(var(--primary-foreground))" } };
    default:
      return { className: base, style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } };
  }
}

export function contactValue(e: HeaderElement, contact: ReturnType<typeof useSiteContact>): string | null {
  if (e.value) return e.value;
  if (e.type === "phone") return contact.phone ?? null;
  if (e.type === "whatsapp") return contact.whatsapp || contact.phone || null;
  if (e.type === "email") return contact.email ?? null;
  return null;
}

export function LogoElement({ e, ctx }: { e: HeaderElement; ctx: ElementCtx }) {
  const h = Math.round((e.height ?? 36) * ctx.logoScale);
  const src = e.imageUrl || (ctx.onDark && ctx.logoDarkUrl) || ctx.logoUrl || null;
  return (
    <Link href="/" aria-label={ctx.siteName ? `${ctx.siteName}, home` : "Home"} className="flex items-center gap-2 min-w-0 shrink-0" data-hs-logo="">
      {src ? (
        <Image src={src} alt={ctx.siteName || "Logo"} width={Math.round(h * 3.4)} height={h} style={{ height: h, maxWidth: "100%", transition: "height .2s" }} className="w-auto min-w-0 object-contain" />
      ) : null}
      {(!src || e.showName) && (
        <span className="text-[1.15rem] font-extrabold tracking-tight truncate" style={{ fontFamily: "var(--heading-font, inherit)" }}>{ctx.siteName || "Your Business"}</span>
      )}
    </Link>
  );
}

export function MenuElement({ e, ctx }: { e: HeaderElement; ctx: ElementCtx }) {
  // A menu that no longer exists falls back to the header menu (same rule as the server's pickMenu).
  const items = splitItems(ctx.menus[e.menuId ?? ""] ?? ctx.menus[""] ?? [], e.menuPart);
  if (!items.length) return null;
  return (
    <nav aria-label={e.label || "Main"} className={cn("min-w-0", ctx.uppercase && "uppercase tracking-wide")}>
      <ul className="flex flex-wrap items-center gap-0.5">
        {items.map((item) => <NavItemDesktop key={item.id} item={item} currentColor={ctx.fg} />)}
      </ul>
    </nav>
  );
}

function SearchBox({ e }: { e: HeaderElement }) {
  return (
    <form action="/search" role="search" className="relative flex w-full max-w-md items-center rounded-full border border-current/20 bg-background/90 text-foreground px-3">
      <Search className="h-4 w-4 opacity-60 shrink-0" aria-hidden />
      <input type="search" name="q" placeholder={e.label || "Search"} aria-label={e.label || "Search"}
        className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
      <SearchSuggestions />
    </form>
  );
}

/** The search bar under the header (search element in "icon" style, and the phone search icon). */
export function SearchPanel({ id, open, placeholder }: { id: string; open: boolean; placeholder?: string }) {
  return (
    <div id={id} hidden={!open} className="border-t border-current/10 bg-background text-foreground">
      {open && (
        <div className="mx-auto max-w-3xl px-4 py-3">
          <form action="/search" role="search" className="relative flex items-center rounded-full border border-border px-3">
            <Search className="h-4 w-4 opacity-60 shrink-0" aria-hidden />
            <input autoFocus type="search" name="q" placeholder={placeholder || "Search"} aria-label={placeholder || "Search"}
              className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
            <SearchSuggestions />
          </form>
        </div>
      )}
    </div>
  );
}

export function CartButton({ showLabel }: { showLabel?: boolean }) {
  const { itemCount, openCart } = useCart();
  return (
    <button type="button" onClick={openCart} className={cn(ICON_BTN, showLabel && "w-auto px-2 gap-1.5")} aria-label={itemCount ? `Cart, ${itemCount} items` : "Cart"}>
      <ShoppingCart className="h-5 w-5" aria-hidden />
      {showLabel && <span className="text-sm font-medium">Cart</span>}
      {itemCount > 0 && (
        <span aria-hidden className="absolute top-0.5 end-0.5 min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold leading-none flex items-center justify-center"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}

/** One element, desktop rows and the phone bar alike (compact = phone bar icon). */
export function HeaderElementView({ e, ctx, compact = false }: { e: HeaderElement; ctx: ElementCtx; compact?: boolean }) {
  const contact = useSiteContact();
  switch (e.type) {
    case "logo":
      return <LogoElement e={e} ctx={ctx} />;
    case "menu":
      return <MenuElement e={e} ctx={ctx} />;
    case "button": {
      if (!e.label) return null;
      const s = buttonStyle(e.variant, ctx.onDark);
      return (
        <Link href={e.url || "/contact"} target={e.newTab ? "_blank" : undefined} rel={e.newTab ? "noopener noreferrer" : undefined}
          className={cn(s.className, compact && "px-3 py-1.5 text-xs")} style={s.style}>
          {e.label}
        </Link>
      );
    }
    case "booking": {
      const s = buttonStyle(e.variant, ctx.onDark);
      const label = e.label || "Book now";
      return (
        <Link href={e.url || "/book"} aria-label={label} className={cn(s.className, compact && "px-2.5 py-1.5 text-xs")} style={s.style}>
          <CalendarCheck className="h-4 w-4" aria-hidden />
          <span className={cn(compact && "hidden min-[420px]:inline")}>{label}</span>
        </Link>
      );
    }
    case "phone": {
      const v = contactValue(e, contact);
      const href = telLink(v);
      if (!href || !v) return null;
      const label = !compact && e.showLabel;
      return (
        <a href={href} aria-label={`Call ${v}`} className={cn(label ? "inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:opacity-80" : ICON_BTN)}>
          <Phone className="h-4 w-4" aria-hidden />{label && <span dir="ltr">{v}</span>}
        </a>
      );
    }
    case "whatsapp": {
      const v = contactValue(e, contact);
      const href = waLink(v);
      if (!href) return null;
      const label = !compact && e.showLabel;
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
          className={cn(label ? "inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:opacity-80" : ICON_BTN)}>
          <WaIcon className="h-5 w-5 text-[#25D366]" />{label && <span>WhatsApp</span>}
        </a>
      );
    }
    case "email": {
      const v = contactValue(e, contact);
      if (!v) return null;
      const label = !compact && e.showLabel;
      return (
        <a href={`mailto:${v}`} aria-label={`Email ${v}`} className={cn(label ? "inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap hover:opacity-80" : ICON_BTN)}>
          <Mail className="h-4 w-4" aria-hidden />{label && <span>{v}</span>}
        </a>
      );
    }
    case "search":
      if (!compact && e.searchStyle === "box") return <SearchBox e={e} />;
      return (
        <button type="button" className={ICON_BTN} aria-label={e.label || "Search"} aria-expanded={ctx.searchOpen} aria-controls={ctx.searchPanelId} onClick={ctx.toggleSearch}>
          <Search className="h-5 w-5" aria-hidden />
        </button>
      );
    case "cart":
      return <CartButton showLabel={!compact && e.showLabel} />;
    case "account": {
      const label = e.label || "My account";
      return (
        <Link href="/account" aria-label={label} className={cn(!compact && e.showLabel ? "inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80" : ICON_BTN)}>
          <User className="h-5 w-5" aria-hidden />{!compact && e.showLabel && <span>{label}</span>}
        </Link>
      );
    }
    case "language":
      return (
        <LanguageSwitch other={e.lang || "bn"} mode={e.langMode} short={compact}
          className="inline-flex items-center gap-1 h-8 px-2.5 shrink-0 rounded-full text-xs font-semibold border border-current/30 hover:bg-current/10 whitespace-nowrap" />
      );
    case "socials": {
      const list = contact.socials ?? [];
      if (!list.length) return null;
      return (
        <ul className="flex items-center gap-0.5" aria-label="Social media">
          {list.map((s) => (
            <li key={s.platform + s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[s.platform] ?? s.platform}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-current/10 transition-colors">
                <SocialIcon platform={s.platform} className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      );
    }
    case "text":
      if (!e.label) return null;
      return e.url
        ? <Link href={e.url} className="text-sm font-medium underline-offset-4 hover:underline">{e.label}</Link>
        : <span className="text-sm">{e.label}</span>;
    case "divider":
      return <span aria-hidden className="mx-1 inline-block h-5 w-px bg-current opacity-25" />;
    default:
      return null;
  }
}
