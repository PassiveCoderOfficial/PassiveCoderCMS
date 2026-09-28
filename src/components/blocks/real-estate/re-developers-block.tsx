"use client";

import React, { useEffect, useState } from "react";
import type { ReDevelopersBlockProps } from "@/types/cms";
import { SectionHeading } from "./shared";

interface Developer { id: string; name: string; slug: string; logo_url: string | null; description: string | null }

/** Developer partners: a logo wall, or cards linking to each developer's
 *  projects (the listings page filtered by developer). */
export function ReDevelopersBlock({ block }: { block: ReDevelopersBlockProps }) {
  const { data } = block;
  const [items, setItems] = useState<Developer[]>([]);

  useEffect(() => {
    fetch("/api/real-estate/public?resource=developers").then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  if (!items.length) return null;

  const mark = (d: Developer) => d.logo_url
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={d.logo_url} alt={d.name} className="max-h-10 max-w-[140px] object-contain" />
    : <span className="text-lg font-bold tracking-tight">{d.name}</span>;

  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        {data.style === "cards" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((d) => (
              <a key={d.id} href={`/properties?developer=${d.slug}`} className="group bg-card border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="h-12 flex items-center">{mark(d)}</div>
                {d.description && <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{d.description}</p>}
                <p className="mt-4 text-sm font-medium text-primary">View projects →</p>
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {items.map((d) => (
              <a key={d.id} href={`/properties?developer=${d.slug}`}
                className="h-20 min-w-[160px] px-6 flex items-center justify-center rounded-2xl border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                {mark(d)}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
