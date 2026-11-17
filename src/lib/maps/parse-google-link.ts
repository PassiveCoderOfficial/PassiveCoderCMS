/**
 * Reads a map location out of anything a person copies from Google Maps:
 *
 *  - share links: https://maps.app.goo.gl/..., https://goo.gl/maps/...,
 *    g.page links (returned as kind "short": only the server can open them,
 *    see src/lib/maps/resolve-link.ts)
 *  - the address-bar URL of a place (/maps/place/<name>/@lat,lng,17z/data=...
 *    with the exact pin in !3d<lat>!4d<lng>), a dropped pin, a search
 *    (/maps/search/...), directions (/maps/dir/...), ?q=lat,lng, ?q=address,
 *    ?api=1&query=..., ?cid=..., on google.com or any country Google domain
 *  - the embed URL (/maps/embed?pb=..., ?output=embed) and the whole <iframe>
 *    code from Share > Embed a map (kept as-is: it already renders)
 *  - plain coordinates ("1.2838, 103.8591", 1°17'01.7"N 103°51'32.8"E) and
 *    geo: URIs.
 *
 * Pure: no network, no DOM. Shared by the settings control, the renderers and
 * the /api/maps routes. Tests: tests/maps/parse-google-link.test.ts.
 */

export type ParsedMapLink = {
  /**
   * short:  a share link that must be resolved on the server first
   * embed:  an embed URL (or iframe code): render embedSrc as it is
   * place:  a Google place (cid), maybe with its pin
   * coords: a point
   * query:  only words (a name or address) for Google to find
   */
  kind: "short" | "embed" | "place" | "coords" | "query";
  lat?: number;
  lng?: number;
  zoom?: number;
  /** Place name, address or searched words, decoded. */
  label?: string;
  /** Google Maps place id ("cid"), decimal. */
  cid?: string;
  /** The embed URL to put in the iframe unchanged. */
  embedSrc?: string;
  /** The share link to resolve (kind "short"). */
  shortUrl?: string;
};

/** google.com, www.google.com, maps.google.com and the country domains
 *  (google.ae, google.com.sg, google.co.uk, maps.google.com.bd...). */
