"use client";

/**
 * Live preview of the menu being edited (menus P1): the real menu renderer,
 * with the unsaved edits, in any layout and starting look, on a desktop or
 * phone width. The layout and look chosen here are only for previewing:
 * where a menu is placed decides its look (header zone, footer column, page
 * Menu block). Links do not navigate away from the dashboard.
 */
import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { NavItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { MenuRenderer } from "@/components/blocks/navigation/menu-renderer";
import { MENU_LAYOUTS, MENU_PRESETS, type MenuLayout, type MenuPreset } from "@/modules/navigation/menu-style";
import { hasAutoChildren } from "@/modules/navigation/nav-blocks";

const LAYOUT_KEY: Record<MenuLayout, TranslationKey> = {
  bar: "navPage.layoutBar",
  vertical: "navPage.layoutVertical",
  inline: "navPage.layoutInline",
  accordion: "navPage.layoutAccordion",
  drawer: "navPage.layoutDrawer",
};
const PRESET_KEY: Record<MenuPreset, TranslationKey> = {
  plain: "navPage.presetPlain",
  underline: "navPage.presetUnderline",
  pill: "navPage.presetPill",
  boxed: "navPage.presetBoxed",
  brand: "navPage.presetBrand",
  caps: "navPage.presetCaps",
  bold: "navPage.presetBold",
  soft: "navPage.presetSoft",
};

export function MenuPreview({ items }: { items: NavItem[] }) {
  const t = useT();
  const [layout, setLayout] = useState<MenuLayout>("bar");
  const [preset, setPreset] = useState<MenuPreset>("plain");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const field = "rounded border bg-background px-2 py-1.5 text-xs";

  return (
    <section className="space-y-2 rounded-xl border bg-card p-4" aria-label={t("navPage.preview")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{t("navPage.preview")}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <select className={field} value={layout} aria-label={t("navPage.previewLayout")} onChange={(e) => setLayout(e.target.value as MenuLayout)}>
            {MENU_LAYOUTS.map((l) => <option key={l} value={l}>{t(LAYOUT_KEY[l])}</option>)}
          </select>
          <select className={field} value={preset} aria-label={t("navPage.previewLook")} onChange={(e) => setPreset(e.target.value as MenuPreset)}>
            {MENU_PRESETS.map((p) => <option key={p} value={p}>{t(PRESET_KEY[p])}</option>)}
          </select>
          <div className="flex rounded border" role="radiogroup" aria-label={t("navPage.device")}>
            {([["desktop", Monitor, t("navPage.deviceDesktop")], ["mobile", Smartphone, t("navPage.devicePhone")]] as const).map(([v, Icon, label]) => (
              <button key={v} type="button" role="radio" aria-checked={device === v} title={label} aria-label={label}
                onClick={() => setDevice(v)}
                className={cn("px-2 py-1.5", device === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{t("navPage.previewHint")}</p>
      {/* Clicks inside the preview never leave the dashboard. */}
      <div className="overflow-x-auto rounded-lg border bg-background"
        onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }}>
        <div className={cn("relative mx-auto min-h-[8rem] p-3 pb-40 transition-[max-width]", device === "mobile" ? "max-w-[375px]" : "max-w-none")}>
          {items.length === 0
            ? <p className="py-6 text-center text-xs text-muted-foreground">{t("navPage.noItemsYet")}</p>
            : <MenuRenderer key={`${layout}-${device}`} items={items} layout={layout} style={{ preset }} label={t("navPage.preview")}
                buttonLabel={layout === "drawer" ? t("navPage.layoutDrawer") : undefined} closeLabel={t("navPage.close")} />}
        </div>
      </div>
      {hasAutoChildren(items) && <p className="text-[10px] text-muted-foreground">{t("navPage.previewAutoHint")}</p>}
    </section>
  );
}
