"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { DonorListBlockProps } from "@/types/cms";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { DonorAvatar } from "@/components/donors/donor-avatar";
import type { MapBounds } from "@/components/donors/donor-map";
import { Droplet, Search, Loader2, Plus, ChevronLeft, ChevronRight, MapPin, List, Map as MapIcon, X, RotateCcw } from "lucide-react";

const DonorsMap = dynamic(() => import("@/components/donors/donor-map").then(m => m.DonorsMap), { ssr: false });

interface DonorRow {
  id: string; name: string; blood_group: string;
  gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: Availability;
  photo_url: string | null; lat: number | null; lng: number | null;
}

interface Filters {
  blood_group: string; district: string; police_station: string;
  area: string; gender: string; religion: string; availability: string; q: string;
}

const EMPTY: Filters = { blood_group: "", district: "", police_station: "", area: "", gender: "", religion: "", availability: "", q: "" };

const FILTER_LABELS: Record<keyof Filters, (v: string) => string> = {
  blood_group: (v) => `Group: ${v}`,
  district: (v) => `District: ${v}`,
  police_station: (v) => `Thana: ${v}`,
  area: (v) => `Location: ${v}`,
  gender: (v) => `Gender: ${v[0].toUpperCase() + v.slice(1)}`,
  religion: (v) => `Religion: ${v[0].toUpperCase() + v.slice(1)}`,
  availability: (v) => `Status: ${AVAILABILITY_META[v as Availability]?.label ?? v}`,
  q: (v) => `Name: "${v}"`,
};

const selectCls = "border rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 min-w-0";

function DaysChip({ donor }: { donor: DonorRow }) {
  const meta = AVAILABILITY_META[donor.availability];
  let label = meta.label;
  if (donor.availability === "unavailable") label = "Unavailable";
  else if (donor.last_donated_on) {
    const days = Math.floor((Date.now() - new Date(donor.last_donated_on + "T00:00:00").getTime()) / 86400_000);
    label = donor.availability === "ready" ? "Ready to donate" : `${days} days ago`;
  }
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: meta.bg, color: meta.text }}>
      {label}
    </span>
  );
}

