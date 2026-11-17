"use client";

import React from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { generateId } from "@/lib/utils";
import type { PricingBlockProps, PricingPlan } from "@/types/cms";
import { TextField, LinesField, MetersEditor, ShowcaseColorsEditor } from "./showcase-fields";

export function PricingSettings({ block }: { block: PricingBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });

  const addPlan = () => {
    const plan: PricingPlan = {
      id: generateId(), name: "New Plan", price: "$0", period: "mo",
      features: ["Feature one", "Feature two"], ctaLabel: "Get Started", ctaUrl: "#",
    };
    update("plans", [...(block.data.plans ?? []), plan]);
  };

  const plans = block.data.plans ?? [];
  const updatePlan = (id: string, f: keyof PricingPlan, v: unknown) => {
    update("plans", plans.map(p => p.id === id ? { ...p, [f]: v } : p));
  };

  const removePlan = (id: string) => update("plans", plans.filter(p => p.id !== id));

  const spec = block.templateVariant === "spec-cards";
  // Pro Tiers draws the label, tag, old price, spec line, greyed items and the note too (no bars, no WhatsApp).
  const pro = block.templateVariant === "pro-tiers";
  // Dark Table prints name, price, features and button only (no badge or description).
  const denseDark = block.templateVariant === "dark";

  return (
    <div className="space-y-3">
      {(spec || pro) && <TextField label="Small label above title" value={block.data.eyebrow} onChange={v => update("eyebrow", v)} placeholder="Promo prices" />}
      <div><Label className="text-xs">Title</Label><Input value={block.data.title ?? ""} onChange={e => update("title", e.target.value)} className="h-8 text-xs mt-1" /></div>
      <div><Label className="text-xs">Subtitle</Label><Input value={block.data.subtitle ?? ""} onChange={e => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" /></div>
      {/* No "Billing Toggle": the block never drew a monthly/yearly switch, so the old switch did nothing. */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs">USD / BDT Switcher</Label>
          <p className="text-[10px] text-muted-foreground">Shows USD ↔ BDT toggle to visitors</p>
        </div>
        <Switch checked={block.data.showCurrencyToggle ?? false} onCheckedChange={v => update("showCurrencyToggle", v)} />
      </div>
      {spec && (
        <div className="space-y-2 border-t pt-3">
          <TextField label="Currency before price" value={block.data.currencyPrefix} onChange={v => update("currencyPrefix", v)} placeholder="RM, $, QAR" />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Buttons open WhatsApp</Label>
              <p className="text-[10px] text-muted-foreground">Uses your site WhatsApp number from Contact details</p>
            </div>
            <Switch checked={block.data.whatsappCta ?? false} onCheckedChange={v => update("whatsappCta", v)} />
          </div>
          {block.data.whatsappCta && (
            <TextField label="WhatsApp message" value={block.data.whatsappText} onChange={v => update("whatsappText", v)}
              placeholder="Hi, I am interested in the {plan} package ({price})." hint="{plan} and {price} are filled in automatically" multiline />
          )}
          <TextField label="Note under the plans" value={block.data.footnote} onChange={v => update("footnote", v)} multiline />
          <ShowcaseColorsEditor value={block.data.colors} onChange={v => update("colors", v)} />
        </div>
      )}
      {pro && <TextField label="Note under the plans" value={block.data.footnote} onChange={v => update("footnote", v)} multiline />}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Plans</p>
          <Button size="sm" variant="outline" onClick={addPlan} className="h-6 text-xs px-2 gap-1"><Plus className="w-3 h-3" /> Add</Button>
        </div>
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className="border rounded-lg p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1">
                <Input value={plan.name} onChange={e => updatePlan(plan.id, "name", e.target.value)} className="h-7 text-xs flex-1" placeholder="Plan Name" />
                <Button size="icon" variant="ghost" onClick={() => removePlan(plan.id)} className="h-7 w-7 shrink-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Price from the catalog (Plans screen)</p>
                <select
                  className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={plan.catalog?.plan ? `${plan.catalog.plan}:${plan.catalog.partner ? "partner" : "retail"}` : ""}
                  onChange={e => {
                    const [id, tier] = e.target.value.split(":");
                    updatePlan(plan.id, "catalog", id ? { plan: id, partner: tier === "partner" } : undefined);
                  }}
                >
                  <option value="">Off: use the price typed below</option>
                  <option value="basic:retail">Basic</option>
                  <option value="pro:retail">Pro</option>
                  <option value="biz:retail">Biz</option>
                  <option value="basic:partner">Basic, partner price</option>
                  <option value="pro:partner">Pro, partner price</option>
                  <option value="biz:partner">Biz, partner price</option>
                </select>
              </div>
              <div className="flex gap-1">
                <Input value={plan.price} onChange={e => updatePlan(plan.id, "price", e.target.value)} className="h-7 text-xs flex-1" placeholder="$29" />
                <Input value={plan.period ?? ""} onChange={e => updatePlan(plan.id, "period", e.target.value)} className="h-7 text-xs w-16" placeholder="mo" />
              </div>
              {block.data.showCurrencyToggle && (
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">USD price (cents, for BDT conversion)</p>
                  <Input
                    type="number"
                    min={0}
                    value={plan.priceUsdCents ?? ""}
                    onChange={e => updatePlan(plan.id, "priceUsdCents", e.target.value ? Number(e.target.value) : undefined)}
                    className="h-7 text-xs"
                    placeholder="e.g. 2900 = $29.00"
                  />
                </div>
              )}
              {(spec || pro) && (
                <>
                  <div className="flex gap-1">
                    <Input value={plan.oldPrice ?? ""} onChange={e => updatePlan(plan.id, "oldPrice", e.target.value)} className="h-7 text-xs flex-1" placeholder="Old price (crossed out)" />
                    <Input value={plan.tag ?? ""} onChange={e => updatePlan(plan.id, "tag", e.target.value)} className="h-7 text-xs flex-1" placeholder="Tag chip" />
                  </div>
                  <Input value={plan.spec ?? ""} onChange={e => updatePlan(plan.id, "spec", e.target.value)} className="h-7 text-xs" placeholder="Spec line (e.g. Nano Ceramic)" />
                  {spec && <MetersEditor value={plan.meters} onChange={v => updatePlan(plan.id, "meters", v)} />}
                </>
              )}
              {!denseDark && (
                <Textarea value={plan.description ?? ""} onChange={e => updatePlan(plan.id, "description", e.target.value)} className="text-xs resize-none" rows={2} placeholder="Short description (optional), e.g. Perfect for individuals" />
              )}
              {!denseDark && <Input value={plan.badge ?? ""} onChange={e => updatePlan(plan.id, "badge", e.target.value)} className="h-7 text-xs" placeholder="Badge (e.g. Most Popular)" />}
              <div className="flex items-center justify-between">
                <Label className="text-xs">{spec ? "Highlighted (dark card)" : pro ? "Recommended (brand border)" : "Highlighted"}</Label>
                <Switch checked={plan.highlighted ?? false} onCheckedChange={v => updatePlan(plan.id, "highlighted", v)} />
              </div>
              {/* LinesField keeps blank lines while typing (so Enter starts a new feature) and drops them on blur. */}
              <LinesField label="Features" value={plan.features ?? []} onChange={v => updatePlan(plan.id, "features", v)} rows={4} />
              {(spec || pro) && <LinesField label="Not included (shown greyed)" value={plan.excludedFeatures} onChange={v => updatePlan(plan.id, "excludedFeatures", v)} rows={2} />}
              <Input value={plan.ctaLabel ?? ""} onChange={e => updatePlan(plan.id, "ctaLabel", e.target.value)} className="h-7 text-xs" placeholder="CTA Label" />
              {!(spec && block.data.whatsappCta) && <Input value={plan.ctaUrl ?? ""} onChange={e => updatePlan(plan.id, "ctaUrl", e.target.value)} className="h-7 text-xs" placeholder="CTA URL" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
