"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database, Pencil, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { generateId } from "@/lib/utils";
import { TextField, LinesField, ImageField, ShowcaseColorsEditor } from "./showcase-fields";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { SortableList } from "@/components/admin/sortable-list";
import { ServicesManagerDialog } from "@/components/admin/services-manager";
import { useContentVersion } from "@/lib/content/content-events";
import { renderedVariant } from "./rendered-variant";
import type { ServicesBlockProps } from "@/types/cms";

interface ServiceGroup {
  id: string;
  name: string;
  slug: string;
}

/** What each layout prints when a card's link text is empty ("" = nothing). */
const LINK_TEXT_DEFAULT: Record<string, string> = {
  "": "Learn More", "icon-cards-grid": "Learn More", "image-cards-dark": "Learn More", "bordered-list": "Learn More",
  "dark-grid-cards": "Learn More", "menu-cards": "Learn More", "program-cards-dark": "Learn More",
  "site-showcase": "Visit", bento: "Explore",
};
/** Layouts that draw the icon (the default grid only when the card has no photo). */
const ICON_LAYOUTS = ["", "icon-cards-grid", "bordered-list", "dark-grid-cards", "numbered"];
/** Layouts that show the photo only when it is set as the icon (iconType "image"). */
const PHOTO_AS_ICON = ["icon-cards-grid", "bordered-list", "dark-grid-cards"];

