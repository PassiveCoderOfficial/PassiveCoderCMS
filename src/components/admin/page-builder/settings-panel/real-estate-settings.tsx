"use client";

import React from "react";
import Link from "next/link";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MediaPickerInput } from "@/components/admin/media-picker-input";
import { ColorPicker } from "@/components/ui/color-picker";
import { UiTextFields } from "./ui-text-fields";
import type {
  ReSearchBlockProps, ReListingsBlockProps, ReCommunitiesBlockProps, ReDevelopersBlockProps,
  ReCalculatorBlockProps, ReLeadFormBlockProps,
} from "@/types/cms";

type ReBlock = ReSearchBlockProps | ReListingsBlockProps | ReCommunitiesBlockProps | ReDevelopersBlockProps | ReCalculatorBlockProps | ReLeadFormBlockProps;

const selectCls = "w-full h-8 text-xs mt-1 rounded-md border bg-background px-2";

/** One settings panel for every real-estate block: shared title/subtitle,
 *  then the fields each block type actually has. Listings, communities and
 *  developers themselves are managed in Dashboard → Real Estate. */
export function RealEstateSettings({ block }: { block: ReBlock }) {
  const { updateBlock } = useBuilderStore();
  const d = block.data as Record<string, unknown>;
  const set = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } } as Partial<ReBlock>);
  const text = (f: string, label: string, placeholder?: string) => (
    <div><Label className="text-xs">{label}</Label><Input value={String(d[f] ?? "")} placeholder={placeholder} onChange={(e) => set(f, e.target.value)} className="h-8 text-xs mt-1" /></div>
  );
  const TAB_KEYS = ["sale", "rent", "offplan"] as const;
  const tabs = ((d.tabs as string[] | undefined)?.length ? (d.tabs as string[]) : [...TAB_KEYS]);
  const toggleTab = (k: string) => {
    const next = TAB_KEYS.filter((t) => (t === k ? !tabs.includes(t) : tabs.includes(t)));
    if (next.length) set("tabs", next);
  };
  const num = (f: string, label: string) => (
    <div><Label className="text-xs">{label}</Label><Input type="number" value={d[f] == null ? "" : String(d[f])} onChange={(e) => set(f, e.target.value === "" ? undefined : Number(e.target.value))} className="h-8 text-xs mt-1" /></div>
  );
  const toggle = (f: string, label: string, dflt = false) => (
    <div className="flex items-center justify-between"><Label className="text-xs">{label}</Label><Switch checked={d[f] == null ? dflt : !!d[f]} onCheckedChange={(v) => set(f, v)} /></div>
  );
  const select = (f: string, label: string, options: [string, string][]) => (
    <div><Label className="text-xs">{label}</Label>
      <select className={selectCls} value={String(d[f] ?? "")} onChange={(e) => set(f, e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-3">
      {text("title", "Title")}
      <div><Label className="text-xs">Subtitle</Label><Textarea value={String(d.subtitle ?? "")} onChange={(e) => set("subtitle", e.target.value)} className="text-xs mt-1" rows={2} /></div>

      {block.type === "re_search" && (
        <>
          {text("resultsPath", "Results page path", "/properties")}
          <div><Label className="text-xs">Search tabs</Label>
            <div className="flex gap-3 mt-1">
              {TAB_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-1.5 text-xs">
                  <input type="checkbox" checked={tabs.includes(k)} onChange={() => toggleTab(k)} />
                  {k === "sale" ? "Buy" : k === "rent" ? "Rent" : "Off-plan"}
                </label>
              ))}
            </div>
          </div>
          <div><Label className="text-xs">Background image</Label><MediaPickerInput compact value={String(d.backgroundImage ?? "")} onChange={(v) => set("backgroundImage", v)} className="mt-1" /></div>
          <div><Label className="text-xs">Portrait (split layout)</Label><MediaPickerInput compact value={String(d.portraitImage ?? "")} onChange={(v) => set("portraitImage", v)} className="mt-1" /></div>
          {Boolean(d.portraitImage) && (
            <>
              {select("portraitSide", "Portrait side", [["left", "Left"], ["right", "Right"]])}
              {text("portraitAlt", "Portrait description (for search engines)")}
              {text("eyebrow", "Eyebrow text")}
              {text("portraitCaption", "Portrait name tag")}
              {text("portraitSubcaption", "Portrait title")}
              {text("backdropColor", "Backdrop colour (hex)")}
              {text("glowColor", "Glow colour behind portrait (hex)")}
            </>
          )}
          {(["salePriceSteps", "rentPriceSteps"] as const).map((k) => (
            <div key={k}><Label className="text-xs">{k === "salePriceSteps" ? "Buy / off-plan max prices" : "Rent max prices"} (comma separated)</Label>
              <Input value={((d[k] as number[]) ?? []).join(", ")} placeholder="Default steps" onChange={(e) => set(k, e.target.value.split(",").map((x) => Number(x.replace(/\D/g, ""))).filter((n) => n > 0))} className="h-8 text-xs mt-1" />
            </div>
          ))}
        </>
      )}

      {block.type !== "re_search" && block.type !== "re_lead_form" && text("eyebrow", "Section label (editorial style)")}
      {block.type === "re_listings" && (
        <>
          {select("cardStyle", "Card style", [["standard", "Standard"], ["editorial", "Editorial"], ["showcase", "Showcase carousel"]])}
          {select("listingType", "Listing type", [["", "All (visitor can switch)"], ["sale", "For sale"], ["rent", "For rent"], ["offplan", "Off-plan"]])}
          {text("communitySlug", "Only community (slug)")}
          {text("developerSlug", "Only developer (slug)")}
          {toggle("featuredOnly", "Featured only")}
          {toggle("showFilters", "Show filters", true)}
          {toggle("syncUrl", "Read filters from page URL")}
          {num("limit", "Per page")}
          {select("columns", "Columns", [["3", "3"], ["2", "2"], ["4", "4"]])}
          {text("viewAllUrl", "\"View all\" link")}
          {d.cardStyle === "showcase" && (
            <div><Label className="text-xs">Accent colour (blank = theme)</Label>
              <ColorPicker value={String(d.accentColor ?? "")} onChange={(v) => set("accentColor", v || undefined)} className="mt-1" />
            </div>
          )}
        </>
      )}

      {block.type === "re_communities" && (
        <>
          {toggle("featuredOnly", "Featured only")}
          {text("country", "Only country")}
          {num("limit", "Max areas")}
        </>
      )}

      {block.type === "re_developers" && select("style", "Style", [["logos", "Logo wall"], ["cards", "Cards"]])}

      {block.type === "re_calculator" && (
        <>
          {select("mode", "Calculators", [["both", "Mortgage + yield"], ["mortgage", "Mortgage only"], ["roi", "Rental yield only"]])}
          {text("currency", "Currency")}
          {num("defaultPrice", "Default price")}
          {num("defaultDownPct", "Default down payment %")}
          {num("defaultRate", "Default interest %")}
          {num("defaultYears", "Default term (years)")}
        </>
      )}

      {block.type === "re_lead_form" && (
        <>
          {select("kind", "Lead type", [["consultation", "Consultation"], ["valuation", "Valuation"], ["viewing", "Viewing"], ["enquiry", "General enquiry"]])}
          {text("submitLabel", "Button label", "Send")}
          {text("successMessage", "Success message", "Thank you — we'll contact you shortly.")}
          {toggle("showBudget", "Ask for budget")}
          <div><Label className="text-xs">Selling points (one per line)</Label>
            <Textarea value={((d.bullets as string[]) ?? []).join("\n")} onChange={(e) => set("bullets", e.target.value.split("\n"))} className="text-xs mt-1" rows={4} />
          </div>
          <div><Label className="text-xs">Side image</Label><MediaPickerInput compact value={String(d.image ?? "")} onChange={(v) => set("image", v)} className="mt-1" /></div>
        </>
      )}

      <UiTextFields block={block} title="Words on this section" />

      <p className="text-[11px] text-muted-foreground">
        {block.type === "re_lead_form"
          ? <>Requests arrive in <Link href="/dashboard/real-estate/leads" className="underline">Dashboard &gt; Real Estate &gt; Leads</Link>.</>
          : block.type === "re_calculator"
            ? <>The calculator needs no listings; it only uses the numbers above.</>
            : <>Listings, areas and developers are managed in{" "}
                <Link href={block.type === "re_communities" ? "/dashboard/real-estate/communities" : block.type === "re_developers" ? "/dashboard/real-estate/developers" : "/dashboard/real-estate/properties"} className="underline">Dashboard &gt; Real Estate</Link>.</>}
      </p>
    </div>
  );
}
