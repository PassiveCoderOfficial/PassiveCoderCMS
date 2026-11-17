import { createAdminClient, createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GatewayToggle } from "./gateway-toggle";
import { GatewaySettings } from "./gateway-settings";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { PaymentsHeader } from "./payments-header";
import { StorePaymentMethods } from "./store-payment-methods";

export default async function PaymentsPage() {
  const tenantId = await getCurrentTenantId();
  const admin = await createAdminClient();
  const [{ data: gateways }, { data: rows }] = await Promise.all([
    admin.from("payment_gateways").select("slug, name, description, supported_currencies").eq("is_enabled", true).order("name"),
    tenantId
      ? admin.from("tenant_payment_methods").select("gateway_slug, enabled, settings, sort_order").eq("tenant_id", tenantId).order("sort_order")
      : Promise.resolve({ data: [] }),
  ]);

  // Platform-wide gateway rows (API keys, availability) stay a super-admin job.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: sa } = user ? await admin.from("super_admins").select("user_id").eq("user_id", user.id).maybeSingle() : { data: null };
  const { data: platform } = sa ? await admin.from("payment_gateways").select("*").order("name") : { data: null };

  return (
    <div className="p-6 max-w-4xl">
      <PaymentsHeader />
      {tenantId ? (
        <StorePaymentMethods tenantId={tenantId} gateways={gateways ?? []} initialRows={(rows ?? []) as never} />
      ) : (
        <p className="text-sm text-muted-foreground">Open a site first.</p>
      )}
      {platform && (
        <div className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Platform gateways (super admin)</h2>
          {platform.map((g) => (
            <Card key={g.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{g.name}</CardTitle>
                  <GatewayToggle gatewayId={g.id} isEnabled={g.is_enabled} />
                </div>
              </CardHeader>
              {g.is_enabled && <CardContent className="pt-0"><GatewaySettings gateway={g} /></CardContent>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
