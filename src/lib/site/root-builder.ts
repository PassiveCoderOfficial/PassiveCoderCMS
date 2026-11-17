import { createAdminClient } from "@/lib/supabase/server";
import { ROOT_DOMAIN, ROOT_TENANT_SLUG } from "@/lib/flags";

/**
 * Root site on builder blocks: when homepage_settings.use_builder_pages is on
 * and the root tenant has a published page for `slug`, the root domain renders
 * that page (TenantPageWithChrome) instead of the hard-coded marketing route.
 * Returns the root tenant id to render with, or null to keep the fallback.
 */
export async function rootBuilderTenantFor(slug: string): Promise<string | null> {
  const admin = await createAdminClient();
  const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
  if (!hs?.use_builder_pages) return null;
  // live_root_slug pins the live domain to a snapshot tenant while the root
  // tenant (beta.passivecoder.com) is being redesigned. Null = root tenant.
  const rootSlug = (hs.live_root_slug as string | null) || ROOT_TENANT_SLUG;
  const { data: t } = await admin.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
  if (!t?.id) return null;
  const { data: page } = await admin.from("pages").select("id").eq("tenant_id", t.id).eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  return page ? (t.id as string) : null;
}

/** The root tenant's id (live_root_slug snapshot or the beta root), or null when the builder root site is off. */
export async function rootTenantId(): Promise<string | null> {
  const admin = await createAdminClient();
  const { data: hs } = await admin.from("homepage_settings").select("use_builder_pages, live_root_slug").limit(1).maybeSingle();
  if (!hs?.use_builder_pages) return null;
  const rootSlug = (hs.live_root_slug as string | null) || ROOT_TENANT_SLUG;
  const { data: t } = await admin.from("tenants").select("id").eq("slug", rootSlug).maybeSingle();
  return (t?.id as string | undefined) ?? null;
}

function isRootHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  const root = ROOT_DOMAIN.toLowerCase();
  const hn = h.split(":")[0], rn = root.split(":")[0];
  return h === root || hn === rn || hn === `www.${rn}`;
}

/**
 * Tenant for a public form API call: the site's x-tenant-id, or on the root
 * domain (which gets no tenant header on /api routes) the root tenant whose
 * builder pages the root site renders. Without the fallback every enquiry
 * sent from the root site was dropped.
 */
export async function publicFormTenantId(headers: Headers): Promise<string | null> {
  const id = headers.get("x-tenant-id");
  if (id) return id;
  return isRootHost(headers.get("host")) ? rootTenantId().catch(() => null) : null;
}
