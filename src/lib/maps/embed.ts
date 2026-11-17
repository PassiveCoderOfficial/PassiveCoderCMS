/**
 * Turning a saved map (URL, embed code or MapLocation) into the iframe src
 * visitors get, and the "open in Google Maps" link. Pure: used by the
 * renderers (Contact block, Visit + Map banner via mapLinks, Embed block) and
 * by the Map location control. Tests: tests/maps/parse-google-link.test.ts.
 *
 * Every map is a keyless Google embed (https://www.google.com/maps?...&output=embed),
 * the format all saved blocks already use, so no API key is needed to show one.
 */
import { hasCoords, type MapLocation, type MapLocationSource } from "./location";
import { looksLikeMapLink, parseGoogleMapsInput, type ParsedMapLink } from "./parse-google-link";

/** Up to 6 decimals (about 10 cm), no trailing zeros. */
export const formatCoord = (n: number) => String(Math.round(n * 1e6) / 1e6);

type Where = { lat?: number; lng?: number; label?: string; cid?: string; zoom?: number };

/**
 * Keyless embed for a location: the business card when there is a Google
 * place id (cid), else the pin, else the words for Google to find.
 */
export function keylessEmbedUrl(l: Where | null | undefined): string | null {
  if (!l) return null;
  const z = typeof l.zoom === "number" && Number.isFinite(l.zoom) ? `&z=${Math.round(l.zoom)}` : "";
  if (l.cid && /^\d{1,20}$/.test(l.cid)) return `https://www.google.com/maps?cid=${l.cid}${z}&output=embed`;
  if (hasCoords(l)) return `https://www.google.com/maps?q=${formatCoord(l.lat)},${formatCoord(l.lng)}${z}&output=embed`;
  const words = l.label?.trim();
  return words ? `https://www.google.com/maps?q=${encodeURIComponent(words)}${z}&output=embed` : null;
}

/**
 * A share link (maps.app.goo.gl) saved before the control existed: only the
 * server can open it, so the iframe goes through /api/maps/embed, which
 * redirects to the place (or to the address map if the link is dead).
 */
export function shortLinkEmbedPath(shortUrl: string, fallbackQuery?: string | null): string {
  const qs = new URLSearchParams({ u: shortUrl });
  if (fallbackQuery?.trim()) qs.set("a", fallbackQuery.trim());
  return `/api/maps/embed?${qs.toString()}`;
}

/**
 * The iframe src for a block's saved map value.
 *
 * Byte-for-byte rule: whatever renders today keeps rendering exactly the same
 * string: an embed URL (Google's own or anyone's), or any saved text that
 * contains "embed" and is not a Google Maps link. What changes (deliberate
 * fix): a Google Maps page link, share link or <iframe> code used to be
 * ignored or broken and now shows its place.
 *
 * Undefined: nothing usable; the caller shows the address map as before.
 */
export function mapEmbedSrc(
  saved: string | null | undefined,
  location?: MapLocation | null,
  opts: { fallbackQuery?: string | null } = {},
): string | undefined {
  if (saved && saved.trim()) {
    const p = parseGoogleMapsInput(saved);
    if (!p) return saved.includes("embed") ? saved : undefined;
    if (p.kind === "embed") return p.embedSrc === saved.trim() ? saved : p.embedSrc;
    if (p.kind === "short") return shortLinkEmbedPath(p.shortUrl!, opts.fallbackQuery);
    return keylessEmbedUrl(p) ?? (saved.includes("embed") ? saved : undefined);
  }
  return keylessEmbedUrl(location) ?? undefined;
}

/** "Open in Google Maps" / directions link for a parsed link or a location. */
export function openInGoogleMapsUrl(p: Where & { shortUrl?: string; embedSrc?: string } | null | undefined): string | null {
  if (!p) return null;
  if (p.shortUrl) return p.shortUrl;
  if (p.cid && /^\d{1,20}$/.test(p.cid)) return `https://www.google.com/maps?cid=${p.cid}`;
  if (hasCoords(p)) return `https://www.google.com/maps/search/?api=1&query=${formatCoord(p.lat)}%2C${formatCoord(p.lng)}`;
  if (p.label?.trim()) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.label.trim())}`;
  if (p.embedSrc?.includes("/maps/d/embed")) return p.embedSrc.replace("/maps/d/embed", "/maps/d/viewer");
  return null;
}

/**
 * Embed + link for a saved text that is a Google Maps link or embed code.
 * Null for plain words (an address, a business name, "1.28,103.85"), which
 * keep their current search behaviour in mapLinks().
 */
export function googleMapLinks(text: string | null | undefined, opts: { fallbackQuery?: string | null } = {}): { link: string; embed: string } | null {
  if (!looksLikeMapLink(text)) return null;
  const p = parseGoogleMapsInput(text);
  if (!p) return null;
  const embed = mapEmbedSrc(text, null, opts);
  if (!embed) return null;
  return { link: openInGoogleMapsUrl(p) ?? "https://www.google.com/maps", embed };
}

const clean = <T extends Record<string, unknown>>(o: T): T => {
  for (const k of Object.keys(o)) if (o[k] === undefined || o[k] === "") delete o[k];
  return o;
};

export function locationFromParsed(p: ParsedMapLink, source: MapLocationSource): MapLocation {
  return clean({ lat: p.lat, lng: p.lng, label: p.label, zoom: p.zoom, cid: p.cid, source });
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-5;

/**
 * What a block's saved map currently is, for the control: the structured
 * location when it matches the saved URL (it carries the place name), else
 * what the URL itself says. The URL wins on a mismatch because it is what
 * renders (the phone app and the AI connector edit only the URL).
 */
export function readSavedMap(
  location: MapLocation | null | undefined,
  embedUrl: string | null | undefined,
): { location: MapLocation | null; src?: string; shortUrl?: string; embedSrc?: string } {
  const loc: MapLocation | null = location && (hasCoords(location) || location.cid || location.label) ? location : null;
  const saved = embedUrl?.trim();
  if (!saved) return { location: loc, src: keylessEmbedUrl(loc) ?? undefined };
  const src = mapEmbedSrc(embedUrl, loc);
  const p = parseGoogleMapsInput(saved);
  if (!p) return { location: loc, src };
  if (p.kind === "short") return { location: loc, src, shortUrl: p.shortUrl };
  const fromUrl = locationFromParsed(p, "link");
  const locLabel = loc?.label; // read before hasCoords() narrows loc below
  const same = !!loc && (
    keylessEmbedUrl(loc) === saved
    || (!!loc.cid && loc.cid === fromUrl.cid)
    || (hasCoords(loc) && hasCoords(fromUrl) && near(loc.lat, fromUrl.lat) && near(loc.lng, fromUrl.lng))
    || (!hasCoords(fromUrl) && !fromUrl.cid && !!locLabel && locLabel === fromUrl.label)
  );
  const embedSrc = p.kind === "embed" ? p.embedSrc : undefined;
  return { location: same ? { ...fromUrl, ...loc } : fromUrl, src, ...(embedSrc ? { embedSrc } : {}) };
}
