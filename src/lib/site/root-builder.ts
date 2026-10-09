import { createAdminClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN } from "@/lib/flags";

/**
 * Root site on builder blocks: when homepage_settings.use_builder_pages is on
 * and the root tenant has a published page for `slug`, the root domain renders
 * that page (TenantPageWithChrome) instead of the hard-coded marketing route.
 * Returns the root tenant id to render with, or null to keep the fallback.
 */
export async function rootBuilderTenantFor(slug: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages").limit(1).maybeSingle();
  if (!hs?.use_builder_pages) return null;
  const rootSlug = ROOT_DOMAIN.split(".")[0];
  const { data: t } = await admin.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
  if (!t?.id) return null;
  const { data: page } = await admin.from("pages").select("id").eq("tenant_id", t.id).eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  return page ? (t.id as string) : null;
}
