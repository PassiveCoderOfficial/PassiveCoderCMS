"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Quote } from "lucide-react";
import type { ResultsAlumniBlockProps } from "@/types/cms";

interface Alum { id: string; name: string; photo: string | null; course: string | null; position: string | null; location: string | null; quote: string | null }

/** Alumni showcase: students the admin featured in Dashboard → Results
 *  (Alumni showcase section). Portrait cards with course, where they work
 *  and an optional quote. */
export function ResultsAlumniBlock({ block }: { block: ResultsAlumniBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "hsl(var(--primary))";
  const [items, setItems] = useState<Alum[] | null>(null);

  useEffect(() => {
    fetch(`/api/results/alumni-public?limit=${data.limit || 12}`).then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [data.limit]);

  const cols = { 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[data.columns ?? 4];

  return (
    <section className="px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {(data.title || data.subtitle || data.eyebrow) && (
          <div className="text-center max-w-2xl mx-auto mb-12">
            {data.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: accent }}>{data.eyebrow}</p>}
            {data.title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h2>}
            {data.subtitle && <p className="mt-3 text-muted-foreground">{data.subtitle}</p>}
          </div>
        )}
        {items === null ? (
          <div className={`grid gap-6 grid-cols-1 ${cols}`}>{[0, 1, 2, 3].map((i) => <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <p className="text-center text-muted-foreground">Feature students in Dashboard → Results to show them here.</p>
        ) : (
          <div className={`grid gap-6 grid-cols-1 ${cols}`}>
            {items.map((a) => (
              <figure key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden text-card-foreground flex flex-col">
                <div className="aspect-[4/5] bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {a.photo && <img src={a.photo} alt={a.name} className="w-full h-full object-cover object-top" />}
                </div>
                <figcaption className="p-5 flex-1 flex flex-col">
                  <p className="font-semibold text-lg leading-tight">{a.name}</p>
                  {a.position && <p className="text-sm font-medium mt-1" style={{ color: accent }}>{a.position}</p>}
                  {a.location && <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{a.location}</p>}
                  {a.course && <p className="text-xs text-muted-foreground mt-2">{a.course}</p>}
                  {a.quote && <blockquote className="mt-3 text-sm text-muted-foreground italic flex gap-2"><Quote className="w-4 h-4 shrink-0 opacity-50" />{a.quote}</blockquote>}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
