"use client";

// Leaflet + OpenStreetMap (free, no API key). Loaded client-side only —
// import these components with next/dynamic ssr:false.

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BD_CENTER: [number, number] = [23.685, 90.3563];

function dropIcon(label?: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px)">
      <div style="background:#dc2626;color:#fff;font-weight:700;font-size:10px;line-height:1;
        padding:5px 6px;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.4);white-space:nowrap">
        ${label ?? "🩸"}</div>
      <div style="width:2px;height:8px;background:#dc2626"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
  });
}

/** Click-to-set location picker used in add/edit forms. */
export function MapPicker({ value, onChange, height = 260 }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView(value ? [value.lat, value.lng] : BD_CENTER, value ? 13 : 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    if (value) markerRef.current = L.marker([value.lat, value.lng], { icon: dropIcon() }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (markerRef.current) markerRef.current.setLatLng(e.latlng);
      else markerRef.current = L.marker(e.latlng, { icon: dropIcon() }).addTo(map);
      onChangeRef.current(pos);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} style={{ height }} className="rounded-xl overflow-hidden border z-0" />;
}

export interface MapDonor {
  id: string; name: string; blood_group: string;
  lat: number; lng: number;
  area?: string | null; district?: string | null;
}

/** Read-only pins map for the donor list's map view. */
export function DonorsMap({ donors, height = 420 }: { donors: MapDonor[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current).setView(BD_CENTER, 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; layerRef.current = null; };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    const points: [number, number][] = [];
    for (const d of donors) {
      points.push([d.lat, d.lng]);
      L.marker([d.lat, d.lng], { icon: dropIcon(d.blood_group) })
        .bindPopup(
          `<a href="/donors/${d.id}" style="font-weight:600">${d.name}</a><br/>` +
          `<span style="color:#dc2626;font-weight:700">${d.blood_group}</span> · ` +
          `${[d.area, d.district].filter(Boolean).join(", ") || "—"}`
        )
        .addTo(layer);
    }
    if (points.length) map.fitBounds(L.latLngBounds(points).pad(0.2), { maxZoom: 13 });
  }, [donors]);

  return <div ref={ref} style={{ height }} className="rounded-2xl overflow-hidden border z-0" />;
}
