import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { DefaultsForm } from "./defaults-form";
import type { ProductExtended } from "@/lib/ecommerce/product-extended";

export const metadata = { title: "Product Defaults" };

export default async function ProductDefaultsPage() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();
  const { data } = tenantId
    ? await admin.from("site_settings").select("product_defaults").eq("tenant_id", tenantId).maybeSingle()
    : { data: null };
  return (
    <div className="p-6 max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Product Defaults</h1>
        <p className="text-sm text-muted-foreground">Sections shown on every product page. A product that fills in its own section (Products → edit → Extended) shows that instead.</p>
      </div>
      {tenantId ? <DefaultsForm tenantId={tenantId} initial={(data?.product_defaults ?? {}) as ProductExtended} /> : <p className="text-sm">Open a site first.</p>}
    </div>
  );
}
