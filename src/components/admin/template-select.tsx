"use client";

import { useState } from "react";
import { CheckCircle, Layout, Sparkles } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates/templates-data";

export interface TemplateSelectValue {
  templateId: string;
  templateMode: "theme" | "full";
}

/**
 * Compact template picker for site-creation forms outside the full onboarding
 * wizard (SA "New Site", agent "New Site"). Same catalog + blank option as
 * onboarding Step5, just without the wizard chrome.
 */
export function TemplateSelect({ value, onChange, dark }: {
  value: TemplateSelectValue;
  onChange: (v: TemplateSelectValue) => void;
  dark?: boolean;
}) {
  const [category, setCategory] = useState("All");
  const filtered = category === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === category);

  const cardBase = dark
    ? "border-gray-700 hover:border-gray-600"
    : "border-border hover:border-muted-foreground/30";
  const cardSelected = "border-primary shadow-md shadow-primary/20";
  const labelMuted = dark ? "text-gray-500" : "text-muted-foreground";

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 flex-wrap">
        {["All", ...TEMPLATE_CATEGORIES.filter(c => c !== "All").slice(0, 8)].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap border ${
              category === cat
                ? "bg-primary text-primary-foreground border-primary"
                : `border-border ${labelMuted} hover:border-primary/40`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {category === "All" && (
          <div
            onClick={() => onChange({ templateId: "blank", templateMode: "full" })}
            className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
              value.templateId === "blank" ? cardSelected : cardBase
            }`}
          >
            <div className={`h-20 flex items-center justify-center ${dark ? "bg-gray-800" : "bg-muted"}`}>
              {value.templateId === "blank"
                ? <CheckCircle className="w-7 h-7 text-primary" />
                : <span className="text-2xl">⬜</span>}
            </div>
            <div className={`p-2 ${dark ? "bg-gray-900" : "bg-card"}`}>
              <p className="text-xs font-bold">Blank Site</p>
              <p className={`text-[10px] ${labelMuted}`}>Start from scratch</p>
            </div>
          </div>
        )}

        {filtered.map(t => {
          const selected = value.templateId === t.slug;
          return (
            <div
              key={t.slug}
              onClick={() => onChange({ templateId: t.slug, templateMode: value.templateMode })}
              className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                selected ? cardSelected : cardBase
              }`}
            >
              <div className="h-20 relative overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/templates/${t.slug}.jpg`}
                  alt={`${t.name} preview`}
                  className="w-full h-full object-cover object-top"
                />
                {selected && (
                  <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-primary drop-shadow-lg" />
                  </div>
                )}
              </div>
              <div className={`p-2 ${dark ? "bg-gray-900" : "bg-card"}`}>
                <p className="text-xs font-bold truncate">{t.name}</p>
                <p className={`text-[10px] truncate ${labelMuted}`}>{t.category}</p>
                {selected && (
                  <div className="mt-1.5 flex gap-1" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onChange({ templateId: t.slug, templateMode: "theme" })}
                      className={`flex-1 flex items-center justify-center gap-0.5 text-[9px] font-semibold py-1 rounded-md border transition-all ${
                        value.templateMode === "theme" ? "bg-primary text-primary-foreground border-primary" : `border-border ${labelMuted}`
                      }`}
                    >
                      <Layout className="w-2.5 h-2.5" /> Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ templateId: t.slug, templateMode: "full" })}
                      className={`flex-1 flex items-center justify-center gap-0.5 text-[9px] font-semibold py-1 rounded-md border transition-all ${
                        value.templateMode === "full" ? "bg-primary text-primary-foreground border-primary" : `border-border ${labelMuted}`
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Full Demo
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
