"use client";

import React, { useState } from "react";
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
 * Shown when the page is empty. Lets non-technical users start from a
 * complete, pre-written page instead of a blank canvas.
 */
export function TemplatePicker() {
  const { setBlocks, selectBlock } = useBuilderStore();
  const [activeCategory, setActiveCategory] = useState("All");

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
      <p className="text-muted-foreground text-sm max-w-md text-center mb-6">
        Each template is a complete industry website — real images, real copy, real structure. Just customise the details.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-muted-foreground border-border hover:border-blue-400"
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
              className="group flex flex-col rounded-xl border-2 border-border bg-white text-left transition-all hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
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
