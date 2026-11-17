"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ExternalLink, Menu, Plus, Search } from "lucide-react";
import type { ShellNavItem, ShellNavSection } from "./types";
import { LanguageSwitcher } from "./language-switcher";
import { useT } from "@/lib/i18n/language-provider";

const ROW = "flex flex-1 min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] leading-5 transition-colors";
const ROW_IDLE = "text-foreground/75 hover:bg-foreground/[0.05] hover:text-foreground";
const ROW_ACTIVE = "bg-accent font-medium text-accent-foreground";
const ICON = "h-4 w-4 shrink-0";

function NavRow({ item, pathname, onClose }: { item: ShellNavItem; pathname: string; onClose?: () => void }) {
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

  // prefetch={false}: the menu has ~40 links, and each prefetch runs the full
  // dashboard layout on the server. Prefetching all of them on every
  // dashboard load (especially the first one after login) was a flood of
  // server work; pages still load on click, and hover prefetch is not needed.
  if (hasChildren) {
    return (
      <li>
        <div className="flex items-center gap-0.5">
          <Link prefetch={false}
            href={item.href}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={cn(ROW, isActive || (withinParent && !expanded) ? ROW_ACTIVE : ROW_IDLE)}
          >
            <item.icon className={cn(ICON, (isActive || withinParent) && "text-primary")} />
            <span className="flex-1 truncate">{item.label}</span>
          </Link>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded((v) => !v); }}
            aria-expanded={expanded}
            aria-label={item.label}
            className="grid h-7 w-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          >
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>
        </div>
        {expanded && (
          <ul className="ml-[1.05rem] mt-0.5 space-y-0.5 border-l pl-2">
            {item.children!.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
              return (
                <li key={child.href} className="flex items-center gap-0.5">
                  <Link prefetch={false}
                    href={child.href}
                    onClick={onClose}
                    aria-current={childActive ? "page" : undefined}
                    className={cn(ROW, "gap-2 py-1 text-[13px]", childActive ? ROW_ACTIVE : "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground")}
                  >
                    <child.icon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-primary")} />
                    <span className="flex-1 truncate">{child.label}</span>
                  </Link>
                  {child.add && (
                    <Link prefetch={false} href={child.add} onClick={onClose} title={t("sidebar.addNew")}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground">
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
      <div className="flex items-center gap-0.5">
        <Link prefetch={false}
          href={item.href}
          target={item.external ? "_blank" : undefined}
          rel={item.external ? "noopener noreferrer" : undefined}
          onClick={onClose}
          aria-current={isActive ? "page" : undefined}
          className={cn(ROW, isActive ? ROW_ACTIVE : ROW_IDLE)}
        >
          <item.icon className={cn(ICON, isActive && "text-primary")} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.external && <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />}
          {item.badge && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none", item.badgeTone === "alert" ? "bg-red-600 text-white animate-pulse" : "bg-primary/15 text-primary")}>
              {item.badge}
            </span>
          )}
        </Link>
        {item.add && (
          <Link prefetch={false} href={item.add} onClick={onClose} title={t("sidebar.addNew")}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-foreground/[0.05] hover:text-foreground">
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

const SECTION_LABEL = "text-[11px] font-semibold uppercase leading-4 tracking-wider text-muted-foreground";

function SidebarBody({ sections, onClose, header, footer, filterItem }: {
  sections: ShellNavSection[]; onClose?: () => void;
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
      {/* Below the logo, above the nav — a deliberate placement.
          Shared here once so every surface using the shell gets it for free. */}
      <div className="space-y-2 px-3 pt-3">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }}
            placeholder={t("sidebar.searchMenu")}
            aria-label={t("sidebar.searchMenu")}
            className="h-8 w-full rounded-lg border bg-card pl-8 pr-2 text-[13px] outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="space-y-4 px-2 py-3">
          {visible.map(({ section, items }, idx) => {
            const isBrand = section.variant === "brand";
            // The first group (Dashboard, Visit Site) always stays open.
            const canCollapse = !q && !isBrand && idx > 0 && items.length > 1;
            const isOpen = !canCollapse || !collapsed.includes(section.label) || sectionHasActive(items, pathname);
            return (
              <div
                key={section.label}
                className={cn(isBrand && "rounded-xl border bg-card p-1.5 shadow-sm")}
              >
                {canCollapse ? (
                  <button
                    type="button"
                    onClick={() => toggle(section.label)}
                    aria-expanded={isOpen}
                    className={cn("group/section mb-1 flex w-full items-center justify-between rounded-md px-2 py-0.5 transition-colors hover:text-foreground", SECTION_LABEL)}
                  >
                    <span>{section.label}</span>
                    <ChevronDown className={cn("h-3 w-3 opacity-0 transition group-hover/section:opacity-100 group-focus-visible/section:opacity-100", !isOpen && "-rotate-90 opacity-100")} />
                  </button>
                ) : (
                  <p className={cn("mb-1 px-2 py-0.5", SECTION_LABEL)}>{section.label}</p>
                )}
                {isOpen && (
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <NavRow key={item.href + item.label} item={item} pathname={pathname} onClose={() => { setQuery(""); onClose?.(); }} />
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {q && visible.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">{t("sidebar.noMenuMatch")}</p>
          )}
        </nav>
      </ScrollArea>
      {footer}
    </>
  );
}

/** Sidebar chrome of the site dashboard: mobile drawer, desktop collapse and
 *  active-route logic in one place. The surface supplies its nav sections and
 *  header/footer slots. (The Console has its own top bar, components/console.) */
export function Shell(props: {
  sections: ShellNavSection[];
  header: React.ReactNode | ((onClose?: () => void) => React.ReactNode);
  footer?: React.ReactNode;
  filterItem?: (item: ShellNavItem) => boolean;
  /** Collapse the desktop sidebar to width 0 by default (e.g. page builder routes). */
  defaultCollapsed?: boolean;
  width?: string;
}) {
  const { sections, header, footer, filterItem, defaultCollapsed = false, width = "w-60" } = props;
  const t = useT();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setCollapsed(defaultCollapsed);
  }

  return (
    <>
      {/* Sits in the topbar's left gap on phones (AdminTopbar leaves room for it). */}
      <button
        onClick={() => setOpen(true)}
        className="absolute left-2 top-2 z-30 grid h-8 w-8 place-items-center rounded-md text-foreground transition-colors hover:bg-foreground/[0.06] lg:hidden"
        aria-label={t("sidebar.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        `fixed inset-y-0 left-0 z-50 flex flex-col ${width} border-r bg-sidebar shadow-xl transition-transform duration-200 lg:hidden`,
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarBody sections={sections} onClose={() => setOpen(false)} header={header} footer={footer} filterItem={filterItem} />
      </aside>

      <div className="relative hidden h-full flex-shrink-0 lg:flex">
        <aside className={cn(
          "h-full flex-col overflow-hidden border-r bg-sidebar transition-[width] duration-200",
          collapsed ? "w-0" : `${width} flex`,
        )}>
          <div className={cn(`${width} flex h-full flex-col`)}>
            <SidebarBody sections={sections} header={header} footer={footer} filterItem={filterItem} />
          </div>
        </aside>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
          aria-label={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
          title={collapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsed ? "-rotate-90" : "rotate-90")} />
        </button>
      </div>
    </>
  );
}
