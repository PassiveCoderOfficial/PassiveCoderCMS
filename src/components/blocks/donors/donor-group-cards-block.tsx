"use client";

import React, { useEffect, useState } from "react";
import type { DonorGroupCardsBlockProps } from "@/types/cms";
import { BLOOD_GROUPS } from "@/lib/donors/bd-locations";
import { Droplet } from "lucide-react";

export function DonorGroupCardsBlock({ block }: { block: DonorGroupCardsBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#dc2626";
  const target = data.linkTarget || "#donor-list";
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/donors/meta?what=stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setCounts(d.counts ?? {}))
      .catch(() => null);
  }, []);

  function pick(group: string) {
    // Set the filter for a donor_list block on the same page, then scroll
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("donor-filter", { detail: { blood_group: group } }));
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-8">
          {data.title && <h2 className="text-3xl font-bold mb-2">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {BLOOD_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => pick(g)}
            className="group relative flex flex-col items-center justify-center rounded-2xl py-6 text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{ backgroundColor: accent }}
          >
            <Droplet className="w-6 h-6 mb-2 text-white/90 transition-transform group-hover:scale-110" fill="currentColor" />
            <span className="text-2xl font-extrabold text-white">{g}</span>
            <span className="text-xs text-white/80 mt-1">
              {counts[g] ?? "—"} donor{(counts[g] ?? 0) === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
