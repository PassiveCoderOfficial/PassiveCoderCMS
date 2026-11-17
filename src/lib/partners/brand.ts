/** Open edition: no partner program, so no white-label brand. Sites show their own brand only. */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Brand {
  partnerId: string;
  name: string;
  logoUrl: string | null;
  color: string | null;
  supportEmail: string | null;
  supportWhatsapp: string | null;
  dashboardDomain: string | null;
}

export async function whiteLabelStatus(_admin: SupabaseClient, _p: unknown) {
  return { active: false, sites: 0, feePaid: false, feeUntil: null as string | null };
}

export async function brandForTenant(_admin: SupabaseClient, _tenantId: string | null | undefined): Promise<Brand | null> {
  return null;
}

export async function brandForHost(_admin: SupabaseClient, _host: string): Promise<Brand | null> {
  return null;
}
