"use client";

/**
 * In-place menu editing on the builder canvas (menus P3).
 *
 * When a menu block (Classic header `navigation`, or the Menu block
 * `header_nav`) is selected, this bar sits right under it:
 * - its top-level links as chips, in order: click one to rename it, drag
 *   one to reorder, x to remove;
 * - "+ Add" at the end: pick a page (or type a link) and its text;
 * - "Edit full menu": the full Navigation editor (nesting, item settings,
 *   mega menus) in a side drawer, without leaving the builder.
 * Clicking a link in the block itself opens the rename box right on that
 * link. The renderers stay untouched (the box floats over them).
 *
 * Every change saves to the saved menu at once (live, with a history
 * version, menus P1), and the bar says where else that menu shows. A block
 * that shows the automatic menu (its pages) or its own typed links has no
 * saved menu yet: the first change saves those links as one and points the
 * block at it by id (the block's typed links stay as the fallback).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListTree, Loader2, PanelRightOpen, Plus, Sparkles, X } from "lucide-react";
import type { Block, NavItem } from "@/types/cms";
import { useBuilderStore, type ContainerPath } from "@/lib/store/builder";
import { useT } from "@/lib/i18n/language-provider";
import { cn } from "@/lib/utils";
import { flattenTree, newNavId, removeItem, updateItem } from "@/modules/navigation/menu-model";
import { isMenuPlacement } from "@/modules/navigation/nav-blocks";
import { findClickedItem } from "@/modules/navigation/canvas-edit";
import { pickMenuSource, refreshSavedMenus, useDefaultMenu, useSavedMenus } from "../saved-menus";
import { fetchMenuReaders, materializeMenu, saveMenuItems, useMenuPlaces } from "@/components/admin/menus/menu-edit-client";
import { MenuEditDrawer, UsedInLine, useLinkTargets } from "@/components/admin/menus/menu-edit-drawer";
import { LinkField } from "@/app/(admin)/dashboard/navigation/menu-tree-editor";
import type { LinkTarget } from "@/app/api/navigation/link-targets/route";

export function isCanvasMenuBlock(b: Block): boolean {
  return b.type === "navigation" || b.type === "header_nav";
}

/** A link clicked inside the block: its text and address, and where it sits on screen. */
export type ClickedMenuLink = {
  text: string;
  href: string;
  rect: { left: number; top: number; width: number; height: number };
  at: number;
};

type MenuData = { items?: NavItem[]; menuLocation?: string; menuId?: string };

