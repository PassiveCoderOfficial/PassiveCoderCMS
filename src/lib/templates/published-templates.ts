/**
 * The published templates shown to customers — homepage showcase, the
 * /templates page, onboarding picker and the admin template select all read
 * this, so no surface can advertise a template that doesn't exist.
 *
 * Replaces the hardcoded TEMPLATES catalog, where 49 of 55 entries described
 * templates with no backing rows: their preview 404'd and choosing one at
 * signup silently produced a blank site instead.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { dbTemplateToCatalogItem } from "@/modules/templates/to-browser-item";
import type { SiteTemplate } from "@/modules/templates/types";
import type { Template } from "@/lib/templates/templates-data";

export async function fetchPublishedTemplates(): Promise<Template[]> {
  const admin = await createAdminClient();
  const { data } = await admin
    .from("templates")
    .select("*")
    .not("owner_id", "is", null)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  return ((data ?? []) as SiteTemplate[]).map(dbTemplateToCatalogItem) as Template[];
}
