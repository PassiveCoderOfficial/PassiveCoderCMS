import { createAdminClient } from "@/lib/supabase/server";
import type { HeaderCategory } from "@/components/marketplace-ecom/marketplace-header";
import type { SiteContact } from "@/components/marketplace-ecom/marketplace-footer";

export interface MarketplaceChrome {
  categories: HeaderCategory[];
  contact: SiteContact | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  siteName: string;
}

/**
 * Everything the marketplace header and footer need, in one round trip.
 *
 * Returns null when the tenant isn't running an ecommerce marketplace, which
 * is what callers key the marketplace chrome off — presence of approved
 * sellers rather than a hardcoded slug, so any future marketplace tenant is
 * picked up automatically.
 *
 * Contact details come from the tenant's own contact_details row. They were
 * briefly hardcoded here during the first build, which put the platform
 * owner's personal email and phone on a client's public storefront.
 */
export async function getMarketplaceChrome(
  tenantId: string | null,
): Promise<MarketplaceChrome | null> {
  if (!tenantId) return null;

  const admin = await createAdminClient();
  const { count } = await admin
    .from("vendors")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved")
    .contains("capabilities", ["ecommerce"]);
  if ((count ?? 0) === 0) return null;

  const [{ data: cats }, { data: contact }, { data: identity }] = await Promise.all([
    admin
      .from("categories")
      .select("id, name, slug, image_url")
      .eq("tenant_id", tenantId)
      .eq("type", "product")
      .order("order_index"),
    admin
      .from("contact_details")
      .select("phone, email, address")
      .eq("tenant_id", tenantId)
      .order("is_primary", { ascending: false })
      .order("sort_order")
      .limit(1)
      .maybeSingle(),
    admin
      .from("site_identity")
      .select("site_name, logo_url, logo_dark_url")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  return {
    categories: cats ?? [],
    contact: contact ?? null,
    logoUrl: identity?.logo_url ?? null,
    logoDarkUrl: identity?.logo_dark_url ?? identity?.logo_url ?? null,
    siteName: identity?.site_name ?? "Marketplace",
  };
}
