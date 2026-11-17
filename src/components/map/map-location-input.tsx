"use client";

/**
 * "Map location": the one control for setting where a map points, used by
 * the Contact block, the Visit + Map banner and Dashboard > Contact details.
 *
 *  1. Search an address or place: Google Places suggestions when the Maps
 *     key has Places; otherwise the browser geocoder, then /api/maps/geocode.
 *  2. Paste a Google Maps link: any share link, page URL, embed URL or the
 *     whole <iframe> code (share links are opened by /api/maps/resolve).
 *  3. Use my business address: the site's own map pin or address.
 *  4. A live preview with a draggable pin, a zoom slider and (where the block
 *     has one) a map height.
 *  5. A status line saying what the map shows, and Remove.
 *
 * It saves two things through onChange: a structured MapLocation and a
 * keyless embed URL (what renders, and what older code reads). Works with no
 * Maps key at all: search goes to the server and the preview is the iframe.
 */
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMapsLoader } from "./generic-map";
import { PinPickerMap } from "./pin-picker-map";
import { looksLikeMapLink, parseCoordText, parseGoogleMapsInput, type ParsedMapLink } from "@/lib/maps/parse-google-link";
import { keylessEmbedUrl, locationFromParsed, openInGoogleMapsUrl, readSavedMap } from "@/lib/maps/embed";
import { MAP_HEIGHTS, MAP_ZOOM, hasCoords, type MapLocation } from "@/lib/maps/location";

export const MAP_LOCATION_LABELS = {
  title: "Map location",
  search: "Search an address or place",
  searchPlaceholder: "e.g. 67 Ubi Crescent, Singapore",
  find: "Find",
  suggestionsBy: "Suggestions by Google",
  noResults: "No place found. Add the area or city and try again.",
  searchOff: "Search is not available right now.",
  useTyped: "Show \"{text}\" on the map",
  pasteLabel: "Or paste a Google Maps link",
  pastePlaceholder: "Share link, page link or embed code",
  pasteHint: "In Google Maps: Share, then Copy link. Or Share, Embed a map, Copy HTML.",
  use: "Use",
  notALink: "That is not a Google Maps link. In Google Maps, tap Share and copy the link.",
  searchInstead: "Search for it instead",
  linkFailed: "Could not open that link. Check it opens in Google Maps, or paste the embed code instead.",
  tooMany: "Too many tries. Please wait a few minutes.",
  business: "Use my business address",
  loading: "Loading…",
  noBusinessAddress: "No business address yet. Add one in Contact details or in the Address field.",
  zoom: "Zoom",
  zoomCity: "City",
  zoomStreet: "Street",
  zoomBuilding: "Building",
  height: "Map height",
  heightAuto: "Fits the layout",
  shows: "Map shows: {place}",
  showsAddress: "Map shows your address: {address}",
  none: "No map location yet. Search, paste a link or use your business address.",
  placeFromLink: "the place from your Google Maps link",
  pinned: "Pinned location",
  embedCode: "the map from your embed code",
  checking: "Checking your Google Maps link…",
  dragHint: "Drag the pin or click the map to fine-tune.",
  open: "Open in Google Maps",
  remove: "Remove map location",
  previewTitle: "Map preview",
};
export type MapLocationLabels = typeof MAP_LOCATION_LABELS;

