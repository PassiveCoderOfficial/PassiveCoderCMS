"use client";

import React from "react";
import { refreshSavedMenus, useSavedMenus } from "../saved-menus";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { SavedMenuSelect } from "@/components/admin/menus/saved-menu-select";
import { LAYOUT_KEY, MENU_LAYOUTS, MenuStyleEditor } from "@/components/admin/menus/menu-style-editor";
import type { MenuLayout } from "@/modules/navigation/menu-style";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { usePathname } from "next/navigation";
import { SwitchToStudioButton } from "@/components/admin/studio-switch/switch-to-studio";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NavItemsEditor } from "./nav-items-editor";
import type { HeaderNavBlockProps, NavigationBlockProps } from "@/types/cms";

type MenuLocation = NonNullable<NavigationBlockProps["data"]["menuLocation"]>;
const LOCATION_LABEL: Record<MenuLocation, string> = {
  header: "Header", footer: "Footer", footer_secondary: "Footer (second)", mobile: "Phone menu", sidebar: "Sidebar", legal: "Legal links",
};

/**
 * Shown above a menu editor when the block reads a saved menu instead of its
 * own links. Says plainly when that menu does not exist (or is empty), since
 * the block then shows something other than what the owner may expect.
 */
export function ManagedMenuNote({ location }: { location?: string }) {
  const menus = useSavedMenus(!!location);
  if (!location) return null;
  const label = LOCATION_LABEL[location as MenuLocation] ?? location.replace(/_/g, " ");
  const menu = menus?.find((m) => m.location === location);
  if (menus && !menu) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900" role="status">
        This block is set to show the saved &quot;{label}&quot; menu, but no menu is placed there, so the live site shows the links below. Create or import it in <Link href="/dashboard/navigation" target="_blank" className="underline font-medium">Dashboard &gt; Navigation</Link>, or choose &quot;The links below&quot;.
      </p>
    );
  }
  if (menu && !(menu.items?.length)) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900" role="status">
        The saved &quot;{label}&quot; menu{menu.name ? ` (${menu.name})` : ""} has no links, so this block shows no links on the live site. Add links in <Link href="/dashboard/navigation" target="_blank" className="underline font-medium">Dashboard &gt; Navigation</Link>.
      </p>
    );
  }
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
      These links come from the &quot;{label}&quot; menu{menu?.name ? ` (${menu.name})` : ""}. Edit them in <Link href="/dashboard/navigation" target="_blank" className="underline font-medium">Dashboard &gt; Navigation</Link>; the list below is only used if that menu is missing.
    </p>
  );
}

/**
 * Which managed menu (Dashboard > Navigation) the block shows. The live site
 * and this builder's preview swap the block's own links for that menu's
 * (page-renderer resolveNavBlocks, at any depth since P0); "None" keeps the
 * links typed below.
 */
export function MenuLocationPicker({ value, onChange }: { value?: MenuLocation; onChange: (v: MenuLocation | undefined) => void }) {
  const menus = useSavedMenus();
  const assigned = (menus ?? []).filter((m) => m.location && m.location !== "none" && m.location in LOCATION_LABEL);
  const options = [...new Set([...assigned.map((m) => m.location as MenuLocation), ...(value ? [value] : [])])];
  return (
    <div>
      <Label className="text-xs">Menu shown</Label>
      <Select value={value ?? "__inline"} onValueChange={(v) => onChange(v === "__inline" ? undefined : (v as MenuLocation))}>
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__inline" className="text-xs">The links below (this block only)</SelectItem>
          {options.map((loc) => {
            const m = assigned.find((x) => x.location === loc);
            return <SelectItem key={loc} value={loc} className="text-xs">{LOCATION_LABEL[loc]} menu{m?.name ? `: ${m.name}` : ""}{!m && menus ? " (not set up)" : ""}</SelectItem>;
          })}
        </SelectContent>
      </Select>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {menus && !assigned.length ? "No saved menus yet. " : ""}Menus are made in <Link href="/dashboard/navigation" target="_blank" className="underline">Dashboard &gt; Navigation</Link>. The live site and this preview show the chosen menu (auto lists fill in on the live site).
      </p>
    </div>
  );
}

const FIELD = "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring";
const k = (key: string) => key as TranslationKey;

/**
 * The page "Menu" block (menus P2): which saved menu, its layout, its look.
 * Blocks saved before P2 keep the classic panel below (their own links and
 * the classic look) until the owner switches them over.
 */
