import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { PriceRequestsClient, type PriceRequest } from "./price-requests-client";

export const metadata = { title: "Price Requests" };

export default async function PriceRequestsPage() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();
  const [{ data }, { data: products }] = tenantId
    ? await Promise.all([
        admin.from("price_requests").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(300),
        admin.from("products").select("id, slug, price").eq("tenant_id", tenantId),
      ])
    : [{ data: [] }, { data: [] }];
  return (
    <div className="p-6 max-w-5xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Price Requests</h1>
        <p className="text-sm text-muted-foreground">Shoppers asking for the price of products that have none. Reply, and set the price on the product in one go.</p>
      </div>
      <PriceRequestsClient initial={(data ?? []) as PriceRequest[]} products={(products ?? []) as { id: string; slug: string; price: number | null }[]} />
    </div>
  );
}