export function ServicesSettings({ block }: { block: ServicesBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (field: string, value: unknown) =>
    updateBlock(block.id, { data: { ...block.data, [field]: value } });
  const items = block.data.items ?? [];

  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const source = block.data.source ?? "inline";

  const [managing, setManaging] = useState(false);
  // One item open at a time keeps the list short enough to drag.
  const [openItem, setOpenItem] = useState<string | null>(null);
  const servicesVersion = useContentVersion("services");

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then(data => Array.isArray(data) && setGroups(data))
      .catch(() => {});
  }, [servicesVersion]);

  const updateItem = (itemId: string, field: string, value: unknown) => {
    update("items", items.map((it) => it.id === itemId ? { ...it, [field]: value } : it));
  };

  const addItem = () => {
    const id = generateId();
    update("items", [...items, { id, icon: "Star", iconType: "lucide", title: "New Service", description: "Description here", link: "#", linkLabel: "Learn More" }]);
    setOpenItem(id);
  };

  const removeItem = (id: string) => {
    update("items", items.filter((it) => it.id !== id));
  };

  // Unknown saved variants draw the default grid, so they get its fields.
  const v = renderedVariant("services", block.templateVariant);
  const showcase = v === "bento" || v === "photo-cards";
  const tiles = v === "boutique-tiles";
  const split = v === "" && block.data.headingLayout === "split";
  // Small label above the title: Bento, Photo Cards, Website Showcase and the split heading.
  const eyebrowApplies = showcase || v === "site-showcase" || split;
  // Variants whose subtitle is the small line above the title can also show a paragraph under it.
  const introApplies = ["", "icon-cards-grid", "image-cards-dark", "site-showcase", "bordered-list", "dark-grid-cards", "menu-cards", "image-tiles", "program-cards-dark", "numbered"].includes(v);
  // Card text alignment + solid buttons: default grid and Image Cards Dark.
  const cardOpts = v === "" || v === "image-cards-dark";
  const kickerApplies = showcase || v === "site-showcase" || (v === "" && block.data.layout !== "list");
  const linkTextApplies = v !== "image-tiles" && v !== "photo-cards";
  const linkTextPlaceholder = tiles ? "Button text (empty = caption is the link)"
    : v === "numbered" ? "Small line under the text (optional)"
    : `Link text (empty = ${LINK_TEXT_DEFAULT[v] ?? "Learn More"})`;
  const photoAsIcon = PHOTO_AS_ICON.includes(v) || (v === "" && block.data.layout === "list");
  const metaApplies = v !== "bento" && !tiles;
  const columnsApply = v !== "bordered-list" && v !== "bento";
  const wa = block.data.whatsappButton;
  const setWa = (patch: Partial<NonNullable<ServicesBlockProps["data"]["whatsappButton"]>>) => {
    const next = { number: "", ...wa, ...patch };
    update("whatsappButton", next.number || next.label || next.message || next.color ? next : undefined);
  };
  const points = block.data.headingPoints ?? [];

  return (
    <div className="space-y-4">
      {eyebrowApplies && <TextField label="Small label above title" value={block.data.eyebrow} onChange={(v) => update("eyebrow", v)} />}
      <div className="space-y-1.5"><Label className="text-xs">Section Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs" /></div>
      <div className="space-y-1.5"><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs" /></div>
      {introApplies && (
        <div className="space-y-1.5">
          <Label className="text-xs">Text under the title (optional)</Label>
          <Textarea value={block.data.intro ?? ""} onChange={(e) => update("intro", e.target.value || undefined)} className="text-xs resize-none" rows={2} placeholder="A short paragraph; the subtitle stays as the small line above the title" />
        </div>
      )}
      {v === "" && (
        <div className="space-y-2 rounded-md border p-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Heading</Label>
            <Select value={block.data.headingLayout ?? "center"} onValueChange={(x) => update("headingLayout", x === "split" ? "split" : undefined)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="center" className="text-xs">Centred</SelectItem>
                <SelectItem value="split" className="text-xs">Title left, text right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {split && (
            <LinesField label="Check points beside the heading" value={points.map((p) => p.text)} rows={3}
              onChange={(lines) => update("headingPoints", lines.map((text, i) => ({ id: points[i]?.id ?? generateId(), text })))} />
          )}
        </div>
      )}
      {(cardOpts || v === "icon-cards-grid") && (
        <div className="space-y-2 rounded-md border p-2">
          {cardOpts && (
            <div className="flex items-center justify-between">
              <Label className="text-xs">Centre card text</Label>
              <Switch checked={block.data.itemAlign === "center"} onCheckedChange={(x) => update("itemAlign", x ? "center" : undefined)} />
            </div>
          )}
          {v === "" && (
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Photo height (px, blank = 4:3)</Label>
              <Input type="number" min={120} max={480} step={10} value={block.data.imageHeight ?? ""} onChange={(e) => update("imageHeight", e.target.value ? Number(e.target.value) : undefined)} className="h-7 w-20 text-xs" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Links as solid buttons</Label>
            <Switch checked={block.data.linkStyle === "solid"} onCheckedChange={(x) => update("linkStyle", x ? "solid" : undefined)} />
          </div>
          {v === "" && (block.data.linkStyle === "solid" || !!wa?.number) && (
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs">Button colour (blank = brand)</Label>
              <ColorPicker value={block.data.linkColor ?? ""} onChange={(x) => update("linkColor", x || undefined)} className="w-28" />
            </div>
          )}
          {v === "image-cards-dark" && (
            <>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Brand-colour fade on photos</Label>
                <Switch checked={!block.data.noImageFade} onCheckedChange={(x) => update("noImageFade", x ? undefined : true)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Dark caption panel</Label>
                <Switch checked={block.data.captionTone === "dark"} onCheckedChange={(x) => update("captionTone", x ? "dark" : undefined)} />
              </div>
            </>
          )}
        </div>
      )}
      {v === "" && (
        <div className="space-y-1.5 rounded-md border p-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">WhatsApp button on every card</p>
          <Input value={wa?.number ?? ""} onChange={(e) => setWa({ number: e.target.value })} className="h-7 text-xs" placeholder="WhatsApp number, e.g. 6581758406 (empty = no button)" />
          {!!wa?.number && (
            <>
              <Input value={wa.label ?? ""} onChange={(e) => setWa({ label: e.target.value || undefined })} className="h-7 text-xs" placeholder="Button text (empty = WhatsApp)" />
              <Textarea value={wa.message ?? ""} onChange={(e) => setWa({ message: e.target.value || undefined })} className="text-xs resize-none" rows={2} placeholder="Hello, I would like a quotation for {title}." />
              <p className="text-[10px] text-muted-foreground">{"{title}"} becomes the card title.</p>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Button colour (blank = green)</Label>
                <ColorPicker value={wa.color ?? ""} onChange={(x) => setWa({ color: x || undefined })} className="w-28" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Layout + Card Style only affect ServicesLegacy (no templateVariant
          set). The designed variants have their own fixed card look and
          don't read these fields — showing dead dropdowns for them just
          confuses editors, so hide when a variant is active. */}
      {!v && (
        <div className="space-y-1.5">
          <Label className="text-xs">Layout</Label>
          <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["grid","list","cards","icon-list"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {columnsApply && (
        <div className="space-y-1.5">
          <Label className="text-xs">Columns</Label>
          <Select value={String(block.data.columns)} onValueChange={(v) => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["2","3","4","5","6","7","8","9","10"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {!v && (
        <div className="space-y-1.5">
          <Label className="text-xs">Card Style</Label>
          <Select value={block.data.cardStyle} onValueChange={(v) => update("cardStyle", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{["flat","elevated","bordered","gradient"].map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {/* Source toggle */}
      <div className="border-t pt-3">
        <Label className="text-xs font-semibold mb-2 block">Items Source</Label>
        <div className="flex gap-2">
          <button
            onClick={() => update("source", "inline")}
            className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border transition-colors ${source === "inline" ? "bg-muted border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Pencil className="h-3 w-3" /> Inline
          </button>
          <button
            onClick={() => update("source", "group")}
            className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border transition-colors ${source === "group" ? "bg-muted border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <Database className="h-3 w-3" /> From Group
          </button>
        </div>
      </div>

      {source === "group" ? (
        <div className="space-y-1.5">
          <Label className="text-xs">Service Group</Label>
          <Select value={block.data.source_group_id ?? ""} onValueChange={(v) => update("source_group_id", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select a group..." /></SelectTrigger>
            <SelectContent>
              {groups.map(g => <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>)}
              {groups.length === 0 && <SelectItem value="_none" className="text-xs text-muted-foreground" disabled>No groups — create one in Services</SelectItem>}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Loads live from the Services dashboard. Each card&apos;s title, text, photo, link and link text are edited there (Manage Service Groups).</p>
          <button type="button" onClick={() => setManaging(true)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <Settings2 className="h-3 w-3" /> Manage Service Groups
          </button>
          <ServicesManagerDialog open={managing} onOpenChange={setManaging}
            onGroupCreated={(id) => { if (!block.data.source_group_id) update("source_group_id", id); }} />
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold">Items ({items.length})</Label>
            <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" /> Add</Button>
          </div>
          <SortableList items={items} onReorder={(next) => update("items", next)} className="space-y-2"
            renderItem={(item, handle, i) => {
              const isOpen = openItem === item.id;
              return (
                <div className="rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-1 p-1.5">
                    {handle}
                    <button type="button" aria-expanded={isOpen} onClick={() => setOpenItem(isOpen ? null : item.id)} className="flex min-w-0 flex-1 items-center gap-1 text-left">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate text-xs font-medium">{item.title || `Item ${i + 1}`}</span>
                    </button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.title || `item ${i + 1}`}`}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                  {isOpen && (
                    <div className="space-y-2 border-t p-3">
                      {ICON_LAYOUTS.includes(v) && <Input value={item.icon ?? ""} onChange={(e) => updateItem(item.id, "icon", e.target.value)} className="h-7 text-xs" placeholder="Icon name (e.g. Zap)" />}
                      {kickerApplies && <Input value={item.kicker ?? ""} onChange={(e) => updateItem(item.id, "kicker", e.target.value || undefined)} className="h-7 text-xs" placeholder="Small label above the title (optional)" />}
                      <Input value={item.title} onChange={(e) => updateItem(item.id, "title", e.target.value)} className="h-7 text-xs" placeholder="Title" />
                      <Textarea value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder={v === "site-showcase" ? "Address shown in the browser bar (e.g. example.com)" : "Description"} />
                      <Input value={item.link ?? ""} onChange={(e) => updateItem(item.id, "link", e.target.value)} className="h-7 text-xs" placeholder="Link URL" />
                      {linkTextApplies && (
                        <Input value={item.linkLabel ?? ""} onChange={(e) => updateItem(item.id, "linkLabel", e.target.value || undefined)} className="h-7 text-xs" placeholder={linkTextPlaceholder} />
                      )}
                      <ImageField label="Image" value={item.imageUrl} onChange={(v) => updateItem(item.id, "imageUrl", v)} focus={item.imageFocus} onFocusChange={(f) => updateItem(item.id, "imageFocus", f)} />
                      {photoAsIcon && (
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px]">Show the photo instead of the icon</Label>
                          <Switch checked={item.iconType === "image"} onCheckedChange={(x) => updateItem(item.id, "iconType", x ? "image" : "lucide")} />
                        </div>
                      )}
                      {block.data.showFilter && <Input value={item.category ?? ""} onChange={(e) => updateItem(item.id, "category", e.target.value)} className="h-7 text-xs" placeholder="Category (filter tab, e.g. Ongoing)" />}
                      {metaApplies && (
                        <Textarea value={(item.meta ?? []).map((m) => `${m.label}: ${m.value}`).join("\n")} rows={2} className="text-xs resize-none" placeholder={"Details, one per line (optional)\nClient: Barzan Holdings"}
                          onChange={(e) => update("items", items.map((it) => it.id === item.id ? { ...it, meta: e.target.value.split("\n").map((l) => { const k = l.indexOf(":"); return k > 0 ? { label: l.slice(0, k).trim(), value: l.slice(k + 1).trim() } : { label: l.trim(), value: "" }; }).filter((m) => m.label) } : it))} />
                      )}
                    </div>
                  )}
                </div>
              );
            }} />
        </div>
      )}
      {v === "bento" && (
        <div className="flex items-center justify-between border-t pt-3">
          <Label className="text-xs">Hide text on small tiles</Label>
          <Switch checked={block.data.hideSmallText ?? false} onCheckedChange={(v) => update("hideSmallText", v)} />
        </div>
      )}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Filter tabs by category</Label>
          <Switch checked={block.data.showFilter ?? false} onCheckedChange={(v) => update("showFilter", v)} />
        </div>
        {block.data.showFilter && (
          <Input value={block.data.filterAllLabel ?? ""} onChange={(e) => update("filterAllLabel", e.target.value || undefined)} className="h-7 text-xs" placeholder="First tab text (empty = All)" />
        )}
      </div>
      <div className="border-t pt-3">
        <Label className="text-xs">&ldquo;View all&rdquo; button (optional)</Label>
        <div className="flex gap-1 mt-1">
          <Input value={block.data.allLink?.label ?? ""} onChange={(e) => update("allLink", { ...block.data.allLink, label: e.target.value })} className="h-7 text-xs flex-1" placeholder="Text (empty = View all)" />
          <Input value={block.data.allLink?.url ?? ""} onChange={(e) => update("allLink", { ...block.data.allLink, url: e.target.value })} className="h-7 text-xs flex-1" placeholder="/services" />
        </div>
      </div>
      {tiles && (
        <div className="space-y-1.5 border-t pt-3">
          <Label className="text-xs">Caption</Label>
          <Select value={block.data.tileStyle ?? "below"} onValueChange={(v) => update("tileStyle", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="below" className="text-xs">Under the photo</SelectItem>
              <SelectItem value="overlay" className="text-xs">On the photo, button at the bottom</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-xs">Photo shape</Label>
          <Select value={block.data.tileRatio ?? (block.data.columns === 2 ? "landscape" : "square")} onValueChange={(v) => update("tileRatio", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="landscape" className="text-xs">Landscape</SelectItem>
              <SelectItem value="square" className="text-xs">Square</SelectItem>
              <SelectItem value="portrait" className="text-xs">Portrait</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {(showcase || tiles) && <ShowcaseColorsEditor value={block.data.colors} onChange={(v) => update("colors", v)} />}
    </div>
  );
}
