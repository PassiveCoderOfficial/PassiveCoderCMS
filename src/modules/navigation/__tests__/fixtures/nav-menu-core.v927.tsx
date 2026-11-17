"use client";
// Frozen copy of v1.0.927 (menus P4 pixel proof). Do not edit.

/**
 * Shared nav-menu rendering — dropdown/mega-menu, desktop menu items, and
 * mobile drawer — extracted from the original monolithic NavigationBlock
 * (2026-09-06) so the new independent header_nav sub-block can reuse the
 * exact same, already-battle-tested menu logic instead of forking a second
 * copy that quietly drifts from this one. NavigationBlock (legacy, still
 * owns its own logo/CTA/cart) and HeaderNavBlock (new, links-only) both
 * import from here now — this file has no opinion about logo, CTA, or cart,
 * only about rendering NavItem[] as a menu.
 */
import React, { useState, useRef, useEffect } from "react";
import type { NavItem } from "@/types/cms";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { hrefFor, useAlternates } from "@/components/site/use-alternates";
import { usesStudio } from "@/modules/navigation/menu-model";
import { StudioNavItemDesktop, StudioMobileItem } from "./nav-menu-studio.v927";

function GroupIcon({ name }: { name?: string }) {
  const Icon = name ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name] : null;
  if (!Icon) return null;
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
}

const MEGA_COL_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-3 lg:grid-cols-3",
  4: "sm:grid-cols-3 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