export function MenuCanvasEditor({ block, path, clicked, onClickedDone }: {
  block: Block;
  path?: ContainerPath;
  clicked: ClickedMenuLink | null;
  onClickedDone: () => void;
}) {
  const t = useT();
  const { updateBlock } = useBuilderStore();
  const data = (block.data ?? {}) as MenuData;
  const menus = useSavedMenus();
  const defaults = useDefaultMenu(!(data.items?.length));
  const source = menus ? pickMenuSource(data, menus, defaults) : null;
  const [optimistic, setOptimistic] = useState<NavItem[] | null>(null);
  const items = useMemo(() => optimistic ?? source?.items ?? [], [optimistic, source?.items]);
  const menuId = source?.kind === "menu" ? source.menu.id : undefined;
  const places = useMenuPlaces(menuId, menus);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // rect: where the rename box floats, relative to this editor (over the clicked link).
  const [renaming, setRenaming] = useState<{ id: string; rect?: ClickedMenuLink["rect"] } | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [adding, setAdding] = useState(false);

  // Saved state came back: drop the optimistic copy.
  const sourceItems = source?.items;
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved menu reloaded
  useEffect(() => { setOptimistic(null); }, [sourceItems]);

  // A link clicked in the block: rename it right there.
  useEffect(() => {
    // Only a fresh click (a stale one from before the block was re-selected is ignored).
    if (!clicked || !source || Date.now() - clicked.at > 4000) return;
    const hit = findClickedItem(items, clicked.text, clicked.href);
    const own = boxRef.current?.getBoundingClientRect();
    if (hit && own) setRenaming({ id: hit.id, rect: { ...clicked.rect, left: clicked.rect.left - own.left, top: clicked.rect.top - own.top } });
    else toast.message(t("menuEdit.notFound"));
    onClickedDone();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one reaction per click
  }, [clicked?.at, !!source]);

  const placement = isMenuPlacement(block);
  const name = source?.kind === "menu" ? (source.menu.name || t("menuPlace.unnamed")) : t("menuEdit.auto");

  async function commit(next: NavItem[]): Promise<boolean> {
    if (!source || busy) return false;
    setBusy(true);
    setOptimistic(next);
    let ok = false;
    if (source.kind === "menu") {
      ok = !!(await saveMenuItems(source.menu.id, next, t("menuEdit.saveFailed")));
      if (ok) toast.success(t("menuEdit.saved"));
    } else {
      // First edit: save these links as a real menu, then show it here by id.
      const location = data.menuLocation ?? (placement ? "none" : "header");
      const menuName = location === "header" ? t("menuEdit.mainMenuName") : t("menuEdit.menuName");
      const created = await materializeMenu(next, menuName, location, menus ?? [], t("menuEdit.saveFailed"));
      if (created) {
        updateBlock(block.id, { data: { ...block.data, menuId: created.id } } as Partial<Block>, path);
        void fetchMenuReaders(true);
        toast.success(t("menuEdit.savedNew", { name: created.name || menuName }));
        ok = true;
      }
    }
    refreshSavedMenus();
    setBusy(false);
    if (!ok) setOptimistic(null);
    return ok;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((i) => i.id === e.active.id);
    const to = items.findIndex((i) => i.id === e.over!.id);
    if (from < 0 || to < 0) return;
    void commit(arrayMove(items, from, to));
  }

  const rename = (id: string, label: string) => {
    setRenaming(null);
    const clean = label.trim();
    const cur = flattenTree(items).find((f) => f.id === id)?.item;
    if (!clean || !cur || cur.label === clean) return;
    void commit(updateItem(items, id, { label: clean }));
  };
  const remove = (item: NavItem) => {
    const subs = flattenTree(item.children ?? []).length;
    if (subs && !window.confirm(t("menuEdit.removeConfirm", { name: item.label, count: subs }))) return;
    void commit(removeItem(items, item.id));
  };

  const notice = source?.kind === "menu" ? t("menuEdit.sharedHint") : source?.kind === "inline" ? t("menuEdit.inlineHint") : t("menuEdit.autoHint");
  const renameItem = renaming ? flattenTree(items).find((f) => f.id === renaming.id)?.item : undefined;

  return (
    <div ref={boxRef} data-menu-canvas-editor="" role="region" aria-label={t("menuEdit.editorLabel")}
      className="relative mt-1 w-full max-w-3xl rounded-lg border bg-background p-2 text-xs text-foreground shadow-lg"
      onClick={(e) => e.stopPropagation()}>
      {/* Rename box over a link clicked in the block itself. */}
      {renaming?.rect && renameItem && (
        <RenameBox
          key={renaming.id}
          initial={renameItem.label}
          label={t("menuEdit.rename", { name: renameItem.label })}
          style={{ position: "absolute", left: Math.max(0, renaming.rect.left - 4), top: renaming.rect.top - 6, minWidth: Math.max(renaming.rect.width + 24, 140) }}
          onDone={(v) => (v === null ? setRenaming(null) : rename(renaming.id, v))}
        />
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pb-1.5">
        {source?.kind === "menu" ? <ListTree className="h-3.5 w-3.5 text-primary" aria-hidden /> : <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />}
        <span className="font-semibold">
          {source?.kind === "menu" ? t("menuEdit.shared", { name }) : source?.kind === "inline" ? t("menuEdit.inline") : t("menuEdit.auto")}
        </span>
        {source?.kind === "menu" && <span className="text-muted-foreground"><UsedInLine places={places} /></span>}
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-label={t("menuEdit.saving")} />}
        <span className="flex-1" />
        <button type="button" onClick={() => setDrawerOpen(true)} disabled={!source}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium hover:border-primary hover:text-primary disabled:opacity-50">
          <PanelRightOpen className="h-3.5 w-3.5" aria-hidden />{t("menuEdit.editFull")}
        </button>
      </div>

      {!source ? (
        <p className="py-1 text-muted-foreground">{t("menuPlace.loading")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={horizontalListSortingStrategy}>
            <ul className="flex flex-wrap items-center gap-1.5" aria-label={t("menuEdit.itemsLabel")}>
              {items.map((item) => (
                <Chip key={item.id} item={item}
                  renaming={renaming?.id === item.id && !renaming.rect}
                  onRename={() => setRenaming({ id: item.id })}
                  onRenamed={(v) => (v === null ? setRenaming(null) : rename(item.id, v))}
                  onRemove={() => remove(item)} />
              ))}
              <li>
                <button type="button" onClick={() => setAdding((a) => !a)} aria-expanded={adding}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-1 font-medium text-primary hover:bg-primary/5">
                  <Plus className="h-3 w-3" aria-hidden />{t("menuEdit.add")}
                </button>
              </li>
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {source && !items.length && <p className="pt-1 text-muted-foreground">{t("menuEdit.noPages")}</p>}

      {adding && source && (
        <AddLinkForm onCancel={() => setAdding(false)}
          onAdd={(label, url, tg) => {
            setAdding(false);
            void commit([...items, { id: newNavId(), label, url, ...(tg?.kind && tg.ref ? { kind: tg.kind, ref: tg.ref } : {}) }]);
          }} />
      )}

      <p className="pt-1.5 text-[11px] text-muted-foreground">{notice}</p>

      {source && (
        <MenuEditDrawer open={drawerOpen} onOpenChange={setDrawerOpen} name={name} menuId={menuId} items={items}
          places={places} notice={notice} onSave={commit} />
      )}
    </div>
  );
}

function Chip({ item, renaming, onRename, onRenamed, onRemove }: {
  item: NavItem;
  renaming: boolean;
  onRename: () => void;
  onRenamed: (label: string | null) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const subs = item.children?.length ?? 0;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("inline-flex items-center rounded-full border bg-muted/40", isDragging && "z-10 opacity-60 shadow")}>
      <button type="button" {...attributes} {...listeners} aria-label={t("menuEdit.drag", { name: item.label })}
        className="cursor-grab touch-none rounded-s-full py-1 ps-1.5 pe-0.5 text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-3 w-3" aria-hidden />
      </button>
      {renaming ? (
        <RenameBox initial={item.label} label={t("menuEdit.rename", { name: item.label })} onDone={onRenamed} />
      ) : (
        <button type="button" onClick={onRename} title={t("menuEdit.renameHint")} aria-label={t("menuEdit.rename", { name: item.label })}
          className="max-w-[12rem] truncate px-1 py-1 font-medium hover:text-primary">
          {item.label}
          {subs > 0 && <span className="ms-1 text-[10px] font-normal text-muted-foreground" title={t("menuEdit.subCount", { count: subs })}>▾{subs}</span>}
        </button>
      )}
      <button type="button" onClick={onRemove} aria-label={t("menuEdit.remove", { name: item.label })}
        className="rounded-e-full py-1 pe-1.5 ps-0.5 text-muted-foreground hover:text-destructive">
        <X className="h-3 w-3" aria-hidden />
      </button>
    </li>
  );
}

/** Text box for a new label: Enter saves, Esc cancels, leaving it saves. */
function RenameBox({ initial, label, onDone, style }: {
  initial: string;
  label: string;
  onDone: (value: string | null) => void;
  style?: React.CSSProperties;
}) {
  const t = useT();
  const [value, setValue] = useState(initial);
  const done = useRef(false);
  const finish = (v: string | null) => { if (done.current) return; done.current = true; onDone(v); };
  return (
    <span style={style} className={cn(style && "z-40 rounded-md border border-primary bg-background p-1 shadow-lg")}>
      <input autoFocus value={value} aria-label={label} maxLength={80} title={t("menuEdit.renameHint")}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") { e.preventDefault(); finish(value); }
          if (e.key === "Escape") { e.preventDefault(); finish(null); }
        }}
        onBlur={() => finish(value)}
        className="w-full min-w-[6rem] rounded border bg-background px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary" />
    </span>
  );
}

/** "+ Add": a page (or any link) and the text to show. */
function AddLinkForm({ onAdd, onCancel }: { onAdd: (label: string, url: string, target?: LinkTarget | null) => void; onCancel: () => void }) {
  const t = useT();
  const targets = useLinkTargets();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("/");
  const [target, setTarget] = useState<LinkTarget | null>(null);
  const [touched, setTouched] = useState(false);
  const linkedTo = target?.kind && target.ref ? `${target.kind}:${target.ref}` : undefined;
  return (
    <form className="mt-2 space-y-1.5 rounded-md border border-primary/40 p-2" aria-label={t("menuEdit.addTitle")}
      onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); if (label.trim() && url.trim()) onAdd(label.trim(), url.trim(), target); }}>
      <p className="font-semibold">{t("menuEdit.addTitle")}</p>
      <LinkField value={url} linkedTo={linkedTo} targets={targets} small
        onChange={(u, tg) => {
          setUrl(u);
          setTarget(tg ?? null);
          // Picking a page fills in its name until the owner types their own.
          if (tg && !touched) setLabel(tg.label.replace(/^\s*[-–—]\s*/, ""));
        }} />
      <input value={label} maxLength={80} placeholder={t("menuEdit.labelPlaceholder")} aria-label={t("menuEdit.label")}
        onChange={(e) => { setLabel(e.target.value); setTouched(true); }}
        onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Escape") onCancel(); }}
        className="w-full rounded border bg-background px-2 py-1 text-xs" />
      <div className="flex justify-end gap-1.5">
        <button type="button" onClick={onCancel} className="rounded px-2 py-1 text-muted-foreground hover:text-foreground">{t("menuPlace.cancel")}</button>
        <button type="submit" disabled={!label.trim() || !url.trim()}
          className="rounded bg-primary px-2.5 py-1 font-semibold text-primary-foreground disabled:opacity-50">{t("menuEdit.addLink")}</button>
      </div>
    </form>
  );
}
