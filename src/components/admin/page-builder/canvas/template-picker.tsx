"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { pageTemplates } from "@/modules/page-builder/page-templates";
import { useBuilderStore } from "@/lib/store/builder";

type TemplatePreviewMap = Record<string, { image: string; category: string }>;

const TEMPLATE_META: TemplatePreviewMap = {
  "local-service": {
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=75&fit=crop",
    category: "Services",
  },
  "restaurant-cafe": {
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=75&fit=crop",
    category: "Food & Drink",
  },
  "salon-spa": {
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=75&fit=crop",
    category: "Beauty",
  },
  "product-landing": {
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=75&fit=crop",
    category: "Sales",
  },
  "about-contact": {
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75&fit=crop",
    category: "General",
  },
  "blank": {
    image: "",
    category: "Custom",
  },
  "real-estate": {
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75&fit=crop",
    category: "Real Estate",
  },
  "photography-studio": {
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=75&fit=crop",
    category: "Creative",
  },
  "medical-dental": {
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=75&fit=crop",
    category: "Medical",
  },
  "coffee-shop": {
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=75&fit=crop",
    category: "Food & Drink",
  },
  "wedding-planner": {
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=75&fit=crop",
    category: "Events",
  },
  "fashion-boutique": {
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=75&fit=crop",
    category: "Retail",
  },
};

const ALL_CATEGORIES = ["All", ...Array.from(new Set(Object.values(TEMPLATE_META).map((m) => m.category))).sort()];

/**
 * Maps a DB site-template category (free text, ~18 values across the
 * template catalog — "Renovation & Construction", "HVAC & Plumbing", …) onto
 * this picker's own category vocabulary (12 values covering page-content
 * shape, not industry — "Services", "Food & Drink", …).
 *
 * The two vocabularies exist for different reasons and don't share strings —
 * matching by exact equality would silently match nothing for almost every
 * tenant. This is deliberately a lookup table, not a heuristic (fuzzy
 * matching "Renovation & Construction" against "Services" is exactly the kind
 * of thing that quietly breaks when either catalog grows), so a new DB
 * category needs one line added here or it falls through to "All" rather
 * than mis-filtering.
 */
const SITE_CATEGORY_TO_PAGE_CATEGORY: Record<string, string> = {
  "Renovation & Construction": "Services",
  "HVAC & Plumbing": "Services",
  "Cleaning": "Services",
  "Automotive": "Services",
  "General Business": "General",
  "Legal & Finance": "General",
  "Tech & Agency": "General",
  "Restaurant & Cafe": "Food & Drink",
  "Health & Beauty": "Beauty",
  "Fitness & Sports": "Beauty",
  "Real Estate": "Real Estate",
  "Interior Design": "Real Estate",
  "Photography": "Creative",
  "Fashion & Retail": "Retail",
  "Retail & Shop": "Retail",
  "Events": "Events",
  "Travel & Tourism": "Events",
  "Education": "General",
  "Marketplace": "Sales",
};

/** Resolves the tenant's site category to a page-template category once,
 *  client-side — no store plumbing needed for a value used in exactly one
 *  place. Returns null while loading or when there's no mapped category, so
 *  callers fall back to "All" rather than filtering on a guess. */
function useDefaultPageCategory(tenantId: string | undefined): string | null {
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    fetch(`/api/tenant/template-category?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data: { category: string | null }) => {
        if (cancelled) return;
        const mapped = data.category ? SITE_CATEGORY_TO_PAGE_CATEGORY[data.category] : null;
        setCategory(mapped ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tenantId]);

  return category;
}

/**
 * Shown when the page is empty. Lets non-technical users start from a
 * complete, pre-written page instead of a blank canvas.
 */
export function TemplatePicker() {
  const { setBlocks, selectBlock, tenantId } = useBuilderStore();
  const defaultCategory = useDefaultPageCategory(tenantId);
  const [activeCategory, setActiveCategory] = useState("All");
  // Tracks whether the default has been applied yet, so it can be applied
  // exactly once (the fetch resolves after mount) without fighting a user who
  // has already picked a different category by the time it arrives.
  const [defaultApplied, setDefaultApplied] = useState(false);

  React.useEffect(() => {
    if (defaultApplied || !defaultCategory) return;
    setActiveCategory(defaultCategory);
    setDefaultApplied(true);
  }, [defaultCategory, defaultApplied]);

  const applyTemplate = (id: string) => {
    const template = pageTemplates.find((t) => t.id === id);
    if (!template) return;
    const blocks = template.create();
    setBlocks(blocks);
    selectBlock(undefined);
  };

  const visible = pageTemplates.filter((t) => {
    if (activeCategory === "All") return true;
    return TEMPLATE_META[t.id]?.category === activeCategory;
  });

  return (
    <div className="flex flex-col items-center min-h-[600px] p-6 py-10">
      <h3 className="font-bold text-2xl mb-1">Choose a Starting Template</h3>
      <p className="text-muted-foreground text-sm max-w-md text-center mb-1">
        Each template is a complete industry website — real images, real copy, real structure. Just customise the details.
      </p>
      {defaultApplied && activeCategory === defaultCategory && (
        <p className="text-xs text-primary mb-5">
          Showing templates matching your site — pick &quot;All&quot; below to browse every category.
        </p>
      )}
      {!(defaultApplied && activeCategory === defaultCategory) && <div className="mb-6" />}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-card text-muted-foreground border-border hover:border-blue-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 w-full max-w-5xl">
        {visible.map((t) => {
          const meta = TEMPLATE_META[t.id];
          const hasImage = meta?.image;
          return (
            <button
              key={t.id}
              onClick={() => applyTemplate(t.id)}
              className="group flex flex-col rounded-xl border-2 border-border bg-card text-left transition-all hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
            >
              {/* Preview image */}
              {hasImage ? (
                <div className="relative w-full aspect-video bg-muted overflow-hidden">
                  <Image
                    src={meta.image}
                    alt={t.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {meta.category}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <span className="text-5xl opacity-40">{t.icon}</span>
                </div>
              )}

              {/* Info row */}
              <div className="flex flex-col gap-1.5 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-bold text-sm">{t.name}</span>
                </div>
                <span className="text-xs text-muted-foreground leading-snug">{t.tagline}</span>
                {t.sections.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/60 leading-snug mt-0.5">
                    {t.sections.join(" · ")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