export function DropdownMenu({ items, onMouseEnter, onMouseLeave, forceMega, columns, linksAs, linksTitle }: {
  items: NavItem[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Explicit megaMenu toggle from the menu manager. Falls back to inferring
   *  it from nested children so menus built before the toggle existed keep
   *  rendering the same way. */
  forceMega?: boolean;
  columns?: number;
  /** Mega menu: single links (no sub-items) as a top strip, or as a highlighted last column. */
  linksAs?: "strip" | "column";
  linksTitle?: string;
}) {
  const alts = useAlternates();
  const isMega = forceMega ?? items.some((i) => (i.children?.length ?? 0) > 0);

  if (isMega) {
    const standalone = items.filter((i) => (i.children?.length ?? 0) === 0);
    const groups = items.filter((i) => (i.children?.length ?? 0) > 0);
    return (
      <div
        // Anchored to the <nav> element (the nearest `relative` ancestor),
        // not the viewport — see navigation-block.tsx history for why this
        // must never go back to `fixed` with a hardcoded top offset.
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-[9999] w-[min(1120px,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-2 duration-200"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-popover text-popover-foreground shadow-[var(--shadow-xl)] rounded-[1.75rem] border border-border overflow-hidden normal-case tracking-normal">
          {standalone.length > 0 && linksAs !== "column" && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-7 py-3.5 bg-muted/70 border-b border-border">
              {standalone.map((s) => (
                <Link key={s.id} href={hrefFor(s, alts)} className="text-sm font-semibold text-primary hover:opacity-70">
                  {s.label} →
                </Link>
              ))}
            </div>
          )}
          <div
            className={cn("grid grid-cols-2 gap-y-7 max-h-[70vh] overflow-y-auto", linksAs === "column" ? "gap-x-6 p-6 lg:[grid-template-columns:var(--mega-cols)]" : cn("gap-x-8 p-7", MEGA_COL_CLASS[columns ?? 5] ?? MEGA_COL_CLASS[5]))}
            // Highlighted links column: equal group columns plus a wider last one.
            style={linksAs === "column" ? { ["--mega-cols" as string]: `repeat(${groups.length}, minmax(0, 1fr)) minmax(15rem, 1.3fr)` } : undefined}
          >
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                <Link href={hrefFor(group, alts)} className="flex items-center gap-2.5 mb-3 group/head">
                  <GroupIcon name={group.icon} />
                  <span className="text-sm font-semibold uppercase tracking-wide text-foreground group-hover/head:text-primary transition-colors">{group.label}</span>
                </Link>
                <ul className={cn("space-y-1.5", group.icon && "pl-[calc(2rem+0.625rem)]")}>
                  {(group.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link href={hrefFor(child, alts)} target={child.target}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {linksAs === "column" && standalone.length > 0 && (
              <div className="min-w-0 rounded-2xl bg-primary/[0.07] border border-primary/15 p-5 -my-1 col-span-2 lg:col-span-1">
                {linksTitle && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-3">{linksTitle}</p>}
                <ul className="space-y-2.5">
                  {standalone.map((s) => (
                    <li key={s.id}>
                      <Link href={hrefFor(s, alts)} target={s.target} className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        <span>{s.label}</span><span aria-hidden className="text-primary shrink-0">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 top-full pt-2.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ul className="min-w-[220px] max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground shadow-[var(--shadow-lg)] rounded-2xl border border-border p-1.5">
        {items.map((child) => (
          <li key={child.id}>
            <Link
              href={hrefFor(child, alts)}
              target={child.target}
              className="block px-3.5 py-2.5 text-sm rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Highlighted menu items: a pill with gradient fill and outline. */
const HIGHLIGHT_CLASS = "inline-flex items-center px-4 py-1.5 rounded-full text-[0.9rem] font-semibold whitespace-nowrap transition-transform hover:-translate-y-px";
export const HIGHLIGHT_STYLE: Record<NonNullable<NavItem["highlight"]>, React.CSSProperties> = {
  gold: { background: "linear-gradient(135deg, #f3e2b3 0%, #d4af6a 45%, #b8893f 100%)", color: "#2a1d0c", border: "1px solid #9c7330", boxShadow: "0 2px 8px -2px rgba(156,115,48,.55)" },
  brand: { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)", color: "hsl(var(--primary-foreground))", border: "1px solid hsl(var(--primary))" },
  dark: { background: "#111", color: "#d4af6a", border: "1px solid #d4af6a" },
};

/**
 * One top-level desktop menu item. Items using a Menu Studio feature (icons,
 * descriptions, badges, device visibility, flyouts, featured card, auto
 * lists, click-to-open) render through nav-menu-studio.tsx; every other item
 * takes the legacy path below, unchanged, so menus saved before the studio
 * keep their exact markup.
 */
export function NavItemDesktop({ item, currentColor }: {
  item: NavItem; currentColor: string;
}) {
  if (item.device === "mobile") return null;
  if (usesStudio(item)) return <StudioNavItemDesktop item={item} currentColor={currentColor} />;
  return <LegacyNavItemDesktop item={item} currentColor={currentColor} />;
}

function LegacyNavItemDesktop({ item, currentColor }: {
  item: NavItem; currentColor: string;
}) {
  const alts = useAlternates();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChildren = (item.children?.length ?? 0) > 0;
  const pathname = usePathname();
  const isActive = item.url !== "/" && item.url !== "#" && pathname.startsWith(item.url.split("#")[0] || "");

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };

  // Every top-level cell is a flex box so plain links and dropdown triggers
  // share the same height and vertical centre (plain links used to be inline,
  // which made them sit higher than "Services ▾" on narrow desktop widths).
  const cell = "relative flex items-center whitespace-nowrap px-3.5 py-2 rounded-lg text-[length:var(--nav-fs,var(--nav-fs-d,0.9rem))] [font-weight:var(--nav-fw,500)] transition-colors hover:bg-current/5";

  if (!hasChildren && item.highlight) {
    return (
      <li>
        <Link href={hrefFor(item, alts)} target={item.target} className={HIGHLIGHT_CLASS} style={HIGHLIGHT_STYLE[item.highlight]}>
          {item.label}
        </Link>
      </li>
    );
  }

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={hrefFor(item, alts)}
          target={item.target}
          className={cn(cell, "group")}
          style={{ color: currentColor, fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.85 }}
        >
          {item.label}
          <span
            className="pointer-events-none absolute left-3.5 right-3.5 -bottom-0.5 h-0.5 rounded-full origin-left transition-transform duration-200 bg-current"
            style={{ transform: isActive ? "scaleX(1)" : "scaleX(0)" }}
          />
        </Link>
      </li>
    );
  }

  // A mega-menu spans the whole nav, so it must anchor to the nav bar (the
  // next `relative` ancestor up) rather than this <li>.
  const isMegaTrigger = item.megaMenu ?? (item.children ?? []).some((c) => (c.children?.length ?? 0) > 0);

  // A parent with no page of its own ("#" or empty URL) is a pure dropdown
  // trigger: clicking opens the menu instead of jumping to the page top. It
  // only opens (never toggles shut): hover has usually opened it already, so
  // a toggle would close it on the very click meant to use it. It closes on
  // mouse-leave or an outside click.
  const isPureTrigger = !item.url || item.url === "#";

  return (
    <li ref={ref} className={isMegaTrigger ? undefined : "relative"} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={hrefFor(item, alts)}
        onClick={(e) => {
          if (isPureTrigger) { e.preventDefault(); openNow(); return; }
          setOpen(false);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        className={item.highlight ? cn(HIGHLIGHT_CLASS, "gap-1") : cn(cell, "flex items-center gap-1")}
        style={item.highlight ? HIGHLIGHT_STYLE[item.highlight] : { color: currentColor, opacity: 0.85 }}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>
      {open && (
        <DropdownMenu
          linksAs={item.megaLinksAs}
          linksTitle={item.megaLinksTitle}
          items={item.children!}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          forceMega={item.megaMenu}
          columns={item.megaColumns}
        />
      )}
    </li>
  );
}

/** The mobile drawer's item list — accordion-style nested children, same
 *  markup NavigationBlock always used. `extraFooter` lets a caller add its
 *  own CTA/secondary links below the menu (NavigationBlock's own CTA fields),
 *  without this shared component needing to know about them. */
export function MobileNavList({
  items, onNavigate, extraFooter, defaultExpanded,
}: {
  items: NavItem[];
  onNavigate: () => void;
  extraFooter?: React.ReactNode;
  /** Item open on first render (tests render an expanded drawer with it). */
  defaultExpanded?: string | null;
}) {
  const alts = useAlternates();
  const [expanded, setExpanded] = useState<string | null>(defaultExpanded ?? null);
  return (
    <ul className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
      {items.map((item) => {
        if (item.device === "desktop") return null;
        if (usesStudio(item)) {
          return (
            <StudioMobileItem key={item.id} item={item} expanded={expanded === item.id}
              onToggle={() => setExpanded(expanded === item.id ? null : item.id)} onNavigate={onNavigate} />
          );
        }
        const hasChildren = (item.children?.length ?? 0) > 0;
        const isExpanded = expanded === item.id;
        return (
          <li key={item.id}>
            <div className="flex items-center">
              <Link
                href={hrefFor(item, alts)}
                className="flex-1 block px-3.5 py-3 rounded-lg text-[0.95rem] font-medium text-foreground hover:bg-muted transition-colors"
                onClick={(e) => {
                  // "#" parents have no page: tapping the label expands them.
                  if (hasChildren && (!item.url || item.url === "#")) {
                    e.preventDefault();
                    setExpanded(isExpanded ? null : item.id);
                    return;
                  }
                  if (!hasChildren) onNavigate();
                }}
              >
                {item.highlight
                  ? <span className="inline-flex px-3 py-1 rounded-full font-semibold" style={HIGHLIGHT_STYLE[item.highlight]}>{item.label}</span>
                  : item.label}
              </Link>
              {hasChildren && (
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                  className="px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                </button>
              )}
            </div>
            {hasChildren && isExpanded && (() => {
              // Mega menus on phones: each group as a heading with its links,
              // single links either listed or as the highlighted card.
              const kids = item.children!;
              const groups = kids.filter((c) => (c.children?.length ?? 0) > 0);
              const singles = kids.filter((c) => (c.children?.length ?? 0) === 0);
              const singleLink = (c: NavItem) => (
                <li key={c.id}>
                  <Link href={hrefFor(c, alts)} className="block px-2 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={onNavigate}>{c.label}</Link>
                </li>
              );
              return (
                <div className="ml-4 mt-1 border-l-2 border-border pl-3 space-y-3 pb-2">
                  {groups.map((g) => (
                    <div key={g.id}>
                      <Link href={hrefFor(g, alts)} onClick={onNavigate} className="block px-2 pt-2 pb-1 text-[13px] font-semibold uppercase tracking-wide text-foreground">{g.label}</Link>
                      <ul className="space-y-0.5">{g.children!.map(singleLink)}</ul>
                    </div>
                  ))}
                  {singles.length > 0 && (item.megaLinksAs === "column" ? (
                    <div className="rounded-xl bg-primary/[0.07] border border-primary/15 p-3">
                      {item.megaLinksTitle && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-1.5 px-1">{item.megaLinksTitle}</p>}
                      <ul>
                        {singles.map((c) => (
                          <li key={c.id}>
                            <Link href={hrefFor(c, alts)} onClick={onNavigate} className="flex items-center justify-between px-1 py-2 text-sm font-semibold text-foreground">
                              {c.label}<span aria-hidden className="text-primary">→</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : <ul className="space-y-0.5">{singles.map(singleLink)}</ul>)}
                </div>
              );
            })()}
          </li>
        );
      })}
      {extraFooter && <li className="pt-3 space-y-2">{extraFooter}</li>}
    </ul>
  );
}
