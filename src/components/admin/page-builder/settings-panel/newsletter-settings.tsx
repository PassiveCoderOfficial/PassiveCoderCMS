"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NewsletterBlockProps } from "@/types/cms";
import { TextField } from "./showcase-fields";

export function NewsletterSettings({ block }: { block: NewsletterBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <TextField label="Description" value={block.data.description} onChange={v => update("description", v)} multiline />
      <div><Label className="text-xs">Text inside the email box</Label><Input value={block.data.placeholder ?? ""} onChange={e => update("placeholder", e.target.value)} className="h-8 text-xs mt-1" placeholder={block.data.fieldStyle === "underline" ? "Email address" : "Enter your email..."} /></div>
      <div><Label className="text-xs">Button Label</Label><Input value={block.data.submitLabel ?? ""} onChange={e => update("submitLabel", e.target.value)} className="h-8 text-xs mt-1" placeholder={block.data.fieldStyle === "underline" ? "Sign up" : "Subscribe"} /></div>
      <div><Label className="text-xs">Success Message</Label><Input value={block.data.successMessage ?? ""} onChange={e => update("successMessage", e.target.value)} className="h-8 text-xs mt-1" placeholder="You're subscribed!" /></div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={v => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["inline","stacked","card"].map(l => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Field style</Label>
        <Select value={block.data.fieldStyle ?? "box"} onValueChange={v => update("fieldStyle", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="box" className="text-xs">Box + button</SelectItem>
            <SelectItem value="underline" className="text-xs">Underline + light pill</SelectItem>
          </SelectContent>
        </Select>
        {block.data.fieldStyle === "underline" && <p className="text-[10px] text-muted-foreground mt-1">The underline look is always centred; Layout only changes the thank-you box.</p>}
      </div>
      <div><Label className="text-xs">Webhook URL (optional)</Label><Input value={block.data.webhookUrl ?? ""} onChange={e => update("webhookUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="https://..." /></div>
    </div>
  );
}
