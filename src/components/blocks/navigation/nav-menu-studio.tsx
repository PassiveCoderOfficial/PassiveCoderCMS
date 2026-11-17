"use client";

/**
 * Menu Studio renderer (Header & Footer Studio phase 1, Nov 2026).
 *
 * Only items that use a studio feature come here (usesStudio in
 * modules/navigation/menu-model); every other item keeps the legacy markup in
 * nav-menu-core.tsx. Adds: icons, descriptions and badges on any item, device
 * visibility, a third level (side flyouts in dropdowns, links under column
 * headings in mega menus), a featured card, auto lists (expanded server-side
 * by expandDynamicChildren), open on hover or click, and full keyboard
 * support (Tab, arrow keys, Home/End, Esc) using the disclosure pattern:
 * a button with aria-expanded / aria-controls and a labelled group of links.
 *
 * Class names follow the legacy renderer so a studio item sits next to a
 * legacy item without looking different.
 */
import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { NavItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { hrefFor, useAlternates } from "@/components/site/use-alternates";
import { filterForDevice, isMegaItem } from "@/modules/navigation/menu-model";

const Icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? Icons[name] : null;
  if (!Icon) return null;
  return <Icon className={cn("h-4 w-4 shrink-0", className)} aria-hidden />;
}

export function NavBadge({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <span className="ms-1.5 inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-primary-foreground">
      {text.trim()}
    </span>
  );
}

/** Label with optional icon (when showIcon) and badge. */
function Label({ item, iconClass }: { item: NavItem; iconClass?: string }) {
  return (
    <>
      {item.showIcon && <NavIcon name={item.icon} className={iconClass} />}
      <span className="min-w-0">{item.label}</span>
      <NavBadge text={item.badge} />
    </>
  );
}

const CELL = "relative flex items-center whitespace-nowrap px-3.5 py-2 rounded-lg text-[length:var(--nav-fs,var(--nav-fs-d,0.9rem))] [font-weight:var(--nav-fw,500)] transition-colors hover:bg-current/5";
const HIGHLIGHT_CLASS = "inline-flex items-center px-4 py-1.5 rounded-full text-[0.9rem] font-semibold whitespace-nowrap transition-transform hover:-translate-y-px";
const HIGHLIGHT_STYLE: Record<NonNullable<NavItem["highlight"]>, React.CSSProperties> = {
  gold: { background: "linear-gradient(135deg, #f3e2b3 0%, #d4af6a 45%, #b8893f 100%)", color: "#2a1d0c", border: "1px solid #9c7330", boxShadow: "0 2px 8px -2px rgba(156,115,48,.55)" },
  brand: { background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)", color: "hsl(var(--primary-foreground))", border: "1px solid hsl(var(--primary))" },
  dark: { background: "#111", color: "#d4af6a", border: "1px solid #d4af6a" },
};
const MEGA_COL_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-3 lg:grid-cols-3",
  4: "sm:grid-cols-3 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

const isPure = (i: NavItem) => !i.url || i.url === "#";

// ── Keyboard helpers ────────────────────────────────────────────────────

/** Focusable links/buttons of a panel, in reading order (skips ones inside closed flyouts). */
function panelFocusables(panel: HTMLElement | null): HTMLElement[] {
  if (!panel) return [];
  return [...panel.querySelectorAll<HTMLElement>("[data-menu-focus]")].filter((el) => el.offsetParent !== null || el === document.activeElement);
}

function moveFocus(list: HTMLElement[], current: Element | null, key: string): boolean {
  if (!list.length) return false;
  const i = list.indexOf(current as HTMLElement);
  let next = -1;
  if (key === "ArrowDown") next = i < 0 ? 0 : Math.min(i + 1, list.length - 1);
  else if (key === "ArrowUp") next = i <= 0 ? 0 : i - 1;
  else if (key === "Home") next = 0;
  else if (key === "End") next = list.length - 1;
  if (next < 0) return false;
  list[next].focus();
  return true;
}

/** Arrow Left/Right across the top-level menu bar (studio and legacy items alike). */
function focusSiblingTop(from: HTMLElement, dir: -1 | 1): boolean {
  const li = from.closest("li[data-nav-top]") ?? from.closest("li");
  const ul = li?.parentElement;
  if (!li || !ul) return false;
  const tops = [...ul.children].map((c) => c.querySelector<HTMLElement>("a, button")).filter((x): x is HTMLElement => !!x);
  const mine = li.querySelector<HTMLElement>("a, button");
  const i = mine ? tops.indexOf(mine) : -1;
  const target = tops[i + dir];
  if (!target) return false;
  target.focus();
  return true;
}

