"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, ChevronRight, ChevronDown, GripVertical,
  Save, Link2, Sparkles, MapPin, AlertTriangle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CHILD_SOURCE_LABELS } from "@/modules/navigation/dynamic-children";
import type { NavItem, NavChildSource } from "@/types/cms";
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

function newItem(label: string): NavItem {
  return { id: `nav-${Math.random().toString(36).slice(2, 9)}`, label, url: "/", children: [] };
}

export default function NavigationClient({ initialMenus, importable }: { initialMenus: NavMenuRow[]; importable: ImportableNav[] }) {
  const t = useT();
  const LOCATIONS = locations(t);
  const [menus, setMenus] = useState<NavMenuRow[]>(initialMenus);
  const [pendingImport, setPendingImport] = useState<ImportableNav[]>(importable);
  const [activeId, setActiveId] = useState<string | null>(initialMenus[0]?.id ?? null);
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importingLocation, setImportingLocation] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

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
      setMenus((prev) => [...prev, data.menu!]);
      setPendingImport((prev) => prev.filter((p) => p.location !== location));
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
    setDirty(true);
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch("/api/navigation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, name: active.name, location: active.location, items: active.items }),
      });
      const data = await res.json() as { error?: string; menu?: NavMenuRow };
      if (!res.ok) throw new Error(data.error ?? t("navPage.failedToSaveMenu"));
      // A location move can unassign another menu server-side; refetch so the
      // list reflects that rather than showing two menus in one slot.
      const listRes = await fetch("/api/navigation");
      const listData = await listRes.json() as { menus?: NavMenuRow[] };
      if (listData.menus) setMenus(listData.menus);
      setDirty(false);
      toast.success(t("navPage.menuSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("navPage.failedToSaveMenu"));
    } finally {
      setSaving(false);
    }
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
            disabled={saving || !dirty || !active}
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
                  {t("navPage.alreadyHasMenu", { location: p.location })}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("navPage.linksBuiltIn", { count: p.items.length, plural: p.items.length === 1 ? "" : "s", builder: p.location === "header" ? t("navPage.locHeader") : t("navPage.locFooter") })}
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
                  <p className="truncate text-sm font-semibold">{m.name}</p>
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

                {assignedElsewhere && (
                  <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      {t("navPage.assignedElsewhereWarning", { name: assignedElsewhere.name })}
                    </p>
                  </div>
                )}
              </div>

              <ItemTree
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

/** Two-level menu editor. Deeper nesting isn't offered because the navigation
 *  block only renders one level of dropdown. */