function MenuBlockSettings({ block }: { block: HeaderNavBlockProps }) {
  const t = useT();
  const { updateBlock } = useBuilderStore();
  const menus = useSavedMenus();
  const d = block.data;
  const set = (patch: Partial<HeaderNavBlockProps["data"]>) => {
    const data = { ...block.data, ...patch } as Record<string, unknown>;
    for (const key of Object.keys(patch)) if (data[key] === undefined || data[key] === "") delete data[key];
    updateBlock(block.id, { data: data as HeaderNavBlockProps["data"] });
  };
  const layout = d.layout ?? "bar";
  const barWithButton = layout === "bar" && d.phoneLayout !== "same";
  const ownLinks = !d.menuId && !d.menuLocation && (d.items?.length ?? 0) > 0;
  return (
    <div className="space-y-3">
      <SavedMenuSelect menus={menus} value={d.menuId} onChange={(id) => set({ menuId: id })} onCreated={() => refreshSavedMenus()}
        defaultLabel={ownLinks ? t("menuPlace.ownLinks") : undefined} />
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.layout")}</span>
        <select className={FIELD} value={layout} onChange={(e) => set({ layout: e.target.value as MenuLayout })}>
          {MENU_LAYOUTS.map((l) => <option key={l} value={l}>{t(LAYOUT_KEY[l])}</option>)}
        </select>
        <span className="block text-[10px] text-muted-foreground">{t(k(`menuPlace.layoutHint.${layout}`))}</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(layout === "bar" || layout === "inline" || layout === "drawer") && (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.align")}</span>
            <select className={FIELD} value={d.align ?? "start"} onChange={(e) => set({ align: e.target.value === "start" ? undefined : (e.target.value as "center" | "end") })}>
              {(["start", "center", "end"] as const).map((a) => <option key={a} value={a}>{t(k(`menuPlace.align.${a}`))}</option>)}
            </select>
          </label>
        )}
        {layout === "bar" && (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.onPhones")}</span>
            <select className={FIELD} value={d.phoneLayout ?? "drawer"} onChange={(e) => set({ phoneLayout: e.target.value === "same" ? "same" : undefined })}>
              <option value="drawer">{t("menuPlace.onPhonesButton")}</option>
              <option value="same">{t("menuPlace.onPhonesSame")}</option>
            </select>
          </label>
        )}
        {(layout === "vertical" || layout === "inline") && (
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.levels")}</span>
            <select className={FIELD} value={d.levels ?? (layout === "inline" ? 1 : 3)} onChange={(e) => set({ levels: Number(e.target.value) })}>
              {[1, 2, 3].map((n) => <option key={n} value={n}>{t(k(`menuPlace.levels${n}`))}</option>)}
            </select>
          </label>
        )}
      </div>
      {(layout === "drawer" || barWithButton) && (
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.buttonLabel")}</span>
          <input className={FIELD} value={d.buttonLabel ?? ""} placeholder={t("menuPlace.buttonLabelPlaceholder")} maxLength={40} onChange={(e) => set({ buttonLabel: e.target.value || undefined })} />
        </label>
      )}
      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-muted-foreground">{t("menuPlace.ariaLabel")}</span>
        <input className={FIELD} value={d.label ?? ""} placeholder={t("menuPlace.ariaLabelPlaceholder")} maxLength={60} onChange={(e) => set({ label: e.target.value || undefined })} />
      </label>
      <div className="border-t pt-3">
        <p className="mb-2 text-xs font-semibold">{t("menuPlace.lookTitle")}</p>
        <MenuStyleEditor value={d.menuStyle} onChange={(menuStyle) => set({ menuStyle })}
          showDropdown={layout === "bar"} showPhone={layout === "accordion" || layout === "drawer" || barWithButton} />
      </div>
    </div>
  );
}

export function HeaderNavSettings({ block }: { block: HeaderNavBlockProps }) {
  if (block.data.layout) return <MenuBlockSettings block={block} />;
  return <LegacyHeaderNavSettings block={block} />;
}

function LegacyHeaderNavSettings({ block }: { block: HeaderNavBlockProps }) {
  const t = useT();
  const { updateBlock } = useBuilderStore();
  const menus = useSavedMenus(!!block.data.menuLocation);
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  // Opt in to the new Menu look: same links (or the saved menu it reads, now by id).
  const upgrade = () => {
    const byLocation = block.data.menuLocation ? menus?.find((m) => m.location === block.data.menuLocation) : undefined;
    updateBlock(block.id, { data: { ...block.data, layout: "bar", ...(byLocation ? { menuId: byLocation.id } : {}) } });
  };

  // Menus P5: a container header in the Header Builder can move to the Studio.
  const inHeaderBuilder = (usePathname() ?? "").startsWith("/dashboard/header-builder");
  return (
    <div className="space-y-3">
      {inHeaderBuilder && <SwitchToStudioButton area="header" variant="inline" />}
      <div className="rounded-md border border-primary/30 bg-primary/[0.04] p-2 text-[11px]">
        <p>{t("menuPlace.upgradeHint")}</p>
        <button type="button" onClick={upgrade} className="mt-1 font-medium text-primary hover:underline">{t("menuPlace.upgrade")}</button>
      </div>
      <div>
        <Label className="text-xs">Links position</Label>
        {/* The links render either spread from the start (every value but
            "centered", incl. older "split" / "minimal") or centred. */}
        <Select value={block.data.style === "centered" ? "centered" : "default"} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default" className="text-xs">From the start</SelectItem>
            <SelectItem value="centered" className="text-xs">Centred</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Link colour (blank = theme)</Label>
        <ColorPicker value={block.data.textColor ?? ""} onChange={(v) => update("textColor", v || undefined)} className="mt-1" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Upper-case menu</Label>
        <Switch checked={!!block.data.menuUppercase} onCheckedChange={(v) => update("menuUppercase", v || undefined)} />
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">Text size, weight and spacing are on the Style tab (Menu text).</p>
      <div className="border-t pt-3 space-y-2">
        <MenuLocationPicker value={block.data.menuLocation} onChange={(v) => update("menuLocation", v)} />
        <ManagedMenuNote location={block.data.menuLocation} />
        <NavItemsEditor items={block.data.items} onChange={(items) => update("items", items)} />
      </div>
    </div>
  );
}
