"use client";

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

function DropdownMenu({ items, onMouseEnter, onMouseLeave, forceMega, columns }: {
  items: NavItem[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Explicit megaMenu toggle from the menu manager. Falls back to inferring
   *  it from nested children so menus built before the toggle existed keep
   *  rendering the same way. */
  forceMega?: boolean;
  columns?: number;
}) {
  const isMega = forceMega ?? items.some((i) => (i.children?.length ?? 0) > 0);

  if (isMega) {
    const standalone = items.filter((i) => (i.children?.length ?? 0) === 0);
    const groups = items.filter((i) => (i.children?.length ?? 0) > 0);
    return (
      <div
        // Anchored to the <nav> element (the nearest `relative` ancestor),
        // not the viewport — see navigation-block.tsx history for why this
        // must never go back to `fixed` with a hardcoded top offset.
        className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-[9999] px-2 w-full max-w-[1120px] animate-in fade-in slide-in-from-top-2 duration-200"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="bg-popover text-popover-foreground shadow-[var(--shadow-xl)] rounded-[1.75rem] border border-border overflow-hidden">
          {standalone.length > 0 && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 px-7 py-3.5 bg-muted/70 border-b border-border">
              {standalone.map((s) => (
                <Link key={s.id} href={s.url} className="text-sm font-semibold text-primary hover:opacity-70">
                  {s.label} →
                </Link>
              ))}
            </div>
          )}
          <div className={cn("grid grid-cols-2 gap-x-8 gap-y-7 p-7 max-h-[70vh] overflow-y-auto", MEGA_COL_CLASS[columns ?? 5] ?? MEGA_COL_CLASS[5])}>
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                <Link href={group.url} className="flex items-center gap-2.5 mb-3 group/head">
                  <GroupIcon name={group.icon} />
                  <span className="text-sm font-semibold text-foreground group-hover/head:text-primary transition-colors truncate">{group.label}</span>
                </Link>
                <ul className="space-y-1.5 pl-[calc(2rem+0.625rem)]">
                  {(group.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link href={child.url} target={child.target}
                        className="block text-sm text-muted-foreground hover:text-primary transition-colors truncate">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
              href={child.url}
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

export function NavItemDesktop({ item, currentColor }: {
  item: NavItem; currentColor: string;
}) {
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

  const cell = "relative px-3.5 py-2 rounded-lg text-[0.9rem] font-medium transition-colors hover:bg-current/5";

  if (!hasChildren) {
    return (
      <li>
        <Link
          href={item.url}
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

  return (
    <li ref={ref} className={isMegaTrigger ? undefined : "relative"} onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <Link
        href={item.url}
        onClick={() => setOpen(false)}
        className={cn(cell, "flex items-center gap-1")}
        style={{ color: currentColor, opacity: 0.85 }}
      >
        {item.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </Link>
      {open && (
        <DropdownMenu
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
  items, onNavigate, extraFooter,
}: {
  items: NavItem[];
  onNavigate: () => void;
  extraFooter?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <ul className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
      {items.map((item) => {
        const hasChildren = (item.children?.length ?? 0) > 0;
        const isExpanded = expanded === item.id;
        return (
          <li key={item.id}>
            <div className="flex items-center">
              <Link
                href={item.url}
                className="flex-1 block px-3.5 py-3 rounded-lg text-[0.95rem] font-medium text-foreground hover:bg-muted transition-colors"
                onClick={() => { if (!hasChildren) onNavigate(); }}
              >
                {item.label}
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
            {hasChildren && isExpanded && (
              <ul className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-3">
                {item.children!.map(child => (
                  <li key={child.id}>
                    <Link href={child.url} className="block px-2 py-2.5 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={onNavigate}>
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
      {extraFooter && <li className="pt-3 space-y-2">{extraFooter}</li>}
    </ul>
  );
}
