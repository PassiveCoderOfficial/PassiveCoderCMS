"use client";

// Google Maps (JS API) — location picker for forms + colored-pin donor map
// with GPS radius search. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

/**
 * Click / drag-to-set location picker for add/edit/admin forms.
 * `autoGps` requests the browser location once on mount and drops the pin
 * there (fallback: no pin, map on Dhaka). A "recenter to my GPS" button lets
 * the user snap the pin back to their live location if they moved it wrong.
 */
export function MapPicker({ value, onChange, height = 260, autoGps = false }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
  autoGps?: boolean;
}) {
  const { isLoaded } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const askedGps = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [onChange]);

  const gotoGps = useCallback((recenterMap: boolean) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onChangeRef.current(p);
        if (recenterMap && mapRef.current) { mapRef.current.panTo(p); mapRef.current.setZoom(15); }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // Auto-request GPS once, only when no location is set yet.
  useEffect(() => {
    if (autoGps && !askedGps.current && !value) {
      askedGps.current = true;
      gotoGps(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGps]);

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-xl border flex items-center justify-center bg-gray-50">
      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
    </div>;
  }

  return (
    <div className="relative">
      <GoogleMap
        mapContainerStyle={{ height, width: "100%", borderRadius: 12 }}
        center={value ?? BD_CENTER}
        zoom={value ? 15 : 7}
        onClick={onClick}
        onLoad={(m) => { mapRef.current = m; }}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {value && (
          <Marker position={value} icon={pinIcon("#dc2626")} draggable
            onDragEnd={(e) => { if (e.latLng) onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() }); }} />
        )}
      </GoogleMap>
      <button type="button" onClick={() => gotoGps(true)}
        title="Recenter to my GPS location"
        className="absolute top-2 right-2 bg-white shadow rounded-lg p-2 text-gray-600 hover:text-red-600 border">
        <Crosshair className="w-4 h-4" />
      </button>
    </div>
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
  onBoundsChanged, boundsActive, onClearBounds, mode = "search", controlsPortalId,
}: {
  donors: MapDonor[]; height?: number;
  onRadiusSearch?: (v: { lat: number; lng: number; radiusKm: number } | null) => void;
  radiusKm?: number;
  onBoundsChanged?: (b: MapBounds) => void;
  boundsActive?: boolean;
  onClearBounds?: () => void;
  /** "display" hides GPS/radius controls + bounds reporting (single profile). */
  mode?: "search" | "display";
  /** If set, the find-me/radius control bar renders into this element id
      (e.g. beside the section title) instead of above the map. */
  controlsPortalId?: string;
}) {
  const { isLoaded } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [active, setActive] = useState<MapDonor | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(radiusKm);
  const userMovedMap = useRef(false);
  const didInitialFit = useRef(false);
  const gpsFitToken = useRef(0);      // bumped when GPS/radius should re-frame
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (controlsPortalId) setPortalEl(document.getElementById(controlsPortalId));
  }, [controlsPortalId]);

  const MAX_VISIBLE = 40;   // when framing GPS results, cover the nearest 40
  const MIN_KM = 30;        // GPS frame at least ~30km wide
  const MAX_KM = 60;        // GPS frame at most ~60km wide

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;

    // Auto-frame ONLY on: first load, a GPS search, or a radius change.
    // Never on plain donor-list refetches (e.g. after the user pans and the
    // list below reloads) — otherwise the map would keep snapping back and
    // fight the user's own free zoom/pan.
    const shouldFit = !didInitialFit.current || gps !== null;
    if (!shouldFit) return;

    const run = () => {
      if (gps) {
        const nearest = [...donors]
          .map((d) => ({ d, dist: haversine(gps.lat, gps.lng, d.lat, d.lng) }))
          .sort((a, b) => a.dist - b.dist)
          .slice(0, MAX_VISIBLE);
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(gps);
        const farthestKm = nearest.length
          ? Math.min(Math.max(nearest[nearest.length - 1].dist, MIN_KM / 2), MAX_KM / 2)
          : MIN_KM / 2;
        const cb = new window.google.maps.Circle({ center: gps, radius: farthestKm * 1000 }).getBounds();
        if (cb) bounds.union(cb);
        userMovedMap.current = false;
        map.fitBounds(bounds, 30);
        didInitialFit.current = true;
        return;
      }
      if (donors.length === 0) return;

      // Single-donor (profile display) → drop straight to area-level zoom.
      if (mode === "display" && donors.length === 1) {
        userMovedMap.current = false;
        map.setCenter({ lat: donors[0].lat, lng: donors[0].lng });
        map.setZoom(14);
        didInitialFit.current = true;
        return;
      }

      const bounds = new window.google.maps.LatLngBounds();
      donors.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
      userMovedMap.current = false;
      // Cap over-zoom on a tight cluster so it lands at area level, not on top
      // of the pins. Don't force a MINIMUM zoom — if donors are spread across
      // the country, fitBounds must keep them all in view.
      const once = window.google.maps.event.addListenerOnce(map, "idle", () => {
        const z = map.getZoom() ?? 7;
        if (z > 14) map.setZoom(14);
      });
      map.fitBounds(bounds, mode === "display" ? 60 : 40);
      didInitialFit.current = true;
      void once;
    };

    const listener = window.google.maps.event.addListenerOnce(map, "idle", run);
    run();
    return () => window.google?.maps.event.removeListener(listener);
    // gpsFitToken forces a re-frame when GPS/radius changes even if gps ref is same
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps, gpsFitToken.current, isLoaded]);

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
        gpsFitToken.current++;
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
    if (gps) { gpsFitToken.current++; onRadiusSearch?.({ ...gps, radiusKm: km }); }
  }

  if (!isLoaded) {
    return <div style={{ height }} className="rounded-2xl border flex items-center justify-center bg-gray-50">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>;
  }

  const isSearch = mode === "search";

  const controlBar = (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={findMe} disabled={locating}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
        Find donors near me
      </button>
      {gps && (
        <>
          <select value={radius} onChange={(e) => changeRadius(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm bg-white font-medium">
            {[2, 5, 10, 15, 25, 50].map(k => <option key={k} value={k}>Within {k} km</option>)}
          </select>
          <button onClick={clearGps} className="text-sm text-gray-500 underline">Clear</button>
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
  );

  return (
    <div className="space-y-3">
      {isSearch && (
        controlsPortalId && portalEl ? createPortal(controlBar, portalEl) : controlBar
      )}

      <GoogleMap
        mapContainerStyle={{ height, width: "100%", borderRadius: 16 }}
        center={gps ?? BD_CENTER}
        zoom={gps ? 12 : 7}
        onLoad={(m) => { mapRef.current = m; }}
        onDragStart={isSearch ? () => { userMovedMap.current = true; } : undefined}
        onZoomChanged={isSearch ? () => { userMovedMap.current = true; } : undefined}
        onIdle={isSearch ? handleIdle : undefined}
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
      {isSearch && (
        <p className="text-[11px] text-gray-400">
          Pin colors match readiness: green = ready, orange = almost ready, red = recently donated, yellow = unknown, grey = temporarily unavailable.
        </p>
      )}
    </div>
  );
}
