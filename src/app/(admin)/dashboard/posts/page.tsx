import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { PageRow } from "../pages/page-row";
import { StatusTabs } from "../pages/status-tabs";

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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts?.length ?? 0} posts</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/posts/new"><Plus className="h-4 w-4 mr-2" /> New Post</Link>
        </Button>
      </div>

      <StatusTabs basePath="/dashboard/posts" active={tab} />

      {!posts?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">{tab === "trash" ? "Trash is empty" : "No posts yet"}</p>
            {tab !== "trash" && (
              <>
                <p className="text-sm text-muted-foreground mb-4">Create your first blog post</p>
                <Button asChild size="sm"><Link href="/dashboard/posts/new">New Post</Link></Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Title</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Slug</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
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
