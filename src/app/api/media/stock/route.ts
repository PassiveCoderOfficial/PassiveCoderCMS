import { NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";

/**
 * Stock photo search for the media picker (mobile app "Stock photos" tab):
 * GET ?q=plumber&page=1 -> { photos: [{ url, thumb, alt, credit, creditUrl }], hasMore }.
 * Pexels, same provider AiCoder uses (PEXELS_API_KEY); without a key the
 * list is empty and the app hides the tab.
 */
export async function GET(req: Request) {
  const caller = await getApiCaller(req);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = process.env.PEXELS_API_KEY;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  if (!key) return NextResponse.json({ photos: [], hasMore: false, available: false });
  if (!q) return NextResponse.json({ photos: [], hasMore: false, available: true });

  const params = new URLSearchParams({ query: q, per_page: "24", page: String(page) });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ photos: [], hasMore: false, available: true });
  const data = (await res.json()) as {
    photos?: { id: number; alt?: string; photographer?: string; photographer_url?: string; src?: { large?: string; large2x?: string; medium?: string; small?: string } }[];
    next_page?: string;
  };
  const photos = (data.photos ?? []).map((p) => ({
    id: String(p.id),
    url: p.src?.large2x ?? p.src?.large ?? "",
    thumb: p.src?.medium ?? p.src?.small ?? p.src?.large ?? "",
    alt: p.alt ?? "",
    credit: p.photographer ?? "",
    creditUrl: p.photographer_url ?? "",
  })).filter((p) => p.url);
  return NextResponse.json({ photos, hasMore: !!data.next_page, available: true });
}
