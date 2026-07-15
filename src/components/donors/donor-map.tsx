"use client";

// Google Maps (JS API) — location picker for forms + colored-pin donor map
// with GPS radius search. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, Circle, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { AVAILABILITY_META, type Availability } from "@/lib/donors/availability";
import { Crosshair, Loader2 } from "lucide-react";

const BD_CENTER = { lat: 23.685, lng: 90.3563 };
const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

function useMapsLoader() {
  return useJsApiLoader({ id: "pc-google-maps", googleMapsApiKey: MAPS_KEY });
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pinIcon(color: string, label?: string) {
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

/** Click-to-set location picker used in add/edit/admin forms. */
export function MapPicker({ value, onChange, height = 260 }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const { isLoaded } = useMapsLoader();

  const onClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [onChange]);

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-xl border flex items-center justify-center bg-gray-50">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    </div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ height, width: "100%", borderRadius: 12 }}
      center={value ?? BD_CENTER}
      zoom={value ? 14 : 7}
      onClick={onClick}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
    >
      {value && <Marker position={value} icon={pinIcon("#dc2626")} />}
    </GoogleMap>
  );
}

export interface MapDonor {
  id: string; name: string; blood_group: string;
  lat: number; lng: number;
  area?: string | null; district?: string | null;
  availability?: Availability;
}

export interface MapBounds { sw_lat: number; sw_lng: number; ne_lat: number; ne_lng: number }

/**
 * Read-only donor map with availability-colored pins (green/yellow/red/
 * orange/grey), an optional search radius circle, a "Use my location" GPS
 * button, and (when onBoundsChanged is passed) reports the visible viewport
 * once panning/zooming settles — used to filter a donor list below the map.
 */
