import { createAdminClient } from "@/lib/supabase/server";
import { Receipt, DollarSign, TrendingUp, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatUsd } from "@/lib/billing/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Billing — Super Admin" };

const UPCOMING_DAYS = 14;

export default async function BillingPage() {
  const supabase = await createAdminClient();
  const now = new Date();
  const soon = new Date(now.getTime() + UPCOMING_DAYS * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: overdueSubs },
    { data: upcomingSubs },
    { data: monthPayments },
    { data: allPayments },
    { data: activeCount },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id,plan_id,balance_due_cents,next_payment_due,current_period_end,tenants(name,slug,tenant_number)")
      .gt("balance_due_cents", 0)
      .lt("next_payment_due", now.toISOString().split("T")[0])
      .order("next_payment_due", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("id,plan_id,balance_due_cents,next_payment_due,current_period_end,tenants(name,slug,tenant_number)")
      .gt("balance_due_cents", 0)
      .gte("next_payment_due", now.toISOString().split("T")[0])
      .lte("next_payment_due", soon.toISOString().split("T")[0])
      .order("next_payment_due", { ascending: true }),
    supabase.from("subscription_payments").select("amount_cents").gte("paid_at", monthStart),
    supabase.from("subscription_payments").select("amount_cents"),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const collectedThisMonth = (monthPayments ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0);
  const collectedAllTime = (allPayments ?? []).reduce((s, p) => s + (p.amount_cents ?? 0), 0);

  const { data: outstandingSubs } = await supabase
    .from("subscriptions")
    .select("balance_due_cents")
    .gt("balance_due_cents", 0);
  const totalOutstanding = (outstandingSubs ?? []).reduce((s, p) => s + (p.balance_due_cents ?? 0), 0);

  type Row = {
    id: string; plan_id: string; balance_due_cents: number | null;
    next_payment_due: string | null; current_period_end: string | null;
    tenants: { name: string; slug: string; tenant_number: number | null } | { name: string; slug: string; tenant_number: number | null }[] | null;
  };
  const tenantOf = (r: Row) => (Array.isArray(r.tenants) ? r.tenants[0] : r.tenants);

  const cards = [
    { label: "Collected This Month", value: formatUsd(collectedThisMonth), icon: TrendingUp, color: "text-green-500" },
    { label: "Collected All-Time", value: formatUsd(collectedAllTime), icon: DollarSign, color: "text-indigo-500" },
    { label: "Outstanding (Total)", value: formatUsd(totalOutstanding), icon: AlertTriangle, color: "text-amber-500" },
    { label: "Active Subscriptions", value: String(activeCount ?? 0), icon: CreditCard, color: "text-blue-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Receipt className="w-6 h-6 text-green-500" /> Billing
      </h1>

      {/* Accounting summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`w-4 h-4 ${c.color}`} />
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
              <p className="text-xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue ({(overdueSubs ?? []).length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BillingTable rows={(overdueSubs as Row[]) ?? []} tenantOf={tenantOf} empty="Nothing overdue." tone="red" />
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" /> Upcoming (next {UPCOMING_DAYS} days) — {(upcomingSubs ?? []).length}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BillingTable rows={(upcomingSubs as Row[]) ?? []} tenantOf={tenantOf} empty="No upcoming payments due." tone="amber" />
        </CardContent>
      </Card>
    </div>
  );
}

function BillingTable<T extends {
  id: string; plan_id: string; balance_due_cents: number | null;
  next_payment_due: string | null; current_period_end: string | null;
}>({ rows, tenantOf, empty, tone }: {
  rows: T[];
  tenantOf: (r: T) => { name: string; slug: string; tenant_number: number | null } | null | undefined;
  empty: string;
  tone: "red" | "amber";
}) {
  if (!rows.length) {
    return <div className="px-5 py-8 text-center text-muted-foreground text-sm">{empty}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[420px]">
        <thead>
          <tr className="border-b">
            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Site</th>
            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium hidden sm:table-cell">Plan</th>
            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Due Date</th>
            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Balance Due</th>
            <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const tenant = tenantOf(r);
            const due = r.next_payment_due ?? r.current_period_end;
            return (
              <tr key={r.id} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{tenant?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{tenant?.tenant_number ? `T${tenant.tenant_number} · ` : ""}{tenant?.slug}</div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground capitalize hidden sm:table-cell">{r.plan_id}</td>
                <td className={`px-4 py-2.5 text-xs font-medium ${tone === "red" ? "text-red-500" : "text-amber-500"}`}>
                  {due ? new Date(due).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-2.5 font-medium">{formatUsd(r.balance_due_cents ?? 0)}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/super-admin/subscriptions/${r.id}/edit`} className="text-xs text-primary hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
