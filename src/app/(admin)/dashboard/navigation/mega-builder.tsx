"use client";

/**
 * Mega menu builder (menus P4, Nov 2026): a visual editor for one mega menu,
 * shown in the item settings of a top-level mega item, on the Navigation
 * screen and in the "Edit full menu" drawer.
 *
 * It edits the same data the tree above shows (second-level items are the
 * columns, their sub-items the links), plus the P4 fields: column width
 * (normal or double), column image, empty columns (heading only), 2 to 6
 * columns, panel width (content or full), and 0 to 2 featured cards. Every
 * change goes through onPatch on the mega item, so undo, Save and the history
 * work as for any other edit. A live preview shows the real renderer: the
 * open panel at desktop width (scaled to fit) and the phone drawer.
 *
 * Images come from the site's media library (MediaPickerInput).
 */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Columns3, Monitor, Plus, Smartphone, Sparkles, Trash2, X,
} from "lucide-react";
import type { NavItem, NavChildSource, NavMegaFeatured } from "@/types/cms";
import type { LinkTarget } from "@/app/api/navigation/link-targets/route";
import type { AutoPickItem } from "@/app/api/navigation/auto-items/route";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import { IconPicker } from "@/components/ui/icon-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { MegaPanel, StudioMobileItem } from "@/components/blocks/navigation/nav-menu-studio";
import { autoRowsToItems, flattenTree, newNavId } from "@/modules/navigation/menu-model";
import {
  MAX_MEGA_CARDS, MEGA_COLUMN_COUNTS, cardsPatch, columnsPatch, megaCardsRaw, moveEntry, newMegaColumn, splitMega,
} from "@/modules/navigation/mega";
import { AutoListSettings, LinkField, SOURCES, SOURCE_KEY } from "./menu-tree-editor";

const fieldCls = "w-full rounded border bg-background px-2 py-1.5 text-xs";
const labelCls = "mb-1 block text-[11px] font-medium";

/** Applies a patch to an item; undefined values remove the key. */
function patched(item: NavItem, p: Partial<NavItem>): NavItem {
  const next = { ...item, ...p } as NavItem & Record<string, unknown>;
  for (const k of Object.keys(p)) if ((p as Record<string, unknown>)[k] === undefined) delete next[k];
  return next;
}