/** Bangla, for the dashboard (Banglish register like lib/i18n/locales/bn.ts). */
export const MAP_LOCATION_LABELS_BN: MapLocationLabels = {
  title: "ম্যাপ লোকেশন",
  search: "ঠিকানা বা জায়গা খুঁজুন",
  searchPlaceholder: "যেমন: House 12, Road 5, Dhanmondi, Dhaka",
  find: "খুঁজুন",
  suggestionsBy: "Google-এর সাজেশন",
  noResults: "কোনো জায়গা পাওয়া যায়নি। এলাকা বা শহরের নাম যোগ করে আবার চেষ্টা করুন।",
  searchOff: "এই মুহূর্তে সার্চ কাজ করছে না।",
  useTyped: "\"{text}\" ম্যাপে দেখান",
  pasteLabel: "অথবা Google Maps লিংক পেস্ট করুন",
  pastePlaceholder: "শেয়ার লিংক, পেজ লিংক বা এম্বেড কোড",
  pasteHint: "Google Maps-এ: Share, তারপর Copy link। অথবা Share, Embed a map, Copy HTML।",
  use: "সেট করুন",
  notALink: "এটা Google Maps লিংক না। Google Maps-এ Share চেপে লিংক কপি করুন।",
  searchInstead: "এর বদলে এটা সার্চ করুন",
  linkFailed: "লিংকটা খোলা যায়নি। Google Maps-এ খুলে দেখুন, অথবা এম্বেড কোড পেস্ট করুন।",
  tooMany: "অনেকবার চেষ্টা হয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।",
  business: "আমার বিজনেস ঠিকানা ব্যবহার করুন",
  loading: "লোড হচ্ছে…",
  noBusinessAddress: "এখনো কোনো বিজনেস ঠিকানা নেই। Contact details-এ বা ঠিকানার ঘরে ঠিকানা দিন।",
  zoom: "জুম",
  zoomCity: "শহর",
  zoomStreet: "রাস্তা",
  zoomBuilding: "বিল্ডিং",
  height: "ম্যাপের উচ্চতা",
  heightAuto: "লেআউট অনুযায়ী",
  shows: "ম্যাপে দেখাচ্ছে: {place}",
  showsAddress: "ম্যাপে আপনার ঠিকানা দেখাচ্ছে: {address}",
  none: "এখনো ম্যাপ লোকেশন সেট করা হয়নি। সার্চ করুন, লিংক পেস্ট করুন বা বিজনেস ঠিকানা ব্যবহার করুন।",
  placeFromLink: "আপনার Google Maps লিংকের জায়গা",
  pinned: "পিন করা লোকেশন",
  embedCode: "আপনার এম্বেড কোডের ম্যাপ",
  checking: "আপনার Google Maps লিংক চেক করা হচ্ছে…",
  dragHint: "ঠিক জায়গায় আনতে পিন টেনে নিন বা ম্যাপে ক্লিক করুন।",
  open: "Google Maps-এ খুলুন",
  remove: "ম্যাপ লোকেশন সরান",
  previewTitle: "ম্যাপ প্রিভিউ",
};

/** The site's business address and its saved map (Dashboard > Contact details). */
export type BusinessAddress = { address?: string | null; embedUrl?: string | null } | null;

export type MapLocationInputProps = {
  /** Structured location saved with the block (old blocks have none). */
  location?: MapLocation | null;
  /** The saved map URL: what renders. Old blocks have only this. */
  embedUrl?: string | null;
  /** New location and the embed URL to store ("" and null: no location). */
  onChange: (location: MapLocation | null, embedUrl: string) => void;
  /** What the map shows while no location is set (the block's or site's address). */
  fallbackAddress?: string | null;
  /** For "Use my business address". Omit to hide the button. */
  loadBusinessAddress?: () => Promise<BusinessAddress>;
  /** Map height choice, only where the block can size its map. */
  height?: { value?: number; onChange: (v: number | undefined) => void };
  labels?: Partial<MapLocationLabels>;
  className?: string;
  hideTitle?: boolean;
};

export function MapLocationInput(props: MapLocationInputProps) {
  // The key is inlined at build time, so this branch never changes between renders.
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? <WithMapsJs {...props} /> : <Editor {...props} maps="off" />;
}

function WithMapsJs(props: MapLocationInputProps) {
  const { isLoaded, loadError } = useMapsLoader();
  return <Editor {...props} maps={loadError ? "off" : isLoaded ? "ready" : "loading"} />;
}

