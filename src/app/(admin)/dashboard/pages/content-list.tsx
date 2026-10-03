import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { publicUrl } from "@/lib/tenant/site-urls";
import { StatusTabs } from "./status-tabs";
import type React from "react";
import { PagesTable, PagesToolbar } from "./pages-table";

const TABS = ["all", "published", "draft", "scheduled", "trash"] as const;
type Tab = (typeof TABS)[number];

/**
 * Shared list for Pages and Posts (build once, reuse): status tabs with
 * counts, search, sort, bulk actions, homepage badge, SEO hint, and links to
 * the page on the site's real domain.
 */
export async function ContentList({
  params, types, basePath, header, empty,
}: {
  params: { status?: string; q?: string; sort?: string };
  types: string[];
  basePath: string;
  header: (count: number) => React.ReactNode;
  empty: (inTrash: boolean) => React.ReactNode;
}) {
  const TYPES = types;
  const { status, q, sort } = params;
  const tab: Tab = (TABS as readonly string[]).includes(status ?? "") ? (status as Tab) : "all";
  const search = (q ?? "").trim().replace(/[%,()]/g, "").slice(0, 80);

  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  let query = supabase
    .from("pages")
    .select("id, title, slug, type, status, created_at, updated_at, published_at, scheduled_at, deleted_at, has_draft, seo")
    .in("type", TYPES)
    .eq("tenant_id", tenantId);
  query = sort === "title" ? query.order("title") : query.order("updated_at", { ascending: false });
  if (tab === "trash") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
    if (tab !== "all") query = query.eq("status", tab);
  }
  if (search) query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);

  const [{ data: rows }, { data: all }, { data: site }] = await Promise.all([
    query,
    // Lightweight pass for the per-tab counts.
    supabase.from("pages").select("status, deleted_at").in("type", TYPES).eq("tenant_id", tenantId),
    supabase.from("tenants").select("slug, custom_domain").eq("id", tenantId).maybeSingle(),
  ]);

  const live = (all ?? []).filter((p) => !p.deleted_at);
  const counts: Record<string, number> = {
    all: live.length,
    published: live.filter((p) => p.status === "published").length,
    draft: live.filter((p) => p.status === "draft").length,
    scheduled: live.filter((p) => p.status === "scheduled").length,
    trash: (all ?? []).length - live.length,
  };

  // Home page first, then the chosen order.
  const pages = (rows ?? [])
    .map((p) => ({ ...p, has_seo_description: !!(p.seo as { description?: string } | null)?.description }))
    .sort((a, b) => (a.slug === "home" ? -1 : b.slug === "home" ? 1 : 0));
  const siteBase = site ? publicUrl(site) : "";

  return (
    <div className="p-6">
      {header(counts.all)}
      <StatusTabs basePath={basePath} active={tab} counts={counts} />
      <PagesToolbar />

      {!pages.length ? (
        search ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No results for &ldquo;{search}&rdquo;.</p>
        ) : (
          empty(tab === "trash")
        )
      ) : (
        <PagesTable pages={pages} inTrash={tab === "trash"} siteBase={siteBase} />
      )}
    </div>
  );
}
