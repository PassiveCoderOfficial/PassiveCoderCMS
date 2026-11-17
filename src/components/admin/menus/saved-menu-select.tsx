"use client";

/**
 * Saved-menu picker (menus P2): every place that shows a menu picks it by
 * id from the site's saved menus (Dashboard > Navigation). Offers "Create a
 * menu" (a small inline form: name and an optional location; the new menu is
 * chosen here at once and opened in Navigation in a new tab, so the editor
 * here keeps its unsaved work) and "Edit this menu".
 */
import { useState } from "react";
import { ExternalLink, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";

export type PickableMenu = { id: string; name?: string | null; location?: string | null; items?: unknown[] | null };

const FIELD = "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring";

/** Locations a new menu can be placed at (same list and labels as the Navigation screen). */
export const MENU_LOCATIONS: { value: string; key: TranslationKey }[] = [
  { value: "none", key: "navPage.locNotAssigned" },
  { value: "header", key: "navPage.locHeader" },
  { value: "footer", key: "navPage.locFooter" },
  { value: "footer_secondary", key: "navPage.locFooterSecondary" },
  { value: "mobile", key: "navPage.locMobile" },
  { value: "sidebar", key: "navPage.locSidebar" },
  { value: "legal", key: "navPage.locLegal" },
];

/** Creates an empty saved menu. Null when it failed (a toast says why, e.g. the location is taken). */
export async function createSavedMenu(name: string, location = "none"): Promise<PickableMenu | null> {
  try {
    const res = await fetch("/api/navigation", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location, items: [] }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.menu) throw new Error(json.error || "Could not create the menu");
    return json.menu as PickableMenu;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not create the menu");
    return null;
  }
}

export const editMenuHref = (id?: string) => (id ? `/dashboard/navigation?menu=${encodeURIComponent(id)}` : "/dashboard/navigation");

/**
 * The "Create a menu" form: asks for the name (and optionally a location)
 * first, creates the menu with that name, then opens it in Navigation in a
 * new tab. `onCreated` receives the new menu.
 */
export function CreateMenuForm({ onCreated, onCancel }: { onCreated: (menu: PickableMenu) => void; onCancel: () => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("none");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const clean = name.trim();
    if (!clean || busy) return;
    setBusy(true);
    const menu = await createSavedMenu(clean, location);
    setBusy(false);
    if (!menu) return;
    onCreated(menu);
    toast.success(t("menuPlace.created"));
    window.open(editMenuHref(menu.id), "_blank", "noopener");
  }

  return (
    <form onSubmit={submit} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t("menuPlace.createMenu")}
      className="space-y-2 rounded-md border border-primary/40 bg-background p-2 text-start">
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.newMenuName")}</span>
        <input autoFocus className={FIELD} value={name} maxLength={80} placeholder={t("menuPlace.newMenuPlaceholder")}
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); onCancel(); } }} />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.newMenuLocation")}</span>
        <select className={FIELD} value={location} onChange={(e) => setLocation(e.target.value)}>
          {MENU_LOCATIONS.map((l) => <option key={l.value} value={l.value}>{t(l.key)}</option>)}
        </select>
        <span className="block text-[10px] text-muted-foreground">{t("menuPlace.newMenuLocationHint")}</span>
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={!name.trim() || busy}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Plus className="h-3 w-3" aria-hidden />}{t("menuPlace.createAndOpen")}
        </button>
        <button type="button" onClick={onCancel} className="h-7 rounded-md px-3 text-xs text-muted-foreground hover:bg-muted">{t("menuPlace.cancel")}</button>
      </div>
    </form>
  );
}

export function SavedMenuSelect({ menus, value, onChange, defaultLabel, onCreated, label }: {
  menus: PickableMenu[] | null;
  value?: string;
  onChange: (id: string | undefined) => void;
  /** Text of the "no menu chosen" option (e.g. "Header menu (default)"). Unset = "Choose a menu". */
  defaultLabel?: string;
  /** A menu was created here (callers add it to their list). */
  onCreated?: (menu: PickableMenu) => void;
  label?: string;
}) {
  const t = useT();
  const [creating, setCreating] = useState(false);
  const missing = !!value && !!menus && !menus.some((m) => m.id === value);
  const chosen = menus?.find((m) => m.id === value);

  return (
    <div className="space-y-1">
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground">{label ?? t("menuPlace.menu")}</span>
        <select className={FIELD} value={value ?? ""} disabled={!menus} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{menus ? defaultLabel ?? t("menuPlace.chooseMenu") : t("menuPlace.loading")}</option>
          {(menus ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || t("menuPlace.unnamed")}{m.location && m.location !== "none" ? ` (${m.location.replace(/_/g, " ")})` : ""}{!(m.items?.length) ? ` · ${t("menuPlace.empty")}` : ""}
            </option>
          ))}
          {missing && <option value={value}>{t("menuPlace.deleted")}</option>}
        </select>
      </label>
      {missing && <p className="text-[11px] text-amber-700" role="status">{t("menuPlace.deletedHint")}</p>}
      {chosen && !(chosen.items?.length) && <p className="text-[11px] text-amber-700" role="status">{t("menuPlace.emptyHint")}</p>}
      {creating ? (
        <CreateMenuForm onCancel={() => setCreating(false)} onCreated={(menu) => { setCreating(false); onCreated?.(menu); onChange(menu.id); }} />
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
            <Plus className="h-3 w-3" aria-hidden />{t("menuPlace.createMenu")}
          </button>
          <a href={editMenuHref(chosen?.id)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
            <ExternalLink className="h-3 w-3" aria-hidden />{chosen ? t("menuPlace.editMenu") : t("menuPlace.allMenus")}
          </a>
        </div>
      )}
    </div>
  );
}
