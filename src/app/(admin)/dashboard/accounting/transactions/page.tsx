import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function TransactionsPage() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const typeColor = { income: "success", expense: "destructive", donation: "info", transfer: "secondary", refund: "warning" } as Record<string, string>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button asChild size="sm"><Link href="/dashboard/accounting/transactions/new"><Plus className="h-4 w-4 mr-2" /> Add Transaction</Link></Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">From/To</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium hidden md:table-cell">Public</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{tx.description}</p>
                    {tx.message && <p className="text-xs text-muted-foreground italic">"{tx.message}"</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={(typeColor[tx.type] ?? "outline") as never} className="capitalize text-xs">{tx.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm hidden md:table-cell">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{tx.customer_name}</td>
                  <td className={`px-4 py-3 text-right font-semibold text-sm ${tx.type === "expense" || tx.type === "refund" ? "text-red-600" : "text-green-600"}`}>
                    {tx.type === "expense" || tx.type === "refund" ? "-" : "+"}{formatCurrency(Number(tx.amount), tx.currency)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs hidden md:table-cell">
                    {tx.is_public ? "✅" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!transactions?.length && (
            <p className="text-center text-muted-foreground text-sm py-12">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
