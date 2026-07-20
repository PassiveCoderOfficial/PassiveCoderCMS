import { createAdminClient } from "@/lib/supabase/server";
import { CreditCard, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Subscriptions — Super Admin" };

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createAdminClient();

  let query = supabase
    .from("subscriptions")
    .select("id,plan_id,status,billing_cycle,payment_provider,custom_amount_cents,amount_cents,currency,next_payment_due,current_period_end,created_at,tenant_id,tenants(name,slug,tenant_number)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data: subs } = await query;

  function statusVariant(s: string) {
    if (s === "active") return "success" as const;
    if (s === "onboarded") return "info" as const;
    if (s === "pending") return "warning" as const;
    if (s === "past_due" || s === "suspended") return "destructive" as const;
    return "secondary" as const;
  }

  const STATUSES = ["", "onboarded", "pending", "active", "past_due", "suspended", "cancelled", "expired"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-500" /> Subscriptions
        </h1>
        <Button asChild>
          <Link href="/super-admin/subscriptions/new">
            <Plus className="w-4 h-4" /> Add Subscription
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <Button key={s} variant={(status ?? "") === s ? "default" : "outline"} size="sm" asChild>
            <Link href={s ? `/super-admin/subscriptions?status=${s}` : "/super-admin/subscriptions"}>
              {s || "All"}
            </Link>
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Site</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Plan</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden xl:table-cell">Provider</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">Period End</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium hidden xl:table-cell">Created</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {(subs ?? []).map((sub) => {
                const tenantRaw = sub.tenants;
                const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as { name: string; slug: string; tenant_number: number | null } | null;
                const displayAmt = sub.custom_amount_cents ?? sub.amount_cents;
                const cycleLabel = sub.billing_cycle === "monthly" ? "/mo" : sub.billing_cycle === "lifetime" ? " lifetime" : "/yr";
                return (
                  <tr key={sub.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{tenant?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{tenant?.tenant_number ? `T${tenant.tenant_number} · ` : ""}{tenant?.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize hidden lg:table-cell">{sub.plan_id}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize hidden xl:table-cell">{sub.payment_provider ?? "—"}</td>
                    <td className="px-4 py-3">
                      {displayAmt ? `$${(displayAmt / 100).toFixed(0)}${cycleLabel}` : "—"}
                      {sub.custom_amount_cents && <span className="text-xs text-amber-500 ml-1">custom</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {sub.next_payment_due ? new Date(sub.next_payment_due).toLocaleDateString() :
                       sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden xl:table-cell">{new Date(sub.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/super-admin/subscriptions/${sub.id}/edit`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!subs?.length && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No subscriptions found</td></tr>
              )}
            </tbody>
          </table></div>
        </CardContent>
      </Card>
    </div>
  );
}
