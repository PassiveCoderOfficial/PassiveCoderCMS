import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import type { GalleryBlockProps } from "@/types/cms";
import { portfolioRowsToImages, type PortfolioRow } from "./fields";

/**
 * Live site: a gallery set to "Portfolio group" gets that group's items,
 * latest first. Adding an item in Dashboard > Portfolio is a content write,
 * which expires the site's public cache, so the page shows it on the next view.
 */
export async function resolvePortfolioGallery(block: GalleryBlockProps): Promise<GalleryBlockProps> {
  const { source, portfolioGroupId } = block.data;
  if (source !== "portfolio") return block;
  // Never fall back to the block's own (sample) images: an unset or broken
  // source shows the empty state instead.
  if (!portfolioGroupId) return { ...block, data: { ...block.data, images: [] } };
  const tenantId = (await headers()).get("x-tenant-id");
  const admin = await createAdminClient();
  let q = admin
    .from("portfolio_items")
    .select("id, title, description, image_url, tags, created_at")
    .eq("group_id", portfolioGroupId);
  if (tenantId && tenantId !== "root") q = q.eq("tenant_id", tenantId);
  const { data: rows } = await q;
  return { ...block, data: { ...block.data, images: portfolioRowsToImages((rows ?? []) as PortfolioRow[]) } };
}
