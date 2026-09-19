import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { requireModule } from "@/lib/modules/resolve-modules";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { formatMoney } from "@/lib/currency/currencies";
import { AccountingDashHeader, AccountingStatCards, AccountingRecentTxHeader, NoTransactionsMessage, TxTypeLabel } from "./accounting-header";

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

  return (
    <div className="p-6 space-y-6">
      <AccountingDashHeader />

      <AccountingStatCards
        values={[fmt(totalIncome), fmt(totalExpenses), fmt(profit), fmt(todayIncome)]}
        profitPositive={profit >= 0}
      />

      <Card>
        <CardHeader className="pb-3">
          <AccountingRecentTxHeader />
        </CardHeader>
        <CardContent className="p-0">
          {!recentTx?.length ? (
            <NoTransactionsMessage variant="dashboard" />
          ) : (
            <div className="divide-y">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground"><TxTypeLabel type={tx.type} /> · {tx.date} {tx.customer_name ? `· ${tx.customer_name}` : ""}</p>
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
