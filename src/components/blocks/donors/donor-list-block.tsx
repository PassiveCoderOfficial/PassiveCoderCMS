"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { DonorListBlockProps } from "@/types/cms";
import { BLOOD_GROUPS, BD_DISTRICTS, BD_LOCATIONS, RELIGIONS, GENDERS } from "@/lib/donors/bd-locations";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { Droplet, Search, Loader2, Plus, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

interface DonorRow {
  id: string; name: string; blood_group: string;
  gender: string | null; religion: string | null;
  district: string | null; police_station: string | null; area: string | null;
  age: number | null; last_donated_on: string | null;
  availability: Availability;
}

interface Filters {
  blood_group: string; district: string; police_station: string;
  area: string; gender: string; religion: string; availability: string; q: string;
}

const EMPTY: Filters = { blood_group: "", district: "", police_station: "", area: "", gender: "", religion: "", availability: "", q: "" };

const selectCls = "border rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 min-w-0";

function DaysChip({ donor }: { donor: DonorRow }) {
  const meta = AVAILABILITY_META[donor.availability];
  let label = meta.label;
  if (donor.last_donated_on) {
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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (f: Filters, pg: number) => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(pg));
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

  // Blood-group cards elsewhere on the page dispatch this event
  useEffect(() => {
    function onFilter(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<Filters>;
      setFilters(f => {
        const next = { ...f, ...detail };
        setPage(0);
        load(next, 0);
        return next;
      });
    }
    window.addEventListener("donor-filter", onFilter);
    return () => window.removeEventListener("donor-filter", onFilter);
  }, [load]);

  function set(key: keyof Filters, value: string) {
    setFilters(f => {
      const next = { ...f, [key]: value };
      if (key === "district") next.police_station = "";
      setPage(0);
      if (key === "q" || key === "area") {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => load(next, 0), 350);
      } else {
        load(next, 0);
      }
      return next;
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));
  const thanas = filters.district ? BD_LOCATIONS[filters.district] ?? [] : [];

  return (
    <div id="donor-list" className="max-w-5xl mx-auto scroll-mt-24">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h2 className="text-2xl font-bold">
          {data.title || "Donors"} <span className="text-sm font-normal text-muted-foreground">({total})</span>
        </h2>
        {data.showAddButton && (
          <Link href="/donors/add"
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}>
            <Plus className="w-4 h-4" /> {data.addButtonLabel || "Become a Donor"}
          </Link>
        )}
      </div>

      {data.showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
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
            <option value="soon">Ready soon</option>
            <option value="not_ready">Recently donated</option>
            <option value="unknown">Unknown</option>
          </select>
          <select className={selectCls} value={filters.gender} onChange={e => set("gender", e.target.value)}>
            <option value="">Any gender</option>
            {GENDERS.map(g => <option key={g} value={g} className="capitalize">{g[0].toUpperCase() + g.slice(1)}</option>)}
          </select>
          <select className={selectCls} value={filters.religion} onChange={e => set("religion", e.target.value)}>
            <option value="">Any religion</option>
            {RELIGIONS.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
          </select>
          <input className={selectCls} placeholder="Area…" value={filters.area} onChange={e => set("area", e.target.value)} />
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input className={`${selectCls} w-full pl-8`} placeholder="Search name…" value={filters.q} onChange={e => set("q", e.target.value)} />
          </div>
        </div>
      )}

      <div className="border rounded-2xl overflow-hidden bg-white">
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
                className="flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-red-50/50 transition-colors">
                <span className="flex items-center justify-center w-11 h-11 rounded-full font-bold text-sm shrink-0"
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
                {d.age != null && (
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{d.age} yrs</span>
                )}
                <DaysChip donor={d} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5 text-sm">
          <button disabled={page === 0}
            onClick={() => { const p = page - 1; setPage(p); load(filters, p); }}
            className="p-2 border rounded-lg disabled:opacity-30 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-muted-foreground">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1}
            onClick={() => { const p = page + 1; setPage(p); load(filters, p); }}
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
