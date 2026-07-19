"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "@/components/ui/color-picker";
import { createClient } from "@/lib/supabase/client";
import { getClientTenantId } from "@/lib/tenant/client";
import { cn } from "@/lib/utils";
import type { EcommerceProductsBlockProps } from "@/types/cms";

type Category = { id: string; name: string };

export function EcommerceProductsSettings({ block }: { block: EcommerceProductsBlockProps }) {
  const { updateBlock, tenantId: pageTenantId } = useBuilderStore();
  const update = (f: string, v: unknown) => updateBlock(block.id, { data: { ...block.data, [f]: v } });
  const d = block.data;

  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    const supabase = createClient();
    // Scope to the tenant that owns the page, not the viewer's own tenant —
    // they differ when a super admin edits another tenant's page.
    const resolveTenant = pageTenantId
      ? Promise.resolve(pageTenantId)
      : getClientTenantId();
    resolveTenant.then((tenantId) => {
      let q = supabase.from("categories").select("id,name").eq("type", "product").order("name");
      if (tenantId) q = q.eq("tenant_id", tenantId);
      q.then(({ data }) => setCategories((data as Category[]) ?? []));
    });
  }, [pageTenantId]);

  // Legacy blocks stored a single categoryId; treat it as a one-item selection.
  const selected = d.categoryIds ?? (d.categoryId ? [d.categoryId] : []);
  const toggleCategory = (id: string) => {
    const next = selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id];
    updateBlock(block.id, { data: { ...d, categoryIds: next, categoryId: undefined } });
  };

  return (
    <div className="space-y-4">
      {/* ── Content ── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Content</p>

      <div>
        <Label className="text-xs">Section Title</Label>
        <Input value={d.title ?? ""} onChange={(e) => update("title", e.target.value)} className="h-8 text-xs mt-1" placeholder="Our Products" />
      </div>
      <div>
        <Label className="text-xs">Subtitle</Label>
        <Input value={d.subtitle ?? ""} onChange={(e) => update("subtitle", e.target.value)} className="h-8 text-xs mt-1" placeholder="Browse our collection" />
      </div>
      <div>
        <Label className="text-xs">Display Count</Label>
        <Input type="number" value={d.displayCount} onChange={(e) => update("displayCount", Number(e.target.value))} className="h-8 text-xs mt-1" min={1} max={24} />
      </div>
      <div>
        <Label className="text-xs">Categories</Label>
        {categories.length === 0 ? (
          <p className="text-[11px] text-muted-foreground mt-1">No product categories yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={cn(
                    "px-2 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    selected.includes(c.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {selected.length === 0 ? "Showing all categories" : `Filtering to ${selected.length} selected`}
            </p>
          </>
        )}
      </div>
      <div>
        <Label className="text-xs">Sort By</Label>
        <Select value={d.sortBy} onValueChange={(v) => update("sortBy", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="latest" className="text-xs">Latest</SelectItem>
            <SelectItem value="featured" className="text-xs">Featured First</SelectItem>
            <SelectItem value="price_asc" className="text-xs">Price: Low → High</SelectItem>
            <SelectItem value="price_desc" className="text-xs">Price: High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">CTA Button Label</Label>
        <Input value={d.ctaLabel ?? ""} onChange={(e) => update("ctaLabel", e.target.value)} className="h-8 text-xs mt-1" placeholder="View all products" />
      </div>
      <div>
        <Label className="text-xs">CTA Button URL</Label>
        <Input value={d.ctaUrl ?? ""} onChange={(e) => update("ctaUrl", e.target.value)} className="h-8 text-xs mt-1" placeholder="/products" />
      </div>

      <hr className="border-border" />

      {/* ── Layout ── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Layout</p>

      <div>
        <Label className="text-xs">Layout Style</Label>
        <Select value={d.layout} onValueChange={(v) => update("layout", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="grid" className="text-xs">Grid — equal cards</SelectItem>
            <SelectItem value="featured" className="text-xs">Featured — hero + grid</SelectItem>
            <SelectItem value="list" className="text-xs">List — horizontal rows</SelectItem>
            <SelectItem value="wide-cards" className="text-xs">Wide Cards — 2-col horizontal</SelectItem>
            <SelectItem value="minimal" className="text-xs">Minimal — compact list</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(d.layout === "grid" || d.layout === "minimal") && (
        <div>
          <Label className="text-xs">Columns</Label>
          <Select value={String(d.columns ?? 3)} onValueChange={(v) => update("columns", Number(v))}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["2","3","4","5"].map((c) => <SelectItem key={c} value={c} className="text-xs">{c} columns</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-xs">Title Alignment</Label>
        <Select value={d.titleAlignment ?? "center"} onValueChange={(v) => update("titleAlignment", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left" className="text-xs">Left</SelectItem>
            <SelectItem value="center" className="text-xs">Center</SelectItem>
            <SelectItem value="right" className="text-xs">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Section Padding</Label>
        <Select value={d.sectionPadding ?? "md"} onValueChange={(v) => update("sectionPadding", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">None</SelectItem>
            <SelectItem value="sm" className="text-xs">Small</SelectItem>
            <SelectItem value="md" className="text-xs">Medium</SelectItem>
            <SelectItem value="lg" className="text-xs">Large</SelectItem>
            <SelectItem value="xl" className="text-xs">Extra Large</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs">Background Color</Label>
        <div className="flex items-center gap-2 mt-1">
          <ColorPicker value={d.backgroundColor ?? "#ffffff"} onChange={(v) => update("backgroundColor", v)} className="flex-1" />
          {d.backgroundColor && (
            <button onClick={() => update("backgroundColor", undefined)} className="text-xs text-muted-foreground hover:text-foreground shrink-0">Clear</button>
          )}
        </div>
      </div>

      <hr className="border-border" />

      {/* ── Card Design ── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Card Design</p>

      <div>
        <Label className="text-xs">Card Style</Label>
        <Select value={d.cardStyle ?? "default"} onValueChange={(v) => update("cardStyle", v)}>
          <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default" className="text-xs">Default — border + hover shadow</SelectItem>
            <SelectItem value="flat" className="text-xs">Flat — subtle fill</SelectItem>
            <SelectItem value="shadow" className="text-xs">Shadow — elevated</SelectItem>
            <SelectItem value="bordered" className="text-xs">Bordered — accent on hover</SelectItem>
            <SelectItem value="minimal" className="text-xs">Minimal — no border</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {d.layout === "grid" && (
        <div>
          <Label className="text-xs">Image Ratio</Label>
          <Select value={d.imageRatio ?? "square"} onValueChange={(v) => update("imageRatio", v)}>
            <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="square" className="text-xs">Square (1:1)</SelectItem>
              <SelectItem value="portrait" className="text-xs">Portrait (3:4)</SelectItem>
              <SelectItem value="landscape" className="text-xs">Landscape (16:9)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <hr className="border-border" />

      {/* ── Options ── */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Options</p>

      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Add to Cart</Label>
        <Switch checked={d.showAddToCart !== false} onCheckedChange={(v) => update("showAddToCart", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Description</Label>
        <Switch checked={d.showDescription !== false} onCheckedChange={(v) => update("showDescription", v)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show Sale Badges</Label>
        <Switch checked={d.showBadges !== false} onCheckedChange={(v) => update("showBadges", v)} />
      </div>
    </div>
  );
}
