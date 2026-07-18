"use client";

import React from "react";
import type { ServicesBlockProps, ServiceItem } from "@/types/cms";
import { ServicesByVariant, mapRows, type ServiceItemRow } from "./services-block";

// Page-builder canvas equivalent of the server ServicesBlock — resolves
// group items via /api/services (client component tree, can't hit Supabase
// directly the way page-renderer.tsx does).
export function ServicesBlockClient({ block }: { block: ServicesBlockProps }) {
  const { data } = block;
  const [groupItems, setGroupItems] = React.useState<ServiceItem[] | null>(null);

  React.useEffect(() => {
    if (data.source !== "group" || !data.source_group_id) return;
    let cancelled = false;
    fetch("/api/services")
      .then((r) => r.json())
      .then((groups: { id: string; service_items: ServiceItemRow[] }[]) => {
        if (cancelled) return;
        const group = Array.isArray(groups) ? groups.find((g) => g.id === data.source_group_id) : null;
        setGroupItems(mapRows(group?.service_items ?? []));
      })
      .catch(() => !cancelled && setGroupItems([]));
    return () => { cancelled = true; };
  }, [data.source, data.source_group_id]);

  const resolved = data.source === "group" && data.source_group_id
    ? { ...data, items: groupItems ?? [] }
    : data;

  return <ServicesByVariant data={resolved} variant={block.templateVariant} />;
}
