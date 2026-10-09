"use client";

import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PricingCatalogBlockProps } from "@/types/cms";

export function PricingCatalogSettings({ block }: { block: PricingCatalogBlockProps }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data;
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...d, [f]: v } });
  const sel = (label: string, field: keyof typeof d, opts: [string, string][]) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={String(d[field] ?? opts[0][0])} onValueChange={(v) => update(field, v)}>
        <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>{opts.map(([v, l]) => <SelectItem key={v} value={v} className="text-xs">{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  const txt = (label: string, field: keyof typeof d) => (
    <div><Label className="text-xs">{label}</Label><Input value={String(d[field] ?? "")} onChange={(e) => update(field, e.target.value)} className="h-8 text-xs mt-1" /></div>
  );
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Prices come from the platform price list (Super Admin → Plans). Edit them there, not here.</p>
      {sel("Show", "mode", [["packages", "Website packages"], ["care", "Care plans"], ["both", "Packages + Care summary"]])}
      {txt("Eyebrow", "eyebrow")}
      {txt("Title", "title")}
      <div><Label className="text-xs">Subtitle</Label><Textarea value={d.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="text-xs mt-1" rows={3} /></div>
      {sel("Language", "language", [["en", "English"], ["bn", "বাংলা"]])}
      {sel("Default currency", "defaultCurrency", [["USD", "USD"], ["BDT", "BDT"]])}
      {sel("Tone", "tone", [["dark", "Dark"], ["light", "Light"]])}
      <div className="flex items-center justify-between"><Label className="text-xs">Currency toggle</Label><Switch checked={d.showCurrencyToggle} onCheckedChange={(v) => update("showCurrencyToggle", v)} /></div>
      <div className="flex items-center justify-between"><Label className="text-xs">Bangladesh prompt</Label><Switch checked={d.showBdPrompt} onCheckedChange={(v) => update("showBdPrompt", v)} /></div>
      {txt("Bangladesh page link", "bdPromptUrl")}
      {txt("Care page link", "careLinkUrl")}
      {txt("Button link base", "ctaBaseUrl")}
    </div>
  );
}
