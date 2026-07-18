import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { requireModule } from "@/lib/modules/resolve-modules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight } from "lucide-react";
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { formatMoney } from "@/lib/currency/currencies";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AccountingDashboard() {
  const tenantId = await getCurrentTenantId();
  if (!(await requireModule(tenantId, "accounting"))) redirect("/dashboard");
  const supabase = await createClient();
  const cur = await getSiteCurrency(tenantId);
  const fmt = (n: number) => formatMoney(n, cur);
  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().setDate(1)).toISOString().split("T")[0];

  const [
    { data: monthlyIncome },
    { data: monthlyExpenses },
    { data: recentTx },
    { data: todayTx },
  ] = await Promise.all([
    supabase.from("transactions").select("amount").eq("tenant_id", tenantId).eq("type", "income").eq("status", "completed").gte("date", monthStart),
    supabase.from("transactions").select("amount").eq("tenant_id", tenantId).eq("type", "expense").eq("status", "completed").gte("date", monthStart),
    supabase.from("transactions").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(10),
    supabase.from("transactions").select("amount, type").eq("tenant_id", tenantId).eq("date", today).eq("status", "completed"),
  ]);

  const totalIncome = monthlyIncome?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalExpenses = monthlyExpenses?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const profit = totalIncome - totalExpenses;

  const todayIncome = todayTx?.filter((t) => t.type !== "expense").reduce((s, t) => s + Number(t.amount), 0) ?? 0;

  const stats = [
    { label: "Monthly Income", value: fmt(totalIncome), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Monthly Expenses", value: fmt(totalExpenses), icon: TrendingDown, color: "text-red-600", bg: "bg-red-50" },
    { label: "Net Profit", value: fmt(profit), icon: DollarSign, color: profit >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
    { label: "Today's Revenue", value: fmt(todayIncome), icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounting</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/dashboard/accounting/transactions">All Transactions</Link></Button>
          <Button asChild size="sm"><Link href="/dashboard/accounting/transactions/new">Add Transaction</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-3`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/dashboard/accounting/transactions">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!recentTx?.length ? (
            <p className="text-sm text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="divide-y">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.type} · {tx.date} {tx.customer_name ? `· ${tx.customer_name}` : ""}</p>
                    {tx.message && <p className="text-xs text-muted-foreground italic mt-0.5">&quot;{tx.message}&quot;</p>}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}{fmt(Number(tx.amount))}
                    </p>
                    <p className={`text-xs ${tx.status === "completed" ? "text-green-500" : "text-yellow-500"}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
