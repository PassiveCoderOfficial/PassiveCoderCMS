// Server-side Google Geocoding — turn a donor's area/thana/district into
// approximate coordinates when they didn't drop a map pin, so they still
// appear on the map and survive map-viewport filtering. Uses the same
// Google Maps key (server-side calls are allowed without HTTP-referrer
// restrictions). Returns null on any failure — geocoding is best-effort.

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export async function geocodeBdArea(parts: {
  area?: string | null; police_station?: string | null; district?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  if (!KEY) return null;
  const address = [parts.area, parts.police_station, parts.district, "Bangladesh"]
    .filter(Boolean).join(", ");
  if (address === "Bangladesh") return null; // nothing to geocode

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=bd&key=${KEY}`;
    const res = await fetch(url);
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
