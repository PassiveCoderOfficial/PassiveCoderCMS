"use client";
// Frozen copy of v1.0.927 (menus P4 pixel proof). Do not edit.

/**
 * The menu renderer (menus P1, Nov 2026): one component that draws any saved
 * menu in five layouts, styled by a MenuStyle (modules/navigation/menu-style)
 * through CSS variables (app/menus.css):
 *
 * - bar: the horizontal menu bar with dropdowns and mega menus (the Menu
 *   Studio items, keyboard and RTL-safe);
 * - vertical: a sidebar list, sub-items shown indented under their parent;
 * - inline: one row of top-level links (footer bottom bar, legal links);
 * - accordion: a phone-style list whose sub-menus fold open;
 * - drawer: a menu button that opens the accordion in a side, full-screen or
 *   drop-down panel.
 *
 * Nothing on a live site uses it yet: P2 places it in header zones, footer
 * columns and the page Menu block. The legacy renderers (nav-menu-core,
 * navigation block) are untouched, so no existing site can change.
 */
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as MenuIcon, X } from "lucide-react";
import type { NavItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { hrefFor, useAlternates } from "@/components/site/use-alternates";
import { filterForAudience, filterForDevice, hasAudience } from "@/modules/navigation/menu-model";
import { isActivePath, menuStyleVars, resolveMenuStyle, type MenuLayout, type MenuStyle } from "@/modules/navigation/menu-style";
import { useSignedIn } from "@/components/site/use-signed-in";
import { MenuLookContext, NavBadge, NavIcon, StudioMobileItem, StudioNavItemDesktop } from "./nav-menu-studio.v927";

export interface MenuRendererProps {
  items: NavItem[];
  layout?: MenuLayout;
  style?: MenuStyle | null;
  /** Accessible name of the <nav> ("Main menu", "Footer"...). */
  label?: string;
  /** Text of the drawer's menu button (screen readers always get `label`). */
  buttonLabel?: string;
  /** Accessible name of the drawer's close button. */
  closeLabel?: string;
  /** vertical / inline: how many levels to show (1-3). Default 3 (vertical) and 1 (inline). */
  levels?: number;
  className?: string;
}

const deviceCls = (i: NavItem) => (i.device === "desktop" ? "hidden md:list-item" : i.device === "mobile" ? "md:hidden" : undefined);
const isPure = (i: NavItem) => !i.url || i.url === "#";

export function MenuRenderer({ items: given, layout = "bar", style, label = "Menu", buttonLabel, closeLabel = "Close", levels, className }: MenuRendererProps) {
  const signedIn = useSignedIn(hasAudience(given));
  const items = filterForAudience(given, signedIn);
  const { style: vars, attrs } = menuStyleVars(style);
  const root = cn("pcm", `pcm-${layout}`, className);
  const nav = (body: React.ReactNode) => (
    <MenuLookContext.Provider value>
      <nav aria-label={label} className={root} style={vars as React.CSSProperties} {...attrs}>{body}</nav>
    </MenuLookContext.Provider>
  );

  switch (layout) {
    case "vertical":
      return nav(<LinkTree items={items} maxDepth={Math.min(3, Math.max(1, levels ?? 3))} />);
    case "inline":
      return nav(
        <ul className="pcm-list pcm-inline">
          {items.map((i) => <li key={i.id} className={deviceCls(i)}><PlainLink item={i} /></li>)}
        </ul>,
      );
    case "accordion":
      return nav(<Accordion items={filterForDevice(items, "mobile")} />);
    case "drawer":
      return nav(<Drawer items={filterForDevice(items, "mobile")} label={label} buttonLabel={buttonLabel} closeLabel={closeLabel} drawer={resolveMenuStyle(style).phone.drawer} />);
    case "bar":
    default:
      return nav(
        <ul className="pcm-list">
          {filterForDevice(items, "desktop").map((i) => <StudioNavItemDesktop key={i.id} item={i} currentColor="inherit" />)}
        </ul>,
      );
  }
}

/** One link styled as a menu cell (vertical and inline layouts). */
function PlainLink({ item, sub }: { item: NavItem; sub?: boolean }) {
  const alts = useAlternates();
  const pathname = usePathname();
  const active = isActivePath(item.url, pathname);
  const body = (
    <>
      {item.showIcon && <NavIcon name={item.icon} />}
      <span className="min-w-0">{item.label}</span>
      <NavBadge text={item.badge} />
    </>
  );
  const cls = cn("pcm-cell", sub && "pcm-sub");
  if (isPure(item)) return <span className={cn(cls, "pcm-heading")}>{body}</span>;
  return (
    <Link href={hrefFor(item, alts)} target={item.target} className={cls}
      aria-current={active ? "page" : undefined} data-active={active ? "" : undefined}>
      {body}
    </Link>
  );
}

function LinkTree({ items, maxDepth, depth = 1 }: { items: NavItem[]; maxDepth: number; depth?: number }) {
  return (
    <ul className={depth === 1 ? "pcm-vlist" : "pcm-vsub"}>
      {items.map((i) => (
        <li key={i.id} className={deviceCls(i)}>
          <PlainLink item={i} sub={depth > 1} />
          {depth < maxDepth && (i.children?.length ?? 0) > 0 && <LinkTree items={i.children!} maxDepth={maxDepth} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

function Accordion({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="pcm-acc">
      {items.map((i) => (
        <StudioMobileItem key={i.id} item={i} expanded={open === i.id}
          onToggle={() => setOpen((o) => (o === i.id ? null : i.id))} onNavigate={onNavigate ?? (() => {})} />
      ))}
    </ul>
  );
}

function Drawer({ items, label, buttonLabel, closeLabel, drawer }: { items: NavItem[]; label: string; buttonLabel?: string; closeLabel: string; drawer: "side" | "full" | "dropdown" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); buttonRef.current?.focus(); return; }
      // Keep Tab inside the open panel (a modal on side / full-screen drawers).
      if (e.key !== "Tab" || drawer === "dropdown" || !panel) return;
      const list = [...panel.querySelectorAll<HTMLElement>("a, button")].filter((el) => el.offsetParent !== null);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, drawer]);

  const close = () => setOpen(false);
  return (
    <div className="pcm-drawer-wrap">
      <button ref={buttonRef} type="button" className="pcm-cell pcm-toggle" aria-expanded={open} aria-controls={panelId}
        aria-label={buttonLabel ? undefined : label} onClick={() => setOpen((o) => !o)}>
        {open ? <X className="h-5 w-5" aria-hidden /> : <MenuIcon className="h-5 w-5" aria-hidden />}
        {buttonLabel && <span>{buttonLabel}</span>}
      </button>
      {open && drawer !== "dropdown" && <div className="pcm-scrim" aria-hidden onClick={close} />}
      <div ref={panelRef} id={panelId} hidden={!open} data-drawer={drawer} className="pcm-panel"
        role={drawer === "dropdown" ? undefined : "dialog"} aria-modal={drawer === "dropdown" ? undefined : true} aria-label={label}>
        {drawer !== "dropdown" && (
          <div className="pcm-panel-head">
            <button type="button" className="pcm-cell" aria-label={closeLabel} onClick={() => { close(); buttonRef.current?.focus(); }}>
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
        {open && <Accordion items={items} onNavigate={close} />}
      </div>
    </div>
  );
}
