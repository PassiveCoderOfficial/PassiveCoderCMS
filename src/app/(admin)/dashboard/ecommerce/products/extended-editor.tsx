"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { TRUST_ICONS, sectionFilled, type ExtendedKey, type ProductExtended } from "@/lib/ecommerce/product-extended";

const TITLES: Record<ExtendedKey, string> = {
  description: "Description accordion",
  details: "Details accordion (e.g. Fragrance Notes)",
  shipping: "Shipping & delivery accordion",
  video: "Video accordion (opens by itself)",
  trust: "Trust icons strip",
  story: "Story row (image + text, under the product)",
  banner: "Wide banner image (under the product)",
};

function Section({ k, value, defaults, makeDefault, onMakeDefault, children }: {
  k: ExtendedKey;
  value: ProductExtended;
  defaults?: ProductExtended;
  makeDefault?: Partial<Record<ExtendedKey, boolean>>;
  onMakeDefault?: (k: ExtendedKey, on: boolean) => void;
  children: React.ReactNode;
}) {
  const usingDefault = defaults && !sectionFilled(k, value[k]) && sectionFilled(k, defaults[k]);
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-semibold">{TITLES[k]}</p>
        {onMakeDefault && (
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground" title="On save, this section becomes the store default; every product without its own shows it">
            <input type="checkbox" checked={!!makeDefault?.[k]} onChange={(e) => onMakeDefault(k, e.target.checked)} /> Set as default for all products
          </label>
        )}
      </div>
      {usingDefault && <p className="text-[11px] text-muted-foreground">Empty here, so the store default is shown. Fill it in to use something different for this product.</p>}
      {children}
    </div>
  );
}

/**
 * Editor for the optional product-page sections. Used on the product form
 * (with "set as default" switches and the store default as a hint) and on
 * the Product Defaults page (no switches).
 */
export function ExtendedEditor({ value, onChange, defaults, makeDefault, onMakeDefault }: {
  value: ProductExtended;
  onChange: (v: ProductExtended) => void;
  defaults?: ProductExtended;
  makeDefault?: Partial<Record<ExtendedKey, boolean>>;
  onMakeDefault?: (k: ExtendedKey, on: boolean) => void;
}) {
  const d = value;
  const set = <K extends ExtendedKey>(k: K, v: ProductExtended[K]) => onChange({ ...value, [k]: v });
  const sp = { value, defaults, makeDefault, onMakeDefault };
  const rows = d.details?.rows ?? [];
  const items = d.trust?.items ?? [];
  return (
    <div className="space-y-3">
      <Section k="description" {...sp}>
        <Input className="h-8 text-xs" placeholder="Heading (Description)" value={d.description?.title ?? ""} onChange={(e) => set("description", { ...d.description, title: e.target.value })} />
        <Textarea rows={4} className="text-xs" placeholder="Text. Empty = the product's full description." value={d.description?.text ?? ""} onChange={(e) => set("description", { ...d.description, text: e.target.value })} />
      </Section>
      <Section k="details" {...sp}>
        <Input className="h-8 text-xs" placeholder="Heading (Fragrance Notes)" value={d.details?.title ?? ""} onChange={(e) => set("details", { ...d.details, title: e.target.value })} />
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[9rem_1fr_auto] gap-1.5">
            <Input className="h-8 text-xs" placeholder="Top note" value={r.label} onChange={(e) => set("details", { ...d.details, rows: rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <Input className="h-8 text-xs" placeholder="Bergamot, Apple" value={r.value} onChange={(e) => set("details", { ...d.details, rows: rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => set("details", { ...d.details, rows: rows.filter((_, j) => j !== i) })}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => set("details", { ...d.details, rows: [...rows, { label: "", value: "" }] })}><Plus className="w-3 h-3" /> Add row</Button>
      </Section>
      <Section k="video" {...sp}>
        <Input className="h-8 text-xs" placeholder="Heading (Video)" value={d.video?.title ?? ""} onChange={(e) => set("video", { ...d.video, title: e.target.value })} />
        <MediaPickerInput compact value={d.video?.url ?? ""} onChange={(v) => set("video", { ...d.video, url: v })} />
        <p className="text-[10px] text-muted-foreground">Upload an MP4, or paste a YouTube / Vimeo link.</p>
      </Section>
      <Section k="shipping" {...sp}>
        <Input className="h-8 text-xs" placeholder="Heading (Shipping and Delivery)" value={d.shipping?.title ?? ""} onChange={(e) => set("shipping", { ...d.shipping, title: e.target.value })} />
        <Textarea rows={3} className="text-xs" placeholder="Delivery times, charges, returns" value={d.shipping?.text ?? ""} onChange={(e) => set("shipping", { ...d.shipping, text: e.target.value })} />
      </Section>
      <Section k="trust" {...sp}>
        {items.map((t, i) => (
          <div key={i} className="grid grid-cols-[8rem_1fr_auto] gap-1.5">
            <select className="h-8 text-xs rounded-md border bg-background px-1" value={t.icon} onChange={(e) => set("trust", { items: items.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) })}>
              {TRUST_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <Input className="h-8 text-xs" placeholder="Next day delivery" value={t.label} onChange={(e) => set("trust", { items: items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => set("trust", { items: items.filter((_, j) => j !== i) })}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" className="gap-1" onClick={() => set("trust", { items: [...items, { icon: "Truck", label: "" }] })}><Plus className="w-3 h-3" /> Add icon</Button>
      </Section>
      <Section k="story" {...sp}>
        <MediaPickerInput compact value={d.story?.imageUrl ?? ""} onChange={(v) => set("story", { ...d.story, imageUrl: v })} />
        <Input className="h-8 text-xs" placeholder="Heading (The scent story)" value={d.story?.title ?? ""} onChange={(e) => set("story", { ...d.story, title: e.target.value })} />
        <Textarea rows={3} className="text-xs" placeholder="Text beside the image" value={d.story?.text ?? ""} onChange={(e) => set("story", { ...d.story, text: e.target.value })} />
      </Section>
      <Section k="banner" {...sp}>
        <MediaPickerInput compact value={d.banner?.imageUrl ?? ""} onChange={(v) => set("banner", { ...d.banner, imageUrl: v })} />
        <div className="space-y-1"><Label className="text-[11px]">Image description (for search engines)</Label><Input className="h-8 text-xs" value={d.banner?.alt ?? ""} onChange={(e) => set("banner", { ...d.banner, alt: e.target.value })} /></div>
      </Section>
    </div>
  );
}