// ── Desktop ─────────────────────────────────────────────────────────────

export function StudioNavItemDesktop({ item: raw, currentColor }: { item: NavItem; currentColor: string }) {
  const alts = useAlternates();
  const pathname = usePathname();
  const item = filterForDevice([raw], "desktop")[0] ?? raw;
  const kids = item.children ?? [];
  const hasChildren = kids.length > 0;
  const [open, setOpen] = useState(false);
  const liRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const hover = (item.openOn ?? "hover") === "hover";
  const isActive = item.url !== "/" && item.url !== "#" && !!pathname && pathname.startsWith(item.url.split("#")[0] || "");

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (liRef.current && !liRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };
  const close = (focusTrigger = false) => { setOpen(false); if (focusTrigger) triggerRef.current?.focus(); };

  const topKeys = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      if (focusSiblingTop(e.currentTarget, e.key === "ArrowRight" ? 1 : -1)) { e.preventDefault(); setOpen(false); }
    }
  };

  if (!hasChildren) {
    const style = item.highlight ? HIGHLIGHT_STYLE[item.highlight] : { color: currentColor, fontWeight: isActive ? 700 : 500, opacity: isActive ? 1 : 0.85 };
    return (
      <li data-nav-top="">
        <Link href={hrefFor(item, alts)} target={item.target} onKeyDown={topKeys}
          aria-current={isActive ? "page" : undefined}
          className={item.highlight ? cn(HIGHLIGHT_CLASS, "gap-1.5") : cn(CELL, "group gap-1.5")} style={style}>
          <Label item={item} />
        </Link>
      </li>
    );
  }

  const mega = isMegaItem(item);
  const triggerKeys = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      // Focus the first link once the panel is in the DOM.
      requestAnimationFrame(() => panelFocusables(panelRef.current)[0]?.focus());
      return;
    }
    if (e.key === "Escape" && open) { e.preventDefault(); close(true); return; }
    topKeys(e);
  };
  const panelKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      if (moveFocus(panelFocusables(panelRef.current), document.activeElement, e.key)) e.preventDefault();
    }
  };
  const onBlur = (e: React.FocusEvent) => {
    // Tabbing out of the item closes it.
    if (liRef.current && e.relatedTarget && !liRef.current.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const triggerStyle = item.highlight ? HIGHLIGHT_STYLE[item.highlight] : { color: currentColor, opacity: 0.85 };
  const chevron = <ChevronDown aria-hidden className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />;

  return (
    <li ref={liRef} data-nav-top="" className={mega ? undefined : "relative"}
      onMouseEnter={hover ? openNow : undefined} onMouseLeave={hover ? closeSoon : undefined} onBlur={onBlur}>
      {isPure(item) ? (
        <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={panelId} aria-haspopup="true"
          onClick={() => (hover ? openNow() : setOpen((o) => !o))} onKeyDown={triggerKeys}
          className={item.highlight ? cn(HIGHLIGHT_CLASS, "gap-1") : cn(CELL, "flex items-center gap-1")} style={triggerStyle}>
          <Label item={item} />
          {chevron}
        </button>
      ) : (
        <span className={item.highlight ? cn(HIGHLIGHT_CLASS, "gap-0.5 pe-1") : cn(CELL, "flex items-center gap-0.5 pe-1.5")} style={triggerStyle}>
          <Link href={hrefFor(item, alts)} target={item.target} onKeyDown={triggerKeys} onClick={() => setOpen(false)} className="inline-flex items-center gap-1.5">
            <Label item={item} />
          </Link>
          <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={panelId} aria-haspopup="true"
            aria-label={item.label} onClick={() => setOpen((o) => !o)} onKeyDown={triggerKeys}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-current/10">
            {chevron}
          </button>
        </span>
      )}
      <div ref={panelRef} id={panelId} role="group" aria-label={item.label} hidden={!open} onKeyDown={panelKeys}>
        {open && (mega
          ? <MegaPanel item={item} onMouseEnter={hover ? openNow : undefined} onMouseLeave={hover ? closeSoon : undefined} onNavigate={() => setOpen(false)} />
          : <DropdownPanel items={kids} onMouseEnter={hover ? openNow : undefined} onMouseLeave={hover ? closeSoon : undefined} onNavigate={() => setOpen(false)} />)}
      </div>
    </li>
  );
}

export function DropdownPanel({ items, onMouseEnter, onMouseLeave, onNavigate }: {
  items: NavItem[]; onMouseEnter?: () => void; onMouseLeave?: () => void; onNavigate: () => void;
}) {
  return (
    <div className="absolute left-0 top-full pt-2.5 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <ul className="min-w-[220px] max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground shadow-[var(--shadow-lg)] rounded-2xl border border-border p-1.5 normal-case tracking-normal">
        {items.map((child) => <DropdownRow key={child.id} item={child} onNavigate={onNavigate} />)}
      </ul>
    </div>
  );
}

const ROW = "flex items-start gap-2.5 px-3.5 py-2.5 text-sm rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground transition-colors outline-none";

function RowBody({ item }: { item: NavItem }) {
  return (
    <>
      {item.showIcon && item.icon && <NavIcon name={item.icon} className="mt-0.5 text-primary" />}
      <span className="min-w-0 flex-1">
        <span className="flex items-center whitespace-normal">{item.label}<NavBadge text={item.badge} /></span>
        {item.description && <span className="mt-0.5 block whitespace-normal text-xs leading-snug text-muted-foreground/80">{item.description}</span>}
      </span>
    </>
  );
}

/** A dropdown row; a row with children opens a side flyout (hover, focus, ArrowRight). */
function DropdownRow({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const alts = useAlternates();
  const [open, setOpen] = useState(false);
  const flyId = useId();
  const liRef = useRef<HTMLLIElement>(null);
  const kids = item.children ?? [];
  if (!kids.length) {
    return (
      <li>
        <Link data-menu-focus="" href={hrefFor(item, alts)} target={item.target} onClick={onNavigate} className={ROW}>
          <RowBody item={item} />
        </Link>
      </li>
    );
  }
  const keys = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault(); e.stopPropagation(); setOpen(true);
      requestAnimationFrame(() => liRef.current?.querySelector<HTMLElement>(`[id="${CSS.escape(flyId)}"] [data-menu-focus]`)?.focus());
    }
  };
  const flyKeys = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowLeft" || e.key === "Escape") {
      e.preventDefault(); e.stopPropagation(); setOpen(false);
      liRef.current?.querySelector<HTMLElement>("[data-menu-focus]")?.focus();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.stopPropagation();
      const list = [...(liRef.current?.querySelectorAll<HTMLElement>(`[id="${CSS.escape(flyId)}"] [data-menu-focus]`) ?? [])];
      if (moveFocus(list, document.activeElement, e.key)) e.preventDefault();
    }
  };
  const common = { "aria-expanded": open, "aria-controls": flyId, "aria-haspopup": "true" as const, onKeyDown: keys };
  return (
    <li ref={liRef} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onBlur={(e) => { if (e.relatedTarget && !liRef.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      {isPure(item) ? (
        <button type="button" data-menu-focus="" {...common} onClick={() => setOpen((o) => !o)} className={cn(ROW, "w-full text-start")}>
          <RowBody item={item} />
          <ChevronRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 rtl:rotate-180" />
        </button>
      ) : (
        <Link data-menu-focus="" href={hrefFor(item, alts)} target={item.target} onClick={onNavigate} {...common} className={ROW}>
          <RowBody item={item} />
          <ChevronRight aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 rtl:rotate-180" />
        </Link>
      )}
      <div id={flyId} role="group" aria-label={item.label} hidden={!open} onKeyDown={flyKeys}
        className="absolute top-0 start-full ps-1.5 z-[10000]">
        <ul className="min-w-[220px] max-h-[70vh] overflow-y-auto bg-popover text-popover-foreground shadow-[var(--shadow-lg)] rounded-2xl border border-border p-1.5">
          {kids.map((g) => (
            <li key={g.id}>
              <Link data-menu-focus="" href={hrefFor(g, alts)} target={g.target} onClick={onNavigate} className={ROW}>
                <RowBody item={g} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function FeaturedCard({ item, onNavigate, compact }: { item: NavItem; onNavigate: () => void; compact?: boolean }) {
  const f = item.mega?.featured;
  if (!f || !(f.title?.trim() || f.image)) return null;
  const body = (
    <>
      {f.image && (
        // eslint-disable-next-line @next/next/no-img-element -- owner's media URL, any host
        <img src={f.image} alt="" loading="lazy" className={cn("w-full rounded-xl object-cover", compact ? "h-28" : "h-36")} />
      )}
      {f.title && <span className="mt-3 block text-sm font-semibold text-foreground">{f.title}</span>}
      {f.text && <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{f.text}</span>}
      {f.url && <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary">{f.ctaLabel?.trim() || item.label}<span aria-hidden>→</span></span>}
    </>
  );
  const cls = "block rounded-2xl bg-muted/60 border border-border p-3";
  return f.url
    ? <Link data-menu-focus="" href={f.url} onClick={onNavigate} className={cn(cls, "hover:border-primary/40 transition-colors")}>{body}</Link>
    : <div className={cls}>{body}</div>;
}

export function MegaPanel({ item, onMouseEnter, onMouseLeave, onNavigate }: {
  item: NavItem; onMouseEnter?: () => void; onMouseLeave?: () => void; onNavigate: () => void;
}) {
  const alts = useAlternates();
  const kids = item.children ?? [];
  const groups = kids.filter((c) => (c.children?.length ?? 0) > 0);
  const singles = kids.filter((c) => (c.children?.length ?? 0) === 0);
  const featured = item.mega?.featured && (item.mega.featured.title?.trim() || item.mega.featured.image);
  const linksAsColumn = item.megaLinksAs === "column";
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-[9999] w-[min(1120px,calc(100vw-2rem))] animate-in fade-in slide-in-from-top-2 duration-200"
      onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="bg-popover text-popover-foreground shadow-[var(--shadow-xl)] rounded-[1.75rem] border border-border overflow-hidden normal-case tracking-normal">
        {singles.length > 0 && !linksAsColumn && (
          <ul className="flex flex-wrap gap-x-6 gap-y-1 px-7 py-3.5 bg-muted/70 border-b border-border">
            {singles.map((s) => (
              <li key={s.id}>
                <Link data-menu-focus="" href={hrefFor(s, alts)} target={s.target} onClick={onNavigate} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-70">
                  {s.showIcon && <NavIcon name={s.icon} />}{s.label}<NavBadge text={s.badge} /> <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className={cn("flex flex-col lg:flex-row gap-6 p-7 max-h-[70vh] overflow-y-auto")}>
          <div className={cn("grid grid-cols-2 gap-x-8 gap-y-7 min-w-0 flex-1", MEGA_COL_CLASS[item.megaColumns ?? (featured ? 4 : 5)] ?? MEGA_COL_CLASS[5])}>
            {groups.map((group) => (
              <div key={group.id} className="min-w-0">
                {isPure(group) ? (
                  <p className="flex items-center gap-2.5 mb-3">
                    {group.icon && <GroupIcon name={group.icon} />}
                    <span className="text-sm font-semibold uppercase tracking-wide text-foreground">{group.label}</span>
                    <NavBadge text={group.badge} />
                  </p>
                ) : (
                  <Link data-menu-focus="" href={hrefFor(group, alts)} target={group.target} onClick={onNavigate} className="flex items-center gap-2.5 mb-3 group/head">
                    {group.icon && <GroupIcon name={group.icon} />}
                    <span className="text-sm font-semibold uppercase tracking-wide text-foreground group-hover/head:text-primary transition-colors">{group.label}</span>
                    <NavBadge text={group.badge} />
                  </Link>
                )}
                {group.description && <p className="-mt-2 mb-3 text-xs text-muted-foreground">{group.description}</p>}
                <ul className="space-y-1.5">
                  {(group.children ?? []).map((child) => (
                    <li key={child.id}>
                      <Link data-menu-focus="" href={hrefFor(child, alts)} target={child.target} onClick={onNavigate}
                        className="flex items-start gap-2 text-sm text-muted-foreground hover:text-primary focus-visible:text-primary transition-colors">
                        {child.showIcon && child.icon && <NavIcon name={child.icon} className="mt-0.5" />}
                        <span className="min-w-0">
                          <span className="inline-flex items-center">{child.label}<NavBadge text={child.badge} /></span>
                          {child.description && <span className="block text-xs text-muted-foreground/80">{child.description}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {linksAsColumn && singles.length > 0 && (
              <div className="min-w-0 rounded-2xl bg-primary/[0.07] border border-primary/15 p-5 -my-1 col-span-2 lg:col-span-1">
                {item.megaLinksTitle && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary mb-3">{item.megaLinksTitle}</p>}
                <ul className="space-y-2.5">
                  {singles.map((s) => (
                    <li key={s.id}>
                      <Link data-menu-focus="" href={hrefFor(s, alts)} target={s.target} onClick={onNavigate} className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
                        <span className="inline-flex items-center gap-1.5">{s.showIcon && <NavIcon name={s.icon} />}{s.label}<NavBadge text={s.badge} /></span>
                        <span aria-hidden className="text-primary shrink-0">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {featured && <div className="w-full lg:w-72 shrink-0"><FeaturedCard item={item} onNavigate={onNavigate} /></div>}
        </div>
      </div>
    </div>
  );
}

function GroupIcon({ name }: { name?: string }) {
  const Icon = name ? Icons[name] : null;
  if (!Icon) return null;
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
}

// ── Mobile drawer ───────────────────────────────────────────────────────

export function StudioMobileItem({ item: raw, expanded, onToggle, onNavigate }: {
  item: NavItem; expanded: boolean; onToggle: () => void; onNavigate: () => void;
}) {
  const alts = useAlternates();
  const panelId = useId();
  const item = filterForDevice([raw], "mobile")[0] ?? raw;
  const kids = item.children ?? [];
  const hasChildren = kids.length > 0;
  const link = (c: NavItem, cls: string) => (
    <Link href={hrefFor(c, alts)} target={c.target} onClick={onNavigate} className={cls}>
      {c.showIcon && <NavIcon name={c.icon} />}
      <span className="min-w-0">
        <span className="inline-flex items-center">{c.label}<NavBadge text={c.badge} /></span>
        {c.description && <span className="block text-xs font-normal text-muted-foreground/80">{c.description}</span>}
      </span>
    </Link>
  );
  return (
    <li>
      <div className="flex items-center">
        {hasChildren && isPure(item) ? (
          <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId}
            className="flex-1 flex items-center gap-2 text-start px-3.5 py-3 rounded-lg text-[0.95rem] font-medium text-foreground hover:bg-muted transition-colors">
            {item.highlight
              ? <span className="inline-flex px-3 py-1 rounded-full font-semibold" style={HIGHLIGHT_STYLE[item.highlight]}>{item.label}</span>
              : <Label item={item} />}
          </button>
        ) : (
          <Link href={hrefFor(item, alts)} target={item.target} onClick={() => { if (!hasChildren) onNavigate(); }}
            className="flex-1 flex items-center gap-2 px-3.5 py-3 rounded-lg text-[0.95rem] font-medium text-foreground hover:bg-muted transition-colors">
            {item.highlight
              ? <span className="inline-flex px-3 py-1 rounded-full font-semibold" style={HIGHLIGHT_STYLE[item.highlight]}>{item.label}</span>
              : <Label item={item} />}
          </Link>
        )}
        {hasChildren && (
          <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={panelId} aria-label={item.label}
            className="px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted">
            <ChevronDown aria-hidden className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        )}
      </div>
      {hasChildren && (
        <div id={panelId} hidden={!expanded} className="ml-4 mt-1 border-l-2 border-border pl-3 space-y-3 pb-2">
          {expanded && (
            <>
              <ul className="space-y-0.5">
                {kids.map((c) => (
                  <li key={c.id}>
                    {(c.children?.length ?? 0) > 0 ? (
                      <>
                        {isPure(c)
                          ? <p className="flex items-center gap-2 px-2 pt-2 pb-1 text-[13px] font-semibold uppercase tracking-wide text-foreground">{c.showIcon && <NavIcon name={c.icon} />}{c.label}<NavBadge text={c.badge} /></p>
                          : link(c, "flex items-center gap-2 px-2 pt-2 pb-1 text-[13px] font-semibold uppercase tracking-wide text-foreground")}
                        <ul className="space-y-0.5">
                          {c.children!.map((g) => <li key={g.id}>{link(g, "flex items-start gap-2 px-2 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors")}</li>)}
                        </ul>
                      </>
                    ) : link(c, "flex items-start gap-2 px-2 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors")}
                  </li>
                ))}
              </ul>
              <FeaturedCard item={item} onNavigate={onNavigate} compact />
            </>
          )}
        </div>
      )}
    </li>
  );
}
