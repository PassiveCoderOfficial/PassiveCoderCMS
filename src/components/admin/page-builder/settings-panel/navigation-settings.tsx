"use client";

import React from "react";
import { SearchTypesField, SuggestLimitField } from "./search-settings";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { NavItemsEditor } from "./nav-items-editor";
import type { NavigationBlockProps } from "@/types/cms";
import { ItemsEditor, TextField } from "./showcase-fields";
import { TOP_BAR_ICONS } from "@/components/blocks/navigation/nav-top-bar";
import { TRANSLATE_LANGS } from "@/components/site/language-switch";
import { UiTextFields } from "./ui-text-fields";
import { ManagedMenuNote } from "./header-nav-settings";

export function NavigationSettings({ block }: { block: NavigationBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const PRESETS: Array<{ label: string; bg: string; gradientTo?: string; fg: string; accent: string }> = [
    { label: "Forest", bg: "#1a5c38", fg: "#ffffff", accent: "#c9a84c" },
    { label: "Blood Red", bg: "#b91c1c", gradientTo: "#dc2626", fg: "#ffffff", accent: "#fecaca" },
    { label: "Midnight", bg: "#0f172a", fg: "#e2e8f0", accent: "#60a5fa" },
    { label: "Clean White", bg: "#ffffff", fg: "#111827", accent: "#dc2626" },
    { label: "Ocean", bg: "#0369a1", gradientTo: "#0ea5e9", fg: "#ffffff", accent: "#facc15" },
  ];

  function applyPreset(p: typeof PRESETS[number]) {
    updateBlock(block.id, {
      data: {
        ...block.data,
        backgroundColor: p.bg,
        backgroundGradientTo: p.gradientTo ?? "",
        textColor: p.fg,
        activeColor: p.accent,
      },
    });
  }

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Logo Text</Label><Input value={block.data.logoText ?? ""} onChange={(e) => update("logoText", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <TextField label="Small text beside the logo (optional)" value={block.data.logoCaption} onChange={(v) => update("logoCaption", v || undefined)} placeholder="e.g. a registration number" hint="Hidden on small phones." />
      <div><Label className="text-xs">Logo Icon (before text)</Label><div className="mt-1"><MediaPickerInput compact value={block.data.logoIconUrl ?? ""} onChange={(v) => update("logoIconUrl", v)} /></div></div>
      <div><Label className="text-xs">Logo Image</Label><MediaPickerInput compact value={block.data.logo ?? ""} onChange={(url) => update("logo", url)} className="mt-1" /></div>
      <div><Label className="text-xs">Logo Height (px)</Label><Input type="number" min={24} max={80} value={block.data.logoHeight ?? 34} onChange={(e) => update("logoHeight", parseInt(e.target.value, 10) || 34)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.style} onValueChange={(v) => update("style", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["default","centered","logo-center","logo-center-inline","split","minimal"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s === "logo-center" ? "Logo centered (two rows)" : s === "logo-center-inline" ? "Logo centred, one row (menu left, socials right)" : s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {block.data.style === "logo-center-inline" && <p className="text-[10px] text-muted-foreground -mt-1">Social icons come from Business Profile &gt; Social Media.</p>}
      <div>
        <Label className="text-xs">Mobile header layout</Label>
        <Select value={block.data.mobileLayout ?? "default"} onValueChange={(v) => update("mobileLayout", v === "default" ? undefined : v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default" className="text-xs">Default</SelectItem>
            <SelectItem value="centered-logo" className="text-xs">Centered logo (menu left, 2 icons right)</SelectItem>
            <SelectItem value="menu-left" className="text-xs">Menu + logo left (call / WhatsApp right)</SelectItem>
            <SelectItem value="spaced" className="text-xs">Spaced (logo left, even icons, menu last)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground mt-0.5">Phones only; the desktop header does not change. Icons that don&apos;t fit move into the menu.</p>
      </div>

      {/* Bar colours: the bar follows the theme unless colorMode is "legacy"
          ("My own colours"); background / text only apply then. */}
      <div className="border-t pt-3 space-y-2">
        <div>
          <Label className="text-xs font-semibold">Bar colours</Label>
          <select value={block.data.colorMode === "legacy" ? "legacy" : "token"} onChange={(e) => update("colorMode", e.target.value === "legacy" ? "legacy" : undefined)} className="w-full h-8 text-xs rounded-md border bg-background px-2 mt-1">
            <option value="token">Theme colours</option>
            <option value="legacy">My own colours</option>
          </select>
        </div>
        {block.data.colorMode === "legacy" && (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] hover:border-primary transition-colors"
                  style={{ background: p.bg, color: p.fg }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Background</Label><ColorPicker value={block.data.backgroundColor ?? ""} onChange={(v) => update("backgroundColor", v || undefined)} className="mt-1" /></div>
              <div><Label className="text-xs">Text Color</Label><ColorPicker value={block.data.textColor ?? ""} onChange={(v) => update("textColor", v || undefined)} className="mt-1" /></div>
            </div>
          </>
        )}
        <div><Label className="text-xs">Highlight colour (logo mark, outline button)</Label><ColorPicker value={block.data.activeColor ?? ""} onChange={(v) => update("activeColor", v || undefined)} className="mt-1" /></div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between gap-2"><Label className="text-xs">Sticky (stays on screen when scrolling)</Label><Switch checked={!!block.data.sticky} onCheckedChange={(v) => update("sticky", v)} /></div>
        {block.data.sticky && (
          <div className="pl-3 border-l-2 space-y-2">
            {block.data.style === "logo-center" && (
              <div>
                <Label className="text-xs">Which rows stay visible</Label>
                <Select value={block.data.stickyRows ?? "all"} onValueChange={(v) => update("stickyRows", v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Whole header (logo row + menu row)</SelectItem>
                    <SelectItem value="menu" className="text-xs">Menu row only (logo row scrolls away)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {block.data.topBar && block.data.topBar.show !== false && (
              <div className="flex items-center justify-between gap-2"><Label className="text-xs">Keep top bar visible too</Label><Switch checked={!!block.data.stickyTopBar} onCheckedChange={(v) => update("stickyTopBar", v)} /></div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between"><Label className="text-xs">Transparent over the banner</Label><Switch checked={!!block.data.transparent} onCheckedChange={(v) => update("transparent", v)} /></div>
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Booking button</Label>
          <Switch checked={!!block.data.showBooking} onCheckedChange={(v) => update("showBooking", v)} />
        </div>
        <p className="text-[11px] text-muted-foreground">Opens your booking page so visitors can pick a time. Set hours in Dashboard &gt; Bookings.</p>
        {block.data.showBooking && (
          <>
            <div><Label className="text-xs">Button label</Label><Input value={block.data.bookingLabel ?? ""} placeholder="Book now" onChange={(e) => update("bookingLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Booking page</Label><Input value={block.data.bookingUrl ?? ""} placeholder="/book" onChange={(e) => update("bookingUrl", e.target.value)} className="h-8 text-xs mt-1" /></div>
          </>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between"><Label className="text-xs">Show CTA Button</Label><Switch checked={!!block.data.showCta} onCheckedChange={(v) => update("showCta", v)} /></div>
        {block.data.showCta && <div className="flex items-center justify-between gap-2"><Label className="text-xs">Hide the button on tablets</Label><Switch checked={!!block.data.hideCtaOnTablet} onCheckedChange={(v) => update("hideCtaOnTablet", v || undefined)} /></div>}
        {block.data.showCta && (
          <>
            <div><Label className="text-xs">CTA Label</Label><Input value={block.data.ctaLabel ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">CTA URL</Label><Input value={block.data.ctaUrl ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div>
              <Label className="text-xs">CTA Style</Label>
              {/* The bar reads ctaVariant (unset = gradient); the old ctaStyle key was never read. */}
              <Select value={block.data.ctaVariant ?? "gradient"} onValueChange={(v) => update("ctaVariant", v)}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
                  <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                  <SelectItem value="outline" className="text-xs">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Button colour</Label><ColorPicker value={block.data.ctaColor ?? ""} onChange={(v) => update("ctaColor", v)} className="mt-1" /></div>
              <div><Label className="text-xs">Button text colour</Label><ColorPicker value={block.data.ctaTextColor ?? ""} onChange={(v) => update("ctaTextColor", v)} className="mt-1" /></div>
            </div>
            {(block.data.ctaColor || block.data.ctaTextColor) && (
              <button type="button" className="text-[11px] text-muted-foreground underline" onClick={() => updateBlock(block.id, { data: { ...block.data, ctaColor: undefined, ctaTextColor: undefined } })}>Use brand colours</button>
            )}
          </>
        )}
      </div>

      <div className="border-t pt-3 space-y-2">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Second link (optional)</p>
        <p className="text-[10px] text-muted-foreground">A plain text link beside the button on wide screens, and in the phone menu. Fill in both to show it.</p>
        <TextField label="Link text" value={block.data.secondaryCtaLabel} onChange={(v) => update("secondaryCtaLabel", v || undefined)} placeholder="e.g. Log in" />
        <TextField label="Link goes to" value={block.data.secondaryCtaUrl} onChange={(v) => update("secondaryCtaUrl", v || undefined)} placeholder="/login" />
      </div>

      <div className="border-t pt-3 space-y-2">
        <ManagedMenuNote location={block.data.menuLocation} />
        <NavItemsEditor items={block.data.items} onChange={(items) => update("items", items)} />
      </div>

      {block.data.style === "logo-center" && <StoreHeaderSettings block={block} update={update} />}
      {block.data.style !== "logo-center" && block.data.showSearch && (
        <TextField label="Search box text (phone menu)" value={block.data.searchPlaceholder} onChange={(v) => update("searchPlaceholder", v)} placeholder="Search" />
      )}
      <UiTextFields block={block} title="Words in the phone menu and search" />
      <TopBarSettings block={block} update={update} />
    </div>
  );
}

/** Logo-centered shop header: search box, account / order-tracking icons, colour bands. */
function StoreHeaderSettings({ block, update }: { block: NavigationBlockProps; update: (f: string, v: unknown) => void }) {
  const d = block.data;
  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Shop header</p>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Search box (left of logo)</Label>
        <Switch checked={d.showSearch ?? false} onCheckedChange={(v) => update("showSearch", v)} />
      </div>
      {d.showSearch && (
        <>
          <select value={d.searchStyle ?? "pill"} onChange={(e) => update("searchStyle", e.target.value)} className="w-full h-7 text-xs rounded-md border bg-background px-2">
            <option value="pill">Rounded box with button</option>
            <option value="plain">Plain: icon + text</option>
          </select>
          <TextField label="Text inside the search box" value={d.searchPlaceholder} onChange={(v) => update("searchPlaceholder", v)} placeholder="Search" />
          {/* Same picker as the Search block: module-aware, ordered. Stored plural (searchScope). */}
          <SearchTypesField
            value={d.searchScope?.map((x) => x.replace(/s$/, "").replace(/ie$/, "y")) as ("product" | "category" | "post" | "page")[] | undefined}
            onChange={(v) => update("searchScope", v ? v.map((x) => (x === "category" ? "categories" : `${x}s`)) : undefined)}
          />
          <SuggestLimitField value={d.searchSuggestLimit} onChange={(v) => update("searchSuggestLimit", v)} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Category dropdown in the search box</Label>
            <Switch checked={d.searchCategoryFilter ?? false} onCheckedChange={(v) => update("searchCategoryFilter", v)} />
          </div>
          {(d.searchStyle ?? "pill") === "pill" && <TextField label="Search button text" value={d.searchButtonLabel} onChange={(v) => update("searchButtonLabel", v)} placeholder="Search" />}
        </>
      )}
      <div>
        <Label className="text-xs">Language button</Label>
        <select value={d.languageSwitch ?? ""} onChange={(e) => update("languageSwitch", e.target.value || undefined)} className="w-full h-7 text-xs rounded-md border bg-background px-2 mt-1">
          <option value="">None</option><option value="ar">English / Arabic</option><option value="bn">English / Bangla</option><option value="hi">English / Hindi</option><option value="ur">English / Urdu</option><option value="fr">English / French</option><option value="en">Back to English</option>
        </select>
        {d.languageSwitch && (
          <select value={d.languageSwitchMode ?? "google"} onChange={(e) => update("languageSwitchMode", e.target.value === "native" ? "native" : undefined)} className="w-full h-7 text-xs rounded-md border bg-background px-2 mt-1">
            <option value="google">Google Translate (automatic)</option><option value="native">My own translated pages</option>
          </select>
        )}
        {d.languageSwitch && (
          <select value={d.langSwitcherMobile ?? "in-menu"} onChange={(e) => update("langSwitcherMobile", e.target.value === "beside-menu" ? "beside-menu" : undefined)} className="w-full h-7 text-xs rounded-md border bg-background px-2 mt-1" aria-label="Language button on phones">
            <option value="in-menu">Phones: inside the menu</option><option value="beside-menu">Phones: beside the menu button</option>
          </select>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">{d.languageSwitchMode === "native" ? "Links to this page's translated version (Settings → Languages), else that language's home page." : "Turn on automatic translation in Settings → Languages too."}</p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Account icon</Label>
        <Switch checked={d.showAccount ?? false} onCheckedChange={(v) => update("showAccount", v)} />
      </div>
      <TextField label="Track-order icon link" value={d.trackOrderUrl} onChange={(v) => update("trackOrderUrl", v)} placeholder="/track-order (empty = hidden)" />
      <div className="flex items-center justify-between">
        <Label className="text-xs">Upper-case menu</Label>
        <Switch checked={d.menuUppercase ?? false} onCheckedChange={(v) => update("menuUppercase", v)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[10px] text-muted-foreground">Logo row colour</Label><ColorPicker value={d.topRowBackground ?? ""} onChange={(v) => update("topRowBackground", v || undefined)} /></div>
        <div><Label className="text-[10px] text-muted-foreground">Menu row colour</Label><ColorPicker value={d.menuRowBackground ?? ""} onChange={(v) => update("menuRowBackground", v || undefined)} /></div>
      </div>
    </div>
  );
}

function TopBarSettings({ block, update }: { block: NavigationBlockProps; update: (f: string, v: unknown) => void }) {
  const bar = block.data.topBar ?? { show: false, items: [] };
  const set = (patch: Partial<typeof bar>) => update("topBar", { ...bar, ...patch });
  const on = !!block.data.topBar && bar.show !== false;
  return (
    <div className="border-t pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Top bar</Label>
          <p className="text-[10px] text-muted-foreground">Thin strip above the menu: address, hours, offers, phone, WhatsApp</p>
        </div>
        <Switch checked={on} onCheckedChange={(v) => set({ show: v })} />
      </div>
      {on && (
        <>
          <select value={bar.align ?? "split"} onChange={(e) => set({ align: e.target.value as "split" | "center" })} className="w-full h-7 text-xs rounded-md border bg-background px-2">
            <option value="split">Info left, phone + WhatsApp right</option>
            <option value="center">One centred announcement</option>
          </select>
          {bar.align === "center" && (
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={bar.uppercase ?? false} onChange={(e) => set({ uppercase: e.target.checked })} /> Upper-case text
            </label>
          )}
          {bar.align === "center" && (
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={bar.rotate ?? false} onChange={(e) => set({ rotate: e.target.checked })} /> Rotate the messages one at a time (add several items)
            </label>
          )}
          {bar.align === "center" && (
            <label className="flex items-center gap-2 text-[11px]">
              <input type="checkbox" checked={bar.scroll ?? false} onChange={(e) => set({ scroll: e.target.checked, rotate: e.target.checked ? false : bar.rotate })} /> Scroll the messages across (moving ticker)
            </label>
          )}
          {bar.align === "center" && bar.scroll && (
            <div><Label className="text-[10px] text-muted-foreground">Ticker speed: {bar.scrollSeconds ?? 30}s per loop (lower = faster)</Label>
              <input type="range" min={8} max={90} value={bar.scrollSeconds ?? 30} onChange={(e) => set({ scrollSeconds: Number(e.target.value) })} className="w-full" /></div>
          )}
          <ItemsEditor title="Info items" items={bar.items} onChange={(items) => set({ items })}
            make={() => ({ text: "Your text", icon: "info", side: "left" as const })} itemLabel={(it) => it.text}
            render={(it, up) => (
              <div className="space-y-1">
                <Input value={it.text} onChange={(e) => up({ text: e.target.value })} className="h-7 text-xs" placeholder="Text" />
                <Input value={it.url ?? ""} onChange={(e) => up({ url: e.target.value })} className="h-7 text-xs" placeholder="Link (optional)" />
                <div className="flex gap-1">
                  <select value={it.icon ?? ""} onChange={(e) => up({ icon: e.target.value || undefined })} className="flex-1 h-7 text-xs rounded-md border bg-background px-1">
                    <option value="">No icon</option>
                    {TOP_BAR_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <select value={it.side ?? "left"} onChange={(e) => up({ side: e.target.value as "left" | "right" })} className="flex-1 h-7 text-xs rounded-md border bg-background px-1">
                    <option value="left">Left</option><option value="right">Right</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-[11px]">
                  <input type="checkbox" checked={it.hideOnMobile ?? false} onChange={(e) => up({ hideOnMobile: e.target.checked })} /> Hide on phones
                </label>
              </div>
            )} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show phone (from Contact details)</Label>
            <Switch checked={bar.showPhone !== false} onCheckedChange={(v) => set({ showPhone: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show WhatsApp button</Label>
            <Switch checked={bar.showWhatsapp !== false} onCheckedChange={(v) => set({ showWhatsapp: v })} />
          </div>
          {bar.showWhatsapp !== false && <TextField label="WhatsApp button text" value={bar.whatsappLabel} onChange={(v) => set({ whatsappLabel: v })} placeholder="WhatsApp" />}
          {bar.align !== "center" && <TopBarSocials bar={bar} set={set} />}
          {bar.align !== "center" && <TopBarLanguages bar={bar} set={set} />}
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px] text-muted-foreground">Background</Label><ColorPicker value={bar.background ?? ""} onChange={(v) => set({ background: v })} /></div>
            <div><Label className="text-[10px] text-muted-foreground">Text</Label><ColorPicker value={bar.textColor ?? ""} onChange={(v) => set({ textColor: v })} /></div>
          </div>
        </>
      )}
    </div>
  );
}

/** Top bar Google Translate menu: languages in the order added. */
function TopBarLanguages({ bar, set }: { bar: NonNullable<NavigationBlockProps["data"]["topBar"]>; set: (patch: Partial<NonNullable<NavigationBlockProps["data"]["topBar"]>>) => void }) {
  const on = bar.languages ?? [];
  const toggle = (code: string) => set({ languages: on.includes(code) ? on.filter((c) => c !== code) : [...on, code] });
  const move = (code: string, d: -1 | 1) => {
    const i = on.indexOf(code), j = i + d;
    if (i < 0 || j < 0 || j >= on.length) return;
    const next = [...on]; [next[i], next[j]] = [next[j], next[i]]; set({ languages: next });
  };
  return (
    <div className="space-y-1.5 border rounded-md p-2">
      <Label className="text-xs">Language menu (Google Translate)</Label>
      <p className="text-[10px] text-muted-foreground">Needs Settings → auto-translate on. Shown in this order.</p>
      {on.map((code, i) => (
        <div key={code} className="flex items-center gap-1 text-[11px]">
          <span className="flex-1">{i + 1}. {TRANSLATE_LANGS[code]?.label ?? code}</span>
          <button type="button" className="px-1" onClick={() => move(code, -1)} aria-label="Up">↑</button>
          <button type="button" className="px-1" onClick={() => move(code, 1)} aria-label="Down">↓</button>
          <button type="button" className="px-1 text-destructive" onClick={() => toggle(code)} aria-label="Remove">×</button>
        </div>
      ))}
      <label className="flex items-center gap-2 text-[11px]">
        <input type="checkbox" checked={bar.languagesIcon === "google"} onChange={(e) => set({ languagesIcon: e.target.checked ? "google" : "default" })} /> Official Google Translate icon
      </label>
      <select value="" onChange={(e) => e.target.value && toggle(e.target.value)} className="w-full h-7 text-xs rounded-md border bg-background px-2">
        <option value="">+ Add language</option>
        {Object.entries(TRANSLATE_LANGS).filter(([c]) => !on.includes(c)).map(([c, l]) => <option key={c} value={c}>{l.label}</option>)}
      </select>
    </div>
  );
}

/** Top bar social icons: the site's central list (Business Profile > Social Media). */
function TopBarSocials({ bar, set }: { bar: NonNullable<NavigationBlockProps["data"]["topBar"]>; set: (patch: Partial<NonNullable<NavigationBlockProps["data"]["topBar"]>>) => void }) {
  return (
    <div className="space-y-1.5 border rounded-md p-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">Hide this bar on phones</Label>
        <Switch checked={!!bar.hideOnMobile} onCheckedChange={(v) => set({ hideOnMobile: v || undefined })} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">Show social icons</Label>
          <p className="text-[10px] text-muted-foreground">Edit the links in Business Profile → Social Media</p>
        </div>
        <Switch checked={!!bar.showSocials} onCheckedChange={(v) => set({ showSocials: v })} />
      </div>
      {bar.showSocials && (
        <>
          <Input value={bar.socialsLabel ?? ""} onChange={(e) => set({ socialsLabel: e.target.value })} className="h-7 text-xs" placeholder="Label before icons, e.g. FOLLOW US:" />
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={bar.socialsBrandColors ?? false} onChange={(e) => set({ socialsBrandColors: e.target.checked })} /> Brand colours (white chips)
          </label>
          <label className="flex items-center gap-2 text-[11px]">
            <input type="checkbox" checked={bar.socialsStyle === "app"} onChange={(e) => set({ socialsStyle: e.target.checked ? "app" : "default" })} /> Official app icons (coloured squares)
          </label>
        </>
      )}
    </div>
  );
}
