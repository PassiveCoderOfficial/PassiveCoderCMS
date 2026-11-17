"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HeaderCtaBlockProps } from "@/types/cms";

/** Header Button and header Booking button (same fields; the booking one defaults to /book). */
export function HeaderCtaSettings({ block }: { block: HeaderCtaBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  // What renders when a box is empty (the components' own fallbacks).
  const booking = (block.type as string) === "header_booking";

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Button text</Label><Input value={block.data.label ?? ""} placeholder={booking ? "Book now" : "Get Started"} onChange={(e) => update("label", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Button goes to</Label><Input value={block.data.url ?? ""} placeholder={booking ? "/book" : "#"} onChange={(e) => update("url", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Style</Label>
        <Select value={block.data.variant} onValueChange={(v) => update("variant", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
            <SelectItem value="solid" className="text-xs">Solid</SelectItem>
            <SelectItem value="outline" className="text-xs">Outline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {booking
          ? "On narrow phones the button shows only its calendar icon."
          : "Hidden on phones; when the header has Nav Links, the button shows at the bottom of the phone menu."}
      </p>
    </div>
  );
}