/* ------------------------------------------------------------- lookups */

type Found = { lat: number; lng: number; label: string };
type Option = { id: string; main: string; secondary?: string; pick: () => Promise<Found | null> };

// Which Places API the key allows; found out on first use, then remembered.
let placesMode: "unknown" | "new" | "legacy" | "off" = "unknown";

function joinName(name?: string | null, address?: string | null): string {
  const n = name?.trim(), a = address?.trim();
  if (n && a) return a.toLowerCase().startsWith(n.toLowerCase()) ? a : `${n}, ${a}`;
  return n || a || "";
}

async function placesSuggest(input: string, token: { current: google.maps.places.AutocompleteSessionToken | null }): Promise<Option[] | null> {
  if (placesMode === "off" || typeof window === "undefined") return null;
  const g = window.google;
  if (!g?.maps || typeof g.maps.importLibrary !== "function") { placesMode = "off"; return null; }
  let lib: google.maps.PlacesLibrary;
  try { lib = (await g.maps.importLibrary("places")) as google.maps.PlacesLibrary; } catch { placesMode = "off"; return null; }
  if (placesMode !== "legacy" && lib.AutocompleteSuggestion) {
    try {
      token.current ??= new lib.AutocompleteSessionToken();
      const { suggestions } = await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, sessionToken: token.current });
      placesMode = "new";
      return suggestions.slice(0, 5).flatMap((s) => {
        const pr = s.placePrediction;
        if (!pr) return [];
        return [{
          id: pr.placeId,
          main: pr.mainText?.text ?? pr.text.text,
          secondary: pr.secondaryText?.text ?? undefined,
          pick: async () => {
            const place = pr.toPlace();
            await place.fetchFields({ fields: ["location", "displayName", "formattedAddress"] });
            token.current = null;
            const loc = place.location;
            return loc ? { lat: loc.lat(), lng: loc.lng(), label: joinName(place.displayName, place.formattedAddress) || pr.text.text } : null;
          },
        }];
      });
    } catch {
      if (placesMode === "new") return null; // worked before: a passing failure
    }
  }
  if (lib.AutocompleteService) {
    try {
      token.current ??= new lib.AutocompleteSessionToken();
      const { predictions } = await new lib.AutocompleteService().getPlacePredictions({ input, sessionToken: token.current });
      placesMode = "legacy";
      return predictions.slice(0, 5).map((pr) => ({
        id: pr.place_id,
        main: pr.structured_formatting?.main_text ?? pr.description,
        secondary: pr.structured_formatting?.secondary_text,
        pick: async () => {
          token.current = null;
          const res = await new g.maps.Geocoder().geocode({ placeId: pr.place_id });
          const loc = res.results[0]?.geometry?.location;
          return loc ? { lat: loc.lat(), lng: loc.lng(), label: pr.description } : null;
        },
      }));
    } catch {
      if (placesMode === "legacy") return null;
    }
  }
  placesMode = "off";
  return null;
}

/** Address words to places: the browser geocoder when the Maps script is up, else the server. */
async function geocodeText(q: string, browser: boolean): Promise<Found[] | "unavailable"> {
  if (browser && typeof window !== "undefined" && window.google?.maps?.Geocoder) {
    try {
      const res = await new window.google.maps.Geocoder().geocode({ address: q });
      const out = res.results.slice(0, 5).map((r) => ({ label: r.formatted_address, lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }));
      if (out.length) return out;
    } catch (e) {
      if ((e as { code?: string })?.code === "ZERO_RESULTS") return [];
    }
  }
  try {
    const r = await fetch(`/api/maps/geocode?q=${encodeURIComponent(q)}`);
    if (!r.ok) return "unavailable";
    const d = (await r.json()) as { status?: string; results?: Found[] };
    return d.status === "unavailable" ? "unavailable" : d.results ?? [];
  } catch {
    return "unavailable";
  }
}

