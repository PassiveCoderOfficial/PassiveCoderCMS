import type { TestimonialsBlockProps } from "@/types/cms";

export type TestimonialRow = { id: string; name: string; role: string | null; company: string | null; avatar: string | null; avatar_url: string | null; image_url: string | null; title: string | null; content: string; rating: number | null; product_name: string | null; product_url: string | null; verified: boolean | null };

/** Testimonials table rows -> block items. */
export function mapTestimonialRows(rows: TestimonialRow[]): TestimonialsBlockProps["data"]["items"] {
  return rows.map((r) => ({
    id: r.id, name: r.name, role: r.role ?? undefined, company: r.company ?? undefined,
    avatar: r.image_url || r.avatar_url || r.avatar || undefined, title: r.title ?? undefined,
    content: r.content, rating: r.rating ?? 5, product: r.product_name ?? undefined,
    productUrl: r.product_url ?? undefined, verified: r.verified ?? false,
  }));
}

export const TESTIMONIAL_ROW_SELECT = "id, name, role, company, avatar, avatar_url, image_url, title, content, rating, product_name, product_url, verified";

