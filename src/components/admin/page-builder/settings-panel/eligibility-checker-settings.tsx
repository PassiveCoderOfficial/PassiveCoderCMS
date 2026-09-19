"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { EligibilityCheckerBlockProps, EligibilityDestination } from "@/types/cms";

/** Eligibility checker had no settings panel at all — found in the full
 *  block-editor audit. */
export function EligibilityCheckerSettings({ block }: { block: EligibilityCheckerBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const destinations = block.data.destinations ?? [];
  const addDestination = () => {
    const d: EligibilityDestination = { id: generateId(), label: "Destination", value: "destination" };
    update("destinations", [...destinations, d]);
  };
  const updateDestination = (id: string, f: keyof EligibilityDestination, v: unknown) => {
    update("destinations", destinations.map((d) => (d.id === id ? { ...d, [f]: v } : d)));
  };
  const removeDestination = (id: string) => update("destinations", destinations.filter((d) => d.id !== id));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input value={block.data.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Submit Button Label</Label>
        <Input value={block.data.submitLabel ?? ""} onChange={(e) => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" placeholder="Check Eligibility" />
      </div>
      <div>
        <Label className="text-xs">Success Message</Label>
        <Input value={block.data.successMessage ?? ""} onChange={(e) => update("successMessage", e.target.value)} className="h-8 text-xs mt-1" />
      </div>
      <div>
        <Label className="text-xs">Recipient Email</Label>
        <Input type="email" value={block.data.recipientEmail ?? ""} onChange={(e) => update("recipientEmail", e.target.value)} className="h-8 text-xs mt-1" placeholder="leads@yourbusiness.com" />
      </div>
      <div>
        <Label className="text-xs">Accent Color</Label>
        <ColorPicker value={block.data.accentColor ?? "#2563eb"} onChange={(v) => update("accentColor", v)} className="mt-0.5" />
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Destinations</p>
          <Button size="sm" variant="outline" onClick={addDestination} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-1.5">
          {destinations.map((d) => (
            <div key={d.id} className="flex items-center gap-1">
              <Input value={d.label} onChange={(e) => updateDestination(d.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder="Label" />
              <Input value={d.value} onChange={(e) => updateDestination(d.id, "value", e.target.value)} className="h-7 text-xs flex-1" placeholder="Value" />
              <Button size="icon" variant="ghost" onClick={() => removeDestination(d.id)} className="h-7 w-7 shrink-0 text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
