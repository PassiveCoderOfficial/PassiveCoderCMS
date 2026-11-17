"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import type { StatusTrackerBlockProps } from "@/types/cms";
import { UiTextFields } from "./ui-text-fields";

/** Status tracker: visa applications or shop orders. Empty boxes keep the
 *  built-in text shown in grey (the renderer's fallbacks for each mode). */
export function StatusTrackerSettings({ block }: { block: StatusTrackerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  // Empty = delete the key, so the built-in text comes back (these use `??`).
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...d, [f]: v === "" ? undefined : v } });
  const order = d.mode === "order";
  const field = (f: "title" | "subtitle" | "placeholder" | "emailPlaceholder" | "helpText" | "submitLabel" | "contactUrl", label: string, placeholder?: string) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={d[f] ?? ""} onChange={(e) => update(f, e.target.value)} className="h-8 text-xs mt-1" placeholder={placeholder} />
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Tracks</Label>
        <select value={order ? "order" : "visa"} onChange={(e) => update("mode", e.target.value === "order" ? "order" : undefined)} className="w-full h-8 text-xs rounded-md border bg-background px-2 mt-1">
          <option value="visa">Visa applications (reference number)</option>
          <option value="order">Shop orders (order number + email)</option>
        </select>
      </div>
      {field("title", "Title")}
      {field("subtitle", "Subtitle")}
      {field("placeholder", order ? "Order number box" : "Reference box", order ? "Found in your order confirmation email." : "Enter passport or reference number")}
      {order && field("emailPlaceholder", "Email box", "Email you used during checkout.")}
      {field("helpText", "Help text under the form")}
      {field("submitLabel", "Button text", order ? "Track" : "Track Status")}
      {field("contactUrl", "'Contact us' link when nothing is found", order ? "Empty = no link" : "Empty = WhatsApp +880 1711-145428")}
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">No card frame</Label>
        <Switch checked={!!d.plain} onCheckedChange={(v) => update("plain", v || undefined)} />
      </div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={d.accentColor ?? ""} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
      <UiTextFields block={block} title="Words on this section" />
      {!order && <p className="text-[11px] text-muted-foreground">Visa lookups are not connected to an applications list yet, so every search shows the not-found message.</p>}
    </div>
  );
}
