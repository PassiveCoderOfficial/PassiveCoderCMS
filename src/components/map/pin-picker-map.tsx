"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { useMapsLoader } from "@/components/map/generic-map";

export type LatLng = { lat: number; lng: number };

/**
 * One draggable pin on a Google map, with an optional area outline (a
 * delivery zone). Click the map or drag the pin to move it. Shared by the
 * checkout delivery pin and the branch pickup pin. Without a Maps key it
 * renders `fallback` (callers keep their "Use my location" button working).
 */
export function PinPickerMap({ value, onChange, center, area, title, height = 260, fallback, zoom }: {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  /** Where to look before there is a pin. */
  center: LatLng;
  /** Closed ring [lat, lng][] drawn as an outline. */
  area?: [number, number][];
  title?: string;
  height?: number;
  fallback?: React.ReactNode;
  /** Controlled zoom (the Map location control's slider). Unset: 16 with a pin, 14 without. */
  zoom?: number;
}) {
  const { isLoaded, loadError } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [initial] = useState(() => ({ center: value ?? center, zoom: zoom ?? (value ? 16 : 14) }));
  useEffect(() => { if (value) mapRef.current?.panTo(value); }, [value]);
  useEffect(() => { if (zoom != null) mapRef.current?.setZoom(zoom); }, [zoom]);

  const onLoad = useCallback((map: google.maps.Map) => { mapRef.current = map; }, []);
  const move = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    onChange({ lat: Number(e.latLng.lat().toFixed(7)), lng: Number(e.latLng.lng().toFixed(7)) });
  };

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || loadError) return <>{fallback ?? null}</>;
  if (!isLoaded) return <div className="rounded-lg bg-muted animate-pulse" style={{ height }} aria-hidden />;

  return (
    <div className="rounded-lg overflow-hidden border" style={{ height }} data-pin-picker>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={initial.center}
        zoom={initial.zoom}
        onLoad={onLoad}
        onClick={move}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false, gestureHandling: "greedy" }}
      >
        {area && (
          <Polygon
            paths={area.map(([lat, lng]) => ({ lat, lng }))}
            options={{ fillColor: "#16a34a", fillOpacity: 0.06, strokeColor: "#16a34a", strokeOpacity: 0.8, strokeWeight: 2, clickable: false }}
          />
        )}
        {value && <Marker position={value} draggable onDragEnd={move} title={title} />}
      </GoogleMap>
    </div>
  );
}

/** Browser location, or null when refused/unavailable. */
export function readBrowserLocation(): Promise<(LatLng & { accuracy: number }) | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: Number(p.coords.latitude.toFixed(7)), lng: Number(p.coords.longitude.toFixed(7)), accuracy: p.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}
