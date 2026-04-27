import React from "react";
import type { BlogBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, ArrowRight } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export async function BlogBlock({ block }: { block: BlogBlockProps }) {
  const { data } = block;
  const { title, subtitle, displayCount, layout, columns, showExcerpt, showDate, showAuthor, showCategory, showReadMore, categoryFilter, viewAllUrl, viewAllLabel } = data;

  const supabase = await createClient();
  let query = supabase
    .from("pages")
    .select("id, title, slug, excerpt, featured_image, published_at, created_at")
    .eq("type", "post")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(displayCount);

  const { data: posts } = await query;

  const colMap = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns] ?? "md:grid-cols-3";

  return (
    <div className="max-w-7xl mx-auto">
      {(title || subtitle) && (
        <div className="flex items-end justify-between mb-10">
          <div>
            {subtitle && <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">{subtitle}</p>}
            {title && <h2 className="text-3xl font-bold">{title}</h2>}
          </div>
          {viewAllUrl && (
            <Link href={viewAllUrl} className="flex items-center gap-1 text-sm text-primary hover:underline font-medium">
              {viewAllLabel ?? "View All"} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {!posts?.length ? (
        <div className="text-center py-12 text-muted-foreground">No posts published yet.</div>
      ) : layout === "list" ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="flex gap-6 items-start border rounded-xl p-4">
              {post.featured_image && (
                <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden">
                  <Image src={post.featured_image} alt={post.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  <Link href={`/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                </h3>
                {showDate && post.published_at && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(post.published_at)}
                  </p>
                )}
                {showExcerpt && post.excerpt && <p className="text-sm text-muted-foreground mt-2">{truncate(post.excerpt, 120)}</p>}
                {showReadMore && (
                  <Link href={`/${post.slug}`} className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 hover:underline">
                    Read More <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap)}>
          {posts.map((post) => (
            <article key={post.id} className="group flex flex-col rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
              {post.featured_image ? (
                <div className="relative aspect-video overflow-hidden">
                  <Image src={post.featured_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-base leading-snug mb-2">
                  <Link href={`/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                </h3>
                {showExcerpt && post.excerpt && (
                  <p className="text-sm text-muted-foreground flex-1">{truncate(post.excerpt, 100)}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {showDate && post.published_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(post.published_at)}
                    </span>
                  )}
                  {showReadMore && (
                    <Link href={`/${post.slug}`} className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline ml-auto">
                      Read More <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {viewAllUrl && (
        <div className="mt-8 text-center md:hidden">
          <Link href={viewAllUrl} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            {viewAllLabel ?? "View All"} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
