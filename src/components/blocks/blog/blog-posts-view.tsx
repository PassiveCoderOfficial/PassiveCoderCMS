import React from "react";
import type { BlogBlockProps } from "@/types/cms";
import Link from "next/link";
import Image from "@/components/ui/smart-image";
import { Calendar, ArrowRight } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type BlogPostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at?: string | null;
};

/**
 * The Blog Posts block's markup, given the posts already loaded (blog-block.tsx
 * fetches them). Kept free of server-only imports so it can be rendered in
 * tests; every class and text node matches what the block always printed.
 */
export type OlderPostRow = { id: string; title: string; slug: string; published_at: string | null };

export function BlogPostsView({ block, posts, tz, older }: { block: BlogBlockProps; posts: BlogPostRow[] | null; tz?: string; older?: OlderPostRow[] | null }) {
  const { data } = block;
  const { title, subtitle, layout, columns, showExcerpt, showDate, showReadMore, viewAllUrl, viewAllLabel } = data;
  // One text node with its trailing space, exactly as the old "Read More " literal.
  const readMore = `${data.readMoreLabel || "Read More"} `;

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
        <div className="text-center py-12 text-muted-foreground">{data.emptyText || "No posts published yet."}</div>
      ) : layout === "list" ? (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="flex gap-6 items-start border rounded-xl p-4">
              {post.featured_image && (
                <div className="relative w-32 h-24 shrink-0 rounded-lg overflow-hidden">
                  <Image src={post.featured_image} alt={post.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                </h3>
                {showDate && post.published_at && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(post.published_at, tz)}
                  </p>
                )}
                {showExcerpt && post.excerpt && <p className="text-sm text-muted-foreground mt-2">{truncate(post.excerpt, 120)}</p>}
                {showReadMore && (
                  <Link href={`/blog/${post.slug}`} className="text-xs text-primary font-medium mt-2 inline-flex items-center gap-1 hover:underline">
                    {readMore}<ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={cn("grid grid-cols-1 gap-6", colMap)}>
          {posts.map((post) => (
            <article key={post.id} className="group flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
              {post.featured_image ? (
                <div className="relative aspect-video overflow-hidden">
                  <Image src={post.featured_image} alt={post.title} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/20" />
              )}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-base leading-snug mb-2">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary">{post.title}</Link>
                </h3>
                {showExcerpt && post.excerpt && (
                  <p className="text-sm text-muted-foreground flex-1">{truncate(post.excerpt, 100)}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  {showDate && post.published_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(post.published_at, tz)}
                    </span>
                  )}
                  {showReadMore && (
                    <Link href={`/blog/${post.slug}`} className="text-xs text-primary font-medium inline-flex items-center gap-1 hover:underline ml-auto">
                      {readMore}<ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!!older?.length && (
        <nav aria-label="Older articles" className="mt-12 border-t pt-8">
          <h3 className="text-lg font-semibold">Older articles</h3>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2 md:grid-cols-2">
            {older.map((post) => (
              <li key={post.id} className="text-sm leading-relaxed">
                <Link href={`/blog/${post.slug}`} className="hover:text-primary hover:underline">{post.title}</Link>
                {showDate && post.published_at && <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">{formatDate(post.published_at, tz)}</span>}
              </li>
            ))}
          </ul>
        </nav>
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
