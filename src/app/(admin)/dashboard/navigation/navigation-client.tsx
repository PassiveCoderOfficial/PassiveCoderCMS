"use client";

import { useEffect, useMemo, useState } from "react";
import { menuUsage, type MenuPlace, type MenuReaders } from "@/modules/navigation/menu-usage";
import { mergeAfterSave, saveOrder } from "@/modules/navigation/menu-save";
import { useUnsavedGuard } from "@/lib/hooks/use-unsaved-guard";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, Save, MapPin, AlertTriangle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collectDeepIds, normalizeMenu, prepareForSave } from "@/modules/navigation/menu-model";
import type { NavItem } from "@/types/cms";
import { MenuTreeEditor } from "./menu-tree-editor";
import type { LinkTarget } from "@/app/api/navigation/link-targets/route";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

export type NavMenuRow = {
  id: string;
  name: string;
  slug: string;
  location: string;
  items: NavItem[];
  updated_at: string;
};

/** A header/footer nav block still holding its own inline items rather than
 *  pointing at a managed menu — see navigation/page.tsx for how this is
 *  detected. Offered as a one-click import rather than silently invisible. */
export type ImportableNav = {
  location: "header" | "footer";
  items: NavItem[];
  /** The block already points at this location, but no saved menu is there yet. */
  missingMenu?: boolean;
};

const PLACE_KEY: Record<MenuPlace, TranslationKey> = {
  header: "navPage.placeHeader",
  footer: "navPage.placeFooter",
  prefooter: "navPage.placePrefooter",
  pages: "navPage.placePages",
  studioHeader: "navPage.placeStudioHeader",
  studioFooter: "navPage.placeStudioFooter",
};

function locations(t: (k: TranslationKey) => string): { value: string; label: string; hint: string }[] {
  return [
    { value: "none", label: t("navPage.locNotAssigned"), hint: t("navPage.locNotAssignedHint") },
    { value: "header", label: t("navPage.locHeader"), hint: t("navPage.locHeaderHint") },
    { value: "footer", label: t("navPage.locFooter"), hint: t("navPage.locFooterHint") },
    { value: "footer_secondary", label: t("navPage.locFooterSecondary"), hint: t("navPage.locFooterSecondaryHint") },
    { value: "mobile", label: t("navPage.locMobile"), hint: t("navPage.locMobileHint") },
    { value: "sidebar", label: t("navPage.locSidebar"), hint: t("navPage.locSidebarHint") },
    { value: "legal", label: t("navPage.locLegal"), hint: t("navPage.locLegalHint") },
  ];
}

