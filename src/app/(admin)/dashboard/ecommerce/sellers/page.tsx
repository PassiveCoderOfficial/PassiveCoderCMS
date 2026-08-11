import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import SellersClient from "./sellers-client";

export const metadata = { title: "Sellers — Dashboard" };

export default async function SellersPage() {
  const tid = await getCurrentTenantId();
  const supabase = await createAdminClient();

  const { data: sellers } = await supabase
    .from("vendors")
    .select(
      "id, name, slug, contact_name, phone, email, status, commission_rate, logo, description, bkash_number, payout_hold_days, pickup_address, pickup_area, trade_license, created_at",
    )
    .eq("tenant_id", tid)
    .contains("capabilities", ["ecommerce"])
    .order("created_at", { ascending: false });

  return <SellersClient initialSellers={sellers ?? []} />;
}
