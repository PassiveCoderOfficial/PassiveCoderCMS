"use client";

/**
 * Menu Studio editor (Header & Footer Studio phase 1, Nov 2026): the item
 * tree of one menu. Drag and drop with nesting up to 3 levels (drag the
 * handle; drag right to nest under the row above), with button / keyboard
 * equivalents (up, down, nest, un-nest). Per item: icon, short description,
 * badge, new tab, device visibility; per top-level item: dropdown or mega
 * menu, hover or click, featured card; per parent: auto lists from the site's
 * own services, products, posts and pages (latest or hand-picked).
 *
 * Tree operations live in modules/navigation/menu-model.ts (tested). Defaults
 * are never written (device "all", open on hover), so an item the owner only
 * looks at keeps the legacy renderer.
 */
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragMoveEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Trash2, ChevronRight, ChevronDown, GripVertical, Link2, Sparkles,
  ArrowUp, ArrowDown, IndentIncrease, IndentDecrease, Monitor, Smartphone, LayoutGrid, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, NavChildSource, NavMegaFeatured } from "@/types/cms";
import type { LinkTarget } from "@/app/api/navigation/link-targets/route";
import type { AutoPickItem } from "@/app/api/navigation/auto-items/route";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { IconPicker } from "@/components/ui/icon-picker";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import {
  MAX_MENU_DEPTH, flattenTree, projectDrop, moveItem, removeItem, updateItem, indentItem, outdentItem,
  shiftItem, isMegaItem, newNavId, findItem, isFirstAmongSiblings, type FlatNavItem,
} from "@/modules/navigation/menu-model";

const INDENT = 28;

const SOURCES: NavChildSource[] = ["manual", "services", "service_groups", "products", "product_categories", "posts", "pages"];
const SOURCE_KEY: Record<NavChildSource, TranslationKey> = {
  manual: "navPage.srcManual",
  services: "navPage.srcServices",
  service_groups: "navPage.srcServiceGroups",
  products: "navPage.srcProducts",
  product_categories: "navPage.srcProductCategories",
  posts: "navPage.srcPosts",
  blog_categories: "navPage.srcBlogLegacy",
  pages: "navPage.srcPages",
};

export function newMenuItem(label: string): NavItem {
  return { id: newNavId(), label, url: "/", children: [] };
}