function ItemTree({ items, targets, onChange }: {
  items: NavItem[];
  targets: LinkTarget[];
  onChange: (items: NavItem[]) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState<string[]>([]);

  function update(id: string, patch: Partial<NavItem>) {
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    onChange(items.filter((it) => it.id !== id));
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }
  function updateChild(parentId: string, childId: string, patch: Partial<NavItem>) {
    onChange(items.map((it) => it.id === parentId
      ? { ...it, children: (it.children ?? []).map((c) => (c.id === childId ? { ...c, ...patch } : c)) }
      : it));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{t("navPage.menuItems")}</p>
        <button
          onClick={() => onChange([...items, newItem(t("navPage.newLinkLabel"))])}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:border-primary"
        >
          <Plus className="h-3 w-3" /> {t("navPage.addItem")}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-xs text-muted-foreground">{t("navPage.noItemsYet")}</p>
        </div>
      ) : (
        items.map((item, i) => {
          const isOpen = expanded.includes(item.id);
          const source = item.childSource ?? "manual";
          return (
            <div key={item.id} className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 p-2.5">
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▲</button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none">▼</button>
                </div>
                <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                <input
                  className="w-36 shrink-0 rounded border bg-background px-2 py-1.5 text-sm"
                  value={item.label}
                  onChange={(e) => update(item.id, { label: e.target.value })}
                  placeholder={t("navPage.labelPlaceholder")}
                />

                <LinkField
                  value={item.url}
                  targets={targets}
                  onChange={(url) => update(item.id, { url })}
                />

                <button
                  onClick={() => setExpanded((p) => p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id])}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium",
                    source !== "manual" || (item.children?.length ?? 0) > 0
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {source !== "manual"
                    ? CHILD_SOURCE_LABELS[source]
                    : (item.children?.length ?? 0) > 0
                      ? t("navPage.subItemsCount", { count: item.children!.length, plural: item.children!.length === 1 ? "" : "s" })
                      : t("navPage.subMenu")}
                </button>

                <button onClick={() => remove(item.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {isOpen && (
                <div className="space-y-2.5 border-t p-3">
                  <div className="rounded border bg-muted/40 p-2.5">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={item.megaMenu ?? (item.children ?? []).some((c) => (c.children?.length ?? 0) > 0)}
                        onChange={(e) => update(item.id, { megaMenu: e.target.checked })}
                      />
                      {t("navPage.showAsMegaMenu")}
                    </label>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {t("navPage.megaMenuHint")}
                    </p>
                    {(item.megaMenu ?? (item.children ?? []).some((c) => (c.children?.length ?? 0) > 0)) && (
                      <div className="mt-2">
                        <label className="mb-1 block text-[11px] font-medium">{t("navPage.columns")}</label>
                        <select
                          className="w-full rounded border bg-background px-2 py-1.5 text-xs"
                          value={String(item.megaColumns ?? 5)}
                          onChange={(e) => update(item.id, { megaColumns: Number(e.target.value) as 2 | 3 | 4 | 5 })}
                        >
                          {[2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{t("navPage.columnsCount", { count: n })}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium">{t("navPage.subMenuContents")}</label>
                    <select
                      className="w-full rounded border bg-background px-2 py-1.5 text-xs"
                      value={source}
                      onChange={(e) => update(item.id, { childSource: e.target.value as NavChildSource })}
                    >
                      {(Object.keys(CHILD_SOURCE_LABELS) as NavChildSource[]).map((s) => (
                        <option key={s} value={s}>{CHILD_SOURCE_LABELS[s]}</option>
                      ))}
                    </select>
                    <p className="mt-1 flex items-start gap-1 text-[10px] text-muted-foreground">
                      <Sparkles className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                      {source === "manual"
                        ? t("navPage.manualHint")
                        : t("navPage.dynamicHint")}
                    </p>
                  </div>

                  {source === "manual" ? (
                    <div className="space-y-1.5">
                      {(item.children ?? []).map((child) => (
                        <div key={child.id} className="flex items-center gap-2">
                          <input
                            className="w-32 shrink-0 rounded border bg-background px-2 py-1 text-xs"
                            value={child.label}
                            onChange={(e) => updateChild(item.id, child.id, { label: e.target.value })}
                            placeholder={t("navPage.labelPlaceholder")}
                          />
                          <LinkField
                            value={child.url}
                            targets={targets}
                            small
                            onChange={(url) => updateChild(item.id, child.id, { url })}
                          />
                          <button
                            onClick={() => update(item.id, { children: (item.children ?? []).filter((c) => c.id !== child.id) })}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => update(item.id, { children: [...(item.children ?? []), newItem(t("navPage.newLinkLabel"))] })}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-3 w-3" /> {t("navPage.addSubItem")}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-[11px] font-medium">{t("navPage.maxItemsShown")}</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="w-24 rounded border bg-background px-2 py-1.5 text-xs"
                        value={item.childLimit ?? 12}
                        onChange={(e) => update(item.id, { childLimit: Number(e.target.value) || 12 })}
                      />
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {t("navPage.maxItemsHint")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/** URL field that offers real destinations, while still allowing a custom
 *  value for external links and anchors. */
function LinkField({ value, targets, onChange, small }: {
  value: string;
  targets: LinkTarget[];
  onChange: (url: string) => void;
  small?: boolean;
}) {
  const t = useT();
  const known = targets.some((tg) => tg.url === value);
  const groups = Array.from(new Set(targets.map((tg) => tg.group)));

  return (
    <div className={cn("flex min-w-0 flex-1 items-center gap-1.5")}>
      <select
        className={cn("min-w-0 flex-1 rounded border bg-background px-2 text-xs", small ? "py-1" : "py-1.5")}
        value={known ? value : "__custom__"}
        onChange={(e) => { if (e.target.value !== "__custom__") onChange(e.target.value); }}
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
