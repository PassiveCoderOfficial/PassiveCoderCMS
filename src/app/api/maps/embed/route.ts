import { clientIp, rateLimited } from "@/lib/rate-limit";
import { parseGoogleMapsInput } from "@/lib/maps/parse-google-link";
import { resolveShortLink } from "@/lib/maps/resolve-link";
import { keylessEmbedUrl } from "@/lib/maps/embed";

/**
 * GET /api/maps/embed?u=<Google share link>&a=<address>
 * Public iframe src for a map whose saved value is a share link
 * (https://maps.app.goo.gl/...), which only a server can open. Redirects to
 * the place's keyless Google embed; when the link cannot be read, to the
 * address map the block showed before (a), else 404.
 *
 * Only share links are accepted (anything else is parsed in the page, no
 * request needed). Answers are cached at the edge for a week, so a page view
 * normally never reaches this code.
 */
const ADDRESS_ZOOM = 15;

function redirect(location: string, maxAge: number) {
  return new Response(null, {
    status: 302,
    headers: { Location: location, "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge * 7}, stale-while-revalidate=2592000` },
  });
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const u = (params.get("u") ?? "").slice(0, 2000);
  const a = (params.get("a") ?? "").trim().slice(0, 500);
  // Same URL mapLinks() builds for the address (the map shown before this route existed).
  const fallback = () => a
    ? redirect(`https://www.google.com/maps?q=${encodeURIComponent(a)}&z=${ADDRESS_ZOOM}&output=embed`, 600)
    : new Response("Map not available", { status: 404, headers: { "Cache-Control": "public, max-age=600", "Content-Type": "text/plain; charset=utf-8" } });

  const parsed = parseGoogleMapsInput(u);
  if (!parsed || parsed.kind !== "short") return fallback();
  if (rateLimited(`maps-embed:${clientIp(req)}`, 120, 10 * 60_000)) return fallback();

  const target = await resolveShortLink(parsed.shortUrl!);
  const place = target ? parseGoogleMapsInput(target) : null;
  if (!place || place.kind === "short") return fallback();
  const src = place.kind === "embed" ? place.embedSrc : keylessEmbedUrl(place);
  return src ? redirect(src, 86400) : fallback();
}
