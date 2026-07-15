"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DonorMapBlockProps } from "@/types/cms";
import type { Availability } from "@/lib/donors/availability";

const DonorsMap = dynamic(() => import("@/components/donors/donor-map").then(m => m.DonorsMap), { ssr: false });

interface MapDonor {
  id: string; name: string; blood_group: string; availability: Availability;
  lat: number | null; lng: number | null; area: string | null; district: string | null;
}

/** Standalone map section — placed right after the hero, before group cards. */
export function DonorMapBlock({ block }: { block: DonorMapBlockProps }) {
  const { data } = block;
  const [donors, setDonors] = useState<MapDonor[]>([]);
  const [radius, setRadius] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r?: typeof radius) => {
    setLoading(true);
    const params = new URLSearchParams({ page: "0" });
    if (r) { params.set("lat", String(r.lat)); params.set("lng", String(r.lng)); params.set("radius_km", String(r.radiusKm)); }
    try {
      const res = await fetch(`/api/donors?${params}`);
      if (res.ok) {
        const d = await res.json();
        setDonors((d.donors ?? []).filter((x: MapDonor) => x.lat != null && x.lng != null));
      }
    } catch { /* keep last state */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRadiusSearch(v: typeof radius) {
    setRadius(v);
    load(v ?? undefined);
  }

  return (
    <div className="max-w-5xl mx-auto">
      {(data.title || data.subtitle) && (
        <div className="text-center mb-5">
          {data.title && <h2 className="text-2xl font-bold mb-1">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground text-sm">{data.subtitle}</p>}
        </div>
      )}
      {!loading && <DonorsMap donors={donors as never} height={data.height || 420} onRadiusSearch={onRadiusSearch} />}
      {radius && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Showing donors within {radius.radiusKm} km of your location.
        </p>
      )}
    </div>
  );
}
