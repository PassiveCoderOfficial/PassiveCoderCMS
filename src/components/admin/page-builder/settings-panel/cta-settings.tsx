"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CTABlockProps } from "@/types/cms";
import { Switch } from "@/components/ui/switch";
import { TextField, ShowcaseColorsEditor, ImageField } from "./showcase-fields";
import { VisitMapLocation } from "@/components/map/visit-map-location";
import { ColorPicker } from "@/components/ui/color-picker";

type BtnKey = "primaryButton" | "secondaryButton" | "tertiaryButton";

/** Optional per-button colour (e.g. WhatsApp green); empty = the design's colours. */
function ButtonColors({ value, onChange }: { value?: { bgColor?: string; textColor?: string }; onChange: (f: "bgColor" | "textColor", v: string) => void }) {
  return (
    <div className="mt-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div><Label className="text-[10px] text-muted-foreground">Button colour</Label><ColorPicker value={value?.bgColor || ""} onChange={(v) => onChange("bgColor", v)} className="h-7 mt-0.5" /></div>
        <div><Label className="text-[10px] text-muted-foreground">Text colour</Label><ColorPicker value={value?.textColor || ""} onChange={(v) => onChange("textColor", v)} className="h-7 mt-0.5" /></div>
      </div>
      {(value?.bgColor || value?.textColor) && (
        <button type="button" onClick={() => { onChange("bgColor", ""); onChange("textColor", ""); }} className="text-[11px] text-muted-foreground underline mt-1">Use design colours</button>
      )}
    </div>
  );
}