export function MegaBuilder({ item, targets, onPatch }: {
  item: NavItem;
  targets: LinkTarget[];
  onPatch: (p: Partial<NavItem>) => void;
}) {
  const t = useT();
  const uid = useId();
  const { columns, singles } = splitMega(item);
  const cards = megaCardsRaw(item);

  const setColumns = (next: NavItem[]) => onPatch(columnsPatch(next, singles));
  const setSingles = (next: NavItem[]) => onPatch(columnsPatch(columns, next));
  const patchColumn = (id: string, p: Partial<NavItem>) => setColumns(columns.map((c) => (c.id === id ? patched(c, p) : c)));
  const setCards = (next: NavMegaFeatured[]) => onPatch(cardsPatch(item, next));
  const setMega = (p: { width?: "container" | "full" }) => {
    const mega = { ...(item.mega ?? {}), ...p };
    if (p.width === undefined) delete mega.width;
    onPatch({ mega, megaMenu: true });
  };

  return (
    <section className="space-y-3 rounded-lg border border-primary/30 bg-background p-3" aria-label={t("navPage.megaBuilder")}>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold"><Columns3 className="h-3.5 w-3.5 text-primary" aria-hidden />{t("navPage.megaBuilder")}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{t("navPage.megaBuilderHint")}</p>
      </div>

      {/* Panel */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label htmlFor={`${uid}-cols`} className={labelCls}>{t("navPage.columns")}</label>
          <select id={`${uid}-cols`} className={fieldCls} value={String(item.megaColumns ?? (cards.some((c) => c.title?.trim() || c.image) ? 4 : 5))}
            onChange={(e) => onPatch({ megaColumns: Number(e.target.value) as NavItem["megaColumns"] })}>
            {MEGA_COLUMN_COUNTS.map((n) => <option key={n} value={n}>{t("navPage.columnsCount", { count: n })}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-width`} className={labelCls}>{t("navPage.megaWidth")}</label>
          <select id={`${uid}-width`} className={fieldCls} value={item.mega?.width ?? "container"}
            onChange={(e) => setMega({ width: e.target.value === "full" ? "full" : undefined })}>
            <option value="container">{t("navPage.megaWidthContainer")}</option>
            <option value="full">{t("navPage.megaWidthFull")}</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${uid}-singles`} className={labelCls}>{t("navPage.singleLinks")}</label>
          <select id={`${uid}-singles`} className={fieldCls} value={item.megaLinksAs ?? "strip"}
            onChange={(e) => onPatch({ megaLinksAs: e.target.value === "column" ? "column" : undefined, ...(e.target.value === "column" ? {} : { megaLinksTitle: undefined }) })}>
            <option value="strip">{t("navPage.singleStrip")}</option>
            <option value="column">{t("navPage.singleColumn")}</option>
          </select>
        </div>
      </div>

      {/* Columns */}
      <div>
        <p className={labelCls}>{t("navPage.megaColumnsTitle")}</p>
        <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label={t("navPage.megaColumnsTitle")}>
          {columns.map((col, i) => (
            <ColumnCard key={col.id} col={col} index={i} count={columns.length} targets={targets}
              onPatch={(p) => patchColumn(col.id, p)}
              onMove={(dir) => setColumns(moveEntry(columns, col.id, dir))}
              onRemove={() => {
                const n = flattenTree(col.children ?? []).length;
                if (n > 0 && !window.confirm(t("navPage.megaRemoveColumnConfirm", { name: col.label || t("navPage.megaNewColumn"), count: n }))) return;
                setColumns(columns.filter((c) => c.id !== col.id));
              }} />
          ))}
          <button type="button" onClick={() => setColumns([...columns, newMegaColumn(t("navPage.megaNewColumn"))])}
            className="flex w-44 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-primary/50 p-3 text-[11px] font-medium text-primary hover:bg-primary/5">
            <Plus className="h-4 w-4" aria-hidden />{t("navPage.megaAddColumn")}
          </button>
        </div>
      </div>

      {/* Single links */}
      <div className="space-y-1.5 rounded border bg-muted/30 p-2.5">
        <p className="text-[11px] font-semibold">{t("navPage.megaSingles")}</p>
        <p className="text-[10px] text-muted-foreground">{t("navPage.megaSinglesHint")}</p>
        {item.megaLinksAs === "column" && (
          <input className={fieldCls} placeholder={t("navPage.singleColumnTitle")} aria-label={t("navPage.singleColumnTitle")}
            value={item.megaLinksTitle ?? ""} onChange={(e) => onPatch({ megaLinksTitle: e.target.value || undefined })} />
        )}
        <LinkRows items={singles} targets={targets} onChange={setSingles} />
        <button type="button" onClick={() => setSingles([...singles, { id: newNavId(), label: t("navPage.newLinkLabel"), url: "/" }])}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
          <Plus className="h-3 w-3" aria-hidden />{t("navPage.megaAddSingle")}
        </button>
      </div>

      {/* Featured cards */}
      <div className="space-y-2 rounded border bg-muted/30 p-2.5">
        <p className="text-[11px] font-semibold">{t("navPage.megaCards", { count: cards.length })}</p>
        <p className="text-[10px] text-muted-foreground">{t("navPage.megaCardsHint")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {cards.map((card, i) => (
            <CardEditor key={i} card={card} index={i} targets={targets}
              onChange={(c) => setCards(cards.map((x, j) => (j === i ? c : x)))}
              onRemove={() => setCards(cards.filter((_, j) => j !== i))} />
          ))}
        </div>
        {cards.length < MAX_MEGA_CARDS && (
          <button type="button" onClick={() => setCards([...cards, { title: t("navPage.megaCardN", { n: cards.length + 1 }) }])}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
            <Plus className="h-3 w-3" aria-hidden />{t("navPage.megaAddCard")}
          </button>
        )}
      </div>

      <MegaPreview item={item} />
    </section>
  );
}

function ColumnCard({ col, index, count, targets, onPatch, onMove, onRemove }: {
  col: NavItem;
  index: number;
  count: number;
  targets: LinkTarget[];
  onPatch: (p: Partial<NavItem>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const source = col.childSource ?? "manual";
  const links = col.children ?? [];
  const wide = col.megaSpan === 2;
  const uid = useId();
  return (
    <div role="listitem" className={cn("shrink-0 space-y-2 rounded-lg border bg-card p-2.5", wide ? "w-80" : "w-56")}>
      <div className="flex items-center gap-1">
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-muted-foreground">{t("navPage.megaColumnN", { n: index + 1 })}</span>
        <SmallBtn label={t("navPage.megaMoveLeft")} onClick={() => onMove(-1)} disabled={index === 0}><ArrowLeft className="h-3 w-3 rtl:rotate-180" /></SmallBtn>
        <SmallBtn label={t("navPage.megaMoveRight")} onClick={() => onMove(1)} disabled={index === count - 1}><ArrowRight className="h-3 w-3 rtl:rotate-180" /></SmallBtn>
        <SmallBtn label={t("navPage.megaRemoveColumn")} onClick={onRemove} danger><Trash2 className="h-3 w-3" /></SmallBtn>
      </div>
      <div>
        <label htmlFor={`${uid}-h`} className={labelCls}>{t("navPage.megaHeading")}</label>
        <input id={`${uid}-h`} className={fieldCls} value={col.label} maxLength={80} onChange={(e) => onPatch({ label: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>{t("navPage.megaHeadingLink")}</label>
        <LinkField small value={col.url} linkedTo={col.kind && col.ref ? `${col.kind}:${col.ref}` : undefined} targets={targets}
          onChange={(url, tg) => onPatch({ url, kind: tg?.kind && tg.ref ? tg.kind : undefined, ref: tg?.kind && tg.ref ? tg.ref : undefined })} />
        <p className="mt-0.5 text-[10px] text-muted-foreground">{t("navPage.megaHeadingLinkHint")}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>{t("navPage.icon")}</label>
          <IconPicker value={col.icon ?? ""} onChange={(v) => onPatch({ icon: v || undefined })} />
        </div>
        <div>
          <label className={labelCls}>{t("navPage.megaColumnWidth")}</label>
          <div className="flex rounded border" role="radiogroup" aria-label={t("navPage.megaColumnWidth")}>
            {([[false, t("navPage.megaSpan1")], [true, t("navPage.megaSpan2")]] as const).map(([v, label]) => (
              <button key={String(v)} type="button" role="radio" aria-checked={wide === v}
                onClick={() => onPatch({ megaSpan: v ? 2 : undefined })}
                className={cn("flex-1 px-1.5 py-1 text-[11px]", wide === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("navPage.megaColumnImage")}</label>
        <MediaPickerInput compact value={col.megaImage ?? ""} onChange={(url) => onPatch({ megaImage: url || undefined, ...(url ? {} : { megaColumn: true }) })} />
      </div>
      <div>
        <label htmlFor={`${uid}-src`} className={labelCls}>{t("navPage.megaContents")}</label>
        <select id={`${uid}-src`} className={fieldCls} value={source}
          onChange={(e) => onPatch({ childSource: e.target.value === "manual" ? undefined : e.target.value as NavChildSource, childIds: undefined, megaColumn: true })}>
          {SOURCES.concat(source === "blog_categories" ? ["blog_categories"] : []).map((s) => <option key={s} value={s}>{t(SOURCE_KEY[s])}</option>)}
        </select>
      </div>
      {source === "manual" ? (
        <div className="space-y-1.5">
          {links.length === 0 && <p className="text-[10px] text-muted-foreground">{t("navPage.megaNoLinks")}</p>}
          <LinkRows items={links} targets={targets} stacked
            // A column whose last link goes stays a column (heading, image).
            onChange={(next) => onPatch({ children: next, ...(next.length ? {} : { megaColumn: true }) })} />
          <button type="button" onClick={() => onPatch({ children: [...links, { id: newNavId(), label: t("navPage.newLinkLabel"), url: "/" }] })}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
            <Plus className="h-3 w-3" aria-hidden />{t("navPage.megaAddLink")}
          </button>
        </div>
      ) : (
        <AutoListSettings item={col} onPatch={onPatch} />
      )}
    </div>
  );
}

/** Links of a column (or the single links): text, where it goes, move, remove. */
function LinkRows({ items, targets, onChange, stacked }: { items: NavItem[]; targets: LinkTarget[]; onChange: (next: NavItem[]) => void; stacked?: boolean }) {
  const t = useT();
  if (!items.length) return null;
  const set = (id: string, p: Partial<NavItem>) => onChange(items.map((x) => (x.id === id ? patched(x, p) : x)));
  return (
    <ul className="space-y-1.5">
      {items.map((l, i) => (
        <li key={l.id} className={cn("rounded border bg-background p-1.5", stacked ? "space-y-1" : "flex flex-wrap items-center gap-1.5")}>
          <div className="flex items-center gap-1">
            <input className={cn(fieldCls, "py-1", !stacked && "w-36")} value={l.label} maxLength={80}
              aria-label={t("navPage.megaLinkLabel")} placeholder={t("navPage.megaLinkLabel")}
              onChange={(e) => set(l.id, { label: e.target.value })} />
            <SmallBtn label={t("navPage.moveUp")} onClick={() => onChange(moveEntry(items, l.id, -1))} disabled={i === 0}><ArrowUp className="h-3 w-3" /></SmallBtn>
            <SmallBtn label={t("navPage.moveDown")} onClick={() => onChange(moveEntry(items, l.id, 1))} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3" /></SmallBtn>
            <SmallBtn label={t("navPage.removeItem")} onClick={() => onChange(items.filter((x) => x.id !== l.id))} danger><X className="h-3 w-3" /></SmallBtn>
          </div>
          <LinkField small value={l.url} linkedTo={l.kind && l.ref ? `${l.kind}:${l.ref}` : undefined} targets={targets}
            onChange={(url, tg) => set(l.id, { url, kind: tg?.kind && tg.ref ? tg.kind : undefined, ref: tg?.kind && tg.ref ? tg.ref : undefined })} />
        </li>
      ))}
    </ul>
  );
}

function CardEditor({ card, index, targets, onChange, onRemove }: {
  card: NavMegaFeatured;
  index: number;
  targets: LinkTarget[];
  onChange: (c: NavMegaFeatured) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const uid = useId();
  const set = (p: Partial<NavMegaFeatured>) => {
    const next = { ...card, ...p };
    for (const k of Object.keys(next) as (keyof NavMegaFeatured)[]) if (!next[k]) delete next[k];
    onChange(next);
  };
  return (
    <div className="space-y-1.5 rounded border bg-background p-2">
      <div className="flex items-center">
        <span className="flex-1 text-[11px] font-semibold text-muted-foreground">{t("navPage.megaCardN", { n: index + 1 })}</span>
        <SmallBtn label={t("navPage.megaRemoveCard")} onClick={onRemove} danger><Trash2 className="h-3 w-3" /></SmallBtn>
      </div>
      <div>
        <label className={labelCls}>{t("navPage.featuredImage")}</label>
        <MediaPickerInput compact value={card.image ?? ""} onChange={(url) => set({ image: url })} />
      </div>
      <div>
        <label htmlFor={`${uid}-t`} className={labelCls}>{t("navPage.featuredTitle")}</label>
        <input id={`${uid}-t`} className={fieldCls} value={card.title ?? ""} maxLength={80} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div>
        <label htmlFor={`${uid}-x`} className={labelCls}>{t("navPage.featuredText")}</label>
        <textarea id={`${uid}-x`} className={fieldCls} rows={2} maxLength={200} value={card.text ?? ""} onChange={(e) => set({ text: e.target.value })} />
      </div>
      <div>
        <label htmlFor={`${uid}-c`} className={labelCls}>{t("navPage.featuredCta")}</label>
        <input id={`${uid}-c`} className={fieldCls} value={card.ctaLabel ?? ""} maxLength={40} onChange={(e) => set({ ctaLabel: e.target.value })} />
      </div>
      <div>
        <label className={labelCls}>{t("navPage.featuredLink")}</label>
        <LinkField small value={card.url ?? ""} targets={targets} onChange={(url) => set({ url })} />
      </div>
    </div>
  );
}

function SmallBtn({ label, onClick, disabled, danger, children }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className={cn("rounded p-1 text-muted-foreground disabled:opacity-25", danger ? "hover:text-destructive" : "hover:bg-muted hover:text-foreground")}>
      {children}
    </button>
  );
}

// ── Live preview ────────────────────────────────────────────────────────

const autoCache = new Map<string, Promise<AutoPickItem[]>>();
function fetchAutoItems(source: NavChildSource): Promise<AutoPickItem[]> {
  let p = autoCache.get(source);
  if (!p) {
    p = fetch(`/api/navigation/auto-items?source=${encodeURIComponent(source)}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { items?: AutoPickItem[] }) => d.items ?? [])
      .catch(() => []);
    autoCache.set(source, p);
  }
  return p;
}

/** The mega item with each auto-list column filled with the site's current records (as the live site fills it). */
function useFilledItem(item: NavItem): NavItem {
  const sources = useMemo(() => [...new Set((item.children ?? []).map((c) => c.childSource).filter((s): s is NavChildSource => !!s && s !== "manual"))], [item.children]);
  const [rows, setRows] = useState<Record<string, AutoPickItem[]>>({});
  useEffect(() => {
    let live = true;
    for (const s of sources) {
      if (rows[s]) continue;
      void fetchAutoItems(s).then((list) => { if (live) setRows((r) => ({ ...r, [s]: list })); });
    }
    return () => { live = false; };
  }, [sources, rows]);
  return useMemo(() => {
    if (!sources.length) return item;
    return {
      ...item,
      children: (item.children ?? []).map((c) => {
        const s = c.childSource;
        if (!s || s === "manual") return c;
        const filled = autoRowsToItems(s, (rows[s] ?? []).map((r) => ({ id: r.id, label: r.label })), { childIds: c.childIds, limit: c.childLimit ?? 12 });
        return { ...c, children: filled.length ? filled : (c.children ?? []) };
      }),
    };
  }, [item, rows, sources]);
}

const DESKTOP_WIDTH = 1180;

function MegaPreview({ item }: { item: NavItem }) {
  const t = useT();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const filled = useFilledItem(item);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | null>(null);

  // Desktop: the panel is drawn at a real desktop width and scaled down to fit the editor.
  useLayoutEffect(() => {
    if (device !== "desktop") return;
    const box = boxRef.current, inner = innerRef.current;
    if (!box || !inner) return;
    const measure = () => {
      const s = Math.min(1, box.clientWidth / DESKTOP_WIDTH);
      setScale(s);
      setHeight(inner.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [device]);

  const hasAuto = (item.children ?? []).some((c) => c.childSource && c.childSource !== "manual");
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold"><Sparkles className="h-3 w-3 text-primary" aria-hidden />{t("navPage.megaPreview")}</p>
        <div className="flex rounded border" role="radiogroup" aria-label={t("navPage.device")}>
          {([["desktop", Monitor, t("navPage.deviceDesktop")], ["mobile", Smartphone, t("navPage.devicePhone")]] as const).map(([v, Icon, label]) => (
            <button key={v} type="button" role="radio" aria-checked={device === v} title={label} aria-label={label}
              onClick={() => setDevice(v)}
              className={cn("px-2 py-1", device === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">{t("navPage.megaPreviewHint")}{hasAuto ? ` ${t("navPage.megaPreviewAuto")}` : ""}</p>
      {/* Clicks inside the preview never leave the dashboard. */}
      <div ref={boxRef} className="overflow-hidden rounded-lg border bg-muted/30"
        onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }}>
        {device === "desktop" ? (
          <div style={{ height: height ?? undefined }}>
            <div ref={innerRef} style={{ width: DESKTOP_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }} className="p-3">
              <MegaPanel item={filled} onNavigate={() => {}} inline />
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[375px] bg-background p-3">
            <ul>
              <StudioMobileItem item={filled} expanded onToggle={() => {}} onNavigate={() => {}} />
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
