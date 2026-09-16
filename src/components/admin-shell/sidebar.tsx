"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ExternalLink, Menu, Plus, X } from "lucide-react";
import type { ShellNavItem, ShellNavSection, ShellTheme } from "./types";
import { LanguageSwitcher } from "./language-switcher";

function NavRow({ item, pathname, onClose, dark, brand }: {
  item: ShellNavItem; pathname: string; onClose?: () => void; dark: boolean; brand: boolean;
}) {
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

  if (hasChildren) {
    return (
      <li>
        <div className="flex items-center gap-1">
          <Link
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
                  <Link
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
                    <Link href={child.add} onClick={onClose} title="Add new"
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
        <Link
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
          <Link href={item.add} onClick={onClose} title="Add new"
            className={cn("p-1.5 rounded shrink-0", dark ? "text-gray-600 hover:bg-white/10 hover:text-gray-300" : "text-muted-foreground/60 hover:bg-accent hover:text-foreground")}>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </li>
  );
}

function SidebarBody({ sections, dark, onClose, header, footer, filterItem }: {
  sections: ShellNavSection[]; dark: boolean; onClose?: () => void;
  header: React.ReactNode | ((onClose?: () => void) => React.ReactNode);
  footer?: React.ReactNode; filterItem?: (item: ShellNavItem) => boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      {typeof header === "function" ? header(onClose) : header}
      {/* Below the logo, above the nav — Wali's explicit placement.
          Shared here once so admin/staff/super-admin/vendor all get it for
          free, same reasoning as every other piece of Shell chrome. */}
      <div className="px-3 py-2 border-b flex justify-center">
        <LanguageSwitcher />
      </div>
      <ScrollArea className="flex-1">
        <nav className="px-2 py-3 space-y-4">
          {sections.map((section) => {
            const isTools = section.variant === "tools";
            const isBrand = section.variant === "brand";
            const items = filterItem ? section.items.filter(filterItem) : section.items;
            if (items.length === 0) return null;
            return (
              <div
                key={section.label}
                className={cn(
                  isTools && "rounded-xl bg-gray-950 border border-gray-800 p-2 shadow-inner",
                  isBrand && "rounded-xl p-2 shadow-sm",
                )}
                style={isBrand ? { backgroundColor: "#C2410C" } : undefined}
              >
                <p className={cn(
                  "px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest",
                  isTools ? "text-gray-500 pt-1" : isBrand ? "text-white/70 pt-1" : dark ? "text-gray-600" : "text-muted-foreground",
                )}>
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <NavRow key={item.href} item={item} pathname={pathname} onClose={onClose} dark={dark || isTools} brand={isBrand} />
                  ))}
                </ul>
              </div>
            );
          })}
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
        aria-label="Open menu"
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
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dark && "text-gray-300", collapsed ? "-rotate-90" : "rotate-90")} />
        </button>
      </div>
    </>
  );
}
