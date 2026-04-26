import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function PostsPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("pages")
    .select("*")
    .eq("type", "post")
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">{posts?.length ?? 0} posts total</p>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/posts/new"><Plus className="h-4 w-4 mr-2" /> New Post</Link>
        </Button>
      </div>

      {!posts?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first blog post</p>
            <Button asChild size="sm"><Link href="/dashboard/posts/new">New Post</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/posts/${post.id}`} className="font-medium hover:text-primary text-sm block truncate">
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    /{post.slug} · {formatDate(post.created_at)}
                  </p>
                </div>
                <Badge variant={post.status === "published" ? "default" : "outline"} className="ml-4 text-xs shrink-0">
                  {post.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
