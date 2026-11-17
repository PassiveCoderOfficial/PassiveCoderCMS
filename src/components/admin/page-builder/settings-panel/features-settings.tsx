"use client";

import React from "react";
import { IconPicker } from "@/components/ui/icon-picker";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { FeaturesBlockProps, FeatureItem } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { TextField, LinesField, ImageField, ItemsEditor, ShowcaseColorsEditor } from "./showcase-fields";
import { renderedVariant } from "./rendered-variant";

/** Designs that print the section subtitle (Numbered Grid shows it, else the Text). */
const NO_SUBTITLE = ["overview-quote", "image-stats", "text-tiles", "arrow-cards"];
/** Designs that print the section Text paragraph. */
const TEXT_VARIANTS = ["dark", "icon-list-cards", "bento-grid", "overview-quote", "image-stats", "text-tiles", "pro-split"];
/** Designs with their own column count (besides the default grid). */
const COLUMN_VARIANTS = ["numbered-columns", "centered-icons", "highlight-cards", "numbered-grid", "pro-grid"];
/** Designs that draw each feature's icon. */
const NO_ITEM_ICON = ["dark", "numbered-columns", "image-stats"];
/** Designs that draw each feature's photo (the default only in Alternating rows). */
const PHOTO_VARIANTS = ["dark", "icon-list-cards", "bento-grid", "alternating-media", "pro-bento"];
/** The Pro family: label above the title, section buttons, light or dark text from the Background. */
const PRO_VARIANTS = ["pro-bento", "pro-grid", "pro-split"];

