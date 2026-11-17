"use client";

/**
 * Menu look editor (menus P2): one panel for every place a menu is shown
 * (Header Studio menu element, Footer Studio menu widget, page Menu block).
 * Edits a MenuStyle (modules/navigation/menu-style): a starting look plus
 * optional overrides. Everything it writes goes through normalizeMenuStyle,
 * so the stored style holds only what the owner really set.
 */
import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n/locales/en";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  ACTIVE_STYLES, DROPDOWN_LOOKS, HOVER_STYLES, ITEM_SIZES, MENU_LAYOUTS, MENU_PRESETS, SHADOWS,
  normalizeMenuStyle, resolveMenuStyle, type MenuLayout, type MenuPreset, type MenuStyle,
} from "@/modules/navigation/menu-style";

export const LAYOUT_KEY: Record<MenuLayout, TranslationKey> = {
  bar: "navPage.layoutBar",
  vertical: "navPage.layoutVertical",
  inline: "navPage.layoutInline",
  accordion: "navPage.layoutAccordion",
  drawer: "navPage.layoutDrawer",
};
export const PRESET_KEY: Record<MenuPreset, TranslationKey> = {
  plain: "navPage.presetPlain",
  underline: "navPage.presetUnderline",
  pill: "navPage.presetPill",
  boxed: "navPage.presetBoxed",
  brand: "navPage.presetBrand",
  caps: "navPage.presetCaps",
  bold: "navPage.presetBold",
  soft: "navPage.presetSoft",
};
export { MENU_LAYOUTS };

