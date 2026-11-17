"use client";

import React, { useState } from "react";
import type { ServicesBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ServicesBody } from "./services-block";

/** "All / Ongoing / Completed"-style tabs over any services layout. */
export function ServicesFilterTabs({ data, variant, cats }: { data: ServicesBlockProps["data"]; variant?: string; cats: string[] }) {
  const [cat, setCat] = useState("");
  const shown = cat ? { ...data, items: data.items.filter((i) => i.category?.trim() === cat) } : data;
  return (
    <>
      <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist">
        {["", ...cats].map((c) => (
          <button key={c || "all"} type="button" role="tab" aria-selected={cat === c} onClick={() => setCat(c)}
            className={cn("rounded-full px-4 py-1.5 text-sm font-medium border transition-colors", cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border")}>
            {c || data.filterAllLabel || "All"}
          </button>
        ))}
      </div>
      <ServicesBody key={cat} data={shown} variant={variant} />
    </>
  );
}
