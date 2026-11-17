import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import type { SiteContact } from "@/components/site/site-contact-context";
import { visibleSocials } from "@/lib/social-links";
import { creditPolicyFor } from "@/lib/site/footer-credit";

/** Primary contact_details row for a tenant, fed to SiteContactProvider. */
export const getSiteContact = cache(async (tenantId: string | null): Promise<SiteContact | null> => {
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const [{ data }, { data: settings }, socials, credit] = await Promise.all([
    admin
      .from("contact_details")
      .select("phone, whatsapp, email, address")
      .eq("tenant_id", tenantId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle<SiteContact>(),
    admin.from("site_settings").select("product_defaults").eq("tenant_id", tenantId).maybeSingle(),
    // Own query so a database without migration 165 (no social_links column
    // yet) only loses the social icons, never the contact details.
    admin.from("tenant_business_profiles").select("social_links").eq("tenant_id", tenantId).maybeSingle()
      .then(({ data: row, error }) => (error ? [] : visibleSocials((row as { social_links?: unknown } | null)?.social_links)), () => []),
    creditPolicyFor(tenantId),
  ]);
  const noPrice = ((settings?.product_defaults ?? {}) as { noPrice?: SiteContact["noPrice"] }).noPrice ?? null;
  if (!data && !noPrice && !socials.length && !credit.editable && !credit.partner) return null;
  return { ...(data ?? {}), noPrice, socials, creditEditable: credit.editable, creditBase: credit.base };
});