async function resolveLink(url: string): Promise<{ parsed: ParsedMapLink | null; error?: "rate" | "failed" }> {
  try {
    const r = await fetch("/api/maps/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    if (r.status === 429) return { parsed: null, error: "rate" };
    if (!r.ok) return { parsed: null, error: "failed" };
    const d = (await r.json()) as { parsed?: ParsedMapLink };
    return { parsed: d.parsed && d.parsed.kind !== "short" ? d.parsed : null, error: d.parsed ? undefined : "failed" };
  } catch {
    return { parsed: null, error: "failed" };
  }
}

const round7 = (n: number) => Math.round(n * 1e7) / 1e7;
const clean = (l: MapLocation): MapLocation => {
  const out = { ...l };
  for (const k of Object.keys(out) as (keyof MapLocation)[]) if (out[k] === undefined || out[k] === "") delete out[k];
  return out;
};

/* -------------------------------------------------------------- editor */

type Maps = "off" | "loading" | "ready";
type Msg = { text: string; action?: { label: string; run: () => void } };

function Editor({ location, embedUrl, onChange, fallbackAddress, loadBusinessAddress, height, labels, className, hideTitle, maps }: MapLocationInputProps & { maps: Maps }) {
  const l = { ...MAP_LOCATION_LABELS, ...labels };
  const listId = useId();
  const saved = useMemo(() => readSavedMap(location, embedUrl), [location, embedUrl]);

  // A share link saved before this control existed: look up what it points
  // at, only to describe it. Nothing is written until the editor changes it.
  const [shortInfo, setShortInfo] = useState<{ url: string; parsed: ParsedMapLink | null } | null>(null);
  useEffect(() => {
    const url = saved.shortUrl;
    if (!url) return;
    let live = true;
    resolveLink(url).then((r) => { if (live) setShortInfo({ url, parsed: r.parsed }); });
    return () => { live = false; };
  }, [saved.shortUrl]);
  const fromShort = saved.shortUrl && shortInfo?.url === saved.shortUrl && shortInfo.parsed ? locationFromParsed(shortInfo.parsed, "link") : null;
  const current: MapLocation | null = saved.shortUrl ? fromShort : saved.location;

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[] | null>(null);
  const [fromPlaces, setFromPlaces] = useState(false);
  const [active, setActive] = useState(0);
  const [searching, setSearching] = useState(false);
  const [paste, setPaste] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [bizBusy, setBizBusy] = useState(false);
  const [msg, setMsg] = useState<Msg | null>(null);
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const seq = useRef(0);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

  const baseZoom = current?.zoom ?? (hasCoords(current) || current?.cid ? MAP_ZOOM.pin : MAP_ZOOM.address);
  const [zoomDraft, setZoomDraft] = useState<number | null>(null);
  const zoomRef = useRef<number | null>(null);
  const zoom = Math.min(MAP_ZOOM.max, Math.max(MAP_ZOOM.min, zoomDraft ?? baseZoom));

  function commit(loc: MapLocation | null, embedSrc?: string) {
    setMsg(null);
    if (!loc) { onChange(null, ""); return; }
    const next = clean(loc);
    const url = embedSrc ?? keylessEmbedUrl(next);
    // Nothing a map can show (e.g. zooming a My Maps embed): keep what is saved.
    if (url) onChange(next, url);
  }

  function closeList() { setOptions(null); setActive(0); }

  function pickFound(f: Found) {
    commit({ lat: round7(f.lat), lng: round7(f.lng), label: f.label, zoom: MAP_ZOOM.pin, source: "search" });
    setQuery(f.label);
    closeList();
  }

  async function pickOption(o: Option) {
    setSearching(true);
    try {
      const f = await o.pick();
      if (f) pickFound(f); else setMsg({ text: l.noResults });
    } catch {
      setMsg({ text: l.noResults });
    } finally {
      setSearching(false);
    }
  }

  function onType(v: string) {
    setQuery(v);
    setMsg(null);
    if (debounce.current) clearTimeout(debounce.current);
    const q = v.trim();
    if (maps !== "ready" || placesMode === "off" || q.length < 3 || looksLikeMapLink(q)) { closeList(); return; }
    const id = ++seq.current;
    debounce.current = setTimeout(async () => {
      const found = await placesSuggest(q, token);
      if (id !== seq.current) return;
      setFromPlaces(!!found);
      setOptions(found && found.length ? found : null);
      setActive(0);
    }, 300);
  }

  function mapTyped(q: string) {
    commit({ label: q, zoom: MAP_ZOOM.address, source: "search" });
  }

  async function find() {
    if (options?.length) { await pickOption(options[Math.min(active, options.length - 1)]); return; }
    await findText(query);
  }

  async function findText(text: string) {
    const q = text.trim();
    if (q.length < 2) return;
    // A link or coordinates typed into the search box work too.
    if (looksLikeMapLink(q) || parseCoordText(q)) { await applyLink(q); return; }
    seq.current++;
    setSearching(true);
    setMsg(null);
    const found = await geocodeText(q, maps === "ready");
    setSearching(false);
    const action = { label: l.useTyped.replace("{text}", q), run: () => mapTyped(q) };
    if (found === "unavailable") { setMsg({ text: l.searchOff, action }); return; }
    if (!found.length) { setMsg({ text: l.noResults, action }); return; }
    if (found.length === 1) { pickFound(found[0]); return; }
    setFromPlaces(false);
    setOptions(found.map((f, i) => ({ id: `g${i}`, main: f.label, pick: async () => f })));
    setActive(0);
  }

  async function applyLink(text: string) {
    const t = text.trim();
    if (!t) return;
    let parsed = parseGoogleMapsInput(t);
    if (!parsed) {
      // Probably an address pasted in the wrong box: offer to search it.
      const words = t.length <= 200 && !/[<>]/.test(t) ? t : "";
      setMsg({ text: l.notALink, action: words ? { label: l.searchInstead, run: () => { setPaste(""); setQuery(words); closeList(); void findText(words); } } : undefined });
      return;
    }
    if (parsed.kind === "short") {
      setLinkBusy(true);
      const r = await resolveLink(t);
      setLinkBusy(false);
      if (!r.parsed) { setMsg({ text: r.error === "rate" ? l.tooMany : l.linkFailed }); return; }
      parsed = r.parsed;
    }
    const loc = locationFromParsed(parsed, "link");
    loc.zoom ??= hasCoords(loc) || loc.cid ? MAP_ZOOM.pin : MAP_ZOOM.address;
    commit(loc, parsed.kind === "embed" ? parsed.embedSrc : undefined);
    setPaste("");
  }

  async function fillFromBusiness() {
    if (!loadBusinessAddress) return;
    setBizBusy(true);
    setMsg(null);
    try {
      const biz = await loadBusinessAddress();
      const address = biz?.address?.trim() || "";
      // The business's own map pin (Contact details) is the most exact.
      let pin = biz?.embedUrl ? parseGoogleMapsInput(biz.embedUrl) : null;
      if (pin?.kind === "short") pin = (await resolveLink(pin.shortUrl!)).parsed;
      if (pin && (hasCoords(pin) || pin.cid)) {
        commit({ ...locationFromParsed(pin, "address"), label: address || pin.label, zoom: pin.zoom ?? MAP_ZOOM.pin }, pin.kind === "embed" ? pin.embedSrc : undefined);
        return;
      }
      if (!address) { setMsg({ text: l.noBusinessAddress }); return; }
      const found = await geocodeText(address, maps === "ready");
      const first = Array.isArray(found) ? found[0] : undefined;
      commit(first
        ? { lat: round7(first.lat), lng: round7(first.lng), label: address, zoom: MAP_ZOOM.address, source: "address" }
        : { label: address, zoom: MAP_ZOOM.address, source: "address" });
    } catch {
      setMsg({ text: l.noBusinessAddress });
    } finally {
      setBizBusy(false);
    }
  }

  function onDrag(p: { lat: number; lng: number }) {
    commit({ ...(current ?? {}), lat: round7(p.lat), lng: round7(p.lng), cid: undefined, zoom, source: "pin" });
  }

  function commitZoom() {
    const z = zoomRef.current;
    zoomRef.current = null;
    setZoomDraft(null);
    if (z == null || z === baseZoom) return;
    if (current) commit({ ...current, zoom: z });
    else if (fallbackAddress?.trim()) commit({ label: fallbackAddress.trim(), zoom: z, source: "address" });
  }

  const fallback = fallbackAddress?.trim() || "";
  const src = saved.src ?? (fallback ? `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&z=15&output=embed` : undefined);
  const pinValue = useMemo(() => (hasCoords(current) ? { lat: current.lat, lng: current.lng } : null), [current?.lat, current?.lng]); // eslint-disable-line react-hooks/exhaustive-deps
  const adjustable = !!current && (hasCoords(current) || !!current.cid || !!current.label);
  const openUrl = openInGoogleMapsUrl(current ? { ...current, embedSrc: saved.embedSrc } : saved.shortUrl ? { shortUrl: saved.shortUrl } : fallback ? { label: fallback } : null);

  const status = (() => {
    if (saved.shortUrl && !current) return shortInfo ? l.shows.replace("{place}", l.placeFromLink) : l.checking;
    if (current) {
      const place = current.label || (current.cid ? l.placeFromLink : hasCoords(current) ? l.pinned : l.embedCode);
      const coords = hasCoords(current) ? ` (${current.lat.toFixed(5)}, ${current.lng.toFixed(5)})` : "";
      return l.shows.replace("{place}", `${place}${coords}`);
    }
    if (saved.src) return l.shows.replace("{place}", l.embedCode);
    if (fallback) return l.showsAddress.replace("{address}", fallback);
    return l.none;
  })();

  const frame = src ? (
    <div className="rounded-lg overflow-hidden border bg-muted" style={{ height: 180 }}>
      <iframe src={src} title={l.previewTitle} className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
    </div>
  ) : null;

  return (
    <div className={cn("space-y-2.5", className)} data-map-location-input="">
      {!hideTitle && <p className="text-[10px] font-semibold uppercase text-muted-foreground">{l.title}</p>}

      {/* 1. Search */}
      <div className="relative">
        <Label className="text-xs">{l.search}</Label>
        <div className="flex gap-1.5 mt-1">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); void find(); }
                else if (e.key === "ArrowDown" && options?.length) { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
                else if (e.key === "ArrowUp" && options?.length) { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                else if (e.key === "Escape") closeList();
              }}
              onBlur={() => setTimeout(closeList, 150)}
              placeholder={l.searchPlaceholder}
              aria-label={l.search}
              role="combobox"
              aria-expanded={!!options?.length}
              aria-controls={listId}
              aria-autocomplete="list"
              className="h-8 text-xs pl-7"
            />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => void find()} disabled={searching || query.trim().length < 2} className="h-8 text-xs px-2.5 shrink-0">
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : l.find}
          </Button>
        </div>
        {!!options?.length && (
          <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
            {options.map((o, i) => (
              <li key={o.id} role="option" aria-selected={i === active}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => void pickOption(o)}
                  className={cn("w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted", i === active && "bg-muted")}>
                  <span className="block font-medium truncate">{o.main}</span>
                  {o.secondary && <span className="block text-[10px] text-muted-foreground truncate">{o.secondary}</span>}
                </button>
              </li>
            ))}
            {fromPlaces && <li className="px-2.5 py-1 text-[9px] text-muted-foreground border-t text-right">{l.suggestionsBy}</li>}
          </ul>
        )}
      </div>

      {/* 2. Paste a link */}
      <div>
        <Label className="text-xs">{l.pasteLabel}</Label>
        <div className="flex gap-1.5 mt-1">
          <Input
            value={paste}
            onChange={(e) => { setPaste(e.target.value); setMsg(null); }}
            onPaste={(e) => {
              const t = e.clipboardData.getData("text");
              if (t.trim()) { e.preventDefault(); setPaste(t); void applyLink(t); }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyLink(paste); } }}
            placeholder={l.pastePlaceholder}
            aria-label={l.pasteLabel}
            className="h-8 text-xs min-w-0"
          />
          <Button type="button" size="sm" variant="outline" onClick={() => void applyLink(paste)} disabled={linkBusy || !paste.trim()} className="h-8 text-xs px-2.5 shrink-0">
            {linkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : l.use}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{l.pasteHint}</p>
      </div>

      {/* 3. Business address */}
      {loadBusinessAddress && (
        <Button type="button" variant="outline" size="sm" onClick={() => void fillFromBusiness()} disabled={bizBusy} className="w-full h-8 text-xs">
          {bizBusy ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Building2 className="w-3 h-3 mr-1.5" />}
          {bizBusy ? l.loading : l.business}
        </Button>
      )}

      {msg && (
        <p role="status" className="text-[10px] text-destructive">
          {msg.text}
          {msg.action && <> <button type="button" onClick={msg.action.run} className="underline text-foreground">{msg.action.label}</button></>}
        </p>
      )}

      {/* 4. Preview: draggable pin when the Maps script is available, else what visitors see. */}
      {pinValue && maps !== "off" ? (
        <div>
          <PinPickerMap value={pinValue} onChange={onDrag} center={pinValue} zoom={zoom} height={180} title={current?.label} fallback={frame} />
          <p className="text-[10px] text-muted-foreground mt-1">{l.dragHint}</p>
        </div>
      ) : frame}

      {(adjustable || (!current && !saved.src && fallback)) && (
        <div>
          <Label className="text-xs">{l.zoom}</Label>
          <input
            type="range"
            min={MAP_ZOOM.min}
            max={MAP_ZOOM.max}
            step={1}
            value={zoom}
            onChange={(e) => { const z = Number(e.target.value); zoomRef.current = z; setZoomDraft(z); }}
            onPointerUp={commitZoom}
            onKeyUp={commitZoom}
            onBlur={commitZoom}
            aria-label={l.zoom}
            className="w-full accent-[hsl(var(--primary))]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground -mt-0.5">
            <span>{l.zoomCity}</span><span>{l.zoomStreet}</span><span>{l.zoomBuilding}</span>
          </div>
        </div>
      )}

      {height && (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">{l.height}</Label>
          <Select value={height.value ? String(height.value) : "auto"} onValueChange={(v) => height.onChange(v === "auto" ? undefined : Number(v))}>
            <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto" className="text-xs">{l.heightAuto}</SelectItem>
              {MAP_HEIGHTS.map((h) => <SelectItem key={h} value={String(h)} className="text-xs">{h} px</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 5. Status */}
      <div className="rounded-md bg-muted/60 px-2 py-1.5 text-[11px] flex items-start gap-1.5" data-map-status="">
        <MapPin className="w-3.5 h-3.5 mt-px shrink-0 text-primary" />
        <span className="min-w-0 break-words">{status}</span>
      </div>
      {(openUrl || current || saved.src) && (
        <div className="flex items-center justify-between gap-2">
          {openUrl ? (
            <a href={openUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" /> {l.open}
            </a>
          ) : <span />}
          {(current || saved.src) && (
            <button type="button" onClick={() => commit(null)} className="text-[10px] text-destructive hover:underline">{l.remove}</button>
          )}
        </div>
      )}
    </div>
  );
}