export function FeaturesSettings({ block }: { block: FeaturesBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const items = block.data.items ?? [];

  const addItem = () => {
    const item: FeatureItem = { id: generateId(), icon: "Star", title: "New Feature", description: "Describe this feature." };
    update("items", [...items, item]);
  };

  const updateItem = (id: string, f: keyof FeatureItem, v: string) => {
    update("items", items.map(i => i.id === id ? { ...i, [f]: v } : i));
  };

  // Unknown saved variants (e.g. "alternating-images") draw the default layout, so they get its fields.
  const v = renderedVariant("features", block.templateVariant);
  const showcase = v === "overview-quote" || v === "numbered-grid" || v === "image-stats" || v === "text-tiles" || v === "arrow-cards";
  const pro = PRO_VARIANTS.includes(v);
  const card = block.data.card ?? {};
  const setCard = (patch: Partial<NonNullable<FeaturesBlockProps["data"]["card"]>>) => update("card", { ...card, ...patch });
  const textApplies = TEXT_VARIANTS.includes(v) || (v === "numbered-grid" && !block.data.subtitle);
  const photoApplies = PHOTO_VARIANTS.includes(v) || (!v && block.data.layout === "alternating");
  const buttonApplies = !showcase && !["dark", "bento-grid", "numbered-columns"].includes(v);
  // Dark Checklist: the first feature photo is the section background, so only that item offers it.
  const darkPhotoAt = Math.max(0, items.findIndex((x) => x.imageUrl));

  return (
    <div className="space-y-3">
      {(showcase || pro) && <TextField label="Small label above title" value={block.data.eyebrow} onChange={x => update("eyebrow", x)} />}
      {v === "overview-quote" && (
        <div className="space-y-1">
          <Label className="text-xs">Icon beside title (optional)</Label>
          <div className="flex items-center gap-2">
            <IconPicker value={block.data.icon ?? ""} onChange={(v) => update("icon", v || undefined)} />
            {block.data.icon && <button type="button" onClick={() => update("icon", undefined)} className="text-[11px] text-muted-foreground underline">Remove</button>}
          </div>
        </div>
      )}
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {!NO_SUBTITLE.includes(v) && (
        <div><Label className="text-xs">{v === "dark" || v === "icon-list-cards" || v === "bento-grid" ? "Small label above title" : "Subtitle"}</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      )}
      {textApplies && (
        <TextField label={v === "text-tiles" ? "Text (a blank line starts a new paragraph)" : "Text"} value={block.data.description} onChange={x => update("description", x)} multiline
          hint={v === "numbered-grid" ? "Shown under the title while the subtitle is empty." : undefined} />
      )}
      {/* Layout and Style shape the default design only; the named layouts fix their own look. */}
      {!v && (
        <>
          <div>
            <Label className="text-xs">Layout</Label>
            <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["grid","alternating","icon-list","centered"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Style</Label>
            <Select value={block.data.style} onValueChange={v => update("style", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["minimal","card","gradient"].map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      {(!v || COLUMN_VARIANTS.includes(v)) && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns ?? 3)} onValueChange={v => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[2,3,4].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {v === "arrow-cards" && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={block.data.columns === 3 ? "3" : "2"} onValueChange={x => update("columns", Number(x))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{[2,3].map(c => <SelectItem key={c} value={String(c)} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {(v === "alternating-media" || (!v && block.data.layout === "alternating")) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">First image on the right</Label>
          <Switch checked={!!block.data.imageRightFirst} onCheckedChange={x => update("imageRightFirst", x || undefined)} />
        </div>
      )}
      {v === "alternating-media" && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Show full image (no crop)</Label>
          <Switch checked={!!block.data.fullImage} onCheckedChange={x => update("fullImage", x)} />
        </div>
      )}
      {v === "overview-quote" && (
        <div className="space-y-2 border-t pt-3">
          <LinesField label="Tag chips" value={block.data.tags} onChange={x => update("tags", x)} rows={4} />
          <p className="text-[10px] font-semibold uppercase text-muted-foreground pt-1">Side card</p>
          <ImageField label="Card photo" value={card.imageUrl} onChange={x => setCard({ imageUrl: x })} focus={card.imageFocus} onFocusChange={f => setCard({ imageFocus: f })} />
          <TextField label="Card title" value={card.title} onChange={x => setCard({ title: x })} placeholder="Quick quote" />
          <TextField label="Card text" value={card.text} onChange={x => setCard({ text: x })} multiline />
          <TextField label="Button text" value={card.buttonLabel} onChange={x => setCard({ buttonLabel: x })} placeholder="Quote on WhatsApp" />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Button opens WhatsApp</Label>
            <Switch checked={card.whatsapp ?? false} onCheckedChange={x => setCard({ whatsapp: x })} />
          </div>
          {card.whatsapp
            ? <TextField label="WhatsApp message" value={card.whatsappText} onChange={x => setCard({ whatsappText: x })} multiline
                placeholder={`Hi, I would like a quote${block.data.eyebrow ? ` for ${block.data.eyebrow}` : ""}.`} />
            : <TextField label="Button link" value={card.buttonUrl} onChange={x => setCard({ buttonUrl: x })} placeholder="/contact" />}
        </div>
      )}
      {v === "numbered-grid" && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dark band</Label>
            <Switch checked={block.data.tone !== "light"} onCheckedChange={x => update("tone", x ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show icons instead of numbers</Label>
            <Switch checked={!!block.data.showIcons} onCheckedChange={x => update("showIcons", x || undefined)} />
          </div>
        </div>
      )}
      {v === "text-tiles" && (
        <div className="space-y-2 border-t pt-3">
          <div>
            <Label className="text-xs">Tiles</Label>
            <Select value={block.data.tileStyle ?? "soft"} onValueChange={x => update("tileStyle", x)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft" className="text-xs">Soft grey tiles</SelectItem>
                <SelectItem value="bordered" className="text-xs">White cards</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <LinesField label="Bold words under the buttons" value={block.data.tags} onChange={x => update("tags", x)} rows={3} />
          <TextField label="Text after the bold words" value={block.data.footnote} onChange={x => update("footnote", x)} />
          <TextField label="Words in the title to highlight" value={block.data.titleHighlight} onChange={x => update("titleHighlight", x || undefined)} />
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Highlight colour</Label><ColorPicker value={block.data.highlightColor ?? ""} onChange={x => update("highlightColor", x)} className="mt-1" /></div>
            <div><Label className="text-xs">Title colour</Label><ColorPicker value={block.data.titleColor ?? ""} onChange={x => update("titleColor", x)} className="mt-1" /></div>
          </div>
          <ItemsEditor title="Buttons" max={2} items={block.data.buttons} onChange={x => update("buttons", x)}
            make={() => ({ label: "Contact us", url: "/contact", style: "solid" as const })} itemLabel={it => it.label}
            render={(it, set) => (
              <div className="space-y-1">
                <Input value={it.label} onChange={e => set({ label: e.target.value })} className="h-7 text-xs" placeholder="Label" />
                <Input value={it.url} onChange={e => set({ url: e.target.value })} className="h-7 text-xs" placeholder="Link" />
                <select value={it.style ?? "solid"} onChange={e => set({ style: e.target.value as "solid" | "outline" | "accent" })} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                  <option value="solid">Filled</option><option value="outline">Outline</option><option value="accent">Accent pill</option>
                </select>
              </div>
            )} />
        </div>
      )}
      {v === "image-stats" && (
        <div className="space-y-2 border-t pt-3">
          <ImageField label="Photo" value={block.data.imageUrl} onChange={x => update("imageUrl", x)} focus={block.data.imageFocus} onFocusChange={f => update("imageFocus", f)} />
          <TextField label="Badge on photo: big text" value={block.data.badge?.title} onChange={x => update("badge", { ...block.data.badge, title: x })} />
          <TextField label="Badge on photo: small text" value={block.data.badge?.text} onChange={x => update("badge", { ...block.data.badge, text: x })} />
          <div className="space-y-1">
            <Label className="text-xs">Badge position</Label>
            <select value={block.data.badgePosition ?? "overlay"} onChange={e => update("badgePosition", e.target.value as "overlay" | "bottom-edge")} className="w-full h-8 rounded-md border bg-background px-2 text-xs">
              <option value="overlay">Over the photo</option><option value="bottom-edge">On the bottom edge</option>
            </select>
          </div>
          <ItemsEditor title="Buttons" max={2} items={block.data.buttons} onChange={x => update("buttons", x)}
            make={() => ({ label: "Contact us", url: "/contact", style: "solid" as const })} itemLabel={it => it.label}
            render={(it, set) => (
              <div className="space-y-1">
                <Input value={it.label} onChange={e => set({ label: e.target.value })} className="h-7 text-xs" placeholder="Label" />
                <Input value={it.url} onChange={e => set({ url: e.target.value })} className="h-7 text-xs" placeholder="Link" />
                <select value={it.style ?? "solid"} onChange={e => set({ style: e.target.value as "solid" | "outline" })} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                  <option value="solid">Filled</option><option value="outline">Outline</option>
                </select>
              </div>
            )} />
        </div>
      )}
      {pro && (
        <div className="space-y-2 border-t pt-3">
          {v !== "pro-split" && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Centre the heading</Label>
              <Switch checked={block.data.layout === "centered"} onCheckedChange={x => update("layout", x ? "centered" : "grid")} />
            </div>
          )}
          {v === "pro-split" && <ImageField label="Picture under the heading (optional)" value={block.data.imageUrl} onChange={x => update("imageUrl", x)} />}
          <ItemsEditor title="Buttons" max={2} items={block.data.buttons} onChange={x => update("buttons", x)}
            make={() => ({ label: "Learn more", url: "/contact", style: "solid" as const })} itemLabel={it => it.label}
            render={(it, set) => (
              <div className="space-y-1">
                <Input value={it.label} onChange={e => set({ label: e.target.value })} className="h-7 text-xs" placeholder="Label" />
                <Input value={it.url} onChange={e => set({ url: e.target.value })} className="h-7 text-xs" placeholder="Link" />
                <select value={it.style === "outline" ? "outline" : "solid"} onChange={e => set({ style: e.target.value as "solid" | "outline" })} className="w-full h-7 text-xs rounded-md border bg-background px-2">
                  <option value="solid">Filled</option><option value="outline">Outline</option>
                </select>
              </div>
            )} />
          <p className="text-[10px] text-muted-foreground">Light or dark text follows the section Background (Layout tab).</p>
        </div>
      )}
      {showcase && <ShowcaseColorsEditor value={block.data.colors} onChange={x => update("colors", x)} />}
      {v !== "overview-quote" && <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">{v === "image-stats" ? "Stat tiles (title = big number)" : v === "dark" ? "Checklist lines" : "Features"}</p>
          <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={item.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={item.title} onChange={e => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs flex-1" placeholder="Title" />
                <Button size="icon" variant="ghost" onClick={() => update("items", items.filter(i => i.id !== item.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              {v === "image-stats"
                ? <Input value={item.label ?? ""} onChange={e => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs" placeholder="Label under the number" />
                : !NO_ITEM_ICON.includes(v) && (v !== "numbered-grid" || block.data.showIcons) && <Input value={item.icon ?? ""} onChange={e => updateItem(item.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Lucide icon name (e.g. Star)" />}
              {v !== "dark" && <Textarea value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Description" />}
              {photoApplies && (v !== "dark" || i === darkPhotoAt) && (
                <ImageField label={v === "dark" ? "Section background photo (the first photo is used)" : "Photo (optional)"} value={item.imageUrl}
                  onChange={x => update("items", items.map(i => i.id === item.id ? { ...i, imageUrl: x || undefined } : i))}
                  focus={item.imageFocus} onFocusChange={f => update("items", items.map(i => i.id === item.id ? { ...i, imageFocus: f } : i))} />
              )}
              {v === "pro-bento" && (
                <div className="flex gap-1">
                  <Input value={item.label ?? ""} onChange={e => updateItem(item.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder="Small chip (e.g. Free)" />
                  <select value={item.span ?? ""} onChange={e => update("items", items.map(i => i.id === item.id ? { ...i, span: (e.target.value || undefined) as FeatureItem["span"] } : i))} className="h-7 text-xs rounded-md border bg-background px-2" aria-label="Tile width">
                    <option value="">Width: automatic</option><option value="1">1 column</option><option value="2">2 columns</option><option value="3">Full row</option>
                  </select>
                </div>
              )}
              {buttonApplies && (
                <div className="flex gap-1">
                  <Input value={item.buttonLabel ?? ""} onChange={e => updateItem(item.id, "buttonLabel", e.target.value)} className="h-7 text-xs flex-1" placeholder="Button text (optional)" />
                  <Input value={item.buttonUrl ?? ""} onChange={e => updateItem(item.id, "buttonUrl", e.target.value)} className="h-7 text-xs flex-1" placeholder="Button link" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>}
    </div>
  );
}
