import { NextResponse } from "next/server";
import { apiUser } from "@/lib/auth/api-caller";
import { rateLimited } from "@/lib/rate-limit";
import { parseGoogleMapsInput } from "@/lib/maps/parse-google-link";
import { resolveShortLink } from "@/lib/maps/resolve-link";

/**
 * POST /api/maps/resolve { url }
 * Reads the place out of a pasted Google Maps link for the Map location
 * control. Share links (maps.app.goo.gl) are opened here on the server
 * (Google hosts only, see resolve-link.ts); every other format is parsed
 * without any network call. Signed-in dashboard users only, 30 per 10 minutes.
 */
export async function POST(req: Request) {
  const user = await apiUser(req);
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (rateLimited(`maps-resolve:${user.id}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many links checked. Please wait a few minutes." }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { url?: unknown } | null;
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url || url.length > 10000) return NextResponse.json({ error: "Paste a Google Maps link." }, { status: 400 });

  const parsed = parseGoogleMapsInput(url);
  if (!parsed) return NextResponse.json({ error: "not_google_maps" }, { status: 422 });
  if (parsed.kind !== "short") return NextResponse.json({ parsed });

  const target = await resolveShortLink(parsed.shortUrl!);
  const resolved = target ? parseGoogleMapsInput(target) : null;
  if (!resolved || resolved.kind === "short") return NextResponse.json({ error: "unreadable" }, { status: 422 });
  return NextResponse.json({ parsed: resolved });
}
