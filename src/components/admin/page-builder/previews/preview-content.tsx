"use client";

import React from "react";
import type { Block, BlogBlockProps } from "@/types/cms";
import { BlockRenderer } from "../canvas/block-renderer";
import { BlogPostsView, type BlogPostRow } from "@/components/blocks/blog/blog-posts-view";
import { applyHiddenElements, getBlockBackground, getBlockWrapperStyle, getContainerClass, withHeroOverlay } from "@/modules/page-builder/block-utils";
import { cn } from "@/lib/utils";

/**
 * What a preview draws: the canvas's BlockRenderer, except for blocks whose
 * canvas render is a "live data" placeholder that looks the same in every
 * layout. Blog Posts is drawn with its real markup (BlogPostsView, the same
 * component the live site uses) over three sample posts, inside the same
 * section wrapper BlockRenderer gives every block.
 */
export function PreviewContent({ block }: { block: Block }) {
  if (block.type === "blog") return <BlogSample block={block as BlogBlockProps} />;
  return <BlockRenderer block={withSampleVideo(block)} isPreview />;
}

/**
 * A Video block with no video yet draws the same "Enter a video URL" box in
 * every layout, so its Layout tiles would all look alike. The preview gives
 * it a sample address instead: the player is swapped for a still placeholder
 * before it joins the page (block-preview `quiet`), so nothing loads. Only
 * the preview changes; the canvas and the live site draw the block as saved.
 */
const SAMPLE_VIDEO_URL = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
function withSampleVideo(block: Block): Block {
  if (block.type !== "video") return block;
  const d = block.data as { url?: string; videos?: unknown[] };
  if (d.url || d.videos?.length) return block;
  return { ...block, data: { ...block.data, url: SAMPLE_VIDEO_URL, videoType: "youtube" } } as Block;
}

const day = 86_400_000;
const SAMPLE_POSTS: BlogPostRow[] = [
  { id: "sample-1", slug: "sample-1", title: "How we plan every job so it finishes on time", excerpt: "The checks, updates and small habits that keep a project on schedule from the first visit to handover.", featured_image: null, published_at: new Date(Date.now() - 3 * day).toISOString() },
  { id: "sample-2", slug: "sample-2", title: "Five questions to ask before you hire anyone", excerpt: "A short list that saves money and stress, whoever you choose in the end.", featured_image: null, published_at: new Date(Date.now() - 12 * day).toISOString() },
  { id: "sample-3", slug: "sample-3", title: "What is new this season", excerpt: "New services, longer opening hours and a few changes our regular customers asked for.", featured_image: null, published_at: new Date(Date.now() - 26 * day).toISOString() },
];

function BlogSample({ block: raw }: { block: BlogBlockProps }) {
  const block = applyHiddenElements(raw) as BlogBlockProps;
  const { style: bgStyle, className: bgClassName } = getBlockBackground(withHeroOverlay(block));
  const { style: wrapStyle, className: wrapClassName } = getBlockWrapperStyle(block);
  const count = Math.max(1, Math.min(SAMPLE_POSTS.length, Number(block.data.displayCount) || SAMPLE_POSTS.length));
  // The viewer's own zone: these are sample dates, never shown as raw UTC.
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
  return (
    <div style={{ ...bgStyle, ...wrapStyle }} className={cn("w-full", bgClassName, wrapClassName)}>
      <div className={cn("w-full", getContainerClass(block.width))}>
        <BlogPostsView block={block} posts={SAMPLE_POSTS.slice(0, count)} tz={tz} />
      </div>
    </div>
  );
}
