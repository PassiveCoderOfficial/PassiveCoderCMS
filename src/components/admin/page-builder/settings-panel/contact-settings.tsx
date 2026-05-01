"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { ContactBlockProps } from "@/types/cms";
import { PhoneInput } from "@/components/ui/phone-input";

export function ContactSettings({ block }: { block: ContactBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addField = () => {
    update("fields", [...block.data.fields, { id: generateId(), label: "New Field", type: "text", required: false }]);
  };

  const updateField = (id: string, f: string, v: unknown) => {
    update("fields", block.data.fields.map(fi => fi.id === id ? { ...fi, [f]: v } : fi));
  };

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["centered","left","split"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label className="text-xs">Submit Label</Label><Input value={block.data.submitLabel} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Success Message</Label><Input value={block.data.successMessage} onChange={e => update("successMessage", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Recipient Email</Label><Input value={block.data.recipientEmail ?? ""} onChange={e => update("recipientEmail", e.target.value)} className="h-8 text-xs mt-1" placeholder="notifications@example.com" /></div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Contact Info</Label>
        <Switch checked={block.data.showContactInfo} onCheckedChange={v => update("showContactInfo", v)} />
      </div>
      {block.data.showContactInfo && (
        <>
          <div><Label className="text-xs">Email</Label><Input value={block.data.email ?? ""} onChange={e => update("email", e.target.value)} className="h-8 text-xs mt-1" /></div>
          <div><Label className="text-xs">Phone</Label><PhoneInput value={block.data.phone ?? ""} onChange={v => update("phone", v)} className="mt-1" inputClassName="h-8 text-xs" /></div>
          <div><Label className="text-xs">Address</Label><Input value={block.data.address ?? ""} onChange={e => update("address", e.target.value)} className="h-8 text-xs mt-1" /></div>
        </>
      )}
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Map</Label>
        <Switch checked={block.data.showMap} onCheckedChange={v => update("showMap", v)} />
      </div>
      {block.data.showMap && (
        <div><Label className="text-xs">Map Embed URL</Label><Input value={block.data.mapEmbedUrl ?? ""} onChange={e => update("mapEmbedUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="Google Maps embed URL" /></div>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Form Fields</p>
          <Button size="sm" variant="outline" onClick={addField} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-2">
          {block.data.fields.map(f => (
            <div key={f.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={f.label} onChange={e => updateField(f.id, "label", e.target.value)} className="h-7 text-xs flex-1" placeholder="Label" />
                <Button size="icon" variant="ghost" onClick={() => update("fields", block.data.fields.filter(fi => fi.id !== f.id))} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Select value={f.type} onValueChange={v => updateField(f.id, "type", v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{["text","email","tel","textarea","select"].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch checked={f.required} onCheckedChange={v => updateField(f.id, "required", v)} />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
