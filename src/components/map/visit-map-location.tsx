"use client";

import React, { useEffect, useState } from "react";
import { useBuilderStore } from "@/lib/store/builder";
import type { CTABlockProps } from "@/types/cms";
import { MapLocationInput } from "./map-location-input";
import { loadSiteBusinessAddress, loadSiteContactRow } from "./business-address";
import { looksLikeMapLink } from "@/lib/maps/parse-google-link";
import type { MapLocation } from "@/lib/maps/location";

/**
 * Map location for the CTA "Visit + Map" banner. The banner renders
 * mapLinks(mapQuery || address), so the control saves its keyless embed URL
 * in mapQuery (mapLinks reads links) and the picked place in mapLocation.
 * Words typed in mapQuery before (a business name, "3.31,101.57") are shown
 * as the search they already render; nothing is written until the editor
 * changes the location.
 */
export function VisitMapLocation({ block }: { block: CTABlockProps }) {
  const { updateBlock } = useBuilderStore();
  const tenantId = useBuilderStore((s) => s.tenantId);
  const [siteAddress, setSiteAddress] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadSiteContactRow(tenantId).then((r) => { if (live) setSiteAddress(r?.address ?? null); }).catch(() => {});
    return () => { live = false; };
  }, [tenantId]);

  const latest = () => (useBuilderStore.getState().getBlock(block.id) as CTABlockProps | undefined)?.data ?? block.data;
  const save = (mapLocation: MapLocation | null, url: string) =>
    updateBlock(block.id, { data: { ...latest(), mapLocation: mapLocation ?? undefined, mapQuery: url || undefined } });

  const q = block.data.mapQuery?.trim();
  // Same URL mapLinks() builds for words, so the control reads what renders.
  const embedUrl = q && !looksLikeMapLink(q) ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed` : q;

  async function businessAddress() {
    const site = await loadSiteBusinessAddress(tenantId);
    const own = latest().address?.trim() || "";
    if (!own) return site;
    return { address: own, embedUrl: site?.address?.trim() === own ? site.embedUrl : null };
  }

  return (
    <MapLocationInput
      location={block.data.mapLocation}
      embedUrl={embedUrl}
      onChange={save}
      fallbackAddress={block.data.address || siteAddress}
      loadBusinessAddress={businessAddress}
      className="rounded-md border p-2"
    />
  );
}