export default function NavigationClient({ initialMenus, importable, readers: initialReaders }: { initialMenus: NavMenuRow[]; importable: ImportableNav[]; readers: MenuReaders }) {
  const t = useT();
  const LOCATIONS = locations(t);
  const [menus, setMenus] = useState<NavMenuRow[]>(initialMenus);
  const [readers, setReaders] = useState<MenuReaders>(initialReaders);
  const [pendingImport, setPendingImport] = useState<ImportableNav[]>(importable);
  const [activeId, setActiveId] = useState<string | null>(initialMenus[0]?.id ?? null);
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importingLocation, setImportingLocation] = useState<string | null>(null);
  // Menus with unsaved edits, by id. Switching menus keeps every menu's
  // edits, and Save saves them all (before P0 only the open menu was sent and
  // the refetch wiped the others' edits).
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set());
  const dirty = dirtyIds.size > 0;
  // Third-level items each menu already had when the page loaded: the legacy
  // renderer hid them under plain dropdowns, so saving must not start showing
  // them (prepareForSave). Only levels the owner adds now switch on flyouts.
  const legacyDeep = useMemo(() => new Map(initialMenus.map((m) => [m.id, collectDeepIds(m.items ?? [])])), [initialMenus]);

  async function importInline(location: "header" | "footer") {
    setImportingLocation(location);
    try {
      const res = await fetch("/api/navigation/import-inline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
      });
      const data = await res.json() as { error?: string; menu?: NavMenuRow };
      if (!res.ok || !data.menu) throw new Error(data.error ?? t("navPage.importFailed"));
      setMenus((prev) => [...prev, { ...data.menu!, items: normalizeMenu(data.menu!.items) }]);
      setPendingImport((prev) => prev.filter((p) => p.location !== location));
      // The imported block now reads this location, so the menu is shown there.
      // (Not when a Studio header/footer is live: the classic one is not drawn.)
      setReaders((r) => (location === "header" ? r.studioHeaderRefs : r.studioFooterRefs)
        ? r
        : { ...r, byLocation: { ...r.byLocation, [location]: [...new Set([...(r.byLocation[location] ?? []), location])] } });
      setActiveId(data.menu.id);
      toast.success(t("navPage.importedMenu", { location }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("navPage.importFailed"));
    } finally {
      setImportingLocation(null);
    }
  }

  const active = menus.find((m) => m.id === activeId) ?? null;

  useEffect(() => {
    fetch("/api/navigation/link-targets")
      .then((r) => r.json())
      .then((d: { targets?: LinkTarget[] }) => setTargets(d.targets ?? []))
      .catch(() => setTargets([]));
  }, []);

  function patchActive(fn: (m: NavMenuRow) => NavMenuRow) {
    if (!activeId) return;
    setMenus((prev) => prev.map((m) => (m.id === activeId ? fn(m) : m)));
    setDirtyIds((prev) => (prev.has(activeId) ? prev : new Set(prev).add(activeId)));
  }

  // Closing the tab, reloading or following a dashboard link with unsaved
  // edits asks first.
  useUnsavedGuard(dirty, t("navPage.unsavedLeave"));

  // Where each menu shows on the live site, from the menus' current (unsaved too) locations.
  const usage = useMemo(() => menuUsage(menus, readers), [menus, readers]);

  async function save() {
    if (!dirty) return;
    setSaving(true);
    const failed = new Set<string>();
    let saved = 0;
    let lastError: string | null = null;
    for (const id of saveOrder(dirtyIds, menus, activeId)) {
      const menu = menus.find((m) => m.id === id)!;
      try {
        const res = await fetch("/api/navigation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: menu.id, name: menu.name, location: menu.location, items: prepareForSave(menu.items, legacyDeep.get(menu.id)) }),
        });
        const data = await res.json() as { error?: string; menu?: NavMenuRow };
        if (!res.ok) throw new Error(data.error ?? t("navPage.failedToSaveMenu"));
        saved++;
      } catch (err) {
        failed.add(id);
        lastError = err instanceof Error ? err.message : t("navPage.failedToSaveMenu");
      }
    }
    try {
      // A location move can unassign another menu server-side; refetch so the
      // list reflects that rather than showing two menus in one slot. A menu
      // whose save failed keeps its edits.
      const listRes = await fetch("/api/navigation");
      const listData = await listRes.json() as { menus?: NavMenuRow[] };
      if (listData.menus) {
        const server = listData.menus.map((m) => ({ ...m, items: normalizeMenu(m.items) }));
        setMenus((local) => mergeAfterSave(local, server, failed));
      }
    } catch { /* keep the local list */ }
    setDirtyIds(failed);
    setSaving(false);
    if (lastError) toast.error(lastError);
    if (saved) toast.success(saved > 1 ? t("navPage.savedCount", { count: saved }) : t("navPage.menuSaved"));
  }

  async function createMenu() {
    setCreating(true);
    try {
      const res = await fetch("/api/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New menu", location: "none", items: [] }),
      });
      const data = await res.json() as { error?: string; menu?: NavMenuRow };
      if (!res.ok || !data.menu) throw new Error(data.error ?? t("navPage.failedToCreateMenu"));
      setMenus((prev) => [...prev, data.menu!]);
      setActiveId(data.menu.id);
      toast.success(t("navPage.menuCreated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("navPage.failedToCreateMenu"));
    } finally {
      setCreating(false);
    }
  }

  async function deleteMenu(id: string) {
    if (!confirm(t("navPage.deleteMenuConfirm"))) return;
    try {
      const res = await fetch(`/api/navigation?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(t("navPage.failedToDeleteMenu"));
      setMenus((prev) => prev.filter((m) => m.id !== id));
      setDirtyIds((prev) => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });
      if (activeId === id) setActiveId(null);
      toast.success(t("navPage.menuDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("navPage.failedToDeleteMenu"));
    }
  }

  const assignedElsewhere = active
    ? menus.find((m) => m.id !== active.id && m.location === active.location && active.location !== "none")
    : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("navPage.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("navPage.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void createMenu()}
            disabled={creating}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:border-primary disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("navPage.newMenu")}
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || !dirty}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold",
              dirty ? "bg-primary text-primary-foreground hover:opacity-90" : "border text-muted-foreground",
              "disabled:opacity-50",
            )}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {dirty ? t("navPage.saveChanges") : t("navPage.saved")}
          </button>
        </div>
      </div>

      {pendingImport.length > 0 && (
        <div className="space-y-2">
          {pendingImport.map((p) => (
            <div key={p.location} className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-[240px]">
                <p className="text-sm font-semibold">
                  {p.missingMenu
                    ? t("navPage.missingMenuTitle", { location: p.location })
                    : t("navPage.alreadyHasMenu", { location: p.location })}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.missingMenu
                    ? t("navPage.missingMenuBody", { count: p.items.length, plural: p.items.length === 1 ? "" : "s" })
                    : t("navPage.linksBuiltIn", { count: p.items.length, plural: p.items.length === 1 ? "" : "s", builder: p.location === "header" ? t("navPage.locHeader") : t("navPage.locFooter") })}
                </p>
              </div>
              <button
                onClick={() => void importInline(p.location)}
                disabled={importingLocation === p.location}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {importingLocation === p.location ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("navPage.importThisMenu")}
              </button>
            </div>
          ))}
        </div>
      )}

      {menus.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {pendingImport.length > 0
              ? t("navPage.importOrCreate")
              : t("navPage.noMenusYet")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          {/* Menu list */}
          <div className="space-y-1.5">
            {menus.map((m) => {
              const loc = LOCATIONS.find((l) => l.value === m.location);
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className={cn(
                    "w-full rounded-lg border bg-card p-3 text-left transition-colors",
                    activeId === m.id ? "border-primary ring-1 ring-primary/30" : "hover:border-primary/40",
                  )}
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="truncate">{m.name}</span>
                    {dirtyIds.has(m.id) && <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">{t("navPage.unsavedBadge")}</span>}
                    {!usage[m.id]?.length && <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t("navPage.notShownBadge")}</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {loc?.label ?? m.location}
                    <span className="ml-auto">{t("navPage.itemsCount", { count: m.items.length, plural: m.items.length === 1 ? "" : "s" })}</span>
                  </p>
                </button>
              );
            })}
          </div>

          {/* Editor */}
          {active && (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">{t("navPage.menuName")}</label>
                  <input
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={active.name}
                    onChange={(e) => patchActive((m) => ({ ...m, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">{t("navPage.shownIn")}</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={active.location}
                    onChange={(e) => patchActive((m) => ({ ...m, location: e.target.value }))}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {LOCATIONS.find((l) => l.value === active.location)?.hint}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  {usage[active.id]?.length ? (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {t("navPage.shownWhere", { places: usage[active.id].map((p) => t(PLACE_KEY[p])).join(", ") })}
                    </p>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5" role="status">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <div className="text-[11px] text-amber-700 dark:text-amber-400">
                        <p className="font-semibold">{t("navPage.notShownTitle")}</p>
                        <p className="mt-0.5">{t("navPage.notShownBody")}</p>
                      </div>
                    </div>
                  )}
                </div>

                {assignedElsewhere && (
                  <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      {t("navPage.assignedElsewhereWarning", { name: assignedElsewhere.name })}
                    </p>
                  </div>
                )}
              </div>

              <MenuTreeEditor
                items={active.items}
                targets={targets}
                onChange={(items) => patchActive((m) => ({ ...m, items }))}
              />

              <button
                onClick={() => deleteMenu(active.id)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" /> {t("navPage.deleteThisMenu")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
