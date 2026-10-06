import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import type { SiteContact } from "@/components/site/site-contact-context";

/** Primary contact_details row for a tenant, fed to SiteContactProvider. */
export const getSiteContact = cache(async (tenantId: string | null): Promise<SiteContact | null> => {
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const { data } = await admin
    .from("contact_details")
    .select("phone, whatsapp, email, address")
    .eq("tenant_id", tenantId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle<SiteContact>();
  return data ?? null;
});
