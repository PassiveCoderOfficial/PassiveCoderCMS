import type { TestimonialsBlockProps } from "@/types/cms";
import { createAdminClient } from "@/lib/supabase/server";
import { TestimonialsBlock as TestimonialsBlockClient } from "./testimonials-block";
import { mapTestimonialRows, TESTIMONIAL_ROW_SELECT, type TestimonialRow } from "./testimonial-rows";

/** Live site: resolves a "from group" testimonials block on the server. */
export async function TestimonialsBlock({ block }: { block: TestimonialsBlockProps }) {
  if (block.data.source === "group" && block.data.source_group_id) {
    const admin = await createAdminClient();
    const { data } = await admin.from("testimonials").select(TESTIMONIAL_ROW_SELECT)
      .eq("group_id", block.data.source_group_id).eq("published", true).order("sort_order").limit(block.data.limit ?? 12);
    const items = mapTestimonialRows((data ?? []) as TestimonialRow[]);
    let _stats: { avg: number; count: number } | undefined;
    if (block.data.reviewForm?.enabled) {
      const { data: all } = await admin.from("testimonials").select("rating").eq("group_id", block.data.source_group_id).eq("published", true);
      const rated = (all ?? []).filter((r) => r.rating);
      _stats = { count: (all ?? []).length, avg: rated.length ? rated.reduce((a, r) => a + (r.rating as number), 0) / rated.length : 0 };
    }
    return <TestimonialsBlockClient block={{ ...block, data: { ...block.data, items, _stats, _resolved: true } as TestimonialsBlockProps["data"] }} />;
  }
  return <TestimonialsBlockClient block={block} />;
}
