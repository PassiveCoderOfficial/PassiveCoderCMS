"use client";

/**
 * "Edit full menu" (menus P3): the Navigation screen's full tree editor
 * (nesting, item settings, mega menus, auto lists) in a side drawer, so an
 * owner editing the header in the builder or the Studio never leaves the
 * screen (and never loses unsaved work there). Save is live at once, with a
 * history version; the notice says where else the menu shows.
 */
import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ExternalLink, Info, Loader2, Save, X } from "lucide-react";
import type { NavItem } from "@/types/cms";
import { useT } from "@/lib/i18n/language-provider";
import { attachRefs, collectDeepIds, prepareForSave } from "@/modules/navigation/menu-model";
import type { LinkTarget } from "@/app/api/navigation/link-targets/route";
import { MenuTreeEditor } from "@/app/(admin)/dashboard/navigation/menu-tree-editor";
import { editMenuHref } from "./saved-menu-select";
import type { MenuPlace } from "@/modules/navigation/menu-usage";
import { PLACE_KEY } from "./menu-edit-client";

let targetsPromise: Promise<LinkTarget[]> | null = null;
/** Pages, posts, products... a menu item can link to; fetched once per session. */
export function fetchLinkTargets(): Promise<LinkTarget[]> {
  targetsPromise ??= fetch("/api/navigation/link-targets")
    .then((r) => (r.ok ? r.json() : {}))
    .then((d: { targets?: LinkTarget[] }) => d.targets ?? [])
    .catch(() => []);
  return targetsPromise;
}

export function useLinkTargets(enabled = true): LinkTarget[] {
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetchLinkTargets().then((t) => live && setTargets(t));
    return () => { live = false; };
  }, [enabled]);
  return targets;
}

/** "Used in: the header, page sections" (or "not shown anywhere else yet"). */
export function UsedInLine({ places }: { places: MenuPlace[] | null }) {
  const t = useT();
  if (places === null) return null;
  return (
    <span data-menu-used-in="">
      {places.length ? t("menuEdit.usedIn", { places: places.map((p) => t(PLACE_KEY[p])).join(", ") }) : t("menuEdit.notShown")}
    </span>
  );
}

export function MenuEditDrawer({ open, onOpenChange, name, menuId, items, places, notice, onSave }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown in the title. */
  name: string;
  /** The saved menu (for "History and all menus"); unset for an automatic menu / own links. */
  menuId?: string;
  items: NavItem[];
  places: MenuPlace[] | null;
  /** What saving does (shared menu / saved as a new menu). */
  notice: string;
  /** Saves the edited tree; resolves true when saved. */
  onSave: (items: NavItem[]) => Promise<boolean>;
}) {
  const t = useT();
  const targets = useLinkTargets(open);
  const [draft, setDraft] = useState<NavItem[]>(items);
  const [saving, setSaving] = useState(false);
  // Third-level items the menu had when the drawer opened: the legacy
  // renderer hid them, so saving must not start showing them (as on the
  // Navigation screen).
  const legacyDeep = useMemo(() => collectDeepIds(items), [items]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(items);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a fresh copy each time the drawer opens
    if (open) setDraft(items);
  }, [open, items]);

  const close = (next: boolean) => {
    if (!next && dirty && !saving && !window.confirm(t("menuEdit.drawerUnsaved"))) return;
    onOpenChange(next);
  };

  async function save() {
    setSaving(true);
    const ok = await onSave(attachRefs(prepareForSave(draft, legacyDeep), targets));
    setSaving(false);
    if (ok) onOpenChange(false);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={close}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10010] bg-black/40" />
        <DialogPrimitive.Content
          data-menu-canvas-editor=""
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-y-0 end-0 z-[10010] flex w-full max-w-2xl flex-col border-s bg-background shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-sm font-semibold">
              {t("menuEdit.drawerTitle", { name })}
            </DialogPrimitive.Title>
            <button type="button" onClick={() => close(false)} aria-label={t("menuEdit.drawerCancel")}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-start gap-2 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>{notice} <UsedInLine places={places} /></p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <MenuTreeEditor items={draft} targets={targets} onChange={setDraft} />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3">
            <a href={editMenuHref(menuId)} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" aria-hidden />{t("menuEdit.openNavigation")}
            </a>
            <span className="flex-1" />
            <button type="button" onClick={() => close(false)} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">
              {t("menuEdit.drawerCancel")}
            </button>
            <button type="button" onClick={() => void save()} disabled={saving || !dirty}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("menuEdit.drawerSave")}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
