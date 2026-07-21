"use client";

import React from "react";
import type { ItemBoxBlockProps, ItemBoxItem } from "@/types/cms";
import { ItemBoxByData, mapItemBoxRows, applyItemOrder, type ItemBoxRow } from "./item-box-block";

type GroupWithItems = { id: string; [itemsKey: string]: unknown };

const GROUP_ENDPOINT: Record<string, string> = {
  services: "/api/services",
  features: "/api/features",
  portfolio: "/api/portfolio",
  testimonials: "/api/testimonials",
};
const GROUP_ITEMS_KEY: Record<string, string> = {
  services: "service_items",
  features: "feature_items",
  portfolio: "portfolio_items",
  testimonials: "testimonials",
};

// Page-builder canvas equivalent of the server ItemBoxBlock — resolves items
// via the same list APIs the dashboard sections already use, since the
// canvas is a client component tree and can't hit Supabase directly.
export function ItemBoxBlockClient({ block }: { block: ItemBoxBlockProps }) {
  const { data } = block;
  const [resolvedItems, setResolvedItems] = React.useState<ItemBoxItem[] | null>(null);

  React.useEffect(() => {
    const source = data.source;
    const source_group_id = data.source_group_id;

    if (source === "inline") return;

    if ((source === "services" || source === "features" || source === "portfolio" || source === "testimonials") && source_group_id) {
      let cancelled = false;
      fetch(GROUP_ENDPOINT[source])
        .then((r) => r.json())
        .then((groups: GroupWithItems[]) => {
          if (cancelled) return;
          const group = Array.isArray(groups) ? groups.find((g) => g.id === source_group_id) : null;
          const rows = (group?.[GROUP_ITEMS_KEY[source]] as ItemBoxRow[] | undefined) ?? [];
          const sourceType = source === "services" ? "service" : source === "features" ? "feature" : source === "portfolio" ? "portfolio" : undefined;
          if (source === "testimonials") {
            setResolvedItems((rows as unknown as { id: string; name: string; content: string; avatar: string | null }[]).map((r) => ({
              id: r.id,
              title: r.name,
              description: r.content,
              image: r.avatar ? { type: "url" as const, value: r.avatar } : { type: "none" as const },
            })));
          } else {
            setResolvedItems(mapItemBoxRows(rows, sourceType ?? null));
          }
        })
        .catch(() => !cancelled && setResolvedItems([]));
      return () => { cancelled = true; };
    }

    if (source === "marketplace_catalog") {
      let cancelled = false;
      fetch("/api/marketplace/catalog")
        .then((r) => r.json())
        .then((rows: { id: string; name: string; description?: string | null; icon?: string | null; image_url?: string | null }[]) => {
          if (cancelled) return;
          setResolvedItems(mapItemBoxRows(
            (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, title: r.name, description: r.description ?? null, icon: r.icon ?? null, icon_type: "lucide", image_url: r.image_url ?? null, link: "/book" })),
            null,
          ));
        })
        .catch(() => !cancelled && setResolvedItems([]));
      return () => { cancelled = true; };
    }

    if (source === "blog" || source === "pages") {
      let cancelled = false;
      fetch(`/api/pages?type=${source === "blog" ? "post" : "page"}`)
        .then((r) => r.json())
        .then((rows: { id: string; title: string; excerpt: string | null; featured_image: string | null; slug: string }[]) => {
          if (cancelled) return;
          setResolvedItems(mapItemBoxRows(
            (Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, title: r.title, description: r.excerpt, image_url: r.featured_image, slug: r.slug })),
            source === "blog" ? "post" : "page",
          ));
        })
        .catch(() => !cancelled && setResolvedItems([]));
      return () => { cancelled = true; };
    }
  }, [data.source, data.source_group_id]);

  const resolved = data.source !== "inline"
    ? { ...data, items: applyItemOrder(resolvedItems ?? [], data.source_item_ids) }
    : data;

  return <ItemBoxByData data={resolved} />;
}
