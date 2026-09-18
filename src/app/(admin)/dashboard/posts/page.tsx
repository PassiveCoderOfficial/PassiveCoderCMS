import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { Card, CardContent } from "@/components/ui/card";
import { PageRow } from "../pages/page-row";
import { StatusTabs } from "../pages/status-tabs";
import { PagesTableHead } from "../pages/pages-header";
import { PostsHeader, PostsEmptyState } from "./posts-header";

const TABS = ["all", "published", "draft", "scheduled", "trash"] as const;
type Tab = (typeof TABS)[number];

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab: Tab = (TABS as readonly string[]).includes(status ?? "") ? (status as Tab) : "all";

  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  let query = supabase
    .from("pages")
    .select("id, title, slug, type, status, created_at, updated_at, published_at, scheduled_at, deleted_at")
    .eq("type", "post")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  if (tab === "trash") {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
    if (tab !== "all") query = query.eq("status", tab);
  }

  const { data: posts } = await query;

  return (
    <div className="p-6">
      <PostsHeader count={posts?.length ?? 0} />

      <StatusTabs basePath="/dashboard/posts" active={tab} />

      {!posts?.length ? (
        <Card>
          <CardContent>
            <PostsEmptyState inTrash={tab === "trash"} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[300px]">
              <thead>
                <PagesTableHead />
              </thead>
              <tbody className="divide-y">
                {posts.map((post) => (
                  <PageRow key={post.id} page={post} inTrash={tab === "trash"} />
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
