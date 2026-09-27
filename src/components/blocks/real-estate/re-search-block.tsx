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
  const steps = (tab === "rent" ? data.rentPriceSteps : data.salePriceSteps)?.filter((n) => n > 0);
  const priceSteps = steps?.length ? steps : PRICE_STEPS[tab];
  const money = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(2)}M` : `${Math.round(n / 1000)}K`);

  // Split layout: agent portrait on one side, search card on the other,
  // over a charcoal backdrop matched to studio-portrait greys so the photo's
  // edges fade in instead of sitting in a box.
  if (data.portraitImage) {
    const left = data.portraitSide !== "right";
    const bg = data.backdropColor || "#1b1c20";
    const glow = data.glowColor || "#4b4f57";
    const field = "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&>option]:text-black";
    return (
      <section className="relative isolate overflow-hidden text-white" style={{ background: bg }}>
        <div className="absolute inset-0 -z-10" style={{ background: `radial-gradient(ellipse 55% 75% at ${left ? "30%" : "70%"} 70%, ${glow} 0%, ${bg} 70%)` }} />
        <div className="max-w-4xl mx-auto px-4 pt-16 lg:pt-20 pb-8 lg:pb-4 text-center">
            {data.eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-white/60 mb-4">{data.eyebrow}</p>}
            {data.title && <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">{data.title}</h1>}
            {data.subtitle && <p className="mt-5 text-lg text-white/75 max-w-2xl mx-auto">{data.subtitle}</p>}
        </div>
        <div className={`max-w-7xl mx-auto grid lg:grid-cols-2 items-end gap-6 lg:gap-10 px-4 ${left ? "" : "lg:[&>*:first-child]:order-2"}`}>
          <div className="relative h-[440px] sm:h-[520px] lg:h-[560px] order-2 lg:order-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.portraitImage} alt={data.portraitAlt ?? ""}
              className={`absolute bottom-0 h-full w-auto max-w-none object-contain object-bottom ${left ? "left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0" : "left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0"}`}
              style={{
                WebkitMaskImage: `linear-gradient(to right, transparent 0%, #000 22%, #000 70%, transparent 98%), linear-gradient(to top, transparent 0%, #000 16%, #000 86%, transparent 100%)`,
                WebkitMaskComposite: "source-in", maskImage: `linear-gradient(to right, transparent 0%, #000 22%, #000 70%, transparent 98%), linear-gradient(to top, transparent 0%, #000 16%, #000 86%, transparent 100%)`, maskComposite: "intersect",
              }} />
            {data.portraitCaption && (
              <div className={`absolute bottom-8 ${left ? "left-4" : "right-4"} px-4 py-2.5 rounded-2xl bg-black/40 backdrop-blur border border-white/10`}>
                <p className="font-semibold text-sm">{data.portraitCaption}</p>
                {data.portraitSubcaption && <p className="text-xs text-white/70">{data.portraitSubcaption}</p>}
              </div>
            )}
          </div>

          <div className="pb-10 lg:pb-16 self-center">

            <form onSubmit={go} className="rounded-3xl border border-white/10 bg-white/[0.07] backdrop-blur-xl p-5 sm:p-7 shadow-2xl max-w-xl w-full mx-auto lg:mx-0">
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/30 mb-4">
                {tabs.map((t) => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`h-10 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-white text-black" : "text-white/75 hover:text-white"}`}>
                    {tabLabel(t)}
                  </button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="sm:col-span-2 block">
                  <span className="text-[11px] uppercase tracking-wide text-white/55">Location</span>
                  <select className={`${field} mt-1`} value={f.community} onChange={(e) => setF({ ...f, community: e.target.value })}>
                    <option value="">All locations</option>
                    {meta.communities.map((c) => <option key={c.slug} value={c.slug}>{c.name}{c.city ? `, ${c.city}` : ""}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide text-white/55">Property type</span>
                  <select className={`${field} mt-1`} value={f.ptype} onChange={(e) => setF({ ...f, ptype: e.target.value })}>
                    <option value="">Any type</option>
                    {meta.propertyTypes.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-wide text-white/55">Bedrooms</span>
                  <select className={`${field} mt-1`} value={f.beds} onChange={(e) => setF({ ...f, beds: e.target.value })}>
                    <option value="">Any</option>
                    <option value="0">Studio+</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}
                  </select>
                </label>
                <label className="sm:col-span-2 block">
                  <span className="text-[11px] uppercase tracking-wide text-white/55">Max budget</span>
                  <select className={`${field} mt-1`} value={f.maxPrice} onChange={(e) => setF({ ...f, maxPrice: e.target.value })}>
                    <option value="">No limit</option>
                    {priceSteps.map((n) => <option key={n} value={n}>Up to {money(n)}</option>)}
                  </select>
                </label>
              </div>
              <button type="submit" className="mt-5 h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                <Search className="w-4 h-4" /> Search properties
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

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
              {priceSteps.map((n) => <option key={n} value={n}>{money(n)}</option>)}
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
