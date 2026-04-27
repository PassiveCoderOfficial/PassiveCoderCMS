"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { PricingBlockProps, PricingPlan } from "@/types/cms";

export function PricingSettings({ block }: { block: PricingBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addPlan = () => {
    const plan: PricingPlan = {
      id: generateId(), name: "New Plan", price: "$0", period: "mo",
      features: ["Feature one", "Feature two"], ctaLabel: "Get Started", ctaUrl: "#",
    };
    update("plans", [...block.data.plans, plan]);
  };

  const updatePlan = (id: string, f: keyof PricingPlan, v: unknown) => {
    update("plans", block.data.plans.map(p => p.id === id ? { ...p, [f]: v } : p));
  };

  const removePlan = (id: string) => update("plans", block.data.plans.filter(p => p.id !== id));

  return (
    <div className="space-y-3">
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Billing Toggle</Label>
        <Switch checked={block.data.billingToggle} onCheckedChange={v => update("billingToggle", v)} />
      </div>
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Plans</p>
          <Button size="sm" variant="outline" onClick={addPlan} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {block.data.plans.map(plan => (
            <div key={plan.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={plan.name} onChange={e => updatePlan(plan.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Plan Name" />
                <Button size="icon" variant="ghost" onClick={() => removePlan(plan.id)} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <div className="flex gap-1">
                <Input value={plan.price} onChange={e => updatePlan(plan.id, "price", e.target.value)} className="h-7 text-xs flex-1" placeholder="$29" />
                <Input value={plan.period ?? ""} onChange={e => updatePlan(plan.id, "period", e.target.value)} className="h-7 text-xs w-16" placeholder="mo" />
              </div>
              <Input value={plan.badge ?? ""} onChange={e => updatePlan(plan.id, "badge", e.target.value)} className="h-7 text-xs" placeholder="Badge (e.g. Popular)" />
              <div className="flex items-center justify-between">
                <Label className="text-xs">Highlighted</Label>
                <Switch checked={plan.highlighted ?? false} onCheckedChange={v => updatePlan(plan.id, "highlighted", v)} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Features (one per line)</p>
                <textarea
                  className="w-full text-xs border rounded p-1.5 resize-none bg-background"
                  rows={4}
                  value={plan.features.join("\n")}
                  onChange={e => updatePlan(plan.id, "features", e.target.value.split("\n").filter(Boolean))}
                />
              </div>
              <Input value={plan.ctaLabel ?? ""} onChange={e => updatePlan(plan.id, "ctaLabel", e.target.value)} className="h-7 text-xs" placeholder="CTA Label" />
              <Input value={plan.ctaUrl ?? ""} onChange={e => updatePlan(plan.id, "ctaUrl", e.target.value)} className="h-7 text-xs" placeholder="CTA URL" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