export function MenuTreeEditor({ items, targets, onChange }: {
  items: NavItem[];
  targets: LinkTarget[];
  onChange: (items: NavItem[]) => void;
}) {
  const t = useT();
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const flat = useMemo(() => flattenTree(items), [items]);
  // While dragging, the dragged item's own children travel with it: hide them.
  const visible = useMemo(() => {
    if (!activeId) return flat;
    const active = flat.find((f) => f.id === activeId);
    if (!active) return flat;
    const inside = new Set(flattenTree(active.item.children ?? []).map((f) => f.id));
    return flat.filter((f) => !inside.has(f.id));
  }, [flat, activeId]);
  const projection = activeId && overId ? projectDrop(flat, activeId, overId, offsetX, INDENT) : null;

  const apply = (next: NavItem[], blockedMsg = true) => {
    if (next === items) { if (blockedMsg) toast.error(t("navPage.levelLimit")); return; }
    onChange(next);
  };
  const patch = (id: string, p: Partial<NavItem>) => onChange(updateItem(items, id, p));
  const toggle = (id: string) => setOpenIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setOverId(String(e.active.id));
    setOffsetX(0);
  }
  function onDragMove(e: DragMoveEvent) {
    setOffsetX(e.delta.x);
    if (e.over) setOverId(String(e.over.id));
  }
  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    const proj = over ? projectDrop(flat, id, over, e.delta.x, INDENT) : null;
    setActiveId(null); setOverId(null); setOffsetX(0);
    if (!proj) return;
    apply(moveItem(items, id, proj.parentId, proj.index));
  }

  function addChild(parentId: string) {
    const child = newMenuItem(t("navPage.newLinkLabel"));
    const parent = findItem(items, parentId);
    if (!parent) return;
    onChange(updateItem(items, parentId, { children: [...(parent.children ?? []), child] }));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("navPage.menuItems")}</p>
        <button
          onClick={() => onChange([...items, newMenuItem(t("navPage.newLinkLabel"))])}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:border-primary"
        >
          <Plus className="h-3 w-3" /> {t("navPage.addItem")}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">{t("navPage.dragHint")}</p>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-xs text-muted-foreground">{t("navPage.noItemsYet")}</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd}
          onDragCancel={() => { setActiveId(null); setOverId(null); setOffsetX(0); }}>
          <SortableContext items={visible.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5" aria-label={t("navPage.menuItems")}>
              {visible.map((f) => (
                <TreeRow
                  key={f.id}
                  flat={f}
                  depth={f.id === activeId && projection ? projection.depth : f.depth}
                  targets={targets}
                  open={openIds.includes(f.id)}
                  onToggle={() => toggle(f.id)}
                  onPatch={(p) => patch(f.id, p)}
                  onRemove={() => {
                    // A whole sub-menu goes with the item: ask first.
                    const under = flattenTree(f.item.children ?? []).length;
                    if (under > 0 && !window.confirm(t("navPage.removeWithChildren", { label: f.item.label || t("navPage.newLinkLabel"), count: under, plural: under === 1 ? "" : "s" }))) return;
                    onChange(removeItem(items, f.id));
                  }}
                  onUp={() => apply(shiftItem(items, f.id, -1), false)}
                  onDown={() => apply(shiftItem(items, f.id, 1), false)}
                  onIndent={() => {
                    // Nothing above it at its level: say so, not "3 levels".
                    if (isFirstAmongSiblings(items, f.id)) { toast.error(t("navPage.cannotNestFirst")); return; }
                    apply(indentItem(items, f.id));
                  }}
                  onOutdent={() => apply(outdentItem(items, f.id), false)}
                  onAddChild={() => addChild(f.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function TreeRow({ flat, depth, targets, open, onToggle, onPatch, onRemove, onUp, onDown, onIndent, onOutdent, onAddChild }: {
  flat: FlatNavItem;
  depth: number;
  targets: LinkTarget[];
  open: boolean;
  onToggle: () => void;
  onPatch: (p: Partial<NavItem>) => void;
  onRemove: () => void;
  onUp: () => void;
  onDown: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onAddChild: () => void;
}) {
  const t = useT();
  const { item } = flat;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: flat.id });
  const style = { transform: CSS.Translate.toString(transform), transition, marginInlineStart: depth * INDENT };
  // Level 3 is the last level: only levels 1 and 2 hold sub-items.
  const canHaveChildren = flat.depth < MAX_MENU_DEPTH - 1;
  const source = item.childSource ?? "manual";
  const kids = item.children?.length ?? 0;
  const tags: string[] = [];
  if (flat.depth === 0 && kids + (source !== "manual" ? 1 : 0) > 0) tags.push(isMegaItem(item) ? t("navPage.tagMega") : t("navPage.tagDropdown"));
  if (source !== "manual") tags.push(t(SOURCE_KEY[source]));
  if (item.device === "desktop") tags.push(t("navPage.deviceDesktop"));
  if (item.device === "mobile") tags.push(t("navPage.devicePhone"));
  if (item.badge) tags.push(item.badge);

  return (
    <li ref={setNodeRef} style={style} className={cn("rounded-lg border bg-card", isDragging && "z-10 opacity-80 shadow-lg ring-1 ring-primary/40")}>
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        <button type="button" {...attributes} {...listeners} aria-label={t("navPage.dragToMove")}
          className="cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex items-center">
          <IconBtn label={t("navPage.moveUp")} onClick={onUp}><ArrowUp className="h-3 w-3" /></IconBtn>
          <IconBtn label={t("navPage.moveDown")} onClick={onDown}><ArrowDown className="h-3 w-3" /></IconBtn>
          <IconBtn label={t("navPage.outdent")} onClick={onOutdent} disabled={flat.depth === 0}><IndentDecrease className="h-3 w-3" /></IconBtn>
          <IconBtn label={t("navPage.indent")} onClick={onIndent}><IndentIncrease className="h-3 w-3" /></IconBtn>
        </div>

        <input
          className="w-36 shrink-0 rounded border bg-background px-2 py-1.5 text-sm"
          value={item.label}
          aria-label={t("navPage.labelPlaceholder")}
          onChange={(e) => onPatch({ label: e.target.value })}
          placeholder={t("navPage.labelPlaceholder")}
        />
        <LinkField value={item.url} targets={targets} onChange={(url) => onPatch({ url })} />

        {tags.length > 0 && (
          <span className="hidden flex-wrap gap-1 sm:flex">
            {tags.map((x) => <span key={x} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{x}</span>)}
          </span>
        )}

        <button type="button" onClick={onToggle} aria-expanded={open}
          className={cn("inline-flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium", open ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {t("navPage.itemSettings")}
        </button>
        <IconBtn label={t("navPage.removeItem")} onClick={onRemove} danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
      </div>

      {open && (
        <ItemSettings item={item} depth={flat.depth} targets={targets} onPatch={onPatch}
          onAddChild={canHaveChildren ? onAddChild : undefined} />
      )}
    </li>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: {
  label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className={cn("rounded p-1 text-muted-foreground disabled:opacity-25", danger ? "hover:text-destructive" : "hover:bg-muted hover:text-foreground")}>
      {children}
    </button>
  );
}

const fieldCls = "w-full rounded border bg-background px-2 py-1.5 text-xs";
const labelCls = "mb-1 block text-[11px] font-medium";

function ItemSettings({ item, depth, targets, onPatch, onAddChild }: {
  item: NavItem;
  depth: number;
  targets: LinkTarget[];
  onPatch: (p: Partial<NavItem>) => void;
  onAddChild?: () => void;
}) {
  const t = useT();
  const source = item.childSource ?? "manual";
  const top = depth === 0;
  const mega = isMegaItem(item);
  const hasSub = (item.children?.length ?? 0) > 0 || source !== "manual";
  const featured = item.mega?.featured ?? {};
  const setFeatured = (p: Partial<NavMegaFeatured>) => {
    const next = { ...featured, ...p };
    for (const k of Object.keys(next) as (keyof NavMegaFeatured)[]) if (!next[k]) delete next[k];
    onPatch({ mega: { ...(item.mega ?? {}), featured: next }, megaMenu: true });
  };

  return (
    <div className="grid gap-3 border-t p-3 sm:grid-cols-2">
      {/* Per-item details */}
      <div>
        <label className={labelCls}>{t("navPage.icon")}</label>
        <div className="flex items-center gap-2">
          <IconPicker value={item.showIcon ? item.icon ?? "" : ""}
            onChange={(v) => onPatch(v ? { icon: v, showIcon: true } : { showIcon: undefined, ...(item.showIcon ? { icon: undefined } : {}) })} />
        </div>
      </div>
      <div>
        <label className={labelCls}>{t("navPage.badge")}</label>
        <input className={fieldCls} maxLength={20} value={item.badge ?? ""} placeholder={t("navPage.badgePlaceholder")}
          onChange={(e) => onPatch({ badge: e.target.value || undefined })} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>{t("navPage.description")}</label>
        <input className={fieldCls} maxLength={120} value={item.description ?? ""}
          onChange={(e) => onPatch({ description: e.target.value || undefined })} />
        <p className="mt-1 text-[10px] text-muted-foreground">{t("navPage.descriptionHint")}</p>
      </div>
      <div>
        <label className={labelCls}>{t("navPage.device")}</label>
        <div className="flex gap-1" role="radiogroup" aria-label={t("navPage.device")}>
          {([["all", t("navPage.deviceAll"), LayoutGrid], ["desktop", t("navPage.deviceDesktop"), Monitor], ["mobile", t("navPage.devicePhone"), Smartphone]] as const).map(([v, label, Icon]) => {
            const on = (item.device ?? "all") === v;
            return (
              <button key={v} type="button" role="radio" aria-checked={on}
                onClick={() => onPatch({ device: v === "all" ? undefined : v })}
                className={cn("inline-flex flex-1 items-center justify-center gap-1 rounded border px-2 py-1.5 text-[11px]", on ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/40")}>
                <Icon className="h-3 w-3" /> {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-end">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium">
          <input type="checkbox" className="rounded" checked={item.target === "_blank"}
            onChange={(e) => onPatch({ target: e.target.checked ? "_blank" : undefined })} />
          {t("navPage.openInNewTab")}
        </label>
      </div>

      {top && (
        <div>
          <label className={labelCls}>{t("navPage.look")}</label>
          <select className={fieldCls} value={item.highlight ?? ""}
            onChange={(e) => onPatch({ highlight: (e.target.value || undefined) as NavItem["highlight"] })}>
            <option value="">{t("navPage.lookNormal")}</option>
            <option value="gold">{t("navPage.lookGold")}</option>
            <option value="brand">{t("navPage.lookBrand")}</option>
            <option value="dark">{t("navPage.lookDark")}</option>
          </select>
        </div>
      )}

      {/* Dropdown / mega menu (top level) */}
      {top && hasSub && (
        <div className="space-y-2 rounded border bg-muted/40 p-2.5 sm:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className={labelCls}>{t("navPage.display")}</label>
              <select className={fieldCls} value={mega ? "mega" : "dropdown"}
                onChange={(e) => onPatch(e.target.value === "mega" ? { megaMenu: true } : { megaMenu: false, mega: undefined })}>
                <option value="dropdown">{t("navPage.displayDropdown")}</option>
                <option value="mega">{t("navPage.displayMega")}</option>
              </select>
              <p className="mt-1 text-[10px] text-muted-foreground">{mega ? t("navPage.megaMenuHint") : t("navPage.dropdownHint")}</p>
            </div>
            <div>
              <label className={labelCls}>{t("navPage.opensOn")}</label>
              <select className={fieldCls} value={item.openOn ?? "hover"}
                onChange={(e) => onPatch({ openOn: e.target.value === "click" ? "click" : undefined })}>
                <option value="hover">{t("navPage.opensHover")}</option>
                <option value="click">{t("navPage.opensClick")}</option>
              </select>
            </div>
          </div>
          {mega && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t("navPage.columns")}</label>
                  <select className={fieldCls} value={String(item.megaColumns ?? 5)}
                    onChange={(e) => onPatch({ megaColumns: Number(e.target.value) as 2 | 3 | 4 | 5 })}>
                    {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{t("navPage.columnsCount", { count: n })}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t("navPage.singleLinks")}</label>
                  <select className={fieldCls} value={item.megaLinksAs ?? "strip"}
                    onChange={(e) => onPatch({ megaLinksAs: e.target.value as "strip" | "column" })}>
                    <option value="strip">{t("navPage.singleStrip")}</option>
                    <option value="column">{t("navPage.singleColumn")}</option>
                  </select>
                  {item.megaLinksAs === "column" && (
                    <input className={cn(fieldCls, "mt-1.5")} placeholder={t("navPage.singleColumnTitle")}
                      value={item.megaLinksTitle ?? ""} onChange={(e) => onPatch({ megaLinksTitle: e.target.value })} />
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{t("navPage.megaColumnsHint")}</p>
              <div className="space-y-2 rounded border bg-background p-2.5">
                <p className="text-[11px] font-semibold">{t("navPage.featured")}</p>
                <p className="text-[10px] text-muted-foreground">{t("navPage.featuredHint")}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{t("navPage.featuredImage")}</label>
                    <MediaPickerInput compact value={featured.image ?? ""} onChange={(url) => setFeatured({ image: url })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("navPage.featuredTitle")}</label>
                    <input className={fieldCls} value={featured.title ?? ""} onChange={(e) => setFeatured({ title: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelCls}>{t("navPage.featuredCta")}</label>
                    <input className={fieldCls} value={featured.ctaLabel ?? ""} onChange={(e) => setFeatured({ ctaLabel: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{t("navPage.featuredText")}</label>
                    <textarea className={fieldCls} rows={2} value={featured.text ?? ""} onChange={(e) => setFeatured({ text: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>{t("navPage.featuredLink")}</label>
                    <LinkField value={featured.url ?? ""} targets={targets} small onChange={(url) => setFeatured({ url })} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-items: hand-picked or an auto list */}
      {onAddChild && (
        <div className="space-y-2 sm:col-span-2">
          <label className={labelCls}>{t("navPage.subMenuContents")}</label>
          <select className={fieldCls} value={source}
            onChange={(e) => onPatch({ childSource: e.target.value === "manual" ? undefined : e.target.value as NavChildSource, childIds: undefined })}>
            {SOURCES.concat(source === "blog_categories" ? ["blog_categories"] : []).map((s) => (
              <option key={s} value={s}>{t(SOURCE_KEY[s])}</option>
            ))}
          </select>
          <p className="flex items-start gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0" />
            {source === "manual" ? t("navPage.manualHint") : t("navPage.dynamicHint")}
          </p>
          {source === "manual" ? (
            <button type="button" onClick={onAddChild}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
              <Plus className="h-3 w-3" /> {t("navPage.addSubItem")}
            </button>
          ) : (
            <AutoListSettings item={item} onPatch={onPatch} />
          )}
        </div>
      )}
    </div>
  );
}

function AutoListSettings({ item, onPatch }: { item: NavItem; onPatch: (p: Partial<NavItem>) => void }) {
  const t = useT();
  const source = item.childSource ?? "manual";
  const picked = item.childIds ?? [];
  const selected = picked.length > 0;
  const [mode, setMode] = useState<"latest" | "selected">(selected ? "selected" : "latest");
  const [options, setOptions] = useState<AutoPickItem[] | null>(null);

  useEffect(() => {
    if (mode !== "selected") return;
    let alive = true;
    fetch(`/api/navigation/auto-items?source=${encodeURIComponent(source)}`)
      .then((r) => r.json())
      .then((d: { items?: AutoPickItem[] }) => { if (alive) setOptions(d.items ?? []); })
      .catch(() => { if (alive) setOptions([]); });
    return () => { alive = false; };
  }, [mode, source]);

  const togglePick = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    onPatch({ childIds: next.length ? next : undefined });
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{t("navPage.autoMode")}</label>
          <select className={fieldCls} value={mode}
            onChange={(e) => { const m = e.target.value as "latest" | "selected"; setMode(m); if (m === "latest") onPatch({ childIds: undefined }); }}>
            <option value="latest">{t("navPage.autoLatest")}</option>
            <option value="selected">{t("navPage.autoSelected")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("navPage.maxItemsShown")}</label>
          <input type="number" min={1} max={50} className={cn(fieldCls, "w-24")} value={item.childLimit ?? 12}
            onChange={(e) => onPatch({ childLimit: Math.min(50, Math.max(1, Number(e.target.value) || 12)) })} />
        </div>
      </div>
      {mode === "selected" && (
        <div className="max-h-48 overflow-y-auto rounded border bg-background p-2">
          {options === null ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t("navPage.autoLoading")}</p>
          ) : options.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">{t("navPage.autoNone")}</p>
          ) : (
            options.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 py-0.5 text-[11px]">
                <input type="checkbox" className="rounded" checked={picked.includes(o.id)} onChange={() => togglePick(o.id)} />
                <span className="truncate">{o.label}</span>
                {picked.includes(o.id) && <span className="ms-auto text-[10px] text-muted-foreground">#{picked.indexOf(o.id) + 1}</span>}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** URL field that offers real destinations, while still allowing a custom
 *  value for external links and anchors. */
export function LinkField({ value, targets, onChange, small }: {
  value: string;
  targets: LinkTarget[];
  onChange: (url: string) => void;
  small?: boolean;
}) {
  const t = useT();
  // "Custom URL" chosen while the link still matches a page: keep the text
  // box open so the URL can be edited (before P0 the choice did nothing).
  const [customOpen, setCustomOpen] = useState(false);
  const known = !customOpen && targets.some((tg) => tg.url === value);
  const groups = Array.from(new Set(targets.map((tg) => tg.group)));

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5")}>
      <select
        className={cn("min-w-0 flex-1 rounded border bg-background px-2 text-xs", small ? "py-1" : "py-1.5")}
        value={known ? value : "__custom__"}
        aria-label={t("navPage.linkTo")}
        onChange={(e) => {
          if (e.target.value === "__custom__") { setCustomOpen(true); return; }
          setCustomOpen(false);
          onChange(e.target.value);
        }}
      >
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {targets.filter((tg) => tg.group === g).map((tg) => (
              <option key={tg.url} value={tg.url}>{tg.label}</option>
            ))}
          </optgroup>
        ))}
        <option value="__custom__">{t("navPage.customUrl")}</option>
      </select>
      {!known && (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
          <input
            className={cn("min-w-0 flex-1 rounded border bg-background px-2 font-mono text-xs", small ? "py-1" : "py-1.5")}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("navPage.urlPlaceholder")}
          />
        </div>
      )}
    </div>
  );
}
