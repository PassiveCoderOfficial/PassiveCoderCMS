"use client";

// Reusable Google Maps pin-map core — extracted from the donor module's map
// (src/components/donors/donor-map.tsx) so any module (marketplace vendor
// directory, future modules) gets the same GPS/radius/pin behavior without
// depending on donor-specific types (blood group, availability color).

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, Marker, Circle, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { Crosshair, Loader2, MapPin as MapPinIcon, Search, X } from "lucide-react";

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

// Brand accent (honey heart-badge color from BrandLogo) — dot inside the pin.
// Literal colors — baked into an SVG data-URI marker, so CSS vars can't be
// used here. Neutral platform defaults; callers pass tenant colors via
// MapPin.color.
const ACCENT_DOT = "#F59E0B";

export function pinIcon(color: string) {
  if (typeof window === "undefined" || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 34">
    <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3.2" fill="${ACCENT_DOT}"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(24, 34),
    anchor: new window.google.maps.Point(12, 32),
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

export type LatLng = { lat: number; lng: number };

/** Labels for pick mode; English defaults, callers pass their own language. */
export type PickLabels = {
  search: string; go: string; useMyLocation: string; clear: string; hint: string; noPin: string;
  notFound: string; noGps: string; gpsDenied: string; manual: string; manualHint: string; manualBad: string; set: string; mapOff: string;
};
const PICK_LABELS: PickLabels = {
  search: "Search an address or place", go: "Go", useMyLocation: "Use my location", clear: "Remove pin",
  hint: "Click the map or drag the pin to set your exact location", noPin: "No pin yet: your city's location is used.",
  notFound: "Couldn't find that place. Try a fuller address.", noGps: "Location isn't available in this browser.",
  gpsDenied: "Couldn't get your location. Check the permission and try again.", manual: "Or paste coordinates",
  manualHint: "e.g. 23.8103, 90.4125 or a Google Maps link", manualBad: "Use latitude, longitude (e.g. 23.8103, 90.4125).", set: "Set", mapOff: "The map isn't available right now; you can still set your location below.",
};

/**
 * Generic pin map. Use-case presets are just prop combinations:
 *  - single-pin display  → pins=[one], mode="display"
 *  - multi-pin directory  → pins=[many], mode="display" (no radius UI)
 *  - radius search        → pins=[many], mode="search" (adds find-me + radius)
 *  - location picker      → mode="pick", value + onPick (click, drag, search,
 *                           GPS, paste coordinates, clear). Ported from
 *                           ExpertNear.Me's MapPicker.
 */
export function GenericMap(props: {
  pins?: MapPin[];
  height?: number;
  mode?: "search" | "display" | "pick";
  defaultCenter: LatLng;
  defaultZoom?: number;
  radiusKm?: number;
  onRadiusSearch?: (v: { lat: number; lng: number; radiusKm: number } | null) => void;
  findMeLabel?: string;
  /** Pick mode: the current pin (null = none). */
  value?: LatLng | null;
  /** Pick mode: new pin (null = cleared). `address` is filled when `reverseGeocode` is on and Google knows one. */
  onPick?: (v: LatLng | null, address?: string) => void;
  reverseGeocode?: boolean;
  pickLabels?: Partial<PickLabels>;
}) {
  if (props.mode === "pick") {
    return <PickMap value={props.value ?? null} onPick={props.onPick ?? (() => {})} defaultCenter={props.defaultCenter}
      defaultZoom={props.defaultZoom ?? 11} height={props.height ?? 300} reverseGeocode={props.reverseGeocode} labels={{ ...PICK_LABELS, ...props.pickLabels }} />;
  }
  return <PinMap {...props} pins={props.pins ?? []} mode={props.mode ?? "display"} />;
}

function PinMap({
  pins, height = 420, mode, defaultCenter, defaultZoom = 12,
  radiusKm = 15, onRadiusSearch, findMeLabel = "Find near me",
}: {
  pins: MapPin[];
  height?: number;
  mode: "search" | "display";
  defaultCenter: LatLng;
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

/* ---------- Pick mode (ExpertNear.Me's MapPicker on the shared loader) ---------- */

const PICK_COLOR = "#f97316";
const validPoint = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const round6 = (p: LatLng): LatLng => ({ lat: Math.round(p.lat * 1e6) / 1e6, lng: Math.round(p.lng * 1e6) / 1e6 });

/** "23.81, 90.41", "23.81 90.41" or a Google Maps link (@23.81,90.41 / q=23.81,90.41). */
export function parseLatLng(text: string): LatLng | null {
  const m = text.match(/(-?\d{1,3}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]); const lng = Number(m[2]);
  return validPoint(lat, lng) ? round6({ lat, lng }) : null;
}

/**
 * Improvements over ENM: works without a Maps key (GPS + pasted coordinates),
 * no 0,0 "cleared" sentinel (null instead), errors shown inline instead of
 * swallowed, reverse geocoding only when the caller wants an address, and
 * the map follows the chosen city until a pin is set.
 */
function PickMap({ value, onPick, defaultCenter, defaultZoom, height, reverseGeocode, labels: l }: {
  value: LatLng | null; onPick: (v: LatLng | null, address?: string) => void; defaultCenter: LatLng; defaultZoom: number;
  height: number; reverseGeocode?: boolean; labels: PickLabels;
}) {
  const hasKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [msg, setMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [manual, setManual] = useState("");

  function locate() {
    if (!navigator.geolocation) { setMsg(l.noGps); return; }
    setLocating(true); setMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); onPick(round6({ lat: pos.coords.latitude, lng: pos.coords.longitude })); },
      () => { setLocating(false); setMsg(l.gpsDenied); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  function setManualPoint() {
    const p = parseLatLng(manual);
    if (!p) { setMsg(l.manualBad); return; }
    setMsg(null); setManual(""); onPick(p);
  }

  return (
    <div className="space-y-2">
      {hasKey
        ? <PickCanvas value={value} onPick={onPick} defaultCenter={defaultCenter} defaultZoom={defaultZoom} height={height} reverseGeocode={reverseGeocode} labels={l} onMessage={setMsg} />
        : <p className="rounded-lg border border-dashed border-input px-3 py-4 text-center text-xs opacity-70">{l.mapOff}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={locate} disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:border-orange-400 disabled:opacity-50">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />} {l.useMyLocation}
        </button>
        {value ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-orange-500/10 px-2.5 py-1.5 text-xs">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-orange-500" />
            <span dir="ltr" className="font-mono">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</span>
            <button type="button" onClick={() => { setMsg(null); onPick(null); }} aria-label={l.clear} title={l.clear}
              className="ms-1 inline-flex items-center gap-1 opacity-70 hover:text-red-600 hover:opacity-100"><X className="h-3.5 w-3.5" /> {l.clear}</button>
          </span>
        ) : <span className="text-xs opacity-60">{l.noPin}</span>}
      </div>

      <div>
        <span className="mb-1 block text-xs opacity-70">{l.manual}</span>
        <div className="flex gap-2">
          <input dir="ltr" value={manual} onChange={(e) => setManual(e.target.value)} placeholder={l.manualHint} aria-label={l.manual}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setManualPoint(); } }}
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none" />
          <button type="button" onClick={setManualPoint} disabled={!manual.trim()} className="shrink-0 rounded-md border border-input px-3 text-sm disabled:opacity-40">{l.set}</button>
        </div>
      </div>
      {msg && <p role="status" className="text-xs text-red-600">{msg}</p>}
    </div>
  );
}

function PickCanvas({ value, onPick, defaultCenter, defaultZoom, height, reverseGeocode, labels: l, onMessage }: {
  value: LatLng | null; onPick: (v: LatLng | null, address?: string) => void; defaultCenter: LatLng; defaultZoom: number;
  height: number; reverseGeocode?: boolean; labels: PickLabels; onMessage: (m: string | null) => void;
}) {
  const { isLoaded, loadError } = useMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const pinLat = value?.lat; const pinLng = value?.lng;

  // Follow the pin; with no pin, follow the chosen city (defaultCenter).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pinLat == null || pinLng == null) return;
    map.panTo({ lat: pinLat, lng: pinLng });
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
  }, [pinLat, pinLng]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || pinLat != null) return;
    map.panTo({ lat: defaultCenter.lat, lng: defaultCenter.lng });
    map.setZoom(defaultZoom);
    // Only when the city changes, not on every pin edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCenter.lat, defaultCenter.lng, defaultZoom]);

  const pick = useCallback(async (p: LatLng) => {
    const point = round6(p);
    onMessage(null);
    if (!reverseGeocode || !window.google) { onPick(point); return; }
    try {
      const res = await new window.google.maps.Geocoder().geocode({ location: point });
      onPick(point, res.results[0]?.formatted_address);
    } catch { onPick(point); }
  }, [onPick, onMessage, reverseGeocode]);

  async function search() {
    if (!query.trim() || !window.google) return;
    setSearching(true); onMessage(null);
    try {
      const res = await new window.google.maps.Geocoder().geocode({ address: query.trim() });
      const loc = res.results[0]?.geometry?.location;
      if (loc) onPick(round6({ lat: loc.lat(), lng: loc.lng() }), reverseGeocode ? res.results[0].formatted_address : undefined);
      else onMessage(l.notFound);
    } catch { onMessage(l.notFound); }
    setSearching(false);
  }

  if (loadError) return <p className="rounded-lg border border-dashed border-input px-3 py-4 text-center text-xs opacity-70">{l.mapOff}</p>;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:border-orange-500">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={l.search} aria-label={l.search}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
            className="w-full bg-transparent py-1.5 text-sm outline-none" />
        </div>
        <button type="button" onClick={search} disabled={searching || !query.trim() || !isLoaded}
          className="shrink-0 rounded-md bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : l.go}
        </button>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-input" style={{ height }}>
        {!isLoaded ? (
          <div className="flex h-full items-center justify-center bg-muted"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <GoogleMap
            mapContainerStyle={{ height: "100%", width: "100%" }}
            onLoad={(m) => { mapRef.current = m; m.setCenter(value ?? defaultCenter); m.setZoom(value ? 15 : defaultZoom); }}
            onUnmount={() => { mapRef.current = null; }}
            onClick={(e) => { if (e.latLng) pick({ lat: e.latLng.lat(), lng: e.latLng.lng() }); }}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, clickableIcons: false, draggableCursor: "crosshair" }}
          >
            {value && (
              <Marker position={value} draggable icon={pinIcon(PICK_COLOR)} zIndex={100}
                onDragEnd={(e) => { if (e.latLng) pick({ lat: e.latLng.lat(), lng: e.latLng.lng() }); }} />
            )}
          </GoogleMap>
        )}
        <p className="pointer-events-none absolute inset-x-2 bottom-2 rounded-md bg-black/60 px-2 py-1 text-center text-xs text-white">{l.hint}</p>
      </div>
    </div>
  );
}
