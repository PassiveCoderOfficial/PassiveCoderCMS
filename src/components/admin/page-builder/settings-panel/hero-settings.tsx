"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import type { HeroBlockProps } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { AlignLeft, AlignCenter, AlignRight, Columns2 } from "lucide-react";
import { CountryMultiPicker } from "@/components/admin/country-multi-picker";
import { MultiImagePicker } from "@/components/admin/multi-image-picker";
import { cn } from "@/lib/utils";
import { TextField, ItemsEditor, MetersEditor, ShowcaseColorsEditor } from "./showcase-fields";

export function HeroSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  // "fullscreen-overlay" renders its photo as the whole section's background
  // (painted by the shared BlockRenderer wrapper via block.background so it
  // covers padding too — see block-utils.ts getBlockBackground()), not as an
  // inline content image. Keep block.background in sync here so picking a
  // photo from this Content tab actually shows up section-wide.
  const isFullscreen = block.templateVariant === "fullscreen-overlay";
  const updateButtonField = (btn: "primaryButton" | "secondaryButton", field: "label" | "url", value: string) => {
    const existing = block.data[btn] ?? { label: "", url: "", variant: btn === "primaryButton" ? "primary" : "outline" };
    updateBlock(block.id, { data: { ...block.data, [btn]: { ...existing, [field]: value } } });
  };

  const updateImage = (url: string) => {
    if (isFullscreen) {
      updateBlock(block.id, {
        data: { ...block.data, imageUrl: url },
        background: { ...block.background, type: "image", imageUrl: url },
      });
    } else {
      update("imageUrl", url);
    }
  };

  // "centered-bold" and "corporate" are single-column, always-centered
  // designs by intent (no image split, no side-pinned text) — Layout has
  // nothing to control there, so hide it instead of showing a dropdown that
  // silently does nothing when changed.
  const showcase = block.templateVariant === "spec-card" || block.templateVariant === "page-banner";
  const specCard = block.templateVariant === "spec-card";
  const card = block.data.specCard ?? {};
  const setCard = (patch: Partial<NonNullable<HeroBlockProps["data"]["specCard"]>>) => update("specCard", { ...card, ...patch });

  return (
    <div className="space-y-4">

      <FieldGroup label={block.templateVariant === "page-banner" ? "Small label above title" : "Badge text"}>
        <Input value={block.data.badge ?? ""} onChange={(e) => update("badge", e.target.value)} className="h-8 text-xs" placeholder="Optional badge" />
      </FieldGroup>

      <FieldGroup label="Title">
        <Input value={block.data.title} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" />
      </FieldGroup>

      {showcase ? (
        <TextField label="Second title line (accent colour)" value={block.data.titleAccent} onChange={(v) => update("titleAccent", v)} placeholder="Optional" />
      ) : (
        <FieldGroup label="Subtitle">
          <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" />
        </FieldGroup>
      )}

      <FieldGroup label="Description">
        <Textarea value={block.data.description ?? ""} onChange={(e) => update("description", e.target.value)} className="text-xs resize-none" rows={3} />
      </FieldGroup>

      <HeroTrustFields data={block.data} update={update} />

      <FieldGroup label="Image">
        <MediaPickerInput compact value={block.data.imageUrl ?? ""} onChange={updateImage} />
        {block.data.imageUrl && (
          <select value={block.data.imagePosition ?? "center"} onChange={(e) => update("imagePosition", e.target.value)} className="w-full h-8 text-xs mt-2 rounded-md border bg-background px-2">
            <option value="top">Focus: top (portraits)</option>
            <option value="center">Focus: center</option>
            <option value="bottom">Focus: bottom</option>
          </select>
        )}
      </FieldGroup>

      <div className="pt-2 border-t space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Primary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateButtonField("primaryButton", "label", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Get a Free Quote" />
          <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateButtonField("primaryButton", "url", e.target.value)} className="h-8 text-xs" placeholder="Link URL, e.g. /contact" />
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Secondary Button</p>
        <div className="space-y-1.5">
          <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateButtonField("secondaryButton", "label", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. WhatsApp Us" />
          <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateButtonField("secondaryButton", "url", e.target.value)} className="h-8 text-xs" placeholder="Link URL" />
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug">
          Button colors are in the Style tab.
        </p>
      </div>

      {block.templateVariant === "page-banner" && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <Label className="text-xs">Show breadcrumb</Label>
            <p className="text-[10px] text-muted-foreground">Built automatically from the page address</p>
          </div>
          <Switch checked={block.data.showBreadcrumb !== false} onCheckedChange={(v) => update("showBreadcrumb", v)} />
        </div>
      )}

      {specCard && (
        <div className="pt-2 border-t space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Side card</p>
          <TextField label="Card label" value={card.label} onChange={(v) => setCard({ label: v })} placeholder="Featured package" />
          <TextField label="Card title" value={card.title} onChange={(v) => setCard({ title: v })} />
          <MetersEditor value={card.meters} onChange={(v) => setCard({ meters: v })} />
          <ItemsEditor title="Card stats (up to 3)" max={3} items={card.stats} onChange={(v) => setCard({ stats: v })}
            make={() => ({ value: "10 yr", label: "warranty" })} itemLabel={(it) => `${it.value} ${it.label}`}
            render={(it, set) => (
              <div className="flex gap-1">
                <Input value={it.value} onChange={(e) => set({ value: e.target.value })} className="h-7 text-xs w-20" placeholder="Value" />
                <Input value={it.label} onChange={(e) => set({ label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Label" />
              </div>
            )} />
        </div>
      )}

      {specCard && (
        <div className="pt-2 border-t">
          <ItemsEditor title="Link strip (bottom)" items={block.data.strip} onChange={(v) => update("strip", v)}
            make={() => ({ title: "Service", subtitle: "", url: "/services" })} itemLabel={(it) => it.title}
            render={(it, set) => (
              <div className="space-y-1">
                <Input value={it.title} onChange={(e) => set({ title: e.target.value })} className="h-7 text-xs" placeholder="Title" />
                <Input value={it.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value })} className="h-7 text-xs" placeholder="Small text" />
                <Input value={it.url ?? ""} onChange={(e) => set({ url: e.target.value })} className="h-7 text-xs" placeholder="Link, e.g. /services/car-tint" />
              </div>
            )} />
        </div>
      )}

      {showcase && (
        <div className="pt-2 border-t">
          <ShowcaseColorsEditor value={block.data.colors} onChange={(v) => update("colors", v)} />
          <p className="text-[10px] text-muted-foreground mt-1">Photo darkness: Style tab, Overlay Opacity.</p>
        </div>
      )}

    </div>
  );
}

