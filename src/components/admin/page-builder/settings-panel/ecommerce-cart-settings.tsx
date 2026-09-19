"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EcommerceCartBlockProps } from "@/types/cms";

/** Ecommerce cart had no settings panel at all — found in the full
 *  block-editor audit. The block itself intentionally renders nothing in
 *  either the canvas or the live site (page-renderer.tsx: "cart is injected
 *  by layout" — a global cart drawer owns the real UI), so this only
 *  configures that drawer's behavior, not layout on the page. */
export function EcommerceCartSettings({ block }: { block: EcommerceCartBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground rounded-lg border bg-muted/30 p-2.5">
        This block has no visible position on the page — the cart is a
        global drawer, opened from the header cart icon. These options
        configure that drawer.
      </p>
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={block.data.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" placeholder="Your Cart" />
      </div>
      <div>
        <Label className="text-xs">Layout</Label>
        <Select value={block.data.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["default", "minimal"].map((l) => (
              <SelectItem key={l} value={l} className="text-xs capitalize">{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Order Summary</Label>
        <Switch checked={block.data.showOrderSummary} onCheckedChange={(v) => update("showOrderSummary", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Coupon Field</Label>
        <Switch checked={block.data.showCouponField} onCheckedChange={(v) => update("showCouponField", v)} />
      </div>
    </div>
  );
}
