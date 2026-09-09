import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { Metadata } from "next";

/** The one real Passive Coder icon file. Every CMS-own surface (dashboard,
 *  login, staff/super-admin panels — none of which are tenant-facing) uses
 *  this directly; nothing tenant-facing may fall back to it, see
 *  resolveSiteMetadata below. */
export const PLATFORM_FAVICON = "/branding/passivecoder-icon.png";
export const PLATFORM_ICONS = { icon: PLATFORM_FAVICON, shortcut: PLATFORM_FAVICON, apple: PLATFORM_FAVICON };

/**
 * One shared resolver for a tenant's page-metadata (title, description,
 * favicon, OG/twitter image) — the SAME data (site_name, favicon_url,
 * logo_url, tagline, meta_description) was being read and defaulted
 * separately in every route-group layout, most completely in
 * (site)/layout.tsx and only partially everywhere else. (marketing)'s own
 * tenant branch, for instance, resolved a favicon but never set a
 * description at all, so a tenant's homepage silently inherited the
 * platform's own "Modern CMS built with Next.js and Supabase" — and every
 * layout (including the ones that never see a tenant, like (admin)/(auth))
 * separately hardcoded the same "/branding/passivecoder-icon.png" fallback
 * string.
 *
 * Root bug this fixes: 28 of 34 tenants (checked 2026-09-09) have never
 * uploaded a favicon, so their real client site showed Passive Coder's own
 * icon in the browser tab — the vendor's branding on the client's site.
 * Falling back to the platform icon was arguably "correct" per the old
 * per-file logic, but it's the wrong DEFAULT: a client's site should never
 * show their SaaS vendor's icon. This resolver generates a small coded
 * favicon (first letter of the site name on a color badge) instead, same
 * idea as BrandLogo's existing coded-SVG fallback for tenants with no
 * uploaded logo — only the platform's OWN marketing site (no tenantId) still
 * uses the real Passive Coder icon.
 */

export interface ResolvedSiteMetadata {
  siteName: string;
  description: string | undefined;
  faviconUrl: string;
  ogImage: string | undefined;
}

const firstNonEmpty = (...vals: (string | null | undefined)[]) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim();

/** Small coded favicon — first letter of the site name on a rounded color
 *  badge, no asset pipeline needed. Deterministic color from the name so
 *  the same tenant always gets the same badge rather than a random one on
 *  every request. Mirrors BrandLogo's own "no upload yet" fallback design. */
function autoFavicon(siteName: string): string {
  const letter = (siteName.trim()[0] ?? "?").toUpperCase();
  const palette = ["#2563EB", "#DC2626", "#059669", "#D97706", "#7C3AED", "#DB2777", "#0891B2"];
  let hash = 0;
  for (let i = 0; i < siteName.length; i++) hash = (hash * 31 + siteName.charCodeAt(i)) >>> 0;
  const color = palette[hash % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="44" font-family="system-ui,sans-serif" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Resolves a tenant's site metadata from site_identity + site_settings (both
 * are real write targets — Templates > Header/Footer writes identity,
 * Settings writes site_settings — reading only one silently drops whatever
 * was set on the other screen). Pass null/undefined tenantId for the
 * platform's own marketing site, which gets the real Passive Coder branding.
 */
export async function resolveSiteMetadata(tenantId: string | null | undefined): Promise<ResolvedSiteMetadata> {
  if (!tenantId) {
    return {
      siteName: "Passive Coder",
      description: "Modern CMS built with Next.js and Supabase",
      faviconUrl: PLATFORM_FAVICON,
      ogImage: undefined,
    };
  }

  const admin = await createAdminClient();
  const [{ data: settings }, { data: identity }] = await Promise.all([
    admin.from("site_settings").select("site_name, meta_description, site_description, favicon_url").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("site_identity").select("site_name, favicon_url, logo_url, tagline").eq("tenant_id", tenantId).maybeSingle(),
  ]);

  const siteName = firstNonEmpty(identity?.site_name, settings?.site_name) ?? "My Site";
  let description = firstNonEmpty(settings?.meta_description, settings?.site_description, identity?.tagline);

  // Most sites never fill in a description — fall back to the homepage
  // hero's own copy, the site's actual opening line, rather than leaving
  // link previews blank or inheriting the platform's.
  if (!description) {
    const { data: homePage } = await admin
      .from("pages")
      .select("blocks")
      .eq("tenant_id", tenantId)
      .eq("slug", "home")
      .eq("status", "published")
      .maybeSingle();
    const blocks = (homePage?.blocks as { type: string; data?: unknown }[] | null) ?? [];
    const hero = blocks.find((b) => b.type === "hero");
    const heroData = hero?.data as { description?: string; subtitle?: string } | undefined;
    description = firstNonEmpty(heroData?.description, heroData?.subtitle);
  }

  const uploadedFavicon = firstNonEmpty(identity?.favicon_url, settings?.favicon_url);
  const faviconUrl = uploadedFavicon ?? autoFavicon(siteName);
  const ogImage = firstNonEmpty(identity?.logo_url, uploadedFavicon);

  return { siteName, description, faviconUrl, ogImage };
}

/** Builds the full Metadata object from a resolved tenant, including
 *  metadataBase (from the request host, so relative/data URIs resolve
 *  against the tenant's own origin) and OG/twitter cards — the same shape
 *  (site)/layout.tsx already built, now shared so every route gets the
 *  complete version instead of a partial one. */
export async function buildSiteMetadata(tenantId: string | null | undefined): Promise<Metadata> {
  const resolved = await resolveSiteMetadata(tenantId);
  const { siteName, description, faviconUrl, ogImage } = resolved;

  const reqHeaders = await headers();
  const host = reqHeaders.get("host");
  const proto = host?.startsWith("localhost") || host?.startsWith("127.") ? "http" : "https";
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined;

  return {
    metadataBase,
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    icons: { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl },
    openGraph: {
      title: siteName,
      description,
      siteName,
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: siteName,
      description,
      images: ogImage ? [ogImage] : [],
    },
  };
}