export function DonorListBlock({ block }: { block: DonorListBlockProps }) {
  const { data } = block;
  const accent = data.accentColor || "#dc2626";
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"map" | "list-only">("map");
  const [radius, setRadius] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: Filters, pg: number, r?: typeof radius, b?: MapBounds | null) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(pg));
    if (r) {
      params.set("lat", String(r.lat));
      params.set("lng", String(r.lng));
      params.set("radius_km", String(r.radiusKm));
    }
    if (b) {
      params.set("sw_lat", String(b.sw_lat)); params.set("sw_lng", String(b.sw_lng));
      params.set("ne_lat", String(b.ne_lat)); params.set("ne_lng", String(b.ne_lng));
    }
    try {
      const res = await fetch(`/api/donors?${params}`);
      if (res.ok) {
        const d = await res.json();
        setDonors(d.donors ?? []); setTotal(d.total ?? 0);
      }
    } catch { /* keep last state */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(EMPTY, 0); }, [load]);

  function onRadiusSearch(v: { lat: number; lng: number; radiusKm: number } | null) {
    setRadius(v);
    setPage(0);
    load(filters, 0, v ?? undefined, bounds);
  }

  // Map pan/zoom acts as one more filter, combined (ANDed) with everything
  // else — it does not reset the dropdowns, and dropdown changes don't
  // clear it either.
  function onMapBoundsChanged(b: MapBounds) {
    setBounds(b);
    setPage(0);
    load(filters, 0, radius, b);
  }

  function clearMapBounds() {
    setBounds(null);
    setPage(0);
    load(filters, 0, radius, null);
  }

  // Blood-group cards elsewhere on the page dispatch this event
  useEffect(() => {
    function onFilter(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<Filters>;
      setFilters(f => {
        const next = { ...f, ...detail };
        setPage(0);
        load(next, 0, radius, bounds);
        return next;
      });
    }
    window.addEventListener("donor-filter", onFilter);
    return () => window.removeEventListener("donor-filter", onFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function set(key: keyof Filters, value: string) {
    setFilters(f => {
      const next = { ...f, [key]: value };
      if (key === "district") next.police_station = "";
      setPage(0);
      if (key === "q" || key === "area") {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => load(next, 0, radius, bounds), 350);
      } else {
        load(next, 0, radius, bounds);
      }
      return next;
    });
  }

  function clearOne(key: keyof Filters) {
    set(key, "");
  }

  function resetAll() {
    setFilters(EMPTY);
    setRadius(null);
    setBounds(null);
    setPage(0);
    load(EMPTY, 0, undefined, null);
  }

  const activeChips = (Object.keys(filters) as (keyof Filters)[]).filter((k) => filters[k]);
  const hasAnyFilter = activeChips.length > 0 || !!radius || !!bounds;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const thanas = filters.district ? BD_LOCATIONS[filters.district] ?? [] : [];

  return (
    <div id="donor-list" className="max-w-5xl mx-auto scroll-mt-24">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-2xl font-bold">
          {data.title || "Donors"} <span className="text-sm font-normal text-muted-foreground">({total})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setView("map")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "map" ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
              <MapIcon className="w-4 h-4" /> Map + List
            </button>
            <button onClick={() => setView("list-only")}
              className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "list-only" ? "bg-red-600 text-white" : "bg-white hover:bg-gray-50"}`}>
              <List className="w-4 h-4" /> List only
            </button>
          </div>
          {data.showAddButton && (
            <Link href="/donors/add"
              className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}>
              <Plus className="w-4 h-4" /> {data.addButtonLabel || "Add Donor"}
            </Link>
          )}
        </div>
      </div>

      {/* Map + filters: on desktop map goes left (wider), filters stack in a
          narrower right column; on mobile everything stacks. In list-only
          view there's no map, so filters go full-width. */}
      <div className={view === "map"
        ? "grid gap-4 mb-5 lg:grid-cols-[1.6fr_1fr] lg:items-stretch"
        : "mb-5"}>
        {view === "map" && (
          <div className="order-2 lg:order-1">
            <DonorsMap
              donors={donors.filter(d => d.lat != null && d.lng != null) as never}
              height={340}
              onRadiusSearch={onRadiusSearch}
              onBoundsChanged={onMapBoundsChanged}
              boundsActive={!!bounds}
              onClearBounds={clearMapBounds}
            />
          </div>
        )}

        {data.showFilters && (
          <div className={`space-y-2 ${view === "map" ? "order-1 lg:order-2 lg:flex lg:flex-col" : ""}`}>
            <div className={view === "map"
              ? "grid grid-cols-2 gap-2 lg:flex-1 lg:content-between"
              : "grid grid-cols-2 sm:grid-cols-4 gap-2"}>
              <select className={selectCls} value={filters.blood_group} onChange={e => set("blood_group", e.target.value)}>
                <option value="">All groups</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className={selectCls} value={filters.district} onChange={e => set("district", e.target.value)}>
                <option value="">All districts</option>
                {BD_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className={selectCls} value={filters.police_station} onChange={e => set("police_station", e.target.value)} disabled={!filters.district}>
                <option value="">{filters.district ? "All thanas" : "Pick district first"}</option>
                {thanas.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className={selectCls} value={filters.availability} onChange={e => set("availability", e.target.value)}>
                <option value="">Any status</option>
                <option value="ready">Ready to donate</option>
                <option value="soon">Almost ready</option>
                <option value="not_ready">Recently donated</option>
                <option value="unknown">Unknown</option>
                <option value="unavailable">Temporarily unavailable</option>
              </select>
              <select className={selectCls} value={filters.gender} onChange={e => set("gender", e.target.value)}>
                <option value="">Any gender</option>
                {GENDERS.map(g => <option key={g} value={g} className="capitalize">{g[0].toUpperCase() + g.slice(1)}</option>)}
              </select>
              <select className={selectCls} value={filters.religion} onChange={e => set("religion", e.target.value)}>
                <option value="">Any religion</option>
                {RELIGIONS.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
              <input className={selectCls} placeholder="Location…" value={filters.area} onChange={e => set("area", e.target.value)} />
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input className={`${selectCls} w-full pl-8`} placeholder="Search name…" value={filters.q} onChange={e => set("q", e.target.value)} />
              </div>
            </div>

            {hasAnyFilter && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeChips.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full pl-2.5 pr-1 py-1 text-xs">
                    {FILTER_LABELS[k](filters[k])}
                    <button onClick={() => clearOne(k)} className="p-0.5 hover:bg-gray-200 rounded-full" aria-label={`Remove ${k} filter`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {radius && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1 py-1 text-xs">
                    Within {radius.radiusKm} km of you
                    <button onClick={() => onRadiusSearch(null)} className="p-0.5 hover:bg-blue-100 rounded-full" aria-label="Remove radius filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {bounds && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full pl-2.5 pr-1 py-1 text-xs">
                    Map view area
                    <button onClick={clearMapBounds} className="p-0.5 hover:bg-blue-100 rounded-full" aria-label="Remove map area filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button onClick={resetAll}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1">
                  <RotateCcw className="w-3 h-3" /> Reset all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded-2xl overflow-hidden bg-white">
        {/* Column header */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4 px-4 py-2.5 bg-gray-50 border-b text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <span className="w-11 shrink-0" />
          <span className="w-10 shrink-0 text-center">Group</span>
          <span className="min-w-0 flex-1">Name &amp; location</span>
          <span className="shrink-0 w-14 text-center">Age</span>
          <span className="shrink-0 w-28 text-center">Status</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : donors.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No donors match these filters yet.
          </div>
        ) : (
          <div className="divide-y">
            {donors.map((d) => (
              <Link key={d.id} href={`/donors/${d.id}`}
                className={`flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-red-50/50 transition-colors ${
                  d.availability === "unavailable" ? "opacity-60" : ""}`}>
                <DonorAvatar photoUrl={d.photo_url} name={d.name} size={44} />
                <span className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-xs shrink-0"
                  style={{ backgroundColor: `${accent}15`, color: accent }}>
                  {d.blood_group}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {[d.area, d.police_station, d.district].filter(Boolean).join(", ") || "Location not set"}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:block w-14 text-center">
                  {d.age != null ? `${d.age} yrs` : "—"}
                </span>
                <span className="shrink-0 sm:w-28 flex sm:justify-center">
                  <DaysChip donor={d} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5 text-sm">
          <button disabled={page === 0}
            onClick={() => { const p = page - 1; setPage(p); load(filters, p, radius, bounds); }}
            className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-muted-foreground">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1}
            onClick={() => { const p = page + 1; setPage(p); load(filters, p, radius, bounds); }}
            className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
        <Droplet className="w-3 h-3" style={{ color: accent }} />
        Tap a donor to see contact details and full profile.
      </p>
    </div>
  );
}
