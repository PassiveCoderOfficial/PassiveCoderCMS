// Server-side Google Geocoding for the marketplace module — generic version
// of src/lib/donors/geocode.ts (that one hardcodes region=bd/Bangladesh for
// the blood-donor module; this one takes an optional region hint so it works
// for any marketplace tenant's country, e.g. Singapore). Same key, same
// best-effort/null-on-failure contract.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export async function geocodeAddress(
  address: string,
  regionHint?: string, // ISO 3166-1 alpha-2, e.g. "sg"
): Promise<{ lat: number; lng: number } | null> {
  if (!KEY || !address.trim()) return null;

  try {
    const params = new URLSearchParams({ address, key: KEY });
    if (regionHint) params.set("region", regionHint);
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const loc = data?.results?.[0]?.geometry?.location;
    if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
      return { lat: loc.lat, lng: loc.lng };
    }
    return null;
  } catch {
    return null;
  }
}
