/**
 * Media on the site's own domain: files live in Supabase storage, but pages
 * reference them as /media/... on whatever domain the visitor is on
 * (example.com/media/uploads/...), which next.config rewrites to the
 * bucket. Better for branding and SEO (image search credits the site), and
 * free (no Supabase custom-domain add-on). Applied at render time only, so
 * stored URLs and the editor are unchanged.
 */
const SUPABASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
export const STORAGE_PREFIX = `${SUPABASE}/storage/v1/object/public/media/`;

export function siteMediaUrl(url: string): string {
  return SUPABASE && url.startsWith(STORAGE_PREFIX) ? `/media/${url.slice(STORAGE_PREFIX.length)}` : url;
}

/** Deep copy of any JSON value with storage URLs swapped for /media/ paths. */
export function withSiteMedia<T>(value: T): T {
  if (!SUPABASE || value == null) return value;
  const json = JSON.stringify(value);
  return json.includes(STORAGE_PREFIX) ? (JSON.parse(json.split(STORAGE_PREFIX).join("/media/")) as T) : value;
}
