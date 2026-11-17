import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import type { StudioHeaderData } from "@/lib/site/header-studio";
import { StudioHeaderChrome } from "./studio-header-chrome";

/**
 * The studio header for render paths outside (site)/layout.tsx: the tenant
 * homepage ((marketing)/page.tsx) and TenantPageWithChrome (/contact,
 * /pricing, /privacy, /terms, /refund, root-builder pages). Same logo and
 * name sources as the layout.
 */
export async function StudioSiteHeader({ tenantId, data }: { tenantId: string; data: StudioHeaderData }) {
  const admin = await createAdminClient();
  const [{ data: identity }, { data: settings }] = await Promise.all([
    admin.from("site_identity").select("logo_url, logo_dark_url, site_name").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
  ]);
  return (
    <StudioHeaderChrome data={data} logoUrl={(identity?.logo_url as string | null) ?? null} logoDarkUrl={(identity?.logo_dark_url as string | null) ?? null}
      siteName={(identity?.site_name as string | null) ?? (settings?.site_name as string | null) ?? ""} />
  );
}
