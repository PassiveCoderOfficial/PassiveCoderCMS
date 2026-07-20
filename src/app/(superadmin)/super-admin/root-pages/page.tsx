import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Globe, Plus, Pencil, Eye, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Root Pages — Super Admin" };

export default async function RootPagesPage() {
  const supabase = await createAdminClient();
  const { data: pages } = await supabase
    .from("pages")
    .select("id,title,slug,status,updated_at")
    .is("tenant_id", null)
    .order("updated_at", { ascending: false });

  function statusVariant(status: string) {
    if (status === "published") return "success" as const;
    if (status === "scheduled") return "warning" as const;
    return "secondary" as const;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-500" /> Root Site Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pages served on <span className="text-primary font-mono">passivecoder.com</span>. Slug <span className="font-mono text-amber-500">home</span> replaces the static homepage.
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/root-pages/new">
            <Plus className="w-4 h-4" /> New Page
          </Link>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Title</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Updated</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(pages ?? []).map(page => (
                  <tr key={page.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{page.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden sm:table-cell">/{page.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(page.status)}>{page.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/super-admin/root-pages/${page.id}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <a
                          href={`/${page.slug === "home" ? "" : page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-green-500 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {!pages?.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      No root pages yet. Create a page with slug <span className="font-mono text-amber-500">home</span> to replace the static homepage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-indigo-500/5 border-indigo-500/30">
        <CardContent className="p-4 text-sm text-indigo-600 dark:text-indigo-300 space-y-2">
          <p className="font-semibold flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> How it works</p>
          <ul className="text-xs text-indigo-600/80 dark:text-indigo-400 space-y-1">
            <li>• Slug <span className="font-mono">home</span> → replaces static homepage at passivecoder.com</li>
            <li>• Slug <span className="font-mono">about</span> → served at passivecoder.com/about</li>
            <li>• Status must be <span className="font-mono">published</span> to go live</li>
            <li>• Static homepage is shown as fallback when no published home page exists</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
