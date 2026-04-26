"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AccountingFeedBlockProps } from "@/types/cms";

export function AccountingFeedSettings({ block }: { block: AccountingFeedBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Display Count</Label><Input type="number" value={block.data.displayCount} onChange={(e) => update("displayCount", Number(e.target.value))} className="h-8 text-xs mt-1" min={1} max={50} /></div>
      <div>
        <Label className="text-xs">Transaction Type</Label>
        <Select value={block.data.transactionType ?? "all"} onValueChange={(v) => update("transactionType", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all","donation","sale","expense"].map((t) => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{["list","ticker","cards"].map((l) => <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Amount</Label><Switch checked={block.data.showAmount} onCheckedChange={(v) => update("showAmount", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Date</Label><Switch checked={block.data.showDate} onCheckedChange={(v) => update("showDate", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show Message</Label><Switch checked={block.data.showMessage} onCheckedChange={(v) => update("showMessage", v)} /></div>
    </div>
  );
}