const k = (key: string) => key as TranslationKey;
const FIELD = "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({ label, value, placeholder, min, max, step = 1, onChange }: {
  label: string; value?: number; placeholder: number; min: number; max: number; step?: number; onChange: (v: number | undefined) => void;
}) {
  return (
    <Row label={label}>
      <input type="number" className={FIELD} min={min} max={max} step={step} value={value ?? ""} placeholder={String(placeholder)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />
    </Row>
  );
}

export function MenuStyleEditor({ value, onChange, showPhone = false, showDropdown = true }: {
  value: MenuStyle | undefined | null;
  /** Cleaned style, or undefined when nothing is set. */
  onChange: (style: MenuStyle | undefined) => void;
  /** Phone list options (folding list / drawer layouts, header phone drawer). */
  showPhone?: boolean;
  /** Dropdown options (menus that open sub-menus: bar layout). */
  showDropdown?: boolean;
}) {
  const t = useT();
  const [more, setMore] = useState(false);
  const s = value ?? {};
  const r = resolveMenuStyle(s);
  const set = (patch: Partial<MenuStyle>) => onChange(normalizeMenuStyle({ ...s, ...patch }) ?? undefined);
  const setDd = (patch: Partial<NonNullable<MenuStyle["dropdown"]>>) => set({ dropdown: { ...(s.dropdown ?? {}), ...patch } });
  const setPh = (patch: Partial<NonNullable<MenuStyle["phone"]>>) => set({ phone: { ...(s.phone ?? {}), ...patch } });
  const color = (label: string, key: "color" | "hoverColor" | "hoverBg" | "activeColor") => (
    <Row label={label}>
      <ColorPicker value={s[key] ?? ""} onChange={(v) => set({ [key]: v || undefined })} />
    </Row>
  );

  return (
    <div className="space-y-2">
      <Row label={t("menuPlace.look")}>
        <select className={FIELD} value={s.preset ?? "plain"} onChange={(e) => set({ preset: e.target.value as MenuPreset })}>
          {MENU_PRESETS.map((p) => <option key={p} value={p}>{t(PRESET_KEY[p])}</option>)}
        </select>
      </Row>
      <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more}
        className="flex w-full items-center justify-between rounded-md px-1 py-1 text-[11px] font-medium text-primary hover:bg-muted">
        {t("menuPlace.moreStyle")}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", more && "rotate-180")} aria-hidden />
      </button>
      {more && (
        <div className="space-y-2 rounded-md border p-2">
          <div className="grid grid-cols-2 gap-2">
            <NumberField label={t("menuPlace.fontSize")} value={s.fontSize} placeholder={r.fontSize} min={11} max={28} step={0.5} onChange={(v) => set({ fontSize: v })} />
            <Row label={t("menuPlace.fontWeight")}>
              <select className={FIELD} value={s.fontWeight ?? ""} onChange={(e) => set({ fontWeight: e.target.value ? (Number(e.target.value) as MenuStyle["fontWeight"]) : undefined })}>
                <option value="">{t("menuPlace.fromLook", { value: r.fontWeight })}</option>
                {[400, 500, 600, 700, 800].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Row>
            <NumberField label={t("menuPlace.letterSpacing")} value={s.letterSpacing} placeholder={r.letterSpacing} min={-0.05} max={0.3} step={0.01} onChange={(v) => set({ letterSpacing: v })} />
            <NumberField label={t("menuPlace.gap")} value={s.gap} placeholder={r.gap} min={0} max={64} onChange={(v) => set({ gap: v })} />
            <NumberField label={t("menuPlace.padX")} value={s.padX} placeholder={r.padX} min={0} max={40} onChange={(v) => set({ padX: v })} />
            <NumberField label={t("menuPlace.padY")} value={s.padY} placeholder={r.padY} min={0} max={24} onChange={(v) => set({ padY: v })} />
            <NumberField label={t("menuPlace.radius")} value={s.radius} placeholder={r.radius} min={0} max={999} onChange={(v) => set({ radius: v })} />
            <Row label={t("menuPlace.uppercase")}>
              <select className={FIELD} value={s.uppercase === undefined ? "" : s.uppercase ? "1" : "0"}
                onChange={(e) => set({ uppercase: e.target.value === "" ? undefined : e.target.value === "1" })}>
                <option value="">{t("menuPlace.fromLook", { value: r.uppercase ? t("menuPlace.yes") : t("menuPlace.no") })}</option>
                <option value="1">{t("menuPlace.yes")}</option>
                <option value="0">{t("menuPlace.no")}</option>
              </select>
            </Row>
            <Row label={t("menuPlace.hover")}>
              <select className={FIELD} value={s.hover ?? ""} onChange={(e) => set({ hover: (e.target.value || undefined) as MenuStyle["hover"] })}>
                <option value="">{t("menuPlace.fromLook", { value: t(k(`menuPlace.hover.${r.hover}`)) })}</option>
                {HOVER_STYLES.map((h) => <option key={h} value={h}>{t(k(`menuPlace.hover.${h}`))}</option>)}
              </select>
            </Row>
            <Row label={t("menuPlace.active")}>
              <select className={FIELD} value={s.active ?? ""} onChange={(e) => set({ active: (e.target.value || undefined) as MenuStyle["active"] })}>
                <option value="">{t("menuPlace.fromLook", { value: t(k(`menuPlace.active.${r.active}`)) })}</option>
                {ACTIVE_STYLES.map((a) => <option key={a} value={a}>{t(k(`menuPlace.active.${a}`))}</option>)}
              </select>
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {color(t("menuPlace.color"), "color")}
            {color(t("menuPlace.hoverColor"), "hoverColor")}
            {color(t("menuPlace.hoverBg"), "hoverBg")}
            {color(t("menuPlace.activeColor"), "activeColor")}
          </div>
          {showDropdown && (
            <fieldset className="space-y-2 border-t pt-2">
              <legend className="text-[11px] font-semibold">{t("menuPlace.dropdown")}</legend>
              <div className="grid grid-cols-2 gap-2">
                <Row label={t("menuPlace.dropdownLook")}>
                  <select className={FIELD} value={s.dropdown?.look ?? ""} onChange={(e) => setDd({ look: (e.target.value || undefined) as NonNullable<MenuStyle["dropdown"]>["look"] })}>
                    <option value="">{t("menuPlace.fromLook", { value: t(k(`menuPlace.dd.${r.dropdown.look}`)) })}</option>
                    {DROPDOWN_LOOKS.map((d) => <option key={d} value={d}>{t(k(`menuPlace.dd.${d}`))}</option>)}
                  </select>
                </Row>
                <Row label={t("menuPlace.shadow")}>
                  <select className={FIELD} value={s.dropdown?.shadow ?? ""} onChange={(e) => setDd({ shadow: (e.target.value || undefined) as NonNullable<MenuStyle["dropdown"]>["shadow"] })}>
                    <option value="">{t("menuPlace.fromLook", { value: t(k(`menuPlace.shadow.${r.dropdown.shadow}`)) })}</option>
                    {SHADOWS.map((d) => <option key={d} value={d}>{t(k(`menuPlace.shadow.${d}`))}</option>)}
                  </select>
                </Row>
                <NumberField label={t("menuPlace.radius")} value={s.dropdown?.radius} placeholder={r.dropdown.radius} min={0} max={32} onChange={(v) => setDd({ radius: v })} />
                <NumberField label={t("menuPlace.dropdownWidth")} value={s.dropdown?.width} placeholder={r.dropdown.width} min={160} max={480} step={10} onChange={(v) => setDd({ width: v })} />
              </div>
            </fieldset>
          )}
          {showPhone && (
            <fieldset className="space-y-2 border-t pt-2">
              <legend className="text-[11px] font-semibold">{t("menuPlace.phone")}</legend>
              <div className="grid grid-cols-2 gap-2">
                <Row label={t("menuPlace.itemSize")}>
                  <select className={FIELD} value={s.phone?.size ?? ""} onChange={(e) => setPh({ size: (e.target.value || undefined) as NonNullable<MenuStyle["phone"]>["size"] })}>
                    <option value="">{t("menuPlace.fromLook", { value: t(k(`menuPlace.size.${r.phone.size}`)) })}</option>
                    {ITEM_SIZES.map((d) => <option key={d} value={d}>{t(k(`menuPlace.size.${d}`))}</option>)}
                  </select>
                </Row>
                <label className="flex items-end gap-2 pb-1.5 text-xs">
                  <input type="checkbox" checked={!!s.phone?.dividers} onChange={(e) => setPh({ dividers: e.target.checked || undefined })} />
                  {t("menuPlace.dividers")}
                </label>
              </div>
            </fieldset>
          )}
          <button type="button" onClick={() => onChange(s.preset ? { preset: s.preset } : undefined)}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
            <RotateCcw className="h-3 w-3" aria-hidden />{t("menuPlace.resetOverrides")}
          </button>
        </div>
      )}
    </div>
  );
}
