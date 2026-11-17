import React from "react";
import { publishDueForSite } from "@/lib/posts/scheduled";
import { headers } from "next/headers";
import type { BlogBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import { rootTenantId } from "@/lib/site/root-builder";
import { getPanelTimeZone } from "@/lib/time/panel-tz-server";
import { BlogPostsView, type OlderPostRow } from "./blog-posts-view";

export async function BlogBlock({ block }: { block: BlogBlockProps }) {
  const { data } = block;
  const { displayCount } = data;

  const supabase = await createClient();
  // The root domain carries no x-tenant-id: its blog lists the root site's
  // own posts (it used to list every site's published posts).
  const headerTenant = (await headers()).get("x-tenant-id");
  const tenantId = headerTenant ?? (await rootTenantId().catch(() => null));
  // The root site's dates follow the platform's panel time zone; client sites keep theirs.
  const tz = headerTenant ? undefined : await getPanelTimeZone();
  await publishDueForSite(tenantId);
  let query = supabase
    .from("pages")
    .select("id, title, slug, excerpt, featured_image, published_at, created_at")
    .eq("type", "post")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(displayCount);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data: posts } = await query;

  // The blog index itself (/blog) also links every older post as a plain
  // list, so no post is reachable only through the sitemap.
  let older: OlderPostRow[] | null = null;
  const pathname = ((await headers()).get("x-pathname") ?? "").replace(/\/$/, "");
  if (tenantId && /(^|\/)blog$/.test(pathname) && (posts?.length ?? 0) >= displayCount) {
    const { data: rest } = await supabase
      .from("pages")
      .select("id, title, slug, published_at")
      .eq("type", "post")
      .eq("status", "published")
      .is("deleted_at", null)
      .eq("tenant_id", tenantId)
      .order("published_at", { ascending: false })
      .range(displayCount, displayCount + 499);
    older = rest as OlderPostRow[] | null;
  }

  return <BlogPostsView block={block} posts={posts} tz={tz} older={older} />;
}