export function DonorsMap({
  donors, height = 420, onRadiusSearch, radiusKm = 15,
  onBoundsChanged, boundsActive, onClearBounds,
}: {
  donors: MapDonor[]; height?: number;
  onRadiusSearch?: (v: { lat: number; lng: number; radiusKm: number } | null) => void;
  radiusKm?: number;
  onBoundsChanged?: (b: MapBounds) => void;
  boundsActive?: boolean;
  onClearBounds?: () => void;
}) {
  const { isLoaded } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [active, setActive] = useState<MapDonor | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(radiusKm);
  const userMovedMap = useRef(false);

  const MAX_VISIBLE = 40;   // don't try to frame more than the nearest 40 pins
  const MIN_KM = 30;        // never zoom in tighter than a 30km-wide view
  const MAX_KM = 60;        // never zoom out further than the chosen radius

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    // fitBounds before the map has finished sizing itself silently no-ops
    // (or produces a bogus whole-country zoom) — wait for "idle" once.
    const run = () => {
      if (gps) {
        // Frame the nearest MAX_VISIBLE donors tightly if they're clustered,
        // otherwise fall back to a fixed-width view around the search point
        // — so a handful of donors scattered hundreds of miles apart don't
        // zoom the map out to fit all of them (or the whole country).
        const nearest = [...donors]
          .map((d) => ({ d, dist: haversine(gps.lat, gps.lng, d.lat, d.lng) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, MAX_VISIBLE);

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(gps);
        if (nearest.length) {
          const farthestKm = Math.min(Math.max(nearest[nearest.length - 1].dist, MIN_KM / 2), MAX_KM / 2);
          const circle = new window.google.maps.Circle({ center: gps, radius: farthestKm * 1000 });
          const cb = circle.getBounds();
          if (cb) bounds.union(cb);
        } else {
          const circle = new window.google.maps.Circle({ center: gps, radius: (MIN_KM / 2) * 1000 });
          const cb = circle.getBounds();
          if (cb) bounds.union(cb);
        }
        userMovedMap.current = false; // programmatic move, not a user pan
        map.fitBounds(bounds, 30);
        return;
      }

      if (donors.length === 0) return;
      const bounds = new window.google.maps.LatLngBounds();
      donors.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
      userMovedMap.current = false;
      map.fitBounds(bounds, 40);
    };

    const listener = window.google.maps.event.addListenerOnce(map, "idle", run);
    run(); // also try immediately — idle may have already fired
    return () => window.google?.maps.event.removeListener(listener);
  }, [donors, gps, radius]);

  // Report the viewport once the user's own pan/zoom settles (not the
  // programmatic fitBounds calls above, which set userMovedMap back to false).
  const handleIdle = useCallback(() => {
    if (!onBoundsChanged || !userMovedMap.current) return;
    const map = mapRef.current;
    const b = map?.getBounds();
    if (!b) return;
    const ne = b.getNorthEast(), sw = b.getSouthWest();
    onBoundsChanged({ sw_lat: sw.lat(), sw_lng: sw.lng(), ne_lat: ne.lat(), ne_lng: ne.lng() });
  }, [onBoundsChanged]);

  function findMe() {
    if (!navigator.geolocation) { alert("Location isn't available in this browser"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setGps(point);
        setLocating(false);
        onRadiusSearch?.({ ...point, radiusKm: radius });
      },
      () => { setLocating(false); alert("Couldn't get your location — check permission and try again."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function clearGps() {
    setGps(null);
    onRadiusSearch?.(null);
  }

  function changeRadius(km: number) {
    setRadius(km);
    if (gps) onRadiusSearch?.({ ...gps, radiusKm: km });
  }

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-2xl border flex items-center justify-center bg-gray-50">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={findMe} disabled={locating}
          className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
          Find donors near me
        </button>
        {gps && (
          <>
            <select value={radius} onChange={(e) => changeRadius(Number(e.target.value))}
              className="border rounded-lg px-2 py-1.5 text-xs bg-white">
              {[2, 5, 10, 15, 25, 50].map(k => <option key={k} value={k}>{k} km radius</option>)}
            </select>
            <button onClick={clearGps} className="text-xs text-gray-500 underline">Clear</button>
          </>
        )}
        {boundsActive && (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1.5 text-xs font-medium">
            Filtering by map view
            {onClearBounds && (
              <button onClick={onClearBounds} className="hover:text-blue-900" aria-label="Clear map filter">×</button>
            )}
          </span>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={{ height, width: "100%", borderRadius: 16 }}
        center={gps ?? BD_CENTER}
        zoom={gps ? 12 : 7}
        onLoad={(m) => { mapRef.current = m; }}
        onDragStart={() => { userMovedMap.current = true; }}
        onZoomChanged={() => { userMovedMap.current = true; }}
        onIdle={handleIdle}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {gps && (
          <>
            <Marker position={gps} icon={{ path: window.google!.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }} />
            <Circle center={gps} radius={radius * 1000} options={{ fillColor: "#2563eb", fillOpacity: 0.06, strokeColor: "#2563eb", strokeOpacity: 0.4, strokeWeight: 1 }} />
          </>
        )}
        {donors.map((d) => {
          const color = AVAILABILITY_META[d.availability ?? "unknown"].dot;
          return (
            <Marker key={d.id} position={{ lat: d.lat, lng: d.lng }}
              icon={pinIcon(color)}
              label={{ text: d.blood_group, color: "#fff", fontSize: "9px", fontWeight: "700" }}
              onClick={() => setActive(d)} />
          );
        })}
        {active && (
          <InfoWindow position={{ lat: active.lat, lng: active.lng }} onCloseClick={() => setActive(null)}>
            <a href={`/donors/${active.id}`} className="text-sm">
              <strong>{active.name}</strong><br />
              <span style={{ color: "#dc2626", fontWeight: 700 }}>{active.blood_group}</span>
              {" · "}{[active.area, active.district].filter(Boolean).join(", ") || "—"}
            </a>
          </InfoWindow>
        )}
      </GoogleMap>
      <p className="text-[11px] text-gray-400">
        Pin colors match readiness: green = ready, yellow = soon, red = recently donated, orange = unknown, grey = temporarily unavailable.
      </p>
    </div>
  );
}