export function HeroStyleSettings({ block }: { block: HeroBlockProps }) {
  const { updateBlock } = useBuilderStore();

  const update = (field: string, value: unknown) => {
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  };

  const updateTypo = (field: string, value: string) => {
    updateBlock(block.id, { data: { ...block.data, typography: { ...block.data.typography, [field]: value } } });
  };

  const updateButton = (btn: "primaryButton" | "secondaryButton", field: string, value: string) => {
    const existing = block.data[btn] ?? { label: "", url: "", variant: "primary" };
    updateBlock(block.id, { data: { ...block.data, [btn]: { ...existing, [field]: value } } });
  };

  const layoutApplies = !["centered-bold", "corporate", "spec-card", "page-banner"].includes(block.templateVariant ?? "");
  const ALIGN = [
    { v: "left", icon: AlignLeft, label: "Left" },
    { v: "centered", icon: AlignCenter, label: "Center" },
    { v: "right", icon: AlignRight, label: "Right" },
    { v: "split", icon: Columns2, label: "Split" },
  ] as const;

  return (
    <div className="space-y-4">
      {layoutApplies && (
        <div className="space-y-1.5">
          <Label className="text-xs">Align</Label>
          <div className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1">
            {ALIGN.map(({ v, icon: Icon, label }) => (
              <button key={v} type="button" title={label} aria-label={label} onClick={() => update("layout", v)}
                className={cn("flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] transition-colors",
                  (block.data.layout ?? "left") === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Badge Style</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Background" value={block.data.badgeBgColor ?? "#ffffff"} onChange={(v) => update("badgeBgColor", v)} />
          <ColorField label="Text Color" value={block.data.badgeTextColor ?? "#000000"} onChange={(v) => update("badgeTextColor", v)} />
        </div>
        {(block.data.badgeBgColor || block.data.badgeTextColor) && (
          <button onClick={() => { update("badgeBgColor", ""); update("badgeTextColor", ""); }} className="text-[11px] text-muted-foreground underline">Use theme default instead</button>
        )}
      </div>

      <div className="pt-1 border-t space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Section Overlay</p>
        <p className="text-[10px] text-muted-foreground">Tints the whole section — covers the background image set in the Layout tab. Set a color to apply it.</p>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Overlay Color" value={block.data.overlayColor ?? "#000000"} onChange={(v) => update("overlayColor", v)} />
          <ColorField label="Gradient To (optional)" value={block.data.overlayColorTo || block.data.overlayColor || "#000000"} onChange={(v) => update("overlayColorTo", v)} />
        </div>
        {block.data.overlayColorTo && (
          <button onClick={() => update("overlayColorTo", "")} className="text-[11px] text-muted-foreground underline">Clear gradient</button>
        )}
        <FieldGroup label={`Overlay Opacity (${Math.round((block.data.overlayOpacity ?? 0.55) * 100)}%)`}>
          <Input type="range" min={0} max={1} step={0.05} value={block.data.overlayOpacity ?? 0.55}
            onChange={(e) => update("overlayOpacity", parseFloat(e.target.value))} className="h-8" />
        </FieldGroup>
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Primary Button Color</p>
        <div className="grid grid-cols-2 gap-1.5">
          <ColorField label="Background" value={block.data.primaryButton?.bgColor || "#ffffff"} onChange={(v) => updateButton("primaryButton", "bgColor", v)} />
          <ColorField label="Text" value={block.data.primaryButton?.textColor || "#000000"} onChange={(v) => updateButton("primaryButton", "textColor", v)} />
        </div>
        {block.data.primaryButton?.bgColor && (
          <button onClick={() => { updateButton("primaryButton", "bgColor", ""); updateButton("primaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use theme default instead</button>
        )}
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Secondary Button Color</p>
        <div className="grid grid-cols-2 gap-1.5">
          <ColorField label="Background" value={block.data.secondaryButton?.bgColor || "#00000000"} onChange={(v) => updateButton("secondaryButton", "bgColor", v)} />
          <ColorField label="Text" value={block.data.secondaryButton?.textColor || "#ffffff"} onChange={(v) => updateButton("secondaryButton", "textColor", v)} />
        </div>
        {block.data.secondaryButton?.bgColor && (
          <button onClick={() => { updateButton("secondaryButton", "bgColor", ""); updateButton("secondaryButton", "textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use theme default instead</button>
        )}
      </div>

      <div className="pt-1 border-t">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Typography</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[10px] text-muted-foreground">Title Size</Label>
            <Select value={block.data.typography.titleSize} onValueChange={(v) => updateTypo("titleSize", v)}>
              <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["3xl","4xl","5xl","6xl","7xl"].map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ColorField label="Title Color" value={block.data.typography.titleColor} onChange={(v) => updateTypo("titleColor", v)} />
          <ColorField label="Subtitle Color" value={block.data.typography.subtitleColor} onChange={(v) => updateTypo("subtitleColor", v)} />
          <ColorField label="Description Color" value={block.data.typography.descColor} onChange={(v) => updateTypo("descColor", v)} />
        </div>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <ColorPicker value={value} onChange={onChange} className="h-7 mt-0.5" />
    </div>
  );
}

const RATING_STYLES = [
  { v: "stars", label: "Stars + score" },
  { v: "pill", label: "Pill" },
  { v: "google", label: "Google badge" },
  { v: "big", label: "Big score" },
] as const;

/** Trust signals under the hero buttons: countries, logos, rating. */
function HeroTrustFields({ data, update }: { data: HeroBlockProps["data"]; update: (field: string, value: unknown) => void }) {
  const rating = data.rating ?? { value: 4.9, count: "", label: "", style: "stars" as const };
  const setRating = (patch: Partial<typeof rating>) => update("rating", { ...rating, ...patch });
  const toggle = (label: string, field: "showCountries" | "showTrustLogos" | "showRating") => (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={!!data[field]} onCheckedChange={(v) => update(field, v)} />
    </div>
  );
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Trust signals</p>

      {toggle("Show countries served", "showCountries")}
      {data.showCountries && (
        <div className="space-y-2 pl-1">
          <CountryMultiPicker value={data.countries ?? []} onChange={(v) => update("countries", v)} />
          <Input value={data.countriesLabel ?? ""} onChange={(e) => update("countriesLabel", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Serving businesses in" />
        </div>
      )}

      {toggle("Show logos (partners, certifications)", "showTrustLogos")}
      {data.showTrustLogos && (
        <div className="space-y-2 pl-1">
          <MultiImagePicker value={data.trustLogos ?? []} onChange={(v) => update("trustLogos", v)} />
          <Input value={data.trustLogosLabel ?? ""} onChange={(e) => update("trustLogosLabel", e.target.value)} className="h-8 text-xs" placeholder="Label, e.g. Certified by" />
        </div>
      )}

      {toggle("Show star rating", "showRating")}
      {data.showRating && (
        <div className="space-y-2 pl-1">
          <div className="grid grid-cols-2 gap-1">
            {RATING_STYLES.map((r) => (
              <button key={r.v} type="button" onClick={() => setRating({ style: r.v })}
                className={cn("rounded-md border px-2 py-1.5 text-[11px]", (rating.style ?? "stars") === r.v ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted")}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={1} max={5} step={0.1} value={rating.value} onChange={(e) => setRating({ value: Math.min(5, Math.max(1, Number(e.target.value) || 5)) })} className="h-8 text-xs" placeholder="4.9" />
            <Input value={rating.count ?? ""} onChange={(e) => setRating({ count: e.target.value })} className="h-8 text-xs" placeholder="Reviews, e.g. 120+" />
          </div>
          <Input value={rating.label ?? ""} onChange={(e) => setRating({ label: e.target.value })} className="h-8 text-xs" placeholder="Custom text (optional)" />
        </div>
      )}
    </div>
  );
}
