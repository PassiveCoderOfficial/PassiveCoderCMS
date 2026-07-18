import type { ServicesBlockProps } from "@/types/cms";
import { createAdminClient } from "@/lib/supabase/server";
import { ServicesByVariant, mapRows } from "./services-block";

// Server (live site) — resolves group items directly from Supabase, used by
// page-renderer.tsx. Kept in its own file (not services-block.tsx) because
// this imports next/headers transitively via createAdminClient — bundling it
// into a file that services-block-client.tsx also imports would pull
// server-only code into the client bundle and break the build.
export async function ServicesBlock({ block }: { block: ServicesBlockProps }) {
  let data = block.data;
  if (data.source === "group" && data.source_group_id) {
    const admin = await createAdminClient();
    const { data: rows } = await admin
      .from("service_items")
      .select("id, title, description, icon, icon_type, image_url, link, link_label")
      .eq("group_id", data.source_group_id)
      .order("sort_order");
    data = { ...data, items: mapRows(rows ?? []) };
  }
  return <ServicesByVariant data={data} variant={block.templateVariant} />;
}
