/**
 * Stock imagery for generated sections.
 *
 * AiCoder writes copy, not photographs, but a generated page with empty image
 * slots reads as unfinished — briefs routinely ask for "large professional
 * imagery". This module turns a section's subject into a real photo URL.
 *
 * Two providers, chosen by what is configured rather than by preference:
 *
 *   Pexels    — used when PEXELS_API_KEY is set. Real search, relevant
 *               results, generous free tier (200 req/hour).
 *   Picsum    — keyless fallback. Returns a deterministic photo per seed, so
 *               the page looks composed rather than broken, but the image is
 *               NOT subject-relevant. This is a placeholder that happens to be
 *               a photograph, and is labelled as such in the UI.
 *
 * The distinction matters and is surfaced to the caller via `relevant`: a
 * tenant should know whether they are looking at a picture of their trade or a
 * neutral stand-in they need to replace.
 */

export interface StockImage {
  url: string;
  alt: string;
  credit?: string;
  creditUrl?: string;
  /** False when the image is a neutral placeholder rather than a real match
   *  for the query — the UI tells the user to swap these out. */
  relevant: boolean;
}

const PEXELS_URL = "https://api.pexels.com/v1/search";

/**
 * Finds one photo for a search phrase. Never throws — imagery is decorative,
 * and a failed image lookup must not lose the copy that was generated
 * alongside it (which the tenant paid a generation for).
 */
export async function findStockImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish" = "landscape",
): Promise<StockImage | null> {
  const key = process.env.PEXELS_API_KEY;

  if (key) {
    try {
      const params = new URLSearchParams({
        query: query.slice(0, 100),
        per_page: "1",
        orientation,
      });
      const res = await fetch(`${PEXELS_URL}?${params}`, {
        headers: { Authorization: key },
      });

      if (res.ok) {
        const data = await res.json() as {
          photos?: {
            src?: { landscape?: string; large?: string; portrait?: string };
            alt?: string;
            photographer?: string;
            photographer_url?: string;
          }[];
        };
        const photo = data.photos?.[0];
        const url = orientation === "portrait"
          ? photo?.src?.portrait ?? photo?.src?.large
          : photo?.src?.landscape ?? photo?.src?.large;

        if (url) {
          return {
            url,
            alt: photo?.alt || query,
            credit: photo?.photographer,
            creditUrl: photo?.photographer_url,
            relevant: true,
          };
        }
      }
    } catch {
      // Fall through to the keyless placeholder.
    }
  }

  return placeholderImage(query, orientation);
}

/**
 * A deterministic photographic placeholder.
 *
 * Seeded by the query so the same section always gets the same picture —
 * regenerating a page shouldn't reshuffle every image, and two different
 * sections shouldn't collide on one photo.
 */
function placeholderImage(
  query: string,
  orientation: "landscape" | "portrait" | "squarish",
): StockImage {
  const seed = encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "section");
  const [w, h] = orientation === "portrait" ? [800, 1200]
    : orientation === "squarish" ? [900, 900]
    : [1600, 900];

  return {
    url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
    alt: query,
    relevant: false,
  };
}

/** True when real subject-matched search is available. Surfaced in the UI so
 *  the difference between "a photo of your trade" and "a neutral stand-in" is
 *  visible rather than something the user discovers on their published site. */
export function hasRelevantImageSearch(): boolean {
  return !!process.env.PEXELS_API_KEY;
}

/** Resolves several queries at once. Concurrent because these are independent
 *  third-party reads with no quota interaction, unlike model calls. */
export async function findStockImages(
  queries: { query: string; orientation?: "landscape" | "portrait" | "squarish" }[],
): Promise<(StockImage | null)[]> {
  return Promise.all(
    queries.map(q => findStockImage(q.query, q.orientation ?? "landscape")),
  );
}
