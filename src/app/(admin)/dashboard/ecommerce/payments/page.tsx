import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { GatewayToggle } from "./gateway-toggle";
import { GatewaySettings } from "./gateway-settings";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: gateways } = await supabase
    .from("payment_gateways")
    .select("*")
    .order("name");

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Payment Gateways</h1>
        <p className="text-muted-foreground text-sm mt-1">Enable and configure your payment gateways</p>
      </div>

      <div className="space-y-4">
        {gateways?.map((gateway) => (
          <Card key={gateway.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">
                    {gatewayEmoji(gateway.slug)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{gateway.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{gateway.description}</p>
                  </div>
                </div>
                <GatewayToggle gatewayId={gateway.id} isEnabled={gateway.is_enabled} />
              </div>
            </CardHeader>
            {gateway.is_enabled && (
              <CardContent className="pt-0">
                <GatewaySettings gateway={gateway} />
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function gatewayEmoji(slug: string): string {
  const map: Record<string, string> = {
    manual: "🏦", stripe: "💳", paypal: "🅿️", sslcommerz: "🔒", shurjopay: "💰", bkash: "📱", nagad: "📲",
  };
  return map[slug] ?? "💳";
}