export function CTASettings({ block }: { block: CTABlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const updateBtn = (btn: BtnKey, f: string, v: string) => {
    const ex = block.data[btn] ?? { label: "", url: "" };
    update(btn, { ...ex, [f]: f === "bgColor" || f === "textColor" ? v || undefined : v });
  };
  // Light/dark text applies to the coloured banners and the default design.
  const toneApplies = !block.templateVariant || ["gradient-banner", "navy-banner", "orange-banner", "banner"].includes(block.templateVariant);

  const visit = block.templateVariant === "visit-map";
  const banner = block.templateVariant === "boutique-banner";
  const pro = block.templateVariant === "pro-band";

  return (
    <div className="space-y-3">
      {(visit || banner || pro) && <TextField label="Small label above title" value={block.data.eyebrow} onChange={(v) => update("eyebrow", v)} />}
      <div><Label className="text-xs">Title</Label><Input value={block.data.title} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Description</Label><Textarea value={block.data.description ?? ""} onChange={(e) => update("description", e.target.value)} className="text-xs resize-none mt-1" rows={3} /></div>
      {pro && (
        <TextField label="Command under the buttons (with a copy button)" value={block.data.command} onChange={(v) => update("command", v || undefined)} placeholder="docker compose up -d"
          hint="Light or dark text follows the section Background (Layout tab)." />
      )}
      {visit && (
        <div className="space-y-2 border-t pt-2">
          <p className="text-[10px] text-muted-foreground">Address and phone come from Contact details. Fill these only to show something different.</p>
          <TextField label="Address" value={block.data.address} onChange={(v) => update("address", v)} multiline />
          <TextField label="Phone" value={block.data.phone} onChange={(v) => update("phone", v)} />
          <TextField label="Opening hours" value={block.data.hours} onChange={(v) => update("hours", v)} multiline placeholder="Mon-Sat 9am-7pm" />
          <VisitMapLocation block={block} />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show map</Label>
            <Switch checked={block.data.showMap !== false} onCheckedChange={(v) => update("showMap", v)} />
          </div>
          <ShowcaseColorsEditor value={block.data.colors} onChange={(v) => update("colors", v)} />
          <p className="text-[10px] text-muted-foreground">Button links left empty open WhatsApp (first) and map directions (second).</p>
          {!block.data.primaryButton?.url && (
            <TextField label="WhatsApp message (first button)" value={block.data.whatsappText} onChange={(v) => update("whatsappText", v || undefined)} multiline placeholder="Hi, I would like to know more." />
          )}
        </div>
      )}
      {banner && (
        <div className="space-y-2 border-t pt-2">
          <ImageField label="Logo above the title (optional)" value={block.data.logoUrl} onChange={(v) => update("logoUrl", v)} />
          {block.data.logoUrl && <TextField label="Logo height (px)" value={String(block.data.logoHeight ?? 110)} onChange={(v) => update("logoHeight", Number(v) || undefined)} />}
          <p className="text-[10px] text-muted-foreground">The photo and its dark overlay are set under Layout → Background (Image). Height: Style → Minimum height.</p>
          <div>
            <Label className="text-xs">Text position</Label>
            <Select value={block.data.contentPosition ?? "center"} onValueChange={(v) => update("contentPosition", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="center" className="text-xs">Centred</SelectItem>
                <SelectItem value="top" className="text-xs">Top of the photo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Dark text (for pale photos)</Label>
            <Switch checked={block.data.tone === "dark"} onCheckedChange={(v) => update("tone", v ? "dark" : "light")} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Justify text</Label>
            <Switch checked={block.data.justify ?? false} onCheckedChange={(v) => update("justify", v)} />
          </div>
          <div>
            <Label className="text-xs">Button look</Label>
            <Select value={block.data.buttonStyle ?? "brand"} onValueChange={(v) => update("buttonStyle", v)}>
              <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brand" className="text-xs">Brand colour</SelectItem>
                <SelectItem value="light" className="text-xs">Light grey pill</SelectItem>
                <SelectItem value="call-pill" className="text-xs">White call pill (phone icon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {block.data.buttonStyle === "call-pill" && (
            <TextField label="Small line above the button text" value={block.data.buttonKicker} onChange={(v) => update("buttonKicker", v)} placeholder="TAP TO CALL" />
          )}
          <div className="flex items-center justify-between">
            <Label className="text-xs">Content in a glass box</Label>
            <Switch checked={block.data.glassBox ?? false} onCheckedChange={(v) => update("glassBox", v || undefined)} />
          </div>
          <ShowcaseColorsEditor value={block.data.colors} onChange={(v) => update("colors", v)} />
        </div>
      )}
      {toneApplies && (
        <div>
          <Label className="text-xs">Text colour</Label>
          <Select value={block.data.tone ?? "auto"} onValueChange={(v) => update("tone", v === "auto" ? undefined : v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">{block.templateVariant ? "Light (design default)" : "Automatic (from background)"}</SelectItem>
              <SelectItem value="light" className="text-xs">Light text (dark backgrounds)</SelectItem>
              <SelectItem value="dark" className="text-xs">Dark text (pale backgrounds)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {!visit && !banner && <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["centered","left","split"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>}
      <div className="border-t pt-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Primary Button</p>
        <Input value={block.data.primaryButton?.label ?? ""} onChange={(e) => updateBtn("primaryButton", "label", e.target.value)} className="h-7 text-xs mb-1.5" placeholder="Label" />
        <Input value={block.data.primaryButton?.url ?? ""} onChange={(e) => updateBtn("primaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
        {!visit && !banner && <ButtonColors value={block.data.primaryButton} onChange={(f, v) => updateBtn("primaryButton", f, v)} />}
      </div>
      <div className="border-t pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Booking button</Label>
          <Switch checked={!!block.data.showBooking} onCheckedChange={(v) => update("showBooking", v)} />
        </div>
        <p className="text-[11px] text-muted-foreground">Shows a Book button next to the main button, opening your booking page. Set hours in Dashboard &gt; Bookings.</p>
        {block.data.showBooking && (
          <>
            <div><Label className="text-xs">Button label</Label><Input value={block.data.bookingLabel ?? ""} placeholder="Book now" onChange={(e) => update("bookingLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
            <div><Label className="text-xs">Booking page</Label><Input value={block.data.bookingUrl ?? ""} placeholder="/book" onChange={(e) => update("bookingUrl", e.target.value)} className="h-8 text-xs mt-1" /></div>
          </>
        )}
      </div>
      {!block.data.showBooking && <div className="border-t pt-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Secondary Button</p>
        <Input value={block.data.secondaryButton?.label ?? ""} onChange={(e) => updateBtn("secondaryButton", "label", e.target.value)} className="h-7 text-xs mb-1.5" placeholder="Label" />
        <Input value={block.data.secondaryButton?.url ?? ""} onChange={(e) => updateBtn("secondaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
        {!visit && !banner && <ButtonColors value={block.data.secondaryButton} onChange={(f, v) => updateBtn("secondaryButton", f, v)} />}
      </div>}
      {!visit && !banner && <div className="border-t pt-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-2">Third Button (optional)</p>
        <Input value={block.data.tertiaryButton?.label ?? ""} onChange={(e) => updateBtn("tertiaryButton", "label", e.target.value)} className="h-7 text-xs mb-1.5" placeholder="Label, e.g. WhatsApp" />
        <Input value={block.data.tertiaryButton?.url ?? ""} onChange={(e) => updateBtn("tertiaryButton", "url", e.target.value)} className="h-7 text-xs" placeholder="URL" />
        {block.data.tertiaryButton?.label && <ButtonColors value={block.data.tertiaryButton} onChange={(f, v) => updateBtn("tertiaryButton", f, v)} />}
      </div>}
    </div>
  );
}
