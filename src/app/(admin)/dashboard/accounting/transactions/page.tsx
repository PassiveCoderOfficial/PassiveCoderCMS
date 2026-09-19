import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { getSiteCurrency } from "@/lib/currency/currency-server";
import { formatMoney } from "@/lib/currency/currencies";
import { TransactionsHeader, TransactionsTableHead, NoTransactionsMessage, TxTypeLabel } from "../accounting-header";

export default async function TransactionsPage() {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const cur = await getSiteCurrency(tenantId);
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const typeColor = { income: "success", expense: "destructive", donation: "info", transfer: "secondary", refund: "warning" } as Record<string, string>;

  return (
    <div className="p-6">
      <TransactionsHeader />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <TransactionsTableHead />
            </thead>
            <tbody className="divide-y">
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{tx.description}</p>
                    {tx.message && <p className="text-xs text-muted-foreground italic">"{tx.message}"</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={(typeColor[tx.type] ?? "outline") as never} className="text-xs"><TxTypeLabel type={tx.type} /></Badge>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{tx.customer_name}</td>
                  <td className={`px-4 py-3 text-right font-semibold text-sm ${tx.type === "expense" || tx.type === "refund" ? "text-red-600" : "text-green-600"}`}>
                    {tx.type === "expense" || tx.type === "refund" ? "-" : "+"}{formatMoney(Number(tx.amount), cur)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs hidden md:table-cell">
                    {tx.is_public ? "✅" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!transactions?.length && (
            <NoTransactionsMessage variant="list" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
