"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { SocialLinksBlockProps } from "@/types/cms";

export function SocialLinksSettings({ block }: { block: SocialLinksBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const d = block.data;
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Shows the site&apos;s profiles from <Link href="/dashboard/business-profile#social-media" className="text-primary underline">Business Profile → Social Media</Link>. Edit them there once; every Social Links section, the header and the footer update together.
      </p>
      <div><Label className="text-xs">Title (optional)</Label><Input value={d.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" placeholder="Follow us" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Align</Label>
          <select value={d.align ?? "center"} onChange={(e) => update("align", e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2 mt-1">
            <option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Size</Label>
          <select value={d.size ?? "md"} onChange={(e) => update("size", e.target.value)} className="w-full h-8 text-xs rounded-md border bg-background px-2 mt-1">
            <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between"><Label className="text-xs">Brand colours</Label><Switch checked={d.brandColors !== false} onCheckedChange={(v) => update("brandColors", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Show network names</Label><Switch checked={!!d.showLabels} onCheckedChange={(v) => update("showLabels", v)} /></div>
    </div>
  );
}
