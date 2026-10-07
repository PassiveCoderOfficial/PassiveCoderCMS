"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ExternalLink, Menu, Plus, Search, X } from "lucide-react";
import type { ShellNavItem, ShellNavSection, ShellTheme } from "./types";
import { LanguageSwitcher } from "./language-switcher";
import { useT } from "@/lib/i18n/language-provider";

function NavRow({ item, pathname, onClose, dark, brand }: {
  item: ShellNavItem; pathname: string; onClose?: () => void; dark: boolean; brand: boolean;
}) {
  const t = useT();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const onChildRoute = (item.children ?? []).some(
    (c) => pathname === c.href || pathname.startsWith(c.href + "/"),
  );
  const withinParent = (!item.exact && pathname.startsWith(item.href) && item.href !== "/") || onChildRoute;
  const [expanded, setExpanded] = useState(withinParent);

  useEffect(() => {
    if (withinParent) setExpanded(true);
  }, [withinParent]);

  const isActive = item.exact
    ? pathname === item.href
    : hasChildren
      ? pathname === item.href
      : withinParent;

  const idle = brand
    ? "text-white/90 hover:bg-black/10 hover:text-white"
    : dark
      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground";
  const active = brand
    ? "bg-black/20 text-white"
    : dark
      ? "bg-indigo-600 text-white"
      : "bg-primary text-primary-foreground";
  const parentOpen = brand
    ? "bg-black/10 text-white"
    : dark
      ? "bg-white/10 text-white"
      : "bg-accent/50 text-foreground";

  // prefetch={false}: the menu has ~40 links, and each prefetch runs the full
  // dashboard layout on the server. Prefetching all of them on every
  // dashboard load (especially the first one after login) was a flood of
  // server work; pages still load on click, and hover prefetch is not needed.
  if (hasChildren) {
    return (
      <li>
        <div className="flex items-center gap-1">
          <Link prefetch={false}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
              isActive ? active : withinParent && !expanded ? parentOpen : idle,
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
          </Link>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v); }}
            className={cn("p-0.5 rounded shrink-0", dark ? "hover:bg-white/10 text-gray-500" : "hover:bg-accent text-muted-foreground")}
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
        {expanded && (
          <ul className={cn("mt-0.5 ml-3 pl-2 border-l space-y-0.5", dark ? "border-gray-700" : "border-border")}>
            {item.children!.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <li key={child.href} className="flex items-center gap-1">
                  <Link prefetch={false}
                    href={child.href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      childActive ? active : idle,
                    )}
                  >
                    <child.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{child.label}</span>
                  </Link>
                  {child.add && (
                    <Link prefetch={false} href={child.add} onClick={onClose} title={t("sidebar.addNew")}
                      className={cn("p-1 rounded shrink-0", dark ? "text-gray-600 hover:bg-white/10 hover:text-gray-300" : "text-muted-foreground/60 hover:bg-accent hover:text-foreground")}>
                      <Plus className="h-3 w-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <div className="flex items-center gap-1">
        <Link prefetch={false}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          onClick={onClose}
          className={cn(
            "flex flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
            isActive ? active : idle,
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{item.label}</span>
          {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
          {item.badge && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", dark ? "bg-white/15" : "bg-primary/20")}>
              {item.badge}
            </span>
          )}
        </Link>
        {item.add && (
          <Link prefetch={false} href={item.add} onClick={onClose} title={t("sidebar.addNew")}
            className={cn("p-1.5 rounded shrink-0", dark ? "text-gray-600 hover:bg-white/10 hover:text-gray-300" : "text-muted-foreground/60 hover:bg-accent hover:text-foreground")}>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}

const COLLAPSE_KEY = "pc-nav-collapsed";

function itemMatches(item: ShellNavItem, q: string): boolean {
  return item.label.toLowerCase().includes(q) || (item.children ?? []).some((c) => itemMatches(c, q));
}

/** Does this section contain the page being viewed? (Keeps it open.) */
function sectionHasActive(items: ShellNavItem[], pathname: string): boolean {
  const hit = (i: ShellNavItem): boolean =>
    (i.href !== "/" && (pathname === i.href.split("?")[0] || pathname.startsWith(i.href.split("?")[0] + "/"))) || (i.children ?? []).some(hit);
  return items.some(hit);
}

function SidebarBody({ sections, dark, onClose, header, footer, filterItem }: {
  sections: ShellNavSection[]; dark: boolean; onClose?: () => void;
  header: React.ReactNode | ((onClose?: () => void) => React.ReactNode);
  footer?: React.ReactNode; filterItem?: (item: ShellNavItem) => boolean;
}) {
  const pathname = usePathname();
  const t = useT();
  // Menu search: type part of a name ("email", "booking") to jump straight there.
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Collapsed groups, remembered per browser. The group holding the current
  // page always shows, and searching opens everything.
  const [collapsed, setCollapsed] = useState<string[]>([]);
  useEffect(() => {
    // Read once after mount (localStorage isn't available during server render).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setCollapsed(JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "[]")); } catch { /* storage blocked */ }
  }, []);
  const toggle = (label: string) => setCollapsed((prev) => {
    const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  });

  const visible = sections.map((section) => {
    let items = filterItem ? section.items.filter(filterItem) : section.items;
    if (q) {
      // Show matching items; a match inside a sub-menu shows that sub-item directly.
      items = items.flatMap((it) =>
        it.label.toLowerCase().includes(q) ? [it]
          : (it.children ?? []).filter((c) => itemMatches(c, q)).map((c) => ({ ...c, children: undefined })),
      );
    }
    return { section, items };
  }).filter((v) => v.items.length > 0);

  return (
    <>
      {typeof header === "function" ? header(onClose) : header}
      {/* Below the logo, above the nav — Wali's explicit placement.
          Shared here once so admin/staff/super-admin/vendor all get it for
          free, same reasoning as every other piece of Shell chrome. */}
      <div className="px-3 py-2 border-b flex justify-center">
        <LanguageSwitcher />
      </div>
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5", dark ? "text-gray-500" : "text-muted-foreground")} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            placeholder={t("sidebar.searchMenu")}
            aria-label={t("sidebar.searchMenu")}
            className={cn(
              "w-full rounded-md border pl-8 pr-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/40",
              dark ? "bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500" : "bg-background border-input placeholder:text-muted-foreground",
            )}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-2 py-3 space-y-3">
          {visible.map(({ section, items }, idx) => {
            const isTools = section.variant === "tools";
            const isBrand = section.variant === "brand";
            // The first group (Dashboard, Visit Site) always stays open.
            const canCollapse = !q && !isBrand && idx > 0 && items.length > 1;
            const isOpen = !canCollapse || !collapsed.includes(section.label) || sectionHasActive(items, pathname);
            return (
              <div
                key={section.label}
                className={cn(
                  isTools && "rounded-xl bg-gray-950 border border-gray-800 p-2 shadow-inner",
                  isBrand && "rounded-xl p-2 shadow-sm",
                )}
                style={isBrand ? { backgroundColor: "#C2410C" } : undefined}
              >
                {canCollapse ? (
                  <button
                    type="button"
                    onClick={() => toggle(section.label)}
                    aria-expanded={isOpen}
                    className={cn(
                      // Group titles: small dark pill with light text so groups read at a glance.
                      "w-full flex items-center justify-between px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-widest rounded-md hover:opacity-90",
                      isTools || dark ? "bg-white/10 text-gray-200" : "bg-muted text-foreground/70",
                    )}
                  >
                    <span>{section.label}</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", !isOpen && "-rotate-90")} />
                  </button>
                ) : (
                  <p className={cn(
                    "px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-widest rounded-md",
                    isBrand ? "bg-black/20 text-white" : isTools || dark ? "bg-white/10 text-gray-200" : "bg-muted text-foreground/70",
                  )}>
                    {section.label}
                  </p>
                )}
                {isOpen && (
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <NavRow key={item.href + item.label} item={item} pathname={pathname} onClose={() => { setQuery(""); onClose?.(); }} dark={dark || isTools} brand={isBrand} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {q && visible.length === 0 && (
            <p className={cn("px-2 text-sm", dark ? "text-gray-500" : "text-muted-foreground")}>{t("sidebar.noMenuMatch")}</p>
          )}
        </nav>
      </ScrollArea>
      {footer}
    </>
  );
}

/** Shared collapsible/mobile-drawer sidebar chrome for every admin-style
 *  surface (tenant admin, super-admin, staff, vendor). Each surface supplies
 *  its own nav sections + header/footer slots + theme; the drawer, desktop
 *  collapse toggle, and active-route logic live here once instead of being
 *  re-implemented per surface. */
export function Shell(props: {
  sections: ShellNavSection[];
  theme: ShellTheme;
  header: React.ReactNode | ((onClose?: () => void) => React.ReactNode);
  footer?: React.ReactNode;
  filterItem?: (item: ShellNavItem) => boolean;
  /** Collapse the desktop sidebar to width 0 by default (e.g. page builder routes). */
  defaultCollapsed?: boolean;
  width?: string;
}) {
  const { sections, theme, header, footer, filterItem, defaultCollapsed = false, width = "w-60" } = props;
  const t = useT();
  const dark = theme === "dark";
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setCollapsed(defaultCollapsed);
  }

  const surfaceClass = dark ? "bg-gray-900 border-gray-800" : "bg-sidebar border-border";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "lg:hidden fixed top-3.5 left-3 z-40 p-2 rounded-md border shadow-sm",
          dark ? "bg-gray-900 border-gray-700" : "bg-background",
        )}
        aria-label={t("sidebar.openMenu")}
      >
        <Menu className={cn("w-5 h-5", dark && "text-gray-300")} />
      </button>

      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        `fixed inset-y-0 left-0 z-50 flex flex-col ${width} border-r transition-transform duration-200 lg:hidden`,
        surfaceClass,
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarBody sections={sections} dark={dark} onClose={() => setOpen(false)} header={header} footer={footer} filterItem={filterItem} />
      </aside>

      <div className="hidden lg:flex h-screen flex-shrink-0 relative">
        <aside className={cn(
          `h-screen flex-col border-r overflow-hidden transition-[width] duration-200`,
          surfaceClass,
          collapsed ? "w-0" : `${width} flex`,
        )}>
          <div className={cn(`${width} h-full flex flex-col`)}>
            <SidebarBody sections={sections} dark={dark} header={header} footer={footer} filterItem={filterItem} />
          </div>
        </aside>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-colors",
            dark ? "bg-gray-900 border-gray-700 hover:bg-gray-800" : "bg-background hover:bg-accent",
          )}
          aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          title={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dark && "text-gray-300", collapsed ? "-rotate-90" : "rotate-90")} />
        </button>
      </div>
    </>
  );
}