const GOOGLE_HOST = /^(?:www\.|maps\.)?google\.(?:com|[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/;

export function isGoogleHost(hostname: string): boolean {
  return GOOGLE_HOST.test(hostname.toLowerCase());
}

/** Hosts of Google's share links (resolved by redirect on the server). */
export function isShortLinkUrl(u: URL): boolean {
  const h = u.hostname.toLowerCase();
  if (h === "maps.app.goo.gl" || h === "g.page") return u.pathname.length > 1;
  if (h === "goo.gl") return u.pathname.startsWith("/maps/");
  if (h === "g.co") return u.pathname.startsWith("/kgs/");
  return false;
}

/** Hosts the server may fetch while resolving a share link (no other host, ever). */
export function isResolveFetchHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "maps.app.goo.gl" || h === "goo.gl" || h === "g.page" || h === "g.co" || h === "consent.google.com" || isGoogleHost(h);
}

const round7 = (n: number) => Math.round(n * 1e7) / 1e7;

export function validPoint(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

const clampZoom = (z: number) => Math.min(21, Math.max(1, Math.round(z)));

/** Google's "metres across" (@lat,lng,500m and !1d in embed codes) to a zoom level. */
function metresToZoom(m: number, lat: number): number | undefined {
  if (!(m > 0)) return undefined;
  return clampZoom(Math.log2((156543.03392 * Math.cos((lat * Math.PI) / 180) * 1000) / m));
}

function decodeLabel(s: string | null | undefined): string | undefined {
  if (!s) return undefined;
  const spaced = s.replace(/\+/g, " ");
  let out = spaced;
  try { out = decodeURIComponent(spaced); } catch { /* keep the raw text */ }
  out = out.replace(/\s+/g, " ").trim();
  return out || undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

const DMS = /^(\d{1,2})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)?["″]?\s*([NS])[\s,]+(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)?["″]?\s*([EW])$/i;
const DECIMAL = /^\(?\s*(-?\d{1,2}(?:\.\d+)?)\s*(?:,\s*|\s+)(-?\d{1,3}(?:\.\d+)?)\s*\)?$/;

/**
 * Coordinates typed or copied as text: "1.2838, 103.8591", "1.2838 103.8591",
 * "loc:1.2838+103.8591", "1.2838,103.8591 (Head office)", DMS. Whole string only.
 */
export function parseCoordText(text: string | null | undefined): { lat: number; lng: number; label?: string } | null {
  if (!text) return null;
  let t = text.trim().replace(/^loc:\s*/i, "");
  let label: string | undefined;
  const named = t.match(/^(.*?\d)\s*\(([^()]+)\)\s*$/);
  if (named) { t = named[1]; label = named[2].trim() || undefined; }
  const d = t.match(DECIMAL);
  if (d) {
    const lat = Number(d[1]), lng = Number(d[2]);
    return validPoint(lat, lng) ? { lat: round7(lat), lng: round7(lng), ...(label ? { label } : {}) } : null;
  }
  const m = t.match(DMS);
  if (m) {
    const part = (deg: string, min: string, sec: string | undefined, hemi: string) =>
      (Number(deg) + Number(min) / 60 + Number(sec ?? 0) / 3600) * (/[SW]/i.test(hemi) ? -1 : 1);
    const lat = part(m[1], m[2], m[3], m[4]), lng = part(m[5], m[6], m[7], m[8]);
    return validPoint(lat, lng) ? { lat: round7(lat), lng: round7(lng), ...(label ? { label } : {}) } : null;
  }
  return null;
}

/** "@1.2838,103.8591,17z" / ",500m" / ",3a,75y,90t" (street view). */
function parseAt(seg: string): { lat: number; lng: number; zoom?: number } | null {
  const m = seg.match(/^@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:,(\d+(?:\.\d+)?)([zm]))?/);
  if (!m) return null;
  const lat = Number(m[1]), lng = Number(m[2]);
  if (!validPoint(lat, lng)) return null;
  const zoom = m[3] ? (m[4] === "z" ? clampZoom(Number(m[3])) : metresToZoom(Number(m[3]), lat)) : undefined;
  return { lat: round7(lat), lng: round7(lng), ...(zoom ? { zoom } : {}) };
}

function cidFromFtid(hex: string): string | undefined {
  try {
    const n = BigInt(hex);
    return n > BigInt(0) ? n.toString() : undefined;
  } catch {
    return undefined;
  }
}

const validCid = (s: string | null | undefined) => (s && /^\d{1,20}$/.test(s) && !/^0+$/.test(s) ? s : undefined);

/** The raw (still encoded) value of a query parameter. */
function rawParam(search: string, name: string): string | null {
  const m = search.match(new RegExp(`[?&]${name}=([^&#]*)`));
  return m ? m[1] : null;
}

/** Embed codes ("pb"): camera !1d<metres>!2d<lng>!3d<lat>, place !1s<ftid>!2s<name>, mfe !4s<cid> / !6i<zoom>. */
function readPb(pb: string): Partial<ParsedMapLink> {
  const out: Partial<ParsedMapLink> = {};
  const cam = pb.match(/!2d(-?\d{1,3}(?:\.\d+)?)!3d(-?\d{1,2}(?:\.\d+)?)/);
  if (cam) {
    const lng = Number(cam[1]), lat = Number(cam[2]);
    if (validPoint(lat, lng)) { out.lat = round7(lat); out.lng = round7(lng); }
  }
  const dist = pb.match(/!1d(\d+(?:\.\d+)?)/);
  if (dist && out.lat != null) out.zoom = metresToZoom(Number(dist[1]), out.lat);
  const z = pb.match(/!6i(\d{1,2})/);
  if (z) out.zoom = clampZoom(Number(z[1]));
  const place = pb.match(/!1s0x[0-9a-f]+(?::|%3A)(0x[0-9a-f]+)!2s([^!]*)/i);
  if (place) { out.cid = cidFromFtid(place[1]); out.label = decodeLabel(place[2]); }
  const cid = pb.match(/!4s(\d{1,20})(?:!|$)/);
  if (!out.cid && cid) out.cid = validCid(cid[1]);
  // Google's own redirect target for ?q=...&output=embed: !2m1!1s<query>.
  const search = pb.match(/!2m1!1s([^!]+)/);
  if (search && out.lat == null && !out.label) {
    const words = decodeLabel(search[1]);
    const point = parseCoordText(words);
    if (point) { out.lat = point.lat; out.lng = point.lng; } else out.label = words;
  }
  return out;
}

function lastPin(href: string): { lat: number; lng: number } | null {
  let found: { lat: number; lng: number } | null = null;
  for (const m of href.matchAll(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/g)) {
    const lat = Number(m[1]), lng = Number(m[2]);
    if (validPoint(lat, lng)) found = { lat: round7(lat), lng: round7(lng) };
  }
  return found;
}

const cleanTrailing = (u: string) => {
  let s = u.replace(/[.,;:!?'"]+$/, "");
  while (s.endsWith(")") && (s.match(/\(/g)?.length ?? 0) < (s.match(/\)/g)?.length ?? 0)) s = s.slice(0, -1);
  return s;
};

/** First URL in a pasted text ("Shop name\nhttps://maps.app.goo.gl/..." from a phone share). */
function findUrl(text: string): string | null {
  // A whole URL as pasted (dropped-pin names keep a raw ' for minutes).
  if (/^https?:\/\/\S+$/i.test(text)) return text;
  const full = text.match(/https?:\/\/[^\s"<>]+/i);
  if (full) return cleanTrailing(full[0]);
  const bare = text.match(/(?:^|[\s(])((?:www\.|maps\.)?google\.[a-z.]{2,10}\/[^\s"<>]*|maps\.app\.goo\.gl\/[^\s"<>]+|goo\.gl\/maps\/[^\s"<>]+|g\.page\/[^\s"<>]+)/i);
  return bare ? cleanTrailing(bare[1]) : null;
}

function finish(p: Omit<ParsedMapLink, "kind"> & { embed?: boolean }): ParsedMapLink | null {
  const { embed, ...rest } = p;
  const out: ParsedMapLink = { kind: "query", ...rest };
  for (const k of Object.keys(out) as (keyof ParsedMapLink)[]) if (out[k] === undefined) delete out[k];
  if (embed && out.embedSrc) out.kind = "embed";
  else if (out.cid) out.kind = "place";
  else if (out.lat != null && out.lng != null) out.kind = "coords";
  else if (out.label) out.kind = "query";
  else return null;
  return out;
}

function parseUrl(raw: string): ParsedMapLink | null {
  let s = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = `https://${s}`;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password || u.port) return null;
  if (isShortLinkUrl(u)) {
    u.protocol = "https:";
    u.hash = "";
    return { kind: "short", shortUrl: u.href };
  }
  const host = u.hostname.toLowerCase();
  if (!isGoogleHost(host)) return null;

  const path = u.pathname;
  const params = u.searchParams;
  const isMaps = path === "/maps" || path.startsWith("/maps/") || (host.startsWith("maps.") && (path === "/" || path === ""));
  const isWebSearch = path === "/search";
  if (!isMaps && !isWebSearch) return null;

  // Google My Maps: the viewer / editor page becomes its embed.
  const myMaps = path.match(/^\/maps\/d\/(?:u\/\d+\/)?(viewer|edit|view|embed)$/);
  if (myMaps) {
    const mid = params.get("mid");
    if (!mid || !/^[\w-]+$/.test(mid)) return null;
    if (myMaps[1] === "embed") return finish({ embed: true, embedSrc: s });
    return finish({ embed: true, embedSrc: `https://www.google.com/maps/d/embed?mid=${mid}` });
  }

  const output = params.get("output");
  const embed = /^\/maps\/embed(?:\/|$)/.test(path) || output === "embed" || output === "svembed";

  const pbRaw = rawParam(u.search, "pb");
  const pb = pbRaw ? readPb(pbRaw) : {};

  const segs = path.split("/").filter(Boolean);
  const at = segs.find((x) => x.startsWith("@"));
  const viewport = at ? parseAt(at) : null;
  const after = (word: string) => {
    const i = segs.indexOf(word);
    const v = i >= 0 ? segs[i + 1] : undefined;
    return v && !v.startsWith("@") && !v.startsWith("data=") ? decodeLabel(v) : undefined;
  };
  const placeName = after("place");
  const searchText = after("search");
  const dirAt = segs.indexOf("dir");
  const dirStops = dirAt >= 0 ? segs.slice(dirAt + 1).filter((x) => !x.startsWith("@") && !x.startsWith("data=")).map((x) => decodeLabel(x)).filter(Boolean) as string[] : [];
  const destination = dirStops[dirStops.length - 1];

  const q = params.get("q") ?? params.get("query") ?? params.get("daddr") ?? params.get("destination") ?? undefined;
  const qText = q?.replace(/\s+/g, " ").trim() || undefined;
  const qPoint = parseCoordText(qText);
  const placePoint = parseCoordText(placeName);
  const searchPoint = parseCoordText(searchText);
  const destPoint = parseCoordText(destination);
  const llPoint = parseCoordText(params.get("ll") ?? params.get("center") ?? params.get("sll"));
  const pin = lastPin(u.href);

  // The place's feature id (only on place pages: directions and searches can
  // carry other places' ids).
  const ftid = segs[1] === "place" ? u.href.match(/!1s0x[0-9a-f]+(?::|%3A)(0x[0-9a-f]+)/i) : null;
  const cid = validCid(params.get("cid")) ?? (ftid ? cidFromFtid(ftid[1]) : undefined) ?? pb.cid;

  // Exact pin first, then coordinates written as words, then the camera.
  const nameIsWords = !!placeName && !placePoint;
  const point = pin ?? qPoint ?? placePoint ?? searchPoint ?? destPoint ?? (pb.lat != null ? { lat: pb.lat, lng: pb.lng! } : null)
    ?? (!qText ? llPoint : null)
    ?? (viewport && (nameIsWords || (!searchText && !destination && !qText)) ? viewport : null);

  const label = (nameIsWords ? placeName : undefined)
    ?? (qText && !qPoint && !/^place_id:/i.test(qText) ? qText : qPoint?.label)
    ?? (searchText && !searchPoint ? searchText : undefined)
    ?? (destination && !destPoint ? destination : undefined)
    ?? pb.label ?? placePoint?.label;

  const z = Number(params.get("z") ?? params.get("zoom"));
  const zoom = Number.isFinite(z) && z > 0 ? clampZoom(z) : viewport?.zoom ?? pb.zoom;

  return finish({
    embed,
    embedSrc: embed ? s : undefined,
    lat: point?.lat, lng: point?.lng, zoom, label, cid,
  });
}

function parseIframe(code: string): ParsedMapLink | null {
  const m = code.match(/<iframe[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const src = m ? decodeEntities(m[1] ?? m[2] ?? m[3] ?? "").trim() : "";
  if (!src) return null;
  const p = parseUrl(src);
  if (!p || p.kind === "short") return null;
  // An iframe always holds an embed: render its src even when the URL itself
  // does not say output=embed.
  return { ...p, kind: "embed", embedSrc: src };
}

/** geo:1.28,103.85?z=17, geo:0,0?q=1.28,103.85(Label), geo:0,0?q=Some+address */
function parseGeoUri(uri: string): ParsedMapLink | null {
  const m = uri.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:[;,][^?]*)?(?:\?(.*))?$/i);
  if (!m) return null;
  const params = new URLSearchParams(m[3] ?? "");
  const z = Number(params.get("z"));
  const zoom = Number.isFinite(z) && z > 0 ? clampZoom(z) : undefined;
  const q = params.get("q")?.trim();
  const qPoint = parseCoordText(q);
  const lat = Number(m[1]), lng = Number(m[2]);
  const point = qPoint ?? (validPoint(lat, lng) ? { lat: round7(lat), lng: round7(lng) } : null);
  return finish({ lat: point?.lat, lng: point?.lng, zoom, label: qPoint ? qPoint.label : q || undefined });
}

/** Parse whatever was pasted or saved. Null: not a Google Maps link or location. */
export function parseGoogleMapsInput(input: string | null | undefined): ParsedMapLink | null {
  const text = (input ?? "").trim();
  if (!text || text.length > 10000) return null;
  if (/<iframe/i.test(text)) return parseIframe(text);
  if (/^geo:/i.test(text)) return parseGeoUri(text);
  const point = parseCoordText(text);
  if (point) return finish({ ...point });
  const url = findUrl(text);
  return url ? parseUrl(url) : null;
}

/** True when a saved text should be read as a link rather than words to search. */
export function looksLikeMapLink(text: string | null | undefined): boolean {
  if (!text) return false;
  return /<iframe/i.test(text) || /^\s*(?:https?:\/\/|www\.google\.|maps\.google\.|google\.[a-z.]{2,10}\/|maps\.app\.goo\.gl\/|goo\.gl\/maps\/|g\.page\/|geo:)/i.test(text);
}
