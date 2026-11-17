import "server-only";
import { validPoint } from "./parse-google-link";

/**
 * Server-side search for the Map location control when the browser has no
 * Places search (no Maps key, or the key has no Places API). Google
 * Geocoding with the same key as src/lib/marketplace/geocode.ts, up to five
 * matches with their formatted address. Best effort: "unavailable" when there
 * is no key or Google refuses, so the control can still map the typed words.
 */
export type GeoResult = { label: string; lat: number; lng: number };
export type GeoAnswer = { status: "ok" | "none" | "unavailable"; results: GeoResult[] };

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export async function geocodeSearch(
  query: string,
  opts: { region?: string | null; language?: string | null; fetchImpl?: typeof fetch } = {},
): Promise<GeoAnswer> {
  const q = query.trim();
  if (!KEY || !q) return { status: "unavailable", results: [] };
  const params = new URLSearchParams({ address: q, key: KEY });
  if (opts.region && /^[a-z]{2}$/i.test(opts.region)) params.set("region", opts.region.toLowerCase());
  if (opts.language && /^[a-z]{2}(-[A-Za-z]{2})?$/.test(opts.language)) params.set("language", opts.language);
  try {
    const res = await (opts.fetchImpl ?? fetch)(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { status: "unavailable", results: [] };
    const data = (await res.json()) as {
      status?: string;
      results?: { formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }[];
    };
    if (data.status === "ZERO_RESULTS") return { status: "none", results: [] };
    if (data.status !== "OK") return { status: "unavailable", results: [] };
    const results: GeoResult[] = [];
    for (const r of data.results ?? []) {
      const lat = r.geometry?.location?.lat, lng = r.geometry?.location?.lng;
      if (typeof lat !== "number" || typeof lng !== "number" || !validPoint(lat, lng)) continue;
      results.push({ label: r.formatted_address?.trim() || q, lat, lng });
      if (results.length === 5) break;
    }
    return { status: results.length ? "ok" : "none", results };
  } catch {
    return { status: "unavailable", results: [] };
  }
}
