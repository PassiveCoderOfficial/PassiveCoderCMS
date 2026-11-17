import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { apiUserId } from "@/lib/auth/api-caller";
import { siteAccess } from "@/lib/mcp/auth";
import { publishDueForSite } from "@/lib/posts/scheduled";

/**
 * Blog posts live at /blog/<slug> on every site (root and tenants); pages
 * keep /<slug>. The post row's own slug stays bare ("my-post"): the /blog/
 * prefix is only part of the address. The old /<slug> address of a post
 * answers 301 to the new one.
 */
export const POST_PREFIX = "blog";

/** Public path of a page or post row. */
export function contentPath(row: { slug: string; type?: string | null }): string {
  if (row.type === "post") return `/${POST_PREFIX}/${row.slug}`;
  return row.slug === "home" ? "/" : `/${row.slug}`;
}

/** The post slug a /blog/<slug> address names, or null. */
export function postSlugFromPath(slug: string): string | null {
  const m = /^blog\/([^/]+)$/i.exec(slug);
  return m ? m[1] : null;
}

/** May the signed-in visitor see this site's unpublished posts? Any member
 *  (viewer included), active staff or super admin. Never throws. */
export const canPreviewSite = cache(async (tenantId: string): Promise<boolean> => {
  try {
    const userId = await apiUserId();
    if (!userId) return false;
    return (await siteAccess(await createAdminClient(), userId, tenantId)) !== null;
  } catch {
    return false;
  }
});

export type PostLoad = { post: Record<string, unknown>; preview: boolean };

/**
 * The post at /blog/<slug>: the published row, or for a signed-in member a
 * draft/scheduled one in preview. Anonymous visitors only ever get
 * published posts. Once per request (metadata and page share it).
 */
export const loadPostForRequest = cache(async (tenantId: string, postSlug: string): Promise<PostLoad | null> => {
  await publishDueForSite(tenantId);
  const admin = await createAdminClient();
  const { data: rows } = await admin.from("pages").select("*").eq("tenant_id", tenantId).eq("type", "post")
    .eq("slug", postSlug).is("deleted_at", null).in("status", ["published", "scheduled", "draft"]).limit(2);
  const list = (rows ?? []) as Record<string, unknown>[];
  const live = list.find((r) => r.status === "published");
  if (live) return { post: live, preview: false };
  const pending = list[0];
  if (!pending) return null;
  return (await canPreviewSite(tenantId)) ? { post: pending, preview: true } : null;
});

/** True when this bare slug is a published post (its old address). */
export const isPublishedPostSlug = cache(async (tenantId: string, slug: string): Promise<boolean> => {
  if (slug.includes("/")) return false;
  const admin = await createAdminClient();
  const { data } = await admin.from("pages").select("id").eq("tenant_id", tenantId).eq("type", "post")
    .eq("slug", slug).eq("status", "published").is("deleted_at", null).limit(1).maybeSingle();
  return !!data;
});
