"use client";

// Reusable Google Maps pin-map core — extracted from the donor module's map
// (src/components/donors/donor-map.tsx) so any module (marketplace vendor
// directory, future modules) gets the same GPS/radius/pin behavior without
// depending on donor-specific types (blood group, availability color).

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, Circle, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { Crosshair, Loader2 } from "lucide-react";

export function useMapsLoader() {
  return useJsApiLoader({ id: "pc-google-maps", googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "" });
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function pinIcon(color: string) {
  if (typeof window === "undefined" || !window.google) return undefined;
  return {
    path: "M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 1.5,
    scale: 1.6,
    anchor: new window.google.maps.Point(12, 22),
    labelOrigin: new window.google.maps.Point(12, 10),
  };
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  render: () => React.ReactNode; // InfoWindow content when clicked
}

/**
 * Generic read-only pin map with optional GPS "find near me" + radius
 * search. Use-case presets are just prop combinations:
 *  - single-pin display  → pins=[one], mode="display"
 *  - multi-pin directory  → pins=[many], mode="display" (no radius UI)
 *  - radius search        → pins=[many], mode="search" (adds find-me + radius)
 */
export function GenericMap({
  pins, height = 420, mode = "display", defaultCenter, defaultZoom = 12,
  radiusKm = 15, onRadiusSearch, findMeLabel = "Find near me",
}: {
  pins: MapPin[];
  height?: number;
  mode?: "search" | "display";
  defaultCenter: { lat: number; lng: number };
  defaultZoom?: number;
  radiusKm?: number;
  onRadiusSearch?: (v: { lat: number; lng: number; radiusKm: number } | null) => void;
  findMeLabel?: string;
}) {
  const { isLoaded } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [active, setActive] = useState<MapPin | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(radiusKm);
  const didInitialFit = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google || didInitialFit.current) return;
    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
      map.setZoom(14);
      didInitialFit.current = true;
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    pins.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, 50);
    didInitialFit.current = true;
  }, [pins, isLoaded]);

  function findMe() {
    if (!navigator.geolocation) { alert("Location isn't available in this browser"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps(point);
        setLocating(false);
        onRadiusSearch?.({ ...point, radiusKm: radius });
        mapRef.current?.panTo(point);
        mapRef.current?.setZoom(12);
      },
      () => { setLocating(false); alert("Couldn't get your location — check permission and try again."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearGps() { setGps(null); onRadiusSearch?.(null); }

  function changeRadius(km: number) {
    setRadius(km);
    if (gps) onRadiusSearch?.({ ...gps, radiusKm: km });
  }

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-2xl border border-border flex items-center justify-center bg-muted">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>;
  }

  const isSearch = mode === "search";

  return (
    <div className="space-y-3">
      {isSearch && (
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={findMe} disabled={locating}
            className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50">
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            {findMeLabel}
          </button>
          {gps && (
            <>
              <select value={radius} onChange={(e) => changeRadius(Number(e.target.value))}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background font-medium">
                {[2, 5, 10, 15, 25, 50].map(k => <option key={k} value={k}>Within {k} km</option>)}
              </select>
              <button onClick={clearGps} className="text-sm text-muted-foreground underline">Clear</button>
            </>
          )}
        </div>
      )}

      <GoogleMap
        mapContainerStyle={{ height, width: "100%", borderRadius: 16 }}
        center={gps ?? defaultCenter}
        zoom={gps ? 12 : defaultZoom}
        onLoad={(m) => { mapRef.current = m; }}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {gps && (
          <>
            <Marker position={gps} icon={{ path: window.google!.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }} />
            <Circle center={gps} radius={radius * 1000} options={{ fillColor: "#2563eb", fillOpacity: 0.06, strokeColor: "#2563eb", strokeOpacity: 0.4, strokeWeight: 1 }} />
          </>
        )}
        {pins.map((p) => (
          <Marker key={p.id} position={{ lat: p.lat, lng: p.lng }}
            icon={pinIcon(p.color ?? "#2563EB")}
            label={p.label ? { text: p.label, color: "#fff", fontSize: "9px", fontWeight: "700" } : undefined}
            onClick={() => setActive(p)} />
        ))}
        {active && (
          <InfoWindow position={{ lat: active.lat, lng: active.lng }} onCloseClick={() => setActive(null)}>
            <div className="text-sm">{active.render()}</div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
