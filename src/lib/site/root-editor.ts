import type { SupabaseClient } from "@supabase/supabase-js";
import { ROOT_TENANT_SLUG } from "@/lib/flags";

export interface RootPageRow { id: string; title: string; slug: string; status: string; updated_at: string }

/**
 * The site whose builder pages passivecoder.com serves (the live_root_slug
 * pin, else the root tenant), with its pages, plus the older root pages kept
 * without a site (tenant_id and template_id null, the web Root Pages list).
 * Used by the mobile app's Root pages and Homepage screens, which edit these
 * pages in the normal page editor. The site is returned even when the
 * builder-pages flag is off, so its pages stay editable before going live.
 */
export async function rootEditorTarget(admin: SupabaseClient) {
  const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
  const slug = (hs?.live_root_slug as string | null) || ROOT_TENANT_SLUG;
  const { data: site } = await admin.from("tenants").select("id, name, slug").eq("slug", slug).maybeSingle();
  const cols = "id, title, slug, status, updated_at";
  const [{ data: pages }, { data: legacy }] = await Promise.all([
    site
      ? admin.from("pages").select(cols).eq("tenant_id", site.id).is("deleted_at", null).in("type", ["page", "landing"]).order("updated_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    admin.from("pages").select(cols).is("tenant_id", null).is("template_id", null).is("deleted_at", null).order("updated_at", { ascending: false }),
  ]);
  return {
    live: !!hs?.use_builder_pages,
    site: site ? { id: site.id as string, name: site.name as string, slug: site.slug as string } : null,
    pages: (pages ?? []) as RootPageRow[],
    legacy: (legacy ?? []) as RootPageRow[],
  };
}
