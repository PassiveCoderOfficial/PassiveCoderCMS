"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, Map as MapIcon, SlidersHorizontal, Building2, Loader2 } from "lucide-react";
import type { ReListingsBlockProps } from "@/types/cms";
import { titleCase, priceLabel, type ReListingType } from "@/lib/real-estate/format";
import { GenericMap, type MapPin } from "@/components/map/generic-map";
import { PropertyCard, CardSkeleton, PrefsToggle, useDisplayPrefs, SectionHeading, type ReCardProperty } from "./shared";

type Item = ReCardProperty & { lat: number | null; lng: number | null };
interface Meta { communities: { name: string; slug: string }[]; developers: { name: string; slug: string }[]; propertyTypes: string[]; settings?: { default_currency?: string; default_area_unit?: "sqm" | "sqft" } | null }

const FILTER_KEYS = ["type", "community", "developer", "ptype", "beds", "minPrice", "maxPrice", "sort", "q"] as const;
type Filters = Partial<Record<typeof FILTER_KEYS[number], string>>;

/** Listing grid with URL-synced filters, currency/unit switch, list/map
 *  views and "load more". Block data acts as a preset (e.g. an Off-plan page
 *  locks type=offplan and hides the type tabs). */
export function ReListingsBlock({ block }: { block: ReListingsBlockProps }) {
  const { data } = block;
  const limit = data.limit ?? 9;
  const cols = data.columns ?? 3;
  const locked: Filters = useMemo(() => ({
    ...(data.listingType ? { type: data.listingType } : {}),
    ...(data.communitySlug ? { community: data.communitySlug } : {}),
    ...(data.developerSlug ? { developer: data.developerSlug } : {}),
  }), [data.listingType, data.communitySlug, data.developerSlug]);

  const [filters, setFilters] = useState<Filters>({});
  const [ready, setReady] = useState(!data.syncUrl);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [meta, setMeta] = useState<Meta>({ communities: [], developers: [], propertyTypes: [] });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const prefs = useDisplayPrefs();

  useEffect(() => {
    if (data.syncUrl) {
      const sp = new URLSearchParams(window.location.search);
      const f: Filters = {};
      for (const k of FILTER_KEYS) { const v = sp.get(k); if (v) f[k] = v; }
      setFilters(f);
      setReady(true);
    }
    if (data.showFilters !== false) {
      fetch("/api/real-estate/public?resource=meta").then((r) => r.json()).then(setMeta).catch(() => {});
    }
  }, [data.syncUrl, data.showFilters]);

  const effective = useMemo(() => ({ ...filters, ...locked }), [filters, locked]);

  const load = useCallback(async (pageNo: number, append: boolean) => {
    setLoading(true);
    const qs = new URLSearchParams({ limit: String(limit), page: String(pageNo) });
    for (const [k, v] of Object.entries(effective)) if (v) qs.set(k, v);
    if (data.featuredOnly) qs.set("featured", "1");
    try {
      const d = await fetch(`/api/real-estate/public?${qs}`).then((r) => r.json());
      setItems((prev) => (append ? [...prev, ...(d.items ?? [])] : d.items ?? []));
      setTotal(d.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [effective, limit, data.featuredOnly]);

  useEffect(() => { if (ready) { setPage(1); load(1, false); } }, [ready, load]);

  const update = (patch: Filters) => {
    const next = { ...filters, ...patch };
    for (const k of Object.keys(next) as (keyof Filters)[]) if (!next[k]) delete next[k];
    setFilters(next);
    if (data.syncUrl) {
      const qs = new URLSearchParams(next as Record<string, string>).toString();
      window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  };

  const showTypeTabs = data.showFilters !== false && !data.listingType;
  const sel = "h-10 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const gridCols = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  const pins: MapPin[] = items.filter((p) => p.lat != null && p.lng != null).map((p) => ({
    id: p.id, lat: p.lat!, lng: p.lng!, label: priceLabel(p, prefs.currency),
    render: () => (
      <a href={`/properties/${p.slug}`} className="block w-56 text-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-full h-28 object-cover rounded mb-2" />}
        <p className="font-bold text-sm">{priceLabel(p, prefs.currency)}</p>
        <p className="text-xs">{p.title}</p>
      </a>
    ),
  }));

  return (
    <section className="px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading title={data.title} subtitle={data.subtitle} />

        {data.showFilters !== false && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {showTypeTabs ? (
                <div className="inline-flex rounded-full border bg-card p-1">
                  {([["", "All"], ["sale", "Buy"], ["rent", "Rent"], ["offplan", "Off-Plan"]] as [ReListingType | "", string][]).map(([v, l]) => (
                    <button key={l} type="button" onClick={() => update({ type: v })}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${(filters.type ?? "") === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
                  ))}
                </div>
              ) : <span />}
              <div className="flex items-center gap-2">
                <PrefsToggle prefs={prefs} />
                <button type="button" onClick={() => setShowMobileFilters((s) => !s)} className="md:hidden h-9 px-3 rounded-full border bg-card text-sm flex items-center gap-1.5"><SlidersHorizontal className="w-4 h-4" />Filters</button>
              </div>
            </div>
            <div className={`${showMobileFilters ? "grid" : "hidden"} md:grid grid-cols-2 md:grid-cols-6 gap-2 p-3 bg-card border rounded-2xl`}>
              {!data.communitySlug && (
                <select className={sel} value={filters.community ?? ""} onChange={(e) => update({ community: e.target.value })} aria-label="Location">
                  <option value="">All locations</option>
                  {meta.communities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              )}
              <select className={sel} value={filters.ptype ?? ""} onChange={(e) => update({ ptype: e.target.value })} aria-label="Type">
                <option value="">Any type</option>
                {meta.propertyTypes.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
              </select>
              <select className={sel} value={filters.beds ?? ""} onChange={(e) => update({ beds: e.target.value })} aria-label="Beds">
                <option value="">Any beds</option>
                <option value="0">Studio+</option>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
              </select>
              <input className={sel} inputMode="numeric" placeholder="Min price" value={filters.minPrice ?? ""} onChange={(e) => update({ minPrice: e.target.value.replace(/\D/g, "") })} />
              <input className={sel} inputMode="numeric" placeholder="Max price" value={filters.maxPrice ?? ""} onChange={(e) => update({ maxPrice: e.target.value.replace(/\D/g, "") })} />
              <select className={sel} value={filters.sort ?? ""} onChange={(e) => update({ sort: e.target.value })} aria-label="Sort">
                <option value="">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{loading && !items.length ? "Loading…" : `${total} ${total === 1 ? "property" : "properties"}`}</span>
              <div className="inline-flex rounded-full border bg-card p-0.5">
                <button type="button" onClick={() => setView("grid")} className={`px-3 py-1 rounded-full flex items-center gap-1 ${view === "grid" ? "bg-muted text-foreground" : ""}`}><LayoutGrid className="w-3.5 h-3.5" />Grid</button>
                <button type="button" onClick={() => setView("map")} className={`px-3 py-1 rounded-full flex items-center gap-1 ${view === "map" ? "bg-muted text-foreground" : ""}`}><MapIcon className="w-3.5 h-3.5" />Map</button>
              </div>
            </div>
          </div>
        )}

        {view === "map" && pins.length > 0 ? (
          <div className="rounded-2xl overflow-hidden border"><GenericMap pins={pins} height={560} defaultCenter={{ lat: pins[0].lat, lng: pins[0].lng }} defaultZoom={10} /></div>
        ) : loading && !items.length ? (
          <div className={`grid gap-6 ${gridCols}`}>{Array.from({ length: Math.min(limit, 6) }).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-muted/40 rounded-2xl">
            <Building2 className="w-9 h-9 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium">No properties match these filters</p>
            <p className="text-sm text-muted-foreground mt-1">Try widening your search, or message us — many deals never reach the public market.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {items.map((p) => <PropertyCard key={p.id} p={p} currency={prefs.currency} unit={prefs.unit} />)}
          </div>
        )}

        <div className="mt-10 flex justify-center gap-3">
          {view === "grid" && data.showFilters !== false && items.length < total && (
            <button type="button" disabled={loading} onClick={() => { const n = page + 1; setPage(n); load(n, true); }}
              className="h-11 px-6 rounded-full border bg-card font-medium hover:bg-muted transition-colors flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Load more
            </button>
          )}
          {data.viewAllUrl && (
            <a href={data.viewAllUrl} className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:opacity-90">
              View all properties <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
