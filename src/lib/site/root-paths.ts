import { createProxyClient } from "@/lib/supabase/server";
import { ROOT_TENANT_SLUG } from "@/lib/flags";

/**
 * Root-domain paths that belong to a root-site builder page or blog post
 * (passivecoder.com/blog, passivecoder.com/<post-slug>) but have no route
 * folder of their own. Without this they fell into (site)/[...slug], which
 * on the root domain has no tenant and answered "This site doesn't exist".
 * The proxy rewrites them to app/(marketing)/root-page, which renders the
 * root tenant's page with the marketing layout like /pricing does.
 *
 * Never takes a path that has a real route: the first segment is checked
 * against every top-level route folder (and public/ entry), listed at build
 * time in next.config.ts (ROOT_STATIC_SEGMENTS). Slugs are cached per server
 * instance for 60s, like the redirect rules, so page loads cost no query.
 */

const STATIC = new Set((process.env.ROOT_STATIC_SEGMENTS ?? "").split(",").filter(Boolean));
const SLUG_PATH = /^\/[A-Za-z0-9][A-Za-z0-9\-_/%]*$/;
const TTL = 60_000;

type Slugs = Map<string, number>; // slug -> go-live time (0 = published)
let cache: { at: number; slugs: Slugs; posts: Set<string> } | null = null;

async function loadSlugs(): Promise<NonNullable<typeof cache>> {
  if (cache && Date.now() - cache.at < TTL) return cache;
  const db = createProxyClient();
  const { data: hs, error: e1 } = await db.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
  if (e1) throw new Error(e1.message);
  const slugs: Slugs = new Map();
  const posts = new Set<string>();
  if (hs?.use_builder_pages) {
    const rootSlug = (hs.live_root_slug as string | null) || ROOT_TENANT_SLUG;
    const { data: t, error: e2 } = await db.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
    if (e2) throw new Error(e2.message);
    if (t?.id) {
      // Scheduled rows count from their go-live time: the page publishes
      // them (publishDueForSite) when the first visitor arrives.
      const { data: pages, error: e3 } = await db.from("pages").select("slug, status, scheduled_at, type")
        .eq("tenant_id", t.id).in("status", ["published", "scheduled"]).is("deleted_at", null).limit(5000);
      if (e3) throw new Error(e3.message);
      for (const p of pages ?? []) {
        const at = p.status === "published" ? 0 : p.scheduled_at ? Date.parse(p.scheduled_at as string) : NaN;
        if (!Number.isNaN(at)) slugs.set((p.slug as string).toLowerCase(), at);
        if (p.type === "post") posts.add((p.slug as string).toLowerCase());
      }
    }
  }
  cache = { at: Date.now(), slugs, posts };
  return cache;
}

/**
 * How the proxy routes this root-domain path: render a builder page or post
 * (`slug`, served from app/(marketing)/root-page), 301 an old /<post-slug>
 * address to /blog/<post-slug> (`redirect`), or null to leave routing alone.
 * Every /blog/<x> goes to root-page, which 404s unknown posts and shows
 * drafts/scheduled posts to signed-in members as a preview.
 */
export async function rootRouteFor(pathname: string): Promise<{ slug: string } | { redirect: string } | null> {
  if (STATIC.size === 0 || !SLUG_PATH.test(pathname)) return null;
  let key: string;
  try { key = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "").toLowerCase(); } catch { return null; }
  if (!key || key === "home" || STATIC.has(key.split("/")[0])) return null;
  let loaded: NonNullable<typeof cache>;
  try {
    loaded = await loadSlugs();
  } catch {
    // Database unreachable: keep the slugs we had, else leave routing alone.
    if (!cache) return /^blog\/[^/]+$/.test(key) ? { slug: key } : null;
    cache.at = Date.now();
    loaded = cache;
  }
  const at = loaded.slugs.get(key);
  const live = at !== undefined && at <= Date.now();
  if (live && loaded.posts.has(key)) return { redirect: `/blog/${key}` };
  if (live) return { slug: key };
  if (/^blog\/[^/]+$/.test(key)) return { slug: key };
  return null;
}
