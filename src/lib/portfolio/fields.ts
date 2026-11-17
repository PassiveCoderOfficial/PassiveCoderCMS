import type { GalleryBlockProps } from "@/types/cms";

import { splitPortfolioTags } from "./tags";

// Import-free tag helpers live in ./tags so the mobile app shares the same code.
export * from "./tags";

export function formatPortfolioDate(date: string | undefined): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export type PortfolioRow = {
  id: string;
  title: string;
  description?: string | null;
  image_url: string;
  tags?: string[] | null;
  created_at?: string | null;
};

type GalleryImage = GalleryBlockProps["data"]["images"][number];

/** Portfolio rows as gallery images, latest first (item date, else upload date). */
export function portfolioRowsToImages(rows: PortfolioRow[]): GalleryImage[] {
  return rows
    .filter((r) => r.image_url)
    .map((r) => {
      const { fields } = splitPortfolioTags(r.tags);
      const when = fields.date || String(r.created_at ?? "").slice(0, 10);
      return { r, fields, when };
    })
    .sort((a, b) => b.when.localeCompare(a.when) || String(b.r.created_at ?? "").localeCompare(String(a.r.created_at ?? "")))
    .map(({ r, fields }) => ({
      id: r.id,
      url: r.image_url,
      alt: r.title,
      caption: r.title,
      category: fields.country,
      note: [fields.kind, formatPortfolioDate(fields.date)].filter(Boolean).join(" · ") || undefined,
    }));
}
