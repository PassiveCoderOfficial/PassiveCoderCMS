"use client";

import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { FONT_OPTIONS } from "@/modules/themes/fonts";
import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { ElementsEditor } from "./elements-editor";
import type { Block, BlockBackground, BlockStyle } from "@/types/cms";

interface LayoutSettingsProps {
  block: Block;
}

export function BlockLayoutSettings({ block }: LayoutSettingsProps) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { [field]: value });
  };

  const updatePadding = (side: "top" | "right" | "bottom" | "left", value: number) => {
    updateBlock(block.id, { padding: { ...block.padding, [side]: value } });
  };

  const updateMargin = (side: "top" | "bottom", value: number) => {
    updateBlock(block.id, { margin: { ...block.margin, [side]: value } });
  };

  const st: BlockStyle = block.style ?? {};
  const updateStyle = (patch: Partial<BlockStyle>) => {
    const next: BlockStyle = { ...st, ...patch };
    for (const k of Object.keys(next) as (keyof BlockStyle)[]) if (next[k] === undefined) delete next[k];
    updateBlock(block.id, { style: Object.keys(next).length ? next : undefined });
  };

  const updateBg = (field: keyof BlockBackground, value: unknown) => {
    updateBlock(block.id, { background: { ...block.background, [field]: value } });
  };

  // Gradient was a raw "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  // text field — nobody hand-writes CSS gradient syntax. Parse the existing
  // string into angle + two colors for two color pickers, and always write
  // back a normalized string so both directions round-trip cleanly.
  const gradientMatch = /linear-gradient\((\d+)deg,\s*(#[0-9a-fA-F]{3,8})[^,]*,\s*(#[0-9a-fA-F]{3,8})/.exec(
    block.background.gradient ?? "",
  );
  const gradientAngle = gradientMatch ? Number(gradientMatch[1]) : 135;
  const gradientFrom = gradientMatch?.[2] ?? "#667eea";
  const gradientTo = gradientMatch?.[3] ?? "#764ba2";
  const setGradient = (angle: number, from: string, to: string) => {
    updateBg("gradient", `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`);
  };

  return (
    <div className="space-y-5">
      {/* Width */}
      <div className="space-y-1.5">
        <Label className="text-xs">Container Width</Label>
        <Select value={block.width} onValueChange={(v) => update("width", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["full", "wide", "normal", "narrow"].map((w) => (
              <SelectItem key={w} value={w} className="text-xs capitalize">{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Padding */}
      <div className="space-y-1.5">
        <Label className="text-xs">Padding (px)</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <div key={side}>
              <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
              <Input
                type="number"
                value={block.padding[side]}
                onChange={(e) => updatePadding(side, Number(e.target.value))}
                className="h-7 text-xs"
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="space-y-1.5">
        <Label className="text-xs">Margin (px)</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["top", "bottom"] as const).map((side) => (
            <div key={side}>
              <Label className="text-[10px] text-muted-foreground capitalize">{side}</Label>
              <Input
                type="number"
                value={block.margin[side]}
                onChange={(e) => updateMargin(side, Number(e.target.value))}
                className="h-7 text-xs"
                min={0}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <Label className="text-xs">Background</Label>
        <Select
          value={block.background.type}
          onValueChange={(v) => {
            const needsDefaultGradient = v === "gradient" && !block.background.gradient;
            updateBlock(block.id, {
              background: {
                ...block.background,
                type: v as BlockBackground["type"],
                ...(needsDefaultGradient
                  ? { gradient: `linear-gradient(${gradientAngle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)` }
                  : {}),
              },
            });
          }}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "color", "gradient", "image"].map((t) => (
              <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {block.background.type === "color" && (
          <ColorPicker value={block.background.color ?? "#ffffff"} onChange={(v) => updateBg("color", v)} />
        )}
        {block.background.type === "gradient" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">From</Label>
                <ColorPicker value={gradientFrom} onChange={(v) => setGradient(gradientAngle, v, gradientTo)} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">To</Label>
                <ColorPicker value={gradientTo} onChange={(v) => setGradient(gradientAngle, gradientFrom, v)} className="mt-0.5" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground">Angle ({gradientAngle}°)</Label>
              <Input
                type="range"
                min={0}
                max={360}
                step={5}
                value={gradientAngle}
                onChange={(e) => setGradient(Number(e.target.value), gradientFrom, gradientTo)}
                className="h-8"
              />
            </div>
          </div>
        )}
        {block.background.type === "image" && (
          <div className="space-y-2">
            <MediaPickerInput
              compact
              value={block.background.imageUrl ?? ""}
              onChange={(url) => updateBg("imageUrl", url)}
            />
            {/* The renderer has always supported a colour wash over the image;
                it just had no control, so text over busy photos was unreadable. */}
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <Label className="text-[10px] text-muted-foreground">Overlay colour</Label>
                <ColorPicker value={block.background.imageOverlay ?? "#000000"} onChange={(v) => updateBg("imageOverlay", v)} allowAlpha={false} className="mt-0.5" />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">
                  Overlay ({Math.round((block.background.imageOverlay ? block.background.imageOverlayOpacity ?? 0.5 : 0) * 100)}%)
                </Label>
                <Input
                  type="range" min={0} max={90} step={5}
                  value={Math.round((block.background.imageOverlay ? block.background.imageOverlayOpacity ?? 0.5 : 0) * 100)}
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    updateBlock(block.id, {
                      background: pct === 0
                        ? { ...block.background, imageOverlay: undefined, imageOverlayTo: undefined }
                        : { ...block.background, imageOverlay: block.background.imageOverlay ?? "#000000", imageOverlayOpacity: pct / 100 },
                    });
                  }}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Elements — order/visibility of the block's own pieces (hero etc.) */}
      <ElementsEditor block={block} />

      {/* Style — shared by every block type, rendered by getBlockWrapperStyle */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-semibold">Style</Label>
        <div className="flex items-center justify-between gap-2">
          <Label className="text-[11px] text-muted-foreground">Text colour</Label>
          <div className="flex items-center gap-1.5">
            {st.textColor && (
              <button type="button" className="text-[10px] text-muted-foreground underline" onClick={() => updateStyle({ textColor: undefined })}>reset</button>
            )}
            <ColorPicker value={st.textColor ?? "#111827"} onChange={(v) => updateStyle({ textColor: v })} allowAlpha={false} className="w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Corner radius (px)</Label>
            <Input type="number" min={0} max={80} value={st.radius ?? 0} onChange={(e) => updateStyle({ radius: Number(e.target.value) || undefined })} className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Shadow</Label>
            <Select value={st.shadow ?? "none"} onValueChange={(v) => updateStyle({ shadow: v === "none" ? undefined : v as BlockStyle["shadow"] })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[["none", "None"], ["sm", "Small"], ["md", "Medium"], ["lg", "Large"], ["xl", "Extra large"]].map(([v, l]) => (
                  <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Border (px)</Label>
            <Input type="number" min={0} max={20} value={st.borderWidth ?? 0} onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) || undefined })} className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Border colour</Label>
            <ColorPicker value={st.borderColor ?? "#e5e7eb"} onChange={(v) => updateStyle({ borderColor: v })} className="mt-0.5" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Min height (% of screen)</Label>
            <Input type="number" min={0} max={100} value={st.minHeight ?? 0} onChange={(e) => updateStyle({ minHeight: Math.min(100, Number(e.target.value)) || undefined })} className="h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground">Content position</Label>
            <Select value={st.verticalAlign ?? "center"} onValueChange={(v) => updateStyle({ verticalAlign: v as BlockStyle["verticalAlign"] })} disabled={!st.minHeight}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["top", "center", "bottom"].map((v) => (
                  <SelectItem key={v} value={v} className="text-xs capitalize">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {block.type === "navigation" && <NavTypography block={block} />}

      {/* Typography & alignment — shared by content blocks (globals.css .pc-* rules).
          Not shown for the header/footer: they have no section heading or cards. */}
      {block.type !== "navigation" && block.type !== "footer" && (
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Typography &amp; alignment</Label>
          {(st.align || st.cardAlign || st.headingFont || st.headingSize || st.cardTitleSize || st.textSize || st.cardTitleCase) && (
            <button type="button" className="text-[10px] text-muted-foreground underline"
              onClick={() => updateStyle({ align: undefined, cardAlign: undefined, headingFont: undefined, headingSize: undefined, cardTitleSize: undefined, textSize: undefined, cardTitleCase: undefined })}>reset</button>
          )}
        </div>
        {([["align", "Section heading"], ["cardAlign", "Inside cards"]] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <Label className="text-[11px] text-muted-foreground">{label}</Label>
            <div className="flex rounded-md border overflow-hidden">
              {(["left", "center", "right"] as const).map((a) => {
                const Icon = a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
                const on = st[key] === a;
                return (
                  <button key={a} type="button" title={a} onClick={() => updateStyle({ [key]: on ? undefined : a })}
                    className={`h-7 w-8 flex items-center justify-center ${on ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <Label className="text-[10px] text-muted-foreground">Heading font</Label>
          <Select value={st.headingFont ?? "__site"} onValueChange={(v) => updateStyle({ headingFont: v === "__site" ? undefined : v })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__site" className="text-xs">Site default</SelectItem>
              {FONT_OPTIONS.map((f) => <SelectItem key={f.name} value={f.name} className="text-xs">{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([["headingSize", "Heading px", 14, 96], ["cardTitleSize", "Card title px", 10, 48], ["textSize", "Text px", 10, 28]] as const).map(([key, label, min, max]) => (
            <div key={key}>
              <Label className="text-[10px] text-muted-foreground">{label}</Label>
              <Input type="number" min={min} max={max} placeholder="auto" value={st[key] ?? ""}
                onChange={(e) => { const n = Number(e.target.value); updateStyle({ [key]: n ? Math.min(max, Math.max(min, n)) : undefined }); }}
                className="h-7 text-xs" />
            </div>
          ))}
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Card title case</Label>
          <Select value={st.cardTitleCase ?? "__auto"} onValueChange={(v) => updateStyle({ cardTitleCase: v === "__auto" ? undefined : v as BlockStyle["cardTitleCase"] })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto" className="text-xs">As designed</SelectItem>
              <SelectItem value="none" className="text-xs">Normal</SelectItem>
              <SelectItem value="uppercase" className="text-xs">UPPERCASE</SelectItem>
              <SelectItem value="capitalize" className="text-xs">Capitalize Each Word</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      )}

      {/* Per-device — padding overrides + hide switches */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-semibold">Tablet &amp; mobile</Label>
        {(["paddingTablet", "paddingMobile"] as const).map((key) => (
          <div key={key}>
            <Label className="text-[10px] text-muted-foreground">
              {key === "paddingTablet" ? "Tablet" : "Mobile"} padding (px) — blank = same as {key === "paddingTablet" ? "desktop" : "tablet"}
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-0.5">
              {(["top", "bottom"] as const).map((side) => (
                <Input
                  key={side}
                  type="number" min={0} placeholder={side}
                  value={st[key]?.[side] ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next = { ...(st[key] ?? {}), [side]: raw === "" ? undefined : Number(raw) };
                    updateStyle({ [key]: next.top === undefined && next.bottom === undefined ? undefined : next });
                  }}
                  className="h-7 text-xs"
                />
              ))}
            </div>
          </div>
        ))}
        <div>
          <Label className="text-[10px] text-muted-foreground">Hide on</Label>
          <div className="flex gap-3 mt-1">
            {(["desktop", "tablet", "mobile"] as const).map((d) => (
              <label key={d} className="flex items-center gap-1.5 text-xs capitalize cursor-pointer">
                <input
                  type="checkbox"
                  checked={block.hideOn?.includes(d) ?? false}
                  onChange={() => {
                    const cur = block.hideOn ?? [];
                    const hideOn = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
                    // Same rule as the layers panel: hidden on all three = not visible.
                    updateBlock(block.id, { hideOn, visible: hideOn.length < 3 });
                  }}
                />
                {d}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section anchor */}
      <div className="space-y-1.5">
        <Label className="text-xs">Section anchor</Label>
        <Input
          className="h-8 text-xs"
          placeholder="e.g. plumbing-works"
          value={block.anchor ?? ""}
          onChange={(e) => update("anchor", e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+/, ""))}
        />
        <p className="text-[11px] text-muted-foreground">Link to this section with /page-url#{block.anchor || "anchor"}.</p>
      </div>

      {/* Animation */}
      <div className="space-y-1.5">
        <Label className="text-xs">Animation</Label>
        <Select value={block.animation ?? "none"} onValueChange={(v) => update("animation", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["none", "fade", "slide-up", "slide-left", "zoom"].map((a) => (
              <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Header menu text: size, weight, spacing, button text. Writes block.data. */
function NavTypography({ block }: { block: Block }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data as { menuFontSize?: number; menuFontWeight?: number; menuGap?: number; ctaFontSize?: number };
  const set = (patch: Partial<typeof d>) => updateBlock(block.id, { data: { ...block.data, ...patch } } as Partial<Block>);
  const num = (key: "menuFontSize" | "menuGap" | "ctaFontSize", min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    set({ [key]: raw === "" ? undefined : Math.min(max, Math.max(min, Number(raw))) });
  };
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Menu text</Label>
        {(d.menuFontSize || d.menuFontWeight || d.menuGap !== undefined || d.ctaFontSize) && (
          <button type="button" className="text-[10px] text-muted-foreground underline"
            onClick={() => set({ menuFontSize: undefined, menuFontWeight: undefined, menuGap: undefined, ctaFontSize: undefined })}>reset</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground">Menu size (px)</Label>
          <Input type="number" min={11} max={24} placeholder="14" value={d.menuFontSize ?? ""} onChange={num("menuFontSize", 11, 24)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Menu weight</Label>
          <Select value={String(d.menuFontWeight ?? "__auto")} onValueChange={(v) => set({ menuFontWeight: v === "__auto" ? undefined : Number(v) })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__auto" className="text-xs">Default</SelectItem>
              <SelectItem value="400" className="text-xs">Regular</SelectItem>
              <SelectItem value="500" className="text-xs">Medium</SelectItem>
              <SelectItem value="600" className="text-xs">Semibold</SelectItem>
              <SelectItem value="700" className="text-xs">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Space between items (px)</Label>
          <Input type="number" min={0} max={48} placeholder="auto" value={d.menuGap ?? ""} onChange={num("menuGap", 0, 48)} className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground">Button text (px)</Label>
          <Input type="number" min={11} max={22} placeholder="14" value={d.ctaFontSize ?? ""} onChange={num("ctaFontSize", 11, 22)} className="h-7 text-xs" />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">Applies to the desktop menu. Upper-case and colours are in the Content tab.</p>
    </div>
  );
}
