import React from "react";
import { headers } from "next/headers";
import type { AccountingFeedBlockProps } from "@/types/cms";
import { createClient } from "@/lib/supabase/server";
import { Heart, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export async function AccountingFeedBlock({ block }: { block: AccountingFeedBlockProps }) {
  const { data } = block;
  const { title, displayCount, transactionType, showAmount, showDate, showMessage, layout } = data;

  const supabase = await createClient();
  const tenantId = (await headers()).get("x-tenant-id");
  let query = supabase
    .from("transactions")
    .select("id, type, amount, currency, customer_name, message, date, description")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(displayCount);
  if (tenantId) query = query.eq("tenant_id", tenantId);

  if (transactionType && transactionType !== "all") {
    query = query.eq("type", transactionType);
  }

  const { data: transactions } = await query;

  if (!transactions?.length) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8 text-muted-foreground">
        {title && <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>}
        <p className="text-sm">No transactions to display yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {title && <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>}

      {layout === "ticker" ? (
        <div className="overflow-hidden bg-muted/30 rounded-xl p-4">
          <div className="flex gap-6 overflow-x-auto">
            {transactions.map((tx) => (
              <div key={tx.id} className="shrink-0 flex items-center gap-2 text-sm whitespace-nowrap">
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                <span className="font-medium">{tx.customer_name ?? "Anonymous"}</span>
                {showAmount && <span className="text-green-600 font-semibold">{formatCurrency(tx.amount, tx.currency)}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : layout === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Heart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.customer_name ?? "Anonymous"}</p>
                    {showDate && <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>}
                  </div>
                </div>
                {showAmount && (
                  <span className="text-green-600 font-bold text-sm">{formatCurrency(tx.amount, tx.currency)}</span>
                )}
              </div>
              {showMessage && tx.message && (
                <p className="mt-3 text-sm text-muted-foreground italic">"{tx.message}"</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{tx.customer_name ?? "Anonymous"}</p>
                  {showAmount && (
                    <span className="text-green-600 font-semibold text-sm shrink-0">
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                  )}
                </div>
                {showMessage && tx.message && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic truncate">"{tx.message}"</p>
                )}
                {showDate && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tx.date)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
