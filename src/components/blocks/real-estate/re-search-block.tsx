"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { ReSearchBlockProps } from "@/types/cms";
import { LISTING_TYPE_LABEL, titleCase, type ReListingType } from "@/lib/real-estate/format";

interface Meta { communities: { name: string; slug: string; city: string | null }[]; propertyTypes: string[] }

const PRICE_STEPS: Record<ReListingType, number[]> = {
  sale: [1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000],
  offplan: [1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000],
  rent: [50_000, 100_000, 150_000, 250_000, 500_000],
};

/** Hero search: Buy / Rent / Off-plan tabs + location, type, beds, budget.
 *  Submits to the listings page with the same query params the listings
 *  block reads, so results are shareable URLs. */
export function ReSearchBlock({ block }: { block: ReSearchBlockProps }) {
  const { data } = block;
  const tabs = data.tabs?.length ? data.tabs : (["sale", "rent", "offplan"] as ReListingType[]);
  const [tab, setTab] = useState<ReListingType>(tabs[0]);
  const [meta, setMeta] = useState<Meta>({ communities: [], propertyTypes: [] });
  const [f, setF] = useState({ community: "", ptype: "", beds: "", maxPrice: "" });

  useEffect(() => {
    fetch("/api/real-estate/public?resource=meta").then((r) => r.json()).then((d) => setMeta({ communities: d.communities ?? [], propertyTypes: d.propertyTypes ?? [] })).catch(() => {});
  }, []);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams({ type: tab });
    for (const [k, v] of Object.entries(f)) if (v) qs.set(k, v);
    window.location.href = `${data.resultsPath || "/properties"}?${qs}`;
  };

  const sel = "h-12 w-full rounded-xl border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";
  const tabLabel = (t: ReListingType) => (t === "sale" ? "Buy" : t === "rent" ? "Rent" : LISTING_TYPE_LABEL[t]);

  return (
    <section className="relative isolate px-4 py-24 sm:py-32 overflow-hidden">
      {data.backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.backgroundImage} alt="" className="absolute inset-0 -z-20 w-full h-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </>
      )}
      <div className={`max-w-5xl mx-auto text-center ${data.backgroundImage ? "text-white" : ""}`}>
        {data.title && <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">{data.title}</h1>}
        {data.subtitle && <p className={`mt-5 text-lg max-w-2xl mx-auto ${data.backgroundImage ? "text-white/85" : "text-muted-foreground"}`}>{data.subtitle}</p>}

        <form onSubmit={go} className="mt-10 text-left">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors ${tab === t ? "bg-card text-foreground" : "bg-black/30 text-white/85 hover:bg-black/40 backdrop-blur"}`}>
                {tabLabel(t)}
              </button>
            ))}
          </div>
          <div className="bg-card text-foreground rounded-b-2xl rounded-tr-2xl shadow-2xl p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_1fr_auto]">
            <select className={sel} value={f.community} onChange={(e) => setF({ ...f, community: e.target.value })} aria-label="Location">
              <option value="">All locations</option>
              {meta.communities.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.city ? `, ${c.city}` : ""}</option>)}
            </select>
            <select className={sel} value={f.ptype} onChange={(e) => setF({ ...f, ptype: e.target.value })} aria-label="Property type">
              <option value="">Any type</option>
              {meta.propertyTypes.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </select>
            <select className={sel} value={f.beds} onChange={(e) => setF({ ...f, beds: e.target.value })} aria-label="Bedrooms">
              <option value="">Beds</option>
              <option value="0">Studio+</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
            <select className={sel} value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })} aria-label="Max price">
              <option value="">Max price</option>
              {PRICE_STEPS[tab].map((n) => <option key={n} value={n}>{n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1000}K`}</option>)}
            </select>
            <button type="submit" className="h-12 px-7 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity sm:col-span-2 lg:col-span-1">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
