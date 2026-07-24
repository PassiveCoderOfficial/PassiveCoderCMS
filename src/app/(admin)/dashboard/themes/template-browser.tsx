"use client";

import { useMemo, useState } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateApplyButton } from "./template-apply-button";
import type { TEMPLATE_REGISTRY } from "@/modules/themes/template-registry";

type Template = (typeof TEMPLATE_REGISTRY)[number];

export function TemplateBrowser({
  templates,
  activeTemplateSlug,
  tenantId,
}: {
  templates: Template[];
  activeTemplateSlug: string | null;
  tenantId: string;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((t) => t.category))).sort()],
    [templates],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchCat = category === "All" || t.category === category;
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [templates, search, category]);

  const byCategory = useMemo(() => {
    const grouped: Record<string, Template[]> = {};
    for (const t of filtered) {
      (grouped[t.category] ??= []).push(t);
    }
    return grouped;
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="border rounded-lg px-3 py-2 text-sm bg-background flex-1"
          placeholder="Search by industry, style or feature…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                category === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No templates found for &quot;{search}&quot;
        </div>
      )}

      {Object.entries(byCategory).map(([cat, catTemplates]) => (
        <div key={cat}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {catTemplates.map((template) => {
              const isActive = template.slug === activeTemplateSlug;
              return (
                <div
                  key={template.slug}
                  className={cn(
                    "rounded-xl border overflow-hidden bg-card hover:shadow-lg transition-all duration-200",
                    isActive && "ring-2 ring-primary",
                  )}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle className="h-3 w-3" /> Active
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {[template.palette.primary, template.palette.secondary, template.palette.accent, template.palette.background].map(
                        (color, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-white/40 shadow-sm" style={{ background: color }} />
                        ),
                      )}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                      {template.typography.headingFont}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base">{template.name}</h3>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[9px] text-muted-foreground">
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.hero}>
                        Hero: {template.variants.hero.split("-")[0]}
                      </div>
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.services}>
                        Services: {template.variants.services.split("-")[0]}
                      </div>
                      <div className="bg-muted/50 rounded px-1.5 py-1 text-center truncate" title={template.variants.testimonials}>
                        Reviews: {template.variants.testimonials.split("-")[0]}
                      </div>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {template.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href={`/templates/${template.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      Preview full demo
                    </a>

                    <TemplateApplyButton
                      templateSlug={template.slug}
                      templateName={template.name}
                      isActive={isActive}
                      tenantId={tenantId}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
