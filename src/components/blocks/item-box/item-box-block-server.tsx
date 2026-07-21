import type { ItemBoxBlockProps } from "@/types/cms";
import { createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { ItemBoxByData, mapItemBoxRows, applyItemOrder, type ItemBoxRow } from "./item-box-block";

// Server (live site) — resolves items from whichever source table, used by
// page-renderer.tsx. Kept separate from item-box-block.tsx (see
// services-block-server.tsx for why: this imports next/headers transitively
// via createAdminClient, and bundling that into a file the client canvas
// also imports would break the client build).
export async function ItemBoxBlock({ block }: { block: ItemBoxBlockProps }) {
  let data = block.data;
  const { source, source_group_id } = data;

  if (source === "inline" || (!source_group_id && source !== "blog" && source !== "pages" && source !== "marketplace_catalog")) {
    return <ItemBoxByData data={data} />;
  }

  const admin = await createAdminClient();

  if (source === "services" && source_group_id) {
    const { data: rows } = await admin
      .from("service_items")
      .select("id, title, description, icon, icon_type, image_url, link, link_label")
      .eq("group_id", source_group_id)
      .order("sort_order");
    data = { ...data, items: mapItemBoxRows((rows ?? []) as ItemBoxRow[], "service") };
  } else if (source === "features" && source_group_id) {
    const { data: rows } = await admin
      .from("feature_items")
      .select("id, title, description, icon, icon_type, image_url, link, link_label")
      .eq("group_id", source_group_id)
      .order("sort_order");
    data = { ...data, items: mapItemBoxRows((rows ?? []) as ItemBoxRow[], "feature") };
  } else if (source === "portfolio" && source_group_id) {
    const { data: rows } = await admin
      .from("portfolio_items")
      .select("id, title, description, image_url, link")
      .eq("group_id", source_group_id)
      .order("sort_order");
    data = { ...data, items: mapItemBoxRows((rows ?? []) as ItemBoxRow[], "portfolio") };
  } else if (source === "testimonials" && source_group_id) {
    const { data: rows } = await admin
      .from("testimonials")
      .select("id, name, content, avatar")
      .eq("group_id", source_group_id)
      .eq("published", true)
      .order("sort_order");
    data = {
      ...data,
      items: ((rows ?? []) as { id: string; name: string; content: string; avatar: string | null }[]).map((r) => ({
        id: r.id,
        title: r.name,
        description: r.content,
        image: r.avatar ? { type: "url" as const, value: r.avatar } : { type: "none" as const },
      })),
    };
  } else if (source === "blog") {
    const tenantId = (await headers()).get("x-tenant-id") ?? "";
    const { data: rows } = await admin
      .from("pages")
      .select("id, title, excerpt, featured_image, slug")
      .eq("tenant_id", tenantId)
      .eq("type", "post")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(12);
    data = {
      ...data,
      items: mapItemBoxRows(
        ((rows ?? []) as { id: string; title: string; excerpt: string | null; featured_image: string | null; slug: string }[])
          .map((r) => ({ id: r.id, title: r.title, description: r.excerpt, image_url: r.featured_image, slug: r.slug })),
        "post",
      ),
    };
  } else if (source === "marketplace_catalog") {
    // No source_group_id needed — categories belong to the tenant directly,
    // not a "group". Links to /book so picking a category jumps straight
    // into the booking flow (see marketplace-booking-block.tsx).
    const tenantId = (await headers()).get("x-tenant-id") ?? "";
    const { data: rows } = await admin
      .from("service_categories")
      .select("id, name, slug, description, icon, image_url")
      .eq("tenant_id", tenantId)
      .order("sort_order");
    data = {
      ...data,
      items: mapItemBoxRows(
        ((rows ?? []) as { id: string; name: string; slug: string | null; description: string | null; icon: string | null; image_url: string | null }[])
          .map((r) => ({ id: r.id, title: r.name, description: r.description, icon: r.icon, icon_type: "lucide" as const, image_url: r.image_url, link: `/book?category=${r.slug ?? r.id}` })),
        null,
      ),
    };
  } else if (source === "pages") {
    const tenantId = (await headers()).get("x-tenant-id") ?? "";
    const { data: rows } = await admin
      .from("pages")
      .select("id, title, excerpt, featured_image, slug")
      .eq("tenant_id", tenantId)
      .eq("type", "page")
      .eq("status", "published")
      .order("order_index")
      .limit(20);
    data = {
      ...data,
      items: mapItemBoxRows(
        ((rows ?? []) as { id: string; title: string; excerpt: string | null; featured_image: string | null; slug: string }[])
          .map((r) => ({ id: r.id, title: r.title, description: r.excerpt, image_url: r.featured_image, slug: r.slug })),
        "page",
      ),
    };
  }

  data = { ...data, items: applyItemOrder(data.items, data.source_item_ids) };

  return <ItemBoxByData data={data} />;
}
