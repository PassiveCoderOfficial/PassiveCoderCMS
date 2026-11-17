import "server-only";
import { isGoogleHost, isResolveFetchHost, isShortLinkUrl } from "./parse-google-link";

/**
 * Opens a Google share link (https://maps.app.goo.gl/..., goo.gl/maps,
 * g.page) on the server and returns the Google Maps URL it redirects to.
 *
 * SSRF-safe by construction: redirects are followed by hand
 * (redirect: "manual"), every hop must be https on a Google host from the
 * allow-list (isResolveFetchHost: the share-link hosts, google.com and the
 * country Google domains), no ports, no user info, at most `maxHops` hops and
 * one overall timeout. Google Maps pages themselves are never fetched: once a
 * hop points at one, its URL is the answer (it carries the place).
 */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

const UA = "Mozilla/5.0 (compatible; PassiveCoder-Maps/1.0; +https://passivecoder.com)";

function arrived(u: URL): boolean {
  if (!isGoogleHost(u.hostname) || isShortLinkUrl(u)) return false;
  return u.pathname === "/maps" || u.pathname.startsWith("/maps/") || u.pathname === "/search" || u.searchParams.has("cid")
    || (u.hostname.toLowerCase().startsWith("maps.") && u.pathname === "/");
}

export async function resolveShortLink(
  shortUrl: string,
  opts: { fetchImpl?: FetchLike; timeoutMs?: number; maxHops?: number } = {},
): Promise<string | null> {
  const fetchImpl: FetchLike = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  const deadline = Date.now() + (opts.timeoutMs ?? 6000);
  const maxHops = opts.maxHops ?? 5;
  let current: URL;
  try { current = new URL(shortUrl); } catch { return null; }

  for (let hop = 0; hop <= maxHops; hop++) {
    if (current.protocol === "http:") current.protocol = "https:";
    if (current.protocol !== "https:" || current.username || current.password || current.port) return null;
    if (!isResolveFetchHost(current.hostname)) return null;
    if (arrived(current)) return current.href;
    // EU consent wall: the real target is in ?continue=.
    if (current.hostname.toLowerCase() === "consent.google.com") {
      const next = current.searchParams.get("continue");
      if (!next) return null;
      try { current = new URL(next); } catch { return null; }
      continue;
    }
    if (hop === maxHops) return null;
    const left = deadline - Date.now();
    if (left <= 0) return null;
    let res: Response;
    try {
      res = await fetchImpl(current.href, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(left),
        headers: { "user-agent": UA, "accept-language": "en" },
      });
    } catch {
      return null;
    }
    try { await res.body?.cancel(); } catch { /* nothing to free */ }
    const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    if (!location) return null;
    try { current = new URL(location, current); } catch { return null; }
  }
  return null;
}
