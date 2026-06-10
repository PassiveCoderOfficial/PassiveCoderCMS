import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Copy, Eye, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { PageActions } from "./page-actions";

export default async function PagesListPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, type, status, created_at, updated_at, published_at")
    .eq("type", "page")
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground text-sm mt-1">{pages?.length ?? 0} pages total</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/pages/new"><Plus className="h-4 w-4 mr-2" /> New Page</Link>
        </Button>
      </div>

      {!pages?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No pages yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first page to get started</p>
          <Button asChild><Link href="/dashboard/pages/new"><Plus className="h-4 w-4 mr-2" /> Create Page</Link></Button>
        </div>
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
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/pages/${page.id}`} className="font-medium hover:text-primary text-sm">
                        {page.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/{page.slug}</code>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDateTime(page.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PageActions pageId={page.id} pageSlug={page.slug} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "success" | "warning" | "outline"> = {
    published: "success", draft: "outline", scheduled: "warning", archived: "secondary" as never,
  };
  return <Badge variant={variants[status] ?? "outline"} className="capitalize text-xs">{status}</Badge>;
}
