"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { ReCommunitiesBlockProps } from "@/types/cms";
import { formatMoney } from "@/lib/real-estate/format";
import { SectionHeading } from "./shared";

interface Community { id: string; name: string; slug: string; city: string | null; country: string | null; image_url: string | null; summary: string | null; avg_price: number | null; currency: string | null; rental_yield: number | null; listings: number }

/** Area-guide grid: image tiles linking to /communities/[slug]. First tile
 *  spans two columns on desktop for an editorial layout. */
export function ReCommunitiesBlock({ block }: { block: ReCommunitiesBlockProps }) {
  const { data } = block;
  const [items, setItems] = useState<Community[] | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ resource: "communities" });
    if (data.featuredOnly) qs.set("featured", "1");
    if (data.country) qs.set("country", data.country);
    fetch(`/api/real-estate/public?${qs}`).then((r) => r.json()).then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => setItems([]));
  }, [data.featuredOnly, data.country]);

  const list = (items ?? []).slice(0, data.limit ?? 6);

  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        {items === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : list.length === 0 ? (
          <p className="text-center text-muted-foreground">Area guides coming soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c, i) => (
              <a key={c.id} href={`/communities/${c.slug}`}
                className={`group relative overflow-hidden rounded-2xl min-h-72 flex items-end text-white ${i === 0 && list.length > 2 ? "lg:col-span-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.image_url && <img src={c.image_url} alt={c.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative p-6 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-widest text-white/75">{[c.city, c.country].filter(Boolean).join(" · ")}</p>
                    <ArrowUpRight className="w-5 h-5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <h3 className="text-2xl font-bold mt-1">{c.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {c.listings > 0 && <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur">{c.listings} listing{c.listings === 1 ? "" : "s"}</span>}
                    {c.avg_price != null && <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur">Avg {formatMoney(Number(c.avg_price), c.currency ?? "SAR", true)}</span>}
                    {c.rental_yield != null && <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur flex items-center gap-1"><TrendingUp className="w-3 h-3" />{c.rental_yield}% yield</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
