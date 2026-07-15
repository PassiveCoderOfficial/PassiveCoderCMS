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

/**
 * Read-only donor map with availability-colored pins (green/yellow/red/
 * orange/grey), an optional search radius circle, and a "Use my location"
 * GPS button that reports the picked point + radius to the parent.
 */
export function DonorsMap({ donors, height = 420, onRadiusSearch, radiusKm = 15 }: {
  donors: MapDonor[]; height?: number;
  onRadiusSearch?: (v: { lat: number; lng: number; radiusKm: number } | null) => void;
  radiusKm?: number;
}) {
  const { isLoaded } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [active, setActive] = useState<MapDonor | null>(null);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [radius, setRadius] = useState(radiusKm);

  useEffect(() => {
    if (!mapRef.current || !window.google || donors.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    donors.forEach((d) => bounds.extend({ lat: d.lat, lng: d.lng }));
    if (gps) bounds.extend(gps);
    mapRef.current.fitBounds(bounds, 40);
  }, [donors, gps]);

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
      </div>

      <GoogleMap
        mapContainerStyle={{ height, width: "100%", borderRadius: 16 }}
        center={gps ?? BD_CENTER}
        zoom={gps ? 12 : 7}
        onLoad={(m) => { mapRef.current = m; }}
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
