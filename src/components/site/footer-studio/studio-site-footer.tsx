import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { getSiteContact } from "@/lib/site-contact";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import type { StudioFooterData } from "@/lib/site/footer-studio";
import { StudioFooterChrome } from "./studio-footer-chrome";

/**
 * The studio footer for render paths outside (site)/layout.tsx: the tenant
 * homepage ((marketing)/page.tsx), TenantPageWithChrome (/contact, /pricing,
 * /privacy, /terms, /refund, root-builder pages) and the 404 page. Same logo
 * and name sources as the layout. It brings its own SiteContactProvider
 * (getSiteContact is React-cached), so contact details, socials and the
 * plan's credit rule are right even where no provider wraps the page (404).
 */
export async function StudioSiteFooter({ tenantId, data }: { tenantId: string; data: StudioFooterData }) {
  const admin = await createAdminClient();
  const [{ data: identity }, { data: settings }, contact] = await Promise.all([
    admin.from("site_identity").select("logo_url, logo_dark_url, site_name").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("site_settings").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
    getSiteContact(tenantId).catch(() => null),
  ]);
  return (
    <SiteContactProvider value={contact}>
      <StudioFooterChrome data={data} logoUrl={(identity?.logo_url as string | null) ?? null} logoDarkUrl={(identity?.logo_dark_url as string | null) ?? null}
        siteName={(identity?.site_name as string | null) ?? (settings?.site_name as string | null) ?? ""} />
    </SiteContactProvider>
  );
}
